using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LevelManager : MonoBehaviour
{
    public static LevelManager Instance { get; private set; }

    [SerializeField] private int currentLevel = 0;
    [SerializeField] private int currentXP = 0;
    [SerializeField] private int xpToNextLevel = 0;

    public float baseXPRequirement = 100f;
    public float xpMultiplier = 1.5f;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    private void OnEnable()
    {
        EventManager.OnFishSold += HandleFishSoldXP;
        EventManager.OnWaterCleaned += HandleWaterCleanedXP;
    }

    private void OnDisable()
    {
        EventManager.OnFishSold -= HandleFishSoldXP;
        EventManager.OnWaterCleaned -= HandleWaterCleanedXP;
    }

    private void Start()
    {
        if (SaveManager.Instance != null && SaveManager.Instance.currentSave != null)
        {
            currentLevel = SaveManager.Instance.currentSave.playerLevel;
            currentXP = SaveManager.Instance.currentSave.playerXP;

            CalculateXPThreshold();
        }
    }

    public void AddXP(int baseAmount)
    {
        if (baseAmount <= 0)
        {
            return;
        }

        int finalAmount = CalculateTraitBoost(baseAmount);

        currentXP += finalAmount;
        Debug.Log($" [LevelManager] gained {finalAmount} XP .  Total {currentXP}/{xpToNextLevel} ");

        while (currentXP >= xpToNextLevel)
        {
            LevelUp();
        }

        SaveProgression();
    }

    private void LevelUp()
    {
        currentXP -= xpToNextLevel;
        currentLevel++;

        CalculateXPThreshold();

        Debug.Log($"[LevelManager] Level UP! Now Level{currentLevel}! ");
        EventManager.TriggerPlayerLevelUp(currentLevel);

        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayUIChime();
        }
    }

    private void CalculateXPThreshold()
    {
        xpToNextLevel = Mathf.RoundToInt(baseXPRequirement * Mathf.Pow(currentLevel, xpMultiplier));
    }

    private int CalculateTraitBoost(int incomingXP)
    {
        float multiplier = 1.0f;

        if (FishManager.Instance != null)
        {
            foreach (var fish in FishManager.Instance.activeFishInTank)
            {
                if (fish.isAdult && fish.speciesData.primaryTrait == FishTrait.XPBoost)
                {
                    multiplier += 0.05f;
                }
            }
        }

        return Mathf.RoundToInt(incomingXP * multiplier);
    }

    private void SaveProgression()
    {
        if (SaveManager.Instance != null)
        {
            SaveManager.Instance.currentSave.playerLevel = currentLevel;
            SaveManager.Instance.currentSave.playerXP = currentXP;
        }
    }

    private void HandleWaterCleanedXP()
    {
        AddXP(10);
    }

    private void HandleFishSoldXP(string fishName, int coinValue)
    {
        int xpReward = Mathf.Max(1, coinValue / 2);
        AddXP(xpReward);
    }
}
