export const ROOM_FLOOR=[[55,350],[402,214],[908,414],[520,610],[170,510]];
export const ROOM_OUTLINE=[[55,165],[402,30],[908,230],[908,414],[520,610],[170,510],[55,350]];
export const ROOM_DOOR={ x:145,y:339,radius:32,lightX:144,lightY:262 };
export const ROOM_BULBS=[[303,137],[328,145],[359,138],[391,122],[423,106],[439,89],
  [599,171],[613,197],[633,215],[661,223],[691,213],[712,201]];

// Closed door and open passage share the exact same wall-plane geometry.
export function paintRoomDoor(ctx,open=false) {
  function shape(points,color,outline) {
    ctx.beginPath();points.forEach(([x,y],i) => i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
    ctx.fillStyle=color;ctx.fill();
    if(outline){ctx.strokeStyle=outline;ctx.lineWidth=2;ctx.stroke();}
  }
  ctx.save();
  shape([[106,180],[182,150],[182,310],[106,340]],'#171f2b','#536073');
  shape([[110,183],[178,156],[178,306],[110,333]],'#8b7353','#c0a276');
  const inside=[[116,187],[172,165],[172,303],[116,325]];
  if(open) {
    const g=ctx.createLinearGradient(145,165,145,329);g.addColorStop(0,'#030b18');g.addColorStop(1,'#1c3347');
    shape(inside,g,'#d3bc7b');
    shape([[116,325],[172,303],[193,311],[136,334]],'#60727a');
    shape([[172,165],[199,181],[199,319],[172,303]],'#554338','#a28a61');
    shape([[178,176],[192,185],[192,307],[178,298]],'#6b5040');
    ctx.fillStyle='#d8b963';ctx.fillRect(190,243,3,4);
  } else {
    shape(inside,'#564338','#b29a73');
    shape([[122,194],[166,176],[166,241],[122,258]],'#66503e','#3d3633');
    shape([[122,266],[166,249],[166,297],[122,314]],'#604a3c','#3d3633');
    ctx.fillStyle='#d8b963';ctx.fillRect(160,245,5,3);
  }
  ctx.restore();
}
