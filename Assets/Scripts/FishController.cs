using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class FishController : MonoBehaviour
{
    public FishSpeciesData speciesData;

    [SerializeField] private float currentHunger = 60f;
    [SerializeField] private float currentHealth = 100f;
    [SerializeField] private float growthProgressSeconds = 0f;

    public bool isAdult = false;

    private float currentTankO2 = 70f;
    private float currentTankCleanliness = 100f;

    [Header(" Movement Setting ")]
    public float moveSpeed = 1.0f;
    public float turnSpeed = 3.0f;
    [Tooltip(" The boundaries of your tank so the fish don't swim off the screen ")]
    public Vector2 minBounds = new Vector2(-2.5f, -4.0f);
    public Vector2 maxBounds = new Vector2(2.5f, 4.0f);

    private Vector3 targetPosition;
    private SpriteRenderer spriteRenderer;

    [Header("Passive Income")]
    public GameObject coinPrefab;
    public float coinDropInterval = 10f;
    private float coinDropTimer = 0f;

    public float CurrentHunger { get { return currentHunger; } }

    public bool isFacingLeft = false;


    private void Start()
    {
        spriteRenderer = GetComponent<SpriteRenderer>();
        PickNewWayPoint();
    }

    private void Update()
    {
        // Safe check for GameManager
        if (GameManager.Instance != null && GameManager.Instance.State != GameManager.GameStates.Playing)
        {
            return;
        }

        Swim();

        if (isAdult && coinPrefab != null)
        {
            coinDropTimer += Time.deltaTime;
            if (coinDropTimer >= coinDropInterval)
            {
                DropCoin();
                coinDropTimer = 0;
            }
        }
    }

    private void DropCoin()
    {
        Instantiate(coinPrefab, transform.position, Quaternion.identity);
    }

    private void Swim()
    {
        transform.position = Vector3.MoveTowards(transform.position, targetPosition, moveSpeed * Time.deltaTime);

        Vector3 direction = targetPosition - transform.position;

        if (direction != Vector3.zero)
        {
            float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;

            if (isFacingLeft)
            {
                angle += 180;
            }

            Quaternion targetRotation = Quaternion.Euler(new Vector3(0, 0, angle));
            transform.rotation = Quaternion.Slerp(transform.rotation, targetRotation, turnSpeed * Time.deltaTime);

            if (direction.x < 0)
            {
                spriteRenderer.flipY = isFacingLeft ? false : true;
            }
            else
            {
                spriteRenderer.flipY = isFacingLeft ? true : false;
            }
        }

        // FIXED: Added 'f' to 0.1 for proper float comparison
        if (Vector3.Distance(transform.position, targetPosition) < 0.1f)
        {
            PickNewWayPoint();
        }
    }

    private void PickNewWayPoint()
    {
        float randomX = Random.Range(minBounds.x, maxBounds.x);
        float randomY = Random.Range(minBounds.y, maxBounds.y);

        targetPosition = new Vector3(randomX, randomY, 0f);
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

    private void UpdateLocalCleanliness(float newClean) => currentTankCleanliness = newClean;

    private void UpdateLocalO2(float newO2) => currentTankO2 = newO2;

    private void HandleOneSecondTick()
    {
        ProcessHunger();
        ProcessHealth();

        if (!isAdult)
        {
            ProcessGrowth();
        }
    }

    private void ProcessHunger()
    {
        currentHunger = Mathf.Clamp(currentHunger - 0.5f, 0, 100f);
    }

    private void ProcessHealth()
    {
        if (currentHunger < 10f)
        {
            currentHealth = Mathf.Clamp(currentHealth - 1f, 0, 100f);
        }

        if (currentTankCleanliness < 10f)
        {
            currentHealth = Mathf.Clamp(currentHealth - 2f, 0, 100f);
        }

        if (currentHealth <= 0)
        {
            Die();
        }
    }

    private void ProcessGrowth()
    {
        if (speciesData == null)
        {
            return;
        }

        float multiplier = GetGrowthMultiplier();
        growthProgressSeconds += 1f * multiplier;

        if (growthProgressSeconds >= speciesData.baseGrowthTimeSeconds)
        {
            BecomeAdult();
        }
    }

    private float GetGrowthMultiplier()
    {
        if (currentTankO2 > 70f && currentTankCleanliness > 70f && currentHunger > 60f)
        {
            return 1.5f;
        }

        if (currentTankO2 < 20f || currentTankCleanliness < 25f || currentHunger < 20f)
        {
            return 0.2f;
        }

        if (currentTankO2 < 40f || currentTankCleanliness < 50f || currentHunger < 40f)
        {
            return 0.6f;
        }

        return 1.0f;
    }

    public void Feed(float foodValue)
    {
        if (speciesData == null)
        {
            return;
        }

        if (currentHunger >= 100f)
        {
            // FIXED: Drains health instead of hunger to penalize overfeeding!
            currentHealth = Mathf.Clamp(currentHealth - 10f, 0, 100f);
            Debug.Log($" [FishController] {speciesData.speciesName} overfed! Health decreased. ");

            EventManager.TriggerFishFed();
        }
        else
        {
            currentHunger = Mathf.Clamp(currentHunger + foodValue, 0, 100f);
            EventManager.TriggerFishFed();
        }
    }

    private void BecomeAdult()
    {
        isAdult = true;

        // FIXED: Physically scales the fish up by 50% so you can visually see it grow!
        transform.localScale = new Vector3(1.5f, 1.5f, 1f);

        Debug.Log($" [FishController] {speciesData.speciesName} has become an adult! ");

        // Note: Uncomment this later if you want special visual traits!
        // if (speciesData.primaryTrait == FishTrait.DecorativeGlow)
        // {
        //     //Enable Visual Glow Particle;
        // }
    }

    private void Die()
    {
        // FIXED: Safe null check before trying to read the name!
        string name = speciesData != null ? speciesData.speciesName : "Unknown Fish";
        Debug.Log($" [FishController] {name} has died. ");
        Destroy(gameObject);
    }
}