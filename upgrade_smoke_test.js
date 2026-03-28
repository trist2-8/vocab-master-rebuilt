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
const manifest = JSON.parse(read('manifest.json'));

assert.ok(html.includes('upgrade.css'), 'vocab.html should load upgrade.css');
assert.ok(html.includes('upgrade.js'), 'vocab.html should load upgrade.js');
assert.ok(upgradeJs.includes('QUOTE_WORD_BANK'), 'upgrade.js should define quote vocabulary hints');
assert.ok(upgradeJs.includes('ensureDailyQuoteFreshness'), 'upgrade.js should rotate daily quotes with a shuffled cycle');
assert.ok(upgradeJs.includes('collectionsModal'), 'upgrade.js should include saved collections modal');
assert.ok(upgradeJs.includes('focusRoomModal'), 'upgrade.js should include focus room modal');
assert.ok(upgradeJs.includes('weeklyRecapModal'), 'upgrade.js should include weekly recap modal');
assert.ok(upgradeJs.includes('getPresetBundlePrice'), 'upgrade.js should support 1-click preset bundle pricing');
assert.ok(upgradeJs.includes('saveSelectedQuoteWordToVocabulary'), 'upgrade.js should support quote to vocabulary saving');
assert.ok((upgradeJs.match(/id: 'q\d+'/g) || []).length >= 40, 'upgrade.js should ship with at least 40 daily quotes');
assert.ok(upgradeCss.includes('left: 20px;'), 'upgrade.css should dock the mini Pomodoro widget on the left');
assert.ok(upgradeCss.includes('backdrop-filter: blur(20px);'), 'upgrade.css should use liquid-glass blur for key surfaces');
assert.ok(upgradeCss.includes('body[data-ui-theme="liquidglass"]'), 'upgrade.css should include liquid glass theme styles');
assert.ok(upgradeCss.includes('.focus-room-shell'), 'upgrade.css should style focus room');
assert.ok(upgradeCss.includes('.saved-item-grid'), 'upgrade.css should style collections');
assert.ok(manifest.version, 'manifest.json should have a version');

new vm.Script(upgradeJs, { filename: 'upgrade.js' });
console.log('Smoke tests passed.');
