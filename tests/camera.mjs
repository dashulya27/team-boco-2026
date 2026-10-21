import assert from 'node:assert/strict';
import {createWorldCamera,WORLD_NODES,WORLD_VIEWPORT} from '../world-camera.js';
const camera=createWorldCamera();
camera.focus(0);let last=1;
for(let i=0;i<120;i++){
  const state=camera.update(1/60);assert.ok(state.zoom>=last&&state.zoom<=1.65);last=state.zoom;
}
assert.ok(Math.abs(camera.zoom-1.65)<.001);
for(const node of WORLD_NODES){
  const p={x:node.x+node.width*.37,y:node.y+node.height*.61},roundTrip=camera.screenToWorld(camera.worldToScreen(p));
  assert.ok(Math.hypot(p.x-roundTrip.x,p.y-roundTrip.y)<1e-8,'Hit testing must follow the transformed island');
}
const node=WORLD_NODES[0],center=camera.worldToScreen({x:node.x+node.width/2,y:node.y+node.height/2});
assert.ok(center.x>WORLD_VIEWPORT.x&&center.x<WORLD_VIEWPORT.x+WORLD_VIEWPORT.width);
camera.zoomBy(100);assert.equal(camera.targetZoom,2.5);
camera.zoomBy(-100);assert.equal(camera.targetZoom,1);
camera.panBy(100,-40);camera.update(.05);assert.ok(Number.isFinite(camera.snapshot().x));
camera.overview();for(let i=0;i<120;i++)camera.update(1/60);assert.ok(Math.abs(camera.zoom-1)<.001);assert.equal(camera.focused,null);
const still=createWorldCamera({reducedMotion:true});still.focus(2);assert.equal(still.update(1/60).zoom,2.05);
console.log('World camera: smooth focus, zoom limits, pan, inverse hit testing, overview and reduced-motion setting passed.');
