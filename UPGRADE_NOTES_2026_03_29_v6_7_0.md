# Vocab Master v6.7.0

## Main changes
- rebuilt Smart Suggestions so they follow the currently selected word set first
- refresh now rotates to a different suggestion group instead of re-rendering the same cards
- suggestions now prioritize:
  - confusion pairs for weak or at-risk words
  - topic-aligned bridge words
  - gap-filling core vocabulary
  - pattern bridges when the set already contains phrases/patterns
- added suggestion context note so you can see which set the engine is using
- moved UI/coin/focus customization away from the review dashboard into the management/studio area
- kept the review dashboard more learning-focused and less visually crowded

## Why this version matters
This pass separates two jobs that were fighting each other:
1. learning and review
2. UI rewards / customization / coin spending

That should make testing cleaner and help the system feel less redundant.
