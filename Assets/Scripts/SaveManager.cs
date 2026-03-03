using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using System;
using System.IO;
using UnityEngine.UIElements;
using UnityEditor;

[Serializable]
public class PlayerSaveData
{
    public long lastSaveTimeTicks;

    //Currency Info
    public int coins = 0;
    public int pearls = 0;
    public int essence = 0;

    //Player Progress
    public int playerLevel = 1;
    public int playerXP = 0;

    public float tankOxygen = 70f;
    public float tankCleanliness = 100f;

    public bool hasNetShield = false;
    public bool hasAlarmBell = false;
    public bool hasScarecrow = false;

    public int kingfisherRepelled = 0;
    public int waterCleanCount = 0;

    public bool unlockedTankGuardian = false;
    public bool unlockedCleanWater = false;

}

public class SaveManager : MonoBehaviour
{
    public static SaveManager Instance {  get; private set; }

    public PlayerSaveData currentSave;
    private string saveFilePath;

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        saveFilePath = Path.Combine(Application.persistentDataPath, "fisher_save.json");

        LoadGame();
    }

    private void Start()
    {
        
    }

    public void SaveGame()
    {
        currentSave.lastSaveTimeTicks = DateTime.UtcNow.Ticks;

        try
        {
            string json = JsonUtility.ToJson(currentSave, true);
            File.WriteAllText(saveFilePath, json);
            Debug.Log($"[SaveManager] Game Saved successfully at {saveFilePath}");
        }
        catch(Exception e)
        {
            Debug.LogError($"[SaveManager] Failed to Save Game: {e.Message} ");
        }
    }

    public void LoadGame()
    {
        if (File.Exists(saveFilePath))
        {
            try
            {
                string json = File.ReadAllText(saveFilePath);
                currentSave = JsonUtility.FromJson<PlayerSaveData>(json);
                Debug.Log($"[SaveManager] Game loaded successfully. ");
            }
            catch(Exception e)
            {
                Debug.Log($"[SaveManager] Failed to load Game. Creating new save. Error: {e.Message}");
                CreateNewSave();
            }
        }
        else
        {
            Debug.LogError("[SaveManager] No save file found. Creating new save. ");
            CreateNewSave();
        }      
    }

    private void CreateNewSave()
    {
        currentSave = new PlayerSaveData();
        SaveGame();
    }

    private void DeleteSaveData()
    {
        if (File.Exists(saveFilePath))
        {
            File.Delete(saveFilePath);
            CreateNewSave();
            Debug.Log("[SaveManager] Save data deleted and Reset. ");
        }
    }

    private void OnApplicationQuit()
    {
        SaveGame();
    }

    private void OnApplicationPause(bool pause)
    {
        if (pause)
        {
            SaveGame();
        }
    }
}

