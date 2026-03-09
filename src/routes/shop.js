// ── shop.js ────────────────────────────────────────────────────────
// Handles: fish spawn list, store items, unified purchase, pearl rewards
// ──────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

router.use(auth);

// ── FISH CATALOGUE ─────────────────────────────────────────────────
const FISH_CATALOGUE = {
  silverfin: {
    species: "silverfin",
    rarity: "common",
    price: 20,
    sellValue: 10,
    growTime: 5,
    tier: 1,
  },
  bubbletail: {
    species: "bubbletail",
    rarity: "uncommon",
    price: 40,
    sellValue: 25,
    growTime: 10,
    tier: 1,
  },
  glowling: {
    species: "glowling",
    rarity: "rare",
    price: 80,
    sellValue: 60,
    growTime: 20,
    tier: 2,
  },
  ember_carp: {
    species: "ember_carp",
    rarity: "rare",
    price: 100,
    sellValue: 60,
    growTime: 25,
    tier: 2,
  },
  crystal_carp: {
    species: "crystal_carp",
    rarity: "epic",
    price: 200,
    sellValue: 150,
    growTime: 40,
    tier: 3,
  },
  moonfish: {
    species: "moonfish",
    rarity: "epic",
    price: 250,
    sellValue: 150,
    growTime: 45,
    tier: 3,
  },
  spirit_lotus: {
    species: "spirit_lotus",
    rarity: "legendary",
    price: 1000,
    sellValue: 500,
    growTime: 120,
    tier: 4,
  },
};

// ── STORE CATALOGUE ────────────────────────────────────────────────
const STORE_ITEMS = {
  // Fish Eggs
  egg_silverfin: {
    id: "egg_silverfin",
    category: "egg",
    name: "Silverfin Egg",
    species: "silverfin",
    currency: "coins",
    price: 20,
    description: "Common fish. Perfect for beginners.",
  },
  egg_bubbletail: {
    id: "egg_bubbletail",
    category: "egg",
    name: "Bubbletail Egg",
    species: "bubbletail",
    currency: "coins",
    price: 40,
    description: "Uncommon fish with bubble tail fins.",
  },
  egg_glowling: {
    id: "egg_glowling",
    category: "egg",
    name: "Glowling Egg",
    species: "glowling",
    currency: "coins",
    price: 80,
    description: "Rare glowing fish. Lights up your tank.",
  },
  egg_ember_carp: {
    id: "egg_ember_carp",
    category: "egg",
    name: "Ember Carp Egg",
    species: "ember_carp",
    currency: "coins",
    price: 100,
    description: "Rare fiery carp with ember markings.",
  },
  egg_crystal_carp: {
    id: "egg_crystal_carp",
    category: "egg",
    name: "Crystal Carp Egg",
    species: "crystal_carp",
    currency: "coins",
    price: 200,
    description: "Epic crystal fish. Highly valuable.",
  },
  egg_moonfish: {
    id: "egg_moonfish",
    category: "egg",
    name: "Moonfish Egg",
    species: "moonfish",
    currency: "coins",
    price: 250,
    description: "Epic moonlit fish. Glows at night.",
  },
  egg_spirit_lotus: {
    id: "egg_spirit_lotus",
    category: "egg",
    name: "Spirit Lotus Egg",
    species: "spirit_lotus",
    currency: "pearls",
    price: 50,
    description: "Legendary. The rarest fish in the Blue Tank.",
  },

  // Medicine
  med_basic: {
    id: "med_basic",
    category: "medicine",
    name: "Basic Medicine",
    currency: "coins",
    price: 30,
    healAmount: 30,
    description: "Restores 30 HP to a sick fish.",
  },
  med_super: {
    id: "med_super",
    category: "medicine",
    name: "Super Medicine",
    currency: "coins",
    price: 80,
    healAmount: 100,
    description: "Fully restores a fish to 100 HP.",
  },
  med_pearl: {
    id: "med_pearl",
    category: "medicine",
    name: "Pearl Medicine",
    currency: "pearls",
    price: 5,
    healAmount: 100,
    description: "Premium medicine. Instant full heal + mood boost.",
  },

  // Decorations
  deco_coral: {
    id: "deco_coral",
    category: "decoration",
    name: "Coral Cluster",
    currency: "coins",
    price: 150,
    description: "Adds coral to your tank. Boosts fish mood +5.",
  },
  deco_shipwreck: {
    id: "deco_shipwreck",
    category: "decoration",
    name: "Mini Shipwreck",
    currency: "coins",
    price: 300,
    description: "Mysterious shipwreck decoration. Unique tank centrepiece.",
  },
  deco_castle: {
    id: "deco_castle",
    category: "decoration",
    name: "Sunken Castle",
    currency: "pearls",
    price: 20,
    description: "Premium castle decoration. Makes fish happier.",
  },

  // Tank Upgrades
  upgrade_size: {
    id: "upgrade_size",
    category: "upgrade",
    name: "Tank Expansion",
    currency: "coins",
    price: 500,
    description: "Expand tank size. Allows 2 more fish.",
  },
  upgrade_filter: {
    id: "upgrade_filter",
    category: "upgrade",
    name: "Advanced Filter",
    currency: "coins",
    price: 400,
    description: "Cleanliness decays 50% slower.",
  },
  upgrade_aerator: {
    id: "upgrade_aerator",
    category: "upgrade",
    name: "Auto Aerator",
    currency: "pearls",
    price: 30,
    description: "Oxygen decays 50% slower. Premium upgrade.",
  },
};

