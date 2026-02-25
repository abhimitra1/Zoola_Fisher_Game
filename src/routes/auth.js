const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { prisma } = require("../config/db");

const router = express.Router();

// ── Helper: Generate JWT Token ───────────────────────
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── POST /auth/guest ─────────────────────────────────
// Creates a guest account instantly, no email needed
router.post("/guest", async (req, res) => {
  try {
    // Generate unique guest token
    const guestToken = crypto.randomBytes(32).toString("hex");

    // Create user in database
    const user = await prisma.user.create({
      data: {
        guestToken,
        displayName: "Fisher Guardian",
        coins: 100,
        pearls: 0,
        essence: 0,
      },
    });

    // Generate JWT
    const token = generateToken(user.id);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventName: "guest_register",
        properties: { method: "guest" },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        displayName: user.displayName,
        coins: user.coins,
        pearls: user.pearls,
        playerLevel: user.playerLevel,
      },
    });
  } catch (error) {
    console.error("Guest register error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create guest account",
    });
  }
});

// ── POST /auth/register ──────────────────────────────
// Register with email
router.post("/register", async (req, res) => {
  try {
    const { email, displayName } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        displayName: displayName || "Fisher Guardian",
        coins: 100,
        pearls: 0,
        essence: 0,
      },
    });

    // Generate JWT
    const token = generateToken(user.id);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventName: "user_register",
        properties: { method: "email" },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        coins: user.coins,
        pearls: user.pearls,
        playerLevel: user.playerLevel,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to register",
    });
  }
});

// ── POST /auth/login ─────────────────────────────────
// Login with email
router.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Generate new token
    const token = generateToken(user.id);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create new session
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        coins: user.coins,
        pearls: user.pearls,
        playerLevel: user.playerLevel,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to login",
    });
  }
});

module.exports = router;
