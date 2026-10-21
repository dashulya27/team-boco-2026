import assert from 'node:assert/strict';
import { createCatIslandLevel } from '../cat-island.js';
let seed=17;
Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
let completed=0;
const level=createCatIslandLevel({canvas:{width:960,height:640},ctx:{},roomImage:{},onExit(){},onComplete(){completed++;}});
level.reset();level.handleKeyDown('enter');
const step=12, cells=[];
for(let y=0;y<640;y+=step)for(let x=0;x<960;x+=step)if(level.canPlayerStand(x,y))cells.push({x,y,id:`${x},${y}`});
const byId=new Map(cells.map(p=>[p.id,p]));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function route(player,target){
 const start=cells.reduce((a,b)=>dist(a,player)<dist(b,player)?a:b);
 const queue=[start],parents=new Map([[start.id,null]]);let end=null;
 for(let i=0;i<queue.length;i++){
  const p=queue[i];if(dist(p,target)<35){end=p;break;}
  for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const id=`${p.x+dx},${p.y+dy}`;
   if(byId.has(id)&&!parents.has(id)){parents.set(id,p);queue.push(byId.get(id));}
  }
 }
 if(!end)return [];
 const result=[];while(end){result.unshift(end);end=parents.get(end.id);}return result;
}
let path=[], jumps=0;
for(let frame=0;frame<18000;frame++){
 const s=level.getSnapshot();assert.ok(s.catsInsideBounds,'Cat left safe floor');
 assert.ok(s.catsOutsideFurniture,'Cat crossed furniture');
 assert.ok(level.canPlayerStand(s.player.x,s.player.y),'Player entered furniture or left floor');
 if(s.phase==='win')break;
 jumps+=s.activeCats.some(c=>c.jumping)?1:0;
 const target=s.carrying?{x:140,y:350}:s.activeCats.reduce((a,b)=>!a||dist(b,s.player)<dist(a,s.player)?b:a,null);
 const keys=new Set(['e']);
 if(target){
  if(frame%9===0||!path.length)path=route(s.player,target);
  while(path.length&&dist(path[0],s.player)<8)path.shift();
  const next=path[0]??target;
  if(next.x-s.player.x>3)keys.add('d');if(next.x-s.player.x < -3)keys.add('a');
  if(next.y-s.player.y>3)keys.add('s');if(next.y-s.player.y < -3)keys.add('w');
 }
 level.update(1/30,keys);
}
const end=level.getSnapshot();
assert.equal(end.phase,'win',JSON.stringify(end));assert.equal(end.catsDelivered,3);assert.equal(completed,1);
assert.ok(jumps>0,'The playthrough must include a real cat jump and landing');
assert.equal(end.deliveries.length,3);assert.equal(new Set(end.deliveries).size,2);
level.update(1/30,new Set(['e']));assert.equal(completed,1,'Win callback must not repeat');
level.handleKeyDown('r');assert.equal(level.getSnapshot().phase,'intro');
assert.equal(level.getSnapshot().catsDelivered,0);assert.equal(level.getSnapshot().elapsed,0);
level.handleKeyDown('enter');assert.equal(level.getSnapshot().activeCats.length,2);
console.log(`Playthrough: three deliveries, one completion callback, safe cat bounds (${jumps} jumping frames).`);
