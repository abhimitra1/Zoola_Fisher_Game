// ── Kingfisher Engine ────────────────────────────────
// From architecture doc:
// Base: 5%
// Oxygen < 30: +20%
// Cleanliness < 35: +20%
// Hunger < 20: +10%
// Tap spam: +10%
// Total capped at 50%

function calculateAttackProbability(tank, fish, spamDetected = false) {
  let probability = 5; // base chance

  // Oxygen check
  if (tank.oxygenLevel < 20) probability += 30;
  else if (tank.oxygenLevel < 30) probability += 20;

  // Cleanliness check
  if (tank.cleanliness < 35) probability += 20;

  // Check if any fish is starving
  const starvingFish = fish.filter((f) => f.hunger < 20);
  if (starvingFish.length > 0) probability += 10;

  // Tap spam
  if (spamDetected) probability += 10;

  // Cap at 50%
  return Math.min(50, probability);
}

function shouldAttack(probability) {
  const roll = Math.random() * 100;
  return roll < probability;
}

function selectFishToSteal(fish) {
  // Kingfisher steals a random alive adult fish
  const adults = fish.filter((f) => f.alive && f.growthStage === "adult");

  if (adults.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * adults.length);
  return adults[randomIndex];
}

function getWarningMessage(probability) {
  if (probability >= 40) return "DANGER! Kingfisher is circling!";
  if (probability >= 25) return "WARNING! Kingfisher spotted nearby!";
  if (probability >= 10) return "CAUTION! Kingfisher in the area!";
  return null;
}

module.exports = {
  calculateAttackProbability,
  shouldAttack,
  selectFishToSteal,
  getWarningMessage,
};
