# Vocab Master Phase Next Bundle

This bundle keeps the original learning-first flow intact while adding optional layers around it.

## Preserved
- Classic/default UI still works
- Existing add-word, set management, review logic, study modes, and long-term-memory flow stay intact
- New features are optional and mostly live in the upgrade layer

## Added in one go
- Quote → Vocabulary mode inside Daily Saying
- Larger daily quote pool with shuffled non-repeating rotation
- 1-click preset bundles that can unlock missing packs and apply everything at once
- New UI packs: Liquid Glass, Postcard, Film Frame, Liquid Glow
- Focus Room modal for calmer one-word study
- Saved collections for quotes, words, and sentence patterns
- Weekly recap modal for recent study + focus activity
- Liquid-glass Pomodoro mini widget on the left

## Main files changed
- upgrade.js
- upgrade.css
- manifest.json
- upgrade_smoke_test.js

## Quick test
1. Load the extension folder in Chrome
2. Open Review
3. Check:
   - Classic mode still works
   - Customize UI modal opens
   - Presets can unlock/apply bundles
   - Daily Saying opens and shows quote word chips
   - Quote word can be saved into Quote Vocabulary
   - Focus Room opens
   - Collections modal shows saved items
   - Weekly recap opens
   - Mini Pomodoro appears on the left with glass blur
4. Optional: run `node upgrade_smoke_test.js` inside the folder
