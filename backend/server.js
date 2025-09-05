// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const oidc = require('./oidc'); // Наш OIDC провайдер

const app = express();
const port = process.env.PORT || 10000;

app.set('trust proxy', 1);

// --- НАЧАЛО ФИНАЛЬНОГО ИСПРАВЛЕНИЯ ---

// Создаем отдельный "роутер" для всех путей oidc-provider
// (включая /oidc/* и наш кастомный /wallet-callback)
const oidcRouter = express.Router();
oidcRouter.use(oidc.callback());

// 1. Монтируем роутер на путь /oidc.
// Это возвращает discovery document на правильный адрес: /oidc/.well-known/...
app.use('/oidc', oidcRouter);

// 2. Также монтируем роутер на корень.
// Это делает наш кастомный эндпоинт /wallet-callback доступным по адресу /wallet-callback,
// исправляя ошибку "Cannot POST /wallet-callback".
app.use('/', oidcRouter);

// --- КОНЕЦ ФИНАЛЬНОГО ИСПРАВЛЕНИЯ ---

// Настраиваем раздачу статических файлов собранного React-приложения
const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));

// Для всех остальных GET-запросов отдаем главный index.html, чтобы работал роутинг React
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running on port ${port}. OIDC provider is mounted at /oidc`);
});