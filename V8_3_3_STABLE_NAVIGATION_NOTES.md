# V8.3.3 Stable Navigation Fix

This build focuses on one thing: making section switching feel immediate again.

## What changed
- replaced stacked navigation behavior with one final stable view router
- hidden views are no longer re-mounted on every switch
- add words / library / review now mount only when dirty
- review prewarm/background warming is disabled
- cached `getSetStats()` results to avoid repeated full rescans of the same word arrays
- cached coverage queue generation used by review recommendations
- review dashboard now opens with a lighter shell first
- review deep analysis stays deferred until explicitly opened
- exiting study no longer forces a synchronous review init
- the back button from set details no longer forces a blocking management re-init

## Targeted problem paths
- Review -> Library
- Library -> Add words
- Add words -> Review
- Study -> Exit

## Validation
- `node --check vocab.js`
- `node upgrade_smoke_test.js`
