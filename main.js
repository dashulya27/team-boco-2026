import { createCatIslandLevel } from "./cat-island.js?v=1.9.1";
import { createMissionController } from "./mission.js?v=1.9.1";
import { createRoomBackground } from "./room-background.js?v=1.9.1";
import { loadSpriteAssets } from "./sprite-assets.js?v=1.9.1";
import { ROOM_BULBS } from './room-layout.js?v=1.9.1';
import { drawFinaleIsland, drawFutureIsland } from './finale-island.js?v=1.9.1';

import { createPaperAccessController, safeSessionStorage } from './paper-access.js?v=1.9.1';
import { createWorldCamera, WORLD_VIEWPORT, WORLD_NODES, drawNeonConnection } from './world-camera.js?v=1.9.1';
import { drawEntryIsland } from './finale-island.js?v=1.9.1';
import { paintVelvetSky,paintWorldDepth,paintMapLanterns,paintIslandWeather,paintFairyWorld } from './world-atmosphere.js?v=1.9.1';

const BUILD_VERSION = "1.9.1";
const IS_PREVIEW = false;
const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches??false;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const missionPanel = document.getElementById('mission-panel');
const storage=IS_PREVIEW?safeSessionStorage({}):safeSessionStorage(window);
const mission = createMissionController(missionPanel,storage,{onClose:returnToMap,onComplete:completeFinale});
const paperPanel=document.getElementById('paper-entry');
const paperAccess=createPaperAccessController(paperPanel,storage,{preview:IS_PREVIEW,onEnter:completePaperAccess,onLock:lockWorld});
const paperArt=document.getElementById('entry-art');
const worldDock=document.getElementById('world-dock');
const camera=createWorldCamera({reducedMotion});
let pendingIsland=null,entryElapsed=0;
let drag=null,lastThumbnailTime=-100;
const WORLD_DESCRIPTIONS=[
  'Coco und Bounty sind wieder wach. Eine kleine Nachtschicht für unseren Lieblingsmenschen.',
  'Eine letzte Nachricht. Dein Schlüssel aus der Papier-Mission ist schon im Decoder.',
  'Hier wachsen unsere nächsten Geschichten. Schau dich um — wir bauen noch weiter. ♥'
];

ctx.imageSmoothingEnabled = false;

const keys = new Set();
const pointer = { x: 0, y: 0 };
let paused=false;
let roomThumbnail, finalThumbnail, futureThumbnail;
let selectedIsland=0, mapNotice='', mapNoticeUntil=0;

const KEY_BY_CODE = {
  KeyW: "w",
  KeyA: "a",
  KeyS: "s",
  KeyD: "d",
  KeyE: "e",
  KeyR: "r",
  ArrowUp: "arrowup",
  ArrowDown: "arrowdown",
  ArrowLeft: "arrowleft",
  ArrowRight: "arrowright",
  Escape: "escape",
  Enter: "enter",
  Digit1:"1", Digit2:"2", Digit3:"3"
};

const gameState = {
  scene: "map",
  catIslandCompleted: mission.progress.cats,
  finaleCompleted: mission.progress.complete
};

const [mapIsland,finalMapIsland,futureMapIsland]=WORLD_NODES;
const moduleRows = [0,1,2].map(i=>({x:27,y:141+i*86,width:146,height:72}));
const worldNodes=WORLD_NODES;

const stars = createStars(96);

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error(`Bild fehlt: ${source}`)));

    image.src = source;
  });
}

let catIsland;

