# v8.2.3 review speed fix

This build focuses on one issue: moving into and out of Review should feel immediate.

## What changed
- Review now opens with the fast shell first.
- Deep review panels no longer auto-render every time you enter Review.
- The deep section loads only when opened.
- Duplicate Review initialization is throttled so one navigation does not trigger repeated rerenders.
- Contrast queue work is cached to avoid redoing expensive comparisons on every Review entry.
- Entering Review now auto-collapses the deep-dive section for faster navigation.
- Set-specific Review opens keep the selected set via a lightweight pending-set handoff.

## Validation
- `node --check vocab.js`
- `node --check upgrade.js`
- `node upgrade_smoke_test.js`
