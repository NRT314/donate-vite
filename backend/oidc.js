// backend/oidc.js
const { Provider } = require('oidc-provider');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter'); // your adapter implementation

// ISSUER должен точно совпадать с конечным URL, где провайдер будет доступен.
// например: https://donate-vite.onrender.com/oidc
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
      // Interaction uid будет передан в URL на фронтенд
      return `${process.env.FRONTEND_URL}/discourse-auth?uid=${interaction.uid}`;
    },
  },

  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name']
  },

  features: { devInteractions: { enabled: false } },

  // Важные настройки cookie: sameSite: 'none' + secure: true — нужно для кросс-доменных POST редиректов
  cookies: {
    keys: [process.env.OIDC_COOKIE_SECRET || 'change_this_long_random_value'],
    short: { signed: true, httpOnly: true, sameSite: 'none', secure: true },
    long: { signed: true, httpOnly: true, sameSite: 'none', secure: true }
  },
};

const oidc = new Provider(ISSUER, configuration);

// Если вы стоите за прокси (Render, Heroku и т.п.)
oidc.proxy = true;

// Koa middleware
oidc.app.use(cors({ origin: process.env.FRONTEND_URL }));
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Кастомный эндпоинт, куда фронтенд POST-ит uid, walletAddress, signature
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    const { uid, walletAddress, signature, message: submittedMessage } = ctx.request.body;

    if (!uid || !walletAddress || !signature) {
      ctx.status = 400;
      ctx.body = { error: 'Missing parameters' };
      return;
    }

    // Формат сообщения должен точно совпадать с тем, что подписывает фронтенд.
    // Если вы отправляете `message` из фронтенда — используйте его; иначе формируйте здесь.
    const expectedMessage = submittedMessage || `Sign this message to login to the forum: ${uid}`;

    // Верифицируем подпись
    let isVerified = false;
    try {
      isVerified = await verifyWallet(walletAddress, signature, expectedMessage);
    } catch (err) {
      console.error('verifyWallet threw an error:', err);
      ctx.status = 500;
      ctx.body = { error: 'Internal verification error' };
      return;
    }

    if (!isVerified) {
      ctx.status = 401;
      ctx.body = { error: 'Wallet verification failed' };
      return;
    }

    // --- Загрузим детали интеракции у провайдера и залогируем ---
    let details = null;
    try {
      // prefer modern API (ctx)
      details = await oidc.interactionDetails(ctx);
    } catch (err1) {
      try {
        // fallback для старых версий
        details = await oidc.interactionDetails(ctx.req, ctx.res);
      } catch (err2) {
        console.error('Failed to load interaction details (both attempts):', err1, err2);
        ctx.status = 500;
        ctx.body = { error: 'Unable to load interaction details from provider' };
        return;
      }
    }

    // Логируем для отладки — смотрите, что реально хранится в интеракции
    try {
      console.log('Loaded interaction details (uid):', details && details.uid);
      console.log('Loaded interaction details (params):', details && details.params);
      console.log('Provided uid:', uid);
    } catch (logErr) {
      console.warn('Could not log interaction details cleanly', logErr);
    }

    if (!details || !details.uid) {
      console.warn('No interaction.uid found for incoming wallet-callback. Details:', details);
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', reason: 'no interaction found' };
      return;
    }

    if (details.uid !== uid) {
      console.warn('UID mismatch between provider and frontend. Provider.uid=', details.uid, 'frontend.uid=', uid);
      // Не прерываем сразу — можно решить как угодно (ошибка или попытка всё же завершить)
      // Здесь отправляем диагностический ответ
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', reason: 'uid_mismatch', provider_uid: details.uid, provided_uid: uid };
      return;
    }

    // Подготовим результат логина для провайдера
    const result = { login: { accountId: walletAddress.toLowerCase() } };

    // Попытка безопасно завершить интеракцию — пробуем современный API (ctx), иначе fall back
    try {
      // modern signature
      await oidc.interactionFinished(ctx, result, { mergeWithLastSubmission: false });
      // interactionFinished обычно завершает ответ и делает redirect в браузер
      return;
    } catch (finishErr) {
      console.warn('interactionFinished(ctx, ...) failed, trying legacy API with req,res', finishErr);
      try {
        await oidc.interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
        return;
      } catch (finishErr2) {
        console.error('interactionFinished failed (both attempts):', finishErr, finishErr2);
        ctx.status = 500;
        ctx.body = { error: 'interaction_finish_failed', message: finishErr2 && finishErr2.message };
        return;
      }
    }
  }

  await next();
});

module.exports = oidc;
