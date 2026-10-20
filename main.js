import { createCatIslandLevel } from "./cat-island.js?v=1.4.1";
import { createMissionController } from "./mission.js?v=1.4.1";
import { createRoomBackground } from "./room-background.js?v=1.4.1";

const BUILD_VERSION = "1.4.1";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const missionPanel = document.getElementById('mission-panel');
const mission = createMissionController(missionPanel, window.sessionStorage);

ctx.imageSmoothingEnabled = false;

const keys = new Set();
const pointer = { x: 0, y: 0 };

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
  Enter: "enter"
};

const gameState = {
  scene: "map",
  catIslandCompleted: mission.progress.cats
};

const mapIsland = {
  x: 295,
  y: 150,
  width: 370,
  height: 250
};

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
    const roomImage = await loadImage(
      `./assets/rooms/cat-room/cat-room-structure.png?v=${BUILD_VERSION}`
    ).catch(() => createRoomBackground(document));

    catIsland = createCatIslandLevel({
      canvas,
      ctx,
      roomImage,
      onExit: returnToMap,
      onComplete: completeCatIsland
    });

    requestAnimationFrame(gameLoop);
  } catch (error) {
    drawLoadError(error.message);
    console.error(error);
  }
}

function enterCatIsland() {
  if (!catIsland) return;
  if (gameState.catIslandCompleted) { mission.open(); return; }
  gameState.scene = "catIsland";
  document.body.dataset.scene = "catIsland";
  keys.clear();
  catIsland.reset();
}

function returnToMap() {
  gameState.scene = "map";
  document.body.dataset.scene = "map";
  keys.clear();
}

function completeCatIsland() {
  gameState.catIslandCompleted = true;
  keys.clear();
  mission.completeCats();
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - (gameLoop.lastTime ?? timestamp)) / 1000, 0.05);
  gameLoop.lastTime = timestamp;

  if (gameState.scene === "map") {
    drawWorldMap(timestamp);
  } else {
    catIsland.update(deltaTime, keys);
    catIsland.draw(timestamp);
  }

  requestAnimationFrame(gameLoop);
}

function drawWorldMap(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#010309";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawStars(timestamp);
  drawMapGrid();

  drawText("BOCO // WORLD MAP", 36, 46, 22, "#f2d94b", "left");
  drawText("MISSION NODE 02", 36, 72, 12, "#65718b", "left");

  const pulse = 0.55 + Math.sin(timestamp / 420) * 0.18;

  ctx.save();
  ctx.shadowColor = gameState.catIslandCompleted ? "#62e69a" : "#f0d43e";
  ctx.shadowBlur = 26 * pulse;
  ctx.strokeStyle = gameState.catIslandCompleted ? "#62e69a" : "#f0d43e";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    mapIsland.x - 9,
    mapIsland.y - 9,
    mapIsland.width + 18,
    mapIsland.height + 18
  );
  ctx.restore();

  ctx.globalAlpha = gameState.catIslandCompleted ? 0.92 : 0.8;
  ctx.drawImage(
    catIsland.roomImage,
    mapIsland.x,
    mapIsland.y,
    mapIsland.width,
    mapIsland.height
  );
  ctx.globalAlpha = 1;

  drawText("02 // KATZENINSEL", 480, 442, 20, "#f2d94b", "center");
  drawText(
    gameState.catIslandCompleted ? "[ ENTER / CLICK ]  FINAL-TERMINAL ÖFFNEN" : "[ ENTER / CLICK ]  MISSION START",
    480,
    472,
    13,
    gameState.catIslandCompleted ? "#62e69a" : "#c3c9d5",
    "center"
  );

  drawText("PAPIER → KATZENINSEL → VIGENÈRE → KOFFER", 480, 580, 12, "#8490a8", "center");
  drawText("DREI SCHLÜSSEL ÖFFNEN DAS FINAL-TERMINAL", 480, 603, 11, "#65718b", "center");
  drawText(`BUILD ${BUILD_VERSION}`, 924, 618, 10, "#333e54", "right");
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
  if (!catIsland || !missionPanel.hidden) return;
  if (gameState.scene === "map") {
    if (key === "enter") enterCatIsland();
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
  if (!missionPanel.hidden || event.target?.closest?.('input, textarea, button, summary')) return;
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

window.addEventListener("blur", clearHeldKeys);
document.addEventListener("visibilitychange", () => {
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

canvas.addEventListener("pointermove", (event) => {
  Object.assign(pointer, canvasPoint(event));
});

canvas.addEventListener("pointerdown", (event) => {
  if (!catIsland || !missionPanel.hidden) return;
  const point = canvasPoint(event);

  if (gameState.scene === "map") {
    if (pointInside(mapIsland, point)) enterCatIsland();
  } else {
    catIsland.handlePointerDown(point);
  }
});

start();
