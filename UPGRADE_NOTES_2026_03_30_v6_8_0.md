# Vocab Master v6.8.0

## Main upgrades
- Added 3 language lanes: English Focus, Balanced Bilingual, and Pure Vietnamese
- Added Set Intelligence panel to analyze coverage, weak clusters, next best cluster, and current language lane
- Rebuilt Smart Suggestions refresh so it rotates by suggestion lane instead of re-showing nearly the same deck
- Added suggestion grouping: contrast / bridge / topic / pattern
- Removed one duplicate compare-candidate parser and cleaned one duplicate support hide call
- Localized core Learning / Library / Review surfaces and the main study support flow
- Kept settings persistent in storage through `vm_settings`

## Basic checks run
- `node --check vocab.js`
- `node --check upgrade.js`
- `node --check src/upgrade/data.js`
- `node --check src/upgrade/audio.js`
- `node --check src/upgrade/effects.js`

## Notes
- Existing stored vocabulary should remain compatible
- Fallback wordset value stays `Chưa phân loại` internally to avoid splitting old data
