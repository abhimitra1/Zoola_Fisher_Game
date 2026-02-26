const { sendToUser } = require("../config/socket");
const express = require("express");
const { prisma } = require("../config/db");
const authMiddleware = require("../middleware/auth");
const OxygenEngine = require("../engines/OxygenEngine");
const CleanEngine = require("../engines/CleanEngine");
const FeedingEngine = require("../engines/FeedingEngine");
const KingfisherEngine = require("../engines/KingfisherEngine");

const router = express.Router();

// All game routes require authentication
router.use(authMiddleware);

// ── POST /game/tank/create ───────────────────────────
// Creates the player's first tank
router.post("/tank/create", async (req, res) => {
  try {
    const userId = req.user.userId;

    // Check if user already has a tank
    const existingTank = await prisma.tank.findFirst({
      where: { userId },
    });

    if (existingTank) {
      return res.status(400).json({
        success: false,
        error: "You already have a tank",
      });
    }

    // Create the tank
    const tank = await prisma.tank.create({
      data: {
        userId,
        tankName: "My First Tank",
        tankType: "basic",
        oxygenLevel: 70,
        cleanliness: 100,
        size: 1,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: "tank_created",
        properties: { tankId: tank.id, tankType: "basic" },
        clientVersion: req.headers["x-client-version"] || "1.0.0",
      },
    });

    res.status(201).json({
      success: true,
      tank: {
        id: tank.id,
        tankName: tank.tankName,
        tankType: tank.tankType,
        oxygenLevel: tank.oxygenLevel,
        cleanliness: tank.cleanliness,
        size: tank.size,
        createdAt: tank.createdAt,
      },
    });
  } catch (error) {
    console.error("Tank create error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create tank",
    });
  }
});

// ── GET /game/tank/:id ───────────────────────────────
// Get full tank state including all fish
router.get("/tank/:id", async (req, res) => {
  try {
    const userId = req.user.userId;
    const tankId = req.params.id;

    // Get tank with all fish
    const tank = await prisma.tank.findFirst({
      where: {
        id: tankId,
        userId, // Security: user can only see their own tank
      },
      include: {
        fish: {
          where: { alive: true },
        },
      },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    res.json({
      success: true,
      tank: {
        id: tank.id,
        tankName: tank.tankName,
        tankType: tank.tankType,
        oxygenLevel: tank.oxygenLevel,
        cleanliness: tank.cleanliness,
        size: tank.size,
        themeSkin: tank.themeSkin,
        fish: tank.fish.map((f) => ({
          id: f.id,
          species: f.species,
          rarity: f.rarity,
          hunger: f.hunger,
          health: f.health,
          growthProgress: f.growthProgress,
          growthStage: f.growthStage,
          mood: f.mood,
          trait: f.trait,
        })),
        fishCount: tank.fish.length,
      },
    });
  } catch (error) {
    console.error("Tank fetch error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tank",
    });
  }
});

// ── POST /game/clean ─────────────────────────────────
// Player completes water change mini-game
router.post("/clean", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId } = req.body;

    if (!tankId) {
      return res.status(400).json({
        success: false,
        error: "tankId is required",
      });
    }

    // Get tank
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Reset cleanliness to 100
    const newCleanliness = CleanEngine.applyWaterChange();

    // Save to database
    await prisma.tank.update({
      where: { id: tankId },
      data: {
        cleanliness: newCleanliness,
        lastDirtTick: new Date(),
      },
    });

    res.json({
      success: true,
      cleanliness: {
        level: newCleanliness,
        status: CleanEngine.getCleanlinessStatus(newCleanliness),
      },
    });
  } catch (error) {
    console.error("Clean error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clean tank",
    });
  }
});

