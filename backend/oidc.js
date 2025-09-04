// backend/oidc.js
import Koa from 'koa';
import Router from '@koa/router';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import jwt from 'jsonwebtoken';
import { verifyWallet } from './walletAuth.js';
import { v4 as uuidv4 } from 'uuid';

const app = new Koa();
const router = new Router();

const FRONTEND_URL = process.env.FRONTEND_URL;
const DISCOURSE_URL = process.env.DISCOURSE_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_long';

app.use(cors({ origin: FRONTEND_URL }));
app.use(bodyParser({ enableTypes: ['json', 'form'] }));

// In-memory store for temporary login requests (or Redis if needed)
const tempLogins = new Map();

/**
 * Step 1: Frontend requests a uid for wallet login
 */
router.get('/wallet-login-start', async (ctx) => {
  const uid = uuidv4();
  // store timestamp to auto-expire old uids
  tempLogins.set(uid, Date.now());
  ctx.body = { uid };
});

/**
 * Step 2: Frontend POSTs uid + wallet signature
 */
router.post('/wallet-login-callback', async (ctx) => {
  const { uid, walletAddress, signature } = ctx.request.body;

  if (!uid || !walletAddress || !signature) {
    ctx.status = 400;
    ctx.body = { error: 'Missing parameters' };
    return;
  }

  // Check if uid exists and is fresh (5 min)
  const ts = tempLogins.get(uid);
  if (!ts || Date.now() - ts > 5 * 60 * 1000) {
    ctx.status = 400;
    ctx.body = { error: 'Invalid or expired uid' };
    return;
  }

  // Verify wallet signature
  const message = `Sign this message to login to the forum: ${uid}`;
  const isVerified = await verifyWallet(walletAddress, signature, message);
  if (!isVerified) {
    ctx.status = 401;
    ctx.body = { error: 'Wallet verification failed' };
    return;
  }

  // Create JWT for Discourse OIDC login
  const tokenPayload = {
    sub: walletAddress.toLowerCase(),
    email: `${walletAddress.toLowerCase()}@wallet.newrussia.online`,
    name: `User ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '5m' });

  // Cleanup uid
  tempLogins.delete(uid);

  // Redirect to Discourse OIDC callback with token
  const redirectUrl = `${DISCOURSE_URL}/auth/oidc/callback?code=${token}`;
  ctx.redirect(redirectUrl);
});

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Wallet-login backend running on port ${PORT}`);
});
