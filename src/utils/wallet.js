const { ethers } = require("ethers");

// ── Generate sign message ────────────────────────────
// Unity asks player to sign this message with Core Wallet
function generateSignMessage(walletAddress) {
  return `Welcome to Fisher: Guardians of the Blue Tank!\n\nSign this message to verify you own this wallet.\n\nWallet: ${walletAddress}\nTimestamp: ${Date.now()}`;
}

// ── Verify wallet signature ──────────────────────────
// Proves player owns the wallet address
function verifySignature(message, signature, expectedAddress) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

module.exports = { generateSignMessage, verifySignature };
