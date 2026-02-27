const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/db");
const { sendOTP, verifyOTP } = require("../utils/otp");

const router = express.Router();

// ── Helper: Generate JWT Token ───────────────────────
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// ── Helper: Validate email format ────────────────────
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ── POST /auth/guest ─────────────────────────────────
router.post("/guest", async (req, res) => {
  try {
    const guestToken = crypto.randomBytes(32).toString("hex");

    const user = await prisma.user.create({
      data: {
        guestToken,
        displayName: "Fisher Guardian",
        coins: 100,
        pearls: 0,
        essence: 0,
      },
    });

    const token = generateToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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
// Register with email + password
router.post("/register", async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName } = req.body;

    // ── Validate email format ────────────────────────
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // ── Validate password ────────────────────────────
    if (!password) {
      return res.status(400).json({
        success: false,
        error: "Password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 6 characters",
      });
    }

    // ── Check passwords match ────────────────────────
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Passwords do not match",
      });
    }

    // ── Check email already exists ───────────────────
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Email already registered",
      });
    }

    // ── Hash password ────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Create user ──────────────────────────────────
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        displayName: displayName || "Fisher Guardian",
        coins: 100,
        pearls: 0,
        essence: 0,
      },
    });

    const token = generateToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

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
// Login with email + password
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate inputs ──────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // ── Find user ────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Email not found",
      });
    }

    // ── Check password ───────────────────────────────
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: "This account uses a different login method",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: "Wrong password",
      });
    }

    // ── Generate token ───────────────────────────────
    const token = generateToken(user.id);

    // ── Update last login ────────────────────────────
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // ── Create session ───────────────────────────────
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

// ── POST /auth/send-otp ──────────────────────────────
// Send OTP to email for verification
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    const result = await sendOTP(email);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to send OTP",
      });
    }

    res.json({
      success: true,
      message: `OTP sent to ${email} — expires in 10 minutes`,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send OTP",
    });
  }
});

// ── POST /auth/verify-otp ────────────────────────────
// Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: "Email and code are required",
      });
    }

    const result = await verifyOTP(email, code);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify OTP",
    });
  }
});
module.exports = router;
