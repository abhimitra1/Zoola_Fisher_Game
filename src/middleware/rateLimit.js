const rateLimit = require("express-rate-limit");

// ── General API limit ────────────────────────────────
// Max 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: "Too many requests, please slow down!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Auth limit ───────────────────────────────────────
// Max 10 login attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: "Too many login attempts, try again later!",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Game action limit ────────────────────────────────
// Max 60 game actions per minute per IP
const gameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: "Slow down! Max 60 game actions per minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter, gameLimiter };
