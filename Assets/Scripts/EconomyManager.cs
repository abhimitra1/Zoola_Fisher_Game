using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class EconomyManager : MonoBehaviour
{
    public static EconomyManager Instance {  get; private set; }

    public int currentCoins = 0;
    public int currentPearls = 0;
    public int currentEssence = 0;

    private void Awake()
    {
        if (Instance != this && Instance != null )
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    private void OnEnable()
    {
        EventManager.OnFishSold += HandleFishSold;
    }

    private void OnDisable()
    {
        EventManager.OnFishSold -= HandleFishSold;
    }

    private void Start()
    {
        if (SaveManager.Instance != null && SaveManager.Instance.currentSave != null)
        {
            currentCoins = SaveManager.Instance.currentSave.coins;
            currentPearls = SaveManager.Instance.currentSave.pearls;
            currentEssence = SaveManager.Instance.currentSave.essence;
        }

        UpdateAllUI();

        currentPearls += 50;
        currentEssence += 50;
    }

    public void AddCoins(int amount)
    {
        if (amount <= 0)
        {
            return;
        }

        currentCoins += amount;

        SaveEconomyState();
        EventManager.TriggerCoinsUpdated(currentCoins);
        Debug.Log($"[EconomyManager] Added {amount} Coins. Total: {currentCoins}. ");
    }

    public void AddPearls(int amount)
    {
        if (amount <= 0)
        {
            return;
        }

        currentPearls += amount;

        SaveEconomyState();
        EventManager.TriggerPearlsUpdated(currentPearls);
    }

    public void AddEssence(int amount)
    {
        if (amount <= 0)
        {
            return;
        }

        currentEssence += amount;

        SaveEconomyState();
        EventManager.TriggerEssenceUpdated(currentEssence);
    }

    public bool SpendCoins(int amount)
    {
        if (currentCoins >= amount)
        {
            currentCoins -= amount;
            SaveEconomyState();
            EventManager.TriggerCoinsUpdated(currentCoins);
            Debug.Log($"[EconomyManager] Spent {amount} Coins. Remaining: {currentCoins}");
            return true;
        }

        Debug.LogWarning("[EconomyManager] Not Enough Coins");
        return false;
    }

    public bool SpendPearls(int amount)
    {
        if (currentPearls >= amount)
        {
            currentPearls -= amount;
            SaveEconomyState();
            EventManager.TriggerPearlsUpdated(currentPearls);
            return true;
        }

        return false;
    }

    public bool SpendEssence(int amount)
    {
        if (currentEssence >= amount)
        {
            currentEssence -= amount;
            SaveEconomyState();
            EventManager.TriggerEssenceUpdated(currentEssence);
            return true;
        }

        return false;
    }

    private void HandleFishSold(string fishName, int coinValue)
    {
        Debug.Log($" [EconomyManager] Sold {fishName} for {coinValue} Coins. ");
        AddCoins(coinValue);
    }

    private void SaveEconomyState()
    {
        if (SaveManager.Instance != null)
        {
            SaveManager.Instance.currentSave.coins = currentCoins;
            SaveManager.Instance.currentSave.pearls = currentPearls;
            SaveManager.Instance.currentSave.essence = currentEssence;
        }
    }

    private void UpdateAllUI()
    {
        EventManager.TriggerCoinsUpdated(currentCoins);
        EventManager.TriggerEssenceUpdated(currentEssence);
        EventManager.TriggerPearlsUpdated(currentPearls);
    }
}
