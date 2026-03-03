using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class TankHUD : MonoBehaviour
{
    public Slider oxygenSlider;
    public Slider cleanlinessSlider;

    public TextMeshProUGUI coinsText;
    public TextMeshProUGUI pearlsText;
    public TextMeshProUGUI essenceText;


    private void OnEnable()
    {
        EventManager.OnOxygenChanged += UpdateOxygenBar;
        EventManager.OnCleanlinessChanged += UpdateCleanlinessBar;


        EventManager.OnCoinsUpdated += UpdateCoinsText;
        EventManager.OnPearlsUpdated += UpdatePearlsText;
        EventManager.OnEssenceUpdated += UpdateEssenceText;
    }

    private void OnDisable()
    {
        EventManager.OnOxygenChanged -= UpdateOxygenBar;
        EventManager.OnCleanlinessChanged -= UpdateCleanlinessBar;

        EventManager.OnCoinsUpdated -= UpdateCoinsText;
        EventManager.OnPearlsUpdated -= UpdatePearlsText;
        EventManager.OnEssenceUpdated -= UpdateEssenceText;
    }

    private void Start()
    {
        if (oxygenSlider != null)
        {
            oxygenSlider.maxValue = 100f;
        }

        if (cleanlinessSlider != null)
        {
            cleanlinessSlider.maxValue = 100f;
        }
    }

    private void Update()
    {
        if (EconomyManager.Instance != null)
        {
            if (coinsText != null)
            {
                coinsText.text = EconomyManager.Instance.currentCoins.ToString();
            }

            if (pearlsText != null)
            {
                pearlsText.text = EconomyManager.Instance.currentPearls.ToString();
            }

            if (essenceText != null)
            {
                essenceText.text = EconomyManager.Instance.currentEssence.ToString();
            }
        }
    }

    private void UpdateEssenceText(int amount)
    {
        essenceText.text = amount.ToString();
    }

    private void UpdatePearlsText(int amount)
    {
        if (pearlsText != null)
        {
            pearlsText.text = amount.ToString();
        }
    }

    private void UpdateCoinsText(int amount)
    {
        if (coinsText != null)
        {
            coinsText.text = amount.ToString();
        }
    }

    private void UpdateCleanlinessBar(float currentCleanliness)
    {
        if (cleanlinessSlider != null)
        {
            cleanlinessSlider.value = currentCleanliness;
        }
    }

    private void UpdateOxygenBar(float currentO2)
    {
        if (oxygenSlider != null)
        {
            oxygenSlider.value = currentO2;

            //Change the color if Oxygen drops below 30
        }
    }

}
