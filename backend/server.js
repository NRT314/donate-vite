// backend/server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs'); // Добавляем модуль для работы с файлами
const oidc = require('./oidc');

const app = express();
const port = process.env.PORT || 10000;

app.set('trust proxy', 1);

app.use('/oidc', oidc.callback());

// ############### НАЧАЛО ДИАГНОСТИЧЕСКОГО КОДА ###############
// Этот эндпоинт покажет нам, какие файлы лежат в папке dist на сервере
app.get('/__static_info', (req, res) => {
  // Путь к папке dist из папки backend (../dist)
  const buildPath = path.join(__dirname, '..', 'dist');
  const assetsPath = path.join(buildPath, 'assets');
  
  const buildPathExists = fs.existsSync(buildPath);
  const assetsPathExists = fs.existsSync(assetsPath);
  
  const filesInDist = buildPathExists ? fs.readdirSync(buildPath) : [];
  const filesInAssets = assetsPathExists ? fs.readdirSync(assetsPath) : [];

  res.json({
    message: "Static files info from the server",
    timestamp: new Date().toISOString(),
    buildPathExists,
    assetsPathExists,
    filesInDist,
    filesInAssets,
  });
});
// ############### КОНЕЦ ДИАГНОСТИЧЕСКОГО КОДА ###############

const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}. OIDC provider is mounted at /oidc`);
});