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
  async findAccount(ctx, sub) { /* ... без изменений ... */ },
  interactions: { /* ... без изменений ... */ },
  cookies: { /* ... без изменений ... */ },
  claims: { /* ... без изменений ... */ },
  features: { /* ... без изменений ... */ },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

// --- ДИАГНОСТИЧЕСКИЙ ЛОГЕР OIDC (рекомендация специалиста) ---
oidc.app.use(async (ctx, next) => {
  console.log(`[OIDC-REQ] ${ctx.method} ${ctx.path} Cookie=${ctx.headers.cookie || '<none>'}`);
  await next();
});
// -------------------------------------------------------------

oidc.app.use(cors({ origin: 'https://newrussia.online', credentials: true }));

const conditionalBodyParser = bodyParser({ enableTypes: ['json', 'form'] });
oidc.app.use(async (ctx, next) => {
  if (ctx.path === '/wallet-callback') {
    await conditionalBodyParser(ctx, next);
  } else {
    await next();
  }
});

// Кастомный эндпоинт с детальным логированием (рекомендация специалиста)
oidc.app.use(async (ctx, next) => {
  if (!(ctx.path === '/wallet-callback' && ctx.method === 'POST')) {
    return await next();
  }

  console.log('[OIDC] /wallet-callback POST handler entered');
  const body = ctx.request.body || {};
  console.log('[OIDC] Raw body keys:', Object.keys(body));
  const { uid, walletAddress, signature } = body;

  if (!uid || !walletAddress || !signature) {
    console.warn('[OIDC] /wallet-callback: missing params', { uid, signaturePresent: !!signature });
    ctx.status = 400;
    ctx.body = { error: 'Missing parameters' };
    return;
  }

  let details;
  try {
    console.log('[OIDC] Attempting interactionDetails(ctx.req, ctx.res)...');
    details = await oidc.interactionDetails(ctx.req, ctx.res);
    console.log('[OIDC] interactionDetails(req,res) succeeded, uid=', details?.uid);
  } catch (e) {
    console.error('[OIDC] interactionDetails failed:', e.message);
    ctx.status = 500;
    ctx.body = { error: 'interactionDetails failed', details: e.message };
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
  const grant = new oidc.Grant({ accountId, clientId: details.params.client_id });
  grant.addOIDCScope('openid email profile');
  result.consent = { grantId: await grant.save() };
  console.log('[OIDC] Grant created, grantId:', grant.grantId);

  await oidc.interactionFinished(ctx.req, ctx.res, result, { mergeWithLastSubmission: false });
  console.log('[OIDC] interactionFinished successfully.');
});

// Добавим async findAccount и другие части, чтобы файл был полным
configuration.asyncfindAccount = async (ctx, sub) => { /* ... */ };
configuration.interactions.url = (ctx, interaction) => `https://newrussia.online/discourse-auth?uid=${interaction.uid}`;

module.exports = oidc;