// ── MILESTONE REWARDS ──────────────────────────────────────────────
const MILESTONES = [
  {
    id: "first_fish",
    xp: 0,
    coins: 50,
    pearls: 0,
    label: "First Fish Hatched",
  },
  { id: "level_5", xp: 500, coins: 100, pearls: 5, label: "Reached Level 5" },
  {
    id: "level_10",
    xp: 1000,
    coins: 200,
    pearls: 10,
    label: "Reached Level 10",
  },
  { id: "first_rare", xp: 0, coins: 150, pearls: 5, label: "First Rare Fish" },
  { id: "first_epic", xp: 0, coins: 300, pearls: 15, label: "First Epic Fish" },
  {
    id: "first_legend",
    xp: 0,
    coins: 500,
    pearls: 50,
    label: "First Legendary Fish",
  },
  { id: "sell_10_fish", xp: 0, coins: 200, pearls: 10, label: "Sold 10 Fish" },
  { id: "tank_full", xp: 0, coins: 100, pearls: 5, label: "Full Tank" },
];

// ════════════════════════════════════════════════════════════════════
// GET /shop/fish-list
// Returns all fish currently in the player's tank — for Unity to spawn
// ════════════════════════════════════════════════════════════════════
router.get("/fish-list", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tankId } = req.query;

    if (!tankId) {
      return res
        .status(400)
        .json({ success: false, error: "tankId is required" });
    }

    const tank = await prisma.tank.findFirst({ where: { id: tankId, userId } });
    if (!tank)
      return res.status(404).json({ success: false, error: "Tank not found" });

    // Get all ALIVE fish in this tank
    const fish = await prisma.fish.findMany({
      where: { tankId, userId, alive: true },
      orderBy: { createdAt: "asc" },
    });

    // Enrich with catalogue data for Unity
    const spawnList = fish.map((f) => ({
      id: f.id,
      species: f.species,
      rarity: f.rarity,
      growthStage: f.growthStage,
      growthProgress: f.growthProgress,
      hunger: f.hunger,
      health: f.health,
      mood: f.mood,
      trait: f.trait,
      // Catalogue data Unity needs for animations/sprites
      tier: FISH_CATALOGUE[f.species]?.tier || 1,
      sellValue: FISH_CATALOGUE[f.species]?.sellValue || 10,
      canSell: f.growthStage === "adult",
      // Status flags Unity can use to trigger animations
      isStressed: f.hunger < 20 || f.health < 30,
      isHungry: f.hunger < 40,
      isHealthy: f.health >= 80,
    }));

    res.json({
      success: true,
      tankId,
      fishCount: spawnList.length,
      spawnList,
    });
  } catch (error) {
    console.error("Fish list error:", error);
    res.status(500).json({ success: false, error: "Failed to get fish list" });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /shop/items
// Returns full store catalogue for Unity shop UI
// Optional: ?category=egg|medicine|decoration|upgrade
// ════════════════════════════════════════════════════════════════════
router.get("/items", async (req, res) => {
  try {
    const { category } = req.query;

    let items = Object.values(STORE_ITEMS);
    if (category) {
      items = items.filter((i) => i.category === category);
    }

    // Group by category for Unity shop tabs
    const grouped = {
      eggs: items.filter((i) => i.category === "egg"),
      medicine: items.filter((i) => i.category === "medicine"),
      decorations: items.filter((i) => i.category === "decoration"),
      upgrades: items.filter((i) => i.category === "upgrade"),
    };

    res.json({
      success: true,
      items: category ? items : grouped,
      total: items.length,
    });
  } catch (error) {
    console.error("Shop items error:", error);
    res.status(500).json({ success: false, error: "Failed to get shop items" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /shop/purchase
// Unified purchase endpoint for all item types
// Body: { itemId, tankId?, fishId? }
// ════════════════════════════════════════════════════════════════════
router.post("/purchase", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemId, tankId, fishId } = req.body;

    if (!itemId) {
      return res
        .status(400)
        .json({ success: false, error: "itemId is required" });
    }

    const item = STORE_ITEMS[itemId];
    if (!item) {
      return res
        .status(404)
        .json({ success: false, error: `Item "${itemId}" not found in store` });
    }

    // Get player
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    // Check balance
    const balance = item.currency === "coins" ? user.coins : user.pearls;
    if (balance < item.price) {
      return res.status(400).json({
        success: false,
        error: `Not enough ${item.currency}. Need ${item.price}, have ${balance}.`,
        required: item.price,
        have: balance,
        currency: item.currency,
      });
    }

    // Deduct currency
    const deductField =
      item.currency === "coins"
        ? { coins: user.coins - item.price }
        : { pearls: user.pearls - item.price };
    await prisma.user.update({ where: { id: userId }, data: deductField });

    let result = {};

    // ── EGG PURCHASE ────────────────────────────────────────────────
    if (item.category === "egg") {
      if (!tankId)
        return res
          .status(400)
          .json({ success: false, error: "tankId required for egg purchase" });

      const tank = await prisma.tank.findFirst({
        where: { id: tankId, userId },
      });
      if (!tank)
        return res
          .status(404)
          .json({ success: false, error: "Tank not found" });

      const fishCount = await prisma.fish.count({
        where: { tankId, userId, alive: true },
      });
      const maxFish = 5 + ((tank.size || 1) - 1) * 2;
      if (fishCount >= maxFish) {
        // Refund
        await prisma.user.update({
          where: { id: userId },
          data: { [item.currency === "coins" ? "coins" : "pearls"]: balance },
        });
        return res
          .status(400)
          .json({
            success: false,
            error: `Tank full! Max ${maxFish} fish. Upgrade tank to add more.`,
          });
      }

      const catalogue = FISH_CATALOGUE[item.species];
      const fish = await prisma.fish.create({
        data: {
          userId,
          tankId,
          species: item.species,
          rarity: catalogue.rarity,
          growthStage: "egg",
          growthProgress: 0,
          hunger: 50,
          health: 100,
          mood: 80,
          alive: true,
        },
      });

      result = {
        type: "egg",
        fish: {
          id: fish.id,
          species: fish.species,
          rarity: fish.rarity,
          growthStage: "egg",
        },
        message: `Bought ${item.name} for ${item.price} ${item.currency}!`,
      };

      // ── MEDICINE PURCHASE ───────────────────────────────────────────
    } else if (item.category === "medicine") {
      if (!fishId)
        return res
          .status(400)
          .json({
            success: false,
            error: "fishId required for medicine purchase",
          });

      const fish = await prisma.fish.findFirst({
        where: { id: fishId, userId, alive: true },
      });
      if (!fish)
        return res
          .status(404)
          .json({ success: false, error: "Fish not found" });

      const newHealth = Math.min(100, fish.health + item.healAmount);
      const newMood = Math.min(100, (fish.mood || 80) + 10);

      await prisma.fish.update({
        where: { id: fishId },
        data: { health: newHealth, mood: newMood },
      });

      result = {
        type: "medicine",
        fish: { id: fishId, health: newHealth, mood: newMood },
        healedBy: newHealth - fish.health,
        message: `Used ${item.name}! Fish health: ${fish.health} → ${newHealth}`,
      };

      // ── DECORATION PURCHASE ─────────────────────────────────────────
    } else if (item.category === "decoration") {
      if (!tankId)
        return res
          .status(400)
          .json({
            success: false,
            error: "tankId required for decoration purchase",
          });

      await prisma.inventory.create({
        data: {
          userId,
          itemType: "decoration",
          itemId: item.id,
          metadata: JSON.stringify({ name: item.name, equippedTankId: tankId }),
        },
      });

      // Boost fish mood in tank
      await prisma.fish.updateMany({
        where: { tankId, userId, alive: true },
        data: { mood: { increment: 5 } },
      });

      result = {
        type: "decoration",
        itemId: item.id,
        name: item.name,
        message: `${item.name} added to tank! Fish are happier.`,
      };

      // ── UPGRADE PURCHASE ────────────────────────────────────────────
    } else if (item.category === "upgrade") {
      if (!tankId)
        return res
          .status(400)
          .json({ success: false, error: "tankId required for upgrade" });

      const tank = await prisma.tank.findFirst({
        where: { id: tankId, userId },
      });
      if (!tank)
        return res
          .status(404)
          .json({ success: false, error: "Tank not found" });

      let updateData = {};
      let upgradeMsg = "";

      if (item.id === "upgrade_size") {
        updateData = { size: (tank.size || 1) + 1 };
        upgradeMsg = `Tank expanded! Now fits ${5 + tank.size * 2} fish.`;
      } else if (item.id === "upgrade_filter") {
        updateData = { themeSkin: (tank.themeSkin || "") + "|filter" };
        upgradeMsg = "Advanced Filter installed! Cleanliness decays slower.";
      } else if (item.id === "upgrade_aerator") {
        updateData = { themeSkin: (tank.themeSkin || "") + "|aerator" };
        upgradeMsg = "Auto Aerator installed! Oxygen decays slower.";
      }

      await prisma.tank.update({ where: { id: tankId }, data: updateData });
      await prisma.inventory.create({
        data: {
          userId,
          itemType: "upgrade",
          itemId: item.id,
          metadata: JSON.stringify({ tankId }),
        },
      });

      result = {
        type: "upgrade",
        itemId: item.id,
        message: upgradeMsg,
      };
    }

    // Get updated balance
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });

    res.json({
      success: true,
      ...result,
      spent: { amount: item.price, currency: item.currency },
      newBalance: { coins: updatedUser.coins, pearls: updatedUser.pearls },
    });
  } catch (error) {
    console.error("Purchase error:", error);
    res.status(500).json({ success: false, error: "Purchase failed" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /shop/daily-login
// Claim daily login pearl reward
// ════════════════════════════════════════════════════════════════════
router.post("/daily-login", async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    const now = new Date();
    const lastLogin = user.lastDailyLogin
      ? new Date(user.lastDailyLogin)
      : null;
    const hoursSince = lastLogin ? (now - lastLogin) / 3600000 : 999;

    if (hoursSince < 20) {
      const hoursLeft = Math.ceil(20 - hoursSince);
      return res.status(400).json({
        success: false,
        error: `Daily reward already claimed. Come back in ${hoursLeft} hour(s).`,
        hoursLeft,
      });
    }

    // Calculate streak
    const streak = hoursSince < 48 ? (user.loginStreak || 0) + 1 : 1;
    const pearlReward = streak >= 7 ? 10 : streak >= 3 ? 5 : 2;
    const coinReward = streak >= 7 ? 50 : streak >= 3 ? 25 : 10;

    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: coinReward },
        pearls: { increment: pearlReward },
        loginStreak: streak,
        lastDailyLogin: now,
      },
    });

    res.json({
      success: true,
      reward: { coins: coinReward, pearls: pearlReward },
      streak,
      nextReward:
        streak < 3
          ? "Keep logging in for 3 days for bigger rewards!"
          : streak < 7
            ? "7-day streak unlocks max rewards!"
            : "Max streak! Keep it up!",
      message: `Day ${streak} login! +${coinReward} coins, +${pearlReward} pearls`,
    });
  } catch (error) {
    console.error("Daily login error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to claim daily reward" });
  }
});

