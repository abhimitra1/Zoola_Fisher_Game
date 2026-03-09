// ── profile.js ─────────────────────────────────────────────────────
// GET /user/profile  — player XP, level, progress, stats
// ──────────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const auth = require("../middleware/auth");

router.use(auth);

// XP needed to reach each level
function xpForLevel(level) {
  return level * 100 + (level - 1) * 50;
}

// Total XP needed from level 1 to reach this level
function totalXpForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForLevel(i);
  return total;
}

// Current level from total XP
function levelFromXp(totalXp) {
  let level = 1;
  while (totalXp >= totalXpForLevel(level + 1)) level++;
  return level;
}

// ════════════════════════════════════════════════════════════════════
// GET /user/profile
// Full player profile — Unity home screen
// ════════════════════════════════════════════════════════════════════
router.get("/profile", async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return res.status(404).json({ success: false, error: "User not found" });

    const totalXp = user.totalXp || 0;
    const level = levelFromXp(totalXp);
    const currentXp = totalXp - totalXpForLevel(level);
    const xpNeeded = xpForLevel(level);
    const xpProgress = Math.floor((currentXp / xpNeeded) * 100);

    // Fish stats
    const allFish = await prisma.fish.findMany({ where: { userId } });
    const aliveFish = allFish.filter((f) => f.alive);
    const adultFish = aliveFish.filter((f) => f.growthStage === "adult");
    const totalSold = allFish.filter((f) => !f.alive).length;

    // Tank stats
    const tanks = await prisma.tank.findMany({ where: { userId } });

    res.json({
      success: true,
      profile: {
        id: user.id,
        displayName: user.displayName,
        email: user.email || null,
        playerLevel: level,
        totalXp,
        currentXp,
        xpNeeded,
        xpProgress, // 0-100 for progress bar
        coins: user.coins,
        pearls: user.pearls,
        loginStreak: user.loginStreak || 0,
        lastDailyLogin: user.lastDailyLogin || null,
        canClaimDaily:
          !user.lastDailyLogin ||
          Date.now() - new Date(user.lastDailyLogin) > 20 * 3600000,
        stats: {
          totalFishOwned: aliveFish.length,
          adultFish: adultFish.length,
          totalFishSold: totalSold,
          totalTanks: tanks.length,
          rarityCount: {
            common: aliveFish.filter((f) => f.rarity === "common").length,
            uncommon: aliveFish.filter((f) => f.rarity === "uncommon").length,
            rare: aliveFish.filter((f) => f.rarity === "rare").length,
            epic: aliveFish.filter((f) => f.rarity === "epic").length,
            legendary: aliveFish.filter((f) => f.rarity === "legendary").length,
          },
        },
      },
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ success: false, error: "Failed to get profile" });
  }
});

module.exports = router;
