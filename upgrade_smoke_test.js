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
assert.ok(upgradeJs.includes('renderQuoteLessonCard'), 'upgrade.js should render quote-to-lesson cards');
assert.ok(upgradeJs.includes('renderMemoryPathModal'), 'upgrade.js should include memory path mode');
assert.ok(upgradeJs.includes('renderWeakRescueModal'), 'upgrade.js should include weak-word rescue mode');
assert.ok(upgradeJs.includes('renderPatternVaultModal'), 'upgrade.js should include sentence pattern vault');
assert.ok(upgradeJs.includes('PATTERN_TEMPLATES'), 'upgrade.js should define reusable sentence patterns');
assert.ok(upgradeCss.includes('.memory-path-shell'), 'upgrade.css should style memory path mode');
assert.ok(upgradeCss.includes('.weak-rescue-grid'), 'upgrade.css should style weak-word rescue mode');
assert.ok(upgradeCss.includes('.pattern-vault-grid'), 'upgrade.css should style sentence pattern vault');
assert.ok((upgradeJs.match(/id: 'q\d+'/g) || []).length >= 40, 'upgrade.js should ship with at least 40 daily quotes');
assert.ok(upgradeCss.includes('left: 20px;'), 'upgrade.css should dock the mini Pomodoro widget on the left');
assert.ok(upgradeCss.includes('backdrop-filter: blur(20px);'), 'upgrade.css should use liquid-glass blur for key surfaces');
assert.ok(upgradeCss.includes('body[data-ui-theme="liquidglass"]'), 'upgrade.css should include liquid glass theme styles');
assert.ok(upgradeCss.includes('.focus-room-shell'), 'upgrade.css should style focus room');
assert.ok(upgradeCss.includes('.saved-item-grid'), 'upgrade.css should style collections');

assert.ok(upgradeJs.includes('getWalletSnapshot'), 'upgrade.js should derive a consistent wallet snapshot');
assert.ok(upgradeJs.includes('ensureWalletConsistency'), 'upgrade.js should clamp and synchronize wallet state');
assert.ok(upgradeJs.includes('summarizeSessionHistory'), 'upgrade.js should summarize weekly session history');
assert.ok(upgradeCss.includes('--vm-font-body'), 'upgrade.css should use stable font variables for font-tone switching');
assert.ok(vocabJsIncludesSessionHistory(), 'vocab.js should persist sessionHistory for weekly sync');

function vocabJsIncludesSessionHistory() {
  const vocabJs = read('vocab.js');
  return vocabJs.includes('sessionHistory') && vocabJs.includes('getDateKeyFromTimestamp');
}


assert.ok(upgradeJs.includes("anime-room"), 'upgrade.js should include Anime Study Room theme');
assert.ok(upgradeJs.includes("rainy-window"), 'upgrade.js should include Rainy Window Night theme');
assert.ok(upgradeJs.includes("cafe-notes"), 'upgrade.js should include Cafe Notes theme');
assert.ok(upgradeJs.includes("dream-sky"), 'upgrade.js should include Dream Sky Minimal theme');
assert.ok(upgradeJs.includes("neon-city"), 'upgrade.js should include Neon City Memory theme');
assert.ok(upgradeCss.includes('body[data-ui-theme="anime-room"]'), 'upgrade.css should include Anime Study Room wallpaper theme');
assert.ok(upgradeCss.includes('body[data-ui-theme="rainy-window"]'), 'upgrade.css should include Rainy Window Night wallpaper theme');
assert.ok(upgradeCss.includes('body[data-ui-theme="cafe-notes"]'), 'upgrade.css should include Cafe Notes wallpaper theme');
assert.ok(upgradeCss.includes('body[data-ui-theme="dream-sky"]'), 'upgrade.css should include Dream Sky Minimal wallpaper theme');
assert.ok(upgradeCss.includes('body[data-ui-theme="neon-city"]'), 'upgrade.css should include Neon City Memory wallpaper theme');
assert.ok((upgradeJs.match(/id: '[^']+'/g) || []).filter(x => x.includes('need-not-carry') || x.includes('trying-to') || x.includes('as-a-result')).length >= 3, 'upgrade.js should include expanded curated sentence patterns');

assert.ok(manifest.version, 'manifest.json should have a version');

assert.ok(upgradeJs.includes('getWalletSnapshot'), 'upgrade.js should normalize wallet balance through a shared snapshot');
assert.ok(upgradeJs.includes('ensureWalletConsistency'), 'upgrade.js should include wallet consistency repair');
const vocabJs = read('vocab.js');
assert.ok(vocabJs.includes('getVisibleCoinCount'), 'vocab.js should compute a visible wallet balance');
assert.ok(vocabJs.includes('vm_bonusCoins'), 'vocab.js should read bonus UI coins for wallet sync');
assert.ok(vocabJs.includes('vm_spentCoins'), 'vocab.js should read spent UI coins for wallet sync');
assert.ok(upgradeCss.includes('body[data-ui-font-tone] .insight-label'), 'upgrade.css should keep micro labels on the stable UI font');

new vm.Script(upgradeJs, { filename: 'upgrade.js' });
console.log('Smoke tests passed.');
