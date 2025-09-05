// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const oidc = require('./oidc'); // Наш OIDC провайдер

const app = express();
const port = process.env.PORT || 10000;

// Доверяем прокси-серверу (важно для Render.com)
app.set('trust proxy', 1);

// 1. Монтируем OIDC-провайдер на путь /oidc
app.use('/oidc', oidc.callback());

// 2. Настраиваем раздачу статических файлов собранного React-приложения
// Указываем путь к папке 'dist', которая находится в корне проекта
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