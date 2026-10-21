const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const prefix = '/team-boco-2026/';
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpeg':'image/jpeg','.json':'application/json' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) throw new Error('Wrong project path');
    const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (path.relative(root, file).startsWith('..')) throw new Error('Outside root');
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type':types[path.extname(file)] || 'application/octet-stream' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end('Not found'); }
});

let browser;
const errors = [], failed = [];
function observe(page) {
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
}
async function checkFrame(page, width, height) {
  const box = await page.locator('.game-frame').boundingBox();
  assert.ok(box.x >= -1 && box.y >= -1 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1,
    `Clipped canvas at ${width}×${height}: ${JSON.stringify(box)}`);
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}${prefix}`;
  browser = await chromium.launch({ headless:true, executablePath:process.env.BOCO_CHROMIUM_PATH || undefined,
    args:['--no-sandbox','--disable-dev-shm-usage'] });
  const desktop = await browser.newContext({ viewport:{ width:1366, height:768 } });
  // Test-only instrumentation. The shipped main.js exposes no cheat/debug API.
  await desktop.route('**/main.js?*', async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body:await response.text() + '\nwindow.__BOCO_TEST__ = { level: () => catIsland, camera:()=>camera };' });
  });
  await desktop.addInitScript(() => {
    let seed = 17;
    Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  });
  const page = await desktop.newPage(); observe(page);
  await page.goto(base + 'game.html');
  await page.waitForFunction(() => window.__BOCO_TEST__?.level());
  assert.equal(page.url(),base+'game.html','Fresh direct entry must remain in the world');
  assert.equal(await page.evaluate(() => sessionStorage.getItem('boco.paper-access.v1')),null);
  await page.locator('#paper-entry').waitFor({state:'visible'});
  await page.locator('#paper-key').fill('BOCO');await page.locator('#paper-form button').click();
  assert.match(await page.locator('#paper-feedback').textContent(),/Schlüsselwort/);
  await page.locator('#paper-key').fill('SIMPLE');await page.locator('#paper-form button').click();
  await page.locator('#paper-entry').waitFor({state:'hidden'});
  await page.goto(base); await page.waitForURL(base + 'game.html');
  await page.waitForFunction(() => window.__BOCO_TEST__?.level());
  await page.locator('#paper-entry').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('boco.paper-access.v1')),'SIMPLE');
  const atlas=await page.evaluate(() => {
    const assets=window.__BOCO_TEST__.level().assets;
    const coco=assets.get('coco').poseImages.down.image;
    const pixels=coco.getContext('2d');
    return { loaded:[...assets.keys()], corner:pixels.getImageData(0,0,1,1).data[3],fur:pixels.getImageData(130,160,1,1).data[3] };
  });
  for(const id of ['dominik','darina','coco','bounty','bed','nightstand','wardrobe','tvCabinet','chair','airPurifier'])
    assert.ok(atlas.loaded.includes(id),'Sprite not loaded: '+id);
  assert.equal(atlas.corner,0,'White background must be transparent');
  assert.equal(atlas.fur,255,'Enclosed white fur must remain opaque');
  await checkFrame(page,1366,768);
  for (const [width,height] of [[1280,600],[1024,600]]) {
    await page.setViewportSize({width,height}); await checkFrame(page,width,height);
  }
  await page.setViewportSize({width:1366,height:768});
  await page.keyboard.press('1');await page.waitForTimeout(300);
  assert.ok(await page.evaluate(()=>window.__BOCO_TEST__.camera().zoom)>1.2,'Selection must zoom the world camera');
  await page.screenshot({path:path.join(root,'test-artifacts/browser-island-zoom.png')});
  await page.keyboard.press('Enter');await page.waitForFunction(()=>document.body.dataset.scene==='catIsland');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().phase), 'chase');
  const playerX = await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().player.x);
  await page.keyboard.down('d'); await page.waitForTimeout(180); await page.keyboard.up('d');
  assert.ok(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().player.x) > playerX,
    'Actual keyboard input must move Dominik');
  await page.screenshot({path:path.join(root,'test-artifacts/browser-room.png')});

  const drive = async stopOnCarry => page.evaluate(stopOnCarry => {
    const level = window.__BOCO_TEST__.level();
    const step = 12, cells = [];
    for (let y=0;y<640;y+=step) for (let x=0;x<960;x+=step)
      if (level.canPlayerStand(x,y)) cells.push({x,y,id:`${x},${y}`});
    const byId = new Map(cells.map(point => [point.id,point]));
    const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
    function route(player,target) {
      const start = cells.reduce((a,b) => distance(a,player)<distance(b,player) ? a : b);
      const queue=[start], parents=new Map([[start.id,null]]); let end;
      for (let i=0;i<queue.length;i++) {
        const point=queue[i]; if (distance(point,target)<12) { end=point; break; }
        for (const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]) {
          const id=`${point.x+dx},${point.y+dy}`;
          if (byId.has(id)&&!parents.has(id)) { parents.set(id,point); queue.push(byId.get(id)); }
        }
      }
      const points=[]; while (end) { points.unshift(end); end=parents.get(end.id); } return points;
    }
    let points=[];
    for (let frame=0;frame<18000;frame++) {
      const state=level.getSnapshot();
      if (!state.catsInsideBounds) throw new Error('Cat left safe floor');
      if (state.phase==='win'||(stopOnCarry&&state.carrying)) return state;
      const target=state.carrying ? {x:145,y:350} : state.activeCats.reduce((a,b) =>
        !a||distance(b,state.player)<distance(a,state.player) ? b : a,null);
      const keys=new Set(['e']);let dt=1/30;
      if (target) {
        if (frame%9===0||!points.length) points=route(state.player,target);
        while (points.length&&distance(points[0],state.player)<1) points.shift();
        const next=points[0]||target;
        const dx=next.x-state.player.x,dy=next.y-state.player.y;
        if(Math.abs(dx)>.5){keys.add(dx>0?'d':'a');dt=Math.min(dt,Math.abs(dx)/(168*(state.carrying ? .84 : 1)));}
        else if(Math.abs(dy)>.5){keys.add(dy>0?'s':'w');dt=Math.min(dt,Math.abs(dy)/(168*(state.carrying ? .84 : 1)));}
      }
      level.update(dt,keys);
    }
    throw new Error('Mission did not finish');
  },stopOnCarry);
  const carried = await drive(true);
  assert.ok(carried.carrying,'Carrying a cat must be reachable');
  await page.waitForTimeout(80);
  await page.screenshot({path:path.join(root,'test-artifacts/browser-carrying.png')});
  const result = await drive(false);
  assert.equal(result.catsDelivered,3);
  assert.equal(await page.locator('#mission-panel').isHidden(),true,'First island must show its own win screen');
  await page.waitForTimeout(80);
  await page.screenshot({path:path.join(root,'test-artifacts/browser-win.png')});
  assert.match(await page.locator('#game-status').textContent(),/Paw Token/);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('body').getAttribute('data-scene'),'map');
  await page.screenshot({path:path.join(root,'test-artifacts/browser-map-completed.png')});
  await page.keyboard.press('Enter');
  await page.locator('#mission-panel').waitFor({state:'visible'});
  assert.equal(await page.locator('#vigenere-key').inputValue(),'SIMPLE','Reuse paper key');
  await page.locator('.decode-actions .finale-primary').click();
  await page.locator('.discover-gift').waitFor({state:'visible'});
  await page.locator('.discover-gift').click();
  assert.equal(await page.locator('#finale-title').textContent(),'Dein PC wartet auf dich!');
  assert.equal(await page.locator('#mission-answer').count(),0);
  await page.screenshot({path:path.join(root,'test-artifacts/browser-birthday.png')});
  await page.locator('.finale-back').click();
  await page.keyboard.press('1');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.body.dataset.scene==='catIsland');await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().phase),'chase','Completed island must be replayable');
  await page.keyboard.press('Escape');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.body.dataset.scene==='catIsland');
  assert.equal(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().phase),'chase','Map return must resume the current night');
  await page.keyboard.press('r');
  assert.equal(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().phase),'intro');
  await page.keyboard.press('Enter');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const pausedCats=await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().activeCats);
  await page.waitForTimeout(120);
  assert.deepEqual(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().activeCats),pausedCats,'Blur must pause cats');
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.reload();await page.waitForFunction(() => window.__BOCO_TEST__?.level());
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('boco.mission.v1')).cats),true);
  assert.equal(await page.evaluate(() => JSON.parse(sessionStorage.getItem('boco.mission.v1')).complete),true);

  const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone = await mobile.newPage(); observe(phone);
  await phone.goto(base);
  await phone.locator('#paper-entry').waitFor({state:'visible'});
  await phone.locator('#paper-key').fill('simple');await phone.locator('#paper-form button').click();await phone.locator('#paper-entry').waitFor({state:'hidden'});
  await phone.waitForFunction(() => document.querySelector('#gameCanvas').getContext('2d').getImageData(400,300,1,1).data[3]===255);
  await checkFrame(phone,390,844);
  let phoneCanvas=await phone.locator('#gameCanvas').boundingBox();
  await phone.locator('#gameCanvas').tap({position:{x:phoneCanvas.width*80/960,y:phoneCanvas.height*175/640}});
  await phone.locator('#world-open').click();await phone.waitForFunction(()=>document.body.dataset.scene==='catIsland');
  await phone.locator('#gameCanvas').tap({position:{x:100,y:100}});
  await phone.locator('.touch-controls').waitFor({state:'visible'});
  await phone.locator('.touch-action').tap();
  await phone.screenshot({path:path.join(root,'test-artifacts/browser-phone.png')});
  await phone.setViewportSize({width:844,height:390}); await checkFrame(phone,844,390);
  await phone.locator('.touch-utility [data-tap-key="escape"]').tap();
  assert.equal(await phone.locator('body').getAttribute('data-scene'),'map');
  phoneCanvas=await phone.locator('#gameCanvas').boundingBox();
  await phone.locator('#gameCanvas').tap({position:{x:phoneCanvas.width*80/960,y:phoneCanvas.height*175/640}});
  await phone.locator('#world-open').click();await phone.waitForFunction(()=>document.body.dataset.scene==='catIsland');
  await phone.locator('.touch-controls').waitFor({state:'visible'});
  await phone.setViewportSize({width:390,height:844});
  for(const button of await phone.locator('.touch-controls button').all()) {
    const box=await button.boundingBox();
    assert.ok(box.x>=0 && box.y>=0 && box.x+box.width<=391 && box.y+box.height<=845,'Touch button outside viewport');
  }
  // The separate file must also work via file:// without neighbouring assets.
  const preview = await desktop.newPage(); observe(preview);
  await preview.goto(require('node:url').pathToFileURL(path.join(root,'BOCO_PREVIEW.html')).href);
  await preview.waitForFunction(() => document.querySelector('#gameCanvas').getContext('2d').getImageData(400,300,1,1).data[3]===255);
  await preview.screenshot({path:path.join(root,'test-artifacts/browser-world-preview.png')});
  await preview.locator('[data-preview="cats"]').click();await preview.keyboard.press('Enter');
  await preview.keyboard.down('d'); await preview.waitForTimeout(180); await preview.keyboard.up('d');
  await preview.screenshot({path:path.join(root,'test-artifacts/browser-room-preview.png')});
  await preview.locator('[data-preview="birthday"]').click();
  assert.equal(await preview.locator('#finale-title').textContent(),'Dein PC wartet auf dich!');
  await preview.locator('[data-preview="entry"]').click();await preview.locator('#paper-entry').waitFor({state:'visible'});
  await preview.locator('[data-preview="map"]').click();await preview.locator('#paper-entry').waitFor({state:'hidden'});
  assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
  console.log('Browser passed: one paper gate, saved entry, zoom, original sprites, cats, reused key/Vigenère/PC, replay/pause, laptop/touch layout and isolated organizer scene previews; no JS or HTTP errors.');
})().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => {
  if (browser) await browser.close(); server.close();
});
