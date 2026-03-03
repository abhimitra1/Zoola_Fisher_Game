using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GameManager : MonoBehaviour
{
    public static GameManager Instance { get; private set; }

    public enum GameStates
    {
        Booting,
        MainMenu,
        Playing,
        Paused,
        KingFisherAttack
    }

    public GameStates State { get; private set; }

    public static event Action<GameStates> OnGameStateChanged;

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
        UpdateGameState(GameStates.Playing);
    }

    public void UpdateGameState(GameStates newState)
    {
        if (State == newState)
        {
            return;
        }

        State = newState;
        Debug.Log($"[GameManager] State Change to : {newState}");

        HandleStateChanged(newState);

        OnGameStateChanged?.Invoke(newState);
    }

    public void HandleStateChanged(GameStates statee)
    {
        switch (statee)
        {
            case GameStates.Booting:
                UpdateGameState(GameStates.Playing);
                break;
            case GameStates.MainMenu:
                Time.timeScale = 1f;
                break;
            case GameStates.Playing:
                Time.timeScale = 1f;
                break;
            case GameStates.Paused:
                Time.timeScale = 0f;
                break;
            case GameStates.KingFisherAttack:
                Time.timeScale = 1f;
                break;
            default:
                throw new ArgumentOutOfRangeException(nameof(statee) , State , null);
        }
    }

    public void PauseGame()
    {
        UpdateGameState(GameStates.Paused);
    }

    public void ResumeGame()
    {
        UpdateGameState(GameStates.Playing);
    }

    private void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            if (State == GameStates.Playing)
            {
                PauseGame();
            }
        }
    }
}
