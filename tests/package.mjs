import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const files = ['index.html','game.html','main.js','mission.js','cat-island.js','finale-island.js','room-background.js','styles.css',
  'pixel-art.js','sprite-assets.js','room-layout.js','island-decor.js','paper-access.js','world-camera.js','assets/sprites/manifest.json','assets/sprites/characters-original.jpeg','assets/sprites/furniture-atlas.png',
  'assets/branding/boco.png','assets/qr/BOCO_GAME_QR.png','assets/rooms/cat-room/cat-room-structure.png'];
for (const file of files) assert.ok((await stat(new URL(file, root))).size > 0, `Missing: ${file}`);
await stat(new URL('.nojekyll', root));
for (const file of ['index.html','game.html','main.js','cat-island.js','finale-island.js','mission.js','room-layout.js','pixel-art.js','sprite-assets.js','island-decor.js','paper-access.js','world-camera.js']) {
  const text = await readFile(new URL(file, root), 'utf8');
  for (const match of text.matchAll(/(?:src=|href=|from\s+)["'](\.\/[^"']+)["']/g)) {
    const target = new URL(match[1], new URL(file, root));
    target.search = '';
    assert.ok((await stat(target)).isFile(), `Unresolved reference in ${file}: ${fileURLToPath(target)}`);
  }
}
const manifest=JSON.parse(await readFile(new URL('assets/sprites/manifest.json',root),'utf8'));
const main=await readFile(new URL('main.js',root),'utf8'),html=await readFile(new URL('game.html',root),'utf8');
for(const match of main.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g))assert.ok(html.includes(`id="${match[1]}"`),'Missing runtime element: '+match[1]);
for(const config of Object.values(manifest.sprites)) {
  if(config?.src) assert.ok((await stat(new URL(config.src,new URL('assets/sprites/manifest.json',root)))).size>0);
}
const room = await readFile(new URL('assets/rooms/cat-room/cat-room-structure.png', root));
assert.equal(room.subarray(1,4).toString(), 'PNG');
assert.equal(room.readUInt32BE(16), 960); assert.equal(room.readUInt32BE(20), 640);
console.log('Project package: every runtime file/reference, logo, QR and 960×640 room are present.');