// ════════════════════════════════════════════════════════════════════
// POST /shop/claim-milestone
// Claim a milestone pearl/coin reward
// Body: { milestoneId }
// ════════════════════════════════════════════════════════════════════
router.post("/claim-milestone", async (req, res) => {
  try {
    const userId = req.user.userId;
    const { milestoneId } = req.body;

    if (!milestoneId)
      return res
        .status(400)
        .json({ success: false, error: "milestoneId is required" });

    const milestone = MILESTONES.find((m) => m.id === milestoneId);
    if (!milestone)
      return res
        .status(404)
        .json({ success: false, error: "Milestone not found" });

    // Check if already claimed
    const alreadyClaimed = await prisma.analyticsEvent.findFirst({
      where: { userId, eventName: `milestone_claimed_${milestoneId}` },
    });

    if (alreadyClaimed) {
      return res
        .status(400)
        .json({ success: false, error: "Milestone already claimed!" });
    }

    // Give reward
    await prisma.user.update({
      where: { id: userId },
      data: {
        coins: { increment: milestone.coins },
        pearls: { increment: milestone.pearls },
      },
    });

    // Record claim
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventName: `milestone_claimed_${milestoneId}`,
        metadata: JSON.stringify(milestone),
      },
    });

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });

    res.json({
      success: true,
      milestone: milestone.label,
      reward: { coins: milestone.coins, pearls: milestone.pearls },
      newBalance: { coins: updatedUser.coins, pearls: updatedUser.pearls },
      message: `Milestone unlocked: ${milestone.label}! +${milestone.coins} coins, +${milestone.pearls} pearls`,
    });
  } catch (error) {
    console.error("Milestone error:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to claim milestone" });
  }
});

// ════════════════════════════════════════════════════════════════════
// GET /shop/milestones
// Get all milestones + which ones are claimed
// ════════════════════════════════════════════════════════════════════
router.get("/milestones", async (req, res) => {
  try {
    const userId = req.user.userId;

    const claimedEvents = await prisma.analyticsEvent.findMany({
      where: { userId, eventName: { startsWith: "milestone_claimed_" } },
    });

    const claimedIds = claimedEvents.map((e) =>
      e.eventName.replace("milestone_claimed_", ""),
    );

    const milestones = MILESTONES.map((m) => ({
      ...m,
      claimed: claimedIds.includes(m.id),
    }));

    res.json({ success: true, milestones });
  } catch (error) {
    console.error("Milestones error:", error);
    res.status(500).json({ success: false, error: "Failed to get milestones" });
  }
});

module.exports = router;
module.exports.FISH_CATALOGUE = FISH_CATALOGUE;
module.exports.STORE_ITEMS = STORE_ITEMS;