// ── POST /game/feed ──────────────────────────────────
// Feed a fish
router.post("/feed", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId, fishId } = req.body;

    if (!tankId || !fishId) {
      return res.status(400).json({
        success: false,
        error: "tankId and fishId are required",
      });
    }

    // Get tank
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Get fish
    const fish = await prisma.fish.findFirst({
      where: { id: fishId, tankId, userId, alive: true },
    });

    if (!fish) {
      return res.status(404).json({
        success: false,
        error: "Fish not found",
      });
    }

    // Apply feeding logic
    const feedResult = FeedingEngine.applyFeeding(fish);

    if (!feedResult.success) {
      return res.status(400).json({
        success: false,
        error: feedResult.reason,
      });
    }

    // Apply dirt to tank
    const newCleanliness = CleanEngine.applyFeedDirt(
      tank.cleanliness,
      feedResult.overfed,
    );

    // Update fish in database
    await prisma.fish.update({
      where: { id: fishId },
      data: {
        hunger: feedResult.newHunger,
        health: feedResult.newHealth,
        lastFed: new Date(),
      },
    });

    // Update tank cleanliness
    await prisma.tank.update({
      where: { id: tankId },
      data: { cleanliness: newCleanliness },
    });

    res.json({
      success: true,
      fish: {
        id: fish.id,
        hunger: feedResult.newHunger,
        health: feedResult.newHealth,
        hungerStatus: FeedingEngine.getHungerStatus(feedResult.newHunger),
        overfed: feedResult.overfed,
      },
      tank: {
        cleanliness: newCleanliness,
        cleanlinessStatus: CleanEngine.getCleanlinessStatus(newCleanliness),
      },
    });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to feed fish",
    });
  }
});
// ── GET /game/kingfisher/status ──────────────────────
// Check current kingfisher threat level
router.get("/kingfisher/status", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId } = req.query;

    if (!tankId) {
      return res.status(400).json({
        success: false,
        error: "tankId is required",
      });
    }

    // Get tank with fish
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
      include: { fish: { where: { alive: true } } },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Calculate attack probability
    const probability = KingfisherEngine.calculateAttackProbability(
      tank,
      tank.fish,
    );

    const warning = KingfisherEngine.getWarningMessage(probability);
    const willAttack = KingfisherEngine.shouldAttack(probability);

    // If attack triggers, push real-time alert to Unity
    if (willAttack && tank.fish.length > 0) {
      // Push via WebSocket instantly
      sendToUser(userId, "kingfisher_attack", {
        tankId,
        message: "ATTACK! Tap Repel now!",
        probability,
        timestamp: new Date().toISOString(),
      });

      return res.json({
        success: true,
        attacking: true,
        probability,
        warning: "ATTACK! Tap Repel now!",
        message: "Kingfisher is diving!",
      });
    }

    res.json({
      success: true,
      attacking: false,
      probability,
      warning,
    });
  } catch (error) {
    console.error("Kingfisher status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check kingfisher status",
    });
  }
});

// ── POST /game/repel-kingfisher ──────────────────────
// Player taps repel button in time
router.post("/repel-kingfisher", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId, success: playerRepelled } = req.body;

    if (!tankId) {
      return res.status(400).json({
        success: false,
        error: "tankId is required",
      });
    }

    // Get tank with fish
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
      include: { fish: { where: { alive: true } } },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Player repelled successfully
    if (playerRepelled) {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventName: "kingfisher_repelled",
          properties: { tankId },
          clientVersion: req.headers["x-client-version"] || "1.0.0",
        },
      });

      return res.json({
        success: true,
        fishSafe: true,
        message: "Kingfisher repelled! Your fish are safe!",
      });
    }

    // Player failed — kingfisher steals a fish
    const stolenFish = KingfisherEngine.selectFishToSteal(tank.fish);

    if (stolenFish) {
      // Mark fish as not alive
      await prisma.fish.update({
        where: { id: stolenFish.id },
        data: { alive: false },
      });

      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventName: "kingfisher_attack_success",
          properties: {
            tankId,
            stolenFishId: stolenFish.id,
            species: stolenFish.species,
          },
          clientVersion: req.headers["x-client-version"] || "1.0.0",
        },
      });

      return res.json({
        success: true,
        fishSafe: false,
        stolenFish: {
          id: stolenFish.id,
          species: stolenFish.species,
          rarity: stolenFish.rarity,
        },
        message: `Kingfisher stole your ${stolenFish.species}!`,
      });
    }

    res.json({
      success: true,
      fishSafe: true,
      message: "No adult fish to steal this time!",
    });
  } catch (error) {
    console.error("Repel kingfisher error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process kingfisher event",
    });
  }
});
module.exports = router;

// ── POST /game/oxygen/add ────────────────────────────
// Player taps to add oxygen
router.post("/oxygen/add", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId } = req.body;

    if (!tankId) {
      return res.status(400).json({
        success: false,
        error: "tankId is required",
      });
    }

    // Get tank
    const tank = await prisma.tank.findFirst({
      where: { id: tankId, userId },
    });

    if (!tank) {
      return res.status(404).json({
        success: false,
        error: "Tank not found",
      });
    }

    // Check tap spam
    const spam = OxygenEngine.isSpamming(userId);

    // Calculate new oxygen
    const newOxygen = OxygenEngine.addOxygen(tank.oxygenLevel);

    // Get status and kingfisher risk
    const status = OxygenEngine.getOxygenStatus(newOxygen);
    const kingfisherRisk = OxygenEngine.getKingfisherRisk(newOxygen, spam);

    // Save to database
    await prisma.tank.update({
      where: { id: tankId },
      data: {
        oxygenLevel: newOxygen,
        lastO2Tick: new Date(),
      },
    });

    res.json({
      success: true,
      oxygen: {
        level: newOxygen,
        status,
        kingfisherRisk,
        spamDetected: spam,
      },
    });
  } catch (error) {
    console.error("Oxygen add error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add oxygen",
    });
  }
});