async function start() {
  try {
    const [roomImage, assets] = await Promise.all([loadImage(
      `./assets/rooms/cat-room/cat-room-structure.png?v=${BUILD_VERSION}`
    ).catch(() => createRoomBackground(document)),loadSpriteAssets()]);

    catIsland = createCatIslandLevel({
      canvas,
      ctx,
      roomImage,
      assets,
      onExit: returnToMap,
      onComplete: completeCatIsland
    });

    catIsland.draw(0,{interface:false});
    roomThumbnail=document.createElement('canvas');roomThumbnail.width=960;roomThumbnail.height=640;
    roomThumbnail.getContext('2d').drawImage(canvas,0,0);

    finalThumbnail=document.createElement('canvas');finalThumbnail.width=960;finalThumbnail.height=640;
    futureThumbnail=document.createElement('canvas');futureThumbnail.width=960;futureThumbnail.height=640;
    if(gameState.catIslandCompleted)selectedIsland=1;
    document.getElementById('preview-tools').hidden=!IS_PREVIEW;
    paperAccess.start();
    requestAnimationFrame(gameLoop);
  } catch (error) {
    drawLoadError(error.message);
    console.error(error);
  }
}

function enterCatIsland(restart = false) {
  if (!catIsland || !paperPanel.hidden) return;
  if(restart || catIsland.getSnapshot().phase==='win') catIsland.reset();
  gameState.scene = "catIsland";
  document.body.dataset.scene = "catIsland";
  keys.clear();
  canvas.focus({preventScroll:true});
}

function returnToMap() {
  if(!paperPanel.hidden)return;
  pendingIsland=null;camera.overview();worldDock.hidden=true;document.body.dataset.mapFocus='false';
  gameState.scene = "map";
  document.body.dataset.scene = "map";
  keys.clear();
  document.querySelector('.game-shell').inert=false;
  canvas.focus({preventScroll:true});
}

function enterFinaleIsland() {
  if(!paperPanel.hidden)return;
  if(IS_PREVIEW&&!gameState.catIslandCompleted){mission.recordCats();gameState.catIslandCompleted=true;}
  if(!gameState.catIslandCompleted){showMapNotice('Coco und Bounty brauchen dich noch. Danach wartet deine letzte Nachricht. ♥');return;}
  keys.clear();gameState.scene='finaleIsland';document.body.dataset.scene='finaleIsland';
  mission.open();document.querySelector('.game-shell').inert=true;
}
function completeFinale() {
  gameState.finaleCompleted=true;
  document.getElementById('game-status').textContent='Die Nachricht ist entschlüsselt. Dein Geburtstagsgeschenk wurde enthüllt.';
}
function showMapNotice(message) {
  mapNotice=message;mapNoticeUntil=performance.now()+4200;
  document.getElementById('game-status').textContent=message;
}
function activateIsland(index=selectedIsland) {
  if(!paperPanel.hidden)return;
  selectedIsland=index;pendingIsland=null;worldDock.hidden=true;
  if(index===0)enterCatIsland();
  else if(index===1)enterFinaleIsland();
  else {gameState.scene='futureIsland';document.body.dataset.scene='futureIsland';keys.clear();canvas.focus({preventScroll:true});}
}
function lockWorld(){
  pendingIsland=null;keys.clear();worldDock.hidden=true;
  document.body.dataset.scene='entry';document.querySelector('.game-shell').inert=true;
}
function completePaperAccess(key){
  mission.usePaperKey(key);document.querySelector('.game-shell').inert=false;
  document.body.dataset.scene=gameState.scene;
  document.getElementById('game-status').textContent='Dein Papier-Schlüssel passt. Willkommen in unserer kleinen Welt.';
  canvas.focus({preventScroll:true});
}
function focusIsland(index,{enterAfter=false}={}){
  if(!paperPanel.hidden)return;
  selectedIsland=index;camera.focus(index);pendingIsland=enterAfter?{index,time:0}:null;
  updateWorldDock();
}
function beginIslandTransition(index=selectedIsland){
  if(pendingIsland?.index===index)return;
  if(index===1&&!gameState.catIslandCompleted&&!IS_PREVIEW){
    focusIsland(index);showMapNotice('Nach der Nachtschicht öffnet sich deine letzte Nachricht. ♥');return;
  }
  focusIsland(index,{enterAfter:true});
}
function updateWorldDock(){
  worldDock.hidden=gameState.scene!=='map'||camera.focused===null||!paperPanel.hidden;
  document.body.dataset.mapFocus=worldDock.hidden?'false':'true';
  if(worldDock.hidden)return;
  document.getElementById('world-focus-title').textContent=['01 // KATZENINSEL','02 // GESCHENKINSEL','03 // UNSER NÄCHSTES ABENTEUER'][selectedIsland];
  document.getElementById('world-focus-description').textContent=WORLD_DESCRIPTIONS[selectedIsland];
  const open=document.getElementById('world-open');open.disabled=selectedIsland===1&&!gameState.catIslandCompleted&&!IS_PREVIEW;
  open.textContent=selectedIsland===2?'INSEL ANSEHEN':selectedIsland===1&&gameState.finaleCompleted?'DEIN GEBURTSTAGSGRUSS':open.disabled?'NACH DER NACHTSCHICHT':'INSEL BETRETEN';
  document.getElementById('world-zoom-value').textContent=Math.round(camera.targetZoom*100)+'%';
}

