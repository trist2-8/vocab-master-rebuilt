# Vocab Master Phase Next — Modular Atmosphere Pack

This pass keeps the original goal fixed at the top:
- preserve the original purpose
- keep the extension simple and learning-first
- strengthen vocabulary retention and long-term memory
- avoid losing old features
- keep visual upgrades optional

## What changed
- reorganized the upgrade layer into smaller branches/files
  - `upgrade.js` = main controller
  - `src/upgrade/data.js` = themes, presets, quotes, pattern banks
  - `src/upgrade/effects.js` = dynamic rain/snow atmosphere logic
  - `styles/upgrade-effects.css` = atmosphere effect styling
- added optional **Atmosphere effects** inside UI customization
  - Off
  - Rain
  - Snow
  - effect density slider
  - effect speed slider
- kept all old study views and the classic/default flow intact

## Why this is safer
The core study engine stays where it was. Only the upgrade layer was redistributed, so the structure is cleaner without rewriting the review logic.

## Quick test
1. Load the extension folder in Chrome
2. Open Review → Tùy biến UI
3. Check:
   - Theme shop still works
   - Admin still works
   - New Atmosphere effects section appears
   - Rain and Snow can be turned on and off
   - Classic mode still works
