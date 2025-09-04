// backend/oidc.js (исправлённая финальная версия)
require('dotenv').config();

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

//
// Поддерживаем разные способы экспорта oidc-provider (CJS / ESM interop)
//
let Provider;
try {
  const oidcPkg = require('oidc-provider');
  // oidcPkg может быть: function (default export), { Provider }, or { default: Provider }
  Provider = oidcPkg.Provider || oidcPkg.default || oidcPkg;
  if (!Provider) throw new Error('Cannot locate Provider constructor in oidc-provider package');
} catch (err) {
  console.error('Failed to load oidc-provider:', err);
  throw err;
}

const ISSUER = `${process.env.OIDC_ISSUER.replace(/\/$/, '')}/oidc`;
if (!process.env.OIDC_ISSUER) {
  console.warn('WARN: OIDC_ISSUER not set — make sure environment variables are configured.');
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
    return {
      accountId: sub,
      async claims() {
        return {
          sub,
          email: `${sub.toLowerCase()}@wallet.newrussia.online`,
          email_verified: true,
          preferred_username: `user_${sub.slice(-6)}`,
          name: `User ${sub.slice(0, 6)}...${sub.slice(-4)}`,
        };
      },
    };
  },

  interactions: {
    url(ctx, interaction) {
      // Указываем на фронтенд React-приложение
      return `${process.env.FRONTEND_URL.replace(/\/$/, '')}/discourse-auth?uid=${interaction.uid}`;
    },
  },

  // Cookie параметры — критичны для cross-site (SameSite=None + Secure)
  cookies: {
    keys: [process.env.OIDC_COOKIE_SECRET || 'please-set-a-secret'],
    short: {
      signed: true,
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production' ? true : false,
      // domain: process.env.OIDC_COOKIE_DOMAIN || undefined, // при необходимости
    },
    long: {
      signed: true,
      httpOnly: true,
      sameSite: 'none',
      secure: process.env.NODE_ENV === 'production' ? true : false,
      // domain: process.env.OIDC_COOKIE_DOMAIN || undefined,
    },
  },

  claims: {
    openid: ['sub'],
    email: ['email', 'email_verified'],
    profile: ['preferred_username', 'name'],
  },

  features: { devInteractions: { enabled: false } },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true; // доверяем заголовку X-Forwarded-For и проч.

//
// Koa middleware
//
oidc.app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
oidc.app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// Диагностический лог при старте discovery
oidc.listen = (port, cb) => {
  console.log(`OIDC provider initialized for issuer ${ISSUER}`);
  if (cb) cb();
};

//
// Кастомный эндпоинт для верификации кошелька
//
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback' && ctx.method === 'POST') {
    try {
      const { uid, walletAddress, signature } = ctx.request.body || {};

      console.log('[OIDC] /wallet-callback POST received. uid:', uid);
      console.log('[OIDC] Request cookies:', ctx.headers && ctx.headers.cookie);

      if (!uid || !walletAddress || !signature) {
        ctx.status = 400;
        ctx.body = { error: 'Missing parameters' };
        return;
      }

      // Попробуем получить детали интеракции (совместимость с разными сигнатурами)
      let details;
      try {
        details = await oidc.interactionDetails(ctx);
      } catch (err1) {
        // fallback to (req, res) signature
        try {
          details = await oidc.interactionDetails(ctx.req, ctx.res);
        } catch (err2) {
          console.error('interactionDetails failed for both ctx and (req,res):', err1 && err1.message, err2 && err2.message);
          ctx.status = 500;
          ctx.body = { error: 'interactionDetails failed', details: err2?.message || err1?.message };
          return;
        }
      }

      // Логируем полученные детали для диагностики
      console.log('[OIDC] interaction details uid=', details?.uid, 'params=', details?.params?.client_id ? '(client_id present)' : details?.params);

      // Проверка uid соответствия (если не совпадает — логируем и возвращаем ошибку)
      if (details?.uid && details.uid !== uid) {
        console.warn('[OIDC] UID mismatch: interaction uid != posted uid', details.uid, uid);
        // Можно продолжить, но обычно это указывает на проблему с отсутствием cookie/session
        // Возвращаем диагностическую ошибку
        ctx.status = 400;
        ctx.body = { error: 'UID mismatch or session not found' };
        return;
      }

      const message = `Sign this message to login to the forum: ${uid}`;
      const isVerified = await verifyWallet(walletAddress, signature, message);
      if (!isVerified) {
        ctx.status = 401;
        ctx.body = { error: 'Wallet verification failed' };
        return;
      }

      // Формируем результат интеракции: логин + (явный) consent/grant если требуется
      const accountId = walletAddress.toLowerCase();
      const result = {
        login: { accountId },
      };

      // Если провайдер требует Grant/consent — создаём его автоматически
      try {
        if (typeof oidc.Grant === 'function' && details && details.params) {
          // Создаём Grant для клиента (чтобы middleware consent не падал)
          const grant = new oidc.Grant({
            accountId,
            clientId: details.params.client_id,
          });
          // Добавим стандартные scopes, которые мы возвращаем в claims
          grant.addOIDCScope('openid email profile');
          // сохраняем грант
          await grant.save();
          result.consent = { grantId: grant.grantId };
          console.log('[OIDC] Created Grant for account/client:', accountId, details.params.client_id, 'grantId:', grant.grantId);
        } else {
          // fallback — явно передаём пустой consent, чтобы продолжить
          result.consent = {};
        }
      } catch (grantErr) {
        console.warn('[OIDC] Grant creation failed, continuing with empty consent:', grantErr && grantErr.message);
        result.consent = {};
      }

      // Финализируем интеракцию: пробуем обе сигнатуры interactionFinished
      try {
        // попробовать (req,res) сигнатуру
        await oidc.interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
        // после interactionFinished koa/oidc-provider обычно делает redirect, поэтому ничего не делаем здесь
        return;
      } catch (errReqRes) {
        console.warn('interactionFinished(req,res) failed, will try ctx signature:', errReqRes && errReqRes.message);
        try {
          await oidc.interactionFinished(ctx, result, { mergeWithLastSubmission: false });
          return;
        } catch (errCtx) {
          console.error('interactionFinished(ctx) failed as well:', errCtx && errCtx.message);
          ctx.status = 500;
          ctx.body = { error: 'interactionFinished failed', details: errCtx?.message || errReqRes?.message };
          return;
        }
      }
    } catch (err) {
      console.error('Unhandled error in /wallet-callback:', err);
      ctx.status = 500;
      ctx.body = { error: 'Internal server error', details: err.message };
      return;
    }
  }

  await next();
});

module.exports = oidc;
