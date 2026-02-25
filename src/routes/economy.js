const express = require("express");
const { prisma } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const GrowthEngine = require("../engines/GrowthEngine");

const router = express.Router();

// All economy routes require authentication
router.use(authMiddleware);

// ── GET /economy/balance ─────────────────────────────
// Get all currency balances
router.get("/balance", async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        coins: true,
        pearls: true,
        essence: true,
        zoolaBalance: true,
        playerLevel: true,
        totalXp: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      balance: {
        coins: user.coins,
        pearls: user.pearls,
        essence: user.essence,
        zoola: user.zoolaBalance,
        playerLevel: user.playerLevel,
        totalXp: user.totalXp,
      },
    });
  } catch (error) {
    console.error("Balance error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch balance",
    });
  }
});

// ── POST /economy/sell-fish ──────────────────────────
// Sell an adult fish for coins
router.post("/sell-fish", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fishId } = req.body;

    if (!fishId) {
      return res.status(400).json({
        success: false,
        error: "fishId is required",
      });
    }

    // Get fish
    const fish = await prisma.fish.findFirst({
      where: { id: fishId, userId, alive: true },
    });

    if (!fish) {
      return res.status(404).json({
        success: false,
        error: "Fish not found",
      });
    }

    // Only adult fish can be sold
    if (fish.growthStage !== "adult") {
      return res.status(400).json({
        success: false,
        error: `Fish is still a ${fish.growthStage} — wait for it to grow!`,
      });
    }

    // Calculate sell value
    const sellValue =
      fish.sellValue ||
      GrowthEngine.calculateSellValue(fish.species, fish.rarity);

    // Mark fish as sold (not alive)
    await prisma.fish.update({
      where: { id: fishId },
      data: { alive: false },
    });

    // Add coins to user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: sellValue },
        totalXp: { increment: 10 }, // XP for selling
      },
      select: { coins: true, totalXp: true, playerLevel: true },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "fish_sold",
        properties: {
          fishId,
          species: fish.species,
          rarity: fish.rarity,
          sellValue,
        },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.json({
      success: true,
      coinsEarned: sellValue,
      newBalance: {
        coins: updatedUser.coins,
        totalXp: updatedUser.totalXp,
      },
      message: `Sold ${fish.species} for ${sellValue} coins!`,
    });
  } catch (error) {
    console.error("Sell fish error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to sell fish",
    });
  }
});

// ── POST /shop/buy-egg ───────────────────────────────
// Buy a fish egg from Rohan the Trader
router.post("/buy-egg", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { species, tankId } = req.body;

    if (!species || !tankId) {
      return res.status(400).json({
        success: false,
        error: "species and tankId are required",
      });
    }

    // Egg prices per species
    const eggPrices = {
      silverfin: 20,
      bubbletail: 40,
      glowling: 80,
      ember_carp: 100,
      crystal_carp: 200,
      moonfish: 250,
      spirit_lotus: 1000,
    };

    const speciesKey = species.toLowerCase().replace(" ", "_");
    const price = eggPrices[speciesKey];

    if (!price) {
      return res.status(400).json({
        success: false,
        error: `Unknown species: ${species}`,
      });
    }

    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coins: true },
    });

    // Check if user has enough coins
    if (user.coins < price) {
      return res.status(400).json({
        success: false,
        error: `Not enough coins! Need ${price}, have ${user.coins}`,
      });
    }

    // Check tank exists
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Rarity per species
    const speciesRarity = {
      silverfin: "common",
      bubbletail: "uncommon",
      glowling: "rare",
      ember_carp: "rare",
      crystal_carp: "epic",
      moonfish: "epic",
      spirit_lotus: "legendary",
    };

    // Deduct coins
    await prisma.user.update({
      where: { id: userId },
      data: { coins: { decrement: price } },
    });

    // Create fish egg in tank
    const newFish = await prisma.fish.create({
      data: {
        tankId,
        userId,
        species,
        rarity: speciesRarity[speciesKey] || "common",
        hunger: 80,
        health: 100,
        growthStage: "egg",
        growthProgress: 0,
        hatchedAt: new Date(),
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "egg_purchased",
        properties: { species, price, fishId: newFish.id },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.status(201).json({
      success: true,
      fish: {
        id: newFish.id,
        species: newFish.species,
        rarity: newFish.rarity,
        growthStage: newFish.growthStage,
      },
      coinsSpent: price,
      message: `Bought ${species} egg for ${price} coins!`,
    });
  } catch (error) {
    console.error("Buy egg error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to buy egg",
    });
  }
});

module.exports = router;
