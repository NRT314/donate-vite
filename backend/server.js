// backend/server.js (ФИНАЛЬНАЯ ВЕРСИЯ OIDC + Health Check)
require('dotenv').config();
const express = require('express');
const oidc = require('./oidc');

const app = express();

// Эндпоинт для мониторинга UptimeRobot, чтобы сервис не "засыпал"
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Монтируем Koa-приложение OIDC-провайдера на путь /oidc внутри Express
app.use('/oidc', oidc.callback());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. OIDC provider is mounted at /oidc`);
});