using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class KingfisherManager : MonoBehaviour
{
    public static KingfisherManager Instance { get; private set; }

    [SerializeField] private float currentThreatChance = 0f;
    [SerializeField] private bool isAttackActive = false;

    public int rollIntervalSeconds = 15;
    public float baseReactionTime = 3f;

    private float currentTankO2 = 70f;
    private float currentTankCleanliness = 100f;

    private bool hasTapSpamPenalty = false;
    private int secondsSinceLastRoll = 0;

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
        EventManager.OnOxygenChanged += UpdateLocalO2;
        EventManager.OnCleanlinessChanged += UpdateLocalCleanliness;
    }

    private void OnDisable()
    {
        TimeManager.OnOneSecondTick -= HandleOneSecondTick;
        EventManager.OnOxygenChanged -= UpdateLocalO2;
        EventManager.OnCleanlinessChanged -= UpdateLocalCleanliness;
    }

    public void AddTapSpamThreat()
    {
        hasTapSpamPenalty = true;
    }

    private void UpdateLocalCleanliness(float newClean)
    {
        currentTankCleanliness = newClean;
    }

    private void UpdateLocalO2(float newO2)
    {
        currentTankO2 = newO2;
    }

    private void HandleOneSecondTick()
    {
        if (isAttackActive || GameManager.Instance.State != GameManager.GameStates.Playing)
        {
            return;
        }

        secondsSinceLastRoll++;

        if (secondsSinceLastRoll >= rollIntervalSeconds)
        {
            secondsSinceLastRoll = 0;
            CalculateAndRollForAttack();
        }
    }

    private void CalculateAndRollForAttack()
    {
        currentThreatChance = 0f;

        if (currentTankO2 < 30f)
        {
            currentThreatChance += 20f;
        }

        if (currentTankCleanliness < 35f)
        {
            currentThreatChance += 20f;
        }

        if (FishManager.Instance !=  null && CheckForStarvingFish())
        {
            currentThreatChance += 10f;
        }

        if (hasTapSpamPenalty)
        {
            currentThreatChance += 10f;
            hasTapSpamPenalty = false;
        }

        currentThreatChance = Mathf.Clamp(currentThreatChance,0f,50f);

        if (currentThreatChance > 0)
        {
            float roll = Random.Range(0f,100f);
            Debug.Log($"[KingfisherManager] Rolled {roll} against a {currentThreatChance}% threat chance! ");


            if (roll <= currentThreatChance)
            {
                StartAttackSequence();
            }
        }
    }

    private bool CheckForStarvingFish()
    {
        foreach (var fish in FishManager.Instance.activeFishInTank)
        {
            if (fish.CurrentHunger < 20f)
            {
                return true;
            }
        }
        return false;
    }

    private void StartAttackSequence()
    {
        if (CheckPassiveDefence())
        {
            return;
        }

        isAttackActive = true;

        GameManager.Instance.UpdateGameState(GameManager.GameStates.KingFisherAttack);

        EventManager.TriggerKingFisherWarning();

        float actualReactionTime = baseReactionTime;

        StartCoroutine(AttackTimerRoutine(actualReactionTime));
    }

    private bool CheckPassiveDefence()
    {
        if (SaveManager.Instance != null && SaveManager.Instance.currentSave.hasNetShield)
        {
            if (Random.Range(0f,100f) <= 50f)
            {
                return true;
            }
            else
            {
                Debug.Log("[KingfisherManager] The net Shield failed to block the Attack! ");
            }
        }


        return false;
    }

    private IEnumerator AttackTimerRoutine(float timeToReact)
    {
        float timer = 0f;

        while (timer < timeToReact)
        {
            if (!isAttackActive)
            {
                yield break;
            }

            timer += Time.deltaTime;
            yield return null;
        }

        ResolveAttack(false);
    }

    public void PlayerTapRepel()
    {
        if (isAttackActive)
        {
            Debug.Log("[KingfisherManager] Player successfully repelled the kingFisher! ");
            ResolveAttack(true);
        }
    }

    private void ResolveAttack(bool playerDefended)
    {
        isAttackActive = false;
        EventManager.TriggerKingFisherResolved(playerDefended);

        GameManager.Instance.UpdateGameState(GameManager.GameStates.Playing);
    }
}
