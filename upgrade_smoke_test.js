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
const effectsCss = read('styles/upgrade-effects.css');
const vocabJs = read('vocab.js');
const manifest = JSON.parse(read('manifest.json'));

assert.ok(html.includes('src/upgrade/data.js'), 'vocab.html should load upgrade data script');
assert.ok(html.includes('src/upgrade/effects.js'), 'vocab.html should load upgrade effects script');
assert.ok(html.includes('upgrade.js'), 'vocab.html should load main upgrade script');
assert.ok(upgradeJs.includes('window.VMUpgradeData') || upgradeJs.includes('const { THEMES'), 'upgrade.js should consume modular upgrade data');
assert.ok(dataJs.includes('const THEMES'), 'data.js should define themes');
assert.ok(dataJs.includes('PATTERN_TEMPLATES'), 'data.js should define pattern templates');
assert.ok(dataJs.includes('anime-room'), 'data.js should include Anime Study Room theme');
assert.ok(dataJs.includes('rainy-window'), 'data.js should include Rainy Window Night theme');
assert.ok(dataJs.includes('cafe-notes'), 'data.js should include Cafe Notes theme');
assert.ok(dataJs.includes('dream-sky'), 'data.js should include Dream Sky Minimal theme');
assert.ok(dataJs.includes('neon-city'), 'data.js should include Neon City Memory theme');
assert.ok((dataJs.match(/id: 'q\d+'/g) || []).length >= 40, 'data.js should ship with at least 40 daily quotes');
assert.ok(upgradeJs.includes('weatherEffectSelect'), 'upgrade.js should expose weather effect controls');
assert.ok(upgradeJs.includes('weatherIntensityRange'), 'upgrade.js should expose weather intensity control');
assert.ok(upgradeJs.includes('weatherSpeedRange'), 'upgrade.js should expose weather speed control');
assert.ok(upgradeJs.includes('function clampRange'), 'upgrade.js should define clampRange for modular atmosphere controls');
assert.ok(upgradeJs.includes('ensureUpgradeState'), 'upgrade.js should normalize null state before rendering modular panels');
assert.ok(upgradeJs.includes('VMUpgradeEffects'), 'upgrade.js should call the atmosphere effects module');
assert.ok(upgradeJs.includes('syncSavedQuoteIdsFromCollections'), 'upgrade.js should synchronize saved quote ids safely');
assert.ok(effectsJs.includes('VMUpgradeEffects'), 'effects.js should define the upgrade effects module');
assert.ok(effectsJs.includes('apply({ effect ='), 'effects.js should expose an apply method');
assert.ok(upgradeCss.includes('@import url("./styles/upgrade-effects.css")'), 'upgrade.css should import modular effects CSS');
assert.ok(effectsCss.includes('.vm-weather-layer'), 'effects CSS should define the weather layer');
assert.ok(effectsCss.includes('vm-rain-fall'), 'effects CSS should define rain animation');
assert.ok(effectsCss.includes('vm-snow-fall'), 'effects CSS should define snow animation');
assert.ok(vocabJs.includes('review-dashboard-view'), 'vocab.js should still target the review dashboard');
assert.ok(manifest.version, 'manifest.json should have a version');

new vm.Script(dataJs, { filename: 'data.js' });
new vm.Script(effectsJs, { filename: 'effects.js' });
new vm.Script(upgradeJs, { filename: 'upgrade.js' });

console.log('Smoke tests passed.');
