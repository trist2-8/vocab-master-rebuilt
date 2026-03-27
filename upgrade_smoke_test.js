
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
assert.ok(upgradeJs.includes('layoutPackGrid'), 'upgrade.js should include layout pack customization');
assert.ok(upgradeJs.includes('dailySayingModal'), 'upgrade.js should include daily saying modal');
assert.ok(upgradeJs.includes('QUOTE_STYLES'), 'upgrade.js should define quote styles');
assert.ok(upgradeJs.includes('FONT_TONES'), 'upgrade.js should define font tones');
assert.ok(upgradeJs.includes('PRESETS'), 'upgrade.js should define presets');
assert.ok(upgradeCss.includes('body[data-ui-layout="split"]'), 'upgrade.css should include split layout styles');
assert.ok(upgradeCss.includes('.daily-saying-launcher'), 'upgrade.css should style the daily saying launcher');
assert.ok(upgradeCss.includes('body[data-ui-font-tone="editorial"]'), 'upgrade.css should include font tone styles');
assert.ok(manifest.version, 'manifest.json should have a version');

new vm.Script(upgradeJs, { filename: 'upgrade.js' });

console.log('Smoke tests passed.');
