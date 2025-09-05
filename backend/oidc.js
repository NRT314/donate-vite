// backend/oidc.js
require('dotenv').config();

// 👇 ДИАГНОСТИЧЕСКАЯ СТРОКА: Проверяем, что переменная окружения загрузилась
console.log(`[DEBUG] OIDC_ISSUER from env is: >>>${process.env.OIDC_ISSUER}<<<`);

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

// Поддерживаем разные способы импорта oidc-provider
let Provider;
try {
  const oidcPkg = require('oidc-provider');
  Provider = oidcPkg.Provider || oidcPkg.default || oidcPkg;
  if (!Provider) throw new Error('Cannot locate Provider constructor in oidc-provider package');
} catch (err) {
  console.error('Failed to load oidc-provider:', err);
  throw err;
}

// ✍️ ИСПРАВЛЕННЫЙ КОММЕНТАРИЙ:
// ISSUER - это полный URL, по которому доступен ваш OIDC провайдер.
// Он ДОЛЖЕН совпадать с тем, что вы указываете в переменных окружения.
// Например: https://donate-vite.onrender.com/oidc
const ISSUER = process.env.OIDC_ISSUER ? process.env.OIDC_ISSUER.replace(/\/$/, '') : undefined;

// Проверка, что ISSUER был успешно прочитан из переменных окружения
if (!ISSUER) {
  console.error('FATAL: OIDC_ISSUER environment variable is not set or is empty.');
  process.exit(1); // Завершаем работу, если критическая переменная отсутствует
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
    // Приводим адрес к нижнему регистру для консистентности.
    const accountId = sub.toLowerCase();

    return {
      accountId,
      async claims() {
        return {
          sub: accountId,
          email: `${accountId}@wallet.newrussia.online`,
          email_verified: true,
          preferred_username: `user_${accountId.slice(2, 8)}`,
          name: `User ${accountId.slice(0, 6)}...${accountId.slice(-4)}`,
        };
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
    short: {
      signed: true,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    },
    long: {
      signed: true,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    },
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

// Koa middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Кастомный эндпоинт для верификации кошелька
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    try {
      const { uid, walletAddress, signature } = ctx.request.body || {};

      console.log(`[OIDC] /wallet-callback POST received. uid: ${uid}`);
      console.log(`[OIDC] Request cookies: ${ctx.headers.cookie || 'none'}`);

      if (!uid || !walletAddress || !signature) {
        ctx.throw(400, 'Missing required parameters');
      }

      const details = await oidc.interactionDetails(ctx.req, ctx.res);

      if (details.uid !== uid) {
        console.warn(`[OIDC] UID mismatch: interaction uid=${details.uid}, posted uid=${uid}. Possible session issue.`);
        ctx.throw(400, 'UID mismatch or session not found. Please try logging in again.');
      }
      
      const message = `Sign this message to login to the forum: ${uid}`;
      const isVerified = await verifyWallet(walletAddress, signature, message);
      if (!isVerified) {
        ctx.throw(401, 'Wallet signature verification failed.');
      }

      const accountId = walletAddress.toLowerCase();
      const result = {
        login: { accountId },
      };

      const grant = new oidc.Grant({
        accountId,
        clientId: details.params.client_id,
      });
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
