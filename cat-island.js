import { createPixelArt } from "./pixel-art.js?v=1.7.0";
import { ROOM_FLOOR,ROOM_OUTLINE,ROOM_DOOR,ROOM_BULBS,paintRoomDoor } from './room-layout.js?v=1.7.0';

const WIDTH = 960;
const HEIGHT = 640;
const REQUIRED_DELIVERIES = 3;
const CATCH_DISTANCE = 48;
const JUMP_TRIGGER_DISTANCE = 58;

const COLORS = {
  navy: "#07101f",
  navySoft: "#101c32",
  blue: "#1d3452",
  yellow: "#f2d448",
  yellowSoft: "#c7a936",
  white: "#dce3e8",
  magenta: "#6a355f",
  wood: "#57412f",
  woodLight: "#79593a",
  green: "#62e69a"
};

// CAT AI 1/4: Persönliche Werte von Coco und Bounty.
const INITIAL_CATS = [
  {
    id: "coco",
    name: "COCO",
    collar: COLORS.yellow,
    spawn: { x: 700, y: 455 },
    speed: 90,
    alertRadius: 142,
    jumpDistance: 64,
    jumpCooldown: 3,
    recoveryDuration: 0.85
  },
  {
    id: "bounty",
    name: "BOUNTY",
    collar: "#7ea5d8",
    spawn: { x: 555, y: 335 },
    speed: 84,
    alertRadius: 132,
    jumpDistance: 58,
    jumpCooldown: 3.6,
    recoveryDuration: 1
  }
];

const CAT_TARGETS = [
  { x: 325, y: 500 },
  { x: 525, y: 330 },
  { x: 710, y: 470 },
  { x: 685, y: 355 },
  { x: 500, y: 535 },
  { x: 575, y: 390 }
];

