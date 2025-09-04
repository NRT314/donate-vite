// backend/oidc.js (ФИНАЛЬНАЯ ВЕРСИЯ С ИСПРАВЛЕНИЯМИ СПЕЦИАЛИСТА)
const { Provider } = require('oidc-provider');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

const ISSUER = `${process.env.OIDC_ISSUER}/oidc`;

const configuration = {
  adapter: RedisAdapter,
  clients: [
    {
      client_id: 'discourse_client',
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${process.env.DISCOURSE_URL}/auth/oidc/callback`],
      grant_types: ['authorization_code'],
      response_types: ['code'],
    }
  ],

  async findAccount(ctx, sub) {
    return {
      accountId: sub,
      async claims() {
        return {
          sub,
          email: `${sub.toLowerCase()}@wallet.newrussia.online`,
          email_verified: true,
          preferred_username: `user_${sub.slice(-6)}`,
          name: `User ${sub.slice(0, 6)}...${sub.slice(-4)}`
        };
      }
    };
  },

  interactions: {
    url(ctx, interaction) {
      return `${process.env.FRONTEND_URL}/discourse-auth?uid=${interaction.uid}`;
    },
  },

  // <<-- НАЧАЛО ИСПРАВЛЕНИЯ №1: Правильные настройки Cookie -->>
  // Эти настройки критически важны для работы между разными доменами
  cookies: {
    keys: [process.env.OIDC_COOKIE_SECRET],
    short: { signed: true, httpOnly: true, sameSite: 'none', secure: true },
    long: { signed: true, httpOnly: true, sameSite: 'none', secure: true }
  },
  // <<-- КОНЕЦ ИСПРАВЛЕНИЯ №1 -->>

  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name']
  },

  features: { devInteractions: { enabled: false } },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

// Используем Koa-совместимое middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true })); // credentials: true важен для cookie
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Кастомный эндпоинт для верификации кошелька
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    const { uid, walletAddress, signature } = ctx.request.body;

    if (!uid || !walletAddress || !signature) {
      ctx.status = 400; ctx.body = { error: 'Missing parameters' }; return;
    }

    // Добавляем лог для отладки
    console.log(`[OIDC] Finishing interaction for uid: ${uid}`);
    
    const message = `Sign this message to login to the forum: ${uid}`;

    const isVerified = await verifyWallet(walletAddress, signature, message);
    if (!isVerified) {
      ctx.status = 401; ctx.body = { error: 'Wallet verification failed' }; return;
    }

    const result = { login: { accountId: walletAddress.toLowerCase() } };
    
    // <<-- НАЧАЛО ИСПРАВЛЕНИЯ №2: Правильный вызов функции -->>
    // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЙ ВЫЗОВ: передаем весь `ctx`, а не ctx.req, ctx.res
    await oidc.interactionFinished(ctx, result, { mergeWithLastSubmission: false });
    // <<-- КОНЕЦ ИСПРАВЛЕНИЯ №2 -->>
    return;
  }

  await next();
});

module.exports = oidc;