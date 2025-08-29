// Импортируем необходимые библиотеки
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

// Инициализируем Express-приложение
const app = express();
app.use(cors()); // Включаем CORS для взаимодействия с фронтендом
app.use(express.json()); // Включаем парсинг JSON-тела запросов

// --- Эндпоинт 1: Аутентификация пользователя и выдача JWT-токена ---
// Фронтенд попросит пользователя подписать сообщение, а затем отправит адрес и подпись сюда.
// Если подпись верна, сервер вернет JWT-токен.
app.post('/auth/login', async (req, res) => {
    const { walletAddress, signature } = req.body;

    // Сообщение, которое пользователь должен был подписать на фронтенде.
    // Оно должно быть абсолютно идентичным!
    const message = "Sign this message to login to the forum";

    try {
        // Проверяем подпись
        const signerAddress = ethers.verifyMessage(message, signature);

        // Если адрес, восстановившийся из подписи, совпадает с адресом, который прислал пользователь
        if (signerAddress.toLowerCase() === walletAddress.toLowerCase()) {
            // Подпись верна! Создаем JWT-токен.
            const token = jwt.sign({ walletAddress: walletAddress }, process.env.JWT_SECRET, { expiresIn: '1h' });
            res.json({ success: true, token: token });
        } else {
            // Подпись неверна
            res.status(401).json({ success: false, message: "Invalid signature." });
        }
    } catch (error) {
        console.error("Auth error:", error);
        res.status(500).json({ success: false, message: "Authentication failed." });
    }
});

// --- Middleware для проверки JWT-токена (ОБНОВЛЕННАЯ ВЕРСИЯ) ---
const authenticateToken = (req, res, next) => {
    let token = null;

    // Способ 1: Ищем токен в заголовке Authorization
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        token = authHeader.split(' ')[1]; // Bearer <TOKEN>
    }

    // Способ 2: Если токена нет, ищем его в параметрах URL
    if (!token && req.query.token) {
        token = req.query.token;
    }
    
    if (token == null) {
        return res.status(401).send("Access Token not found.");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("JWT Verification Error:", err.message);
            return res.status(403).send("Invalid or expired token.");
        }
        req.user = user;
        next();
    });
};


// --- Эндпоинт 2: Главная логика Discourse SSO ---
// Этот эндпоинт защищен middleware `authenticateToken`.
app.get('/sso/discourse-login', authenticateToken, (req, res) => {
    // Шаг 1: Получаем nonce из запроса, который прислал Discourse
    const { sso, sig } = req.query;
    if (!sso || !sig) {
        return res.status(400).send("SSO or Signature missing from Discourse request.");
    }
    
    // Проверка подписи от Discourse (для безопасности)
    const hmac = crypto.createHmac('sha256', process.env.DISCOURSE_SSO_SECRET);
    hmac.update(sso);
    if (hmac.digest('hex') !== sig) {
      return res.status(403).send("Invalid signature from Discourse.");
    }

    // Декодируем nonce из base64
    const decodedSso = Buffer.from(sso, 'base64').toString('utf8');
    const params = new URLSearchParams(decodedSso);
    const nonce = params.get('nonce');

    if (!nonce) {
        return res.status(400).send("Nonce is missing.");
    }

    // Шаг 2: Получаем адрес кошелька из проверенного JWT-токена
    const walletAddress = req.user.walletAddress;

    // Шаг 3: Генерируем данные для Discourse
    const payload = {
        nonce: nonce,
        external_id: walletAddress,
        email: `${walletAddress}@example.com`, // Discourse требует email, генерируем псевдо-email
        username: `user_${walletAddress.slice(-6)}`, // Генерируем уникальный юзернейм
    };

    // Шаг 4: Создаем строку payload и кодируем ее в base64
    const payloadString = new URLSearchParams(payload).toString();
    const base64Payload = Buffer.from(payloadString).toString('base64');

    // Шаг 5: Подписываем base64-payload нашим секретным ключом
    const payloadSignature = crypto.createHmac('sha256', process.env.DISCOURSE_SSO_SECRET).update(base64Payload).digest('hex');

    // Шаг 6: Формируем URL для редиректа обратно на Discourse
    const redirectUrl = `${process.env.DISCOURSE_URL}/session/sso_login?sso=${base64Payload}&sig=${payloadSignature}`;

    // Шаг 7: Отправляем пользователя на этот URL
    res.redirect(redirectUrl);
});


// Запускаем сервер
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`SSO Backend Server is running on port ${PORT}`);
});