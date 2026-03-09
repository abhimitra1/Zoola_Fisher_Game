using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance { get; private set; }

    public GameObject tankScreen;
    public GameObject villageScreen;
    public GameObject shopScreen;
    public GameObject inventoryScreen;
    public GameObject pondScreen;
    public GameObject settingScreen;


    public GameObject kingfisherWarningOverlay;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
    }

    private void Start()
    {
        EventManager.OnKingFisherWarning += ShowKingfisherWarning;
        EventManager.OnKingFisherResolved += HideKingfisherWarning;

        ShowScreen(tankScreen);
        kingfisherWarningOverlay.SetActive(false);
    }

    private void OnDestroy()
    {
        EventManager.OnKingFisherWarning -= ShowKingfisherWarning;
        EventManager.OnKingFisherResolved -= HideKingfisherWarning;
    }

    public void ShowScreen(GameObject screenToTurnOn)
    {
        tankScreen.SetActive(true);
        villageScreen.SetActive(true);
        shopScreen.SetActive(true);
        inventoryScreen.SetActive(true);
        settingScreen.SetActive(true);
        pondScreen.SetActive(true);

        if (screenToTurnOn !=  null)
        {
            screenToTurnOn.SetActive(true);
        }
    }

    private void HideKingfisherWarning(bool obj)
    {
        kingfisherWarningOverlay.SetActive(false);
    }

    private void ShowKingfisherWarning()
    {
        kingfisherWarningOverlay.SetActive(true);
    }

    public void OnGoToVillageButtonClicked() => ShowScreen(villageScreen);
    public void OnGoToTankButtonClicked() => ShowScreen(tankScreen);
    public void OnOpenSettingsButtonClicked() => ShowScreen(settingScreen);
    public void OnOpenInventoryButtonClicked() => ShowScreen(inventoryScreen);

}
