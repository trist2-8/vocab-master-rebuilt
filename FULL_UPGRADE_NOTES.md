# FULL UPGRADE NOTES

This bundle keeps the original learning flow intact and adds a safer upgrade layer on top.

## Added
- Layout packs: Classic, Split Dashboard, Stacked Focus, Spotlight Hero, Compact Flow
- Font tones: System Sans, Editorial, Friendly Rounded, Mono Study
- Daily Saying launcher button on the review dashboard
- Daily Saying modal card with save/previous/next actions
- Quote style packs: Soft Rescue, Glass Whisper, Letter Note, Spotlight Scene
- One-click presets built from unlocked packs
- Mini preview cards inside the customization modal
- Smoke test file: `upgrade_smoke_test.js`

## Preserved
- Original add-word flow
- Set management
- Review logic and study modes
- Existing flashcard/quiz/study systems
- Classic/default UI remains available

## How to test
1. Load the extension folder in Chrome.
2. Open the review screen.
3. Check:
   - Classic mode still works.
   - Customize UI modal opens.
   - Layout packs, font tones, and quote styles appear.
   - Daily Saying button opens the larger quote card.
   - Pomodoro mini clock still works.
4. Optional smoke test:
   - Run `node upgrade_smoke_test.js` inside the extension folder.


## Revision 3
- Preset 1 chạm now works as a real bundle: if packs are missing, the preset can unlock the missing parts and apply in one click.
- Daily saying now rotates through a much larger built-in quote library and avoids quick repeats by using a shuffled cycle stored in extension state.
- Pomodoro mini widget is now docked on the left and uses stronger liquid-glass blur styling.
