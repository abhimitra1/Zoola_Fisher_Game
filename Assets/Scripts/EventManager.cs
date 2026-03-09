using System;
using UnityEngine;

public static class EventManager
{
    // --- TIME EVENTS ---
    public static event Action OnOneSecondTick;
    public static void TriggerOneSecondTick() => OnOneSecondTick?.Invoke();

    // --- TANK EVENTS ---
    public static event Action<float> OnOxygenChanged;
    public static void TriggerOxygenChanged(float newOxygen) => OnOxygenChanged?.Invoke(newOxygen);

    public static event Action<float> OnCleanlinessChanged;
    public static void TriggerCleanlinessChanged(float newCleanliness) => OnCleanlinessChanged?.Invoke(newCleanliness);

    public static event Action OnWaterCleaned;
    public static void TriggerWaterCleaned() => OnWaterCleaned?.Invoke();

    // --- FISH EVENTS ---
    public static event Action OnFishFed;
    public static void TriggerFishFed() => OnFishFed?.Invoke();

    public static event Action<string, int> OnFishSold;
    public static void TriggerFishSold(string fishName, int coinValue) => OnFishSold?.Invoke(fishName, coinValue);

    // --- ECONOMY EVENTS ---
    public static event Action<int> OnCoinsUpdated;
    public static void TriggerCoinsUpdated(int newCoinAmount) => OnCoinsUpdated?.Invoke(newCoinAmount);

    public static event Action<int> OnPearlsUpdated;
    public static void TriggerPearlsUpdated(int newPearlAmount) => OnPearlsUpdated?.Invoke(newPearlAmount);

    public static event Action<int> OnEssenceUpdated;
    public static void TriggerEssenceUpdated(int newEssenceAmount) => OnEssenceUpdated?.Invoke(newEssenceAmount);

    // --- PROGRESSION EVENTS ---
    public static event Action<int> OnPlayerLevelUp;
    public static void TriggerPlayerLevelUp(int newLevel) => OnPlayerLevelUp?.Invoke(newLevel);

    // --- THREAT EVENTS ---
    public static event Action OnKingFisherWarning;
    public static void TriggerKingFisherWarning() => OnKingFisherWarning?.Invoke();

    public static event Action<bool> OnKingFisherResolved;
    public static void TriggerKingFisherResolved(bool resolved) => OnKingFisherResolved?.Invoke(resolved);
}