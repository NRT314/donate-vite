// backend/server.js (исправлённая версия)
require('dotenv').config();
const express = require('express');
const oidc = require('./oidc');

const app = express();

// Если стоите за reverse-proxy (Heroku / Render / nginx) — доверяем заголовки
app.set('trust proxy', 1); // важно для secure cookies и correct req.protocol

// Эндпоинт для мониторинга
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Монтируем Koa-приложение OIDC-провайдера на путь /oidc
app.use('/oidc', oidc.callback());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. OIDC provider is mounted at /oidc`);
});
