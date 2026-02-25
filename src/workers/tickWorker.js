// ── Tick Worker ──────────────────────────────────────
// Runs every 60 seconds
// Updates: fish growth, dirt accumulation, oxygen decay
// From architecture doc:
// Dirt: +1 every 15 seconds = +4 per minute
// Oxygen: -2 per minute (natural decay)

const { prisma } = require("../config/db");
const GrowthEngine = require("../engines/GrowthEngine");
const CleanEngine = require("../engines/CleanEngine");

const TICK_INTERVAL_MS = 60 * 1000; // 60 seconds
const DIRT_PER_MINUTE = 4; // +1 every 15 sec = +4/min
const OXYGEN_DECAY_PER_MINUTE = 2; // natural oxygen loss

async function runTick() {
  try {
    console.log("⏱️  Running game tick...");

    // Get all tanks
    const tanks = await prisma.tank.findMany({
      include: {
        fish: { where: { alive: true } },
      },
    });

    for (const tank of tanks) {
      const now = new Date();

      // Calculate minutes since last tick
      const lastTick = tank.lastDirtTick || tank.createdAt;
      const minutesPassed = (now - new Date(lastTick)) / 60000;

      if (minutesPassed < 0.5) continue; // skip if less than 30 sec

      // ── 1. Oxygen decay ──────────────────────────
      const newOxygen = Math.max(
        0,
        tank.oxygenLevel - OXYGEN_DECAY_PER_MINUTE * minutesPassed,
      );

      // ── 2. Dirt accumulation ─────────────────────
      const newCleanliness = Math.max(
        0,
        tank.cleanliness - DIRT_PER_MINUTE * minutesPassed,
      );

      // ── 3. Update tank ───────────────────────────
      await prisma.tank.update({
        where: { id: tank.id },
        data: {
          oxygenLevel: Math.round(newOxygen),
          cleanliness: Math.round(newCleanliness),
          lastDirtTick: now,
          lastO2Tick: now,
        },
      });

      // ── 4. Update each fish ──────────────────────
      for (const fish of tank.fish) {
        // Skip adult fish (already fully grown)
        if (fish.growthStage === "adult") {
          // Adult fish produce coins
          await prisma.user.update({
            where: { id: fish.userId },
            data: { coins: { increment: 1 } },
          });
          continue;
        }

        // Calculate new growth progress
        const newProgress = GrowthEngine.calculateGrowthProgress(
          fish,
          tank,
          minutesPassed,
        );

        let newStage = fish.growthStage;
        let newProgressFinal = newProgress;

        // Check if fish should advance stage
        if (GrowthEngine.shouldAdvanceStage(newProgress)) {
          newStage = GrowthEngine.getNextStage(fish.growthStage);
          newProgressFinal = 0; // reset progress for next stage

          console.log(`🐟 Fish ${fish.species} advanced to ${newStage}!`);
        }

        // Calculate sell value if just became adult
        const sellValue =
          newStage === "adult"
            ? GrowthEngine.calculateSellValue(fish.species, fish.rarity)
            : fish.sellValue;

        // Reduce hunger over time
        const newHunger = Math.max(0, fish.hunger - 2 * minutesPassed);

        // Reduce health if toxic water
        let newHealth = fish.health;
        if (CleanEngine.isFishTakingDamage(newCleanliness)) {
          newHealth = Math.max(0, fish.health - 5);
        }

        // Update fish
        await prisma.fish.update({
          where: { id: fish.id },
          data: {
            growthProgress: Math.round(newProgressFinal),
            growthStage: newStage,
            hunger: Math.round(newHunger),
            health: Math.round(newHealth),
            sellValue,
            maturedAt: newStage === "adult" ? now : fish.maturedAt,
          },
        });
      }
    }

    console.log(`✅ Tick complete — processed ${tanks.length} tanks`);
  } catch (error) {
    console.error("❌ Tick error:", error);
  }
}

function startTickWorker() {
  console.log("⏱️  Tick worker started — runs every 60 seconds");
  runTick(); // run immediately on start
  setInterval(runTick, TICK_INTERVAL_MS);
}

module.exports = { startTickWorker, runTick };
