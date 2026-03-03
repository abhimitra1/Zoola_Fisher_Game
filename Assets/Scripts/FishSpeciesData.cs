using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public enum FishRarity
{
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary
}

public enum FishTrait
{
    None,
    AutoOxygen,
    DecorativeGlow,
    XPBoost,
    DirtReduction,
    CoinBoost,
    AttractRareSpawns
}


[CreateAssetMenu(fileName = "New Fish Species", menuName = "Fish Species Data", order = 1)]
public class FishSpeciesData : ScriptableObject
{
    public string speciesName;
    public string description;
    public FishRarity rarity;


    public GameObject fishPrefab;
    public Sprite shopIcon;

    public float baseGrowthTimeSeconds;

    public float preferredOxygen = 60f;
    public float perfectCleanliness = 60f;

    public int sellValue;
    public FishTrait primaryTrait;

    public FishTrait secondaryTrait = FishTrait.None;
}
