using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AchievementManager : MonoBehaviour
{
    public static AchievementManager Instance { get; private set; }

    public int requiredKingfisherRepels = 10;
    public int requiredWaterCleans = 10;

    private int kingfisherRepelled = 0;
    private int waterCleanedCount = 0;
    private bool unlockTankGuardians = false;
    private bool unlockCleanWater = false;

    private void Awake()
    {
        if (Instance != this && Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    private void OnEnable()
    {
        EventManager.OnKingFisherResolved += CheckTankGuardianProgress;
        EventManager.OnWaterCleaned += CheckCleanWaterProgress;
    }


    private void OnDisable()
    {
        EventManager.OnKingFisherResolved -= CheckTankGuardianProgress;
        EventManager.OnWaterCleaned -= CheckCleanWaterProgress;
    }

    private void Start()
    {
        if (SaveManager.Instance != null && SaveManager.Instance.currentSave != null)
        {
            kingfisherRepelled = SaveManager.Instance.currentSave.kingfisherRepelled;
            waterCleanedCount = SaveManager.Instance.currentSave.waterCleanCount;

            unlockTankGuardians = SaveManager.Instance.currentSave.unlockedTankGuardian;
            unlockCleanWater = SaveManager.Instance.currentSave.unlockedCleanWater;
        }
    }
    private void CheckCleanWaterProgress()
    {
        if (unlockCleanWater)
        {
            return;
        }

        waterCleanedCount++;
        SaveAchievementState();

        if (waterCleanedCount >= requiredWaterCleans)
        {
            UnlockAchievement(" No Dirty Water Week" , 15);
            unlockCleanWater = true;
            SaveAchievementState();
        }

    }

    private void CheckTankGuardianProgress(bool playerDefended)
    {
        if (unlockTankGuardians)
        {
            return;
        }

        if (playerDefended)
        {
            kingfisherRepelled++;
            SaveAchievementState();

            if (kingfisherRepelled >= requiredKingfisherRepels)
            {
                UnlockAchievement("Tank Guardian" ,20);
                unlockTankGuardians = true;
                SaveAchievementState();
            }
        }
    }

    private void UnlockAchievement(string achievementName , int pearlReward)
    {
        Debug.Log($" [AchievementManager] Achievement Unlocked {achievementName}! ");

        if (EconomyManager.Instance != null)
        {
            EconomyManager.Instance.AddPearls(pearlReward);
            Debug.Log($" [AchihevementManager] Rewarded {pearlReward} pearls! ");
        }
    }

    private void SaveAchievementState()
    {
        if (SaveManager.Instance != null)
        {
            SaveManager.Instance.currentSave.kingfisherRepelled = kingfisherRepelled;
            SaveManager.Instance.currentSave.waterCleanCount = waterCleanedCount;
            SaveManager.Instance.currentSave.unlockedTankGuardian = unlockTankGuardians;
            SaveManager.Instance.currentSave.unlockedCleanWater = unlockCleanWater;
        }
    }

}
