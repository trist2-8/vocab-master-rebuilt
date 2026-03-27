# Vocab Master Full Upgrade — Revision 2

This revision keeps the original learning flow intact and updates only the additive upgrade layer.

## What changed in this revision
- Daily saying data is still local and curated inside `upgrade.js` via the `DAILY_QUOTES` array.
- Rebalanced quote copy so English, Vietnamese translation, and helper note feel shorter and visually cleaner.
- Simplified the daily saying modal intro copy.
- Adjusted the daily saying layout so the left visual block and right text block feel more balanced.
- Moved the floating Pomodoro mini widget to the lower-left side to avoid competing with right-side save/favorite actions.
- Restyled the floating Pomodoro mini widget with a stronger blurred glass / liquid-glass look.
- Kept classic mode and all old study features unchanged.

## Main source files changed
- `upgrade.js`
- `upgrade.css`

## Daily saying data source
Right now the daily saying content comes from the extension itself, not from an API.
It is stored locally in:
- `upgrade.js` → `const DAILY_QUOTES = [...]`

That means it works offline and is easy to edit later.
