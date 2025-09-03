// backend/walletAuth.js
const { ethers } = require('ethers');

async function verifyWallet(walletAddress, signature, message) {
  try {
    // Эта функция теперь проверяет подпись для конкретного сообщения
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    console.error('Wallet verification error', err);
    return false;
  }
}

module.exports = { verifyWallet };