// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const oidc = require('./oidc'); // Наш OIDC провайдер

const app = express();
const port = process.env.PORT || 10000;

app.set('trust proxy', 1);

// 1. Монтируем ВСЕ сервисы OIDC на единый, правильный путь /oidc
app.use('/oidc', oidc.callback());

// 2. Настраиваем раздачу статических файлов собранного React-приложения
const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));

// 3. Для всех остальных запросов отдаем главный index.html, чтобы работал роутинг React
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running on port ${port}. OIDC provider is mounted at /oidc`);
});