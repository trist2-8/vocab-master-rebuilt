# Vocab Master 6.6.0 — System Optimization Pass

Main work in this pass:
- auto-clean duplicate vocabulary entries within the same set
- merge richer metadata instead of stacking repeated copies
- optimize import, quick add, rescue save, and suggestion save through the same dedupe pipeline
- smarter coverage queue to reduce near-duplicate study items appearing too close together
- safer related-word insertion so Rescue Lane does not create redundant clusters
- decluttered upgrade hub with collapse / expand control
- lighter Pomodoro study dock placement
- package cleanup for a leaner extension build

What changed in behavior:
- exact or near-duplicate entries are now merged instead of silently multiplying
- import/save flows keep the richer version of phonetic, meaning, example, notes, and tags
- study sessions now try to alternate concept families and entry types more intelligently
- rescue suggestions still appear, but the queue avoids piling up highly similar words back-to-back
