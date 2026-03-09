// ── fish.js ────────────────────────────────────────────────────────
// Fish collection management
// GET  /fish/collection       — all fish player ever owned
// POST /fish/sell             — sell fish (marks as sold)
// POST /fish/move-to-reserve  — move fish from tank → reserve
// POST /fish/move-to-tank     — move fish from reserve → tank
// ──────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

router.use(auth);

const SELL_VALUES = {
  common: 10,
  uncommon: 25,
  rare: 60,
  epic: 150,
  legendary: 500,
};

// ════════════════════════════════════════════════════════════════════
// GET /fish/collection
// Returns ALL fish player ever owned grouped by status
// Unity uses this for the collection screen
// ════════════════════════════════════════════════════════════════════
router.get("/collection", async (req, res) => {
  try {
    const userId = req.user.userId;

    const allFish = await prisma.fish.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Group by status
    const inTank = allFish.filter((f) => f.status === "in_tank");
    const reserve = allFish.filter((f) => f.status === "reserve");
    const sold = allFish.filter((f) => f.status === "sold");
    const dead = allFish.filter((f) => f.status === "dead");

    // Enrich each fish with sell value
    const enrich = (fish) =>
      fish.map((f) => ({
        id: f.id,
        species: f.species,
        rarity: f.rarity,
        growthStage: f.growthStage,
        growthProgress: f.growthProgress,
        hunger: f.hunger,
        health: f.health,
        mood: f.mood,
        trait: f.trait,
        status: f.status,
        tankId: f.tankId,
        sellValue: SELL_VALUES[f.rarity] || 10,
        canSell: f.growthStage === "adult" && f.status === "in_tank",
        canMove: f.status === "in_tank" || f.status === "reserve",
        createdAt: f.createdAt,
        hatchedAt: f.hatchedAt,
      }));

    res.json({
      success: true,
      summary: {
        total: allFish.length,
        inTank: inTank.length,
        inReserve: reserve.length,
        sold: sold.length,
        dead: dead.length,
      },
      collection: {
        inTank: enrich(inTank),
        reserve: enrich(reserve),
        sold: enrich(sold),
        dead: enrich(dead),
      },
    });
  } catch (error) {
    console.error("Collection error:", error);
    res.status(500).json({ success: false, error: "Failed to get collection" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /fish/sell
// Sell a fish — marks as sold, adds coins, adds XP
// Body: { fishId }
// ════════════════════════════════════════════════════════════════════
router.post("/sell", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fishId } = req.body;

    if (!fishId)
      return res
        .status(400)
        .json({ success: false, error: "fishId is required" });

    const fish = await prisma.fish.findFirst({
      where: { id: fishId, userId, status: "in_tank" },
    });

    if (!fish)
      return res
        .status(404)
        .json({ success: false, error: "Fish not found or not in tank" });
    if (fish.growthStage !== "adult")
      return res
        .status(400)
        .json({ success: false, error: "Only adult fish can be sold" });

    const sellValue = SELL_VALUES[fish.rarity] || 10;
    const xpGain = 10;

    // Mark fish as sold
    await prisma.fish.update({
      where: { id: fishId },
      data: { status: "sold" },
    });

    // Give coins and XP
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { increment: sellValue }, totalXp: { increment: xpGain } },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });

    res.json({
      success: true,
      fish: {
        id: fishId,
        species: fish.species,
        rarity: fish.rarity,
        status: "sold",
      },
      coinsEarned: sellValue,
      xpEarned: xpGain,
      newBalance: { coins: updatedUser.coins, pearls: updatedUser.pearls },
      message: `Sold ${fish.species} for ${sellValue} coins!`,
    });
  } catch (error) {
    console.error("Sell fish error:", error);
    res.status(500).json({ success: false, error: "Failed to sell fish" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /fish/move-to-reserve
// Move fish from tank → reserve (fish is safe, just resting)
// Body: { fishId }
// ════════════════════════════════════════════════════════════════════
router.post("/move-to-reserve", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fishId } = req.body;

    if (!fishId)
      return res
        .status(400)
        .json({ success: false, error: "fishId is required" });

    const fish = await prisma.fish.findFirst({
      where: { id: fishId, userId, status: "in_tank" },
    });

    if (!fish)
      return res
        .status(404)
        .json({ success: false, error: "Fish not found or not in tank" });

    // Must have at least 1 fish left in tank
    const tankFishCount = await prisma.fish.count({
      where: { tankId: fish.tankId, userId, status: "in_tank" },
    });

    if (tankFishCount <= 1) {
      return res
        .status(400)
        .json({ success: false, error: "Tank must have at least 1 fish" });
    }

    await prisma.fish.update({
      where: { id: fishId },
      data: { status: "reserve" },
    });

    res.json({
      success: true,
      fish: { id: fishId, species: fish.species, status: "reserve" },
      message: `${fish.species} moved to reserve. Fish is safe but not earning coins.`,
    });
  } catch (error) {
    console.error("Move to reserve error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to move fish to reserve" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /fish/move-to-tank
// Move fish from reserve → tank
// Body: { fishId, tankId }
// ════════════════════════════════════════════════════════════════════
router.post("/move-to-tank", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fishId, tankId } = req.body;

    if (!fishId || !tankId)
      return res
        .status(400)
        .json({ success: false, error: "fishId and tankId are required" });

    const fish = await prisma.fish.findFirst({
      where: { id: fishId, userId, status: "reserve" },
    });

    if (!fish)
      return res
        .status(404)
        .json({ success: false, error: "Fish not found or not in reserve" });

    const tank = await prisma.tank.findFirst({ where: { id: tankId, userId } });
    if (!tank)
      return res.status(404).json({ success: false, error: "Tank not found" });

    // Check tank capacity
    const tankFishCount = await prisma.fish.count({
      where: { tankId, userId, status: "in_tank" },
    });

    const maxFish = 5 + ((tank.size || 1) - 1) * 2;

    if (tankFishCount >= maxFish) {
      return res.status(400).json({
        success: false,
        error: `Tank full! Max ${maxFish} fish. Move a fish to reserve first or upgrade tank.`,
        current: tankFishCount,
        max: maxFish,
      });
    }

    await prisma.fish.update({
      where: { id: fishId },
      data: { status: "in_tank", tankId },
    });

    // Get updated tank decay info
    const newCount = tankFishCount + 1;
    const decayRate =
      newCount <= 3
        ? "normal"
        : newCount <= 6
          ? "fast (1.5x)"
          : "very fast (2x)";

    res.json({
      success: true,
      fish: { id: fishId, species: fish.species, status: "in_tank", tankId },
      tankStatus: { fishCount: newCount, maxFish, decayRate },
      message: `${fish.species} moved to tank! Tank now has ${newCount} fish — decay rate: ${decayRate}`,
    });
  } catch (error) {
    console.error("Move to tank error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to move fish to tank" });
  }
});

module.exports = router;
