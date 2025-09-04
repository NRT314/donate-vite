// backend/server.js (ФИНАЛЬНАЯ ВЕРСИЯ OIDC)
require('dotenv').config();
const express = require('express');
const path = require('path'); // <<-- ДОБАВЬТЕ ЭТУ СТРОКУ
const oidc = require('./oidc');

const app = express();

// <<-- НАЧАЛО ИЗМЕНЕНИЙ -->>
// Раздаем статические файлы (наш HTML) из папки 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Эндпоинт для мониторинга UptimeRobot
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});
// <<-- КОНЕЦ ИЗМЕНЕНИЙ -->>

// Монтируем Koa-приложение OIDC-провайдера на путь /oidc
app.use('/oidc', oidc.callback());

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}. OIDC provider is mounted at /oidc`);
});