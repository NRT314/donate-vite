// backend/oidc.js
require('dotenv').config();

const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const { verifyWallet } = require('./walletAuth');
const RedisAdapter = require('./redisAdapter');

let Provider;
try {
  const oidcPkg = require('oidc-provider');
  Provider = oidcPkg.Provider || oidcPkg.default || oidcPkg;
  if (!Provider) throw new Error('Cannot locate Provider constructor');
} catch (err) {
  console.error('Failed to load oidc-provider:', err);
  throw err;
}

const ISSUER = process.env.OIDC_ISSUER ? process.env.OIDC_ISSUER.replace(/\/$/, '') : undefined;
if (!ISSUER) {
  console.error('FATAL: OIDC_ISSUER environment variable is not set or is empty.');
  process.exit(1);
}

const DISCOURSE_URL = (process.env.DISCOURSE_URL || '').replace(/\/$/, '');
const NEWRUSSIA_URL = 'https://newrussia.online';

const configuration = {
  adapter: RedisAdapter,
  clients: [
    {
      client_id: 'discourse_client',
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [
        `${DISCOURSE_URL}/auth/oidc/callback`
      ],
      grant_types: ['authorization_code'],
      response_types: ['code'],
      // Добавляем несколько допустимых post_logout_redirect_uri — запасной вариант и callback,
      // чтобы покрыть разные реализации в Discourse/браузерах.
      post_logout_redirect_uris: [
        `${DISCOURSE_URL}/auth/oidc/callback`,
        `${DISCOURSE_URL}/`
      ],
    },
  ],
  async findAccount(ctx, sub) {
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
      // возвращаем UI для подписи / входа
      return `${NEWRUSSIA_URL}/discourse-auth?uid=${interaction.uid}`;
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
    userinfo: { enabled: true },
    rpInitiatedLogout: { enabled: true }, // включаем RP-инициированный logout
  },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

/**
 * Диагностический лог — общий
 */
oidc.app.use(async (ctx, next) => {
  console.log(`[OIDC-REQ] ${ctx.method} ${ctx.path} Cookie=${ctx.headers.cookie || '<none>'}`);
  await next();
});

/**
 * Специальный лог и очистка куки при запросе logout (/session/end).
 * Мы не заменяем поведение oidc-provider — просто логируем и пытаемся удалить локальные куки,
 * чтобы браузер не держал старую сессию.
 */
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/session/end' || ctx.path === '/session/end/') {
    console.log('[OIDC-LOGOUT] request to /session/end, query:', ctx.query);

    try {
      // Попытка удалить куки, которые oidc-provider использует для сессии/interaction.
      // Это поможет браузеру "забыть" сессию до того, как oidc-provider сделает редирект.
      // Указываем опции, соответствующие созданию cookie в конфиге.
      ctx.cookies.set('_interaction', '', { httpOnly: true, signed: false, sameSite: 'none', secure: true, path: '/', expires: new Date(0) });
      ctx.cookies.set('_interaction.sig', '', { httpOnly: true, signed: false, sameSite: 'none', secure: true, path: '/', expires: new Date(0) });
      ctx.cookies.set('_session', '', { httpOnly: true, signed: false, sameSite: 'none', secure: true, path: '/', expires: new Date(0) });
      ctx.cookies.set('_session.sig', '', { httpOnly: true, signed: false, sameSite: 'none', secure: true, path: '/', expires: new Date(0) });

      // Логируем текущее значение cookie (для отладки только — не в проде)
      console.log('[OIDC-LOGOUT] cookies cleared attempt');
    } catch (e) {
      console.warn('[OIDC-LOGOUT] failed to clear cookies locally:', e && e.message);
    }
  }
  await next();
});

oidc.app.use(cors({ origin: NEWRUSSIA_URL, credentials: true }));

/**
 * bodyParser только для /wallet-callback
 */
const conditionalBodyParser = bodyParser({ enableTypes: ['json', 'form'] });
oidc.app.use(async (ctx, next) => {
  if (ctx.path.endsWith('/wallet-callback')) {
    await conditionalBodyParser(ctx, next);
  } else {
    await next();
  }
});

/**
 * Кастомный wallet-callback — верификация подписи и завершение интеракции.
 */
oidc.app.use(async (ctx, next) => {
  if (!(ctx.path.endsWith('/wallet-callback') && ctx.method === 'POST')) {
    return await next();
  }

  try {
    console.log('[OIDC] /wallet-callback POST handler entered');
    const body = ctx.request.body || {};
    const { uid, walletAddress, signature } = body;

    if (!uid || !walletAddress || !signature) {
      console.warn('[OIDC] /wallet-callback: missing params', { uid, signaturePresent: !!signature });
      ctx.status = 400;
      ctx.body = { error: 'Missing parameters' };
      return;
    }

    let details;
    try {
      details = await oidc.interactionDetails(ctx.req, ctx.res);
      console.log('[OIDC] interactionDetails(req,res) succeeded, uid=', details?.uid);
    } catch (e) {
      console.error('[OIDC] interactionDetails failed:', e && e.message);
      ctx.status = 500;
      ctx.body = { error: 'interactionDetails failed', details: e && e.message };
      return;
    }

    if (details.uid !== uid) {
      console.warn('[OIDC] UID mismatch!', { detailsUid: details.uid, postedUid: uid });
      ctx.status = 400;
      ctx.body = { error: 'UID mismatch or session not found' };
      return;
    }

    const message = `Sign this message to login to the forum: ${uid}`;
    const isVerified = await verifyWallet(walletAddress, signature, message);
    console.log('[OIDC] verifyWallet result:', isVerified);
    if (!isVerified) {
      ctx.status = 401;
      ctx.body = { error: 'Wallet verification failed' };
      return;
    }

    const accountId = walletAddress.toLowerCase();
    const result = { login: { accountId } };

    // Создаём grant и даём запрошенные scope'ы
    const grant = new oidc.Grant({ accountId, clientId: details.params.client_id });
    grant.addOIDCScope('openid email profile');
    result.consent = { grantId: await grant.save() };
    console.log('[OIDC] Grant created, grantId:', grant.grantId);

    // Завершаем интеракцию у oidc-provider — он сделает редирект на client redirect_uri
    await oidc.interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
    console.log('[OIDC] interactionFinished successfully.');
  } catch (err) {
    console.error('[OIDC] Unexpected error in /wallet-callback:', err && err.stack ? err.stack : err);
    ctx.status = err.statusCode || 500;
    ctx.body = { error: 'Internal server error', details: err && err.message };
  }
});

module.exports = oidc;
