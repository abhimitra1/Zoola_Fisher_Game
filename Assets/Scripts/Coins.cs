using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class Coins : MonoBehaviour
{
    public int coinValue = 1;
    public float lifeTime = 5f;

    private void Start()
    {
        Destroy(gameObject,lifeTime);
    }

    public void Collect()
    {
        if (EconomyManager.Instance != null)
        {
            EconomyManager.Instance.AddCoins(coinValue);
        }

        if (AudioManager.Instance != null)
        {
            AudioManager.Instance.PlayUIChime();
        }

        Destroy(gameObject);
    }
}
