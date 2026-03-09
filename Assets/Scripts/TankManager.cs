using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TankManager : MonoBehaviour
{
    public static TankManager Instance { get; private set; }

    [SerializeField] private float currentOxygen = 70f;
    [SerializeField] private float currentCleanliness = 100;

    [SerializeField] private ParticleSystem bubbleParticles;

    private const float maxValue = 100f;
    private const float oxygenPertap = 10f;
    private const float dirtFromFeeding = 5f;

    private const float base02DecayPerSecond = 0.5f;

    private int tapsInCurrentSecond = 0;
    private float secondTimer = 0f;

    private int dirtTickCounter = 0;

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
        TimeManager.OnOneSecondTick += HandleOneSecondTick;
        TimeManager.OnOfflineSecondsProcessed += CalculateOfflineTankState;

        EventManager.OnWaterCleaned += ResetCleanliness;
        EventManager.OnFishFed += HandleFishFed;
    }

    private void OnDisable()
    {
        TimeManager.OnOneSecondTick -= HandleOneSecondTick;
        TimeManager.OnOfflineSecondsProcessed -= CalculateOfflineTankState;

        EventManager.OnWaterCleaned -= ResetCleanliness;
        EventManager.OnFishFed -= HandleFishFed;
    }

    private void Start()
    {
        if (SaveManager.Instance != null && SaveManager.Instance.currentSave != null)
        {
            currentOxygen = SaveManager.Instance.currentSave.tankOxygen;
            currentCleanliness = SaveManager.Instance.currentSave.tankCleanliness;
        }

        UpdateUI();
    }

    private void Update()
    {
        secondTimer += Time.deltaTime;
        if (secondTimer >= 1f)
        {
            tapsInCurrentSecond = 0;
            secondTimer = 0f;
        }


    }

    public void PlayerTapTank()
    {
        if (GameManager.Instance.State != GameManager.GameStates.Playing)
        {
            return;
        }

        currentOxygen = Mathf.Clamp(currentOxygen + oxygenPertap,0,maxValue);

        if (bubbleParticles != null)
        {
            bubbleParticles.Emit(5);
        }

        tapsInCurrentSecond++;
        if (tapsInCurrentSecond >= 6)
        {
            Debug.Log("[TankManager] Tap spam Detected! Increase kingfisher threat. ");
        }

        UpdateUI();
    }

    private void HandleOneSecondTick()
    {
        float o2Change = -base02DecayPerSecond;

        int bubblePumpLevel = SaveManager.Instance != null ? 0 : 0;
        if (bubblePumpLevel == 1)
        {
            o2Change += 0.05f;
        }
        else if (bubblePumpLevel == 2)
        {
            o2Change += 0.1f;
        }

        currentOxygen = Mathf.Clamp(currentOxygen + o2Change, 0, maxValue);

        dirtTickCounter++;
        if (dirtTickCounter >= 15)
        {
            dirtTickCounter = 0;
            currentCleanliness = Mathf.Clamp(currentCleanliness - 1f, 0, maxValue);
        }

        UpdateUI();
        SaveCurrentState();
    }

    private void CalculateOfflineTankState(int offlineSeconds)
    {
        int dirtTicks = offlineSeconds / 15;
        currentCleanliness = Mathf.Clamp(currentCleanliness - dirtTicks, 0, maxValue);

        float totalo2Loss = offlineSeconds * base02DecayPerSecond;
        currentOxygen = Mathf.Clamp(currentOxygen - totalo2Loss, 0, maxValue);

        Debug.Log($"[TankManager] Processed {offlineSeconds} offline seconds. Cleanliness lost {dirtTicks}, O2 Lost {totalo2Loss}");
        UpdateUI();
    }

    private void ResetCleanliness()
    {
        currentCleanliness = maxValue;
        UpdateUI();
    }

    private void HandleFishFed()
    {
        currentCleanliness = Mathf.Clamp(currentCleanliness - dirtFromFeeding, 0, maxValue);
        UpdateUI();
    }


    private void UpdateUI()
    {
        EventManager.TriggerOxygenChanged(currentOxygen);
        EventManager.TriggerCleanlinessChanged(currentCleanliness);
    }

    private void SaveCurrentState()
    {
        if (SaveManager.Instance != null)
        {
            SaveManager.Instance.currentSave.tankOxygen = currentOxygen;
            SaveManager.Instance.currentSave.tankCleanliness = currentCleanliness;
        }
    }
}
