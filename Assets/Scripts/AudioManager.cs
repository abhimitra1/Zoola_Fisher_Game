using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class AudioManager : MonoBehaviour
{
    public static AudioManager Instance { get; private set; }

    [Header(" Audio Sources ")]
    [Tooltip(" Source dedicated to looping background music. ")]
    public AudioSource bgmSource;

    [Tooltip(" Source dedicated to one-shot sound effects. ")]
    public AudioSource sfxSource;

    [Header(" Sounds Effects (SFX)")]
    public AudioClip bubblePopSFX;
    public AudioClip splashSFX;
    public AudioClip kingfisherSearchSFX;
    public AudioClip uiChimeSFX;
    public AudioClip cashRegisterSFX;
    public AudioClip errorBuzzerSFX;

    [Header(" Background Music (BGm)")]
    public AudioClip indianFluteBGM;
    public AudioClip oceanAmbientBGM;
    public AudioClip nightPondBGM;


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
    
    private void OnEnable()
    {
        EventManager.OnWaterCleaned += PlaySplashSound;
        EventManager.OnKingFisherWarning += PlaySearchSound;
        EventManager.OnFishFed += PlayBubbleSound;

    }

    private void OnDisable()
    {
        EventManager.OnWaterCleaned -= PlaySplashSound;
        EventManager.OnKingFisherWarning -= PlaySearchSound;
        EventManager.OnFishFed -= PlayBubbleSound;
    }

    private void Start()
    {
        PlayBGM(indianFluteBGM);
    }

    public void PlayBGM(AudioClip track)
    {
        if (track == null || bgmSource.clip ==  track)
        {
            return;
        }

        bgmSource.clip = track;
        bgmSource.loop = true;
        bgmSource.Play();
    }

    public void StopBGM()
    {
        bgmSource.Stop();
    }

    public void PlaySFX(AudioClip clip , float volume = 1.0f)
    {
        if (clip != null)
        {
            sfxSource.PlayOneShot(clip,volume);
        }
    }

    private void PlayBubbleSound()
    {
        sfxSource.pitch = Random.Range(0.9f,1.1f);
        PlaySFX(bubblePopSFX);
        sfxSource.pitch = 1.0f;
    }

    private void PlaySearchSound()
    {
        PlaySFX(kingfisherSearchSFX,1.2f);
    }

    private void PlaySplashSound()
    {
        PlaySFX(splashSFX);
    }

    public void PlayUIChime() => PlaySFX(uiChimeSFX);
    public void PlayCashRegister() => PlaySFX(cashRegisterSFX);
    public void PlayErrorBuzzer() => PlaySFX(errorBuzzerSFX);
}
