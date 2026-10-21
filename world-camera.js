export const WORLD_VIEWPORT={x:197,y:95,width:745,height:511};
export const WORLD_NODES=[
  {x:203,y:115,width:370,height:370*2/3},
  {x:559,y:218,width:360,height:240},
  {x:288,y:398,width:270,height:180}
];
export function createWorldCamera({reducedMotion=false}={}) {
  const middle={x:WORLD_VIEWPORT.x+WORLD_VIEWPORT.width/2,y:WORLD_VIEWPORT.y+WORLD_VIEWPORT.height/2};
  const current={x:middle.x,y:middle.y,zoom:1},target={...current};
  let focused=null;
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  function focus(index,zoom=index===2?2.05:1.65) {
    const node=WORLD_NODES[index];if(!node)return;
    focused=index;target.zoom=clamp(zoom,1,2.5);
    target.x=node.x+node.width/2;target.y=node.y+node.height/2+39/target.zoom;
  }
  return {
    get focused(){return focused;},
    get zoom(){return current.zoom;},get targetZoom(){return target.zoom;},
    focus,
    overview(){focused=null;Object.assign(target,{x:middle.x,y:middle.y,zoom:1});},
    zoomBy(amount,index=focused??0){focus(index,target.zoom+amount);},
    panBy(x,y){target.x=clamp(target.x-x/current.zoom,220,850);target.y=clamp(target.y-y/current.zoom,160,535);},
    update(delta){
      const amount=reducedMotion?1:1-Math.exp(-Math.max(0,Math.min(.08,delta))*8);
      for(const key of ['x','y','zoom'])current[key]+=(target[key]-current[key])*amount;
      return {...current};
    },
    apply(ctx){ctx.translate(middle.x,middle.y);ctx.scale(current.zoom,current.zoom);ctx.translate(-current.x,-current.y);},
    worldToScreen(point){return {x:middle.x+(point.x-current.x)*current.zoom,y:middle.y+(point.y-current.y)*current.zoom};},
    screenToWorld(point){return {x:current.x+(point.x-middle.x)/current.zoom,y:current.y+(point.y-middle.y)/current.zoom};},
    snapshot(){return {...current,target:{...target},focused};}
  };
}

// v1.9: slim, curved light paths. Each is one continuous cubic Bézier
// rather than a jagged polyline; the travelled dots follow the same curve.
export function drawNeonConnection(ctx,points,timestamp,{active=false,future=false}={}) {
  const a=points[0], b=points[points.length-1];
  const dx=b[0]-a[0],dy=b[1]-a[1];
  const c1=points.length>=4?points[1]:[a[0]+dx*.33,a[1]+dy*.14];
  const c2=points.length>=4?points[points.length-2]:[b[0]-dx*.33,b[1]-dy*.14];
  const base=future?'#91c5c2':active?'#f1c99a':'#d7a5c8';
  const bright=future?'#daeee6':active?'#fff0cc':'#f4d6e9';
  const position=t=>{const q=1-t;return [q*q*q*a[0]+3*q*q*t*c1[0]+3*q*t*t*c2[0]+t*t*t*b[0],q*q*q*a[1]+3*q*q*t*c1[1]+3*q*t*t*c2[1]+t*t*t*b[1]];};
  ctx.save();const inheritedAlpha=ctx.globalAlpha;ctx.lineCap='round';
  const path=()=>{ctx.beginPath();ctx.moveTo(...a);ctx.bezierCurveTo(...c1,...c2,...b);};
  ctx.strokeStyle='#181627';ctx.lineWidth=3;path();ctx.stroke();
  ctx.globalAlpha=.13*inheritedAlpha;ctx.strokeStyle=base;ctx.lineWidth=3.2;ctx.shadowColor=base;ctx.shadowBlur=5;path();ctx.stroke();
  ctx.globalAlpha=.70*inheritedAlpha;ctx.shadowBlur=0;ctx.lineWidth=1.35;path();ctx.stroke();
  ctx.globalAlpha=.55*inheritedAlpha;ctx.strokeStyle=bright;ctx.lineWidth=.65;path();ctx.stroke();
  // A single travelling firefly: noticeable on focus, never a distracting flood.
  const t=((timestamp*(active?.00010:.000075))%1);
  const [x,y]=position(t);
  ctx.globalAlpha=.9*inheritedAlpha;ctx.fillStyle=bright;ctx.shadowColor=base;ctx.shadowBlur=5;ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);
  ctx.shadowBlur=0;ctx.globalAlpha=inheritedAlpha;
  for(const end of [a,b]){ctx.fillStyle='#42364b';ctx.fillRect(end[0]-3,end[1]-3,6,6);ctx.fillStyle=bright;ctx.fillRect(end[0]-1,end[1]-1,2,2);}
  ctx.restore();
}
