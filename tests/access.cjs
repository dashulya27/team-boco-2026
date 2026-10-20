const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];

async function run(key, failedFile = '', wrongType = false) {
  const stored = new Map();
  const elements = {
    'access-form': { addEventListener: (_, fn) => { elements.submit = fn; } },
    'access-key': { value: key }, 'feedback': { textContent: '' },
    'start-game': { hidden: true, focus() { this.focused = true; } }
  };
  const context = {
    sessionStorage: { setItem: (k,v) => stored.set(k,v) },
    document: { getElementById: id => elements[id] },
    fetch: async file => ({ ok: file !== failedFile,
      headers: { get: () => wrongType ? 'text/html' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream' } })
  };
  vm.createContext(context); vm.runInContext(code, context);
  await elements.submit({ preventDefault() {} });
  return { elements, stored };
}
(async () => {
  for (const value of ['', 'BOCO', '3427', 'SIMPLEX']) {
    const { elements, stored } = await run(value);
    assert.equal(elements['start-game'].hidden, true);
    assert.match(elements.feedback.textContent, /Noch nicht richtig/);
    assert.equal(stored.size, 0);
  }
  for (const value of ['SIMPLE', 'simple', '  SiMpLe  ', 'S I M P L E']) {
    const { elements, stored } = await run(value);
    assert.equal(elements['start-game'].hidden, false);
    assert.equal(elements['start-game'].focused, true);
    assert.equal(stored.get('boco.paper-access.v1'), 'granted');
  }
  for (const file of ['./game.html', './main.js', './room-background.js', './assets/rooms/cat-room/cat-room-structure.png']) {
    const { elements, stored } = await run('SIMPLE', file);
    assert.equal(elements['start-game'].hidden, true);
    assert.match(elements.feedback.textContent, /Spieldateien/);
    assert.equal(stored.size, 0);
  }
  const badType = await run('SIMPLE', '', true);
  assert.equal(badType.elements['start-game'].hidden, true);
  console.log('Access gate: wrong keys, normalization, handoff, missing files and wrong MIME passed.');
})().catch(error => { console.error(error); process.exitCode = 1; });
