// backend/walletAuth.js
const { verifyMessage } = require('ethers');

async function verifyWallet(walletAddress, signature, message) {
  try {
    const recovered = verifyMessage(message, signature);
    return recovered.toLowerCase() === walletAddress.toLowerCase();
  } catch (err) {
    console.error('Wallet verification error:', err.message);
    return false;
  }
}

module.exports = { verifyWallet };