// backend/server.js (ОБНОВЛЕННАЯ ВЕРСИЯ)
require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://newrussia.online';
const DISCOURSE_URL = process.env.DISCOURSE_URL;
const DISCOURSE_SSO_SECRET = process.env.DISCOURSE_SSO_SECRET;

// Эндпоинт 1: Discourse отправляет пользователя сюда
// Задача: Просто перенаправить на фронтенд, пробросив sso и sig
app.get('/sso/discourse-login', (req, res) => {
    const { sso, sig } = req.query;
    if (!sso || !sig) {
        return res.status(400).send("SSO or Signature missing from Discourse request.");
    }
    // Перенаправляем на специальную страницу на фронтенде
    const redirectUrl = `${FRONTEND_URL}/discourse-auth?sso=${sso}&sig=${sig}`;
    res.redirect(redirectUrl);
});


// Эндпоинт 2: Фронтенд обращается сюда после подписи кошельком
// Задача: Проверить все подписи и вернуть финальный URL для входа
app.post('/sso/verify', async (req, res) => {
    const { sso, sig, walletAddress, signature } = req.body;

    // --- Проверка 1: Валидируем подпись от Discourse ---
    const hmac = crypto.createHmac('sha256', DISCOURSE_SSO_SECRET);
    hmac.update(sso);
    if (hmac.digest('hex') !== sig) {
      return res.status(403).json({ success: false, message: "Invalid signature from Discourse." });
    }

    // --- Проверка 2: Валидируем подпись от кошелька ---
    const message = "Sign this message to login to the forum";
    try {
        const signerAddress = ethers.verifyMessage(message, signature);
        if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            return res.status(401).json({ success: false, message: "Wallet signature is invalid." });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: "Wallet signature verification failed." });
    }

    // --- Все проверки пройдены, готовим ответ для Discourse ---
    const decodedSso = Buffer.from(sso, 'base64').toString('utf8');
    const params = new URLSearchParams(decodedSso);
    const nonce = params.get('nonce');

    const payload = {
        nonce: nonce,
        external_id: walletAddress,
        email: `${walletAddress}@example.com`,
        username: `user_${walletAddress.slice(-6)}`,
    };

    const payloadString = new URLSearchParams(payload).toString();
    const base64Payload = Buffer.from(payloadString).toString('base64');
    const payloadSignature = crypto.createHmac('sha256', DISCOURSE_SSO_SECRET).update(base64Payload).digest('hex');

    // Формируем финальный URL и отправляем его на фронтенд
    const finalRedirectUrl = `${DISCOURSE_URL}/session/sso_login?sso=${base64Payload}&sig=${payloadSignature}`;
    
    res.json({ success: true, redirectUrl: finalRedirectUrl });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`SSO Backend Server is running on port ${PORT}`);
});