using System;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.UIElements;

public class DialogueLine
{
    public string speakerName;
    [TextArea(3, 5)]
    public string sentence;
    public Sprite speakerPortrait;
}

public class DialogueUI : MonoBehaviour
{
    public static DialogueUI Instance { get; private set; }

    [Header(" UI Elements ")]
    public GameObject dialoguePanel;
    public TextMeshProUGUI speakerNameText;
    public TextMeshProUGUI dialogueText;
    public Image portraitImage;

    [Header(" Settings ")]
    public float typingSpeed = 0.03f;

    private Queue<DialogueLine> linesQueue;
    private bool isTyping = false;
    private string currentSentence = " ";
    private Action onDialogueCompleteCallbaack;

    private void Awake()
    {
        if (Instance != this && Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        linesQueue = new Queue<DialogueLine>();
    }

    private void Start()
    {
        dialoguePanel.SetActive(false);
    }

    public void StartDialogue(DialogueLine[] lines,Action onComplete = null)
    {
        dialoguePanel.SetActive(true);
        linesQueue.Clear();
        onDialogueCompleteCallbaack = onComplete;

        GameManager.Instance.UpdateGameState(GameManager.GameStates.Paused);

        foreach (DialogueLine line in lines)
        {
            linesQueue.Enqueue(line);
        }

        DisplayNextSentence();
    }

    public void OnDialogueBoxTapped()
    {
        if (isTyping)
        {
            StopAllCoroutines();
            dialogueText.text = currentSentence;
            isTyping = false;
        }
        else
        {
            DisplayNextSentence();

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlayUIChime();
            }
        }
    }

    private void DisplayNextSentence()
    {
        if (linesQueue.Count == 0)
        {
            EndDialogue();
            return;
        }

        DialogueLine nextLine = linesQueue.Dequeue();

        speakerNameText.text = nextLine.speakerName;

        if (nextLine.speakerPortrait != null)
        {
            portraitImage.sprite = nextLine.speakerPortrait;
            //portraitImage.gameObject.SetActive(true);
        }
        else
        {
            //portraitImage.gameObject.SetActive(false);
        }

        StopAllCoroutines();
        StartCoroutine(TypeSentence(nextLine.sentence));
    }

    private IEnumerator TypeSentence(string sentence)
    {
        isTyping = true;
        currentSentence = sentence;
        dialogueText.text = " ";

        foreach (char letter in sentence.ToCharArray())
        {
            dialogueText.text += letter;
            yield return new WaitForSeconds(typingSpeed);
        }

        isTyping = false ;
    }

    private void EndDialogue()
    {
        dialoguePanel.SetActive(false);

        GameManager.Instance.UpdateGameState(GameManager.GameStates.Playing);

        onDialogueCompleteCallbaack?.Invoke();
        onDialogueCompleteCallbaack = null;
    }

}
