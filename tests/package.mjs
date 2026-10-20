import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const files = ['index.html','game.html','main.js','mission.js','cat-island.js','room-background.js','styles.css',
  'assets/branding/boco.png','assets/qr/BOCO_GAME_QR.png','assets/rooms/cat-room/cat-room-structure.png'];
for (const file of files) assert.ok((await stat(new URL(file, root))).size > 0, `Missing: ${file}`);
await stat(new URL('.nojekyll', root));
for (const file of ['index.html','game.html','main.js']) {
  const text = await readFile(new URL(file, root), 'utf8');
  for (const match of text.matchAll(/(?:src=|href=|from\s+)["'](\.\/[^"']+)["']/g)) {
    const target = new URL(match[1], new URL(file, root));
    target.search = '';
    assert.ok((await stat(target)).isFile(), `Unresolved reference in ${file}: ${fileURLToPath(target)}`);
  }
}
const room = await readFile(new URL('assets/rooms/cat-room/cat-room-structure.png', root));
assert.equal(room.subarray(1,4).toString(), 'PNG');
assert.equal(room.readUInt32BE(16), 960); assert.equal(room.readUInt32BE(20), 640);
console.log('Project package: every runtime file/reference, logo, QR and 960×640 room are present.');
