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
      post_logout_redirect_uris: [`${process.env.DISCOURSE_URL.replace(/\/$/, '')}/`], // <== важно
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
    userinfo: { enabled: true },
    rpInitiatedLogout: { enabled: true }, // <== включаем logout
  },
};

const oidc = new Provider(ISSUER, configuration);
oidc.proxy = true;

// --- ДИАГНОСТИЧЕСКИЙ ЛОГЕР ---
oidc.app.use(async (ctx, next) => {
  console.log(`[OIDC-REQ] ${ctx.method} ${ctx.path} Cookie=${ctx.headers.cookie || '<none>'}`);
  await next();
});

oidc.app.use(cors({ origin: 'https://newrussia.online', credentials: true }));

const conditionalBodyParser = bodyParser({ enableTypes: ['json', 'form'] });
oidc.app.use(async (ctx, next) => {
  if (ctx.path.endsWith('/wallet-callback')) {
    await conditionalBodyParser(ctx, next);
  } else {
    await next();
  }
});

// Кастомный wallet-callback
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
  } catch (err) {
    console.error('[OIDC] Unexpected error in /wallet-callback:', err);
    ctx.status = err.statusCode || 500;
    ctx.body = { error: 'Internal server error', details: err.message };
  }
});

module.exports = oidc;