export function createCatIslandLevel({ canvas, ctx, roomImage, assets = new Map(), onExit, onComplete }) {
  const screenCtx=ctx;
  const worldCanvas=canvas.ownerDocument?.createElement('canvas');
  if(worldCanvas) { worldCanvas.width=480; worldCanvas.height=320; }
  const worldCtx=worldCanvas?.getContext('2d') || ctx;
  const art=createPixelArt(worldCtx,assets);
  let drawTime=0;
  const particles=[];
  const levelData = {
    playableArea: ROOM_FLOOR.map(([x,y]) => ({x,y})),

    catArea: [
      { x: 88, y: 356 },
      { x: 404, y: 235 },
      { x: 876, y: 420 },
      { x: 520, y: 582 },
      { x: 184, y: 497 }
    ],

    door: ROOM_DOOR,

    obstacles: [
      { id: "bed", points: [{x:260,y:350},{x:361,y:310},{x:453,y:422},{x:350,y:465}] },
      { id: "nightstand", x: 450, y: 326, width: 46, height: 46 },
      { id: "wardrobe", x: 781, y: 380, width: 90, height: 43 },
      { id: "tvCabinet", x: 650, y: 308, width: 104, height: 54 },
      { id: "chair", x: 156, y: 452, width: 64, height: 54 },
      { id: "airPurifier", x: 635, y: 425, width: 46, height: 51 }
    ]
  };

  const player = {
    x: 500,
    y: 500,
    width: 20,
    height: 31,
    speed: 168,
    direction: "down",
    moving: false,
    step: 0
  };

  const state = {
    phase: "intro",
    elapsed: 0,
    deliveries: [],
    catsDelivered: 0,
    carriedCat: null,
    activeCats: [],
    returningCat: null,
    returnTimer: 0,
    catSerial: 0,
    toast: "",
    toastTimer: 0,
    keyFlash: 0
  };

  function reset() {
    state.phase = "intro";
    state.elapsed=0;
    state.deliveries=[];
    particles.length=0;
    state.catsDelivered = 0;
    state.carriedCat = null;
    state.activeCats = [];
    state.returningCat = null;
    state.returnTimer = 0;
    state.catSerial = 0;
    state.toast = "";
    state.toastTimer = 0;
    state.keyFlash = 0;

    player.x = 500;
    player.y = 500;
    player.direction = "down";
    player.moving = false;
    player.step = 0;
  }

  function startMission() {
    if (state.phase !== "intro") return;

    state.phase = "chase";
    player.x = 490;
    player.y = 485;
    state.activeCats = INITIAL_CATS.map((catData) => createCat(catData));
    showToast("COCO + BOUNTY MACHEN NACHTSCHICHT");
  }

  function createCat(catData, spawn = catData.spawn) {
    const profileId = catData.sourceId ?? catData.id;
    const profile = INITIAL_CATS.find((catProfile) => catProfile.id === profileId) ?? catData;
    const cat = {
      id: `${profileId}-${state.catSerial}`,
      sourceId: profileId,
      name: profile.name,
      collar: profile.collar,
      x: spawn.x,
      y: spawn.y,
      radius: 12,
      speed: profile.speed,
      alertRadius: profile.alertRadius,
      jumpDistance: profile.jumpDistance,
      jumpCooldownDuration: profile.jumpCooldown,
      jumpCooldown: 1.6 + Math.random() * 0.8,
      recoveryDuration: profile.recoveryDuration,
      recoveryTimer: 0,
      jump: null,
      jumpHeight: 0,
      behavior: "wander",
      escapeTimer: 0,
      targetX: spawn.x,
      targetY: spawn.y,
      retargetTimer: 0,
      direction: "down",
      moving: false,
      tailPhase: 0
    };

    state.catSerial += 1;
    chooseCatTarget(cat);
    return cat;
  }

  function update(deltaTime, keys) {
    deltaTime=Math.min(.05,Math.max(0,Number(deltaTime)||0));
    for(let i=particles.length-1;i>=0;i--) {
      const p=particles[i];p.life-=deltaTime;p.x+=p.vx*deltaTime;p.y+=p.vy*deltaTime;p.vy+=24*deltaTime;
      if(p.life<=0) particles.splice(i,1);
    }
    state.toastTimer = Math.max(0, state.toastTimer - deltaTime);
    state.keyFlash = Math.max(0, state.keyFlash - deltaTime);

    if (state.phase === "intro" || state.phase === "win") return;

    state.elapsed+=deltaTime;
    updatePlayer(deltaTime, keys);

    // E darf gehalten werden: Sobald Dominik nah genug ist, greift er automatisch zu.
    if (state.phase === "chase" && keys.has("e")) interact();

    for (const cat of state.activeCats) updateCat(deltaTime, cat);
    separateCats();

    if (state.returningCat) {
      state.returnTimer -= deltaTime;

      if (state.returnTimer <= 0) {
        const returnSpawn = state.returningCat.sourceId === "coco"
          ? { x: 730, y: 465 }
          : { x: 555, y: 385 };

        state.activeCats.push(createCat(state.returningCat, returnSpawn));
        showToast(`${state.returningCat.name} IST SCHON WIEDER DA`);
        state.returningCat = null;

        if (state.phase !== "carrying") state.phase = "chase";
      }
    }

    if (state.phase === "carrying" && distance(player, levelData.door) < levelData.door.radius) {
      deliverCat();
    }

  }

  function updatePlayer(deltaTime, keys) {
    let dx = 0;
    let dy = 0;

    if (keys.has("w") || keys.has("arrowup")) dy -= 1;
    if (keys.has("s") || keys.has("arrowdown")) dy += 1;
    if (keys.has("a") || keys.has("arrowleft")) dx -= 1;
    if (keys.has("d") || keys.has("arrowright")) dx += 1;

    player.moving = dx !== 0 || dy !== 0;

    if (!player.moving) return;

    const length = Math.hypot(dx, dy);
    dx /= length;
    dy /= length;

    if (Math.abs(dx) > Math.abs(dy)) {
      player.direction = dx > 0 ? "right" : "left";
    } else {
      player.direction = dy > 0 ? "down" : "up";
    }

    const carryingPenalty = state.phase === "carrying" ? 0.84 : 1;
    const movement = player.speed * carryingPenalty * deltaTime;

    tryMovePlayer(dx * movement, 0);
    tryMovePlayer(0, dy * movement);
    player.step += deltaTime * 9;
  }

  function tryMovePlayer(dx, dy) {
    const nextX = player.x + dx;
    const nextY = player.y + dy;

    if (canStand(nextX, player.y, 9)) player.x = nextX;
    if (canStand(player.x, nextY, 9)) player.y = nextY;
  }

  // CAT AI 2/4: Entscheidet pro Frame zwischen Wandern, Flucht und Sprung.
  function updateCat(deltaTime, cat) {
    cat.retargetTimer -= deltaTime;
    cat.escapeTimer -= deltaTime;
    cat.jumpCooldown = Math.max(0, cat.jumpCooldown - deltaTime);
    cat.recoveryTimer = Math.max(0, cat.recoveryTimer - deltaTime);
    cat.tailPhase += deltaTime * (cat.behavior === "flee" ? 12 : 8);

    cat.moving=false;
    if (cat.jump) {
      cat.moving=true;
      updateCatJump(deltaTime, cat);
      return;
    }

    // Nach jeder Landung bleibt die Katze kurz stehen. Das ist das faire Fangfenster.
    if (cat.recoveryTimer > 0) {
      cat.behavior = "recover";
      return;
    }

    const playerDistance = distance(cat, player);
    let targetX = cat.targetX;
    let targetY = cat.targetY;
    let speed = cat.speed * 0.52;

    if (playerDistance < JUMP_TRIGGER_DISTANCE && cat.jumpCooldown <= 0 && startCatJump(cat)) {
      updateCatJump(deltaTime, cat);
      return;
    }

    if (playerDistance < cat.alertRadius) {
      cat.behavior = "flee";
      speed = cat.speed * 1.05;

      if (cat.escapeTimer <= 0 || distance(cat, { x: targetX, y: targetY }) < 24) {
        chooseEscapeTarget(cat);
        targetX = cat.targetX;
        targetY = cat.targetY;
      }
    } else if (cat.retargetTimer <= 0 || distance(cat, { x: targetX, y: targetY }) < 18) {
      cat.behavior = "wander";
      chooseCatTarget(cat);
      targetX = cat.targetX;
      targetY = cat.targetY;
    }

    const directionX = targetX - cat.x;
    const directionY = targetY - cat.y;
    const length = Math.hypot(directionX, directionY) || 1;
    const moveX = (directionX / length) * speed * deltaTime;
    const moveY = (directionY / length) * speed * deltaTime;

    const oldX = cat.x;
    const oldY = cat.y;

    if (canCatStand(cat.x + moveX, cat.y)) cat.x += moveX;
    if (canCatStand(cat.x, cat.y + moveY)) cat.y += moveY;

    cat.moving=Math.hypot(cat.x-oldX,cat.y-oldY)>.05;
    if(cat.moving) cat.direction=Math.abs(cat.x-oldX)>Math.abs(cat.y-oldY)
      ? (cat.x>oldX?'right':'left') : (cat.y>oldY?'down':'up');
    if (cat.x === oldX && cat.y === oldY) {
      if (cat.behavior === "flee") chooseEscapeTarget(cat);
      else chooseCatTarget(cat);
    }
  }

  function startCatJump(cat) {
    const playerDistance = Math.max(distance(cat, player), 1);
    const awayX = (cat.x - player.x) / playerDistance;
    const awayY = (cat.y - player.y) / playerDistance;
    const angles = [0, Math.PI / 4, -Math.PI / 4, Math.PI / 2, -Math.PI / 2];
    const candidates = [];

    for (const angle of angles) {
      const rotatedX = awayX * Math.cos(angle) - awayY * Math.sin(angle);
      const rotatedY = awayX * Math.sin(angle) + awayY * Math.cos(angle);
      const landing = {
        x: cat.x + rotatedX * cat.jumpDistance,
        y: cat.y + rotatedY * cat.jumpDistance
      };

      const pathClear=Array.from({length:9},(_,i) => ({
        x:lerp(cat.x,landing.x,(i+1)/9),y:lerp(cat.y,landing.y,(i+1)/9)
      })).every(p => canCatStand(p.x,p.y));
      if (pathClear) {
        candidates.push(landing);
      }
    }

    if (candidates.length === 0) return false;

    candidates.sort((first, second) => {
      const firstScore = distance(first, player) + nearestOtherCatDistance(first, cat) * 0.18;
      const secondScore = distance(second, player) + nearestOtherCatDistance(second, cat) * 0.18;
      return secondScore - firstScore;
    });

    const landing = candidates[0];
    cat.jump = {
      fromX: cat.x,
      fromY: cat.y,
      toX: landing.x,
      toY: landing.y,
      elapsed: 0,
      duration: cat.sourceId === "coco" ? 0.42 : 0.47
    };
    cat.jumpCooldown = cat.jumpCooldownDuration + Math.random() * 0.65;
    cat.behavior = "jump";
    cat.targetX = landing.x;
    cat.targetY = landing.y;
    return true;
  }

  function updateCatJump(deltaTime, cat) {
    cat.jump.elapsed += deltaTime;
    const progress = Math.min(cat.jump.elapsed / cat.jump.duration, 1);
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    cat.x = lerp(cat.jump.fromX, cat.jump.toX, eased);
    cat.y = lerp(cat.jump.fromY, cat.jump.toY, eased);
    cat.jumpHeight = Math.sin(progress * Math.PI) * 17;

    if (progress >= 1) {
      cat.x = cat.jump.toX;
      cat.y = cat.jump.toY;
      cat.jump = null;
      cat.jumpHeight = 0;
      cat.behavior = "recover";
      cat.recoveryTimer = cat.recoveryDuration;
      chooseEscapeTarget(cat);
    }
  }

  function chooseEscapeTarget(cat) {
    const targets = CAT_TARGETS.filter((point) => canCatStand(point.x, point.y));

    targets.sort((first, second) => {
      const firstScore =
        distance(first, player) - distance(first, cat) * 0.12 + nearestOtherCatDistance(first, cat) * 0.16;
      const secondScore =
        distance(second, player) - distance(second, cat) * 0.12 + nearestOtherCatDistance(second, cat) * 0.16;
      return secondScore - firstScore;
    });

    const target = targets[0] ?? { x: cat.x, y: cat.y };
    cat.targetX = target.x;
    cat.targetY = target.y;
    cat.escapeTimer = 0.72 + Math.random() * 0.38;
    cat.retargetTimer = cat.escapeTimer;
  }

  function nearestOtherCatDistance(point, currentCat) {
    const otherCats = state.activeCats.filter((cat) => cat !== currentCat);

    if (otherCats.length === 0) return 120;
    return Math.min(...otherCats.map((cat) => distance(point, cat)));
  }

  function separateCats() {
    const minimumDistance = 34;

    for (let firstIndex = 0; firstIndex < state.activeCats.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < state.activeCats.length; secondIndex += 1) {
        const first = state.activeCats[firstIndex];
        const second = state.activeCats[secondIndex];

        if (first.jump || second.jump) continue;

        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const currentDistance = Math.hypot(dx, dy);

        if (currentDistance === 0 || currentDistance >= minimumDistance) continue;

        const push = (minimumDistance - currentDistance) / 2;
        const pushX = (dx / currentDistance) * push;
        const pushY = (dy / currentDistance) * push;

        if (canCatStand(first.x - pushX, first.y - pushY)) {
          first.x -= pushX;
          first.y -= pushY;
        }

        if (canCatStand(second.x + pushX, second.y + pushY)) {
          second.x += pushX;
          second.y += pushY;
        }
      }
    }
  }

  function chooseCatTarget(cat) {
    const targets = CAT_TARGETS.filter((point) => canCatStand(point.x, point.y));

    const target = targets[Math.floor(Math.random() * targets.length)] ?? {
      x: cat.x,
      y: cat.y
    };
    cat.targetX = target.x;
    cat.targetY = target.y;
    cat.retargetTimer = 1.3 + Math.random() * 2.2;
  }

  function interact() {
    if (state.phase !== "chase" || state.activeCats.length === 0) return;

    let nearestIndex = -1;
    let nearestDistance = Infinity;

    for (let index = 0; index < state.activeCats.length; index += 1) {
      const catDistance = distance(player, state.activeCats[index]);

      if (canReachCat(state.activeCats[index]) && catDistance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = catDistance;
      }
    }

    if (nearestIndex >= 0) {
      state.carriedCat = state.activeCats.splice(nearestIndex, 1)[0];
      state.phase = "carrying";
      burst(player.x,player.y-18,10,COLORS.yellow);
      showToast(`${state.carriedCat.name} AUFGENOMMEN`);
    }
  }

  function deliverCat() {
    const deliveredCat = state.carriedCat;
    state.catsDelivered += 1;
    state.deliveries.push(deliveredCat.name);
    burst(levelData.door.x+10,levelData.door.y,22,COLORS.yellow);
    state.carriedCat = null;
    state.keyFlash = 0.8;

    if (state.catsDelivered >= REQUIRED_DELIVERIES) {
      state.phase = "win";
      showToast("MISSION COMPLETE");
      onComplete();
      return;
    }

    if (state.catsDelivered === 1) {
      state.returningCat = {
        id: deliveredCat.sourceId,
        sourceId: deliveredCat.sourceId,
        name: deliveredCat.name,
        collar: deliveredCat.collar,
        spawn: deliveredCat.sourceId === "coco"
          ? { x: 695, y: 355 }
          : { x: 695, y: 455 }
      };
      state.returnTimer = 1.1;
    }

    state.phase = state.activeCats.length > 0 ? "chase" : "delivery";
    showToast(`SCHLÜSSEL ${state.catsDelivered} / ${REQUIRED_DELIVERIES}`);
  }

  function handleKeyDown(key) {
    if (key === "escape") {
      onExit();
      return;
    }

    if (key === "r") {
      reset();
      return;
    }

    if (key === "enter" && state.phase === "intro") {
      startMission();
      return;
    }

    if (key === "enter" && state.phase === "win") {
      onExit();
      return;
    }

    if (key === "e") interact();
  }

  function handlePointerDown() {
    if (state.phase === "intro") startMission();
    else if (state.phase === "win") onExit();
  }

  function draw(timestamp, options = {}) {
    drawTime=timestamp/1000;
    ctx=worldCtx;
    ctx.save();
    if(worldCanvas) ctx.setTransform(.5,0,0,.5,0,0);
    ctx.imageSmoothingEnabled=false;
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.drawImage(roomImage,0,0,WIDTH,HEIGHT);
    art.rug();
    drawWallDecor();
    const objects=[
      {y:368,draw:() => art.nightstand(drawTime)},
      {y:455,draw:() => {art.bed(); art.sleeping(drawTime,state.phase==='intro');}},
      {y:360,draw:() => art.tvCabinet()},
      {y:422,draw:() => art.wardrobe()},
      {y:500,draw:() => art.chair()},
      {y:473,draw:() => art.airPurifier(drawTime)}
    ];
    if(state.phase!=='intro') {
      for(const cat of state.activeCats) objects.push({y:cat.y,draw:() => drawCat(cat)});
      objects.push({y:player.y,draw:() => art.player(player,state.carriedCat,drawTime)});
    }
    objects.sort((a,b) => a.y-b.y).forEach(object => object.draw());
    drawDarkness();
    drawLights(timestamp);
    drawParticles();
    ctx.restore();
    ctx=screenCtx;
    if(worldCanvas) {
      ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,WIDTH,HEIGHT);
      ctx.drawImage(worldCanvas,0,0,WIDTH,HEIGHT);
    }
    if(options.interface!==false) {
      drawUI(timestamp);
      if(state.phase==='intro') drawIntroOverlay(timestamp);
      if(state.phase==='win') drawWinOverlay(timestamp);
    }
  }

  function drawWallDecor() {
    const logo=assets.get('logo');
    ctx.save();
    ctx.translate(530,151);ctx.transform(1,.395,0,1,0,0);
    ctx.fillStyle='#141b2a';ctx.fillRect(-4,-4,65,75);
    ctx.fillStyle='#bba165';ctx.fillRect(-2,-2,61,71);
    ctx.fillStyle='#09111e';ctx.fillRect(0,0,57,67);
    if(logo) ctx.drawImage(logo.image,3,3,51,51);
    ctx.fillStyle='#dfc76b';ctx.fillRect(12,58,32,2);
    ctx.restore();
    ctx.save();ctx.translate(198,219);ctx.transform(1,-.395,0,1,0,0);
    ctx.fillStyle='#83796d';ctx.fillRect(0,0,30,38);
    ctx.fillStyle='#202b40';ctx.fillRect(3,3,24,32);
    ctx.fillStyle='#c48a9b';
    polygon([{x:8,y:14},{x:12,y:10},{x:16,y:14},{x:20,y:10},{x:24,y:14},{x:16,y:24}]);ctx.fill();
    ctx.restore();
  }

  function drawCat(cat) {
    art.shadow(cat.x,cat.y+7,Math.max(18,31-cat.jumpHeight*.4),9);
    art.cat(cat,drawTime);
    if(distance(player,cat)<90) {
      drawText(cat.name,cat.x,cat.y-46-cat.jumpHeight,10,'#d5e4ed','center');
      if(cat.recoveryTimer>0) drawText('…',cat.x,cat.y-58,12,COLORS.yellow,'center');
    }
  }

  function burst(x,y,count,color) {
    for(let i=0;i<count;i++) {
      const angle=i/count*Math.PI*2;
      particles.push({x,y,vx:Math.cos(angle)*(24+i%3*12),vy:Math.sin(angle)*30-24,life:.5+i%4*.12,color});
    }
  }

  function drawParticles() {
    for(const p of particles) {
      ctx.globalAlpha=Math.min(1,p.life*2);
      ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),2,2);
    }
    ctx.globalAlpha=1;
  }

  function canReachCat(cat) {
    if(cat.jump || distance(player,cat)>CATCH_DISTANCE) return false;
    const steps=Math.ceil(distance(player,cat)/5);
    for(let i=1;i<steps;i++) {
      const x=lerp(player.x,cat.x,i/steps),y=lerp(player.y,cat.y,i/steps);
      if(levelData.obstacles.some(obstacle => intersectsObstacle(x,y,2,obstacle))) return false;
    }
    return true;
  }

  function drawDarkness() {
    ctx.save();
    ctx.beginPath();ROOM_OUTLINE.forEach(([x,y],i) => i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
    ctx.fillStyle = state.phase === "intro" ? "rgb(1 5 16 / 27%)" : "rgb(1 5 16 / 17%)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  function drawLights(timestamp) {
    const slowPulse = 0.92 + Math.sin(timestamp / 560) * 0.08;
    const doorPulse = 0.9 + Math.sin(timestamp / 170) * 0.1;
    const carrying = state.phase === "carrying";

    // Geschlossene Tür ist Teil des PNGs; beim Tragen wird nur dieser Bereich überzeichnet.
    if (carrying) drawOpenDoor();

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Kühles Nachtlicht hält die dunklen Flächen blau statt komplett schwarz.
    drawGlow(520, 292, 300, "rgb(47 103 181 / 6%)");

    // Sehr weiches Deckenlicht und ein kleiner warmer Schein unter dem Bett.
    drawGlow(492, 190, 205, `rgb(247 196 82 / ${0.055 * slowPulse})`);
    drawGlow(345, 458, 90, `rgb(237 181 61 / ${0.09 * slowPulse})`);

    // Koordinaten liegen exakt auf den bereits im Raum-PNG gezeichneten Birnen.
    const bulbs = ROOM_BULBS;

    for (let index = 0; index < bulbs.length; index += 1) {
      const [x, y] = bulbs[index];
      const flicker = 0.93 + Math.sin(timestamp / 310 + index * 1.7) * 0.07;
      drawNeonBulb(x, y, slowPulse * flicker, index>=6 ? (timestamp/85+index*32)%360 : null);
    }

    // Candle and pendant: source positions match the furniture and room pixels.
    const candle=.92+Math.sin(timestamp/71)*.04+Math.sin(timestamp/113)*.03;
    const candlePoint=art.candlePosition();
    drawGlow(candlePoint.x,candlePoint.y,55,'rgba(255,173,73,'+(.12*candle)+')');
    drawGlow(492,194,75,'rgba(255,221,145,'+(.10*slowPulse)+')');
    ctx.fillStyle='#ffe3a1';ctx.fillRect(480,194,25,2);

    if (carrying) {
      // Nur weiches Licht: keine harte geometrische Lichtfläche und kein Kreis.
      drawGlow(ROOM_DOOR.lightX,ROOM_DOOR.lightY,90,`rgb(243 185 49 / ${0.20 * doorPulse})`);
      drawGlow(147,317,62,`rgb(255 218 92 / ${0.27 * doorPulse})`);
      drawGlow(159,344,74,`rgb(235 176 48 / ${0.16 * doorPulse})`);
    } else {
      drawGlow(levelData.door.x, levelData.door.y, 58, `rgb(226 178 52 / ${0.045 * slowPulse})`);
    }

    ctx.restore();
  }

  function drawOpenDoor() { paintRoomDoor(ctx,true); }

  function drawNeonBulb(x, y, intensity, hue = null) {
    // Маленькое тёплое ядро и два спокойных ореола, без белого прожектора.
    drawGlow(x, y, 32, `rgb(49 103 183 / ${0.055 * intensity})`);
    drawGlow(x, y, 25, `rgb(247 190 53 / ${0.15 * intensity})`);
    drawGlow(x, y, 11, `rgb(255 222 105 / ${0.3 * intensity})`);

    if(hue!==null) drawGlow(x,y,28,'hsla('+hue+',80%,65%,'+(.16*intensity)+')');
    ctx.fillStyle=hue===null?'#f2d65a':'hsl('+hue+',72%,74%)';
    ctx.fillRect(x-1,y-1,3,3);
  }

  function drawUI(timestamp) {
    ctx.fillStyle = "rgb(3 8 19 / 82%)";
    ctx.fillRect(18, 16, 924, 64);
    ctx.strokeStyle = "#283651";
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 16, 924, 64);

    drawText("01 // NACHTSCHICHT", 36, 37, 17, COLORS.yellow, "left");
    drawText(objectiveText(), 36, 61, 11, "#8794aa", "left");

    for (let index = 0; index < REQUIRED_DELIVERIES; index += 1) {
      const collected = index < state.catsDelivered;
      const x = 820 + index * 36;
      const flash = state.keyFlash > 0 && index === state.catsDelivered - 1;

      ctx.fillStyle = collected ? COLORS.yellow : "#121b2d";
      ctx.fillRect(x, 31, 24, 24);
      ctx.strokeStyle = flash ? "#fff4a6" : collected ? "#806f28" : "#35425a";
      ctx.lineWidth = flash ? 3 : 1;
      ctx.strokeRect(x, 31, 24, 24);

      drawKeyIcon(x + 12, 43, collected ? "#07101f" : "#526079");
    }

    const catchableCat = state.phase === "chase"
      ? state.activeCats
        .filter((cat) => canReachCat(cat))
        .sort((first, second) => distance(player, first) - distance(player, second))[0]
      : null;

    const jumpingCat = state.phase === "chase"
      ? state.activeCats.find((cat) => cat.jump && distance(player, cat) <= 68)
      : null;

    if (catchableCat) {
      drawPrompt("E", `HALTEN · ${catchableCat.name} AUFHEBEN`);
    } else if (jumpingCat) {
      drawPrompt("!", `${jumpingCat.name} SPRINGT WEG`);
    } else if (state.phase === "carrying") {
      drawPrompt("→", "ZUR LEUCHTENDEN TÜR");
    }

    if (state.toastTimer > 0) {
      const alpha = Math.min(1, state.toastTimer * 2.5);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgb(3 8 19 / 88%)";
      ctx.fillRect(270, 91, 420, 34);
      ctx.strokeStyle = COLORS.yellowSoft;
      ctx.strokeRect(270, 91, 420, 34);
      drawText(state.toast, 480, 108, 12, COLORS.yellow, "center");
      ctx.globalAlpha = 1;
    }

    if (state.phase !== "intro" && state.phase !== "win") {
      const markerY = player.y - 64 + Math.sin(timestamp / 130) * 2;
      ctx.fillStyle = COLORS.yellow;
      polygon([
        { x: player.x, y: markerY + 7 },
        { x: player.x - 5, y: markerY },
        { x: player.x + 5, y: markerY }
      ]);
      ctx.fill();
    }
  }

  function drawIntroOverlay(timestamp) {
    ctx.fillStyle = "rgb(1 4 12 / 69%)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const pulse = 0.65 + Math.sin(timestamp / 350) * 0.25;
    drawText("LEVEL 01 // PAW TOKEN 02", 480, 220, 13, "#75839c", "center");
    drawText("KATZENINSEL", 480, 261, 34, COLORS.yellow, "center");
    drawText("03:17 // DIE KATZEN SIND WIEDER WACH", 480, 303, 13, "#c6cbd5", "center");

    ctx.globalAlpha = pulse;
    drawText("[ ENTER / CLICK ]  AUFSTEHEN", 480, 378, 15, COLORS.yellow, "center");
    ctx.globalAlpha = 1;

    drawText("Coco und Bounty zur Tür bringen. Die erste Katze kommt einmal zurück.",480,421,12,"#a7b4c9","center");
    drawText("WASD / PFEILE   ·   E HALTEN   ·   R NEUSTART   ·   ESC KARTE",480,451,11,"#758ba6","center");
  }

  function drawWinOverlay(timestamp) {
    ctx.fillStyle = "rgb(1 5 14 / 78%)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const pulse = 0.66 + Math.sin(timestamp / 300) * 0.22;

    ctx.save();
    ctx.shadowColor = COLORS.yellow;
    ctx.shadowBlur = 30 * pulse;
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 2;
    ctx.strokeRect(277, 177, 406, 276);
    ctx.restore();

    drawText("MISSION COMPLETE", 480, 225, 14, "#8794aa", "center");
    drawText("NACHTSCHICHT BEENDET", 480, 270, 26, COLORS.yellow, "center");
    drawText("02", 430, 335, 34, COLORS.yellow, "center");
    drawText("PAW TOKEN", 540, 335, 15, "#dce3e8", "center");
    drawText("3 / 3 SCHLÜSSEL",480,371,13,COLORS.green,"center");
    const minutes=Math.floor(state.elapsed/60), seconds=Math.floor(state.elapsed%60);
    drawText("ZEIT "+minutes+":"+String(seconds).padStart(2,'0')+"   //   "+state.deliveries.join(" · "),480,393,10,"#90a4bb","center");
    drawText("[ ENTER / CLICK ]  DIE LETZTE INSEL WARTET", 480, 417, 12, "#aeb8c8", "center");
  }

  function drawPrompt(key, text) {
    const width = 276;
    const x = (WIDTH - width) / 2;
    const y = 568;

    ctx.fillStyle = "rgb(3 8 19 / 90%)";
    ctx.fillRect(x, y, width, 44);
    ctx.strokeStyle = COLORS.yellowSoft;
    ctx.strokeRect(x, y, width, 44);

    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(x + 10, y + 9, 28, 26);
    drawText(key, x + 24, y + 22, 14, COLORS.navy, "center");
    drawText(text, x + 49, y + 22, 12, "#d8dde6", "left");
  }

  function objectiveText() {
    if (state.phase === "intro") return "STATUS // DOMINIK SCHLÄFT";
    if (state.phase === "chase") {
      const count = state.activeCats.length;
      return `ZIEL // ${count} ${count === 1 ? "KATZE" : "KATZEN"} IM ZIMMER · E HALTEN`;
    }
    if (state.phase === "carrying") return "ZIEL // KATZE ZUR TÜR BRINGEN";
    if (state.phase === "delivery") return "ACHTUNG // EINE KATZE SCHLEICHT ZURÜCK";
    return "STATUS // COMPLETE";
  }

  function drawKeyIcon(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - 7, y - 4, 8, 8);
    ctx.fillRect(x - 3, y - 2, 12, 4);
    ctx.fillRect(x + 6, y + 1, 3, 5);
  }

  function drawGlow(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgb(0 0 0 / 0%)");
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function showToast(text) {
    state.toast = text;
    state.toastTimer = 1.45;
  }

  function canStand(x, y, radius) {
    const corners = [
      { x: x - radius, y: y - radius * 0.55 },
      { x: x + radius, y: y - radius * 0.55 },
      { x: x - radius, y: y + radius * 0.55 },
      { x: x + radius, y: y + radius * 0.55 }
    ];

    if (!corners.every((point) => pointInPolygon(point, levelData.playableArea))) {
      return false;
    }

    return !levelData.obstacles.some((obstacle) =>
      intersectsObstacle(x, y, radius, obstacle)
    );
  }

  // CAT AI 4/4: Landepunkt muss innerhalb des Bodens und außerhalb der Möbel sein.
  function canCatStand(x, y) {
    if (!isCatInsideFloor(x, y)) return false;

    return !levelData.obstacles.some((obstacle) =>
      intersectsObstacle(x, y, 18, obstacle)
    );
  }

  function isCatInsideFloor(x, y) {
    const spriteBounds = [
      { x: x - 14, y: y - 22 },
      { x: x + 23, y: y - 22 },
      { x: x - 14, y: y + 14 },
      { x: x + 23, y: y + 14 }
    ];

    return spriteBounds.every((point) => pointInPolygon(point, levelData.catArea));
  }

  function intersectsObstacle(x,y,radius,obstacle) {
    if(!obstacle.points) return circleIntersectsRectangle(x,y,radius,obstacle);
    if(pointInPolygon({x,y},obstacle.points)) return true;
    return obstacle.points.some((a,i) => {
      const b=obstacle.points[(i+1)%obstacle.points.length];
      const dx=b.x-a.x,dy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
      return Math.hypot(x-(a.x+t*dx),y-(a.y+t*dy))<radius;
    });
  }

  function circleIntersectsRectangle(x, y, radius, rectangle) {
    const nearestX = Math.max(rectangle.x, Math.min(x, rectangle.x + rectangle.width));
    const nearestY = Math.max(rectangle.y, Math.min(y, rectangle.y + rectangle.height));
    const dx = x - nearestX;
    const dy = y - nearestY;

    return dx * dx + dy * dy < radius * radius;
  }

  function pointInPolygon(point, polygonPoints) {
    let inside = false;

    for (let current = 0, previous = polygonPoints.length - 1; current < polygonPoints.length; previous = current++) {
      const currentPoint = polygonPoints[current];
      const previousPoint = polygonPoints[previous];

      const crosses =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y) +
            currentPoint.x;

      if (crosses) inside = !inside;
    }

    return inside;
  }

  function distance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function polygon(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let index = 1; index < points.length; index += 1) {
      ctx.lineTo(points[index].x, points[index].y);
    }

    ctx.closePath();
  }

  function drawText(text, x, y, size, color, align = "left") {
    ctx.font = `500 ${size}px "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function getSnapshot() {
    return {
      phase: state.phase,
      catsDelivered: state.catsDelivered,
      elapsed: state.elapsed,
      deliveries: [...state.deliveries],
      catsOutsideFurniture: state.activeCats.every(cat => !levelData.obstacles.some(o => intersectsObstacle(cat.x,cat.y,17,o))),
      player: { x: player.x, y: player.y },
      activeCats: state.activeCats.map((cat) => ({
        id: cat.id,
        sourceId: cat.sourceId,
        direction: cat.direction,
        x: cat.x,
        y: cat.y,
        name: cat.name,
        behavior: cat.behavior,
        jumping: Boolean(cat.jump),
        recovering: cat.recoveryTimer > 0
      })),
      activeCat: state.activeCats[0]
        ? {
            id: state.activeCats[0].id,
            x: state.activeCats[0].x,
            y: state.activeCats[0].y,
            name: state.activeCats[0].name,
            behavior: state.activeCats[0].behavior,
            jumping: Boolean(state.activeCats[0].jump),
            recovering: state.activeCats[0].recoveryTimer > 0
          }
        : null,
      catsInsideBounds: state.activeCats.every((cat) => isCatInsideFloor(cat.x, cat.y)),
      returnPending: Boolean(state.returningCat),
      carrying: state.carriedCat?.name ?? null
    };
  }

  return {
    roomImage,
    assets,
    reset,
    update,
    draw,
    handleKeyDown,
    handlePointerDown,
    getSnapshot,
    canPlayerStand: (x, y) => canStand(x, y, 9)
  };
}
