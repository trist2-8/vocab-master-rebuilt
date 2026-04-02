# v9.1.1 control center + progress + admin quick-task fix

## Fixed
- Rebalanced the Interface Control Center so the 4 cards use a cleaner equal-width layout.
- Made the admin card action row more consistent, with the repair button on its own full row.
- Improved copy spacing and button sizing so the section is easier to read.
- Fixed set progress so the visible percentage reflects real learning momentum instead of waiting for full mastery only.
- Added mastery percent as a secondary detail while the main bar now shows learning progress.
- Fixed admin quick-task coin updates so the visible balance refreshes immediately in the admin modal and top control card.
- Strengthened the wallet commit/render path to update UI before and after storage sync.

## Files changed
- vocab.js
- upgrade.js
- upgrade.css

## Validation
- node --check vocab.js
- node --check upgrade.js
- node upgrade_smoke_test.js
