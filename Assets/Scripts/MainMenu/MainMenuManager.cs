using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

public class MainMenuManager : MonoBehaviour
{
    public GameObject settingsPanel;

    private void Start()
    {
        if (settingsPanel != null)
        {
            settingsPanel.SetActive(false);
        }
    }

    public void PlayGame()
    {
        Debug.Log("[MainMenuManager] Loading the fish Tank... ");
        SceneManager.LoadScene(1);
    }

    public void OpenSettings()
    {
        if (settingsPanel != null)
        {
            settingsPanel.SetActive(true);
        }
    }

    public void CloseSettings()
    {
        if (settingsPanel != null)
        {
            settingsPanel.SetActive(false);
        }
    }

    public void QuitGame()
    {
        Debug.Log("[MainMenuManager] Quitting the game... ");
        Application.Quit();
    }
}

