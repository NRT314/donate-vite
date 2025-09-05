// backend/oidc.js
require('dotenv').config();

console.log(`[DEBUG] OIDC_ISSUER from env is: >>>${process.env.OIDC_ISSUER}<<<`);

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

let Provider;
try {
  const oidcPkg = require('oidc-provider');
  Provider = oidcPkg.Provider || oidcPkg.default || oidcPkg;
  if (!Provider) throw new Error('Cannot locate Provider constructor in oidc-provider package');
} catch (err) {
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
  // ... (остальная конфигурация, как и была: findAccount, interactions, cookies, и т.д.)
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
      return `${process.env.FRONTEND_URL.replace(/\/$/, '')}/discourse-auth?uid=${interaction.uid}`;
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

// ############### НАЧАЛО ДИАГНОСТИЧЕСКОГО КОДА ###############
oidc.app.use(async (ctx, next) => {
  // логируем входящие запросы к /auth и /token для отладки
  try {
    if (ctx.path === '/token' && ctx.method === 'POST') {
      console.log('[OIDC-DEBUG] Incoming token request');
      console.log('[OIDC-DEBUG] headers:', JSON.stringify(ctx.headers));
      const auth = ctx.headers.authorization;
      if (auth && auth.startsWith('Basic ')) {
        try {
          const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
          console.log('[OIDC-DEBUG] Authorization (decoded):', decoded);
        } catch (e) {
          console.log('[OIDC-DEBUG] Authorization decode error:', e && e.message);
        }
      }
      try {
        console.log('[OIDC-DEBUG] body:', JSON.stringify(ctx.request.body));
      } catch (e) {
        console.log('[OIDC-DEBUG] body: <could not stringify>');
      }
    }

    if (ctx.path === '/auth' && ctx.method === 'GET') {
      console.log('[OIDC-DEBUG] Authorization request query:', JSON.stringify(ctx.query));
    }
  } catch (e) {
    console.error('[OIDC-DEBUG] logging middleware error:', e);
  }
  await next();
});
// ############### КОНЕЦ ДИАГНОСТИЧЕСКОГО КОДА ###############

// Koa middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Кастомный эндпоинт для верификации кошелька (остается без изменений)
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    try {
      const { uid, walletAddress, signature } = ctx.request.body || {};
      console.log(`[OIDC] /wallet-callback POST received. uid: ${uid}`);
      console.log(`[OIDC] Request cookies: ${ctx.headers.cookie || 'none'}`);
      if (!uid || !walletAddress || !signature) { ctx.throw(400, 'Missing required parameters'); }
      const details = await oidc.interactionDetails(ctx.req, ctx.res);
      if (details.uid !== uid) { ctx.throw(400, 'UID mismatch or session not found. Please try logging in again.'); }
      const message = `Sign this message to login to the forum: ${uid}`;
      const isVerified = await verifyWallet(walletAddress, signature, message);
      if (!isVerified) { ctx.throw(401, 'Wallet signature verification failed.'); }
      const accountId = walletAddress.toLowerCase();
      const result = { login: { accountId } };
      const grant = new oidc.Grant({ accountId, clientId: details.params.client_id });
      grant.addOIDCScope('openid email profile');
      const grantId = await grant.save();
      result.consent = { grantId };
      console.log(`[OIDC] Created Grant for account ${accountId}, grantId: ${grantId}`);
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