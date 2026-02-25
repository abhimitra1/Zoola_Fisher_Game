// ── Clean Engine ─────────────────────────────────────
// From architecture doc:
// Dirt grows: +1 every 15 seconds
// Each feed adds: +5 dirt
// Overfeeding adds: +20 dirt
// Water change resets cleanliness to 100
// <50 dirty, <25 very dirty, <10 fish take damage

function getCleanlinessStatus(cleanliness) {
  if (cleanliness >= 80) return "clean";
  if (cleanliness >= 50) return "okay";
  if (cleanliness >= 25) return "dirty";
  if (cleanliness >= 10) return "very_dirty";
  return "toxic";
}

function applyFeedDirt(currentCleanliness, overfed = false) {
  const dirtAdded = overfed ? 20 : 5;
  return Math.max(0, currentCleanliness - dirtAdded);
}

function applyWaterChange() {
  // Water change always resets to 100
  return 100;
}

function isFishTakingDamage(cleanliness) {
  return cleanliness < 10;
}

module.exports = {
  getCleanlinessStatus,
  applyFeedDirt,
  applyWaterChange,
  isFishTakingDamage,
};
