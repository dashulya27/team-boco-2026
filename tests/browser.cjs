const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const prefix = '/team-boco-2026/';
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png' };
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
    await route.fulfill({ response, body:await response.text() + '\nwindow.__BOCO_TEST__ = { level: () => catIsland };' });
  });
  await desktop.addInitScript(() => {
    let seed = 17;
    Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  });
  const page = await desktop.newPage(); observe(page);
  await page.goto(base + 'game.html'); await page.waitForURL(base);
  await page.locator('#access-key').fill('wrong'); await page.locator('button[type=submit]').click();
  await page.getByText('Noch nicht richtig.', { exact:false }).waitFor();
  await page.locator('#access-key').fill(' simple '); await page.locator('button[type=submit]').click();
  await page.locator('#start-game').waitFor({ state:'visible' });
  await page.locator('#start-game').click(); await page.waitForURL(base + 'game.html');
  await page.waitForFunction(() => window.__BOCO_TEST__?.level());
  await checkFrame(page,1366,768);
  for (const [width,height] of [[1280,600],[1024,600]]) {
    await page.setViewportSize({width,height}); await checkFrame(page,width,height);
  }
  await page.setViewportSize({width:1366,height:768});
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().phase), 'chase');
  const playerX = await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().player.x);
  await page.keyboard.down('d'); await page.waitForTimeout(180); await page.keyboard.up('d');
  assert.ok(await page.evaluate(() => window.__BOCO_TEST__.level().getSnapshot().player.x) > playerX,
    'Actual keyboard input must move Dominik');
  await page.screenshot({path:path.join(root,'test-artifacts/browser-room.png')});

  const result = await page.evaluate(() => {
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
        const point=queue[i]; if (distance(point,target)<35) { end=point; break; }
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
      if (state.phase==='win') return state;
      const target=state.carrying ? {x:140,y:350} : state.activeCats.reduce((a,b) =>
        !a||distance(b,state.player)<distance(a,state.player) ? b : a,null);
      const keys=new Set(['e']);
      if (target) {
        if (frame%9===0||!points.length) points=route(state.player,target);
        while (points.length&&distance(points[0],state.player)<8) points.shift();
        const next=points[0]||target;
        if (next.x-state.player.x>3) keys.add('d'); if (next.x-state.player.x < -3) keys.add('a');
        if (next.y-state.player.y>3) keys.add('s'); if (next.y-state.player.y < -3) keys.add('w');
      }
      level.update(1/30,keys);
    }
    throw new Error('Mission did not finish');
  });
  assert.equal(result.catsDelivered,3);
  await page.getByRole('heading',{name:'COCO PROTOCOL // VIGENÈRE'}).waitFor();
  await page.locator('#mission-answer').fill('BOMBSITE B'); await page.locator('#mission-panel button').click();
  await page.getByText('Noch nicht richtig. Prüfe den wiederholten Schlüssel',{exact:false}).waitFor();
  await page.locator('#mission-answer').fill('Das Geschenk ist bei Bombsite A.'); await page.locator('#mission-panel button').click();
  await page.getByRole('heading',{name:'BINARY AUTHENTICATION'}).waitFor();
  await page.locator('#mission-answer').fill('2626'); await page.locator('#mission-panel button').click();
  await page.getByText('Noch nicht richtig. Prüfe jede 8-Bit-Gruppe',{exact:false}).waitFor();
  await page.locator('#mission-answer').fill('3427'); await page.locator('#mission-panel button').click();
  await page.getByRole('heading',{name:'MISSION COMPLETE'}).waitFor();
  await page.screenshot({path:path.join(root,'test-artifacts/browser-finale.png')});
  await page.reload(); await page.waitForFunction(() => window.__BOCO_TEST__?.level());
  await page.keyboard.press('Enter'); await page.getByRole('heading',{name:'MISSION COMPLETE'}).waitFor();

  const mobile = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone = await mobile.newPage(); observe(phone);
  await phone.goto(base); await phone.locator('#access-key').fill('SIMPLE'); await phone.locator('button[type=submit]').click();
  await phone.locator('#start-game').click();
  await phone.waitForFunction(() => document.querySelector('#gameCanvas').getContext('2d').getImageData(400,300,1,1).data[3]===255);
  await checkFrame(phone,390,844);
  await phone.locator('#gameCanvas').tap({position:{x:195,y:130}});
  await phone.locator('#gameCanvas').tap({position:{x:195,y:130}});
  await phone.locator('.touch-controls').waitFor({state:'visible'});
  await phone.locator('.touch-action').tap();
  await phone.screenshot({path:path.join(root,'test-artifacts/browser-phone.png')});
  await phone.setViewportSize({width:844,height:390}); await checkFrame(phone,844,390);
  await phone.evaluate(() => sessionStorage.setItem('boco.mission.v1',JSON.stringify({cats:true})));
  await phone.reload();
  await phone.waitForFunction(() => document.querySelector('#gameCanvas').getContext('2d').getImageData(400,300,1,1).data[3]===255);
  await phone.locator('#gameCanvas').tap({position:{x:280,y:170}});
  await phone.locator('#mission-answer').waitFor({state:'visible'});
  await phone.setViewportSize({width:390,height:844});
  const dialog = await phone.locator('#mission-panel').boundingBox();
  assert.ok(dialog.x >= 0 && dialog.x+dialog.width <= 391 && dialog.y >= 0 && dialog.y+dialog.height <= 845);
  assert.deepEqual(errors,[]); assert.deepEqual(failed,[]);
  console.log('Browser passed: GitHub project subpath, gate, real keyboard, three deliveries → actual finale, wrong/correct answers, reload, 600px laptop, touch portrait/landscape; no JS or HTTP errors.');
})().catch(error => { console.error(error); process.exitCode=1; }).finally(async () => {
  if (browser) await browser.close(); server.close();
});
