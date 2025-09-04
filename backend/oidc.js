// backend/oidc.js
const { Provider } = require('oidc-provider');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

// ВАЖНО: Issuer URL должен совпадать с тем, где будет "жить" провайдер
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

  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name']
  },

  features: { devInteractions: { enabled: false } },
  cookies: { keys: [process.env.OIDC_COOKIE_SECRET] },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

// Используем Koa-совместимое middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL }));
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Кастомный эндпоинт для верификации кошелька
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    const { uid, walletAddress, signature } = ctx.request.body;

    if (!uid || !walletAddress || !signature) {
      ctx.status = 400;
      ctx.body = { error: 'Missing parameters' };
      return;
    }

    const message = `Sign this message to login to the forum: ${uid}`;

    const isVerified = await verifyWallet(walletAddress, signature, message);
    if (!isVerified) {
      ctx.status = 401;
      ctx.body = { error: 'Wallet verification failed' };
      return;
    }

    // Загружаем детали интеракции
    const details = await oidc.interactionDetails(ctx.req, ctx.res);
    console.log('Loaded interaction details:', details);

    if (details.uid !== uid) {
      console.warn('⚠️ UID mismatch! Provided:', uid, 'Expected:', details.uid);
    }

    const result = { login: { accountId: walletAddress.toLowerCase() } };

    console.log('Finishing interaction for uid:', details.uid);

    // Завершаем OIDC-процесс через interactionFinished
    await oidc.interactionFinished(ctx.req, ctx.res, result, {
      mergeWithLastSubmission: false
    });
    return;
  }

  await next();
});

module.exports = oidc;
