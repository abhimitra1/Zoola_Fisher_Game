const express = require("express");
const { prisma } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");

const router = express.Router();

router.use(authMiddleware);

// ── GET /cosmetics/owned ─────────────────────────────
// List all cosmetics owned by player
router.get("/owned", async (req, res) => {
  try {
    const userId = req.user.userId;

    const cosmetics = await prisma.inventory.findMany({
      where: {
        userId,
        itemType: "cosmetic",
      },
    });

    res.json({
      success: true,
      cosmetics: cosmetics.map((c) => ({
        id: c.id,
        itemId: c.itemId,
        isEquipped: c.isEquipped,
        nftTokenId: c.nftTokenId,
        acquiredAt: c.acquiredAt,
      })),
      total: cosmetics.length,
    });
  } catch (error) {
    console.error("Get cosmetics error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cosmetics",
    });
  }
});

// ── POST /cosmetics/claim ────────────────────────────
// Claim a cosmetic — queues NFT mint on Avalanche
router.post("/claim", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cosmeticId } = req.body;

    if (!cosmeticId) {
      return res.status(400).json({
        success: false,
        error: "cosmeticId is required",
      });
    }

    // Generate idempotency key — prevents double minting
    const idempotencyKey = crypto
      .createHash("sha256")
      .update(`${userId}-${cosmeticId}-${Date.now()}`)
      .digest("hex");

    // Check if already claimed
    const existing = await prisma.inventory.findFirst({
      where: { userId, itemId: cosmeticId, itemType: "cosmetic" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "You already own this cosmetic",
      });
    }

    // Add to inventory (off-chain first)
    const cosmetic = await prisma.inventory.create({
      data: {
        userId,
        itemType: "cosmetic",
        itemId: cosmeticId,
        quantity: 1,
        isEquipped: false,
      },
    });

    // Queue blockchain mint (async — does not block gameplay)
    await prisma.txQueue.create({
      data: {
        userId,
        action: "mint_nft",
        payload: { cosmeticId, inventoryId: cosmetic.id },
        status: "pending",
        idempotencyKey,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "cosmetic_claimed",
        properties: { cosmeticId },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.status(201).json({
      success: true,
      cosmetic: {
        id: cosmetic.id,
        itemId: cosmeticId,
        status: "claimed",
      },
      blockchain: {
        status: "pending",
        message: "NFT mint queued — will confirm shortly",
      },
    });
  } catch (error) {
    console.error("Claim cosmetic error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to claim cosmetic",
    });
  }
});

// ── POST /cosmetics/equip ────────────────────────────
// Equip a cosmetic to tank
router.post("/equip", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cosmeticId, tankId } = req.body;

    if (!cosmeticId || !tankId) {
      return res.status(400).json({
        success: false,
        error: "cosmeticId and tankId are required",
      });
    }

    // Check player owns this cosmetic
    const cosmetic = await prisma.inventory.findFirst({
      where: { userId, itemId: cosmeticId, itemType: "cosmetic" },
    });

    if (!cosmetic) {
      return res.status(404).json({
        success: false,
        error: "You do not own this cosmetic",
      });
    }

    // Check tank belongs to player
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Unequip all other cosmetics first
    await prisma.inventory.updateMany({
      where: { userId, itemType: "cosmetic" },
      data: { isEquipped: false },
    });

    // Equip this cosmetic
    await prisma.inventory.update({
      where: { id: cosmetic.id },
      data: { isEquipped: true },
    });

    // Apply to tank
    await prisma.tank.update({
      where: { id: tankId },
      data: { themeSkin: cosmeticId },
    });

    res.json({
      success: true,
      message: `Cosmetic ${cosmeticId} equipped to tank!`,
      tank: { id: tankId, themeSkin: cosmeticId },
    });
  } catch (error) {
    console.error("Equip cosmetic error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to equip cosmetic",
    });
  }
});

// ── GET /cosmetics/status/:claimId ───────────────────
// Check NFT mint status
router.get("/status/:claimId", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { claimId } = req.params;

    const tx = await prisma.txQueue.findFirst({
      where: { id: claimId, userId },
    });

    if (!tx) {
      return res.status(404).json({
        success: false,
        error: "Claim not found",
      });
    }

    res.json({
      success: true,
      claim: {
        id: tx.id,
        status: tx.status,
        txHash: tx.txHash,
        action: tx.action,
        createdAt: tx.createdAt,
        confirmedAt: tx.confirmedAt,
      },
    });
  } catch (error) {
    console.error("Claim status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get claim status",
    });
  }
});

module.exports = router;
