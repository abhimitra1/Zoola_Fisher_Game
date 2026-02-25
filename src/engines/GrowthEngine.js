const GROWTH_RATES = {
  silverfin: { baseMinutes: 5 },
  bubbletail: { baseMinutes: 10 },
  glowling: { baseMinutes: 20 },
  ember_carp: { baseMinutes: 25 },
  crystal_carp: { baseMinutes: 40 },
  moonfish: { baseMinutes: 45 },
  spirit_lotus: { baseMinutes: 120 },
};

function getGrowthMultiplier(tank, fish) {
  const o2 = tank.oxygenLevel;
  const clean = tank.cleanliness;
  const hunger = fish.hunger;
  if (o2 > 70 && clean > 70 && hunger > 60) return 1.5;
  if (o2 < 20 || clean < 10 || hunger < 10) return 0.2;
  if (o2 < 40 || clean < 25 || hunger < 20) return 0.6;
  return 1.0;
}

function calculateGrowthProgress(fish, tank, minutesPassed) {
  const speciesKey = fish.species.toLowerCase().replace(" ", "_");
  const rate = GROWTH_RATES[speciesKey] || { baseMinutes: 10 };
  const multiplier = getGrowthMultiplier(tank, fish);
  const progressPerMinute = (100 / rate.baseMinutes) * multiplier;
  const progressGained = progressPerMinute * minutesPassed;
  return Math.min(100, fish.growthProgress + progressGained);
}

function getNextStage(currentStage) {
  const stages = { egg: "juvenile", juvenile: "adult", adult: "adult" };
  return stages[currentStage] || "adult";
}

function shouldAdvanceStage(growthProgress) {
  return growthProgress >= 100;
}

function calculateSellValue(species, rarity) {
  const rarityValues = {
    common: 10,
    uncommon: 25,
    rare: 60,
    epic: 150,
    legendary: 500,
  };
  return rarityValues[rarity] || 10;
}

module.exports = {
  getGrowthMultiplier,
  calculateGrowthProgress,
  getNextStage,
  shouldAdvanceStage,
  calculateSellValue,
};
