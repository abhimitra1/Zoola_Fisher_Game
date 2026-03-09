# Fisher — Prototype

This is a rapid browser prototype for a portrait-first 2D fish-tank management game built with React + Vite + Phaser (TypeScript).

Quick start

1. Install dependencies

```bash
npm install
```

2. Run dev server

```bash
npm run dev
```

Open http://localhost:5173 and resize to portrait (the app max-width is 420px).

What is included

- Vite + React + TypeScript scaffold
- Phaser 3 game embedded in React
- `src/game` contains Phaser boot and `TankScene`
- `src/ui` contains HUD and simple modal
- `src/utils/store.ts` is a small single-source-of-truth saving to `localStorage`
- Simple mock fish data in `src/data`

Changelog (this patch)
- Improved fish movement with varied tweens and subtle idle motion
- Added persistent `appliedUpgrades` and `src/data/upgrades.json` with three upgrades
- Added `Shop` UI to purchase upgrades (oxygen pump, filter, premium feed)
- HUD redesigned for portrait layout and touch targets
- Balance tweaks: adjusted decay rates, feed/clean effects, growth increments
- Added simple audio hooks via `src/utils/audio.ts` and sound triggers on actions/events
- Refactored `store` to support purchases and upgrades; added purchase API

Technical debt / caveats
- Audio is a minimalist WebAudio placeholder; add proper asset loading or use Phaser sound for richer audio
- Fish visuals are procedural graphics; replace with sprite sheets and animations for polish
- No unit tests or automated CI yet — consider adding tests for store logic
- Shop offers simple one-time upgrades; consider upgrade tiers and UI affordances
- Kingfisher event is manual trigger — add scheduled/random events and UI timeouts for real gameplay

Next high-value tasks
1. Implement egg purchase & hatch flow with timer and simple animation
2. Replace placeholder fish graphics with sprite sheets and add frame-based swim animations
3. Add scheduled random events (kingfisher, algae bloom) with UI timers
4. Integrate Phaser sound manager and add audio assets
5. Add a simple backend sync stub (REST) and offline-first merge strategy

Next steps

- Add shop UI and egg purchase flow
- Improve fish AI, animations, and growth
- Add audio and visual polish
- Implement backend sync (optional)
- Package as Chrome extension (manifest + build)
