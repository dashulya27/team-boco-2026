import { ROOM_FLOOR,ROOM_BULBS,paintRoomDoor } from './room-layout.js?v=1.7.0';
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

  // Floor edge and the same safe floor polygon used by the game logic.
  shape([[55,350],[170,510],[520,610],[520,636],[459,623],[409,605],[335,591],[269,563],[195,542],[165,521],[93,434],[55,370]],'#171e30');
  shape([[520,610],[908,414],[899,441],[853,459],[813,485],[753,507],[714,536],[651,560],[606,592],[552,618],[520,636]],'#101a2b');
  shape([[55,350],[170,510],[520,610],[908,414],[908,426],[520,622],[165,522],[55,362]], '#304056');
  for(const [x,y]of [[191,535],[339,588],[623,578],[820,474]]){
    ctx.fillStyle='#54674f';ctx.fillRect(x,y,9,8);ctx.fillStyle='#71806a';ctx.fillRect(x+2,y+8,3,12);
  }
  const floor = ROOM_FLOOR;
  shape(floor, '#29374a', '#56667b');
  ctx.save();
  ctx.beginPath();
  floor.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
  ctx.clip();
  // Quiet wood grain and staggered joints; all detail uses a fixed pixel grid.
  let seed=2026;
  const random=() => { seed=(seed*1664525+1013904223)>>>0;return seed/4294967296; };
  for(let i=0;i<600;i++) {
    const x=Math.floor(random()*460)*2,y=240+Math.floor(random()*185)*2;
    ctx.fillStyle=i%3===0?'#405067':'#253249';
    ctx.fillRect(x,y,4+Math.floor(random()*8)*2,2);
  }
  ctx.lineWidth = 1;
  for (let i = -8; i < 20; i++) {
    const x = 40 + i * 42;
    ctx.strokeStyle = i % 2 ? '#344357' : '#3c4a5d';
    ctx.beginPath(); ctx.moveTo(x, 170); ctx.lineTo(x + 870, 610); ctx.stroke();
  }
  ctx.restore();

  shape([[55,350],[55,165],[402,30],[402,214]], '#29394f', '#62768d');
  shape([[402,30],[908,230],[908,414],[402,214]], '#203149', '#62768d');
  // Wall panel seams, crown trim and the exposed edge of the room.
  ctx.strokeStyle='#31435b';ctx.lineWidth=2;
  for(let x=95;x<400;x+=48) {
    const top=165-(x-55)*135/347;
    ctx.beginPath();ctx.moveTo(x,top+8);ctx.lineTo(x,top+178);ctx.stroke();
  }
  for(let x=452;x<905;x+=56) {
    const top=30+(x-402)*200/506;
    ctx.beginPath();ctx.moveTo(x,top+8);ctx.lineTo(x,top+179);ctx.stroke();
  }
  ctx.strokeStyle='#89919b';ctx.lineWidth=4;
  ctx.beginPath();ctx.moveTo(56,169);ctx.lineTo(402,34);ctx.lineTo(907,234);ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#718096';
  ctx.beginPath(); ctx.moveTo(57,345); ctx.lineTo(402,209); ctx.lineTo(905,408); ctx.stroke();

  // Window, radiator and a small wall shelf.
  shape([[235,145],[340,104],[340,207],[235,248]], '#a3b3c5', '#111c30');
  shape([[242,149],[332,114],[332,201],[242,237]], '#163b64');
  ctx.save();ctx.beginPath();
  [[242,149],[332,114],[332,201],[242,237]].forEach(([x,y],i) => i?ctx.lineTo(x,y):ctx.moveTo(x,y));
  ctx.closePath();ctx.clip();
  ctx.fillStyle='#91b0c8';ctx.fillRect(310,135,8,8);ctx.fillStyle='#173b64';ctx.fillRect(314,133,6,7);
  ctx.fillStyle='#48678a';
  for(const [x,y] of [[250,164],[272,153],[302,163],[322,182],[259,204]])ctx.fillRect(x,y,2,2);
  ctx.fillStyle='#0c284b';
  for(let i=0;i<7;i++)ctx.fillRect(240+i*15,205-i*4,12,48);
  ctx.restore();
  ctx.strokeStyle = '#829bb7'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(287,132); ctx.lineTo(287,220); ctx.moveTo(242,193); ctx.lineTo(332,158); ctx.stroke();
  shape([[238,259],[338,221],[338,251],[238,290]], '#7c899b', '#1b293d');
  ctx.strokeStyle = '#4b5c73'; ctx.lineWidth = 2;
  for (let x = 247; x < 334; x += 9) {
    const y = 259 - (x - 238) * 0.38;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 23); ctx.stroke();
  }
  // A proper shelf above the TV, aligned to the right-wall perspective.
  shape([[659,177],[739,208],[739,216],[659,185]],'#886d60','#1b2739');
  ctx.save();ctx.translate(670,171);ctx.transform(1,.395,0,1,0,0);
  for(let i=0;i<5;i++){
    const height=16+i%3*4;ctx.fillStyle=['#b290ac','#7994a7','#b3a077','#8d829f','#ad817b'][i];ctx.fillRect(i*10,-height,7,height);ctx.fillStyle='#d5c7a7';ctx.fillRect(i*10+1,-height+4,5,2);
  }
  ctx.fillStyle='#b08a83';ctx.fillRect(52,-10,11,10);ctx.fillStyle='#849675';ctx.fillRect(57,-26,3,17);ctx.fillRect(51,-22,8,5);ctx.fillRect(59,-17,8,4);ctx.restore();
  // A tiny framed portrait of our two white cats, away from the door and wardrobe.
  ctx.save();ctx.translate(756,212);ctx.transform(1,.395,0,1,0,0);
  ctx.fillStyle='#a08778';ctx.fillRect(0,0,39,44);ctx.fillStyle='#524960';ctx.fillRect(3,3,33,36);
  for(const x of [10,25]){ctx.fillStyle='#f0e7de';ctx.fillRect(x-5,15,10,12);ctx.fillRect(x-4,11,3,5);ctx.fillRect(x+2,11,3,5);ctx.fillStyle='#9ebddd';ctx.fillRect(x-3,19,2,2);ctx.fillRect(x+2,19,2,2);ctx.fillStyle=x===10?'#d5bc61':'#7ba4cc';ctx.fillRect(x-4,26,9,2);}
  ctx.fillStyle='#e4baac';ctx.fillRect(15,33,9,2);ctx.restore();

  paintRoomDoor(ctx);

  // Physical wires and lamp: the animated glow is a separate game layer.
  const bulbs = ROOM_BULBS;
  ctx.strokeStyle = '#131e31'; ctx.lineWidth = 2;
  for (let group = 0; group < 2; group++) {
    ctx.beginPath();
    bulbs.slice(group * 6, group * 6 + 6).forEach(([x,y], i) => i ? ctx.lineTo(x,y - 4) : ctx.moveTo(x,y - 4));
    ctx.stroke();
  shape([[228,144],[234,142],[234,247],[226,252]],'#4d536d','#1b2b43');
  shape([[340,103],[347,101],[348,209],[340,213]],'#66617a','#1b2b43');
  }
  ctx.strokeStyle = '#697789'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(492,115); ctx.lineTo(492,176); ctx.stroke();
  shape([[478,175],[506,175],[515,194],[469,194]], '#c5a35b', '#514431');
  ctx.fillStyle = '#ead69b'; ctx.fillRect(479,194,27,3);
}

export function createRoomBackground(document) {
  const room = document.createElement('canvas');
  room.width = 960; room.height = 640;
  const pixels=document.createElement('canvas');pixels.width=480;pixels.height=320;
  const c=pixels.getContext('2d');c.scale(.5,.5);drawRoomBackground(c);
  const target=room.getContext('2d');target.imageSmoothingEnabled=false;target.drawImage(pixels,0,0,960,640);
  return room;
}