function completeCatIsland() {
  gameState.catIslandCompleted = true;
  keys.clear();
  mission.recordCats();
  selectedIsland=1;
  document.getElementById('game-status').textContent='Nachtschicht geschafft. Paw Token gesammelt. Die letzte Insel ist jetzt erreichbar. Enter öffnet die Weltkarte.';
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - (gameLoop.lastTime ?? timestamp)) / 1000, 0.05);
  gameLoop.lastTime = timestamp;

  const artTime=reducedMotion?2000:timestamp;
  if(!paperPanel.hidden){
    drawEntryIsland(ctx,artTime,catIsland.assets,{background:true});
    drawEntryIsland(paperArt.getContext('2d'),artTime,catIsland.assets,{background:true});
  } else if (gameState.scene === "map") {
    camera.update(deltaTime);
    if(pendingIsland){pendingIsland.time+=deltaTime;if(pendingIsland.time>=(reducedMotion?0:.58)){const index=pendingIsland.index;pendingIsland=null;activateIsland(index);}}
    drawWorldMap(artTime,timestamp);updateWorldDock();
  } else if(gameState.scene === "catIsland") {
    if(!paused) catIsland.update(deltaTime, keys);
    catIsland.draw(timestamp);
    if(paused && catIsland.getSnapshot().phase!=='win') {
      ctx.fillStyle='rgba(2,6,15,.65)';ctx.fillRect(0,0,960,640);
      drawText('PAUSE // ZUM SPIEL ZURÜCKKEHREN',480,320,20,'#f2d448','center');
    }
  } else if(gameState.scene==='finaleIsland'){
    drawFinaleIsland(ctx,artTime,catIsland.assets,{complete:mission.progress.complete,background:true});
  } else {
    drawFutureIsland(ctx,artTime,catIsland.assets,{background:true});
    drawText('HIER WACHSEN UNSERE NÄCHSTEN GESCHICHTEN.',480,566,16,'#e7c8ad','center');
    drawText('Ein bisschen Zukunft. Ein bisschen wir. ♥',480,593,13,'#b29eb9','center');
  }
  if(paperPanel.hidden)mission.draw(artTime,catIsland.assets);
  requestAnimationFrame(gameLoop);
}

