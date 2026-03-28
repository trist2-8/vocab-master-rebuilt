# Vocab Master Phase Next — Full Feature Pack

This bundle keeps the original goal fixed at the top:
- preserve the original purpose
- keep the extension simple and learning-first
- strengthen vocabulary retention and long-term memory
- avoid losing old features
- add richer UI and motivation only as optional layers

## Preserved
- Classic/default UI still works
- Existing add-word, set management, review logic, study modes, and memory-first review flow remain intact
- New features live mostly in the upgrade layer and can be ignored if the user wants the classic flow

## Added in this full feature pass
- **Quote-to-Lesson Cards 2.0**
  - daily saying now turns the selected quote word into a mini lesson
  - collocation
  - sentence pattern
  - grammar hint
  - speaking prompt
  - delayed recall prompt

- **Memory Path Mode**
  - word → collocation → sentence → delayed recall
  - can save the word to Quote Vocabulary
  - can save the pattern to collections

- **Weak-Word Rescue Engine**
  - picks the weakest words from real review data
  - explains them again in a lighter, simpler form
  - adds compare/confusion notes and rescue phrases
  - can save weak words into the Difficult folder

- **Sentence Pattern Vault**
  - reusable sentence frames from the current quote, saved patterns, and curated templates
  - one-click save into pattern collections

## Still included from the previous bundle
- Quote → Vocabulary mode
- larger non-repeating daily quote rotation
- 1-click preset bundles
- Liquid Glass / Postcard / Film Frame UI packs
- Focus Room
- collections for quotes, words, and patterns
- weekly recap
- left-side liquid-glass Pomodoro mini widget

## Main files changed
- upgrade.js
- upgrade.css
- manifest.json
- upgrade_smoke_test.js

## Quick test
1. Load the extension folder in Chrome
2. Open Review
3. Check:
   - classic mode still works
   - Daily Saying opens and shows the new lesson card
   - Memory Path opens and can save a word/pattern
   - Weak-Word Rescue opens and shows real weak words when available
   - Pattern Vault opens and can save sentence frames
   - old study modes still behave as before
4. Optional: run `node upgrade_smoke_test.js` inside the folder


## Added in this wallpaper + pattern expansion
- **Expanded Sentence Pattern Vault**
  - many more curated structures across daily English, emotional English, study language, speaking, and writing
  - vault now surfaces more patterns at once instead of only a few starter templates
- **Anime-inspired wallpaper UI packs**
  - Anime Study Room
  - Rainy Window Night
  - Cafe Notes
  - Dream Sky Minimal
  - Neon City Memory
- **New 1-click wallpaper presets** built from those packs while keeping classic mode available

## Design safeguard
Wallpaper themes stay optional and use dark/glass reading surfaces so the background mood feels richer without making the learning text hard to read.
