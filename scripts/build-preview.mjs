import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const image = async name => 'data:image/png;base64,' + (await readFile(new URL(name,root))).toString('base64');
const [page,css,main,room] = await Promise.all([
  read('game.html'),read('styles.css'),read('main.js'),
  image('assets/rooms/cat-room/cat-room-structure.png')
]);
const modules = await Promise.all(['cat-island.js','finale-island.js','mission.js','room-background.js'].map(read));
const support=await Promise.all(['room-layout.js','sprite-assets.js','pixel-art.js','island-decor.js','paper-access.js','world-camera.js'].map(read));
const manifest=JSON.parse(await read('assets/sprites/manifest.json'));
const encoded=new Map();
const imageSources={};
for(const sprite of Object.values(manifest.sprites)) {
  if(!sprite?.src)continue;
  const file=new URL(sprite.src,new URL('assets/sprites/manifest.json',root));
  if(!encoded.has(file.href)) {
    const mime=/\.jpe?g$/i.test(file.pathname)?'image/jpeg':'image/png';
    const id='embedded-'+encoded.size;
    imageSources[id]='data:'+mime+';base64,'+(await readFile(file)).toString('base64');
    encoded.set(file.href,id);
  }
  sprite.src=encoded.get(file.href);
}
const standaloneMain = main
  .replace(/^import\s+[^;]+;\s*$/gm,'')
  .replace('const IS_PREVIEW = false;', 'const IS_PREVIEW = true;')
  .replace('`./assets/rooms/cat-room/cat-room-structure.png?v=${BUILD_VERSION}`',JSON.stringify(room))
  .replace('loadSpriteAssets()', 'loadSpriteAssets({ manifest:'+JSON.stringify(manifest)+', imageSources:'+JSON.stringify(imageSources)+' })');
if (standaloneMain.includes('import ') || !standaloneMain.includes(room)) {
  throw new Error('Preview bundling did not resolve every dependency');
}
const flatten=text=>text.replace(/^import\s+[^;]+;\s*$/gm,'').replace(/^export\s+/gm,'');
const script = [...support,...modules].map(flatten).concat(standaloneMain)
  .join('\n').replace(/<\/script/gi,'<\\/script');
const preview = page
  .replace(/<title>[^<]+<\/title>/,'<title>BOCO // Unsere kleine Welt</title>')
  .replace(/<link rel="icon"[^>]+>/,'<link rel="icon" href="data:,">')
  .replace(/<link rel="stylesheet"[^>]+>/,`<style>${css}</style>`)
  .replace(/<script type="module" src="[^\"]+"><\/script>/,`<script type="module">${script}</script>`);
if (/\b(?:src|href)="\.\//.test(preview)) throw new Error('Preview still references an external file');
await writeFile(new URL('BOCO_PREVIEW.html',root),preview);
console.log('Built BOCO_PREVIEW.html: standalone organizer preview, direct scene controls, no paper gate or server required.');
