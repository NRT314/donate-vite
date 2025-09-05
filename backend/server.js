// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const oidc = require('./oidc'); // Наш OIDC провайдер

const app = express();
const port = process.env.PORT || 10000;

app.set('trust proxy', 1);

// ИЗМЕНЕНИЕ: Монтируем ВСЕ маршруты из oidc.js (включая /oidc/* и /wallet-callback)
// Это знакомит наш главный сервер с кастомным эндпоинтом.
app.use(oidc.callback());

// Настраиваем раздачу статических файлов собранного React-приложения
const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));

// Для всех остальных GET-запросов отдаем главный index.html, чтобы работал роутинг React
app.get('*', (req, res) => {
  // Исключаем наши API-пути из этого правила
  if (req.path.startsWith('/oidc') || req.path.startsWith('/wallet-callback')) {
    return;
  }
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running on port ${port}. OIDC provider is available.`);
});