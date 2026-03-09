using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class FishManager : MonoBehaviour
{
    public static FishManager Instance { get; private set; }

    public List<FishSpeciesData> allFishSpecies;

    public List<FishController> activeFishInTank = new List<FishController>();

    public Transform spawnCenter;
    public float spawnRadius = 3f;

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
        EventManager.OnKingFisherResolved += HandleKingFisherResult;
    }

    private void OnDisable()
    {
        EventManager.OnKingFisherResolved -= HandleKingFisherResult;
    }
    

    public void HatchEgg(FishRarity guranteeRarity)
    {
        List<FishSpeciesData> possibleHatchlings = new List<FishSpeciesData>();

        foreach ( var species in allFishSpecies)
        {
            if (species.rarity == guranteeRarity)
            {
                possibleHatchlings.Add(species);
            }
        }

        if (possibleHatchlings.Count == 0)
        {
            Debug.LogError($"[FishManager] No Fish found in catalog with rarity: {guranteeRarity}! ");
            return;
        }

        int randomIndex = Random.Range(0, possibleHatchlings.Count);
        FishSpeciesData hatchedSpecies = possibleHatchlings[randomIndex];

        SpawnFish(hatchedSpecies);
    }
    
    public void SpawnFish(FishSpeciesData speciesData)
    {
        if (speciesData.fishPrefab == null)
        {
            Debug.LogError($"[FishManager] Fish prefab is null for species: {speciesData.speciesName}");
            return;
        }

        Vector3 randomPos = spawnCenter.position + (Random.insideUnitSphere * spawnRadius);
        randomPos.z = 0f; // Ensure fish spawn in 2D plane

        GameObject newFishObject = Instantiate(speciesData.fishPrefab, randomPos, Quaternion.identity);

        FishController newFishController = newFishObject.GetComponent<FishController>();
        if (newFishController != null)
        {
            newFishController.speciesData = speciesData;
            activeFishInTank.Add(newFishController);
            Debug.Log($"[FishManager] Spawned new fish: {speciesData.speciesName} at position {randomPos}");
        }
    }

    private void HandleKingFisherResult(bool playerDefended)
    {
        if (!playerDefended && activeFishInTank.Count > 0)
        {
            int indexToRemove = Random.Range(0, activeFishInTank.Count);
            FishController stolenFish = activeFishInTank[indexToRemove];

            Debug.Log($"[FishManager] Kingfisher stole a fish: {stolenFish.speciesData.speciesName}!");

            activeFishInTank.RemoveAt(indexToRemove);
            Destroy(stolenFish.gameObject);
        }
    }
}
