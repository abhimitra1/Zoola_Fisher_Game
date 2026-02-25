// ── Feeding Engine ───────────────────────────────────
// From architecture doc:
// Hunger meter: 0-100
// <40 = slow growth, <20 = fish stressed, <10 = HP loss
// Overfeeding: dirt +20, fish health -10
// Feeding limit: 2-3 times/day ideal

const FEED_COOLDOWN_MINUTES = 30;
const HUNGER_PER_FEED = 40;
const OVERFEED_HEALTH_PENALTY = 10;

function canFeed(lastFed) {
  if (!lastFed) return { allowed: true, overfed: false };

  const minutesSinceLastFeed =
    (Date.now() - new Date(lastFed).getTime()) / 60000;

  if (minutesSinceLastFeed < 5) {
    // Fed too recently = overfeeding
    return { allowed: true, overfed: true };
  }

  return { allowed: true, overfed: false };
}

function applyFeeding(fish) {
  const { allowed, overfed } = canFeed(fish.lastFed);

  if (!allowed) {
    return { success: false, reason: "Fish cannot be fed right now" };
  }

  let newHunger = Math.min(100, fish.hunger + HUNGER_PER_FEED);
  let newHealth = fish.health;

  if (overfed) {
    newHealth = Math.max(0, fish.health - OVERFEED_HEALTH_PENALTY);
  }

  return {
    success: true,
    overfed,
    newHunger,
    newHealth,
  };
}

function getHungerStatus(hunger) {
  if (hunger >= 60) return "full";
  if (hunger >= 40) return "okay";
  if (hunger >= 20) return "hungry";
  return "starving";
}

module.exports = {
  canFeed,
  applyFeeding,
  getHungerStatus,
};
