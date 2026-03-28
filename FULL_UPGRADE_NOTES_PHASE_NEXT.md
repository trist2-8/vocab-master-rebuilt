# Vocab Master — Atmosphere 2.0 + Pomodoro Audio

This pass keeps the original goal fixed at the top:
- preserve the original purpose
- keep the extension simple and learning-first
- strengthen vocabulary retention and long-term memory
- avoid losing old features
- add richer UI only as optional layers

## Added
- Atmosphere 2.0 effects: rain, window-rain, snow, dust, mist, neon reflections, petals
- New mood UI packs: Rainy Library, Snowy Quiet Night, Moonlight Window, Sakura Notes, Film Diary
- Optional Pomodoro audio cues
  - Soft Bell
  - Glass Chime
  - Cafe Timer
  - Night Tone
- Audio settings
  - on/off
  - end-only or full cue mode
  - volume
  - sound pack
- More preset bundles for the new UI modes
- Modularized audio logic in src/upgrade/audio.js

## Preserved
- Classic/default learning flow
- Existing vocab/review logic and study modes
- Previous Pattern Vault, Memory Path, Focus Room, Collections, Admin, and weekly recap layers

## Main files changed
- vocab.html
- manifest.json
- upgrade.js
- upgrade.css
- src/upgrade/data.js
- src/upgrade/effects.js
- src/upgrade/audio.js
- styles/upgrade-effects.css
- upgrade_smoke_test.js
