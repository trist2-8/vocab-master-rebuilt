# Vocab Master – Phase 2 Upgrade Notes

This package starts the upgrade process without changing the original purpose of the extension.

## Phase 2 focus
- keep the extension simple
- improve vocabulary retention and long-term memory
- avoid adding noisy features

## Implemented in this phase
- kept the Phase 1 recommended-study flow
- added a lightweight **memory confidence** model for each word
- introduced five memory stages: **Mới, Làm quen, Đang nhớ, Khá chắc, Rất vững**
- made review scheduling depend on confidence growth instead of only streak
- added a dashboard stage strip so learners can see how their memory is developing
- added a memory-stage badge inside flashcard sessions
- updated set summaries to reflect the memory ladder instead of only learned/not learned

## Why this is still a safe upgrade
The study modes remain the same and the interface is still simple. The main change is under the hood: progress is tracked in a way that better matches long-term memory growth without forcing users to learn a new system.

## Good next steps
1. Add a daily study target based on due/new/weak counts
2. Improve answer matching for synonyms and partial meanings
3. Add a gentler progress recap at the end of each session
4. Improve set-level insights while keeping the interface lightweight
