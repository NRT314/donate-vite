// backend/oidc.js
require('dotenv').config();

// ВОЗВРАЩАЕМ bodyParser - он необходим для /wallet-callback
const bodyParser = require('koa-bodyparser'); 
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

let Provider;
try {
  const oidcPkg = require('oidc-provider');
  Provider = oidcPkg.Provider || oidcPkg.default || oidcPkg;
  if (!Provider) throw new Error('Cannot locate Provider constructor');
} catch (err)
  console.error('Failed to load oidc-provider:', err);
  throw err;
}

const ISSUER = process.env.OIDC_ISSUER ? process.env.OIDC_ISSUER.replace(/\/$/, '') : undefined;

if (!ISSUER) {
  console.error('FATAL: OIDC_ISSUER environment variable is not set or is empty.');
  process.exit(1);
}

const configuration = {
  adapter: RedisAdapter,
  clients: [
    {
      client_id: 'discourse_client',
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${process.env.DISCOURSE_URL.replace(/\/$/, '')}/auth/oidc/callback`],
      grant_types: ['authorization_code'],
      response_types: ['code'],
    },
  ],
  async findAccount(ctx, sub) {
    const accountId = sub.toLowerCase();
    return {
      accountId,
      async claims() {
        return { sub: accountId, email: `${accountId}@wallet.newrussia.online`, email_verified: true, preferred_username: `user_${accountId.slice(2, 8)}`, name: `User ${accountId.slice(0, 6)}...${accountId.slice(-4)}` };
      },
    };
  },
  interactions: {
    url(ctx, interaction) {
      return `https://newrussia.online/discourse-auth?uid=${interaction.uid}`;
    },
  },
  cookies: {
    keys: [process.env.OIDC_COOKIE_SECRET],
    short: { signed: true, httpOnly: true, sameSite: 'none', secure: true, path: '/' },
    long: { signed: true, httpOnly: true, sameSite: 'none', secure: true, path: '/' },
  },
  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name'],
  },
  features: {
    devInteractions: { enabled: false },
    revocation: { enabled: true },
    introspection: { enabled: true },
  },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

// Middleware
oidc.app.use(cors({ origin: 'https://newrussia.online', credentials: true }));

// ИЗМЕНЕНИЕ: Создаем "умный" middleware, который запускает bodyParser только для /wallet-callback
const conditionalBodyParser = bodyParser({ enableTypes: ['json', 'form'] });
oidc.app.use(async (ctx, next) => {
  // oidc-provider "отрезает" префикс /oidc, поэтому мы проверяем только сам путь
  if (ctx.path === '/wallet-callback') {
    // Если это наш кастомный эндпоинт, используем bodyParser
    await conditionalBodyParser(ctx, next);
  } else {
    // Для всех остальных путей (включая /token), пропускаем запрос дальше без изменений
    await next();
  }
});

// Кастомный эндпоинт для верификации кошелька
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    try {
      // ИСПРАВЛЕНИЕ: Читаем тело из ctx.request.body, которое создает bodyParser
      const { uid, walletAddress, signature } = ctx.request.body || {};
      
      if (!uid || !walletAddress || !signature) {
        ctx.throw(400, 'Missing required parameters');
      }
      
      const details = await oidc.interactionDetails(ctx.req, ctx.res);
      if (details.uid !== uid) {
        ctx.throw(400, 'UID mismatch or session not found.');
      }
      
      const message = `Sign this message to login to the forum: ${uid}`;
      const isVerified = await verifyWallet(walletAddress, signature, message);
      if (!isVerified) {
        ctx.throw(401, 'Wallet signature verification failed.');
      }
      
      const accountId = walletAddress.toLowerCase();
      const result = { login: { accountId } };
      
      const grant = new oidc.Grant({ accountId, clientId: details.params.client_id });
      grant.addOIDCScope('openid email profile');
      result.consent = { grantId: await grant.save() };
      
      await oidc.interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
      return;

    } catch (err) {
      console.error('Error in /wallet-callback:', err);
      ctx.status = err.statusCode || 500;
      ctx.body = { error: 'Authentication failed', details: err.message };
    }
  } else {
    await next();
  }
});

module.exports = oidc;