# Vocab Master v6.7.1 hotfix

- Fixed missing `handleSuggestionAction` crash in `vocab.js`
- Fixed Smart Suggestion candidate records missing the `word` field
- Hardened suggestion sorting against malformed items
- Added automatic `recoveryVault` snapshot before normalization on load
- Added working actions for appending suggestions to the input box and saving them directly
- Made suggestion pool building safer when old malformed records exist
