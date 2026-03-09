using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class TimeManager : MonoBehaviour
{
    public static TimeManager Instance { get;private set; }

    public static event Action<int> OnOfflineSecondsProcessed;
    public static event Action OnOneSecondTick;

    private float oneSecondTimer = 0f;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);
    }

    private void Start()
    {
        GameManager.OnGameStateChanged += HandleGameStateChange;
    }

    private void OnDestroy()
    {
        GameManager.OnGameStateChanged -= HandleGameStateChange;
    }

    private void HandleGameStateChange(GameManager.GameStates statees)
    {
        if (statees == GameManager.GameStates.Playing)
        {
            CalculateOfflineProgress();

            GameManager.OnGameStateChanged -= HandleGameStateChange;
        }
    }

    private void Update()
    {
        if (GameManager.Instance != null && GameManager.Instance.State != GameManager.GameStates.Playing)
        {
            return;
        }

        oneSecondTimer += Time.deltaTime;

        if (oneSecondTimer >= 1f)
        {
            oneSecondTimer -= 1f;
            OnOneSecondTick?.Invoke();
        }
    }

    private void CalculateOfflineProgress()
    {
        if (SaveManager.Instance == null || SaveManager.Instance.currentSave.lastSaveTimeTicks == 0)
        {
            Debug.LogError("[TimeManager] No previous save time found. First time playing");
            return;
        }

        long lastSaveTicks = SaveManager.Instance.currentSave.lastSaveTimeTicks;
        long currentTicks = DateTime.UtcNow.Ticks;

        TimeSpan timePassed = new TimeSpan(currentTicks - lastSaveTicks);
        int secondsOffline = (int)timePassed.TotalSeconds;

        if (secondsOffline > 0)
        {
            Debug.Log($"[TimeManager] Player was Offline for {secondsOffline} seconds. Fast-Forwarding simulation");

            OnOfflineSecondsProcessed?.Invoke(secondsOffline);
        }

    }

}
