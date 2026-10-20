// Built-in room structure. Furniture, cats and lighting are drawn by cat-island.js.
// All coordinates use the game's 960 × 640 collision map.
export function drawRoomBackground(ctx) {
  const shape = (points, fill, stroke) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  ctx.fillStyle = '#02050b';
  ctx.fillRect(0, 0, 960, 640);

  // Floor edge and the same safe floor polygon used by the game logic.
  shape([[55,350],[170,510],[520,610],[908,414],[908,426],[520,622],[165,522],[55,362]], '#111b2b');
  const floor = [[55,350],[402,214],[908,414],[520,610],[170,510]];
  shape(floor, '#29374a', '#56667b');
  ctx.save();
  ctx.beginPath();
  floor.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.clip();
  ctx.lineWidth = 1;
  for (let i = -8; i < 20; i++) {
    const x = 40 + i * 42;
    ctx.strokeStyle = i % 2 ? '#344357' : '#3c4a5d';
    ctx.beginPath(); ctx.moveTo(x, 170); ctx.lineTo(x + 870, 610); ctx.stroke();
  }
  ctx.restore();

  shape([[55,350],[55,165],[402,30],[402,214]], '#29394f', '#62768d');
  shape([[402,30],[908,230],[908,414],[402,214]], '#203149', '#62768d');
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#718096';
  ctx.beginPath(); ctx.moveTo(57,345); ctx.lineTo(402,209); ctx.lineTo(905,408); ctx.stroke();

  // Window, radiator and a small wall shelf.
  shape([[235,145],[340,104],[340,207],[235,248]], '#a3b3c5', '#111c30');
  shape([[242,149],[332,114],[332,201],[242,237]], '#163b64');
  ctx.strokeStyle = '#829bb7'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(287,132); ctx.lineTo(287,220); ctx.moveTo(242,193); ctx.lineTo(332,158); ctx.stroke();
  shape([[238,259],[338,221],[338,251],[238,290]], '#7c899b', '#1b293d');
  ctx.strokeStyle = '#4b5c73'; ctx.lineWidth = 2;
  for (let x = 247; x < 334; x += 9) {
    const y = 259 - (x - 238) * 0.38;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 23); ctx.stroke();
  }
  shape([[535,143],[584,162],[584,168],[535,149]], '#856746', '#1b2739');
  ctx.fillStyle = '#6c8b6d'; ctx.fillRect(548,130,9,17);
  ctx.fillStyle = '#c6b27a'; ctx.fillRect(561,139,9,13);

  // Door frame matches the open-door drawing and the delivery point.
  shape([[115,243],[175,213],[175,370],[115,401]], '#776445', '#172337');
  shape([[121,247],[169,223],[169,365],[122,390]], '#49392e', '#a18b5b');
  shape([[128,252],[162,235],[162,358],[128,376]], '#564236', '#362a26');
  ctx.fillStyle = '#d3b45d'; ctx.fillRect(155,309,4,4);

  // Physical wires and lamp: the animated glow is a separate game layer.
  const bulbs = [[303,137],[328,145],[359,138],[391,122],[423,106],[439,89],
    [599,171],[613,197],[633,215],[661,223],[691,213],[712,201]];
  ctx.strokeStyle = '#131e31'; ctx.lineWidth = 2;
  for (let group = 0; group < 2; group++) {
    ctx.beginPath();
    bulbs.slice(group * 6, group * 6 + 6).forEach(([x,y], i) => i ? ctx.lineTo(x,y - 4) : ctx.moveTo(x,y - 4));
    ctx.stroke();
  }
  ctx.strokeStyle = '#697789'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(492,115); ctx.lineTo(492,176); ctx.stroke();
  shape([[478,175],[506,175],[515,194],[469,194]], '#c5a35b', '#514431');
  ctx.fillStyle = '#ead69b'; ctx.fillRect(479,194,27,3);
}

export function createRoomBackground(document) {
  const room = document.createElement('canvas');
  room.width = 960; room.height = 640;
  drawRoomBackground(room.getContext('2d'));
  return room;
}
