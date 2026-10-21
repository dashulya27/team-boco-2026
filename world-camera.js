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

export function drawNeonConnection(ctx,points,timestamp,{active=false,future=false}={}) {
  const colors=future?['#947bc8','#c9b7ed','#b0ede1']:active?['#b58b52','#f2ca81','#fff1bd']:['#aa749b','#edb4d5','#ffe0ed'];
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  const trace=()=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));};
  ctx.strokeStyle='#17152a';ctx.lineWidth=12;trace();ctx.stroke();
  for(const [width,blur,alpha]of [[7,22,.3],[4,12,.65],[2,4,.95]]){
    ctx.globalAlpha=alpha;ctx.strokeStyle=colors[0];ctx.shadowColor=colors[1];ctx.shadowBlur=blur;ctx.lineWidth=width;trace();ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.strokeStyle=colors[1];ctx.lineWidth=1.5;trace();ctx.stroke();
  const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
  const total=lengths.reduce((a,b)=>a+b,0);
  for(let n=0;n<3;n++){
    let distance=((timestamp*(active ? .065 : .035))+n*total/3)%total,index=0;
    while(distance>lengths[index]&&index<lengths.length-1)distance-=lengths[index++];
    const t=distance/lengths[index],x=points[index][0]+(points[index+1][0]-points[index][0])*t,y=points[index][1]+(points[index+1][1]-points[index][1])*t;
    ctx.fillStyle=colors[2];ctx.shadowColor=colors[1];ctx.shadowBlur=11;ctx.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);
  }
  ctx.shadowBlur=0;
  points.forEach(([x,y],i)=>{if(i===0||i===points.length-1){ctx.fillStyle='#3d334a';ctx.fillRect(x-6,y-4,12,8);ctx.fillStyle=colors[1];ctx.fillRect(x-3,y-1,6,2);}});
  ctx.restore();
}
