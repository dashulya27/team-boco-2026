const WIDTH = 960;
const HEIGHT = 640;
const REQUIRED_DELIVERIES = 3;
const CATCH_DISTANCE = 68;
const JUMP_TRIGGER_DISTANCE = 54;

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

export function createCatIslandLevel({ canvas, ctx, roomImage, onExit, onComplete }) {
  const levelData = {
    playableArea: [
      { x: 55, y: 350 },
      { x: 402, y: 214 },
      { x: 908, y: 414 },
      { x: 520, y: 610 },
      { x: 170, y: 510 }
    ],

    catArea: [
      { x: 88, y: 356 },
      { x: 404, y: 235 },
      { x: 876, y: 420 },
      { x: 520, y: 582 },
      { x: 184, y: 497 }
    ],

    door: {
      x: 140,
      y: 350,
      radius: 52
    },

    obstacles: [
      { id: "bed", x: 250, y: 350, width: 190, height: 110 },
      { id: "nightstand", x: 450, y: 326, width: 46, height: 46 },
      { id: "tvCabinet", x: 780, y: 330, width: 86, height: 125 },
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
      tailPhase: 0
    };

    state.catSerial += 1;
    chooseCatTarget(cat);
    return cat;
  }

  function update(deltaTime, keys) {
    state.toastTimer = Math.max(0, state.toastTimer - deltaTime);
    state.keyFlash = Math.max(0, state.keyFlash - deltaTime);

    if (state.phase === "intro" || state.phase === "win") return;

    updatePlayer(deltaTime, keys);

    // E darf gehalten werden: Sobald Dominik nah genug ist, greift er automatisch zu.
    if (state.phase === "chase" && keys.has("e")) interact();

    for (const cat of state.activeCats) updateCat(deltaTime, cat);
    separateCats();

    if (state.returningCat) {
      state.returnTimer -= deltaTime;

      if (state.returnTimer <= 0) {
        const returnSpawn = state.returningCat.sourceId === "coco"
          ? { x: 695, y: 355 }
          : { x: 695, y: 455 };

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

    if (cat.jump) {
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

      if (canCatStand(landing.x, landing.y)) {
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

      if (!state.activeCats[index].jump && catDistance <= CATCH_DISTANCE && catDistance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = catDistance;
      }
    }

    if (nearestIndex >= 0) {
      state.carriedCat = state.activeCats.splice(nearestIndex, 1)[0];
      state.phase = "carrying";
      showToast(`${state.carriedCat.name} AUFGENOMMEN`);
    }
  }

  function deliverCat() {
    const deliveredCat = state.carriedCat;
    state.catsDelivered += 1;
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

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#010309";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    drawStructure();
    drawFurniture();

    if (state.phase === "intro") {
      drawSleepingDominik(timestamp);
    } else {
      for (const cat of state.activeCats) drawCat(cat);
      drawPlayer(player, state.carriedCat);
    }

    drawDarkness();
    drawLights(timestamp);
    drawUI(timestamp);

    if (state.phase === "intro") drawIntroOverlay(timestamp);
    if (state.phase === "win") drawWinOverlay(timestamp);
  }

  function drawStructure() {
    ctx.drawImage(roomImage, 0, 0, WIDTH, HEIGHT);
  }

  function drawFurniture() {
    drawRug();
    drawBed();
    drawNightstand();
    drawTvCabinet();
    drawChair();
    drawAirPurifier();
  }

  function drawRug() {
    ctx.save();
    ctx.fillStyle = "#26334b";
    polygon([
      { x: 465, y: 365 },
      { x: 665, y: 324 },
      { x: 781, y: 429 },
      { x: 555, y: 491 }
    ]);
    ctx.fill();

    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "#7b6b78";
    ctx.lineWidth = 3;
    for (let offset = 0; offset < 5; offset += 1) {
      ctx.beginPath();
      ctx.moveTo(500 + offset * 42, 365 - offset * 8);
      ctx.lineTo(590 + offset * 40, 468 - offset * 10);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBed() {
    ctx.fillStyle = "#0a1121";
    ctx.fillRect(250, 350, 190, 110);
    ctx.fillStyle = "#27324b";
    ctx.fillRect(258, 358, 174, 94);
    ctx.fillStyle = COLORS.magenta;
    ctx.fillRect(262, 389, 166, 57);
    ctx.fillStyle = "#bfc5ce";
    ctx.fillRect(262, 364, 70, 23);
    ctx.fillRect(337, 364, 68, 23);
    ctx.fillStyle = "#343049";
    ctx.fillRect(262, 413, 166, 14);
    ctx.fillStyle = "#11192b";
    ctx.fillRect(246, 338, 198, 14);
    ctx.fillStyle = "#34415b";
    ctx.fillRect(250, 352, 7, 101);
    ctx.fillRect(433, 352, 7, 101);
  }

  function drawNightstand() {
    ctx.fillStyle = "#121a2d";
    ctx.fillRect(450, 326, 46, 46);
    ctx.fillStyle = "#263a59";
    ctx.fillRect(455, 331, 36, 35);
    ctx.fillStyle = COLORS.yellowSoft;
    ctx.fillRect(483, 341, 4, 4);
    ctx.fillRect(483, 356, 4, 4);
  }

  function drawTvCabinet() {
    ctx.fillStyle = "#251d1c";
    ctx.fillRect(780, 330, 86, 125);
    ctx.fillStyle = COLORS.wood;
    ctx.fillRect(786, 335, 74, 114);
    ctx.fillStyle = COLORS.woodLight;
    ctx.fillRect(792, 342, 28, 101);
    ctx.fillRect(825, 342, 29, 101);
    ctx.fillStyle = "#060b14";
    ctx.fillRect(762, 270, 92, 60);
    ctx.fillStyle = "#152844";
    ctx.fillRect(769, 277, 78, 46);
    ctx.fillStyle = "#3b4f69";
    ctx.fillRect(775, 283, 5, 33);
  }

  function drawChair() {
    ctx.fillStyle = "#5b412c";
    ctx.fillRect(156, 452, 64, 54);
    ctx.fillStyle = "#9b805e";
    ctx.fillRect(162, 457, 52, 38);
    ctx.fillStyle = "#cbc3b0";
    ctx.fillRect(167, 461, 42, 26);
    ctx.fillStyle = "#2c3850";
    ctx.fillRect(178, 466, 20, 15);
    ctx.fillStyle = "#5b412c";
    ctx.fillRect(160, 494, 7, 15);
    ctx.fillRect(210, 494, 7, 15);
  }

  function drawAirPurifier() {
    ctx.fillStyle = "#9fa8b5";
    ctx.fillRect(635, 430, 46, 42);
    ctx.fillStyle = "#d2d7dd";
    ctx.fillRect(640, 425, 36, 42);
    ctx.fillStyle = "#172033";
    ctx.fillRect(644, 425, 28, 8);
    ctx.fillStyle = "#718096";
    for (let x = 646; x <= 669; x += 6) ctx.fillRect(x, 427, 3, 3);
    ctx.fillStyle = "#778398";
    for (let y = 440; y <= 460; y += 6) ctx.fillRect(643, y, 3, 3);
  }

  function drawSleepingDominik(timestamp) {
    const breathe = Math.sin(timestamp / 450) > 0 ? 1 : 0;
    ctx.fillStyle = "#d7b18a";
    ctx.fillRect(278, 375 + breathe, 18, 16);
    ctx.fillStyle = "#34241f";
    ctx.fillRect(275, 372 + breathe, 22, 7);
    ctx.fillStyle = "#172b4a";
    ctx.fillRect(295, 379 + breathe, 58, 20);
    ctx.fillStyle = "#293a5a";
    ctx.fillRect(348, 383 + breathe, 39, 15);

    drawText("Z", 320, 354, 12, "#8da1c3", "center");
    drawText("Z", 337, 341, 10, "#667997", "center");
  }

  function drawPlayer(character, carriedCat) {
    const bob = character.moving ? Math.round(Math.sin(character.step) * 2) : 0;
    const x = Math.round(character.x);
    const y = Math.round(character.y + bob);

    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#02040a";
    ctx.fillRect(x - 12, y - 5, 24, 8);
    ctx.globalAlpha = 1;

    ctx.fillStyle = "#1a2438";
    ctx.fillRect(x - 9, y - 22, 18, 20);
    ctx.fillStyle = COLORS.yellow;
    ctx.fillRect(x - 9, y - 15, 18, 4);
    ctx.fillStyle = "#293d61";
    ctx.fillRect(x - 8, y - 2, 7, 9);
    ctx.fillRect(x + 2, y - 2, 7, 9);

    ctx.fillStyle = "#d2a47d";
    ctx.fillRect(x - 7, y - 32, 14, 11);
    ctx.fillStyle = "#31231e";
    ctx.fillRect(x - 8, y - 35, 16, 7);
    ctx.fillRect(x - 8, y - 30, 3, 5);

    ctx.fillStyle = "#9ac4eb";
    if (character.direction === "left") ctx.fillRect(x - 7, y - 28, 2, 2);
    else if (character.direction === "right") ctx.fillRect(x + 5, y - 28, 2, 2);
    else if (character.direction === "down") {
      ctx.fillRect(x - 4, y - 28, 2, 2);
      ctx.fillRect(x + 3, y - 28, 2, 2);
    }

    if (carriedCat) {
      drawCatSprite(x + 13, y - 34, carriedCat.collar, 0, 0.72);
    }
  }

  // CAT AI 3/4: Der Sprung hebt nur den Sprite an; der Schatten bleibt am Boden.
  function drawCat(cat) {
    drawCatSprite(
      Math.round(cat.x),
      Math.round(cat.y),
      cat.collar,
      Math.sin(cat.tailPhase),
      1,
      cat.jumpHeight
    );

    if (distance(player, cat) < 82) {
      drawText(cat.name, cat.x, cat.y - 29 - cat.jumpHeight, 10, "#b8c4d8", "center");
    }

    if (cat.recoveryTimer > 0) {
      drawText("...", cat.x, cat.y - 42, 12, COLORS.yellow, "center");
    }
  }

  function drawCatSprite(x, y, collar, tailWave, scale, jumpHeight = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    const shadowWidth = Math.max(17, 27 - jumpHeight * 0.35);
    ctx.globalAlpha = Math.max(0.2, 0.42 - jumpHeight * 0.009);
    ctx.fillStyle = "#02040a";
    ctx.fillRect(-shadowWidth / 2, 5, shadowWidth, 6);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y - jumpHeight);
    ctx.scale(scale, scale);

    ctx.fillStyle = COLORS.white;
    ctx.fillRect(-10, -9, 21, 16);
    ctx.fillRect(-8, -16, 16, 10);
    ctx.fillRect(-8, -20, 5, 6);
    ctx.fillRect(4, -20, 5, 6);
    ctx.fillRect(-12, 4, 5, 8);
    ctx.fillRect(6, 4, 5, 8);

    ctx.fillStyle = "#aeb8c4";
    ctx.fillRect(-7, -15, 3, 3);
    ctx.fillRect(4, -15, 3, 3);
    ctx.fillStyle = "#1a2435";
    ctx.fillRect(-6, -14, 2, 2);
    ctx.fillRect(5, -14, 2, 2);
    ctx.fillStyle = collar;
    ctx.fillRect(-9, -6, 18, 3);

    ctx.fillStyle = COLORS.white;
    ctx.fillRect(10, -4 + Math.round(tailWave * 2), 9, 4);
    ctx.fillRect(17, -9 + Math.round(tailWave * 3), 4, 8);

    ctx.restore();
  }

  function drawDarkness() {
    ctx.fillStyle = state.phase === "intro" ? "rgb(1 5 16 / 46%)" : "rgb(1 5 16 / 37%)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
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
    const bulbs = [
      [303, 137], [328, 145], [359, 138], [391, 122], [423, 106], [439, 89],
      [599, 171], [613, 197], [633, 215], [661, 223], [691, 213], [712, 201]
    ];

    for (let index = 0; index < bulbs.length; index += 1) {
      const [x, y] = bulbs[index];
      const flicker = 0.93 + Math.sin(timestamp / 310 + index * 1.7) * 0.07;
      drawNeonBulb(x, y, slowPulse * flicker);
    }

    if (carrying) {
      // Nur weiches Licht: keine harte geometrische Lichtfläche und kein Kreis.
      drawGlow(145, 325, 130, `rgb(243 185 49 / ${0.24 * doorPulse})`);
      drawGlow(145, 345, 72, `rgb(255 218 92 / ${0.34 * doorPulse})`);
      drawGlow(170, 392, 90, `rgb(235 176 48 / ${0.16 * doorPulse})`);
    } else {
      drawGlow(levelData.door.x, levelData.door.y, 58, `rgb(226 178 52 / ${0.045 * slowPulse})`);
    }

    ctx.restore();
  }

  function drawOpenDoor() {
    ctx.save();

    // Dunkler Raum hinter der Tür. Das vorhandene Türblatt im PNG wird nur innen abgedeckt,
    // der gezeichnete Rahmen des Hintergrundbildes bleibt erhalten.
    const doorway = ctx.createLinearGradient(122, 385, 166, 230);
    doorway.addColorStop(0, "#0c1727");
    doorway.addColorStop(0.55, "#050b17");
    doorway.addColorStop(1, "#02050c");
    ctx.fillStyle = doorway;
    polygon([
      { x: 121, y: 247 },
      { x: 169, y: 223 },
      { x: 169, y: 365 },
      { x: 122, y: 390 }
    ]);
    ctx.fill();

    // Das geöffnete Türblatt ist fast von der Seite sichtbar.
    ctx.fillStyle = "#241b19";
    polygon([
      { x: 169, y: 223 },
      { x: 189, y: 234 },
      { x: 189, y: 376 },
      { x: 169, y: 365 }
    ]);
    ctx.fill();

    ctx.strokeStyle = "#57412f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(170, 225);
    ctx.lineTo(187, 235);
    ctx.lineTo(187, 374);
    ctx.lineTo(170, 364);
    ctx.stroke();

    ctx.fillStyle = "#b99c42";
    ctx.fillRect(181, 302, 3, 3);
    ctx.restore();
  }

  function drawNeonBulb(x, y, intensity) {
    // Маленькое тёплое ядро и два спокойных ореола, без белого прожектора.
    drawGlow(x, y, 32, `rgb(49 103 183 / ${0.055 * intensity})`);
    drawGlow(x, y, 25, `rgb(247 190 53 / ${0.15 * intensity})`);
    drawGlow(x, y, 11, `rgb(255 222 105 / ${0.3 * intensity})`);

    ctx.fillStyle = "#f2d65a";
    ctx.fillRect(x - 1, y - 1, 3, 3);
  }

  function drawUI(timestamp) {
    ctx.fillStyle = "rgb(3 8 19 / 82%)";
    ctx.fillRect(18, 16, 924, 64);
    ctx.strokeStyle = "#283651";
    ctx.lineWidth = 1;
    ctx.strokeRect(18, 16, 924, 64);

    drawText("02 // KATZENINSEL", 36, 37, 17, COLORS.yellow, "left");
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
        .filter((cat) => !cat.jump && distance(player, cat) <= CATCH_DISTANCE)
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
      ctx.fillRect(315, 91, 330, 34);
      ctx.strokeStyle = COLORS.yellowSoft;
      ctx.strokeRect(315, 91, 330, 34);
      drawText(state.toast, 480, 108, 12, COLORS.yellow, "center");
      ctx.globalAlpha = 1;
    }

    if (state.phase !== "intro" && state.phase !== "win") {
      const markerY = player.y - 48 + Math.sin(timestamp / 130) * 2;
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
    drawText("MISSION 02", 480, 220, 13, "#75839c", "center");
    drawText("KATZENINSEL", 480, 261, 34, COLORS.yellow, "center");
    drawText("03:17 // DIE KATZEN SIND WIEDER WACH", 480, 303, 13, "#c6cbd5", "center");

    ctx.globalAlpha = pulse;
    drawText("[ ENTER / CLICK ]  AUFSTEHEN", 480, 378, 15, COLORS.yellow, "center");
    ctx.globalAlpha = 1;

    drawText("Bringe die Katzen dreimal zur Schlafzimmertür.", 480, 421, 12, "#7f8ba1", "center");
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
    drawText("3 / 3 SCHLÜSSEL", 480, 376, 13, COLORS.green, "center");
    drawText("[ ENTER / CLICK ]  ZUR WELTKARTE", 480, 417, 12, "#aeb8c8", "center");
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
      circleIntersectsRectangle(x, y, radius, obstacle)
    );
  }

  // CAT AI 4/4: Landepunkt muss innerhalb des Bodens und außerhalb der Möbel sein.
  function canCatStand(x, y) {
    if (!isCatInsideFloor(x, y)) return false;

    return !levelData.obstacles.some((obstacle) =>
      circleIntersectsRectangle(x, y, 18, obstacle)
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
      player: { x: player.x, y: player.y },
      activeCats: state.activeCats.map((cat) => ({
        id: cat.id,
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
    reset,
    update,
    draw,
    handleKeyDown,
    handlePointerDown,
    getSnapshot,
    canPlayerStand: (x, y) => canStand(x, y, 9)
  };
}
