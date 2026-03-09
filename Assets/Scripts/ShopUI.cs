using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class ShopUI : MonoBehaviour
{
    [Header("Rohan the Trader(Eggs)")]
    public int commonEggPriceCoins = 50;
    public int rareEggPricePearls = 10;

    [Tooltip("UI Text to Display the dynamic prices")]
    public TextMeshProUGUI commonEggPriceText;
    public TextMeshProUGUI rareEggPriceText;

    [Header("Mira the Inventor (Upgrades)")]
    public int netShieldPriceCoins = 200;
    public int alarmBellPriceCoins = 150;

    private void Start()
    {
        UpdatePriceTags();
    }

    private void UpdatePriceTags()
    {
        if (commonEggPriceText != null)
        {
            commonEggPriceText.text = commonEggPriceCoins.ToString();
        }

        if (rareEggPriceText != null)
        {
            rareEggPriceText.text = rareEggPricePearls.ToString();
        }
    }

    public void OnBuyCommonEggsClicked()
    {
        if (EconomyManager.Instance.SpendCoins(commonEggPriceCoins))
        {
            Debug.Log("[ShopUI] Successfully purchased a Common Egg! ");
            FishManager.Instance.HatchEgg(FishRarity.Common);

            AudioManager.Instance.PlayCashRegister();
        }
        else
        {
            Debug.Log("[ShopUI] Transaction Failed : Not Enough failed! ");

            AudioManager.Instance.PlayErrorBuzzer();
        }
    }

    public void OnRareBuyClicked()
    {
        if (EconomyManager.Instance.SpendPearls(rareEggPricePearls))
        {
            Debug.Log("[ShopUI] Successfully purchased a rare egg! ");
            FishManager.Instance.HatchEgg(FishRarity.Rare);
        }
        else
        {
            Debug.Log("[ShopUI] Transaction Failed : Not Enough failed! ");
        }

    }

    public void OnBuyNetShieldClicked()
    {
        if (SaveManager.Instance.currentSave.hasNetShield)
        {
            Debug.Log("[ShopUI] Player already owns the net Shield! ");
            return;

        }

        if (EconomyManager.Instance.SpendCoins(netShieldPriceCoins))
        {
            Debug.Log("[ShopUI] Successfully purchased Net Shield ! ");
            SaveManager.Instance.currentSave.hasNetShield = true;
            SaveManager.Instance.SaveGame();
        }
    }

    public void OnAlarmBellClicked()
    {
        if (SaveManager.Instance.currentSave.hasAlarmBell)
        {
            Debug.Log("[ShopUI] Player already Owns the AlarmBell");
            return;
        }

        if (EconomyManager.Instance.SpendCoins(alarmBellPriceCoins))
        {
            Debug.Log("[ShopUI] Purchased the Alarm Bell");
            SaveManager.Instance.currentSave.hasAlarmBell = true;
            SaveManager.Instance.SaveGame();
        }
    }

}
