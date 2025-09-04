// backend/oidc.js
const { Provider } = require('oidc-provider');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter'); // <<-- ДОБАВЛЕНО

// ВАЖНО: Issuer URL должен совпадать с тем, где будет "жить" провайдер
const ISSUER = `${process.env.OIDC_ISSUER}/oidc`;

const configuration = {
  adapter: RedisAdapter, // <<-- ДОБАВЛЕНО
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
          email_verified: true, // Говорим Discourse, что email подтвержден
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

  claims: { // Явно определяем, какие данные доступны через scopes
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name']
  },

  features: { devInteractions: { enabled: false } },
  cookies: { keys: [process.env.OIDC_COOKIE_SECRET] },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true; // <-- ДОБАВЛЕНО

// Используем Koa-совместимое middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL })); // Ограничиваем CORS
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] })); // <-- ИСПРАВЛЕНО

// Кастомный эндпоинт для верификации кошелька
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    const { uid, walletAddress, signature } = ctx.request.body;

    if (!uid || !walletAddress || !signature) {
      ctx.status = 400;
      ctx.body = { error: 'Missing parameters' };
      return;
    }

    // ФОРМИРУЕМ ДИНАМИЧЕСКОЕ СООБЩЕНИЕ ДЛЯ ЗАЩИТЫ ОТ REPLAY-АТАК
    const message = `Sign this message to login to the forum: ${uid}`;

    const isVerified = await verifyWallet(walletAddress, signature, message);
    if (!isVerified) {
      ctx.status = 401;
      ctx.body = { error: 'Wallet verification failed' };
      return;
    }

    const result = { login: { accountId: walletAddress.toLowerCase() } };

    console.log('Finishing interaction for uid:', uid);

    // Завершаем OIDC-процесс. Провайдер сам сделает редирект в Discourse.
    await oidc.interactionFinished(ctx, result, {
      mergeWithLastSubmission: false
    });
    return;
  }

  await next();
});

module.exports = oidc;
