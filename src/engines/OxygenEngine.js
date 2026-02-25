// ── Oxygen Engine ────────────────────────────────────
// From architecture doc:
// Each tap: oxygen = Math.min(100, oxygen + 10)
// Tap spam: if > 6 taps in 1 second → kingfisher_chance += 10%
// Critical: <40 = fish stressed, <20 = +30% Kingfisher chance

// Track tap times per user (in memory)
const tapTracker = {};

function recordTap(userId) {
  const now = Date.now();

  if (!tapTracker[userId]) {
    tapTracker[userId] = [];
  }

  // Keep only taps from last 1 second
  tapTracker[userId] = tapTracker[userId].filter((t) => now - t < 1000);

  // Record this tap
  tapTracker[userId].push(now);

  // Return tap count in last second
  return tapTracker[userId].length;
}

function isSpamming(userId) {
  const tapsInLastSecond = recordTap(userId);
  return tapsInLastSecond > 6;
}

function addOxygen(currentOxygen) {
  // Each tap adds 10, max 100
  return Math.min(100, currentOxygen + 10);
}

function getOxygenStatus(oxygenLevel) {
  if (oxygenLevel >= 70) return "optimal";
  if (oxygenLevel >= 40) return "okay";
  if (oxygenLevel >= 20) return "stressed";
  return "critical";
}

function getKingfisherRisk(oxygenLevel, isSpam) {
  let risk = 0;

  if (oxygenLevel < 20) risk += 30;
  else if (oxygenLevel < 30) risk += 20;

  if (isSpam) risk += 10;

  return risk;
}

module.exports = {
  addOxygen,
  isSpamming,
  getOxygenStatus,
  getKingfisherRisk,
};