function drawWorldMap(timestamp,clock=timestamp) {
  catIsland.draw(timestamp,{interface:false});
  const previewCtx=roomThumbnail.getContext('2d');previewCtx.clearRect(0,0,960,640);previewCtx.drawImage(canvas,0,0);
  drawFinaleIsland(finalThumbnail.getContext('2d'),timestamp,catIsland.assets,{complete:gameState.finaleCompleted,locked:!gameState.catIslandCompleted});
  drawFutureIsland(futureThumbnail.getContext('2d'),timestamp,catIsland.assets);
  ctx.clearRect(0,0,960,640);
  paintVelvetSky(ctx,timestamp,{reducedMotion});drawStars(timestamp);drawMapGrid();
  // A connected little world: the OS reference informs layout, not the mood.
  ctx.fillStyle='rgba(31,25,43,.91)';ctx.fillRect(17,17,926,62);ctx.fillRect(17,94,166,513);
  ctx.strokeStyle='#66526b';ctx.lineWidth=1;ctx.strokeRect(17.5,17.5,925,61);ctx.strokeRect(17.5,94.5,165,512);ctx.strokeRect(196.5,94.5,746,512);
  ctx.fillStyle='#e3bd83';ctx.fillRect(17,17,4,62);ctx.fillRect(197,95,13,4);
  drawText('BOCO // OUR LITTLE WORLD',37,41,23,'#edcd93');
  drawText('FÜR MEINEN LIEBLINGSMENSCHEN',38,65,10,'#ad9cb7');
  drawText('BIRTHDAY EDITION 2026',921,38,12,'#c7cebd','right');
  drawText((gameState.finaleCompleted?'HAPPY BIRTHDAY, MY MVP ♥':'COCO + BOUNTY ARE WAITING ♥'),921,60,10,'#dba9be','right');
  drawText('UNSERE INSELN',29,117,10,'#95a9a3');
  const labels=['KATZENINSEL','GESCHENKINSEL','NEXT UPDATE'];
  const states=[gameState.catIslandCompleted?'GESCHAFFT / ♥':'NACHTSCHICHT / BEREIT',gameState.finaleCompleted?'FÜR DICH / ♥':gameState.catIslandCompleted?'DEINE LETZTE NACHRICHT':'NACH DER NACHTSCHICHT','COMING SOON'];
  if(camera.focused===null) {
  moduleRows.forEach((row,i)=>{
    const selected=i===selectedIsland,available=i===0||(i===1&&gameState.catIslandCompleted);
    ctx.fillStyle=selected?'#392d41':'#201b2c';ctx.fillRect(row.x,row.y,row.width,row.height);
    ctx.strokeStyle=selected?'#e3bd83':'#54405e';ctx.strokeRect(row.x+.5,row.y+.5,row.width-1,row.height-1);
    drawText('0'+(i+1)+' // '+labels[i],row.x+8,row.y+17,10,selected?'#f4d99e':'#c2aec9');
    drawText(states[i],row.x+8,row.y+39,8,available?'#d7acbf':'#9a86a6');
    ctx.fillStyle='#4c3b56';ctx.fillRect(row.x+8,row.y+55,128,3);
    ctx.fillStyle=selected?'#e7c58d':'#a283a4';ctx.fillRect(row.x+8,row.y+55,i===2?22:available?128:12,3);
  });
  }
  drawText('UNSER KLEINES TEAM',29,449,10,'#ba9db9');
  drawBocoBadge(ctx,99,508,1.05);
  drawText('DOMINIK + DARINA',100,561,9,'#c8c9ae','center');
  drawText('COCO + BOUNTY',100,580,9,'#8fa89f','center');
  drawText('DREI INSELN / EINE KLEINE WELT',217,115,10,'#76958c');
  drawText((Number(gameState.catIslandCompleted)+Number(gameState.finaleCompleted))+' / 2 ABENTEUER GESCHAFFT',920,115,9,'#b1b9a4','right');

  ctx.save();ctx.beginPath();ctx.rect(WORLD_VIEWPORT.x,WORLD_VIEWPORT.y,WORLD_VIEWPORT.width,WORLD_VIEWPORT.height);ctx.clip();camera.apply(ctx);
  paintWorldDepth(ctx,timestamp);
  // Focused view puts the island first: links fade into the atmosphere.
  ctx.save();ctx.globalAlpha=camera.focused===null?.85:.19;
  drawNeonConnection(ctx,[[548,311],[578,317],[594,343],[628,353]],timestamp,{active:gameState.catIslandCompleted});
  drawNeonConnection(ctx,[[747,439],[697,491],[584,509],[516,508]],timestamp,{future:true});
  drawNeonConnection(ctx,[[348,344],[321,359],[323,398],[362,423]],timestamp,{active:true});
  ctx.restore();
  ctx.globalAlpha=.94;ctx.drawImage(roomThumbnail,mapIsland.x,mapIsland.y,mapIsland.width,mapIsland.height);ctx.globalAlpha=1;
  ctx.drawImage(finalThumbnail,finalMapIsland.x,finalMapIsland.y,finalMapIsland.width,finalMapIsland.height);
  ctx.drawImage(futureThumbnail,futureMapIsland.x,futureMapIsland.y,futureMapIsland.width,futureMapIsland.height);
  paintMapLanterns(ctx,timestamp);
  paintFairyWorld(ctx,timestamp,worldNodes);
  paintIslandWeather(ctx,timestamp,worldNodes,{reducedMotion});
  const scale=mapIsland.width/960;
  ROOM_BULBS.concat([[492,194]]).forEach(([x,y],i)=>{
    const color=i>=6&&i<12?'hsl('+((timestamp/85+i*32)%360)+',80%,72%)':'#f9d885';
    ctx.save();ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=6;
    ctx.globalAlpha=.8+Math.sin(timestamp/330+i)*.12;
    ctx.fillRect(Math.round(mapIsland.x+x*scale),Math.round(mapIsland.y+y*scale),2,2);ctx.restore();
  });
  if(camera.focused===null){
    worldNodeLabel(0,388,365,'01 // KATZENINSEL',gameState.catIslandCompleted?'CLEAR · NOCH EINE NACHT':'DREI SCHLÜSSEL · EINE NACHT');
    worldNodeLabel(1,739,470,'02 // DIE LETZTE INSEL',gameState.finaleCompleted?'DEIN GEBURTSTAGSGRUSS ♥':gameState.catIslandCompleted?'VIGENÈRE · GESCHENK ENTDECKEN':'WIRD NACH DER NACHTSCHICHT FREI');
    worldNodeLabel(2,423,577,'03 // NEXT UPDATE','UNSER NÄCHSTES ABENTEUER');
  }
  ctx.restore();
  if(clock<mapNoticeUntil){
    ctx.fillStyle='rgba(6,16,20,.97)';ctx.fillRect(209,126,721,44);ctx.strokeStyle='#746f36';ctx.strokeRect(209.5,126.5,720,43);
    drawText(mapNotice,220,148,10,'#eadb9b');
  }
  drawText('← / → AUSWÄHLEN · ENTER REISEN · ESC ÜBERSICHT',28,624,10,'#8da297');
  drawText('BUILD '+BUILD_VERSION,929,624,9,'#536e64','right');
  // Avoid scanlines across the small pixel sprites and thin interface fonts.
}
// Draw the small identity mark at native canvas resolution instead of
// downscaling the large printed/QR logo (which became an unreadable blob).
function drawBocoBadge(context,x,y,scale=1) {
  context.save();context.translate(x,y);context.scale(scale,scale);
  context.fillStyle='#282336';context.fillRect(-40,-28,80,59);
  context.strokeStyle='#bd98a9';context.strokeRect(-39.5,-27.5,79,58);
  context.fillStyle='#efd5bc';context.font='bold 18px "Courier New",monospace';
  context.textAlign='center';context.fillText('BOCO',0,2);
  context.fillStyle='#e7a3c0';context.fillRect(-15,11,8,5);context.fillRect(-9,17,8,5);
  context.fillStyle='#f7dca1';context.fillRect(5,11,8,5);context.fillRect(2,17,8,5);
  context.restore();
}

