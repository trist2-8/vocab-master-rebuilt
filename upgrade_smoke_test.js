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
const dataJs = read('data.js');
const effectsJs = read('effects.js');
const audioJs = read('audio.js');
const effectsCss = read('upgrade-effects.css');
const vocabJs = read('vocab.js');
const manifest = JSON.parse(read('manifest.json'));

assert.ok(html.includes('data.js'), 'vocab.html should load upgrade data script');
assert.ok(html.includes('effects.js'), 'vocab.html should load upgrade effects script');
assert.ok(html.includes('audio.js'), 'vocab.html should load upgrade audio script');
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
assert.ok(upgradeJs.includes('pomodoroPlaylistFolderInput'), 'upgrade.js should expose a folder input for .webm playlist files');
assert.ok(upgradeJs.includes('playPomodoroCue'), 'upgrade.js should play Pomodoro cues');
assert.ok(upgradeJs.includes('getSupportedWeatherEffect'), 'upgrade.js should validate supported weather effects');
assert.ok(effectsJs.includes('VMUpgradeEffects'), 'effects.js should define the upgrade effects module');
assert.ok(effectsJs.includes('window-rain'), 'effects.js should support new atmosphere modes');
assert.ok(audioJs.includes('VMUpgradeAudio'), 'audio.js should define the Pomodoro audio module');
assert.ok(audioJs.includes('soft-bell'), 'audio.js should include audio packs');
assert.ok(upgradeCss.includes('@import url("./upgrade-effects.css")'), 'upgrade.css should import modular effects CSS');
assert.ok(effectsCss.includes('vm-rain-fall'), 'effects CSS should define rain animation');
assert.ok(effectsCss.includes('vm-petal-fall'), 'effects CSS should define petal animation');
assert.ok(effectsCss.includes('vm-neon-float'), 'effects CSS should define neon animation');
assert.ok(upgradeCss.includes('theme-rainy-library'), 'upgrade.css should include Rainy Library previews');
assert.ok(upgradeCss.includes('theme-snowy-night'), 'upgrade.css should include Snowy Quiet Night previews');
assert.ok(upgradeCss.includes('.pomodoro-audio-grid'), 'upgrade.css should style Pomodoro audio controls');
assert.ok(vocabJs.includes('review-dashboard-view'), 'vocab.js should still target the review dashboard');
assert.ok(manifest.version, 'manifest.json should have a version');

new vm.Script(dataJs, { filename: 'data.js' });
new vm.Script(effectsJs, { filename: 'effects.js' });
new vm.Script(audioJs, { filename: 'audio.js' });
new vm.Script(upgradeJs, { filename: 'upgrade.js' });

console.log('Smoke tests passed.');
