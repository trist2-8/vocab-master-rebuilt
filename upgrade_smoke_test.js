const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function read(name) {
  return fs.readFileSync(path.join(__dirname, name), 'utf8');
}

const html = read('vocab.html');
const upgradeJs = read('upgrade.js');
const upgradeCss = read('upgrade.css');
const dataJs = read('src/upgrade/data.js');
const effectsJs = read('src/upgrade/effects.js');
const audioJs = read('src/upgrade/audio.js');
const effectsCss = read('styles/upgrade-effects.css');
const vocabJs = read('vocab.js');
const manifest = JSON.parse(read('manifest.json'));

assert.ok(html.includes('src/upgrade/data.js'), 'vocab.html should load upgrade data script');
assert.ok(html.includes('src/upgrade/effects.js'), 'vocab.html should load upgrade effects script');
assert.ok(html.includes('src/upgrade/audio.js'), 'vocab.html should load upgrade audio script');
assert.ok(html.includes('upgrade.js'), 'vocab.html should load main upgrade script');
assert.ok(upgradeJs.includes('window.VMUpgradeData') || upgradeJs.includes('const { THEMES'), 'upgrade.js should consume modular upgrade data');
assert.ok(dataJs.includes('const THEMES'), 'data.js should define themes');
assert.ok(dataJs.includes('PATTERN_TEMPLATES'), 'data.js should define pattern templates');
['anime-room', 'rainy-window', 'rainy-library', 'snowy-night', 'moonlight-window', 'cafe-notes', 'dream-sky', 'sakura-notes', 'film-diary', 'neon-city'].forEach((id) => {
  assert.ok(dataJs.includes(id), `data.js should include ${id} theme`);
});
assert.ok((dataJs.match(/id: 'q\d+'/g) || []).length >= 40, 'data.js should ship with at least 40 daily quotes');
assert.ok(upgradeJs.includes('weatherEffectSelect'), 'upgrade.js should expose weather effect controls');
assert.ok(upgradeJs.includes('window-rain'), 'upgrade.js should expose new atmosphere effect modes');
assert.ok(upgradeJs.includes('pomodoroAudioToggle'), 'upgrade.js should expose Pomodoro audio controls');
assert.ok(upgradeJs.includes('pomodoroAudioUnlockBtn'), 'upgrade.js should expose an audio unlock button');
assert.ok(upgradeJs.includes('pomodoroAudioSourceSelect'), 'upgrade.js should expose an audio source selector');
assert.ok(upgradeJs.includes('pomodoroCustomAudioInput'), 'upgrade.js should expose a custom audio file input');
assert.ok(upgradeJs.includes('pomodoroAmbientToggle'), 'upgrade.js should expose Pomodoro ambient controls');
assert.ok(upgradeJs.includes('pomodoroAmbientPackSelect'), 'upgrade.js should expose ambient pack selection');
assert.ok(upgradeJs.includes('pomodoroAmbientCustomInput'), 'upgrade.js should expose a custom ambient loop input');
assert.ok(upgradeJs.includes('previewPomodoroAmbient'), 'upgrade.js should preview ambient audio');
assert.ok(upgradeJs.includes('pomodoroAudioTestBtn'), 'upgrade.js should expose an audio test button');
assert.ok(upgradeJs.includes('unlockPomodoroAudio'), 'upgrade.js should unlock audio before cues');
assert.ok(audioJs.includes('unlock'), 'audio.js should expose an unlock helper');
assert.ok(audioJs.includes('data:audio/wav;base64'), 'audio.js should generate built-in wav data urls');
assert.ok(audioJs.includes('getStatus'), 'audio.js should expose audio status');
assert.ok(audioJs.includes('startAmbient'), 'audio.js should support looping ambient playback');
assert.ok(audioJs.includes('stopAmbient'), 'audio.js should stop looping ambient playback');
assert.ok(audioJs.includes('AMBIENT_PACKS'), 'audio.js should define ambient packs');
assert.ok(upgradeCss.includes('.pomodoro-audio-status'), 'upgrade.css should style audio status');
assert.ok(upgradeJs.includes('playPomodoroCue'), 'upgrade.js should play Pomodoro cues');
assert.ok(upgradeJs.includes('getSupportedWeatherEffect'), 'upgrade.js should validate supported weather effects');
assert.ok(effectsJs.includes('VMUpgradeEffects'), 'effects.js should define the upgrade effects module');
assert.ok(effectsJs.includes('window-rain'), 'effects.js should support new atmosphere modes');
assert.ok(audioJs.includes('VMUpgradeAudio'), 'audio.js should define the Pomodoro audio module');
assert.ok(audioJs.includes('soft-bell'), 'audio.js should include audio packs');
assert.ok(upgradeCss.includes('@import url("./styles/upgrade-effects.css")'), 'upgrade.css should import modular effects CSS');
assert.ok(effectsCss.includes('vm-rain-fall'), 'effects CSS should define rain animation');
assert.ok(effectsCss.includes('vm-petal-fall'), 'effects CSS should define petal animation');
assert.ok(effectsCss.includes('vm-neon-float'), 'effects CSS should define neon animation');
assert.ok(upgradeCss.includes('theme-rainy-library'), 'upgrade.css should include Rainy Library previews');
assert.ok(upgradeCss.includes('theme-snowy-night'), 'upgrade.css should include Snowy Quiet Night previews');
assert.ok(upgradeCss.includes('.pomodoro-audio-grid'), 'upgrade.css should style Pomodoro audio controls');
assert.ok(upgradeCss.includes('.pomodoro-custom-audio-row'), 'upgrade.css should style custom audio controls');
assert.ok(upgradeCss.includes('.pomodoro-ambient-grid'), 'upgrade.css should style ambient controls');
assert.ok(vocabJs.includes('review-dashboard-view'), 'vocab.js should still target the review dashboard');
assert.ok(manifest.version, 'manifest.json should have a version');

new vm.Script(dataJs, { filename: 'data.js' });
new vm.Script(effectsJs, { filename: 'effects.js' });
new vm.Script(audioJs, { filename: 'audio.js' });
new vm.Script(upgradeJs, { filename: 'upgrade.js' });

console.log('Smoke tests passed.');