function worldNodeLabel(index,x,y,title,subtitle) {
  const selected=selectedIsland===index;
  drawText((selected?'▸ ':'')+title,x,y,14,selected?'#ffe16c':'#a9b5a8','center');
  drawText(subtitle,x,y+21,8,index===2?'#72867e':'#9caba1','center');
}
function drawMapHeart(x,y,size,color) {
  ctx.fillStyle=color;['0110110','1111111','1111111','0111110','0011100','0001000'].forEach((row,iy)=>[...row].forEach((v,ix)=>{if(v==='1')ctx.fillRect(x+ix*size,y+iy*size,size,size);}));
}
function drawStars(timestamp) {
  for (const star of stars) {
    const twinkle = 0.28 + ((Math.sin(timestamp / star.speed + star.phase) + 1) / 2) * 0.52;
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = star.yellow ? "#d9bc35" : "#5a6b88";
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.globalAlpha = 1;
}

function drawMapGrid() {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#263550";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 100);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 100; y <= canvas.height; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawLoadError(message) {
  ctx.fillStyle = "#050812";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawText("ASSET LOAD ERROR", 480, 290, 24, "#ff6577", "center");
  drawText(message, 480, 330, 14, "#d7dbe3", "center");
}

function drawText(text, x, y, size, color, align = "left") {
  ctx.font = `500 ${size}px "Courier New", monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function createStars(amount) {
  let seed = 2026;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return Array.from({ length: amount }, () => ({
    x: Math.floor(random() * canvas.width),
    y: Math.floor(random() * canvas.height),
    size: random() > 0.86 ? 2 : 1,
    speed: 430 + random() * 1100,
    phase: random() * Math.PI * 2,
    yellow: random() > 0.9
  }));
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function pointInside(rect, point) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function normalizedKeyboardKey(event) {
  return KEY_BY_CODE[event.code] ?? event.key.toLowerCase();
}

function dispatchKeyAction(key) {
  if (!catIsland || !missionPanel.hidden || !paperPanel.hidden) return;
  if (gameState.scene === "map") {
    if(key==='arrowleft'||key==='a')focusIsland((selectedIsland+2)%3);
    if(key==='arrowright'||key==='d')focusIsland((selectedIsland+1)%3);
    if(key==='1'||key==='2'||key==='3')focusIsland(Number(key)-1);
    if(key==='enter')beginIslandTransition();
    if(key==='escape'){pendingIsland=null;camera.overview();worldDock.hidden=true;}
    if(key==='r')enterCatIsland(true);
  } else if(gameState.scene==='futureIsland'){
    if(key==='escape'||key==='enter')returnToMap();
  } else {
    catIsland.handleKeyDown(key);
  }
}

function clearHeldKeys() {
  keys.clear();
  document.querySelectorAll(".touch-key.is-active").forEach((button) => {
    button.classList.remove("is-active");
  });
}

window.addEventListener("keydown", (event) => {
  if(!paperPanel.hidden){paperAccess.handleKeyDown(event);return;}
  if(!missionPanel.hidden) {
    if(event.key==='Escape'){event.preventDefault();mission.handleKeyDown('escape');}
    if(event.key==='Tab'){
      const focusable=[...missionPanel.querySelectorAll('button,input,summary')].filter(e=>!e.disabled&&!e.closest('[hidden]'));
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
    return;
  }
  if(event.target?.closest?.('input, textarea, button, summary'))return;
  const key = normalizedKeyboardKey(event);

  if (["w", "a", "s", "d", "e", "r", "escape", "enter", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
    event.preventDefault();
  }

  keys.add(key);

  if (event.repeat) return;
  dispatchKeyAction(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(normalizedKeyboardKey(event));
});

window.addEventListener("blur", () => { paused=true;clearHeldKeys(); });
window.addEventListener("focus", () => { paused=false; });
document.addEventListener("visibilitychange", () => {
  paused=document.hidden;
  if (document.hidden) clearHeldKeys();
});

document.querySelectorAll(".touch-key").forEach((button) => {
  const key = button.dataset.key;

  const release = (event) => {
    event.preventDefault();
    keys.delete(key);
    button.classList.remove("is-active");
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    keys.add(key);
    button.classList.add("is-active");

    if (key === "e") dispatchKeyAction(key);
  });

  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
});

document.querySelectorAll(".touch-tap").forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    dispatchKeyAction(button.dataset.tapKey);
  });
});

canvas.addEventListener("pointermove",(event)=>{
  const point=canvasPoint(event);Object.assign(pointer,point);
  if(drag&&gameState.scene==='map'&&paperPanel.hidden){
    const dx=point.x-drag.last.x,dy=point.y-drag.last.y;
    if(Math.hypot(point.x-drag.start.x,point.y-drag.start.y)>6)drag.moved=true;
    if(drag.moved){pendingIsland=null;camera.panBy(dx,dy);}
    drag.last=point;
  }
});
canvas.addEventListener("pointerdown",(event)=>{
  if(!catIsland||!missionPanel.hidden||!paperPanel.hidden)return;
  const point=canvasPoint(event);
  if(gameState.scene==='map'){drag={start:point,last:point,moved:false};canvas.setPointerCapture?.(event.pointerId);}
  else if(gameState.scene==='catIsland')catIsland.handlePointerDown(point);
});
canvas.addEventListener("pointerup",(event)=>{
  if(!drag)return;
  const moved=drag.moved;drag=null;
  if(moved||gameState.scene!=='map'||!paperPanel.hidden)return;
  const point=canvasPoint(event),worldPoint=camera.screenToWorld(point);
  const row=moduleRows.findIndex(rect=>pointInside(rect,point));
  const index=worldNodes.findIndex(rect=>pointInside(rect,worldPoint));
  if(row>=0)focusIsland(row);
  else if(pointInside(WORLD_VIEWPORT,point)&&index>=0){
    if(camera.focused===index)beginIslandTransition(index);else focusIsland(index);
  }
});
canvas.addEventListener('pointercancel',()=>{drag=null;});
canvas.addEventListener('wheel',event=>{
  if(gameState.scene!=='map'||!paperPanel.hidden)return;
  event.preventDefault();pendingIsland=null;camera.zoomBy(event.deltaY<0 ? .15 : -.15,selectedIsland);updateWorldDock();
},{passive:false});
document.querySelectorAll('[data-mobile-island]').forEach(button=>button.addEventListener('click',()=>{
  focusIsland(Number(button.dataset.mobileIsland));
}));
document.getElementById('world-open').addEventListener('click',()=>beginIslandTransition());
document.getElementById('world-overview').addEventListener('click',()=>{pendingIsland=null;camera.overview();worldDock.hidden=true;canvas.focus({preventScroll:true});});
document.getElementById('world-return').addEventListener('click',returnToMap);
document.querySelectorAll('[data-map-zoom]').forEach(button=>button.addEventListener('click',()=>{
  pendingIsland=null;camera.zoomBy(Number(button.dataset.mapZoom),selectedIsland);updateWorldDock();
}));
document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
  if(!IS_PREVIEW)return;
  const scene=button.dataset.preview;
  if(scene==='entry'){if(!missionPanel.hidden)mission.close();paperAccess.show();return;}
  paperAccess.unlock('SIMPLE',{persist:false});
  if(!missionPanel.hidden)mission.close();
  if(scene==='map')returnToMap();
  if(scene==='cats'){mission.resetPreview();gameState.catIslandCompleted=false;gameState.finaleCompleted=false;enterCatIsland(true);}
  if(scene==='final'){mission.previewPuzzle();gameState.catIslandCompleted=true;gameState.finaleCompleted=false;gameState.scene='finaleIsland';document.body.dataset.scene='finaleIsland';document.querySelector('.game-shell').inert=true;}
  if(scene==='future')activateIsland(2);
  if(scene==='birthday'){mission.previewBirthday();gameState.catIslandCompleted=true;gameState.finaleCompleted=true;gameState.scene='finaleIsland';document.body.dataset.scene='finaleIsland';document.querySelector('.game-shell').inert=true;}
}));

start();
