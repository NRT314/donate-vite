// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const oidc = require('./oidc');

const app = express();
const port = process.env.PORT || 10000;

app.set('trust proxy', 1);

// --- ДИАГНОСТИЧЕСКИЙ ЛОГЕР ---
app.use((req, res, next) => {
  console.log(
    `[EXPRESS] ${new Date().toISOString()} ${req.method} ${req.originalUrl} Referer:${req.headers.referer || '<none>'}`
  );
  next();
});

// --- HEALTHCHECK ---
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});
// --------------------

app.use('/oidc', oidc.callback());

const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}. OIDC provider is mounted at /oidc`);
});
