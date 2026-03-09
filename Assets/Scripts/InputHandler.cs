using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InputHandler : MonoBehaviour
{
    public float minimumSwipeDistance = 50f;
    private Vector2 touchStartPos;
    private Vector2 touchEndPos;

    private bool isDraining;
    private float drainTimer = 0f;

    public float waterChangeTimeLimit = 3.0f;

    private void Update()
    {
        if (GameManager.Instance != null && GameManager.Instance.State != GameManager.GameStates.Playing)
        {
            return;
        }

        HandleTouchInput();

        HandleMouseInput();

        if (isDraining)
        {
            drainTimer += Time.deltaTime;

            if (drainTimer >  waterChangeTimeLimit)
            {
                Debug.Log("[InputHandler] Water Change failed. Took longer than 3 seconds. ");
                isDraining = false;
                drainTimer = 0f;
            }
        }
    }

    private void HandleTouchInput()
    {
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            switch (touch.phase)
            {
                case TouchPhase.Began:
                    touchStartPos = touch.position;
                    break;
                case TouchPhase.Ended:
                    touchEndPos = touch.position;
                    DetectSwipeOrTap(touchStartPos,touchEndPos,touch.position);
                    break;

            }
        }
    }

    private void HandleMouseInput()
    {
        if (Input.GetMouseButtonDown(0))
        {
            touchStartPos = Input.mousePosition;
        }

        if (Input.GetMouseButtonUp(0))
        {
            touchEndPos = Input.mousePosition;
            DetectSwipeOrTap(touchStartPos,touchEndPos,Input.mousePosition);
        }
    }

    private void DetectSwipeOrTap(Vector2 start, Vector2 end, Vector2 screenPos)
    {
        float swipeDistance = Vector2.Distance(start, end);

        if (swipeDistance > minimumSwipeDistance)
        {
            Vector2 direction = end - start;

            if (Mathf.Abs(direction.y) > Mathf.Abs(direction.x))
            {
                if (direction.y > 0)
                {
                    HandleSwipeUp();
                }
                else
                {
                    HandleSwipeDown();
                }
            }
        }
        else
        {
            ProcessTap(screenPos);
        }
    }

    private void ProcessTap(Vector2 screenPosition)
    {
        Vector3 worldPos = Camera.main.ScreenToWorldPoint(screenPosition);

        RaycastHit2D hit = Physics2D.Raycast(worldPos,Vector2.zero);

        if (hit.collider != null)
        {

            Coins tappedCoins = hit.collider.GetComponent<Coins>();
            if (tappedCoins != null )
            {
                tappedCoins.Collect();
                return;
            }
            
            Debug.Log($" [InputHandler] I CLicked on: {hit.collider.gameObject.name}");

            FishController tappedFish  = hit.collider.GetComponent<FishController>();
            if (tappedFish != null)
            {
                tappedFish.Feed(20f);
                return;
            }

            // Note : We can Add if the player has tapped a coin logic
        }

        if (TankManager.Instance != null)
        {
            TankManager.Instance.PlayerTapTank();
        }
    }

    private void HandleSwipeUp()
    {
        if (!isDraining)
        {
            Debug.Log("[InputHandler] Swipe Up Detected! Draining water..");
            isDraining = true;
            drainTimer = 0;

            if (AudioManager.Instance != null)
            {
                AudioManager.Instance.PlaySFX(AudioManager.Instance.splashSFX);
            }
        }
    }

    private void HandleSwipeDown()
    {
        if (isDraining)
        {
            Debug.Log("[InputHandler] Swipe Down Detected! Refilling water...");
            isDraining = false;

            EventManager.TriggerWaterCleaned();
        }
    }
}
