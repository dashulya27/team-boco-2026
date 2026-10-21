import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = spawn(process.execPath, [fileURLToPath(new URL('../scripts/serve.mjs', import.meta.url))],
  { env:{...process.env,BOCO_PORT:'0'}, stdio:['ignore','pipe','pipe'] });
try {
  const base = await new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error('Server did not start')),5000);
    server.on('error',reject);
    server.once('exit',code => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    server.stdout.on('data',bytes => {
      const match = String(bytes).match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  for (const [file,type] of [['','text/html'],['game.html','text/html'],['main.js','text/javascript'],
    ['room-background.js','text/javascript'],['styles.css','text/css'],
    ['assets/rooms/cat-room/cat-room-structure.png','image/png'],['assets/branding/boco.png','image/png'],
    ['assets/sprites/characters-original.jpeg','image/jpeg']]) {
    const response = await fetch(base+file);
    assert.equal(response.status,200,file);
    assert.ok(response.headers.get('content-type').startsWith(type),file);
    assert.ok((await response.arrayBuffer()).byteLength>0,file);
  }
  const head = await fetch(base+'main.js',{method:'HEAD'});
  assert.equal(head.status,200); assert.equal(await head.text(),'');
  assert.equal((await fetch(base+'missing.png')).status,404);
  assert.equal((await fetch(base,{method:'POST'})).status,405);
  console.log('Local server: HTML, modules, CSS, images, HEAD, missing file and method handling passed.');
} finally { server.kill(); }
