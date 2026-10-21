// Optional sprites: a missing or not-yet-configured image never blocks the island.
export async function loadSpriteAssets({ manifest = null, manifestUrl = './assets/sprites/manifest.json', imageSources = {} } = {}) {
  const entries = new Map();
  const images = new Map();
  if (!manifest) {
    try {
      const response = await fetch(manifestUrl, { cache:'no-store' });
      if (response.ok) manifest = await response.json();
    } catch {}
  }
  const base = new URL(manifestUrl, globalThis.location?.href || 'http://localhost/');
  await Promise.all(Object.entries(manifest?.sprites || {}).map(async ([id, config]) => {
    if (!config?.src) return;
    try {
      const source = imageSources[config.src] || (config.src.startsWith('data:') ? config.src : new URL(config.src, base).href);
      if (!images.has(source)) images.set(source,new Promise((resolve,reject) => {
        const image = new Image(); image.onload=() => resolve(image); image.onerror=reject; image.src=source;
      }));
      const image = await images.get(source);
      const poseImages = {};
      for (const [direction,pose] of Object.entries(config.poses || {})) {
        const frame = document.createElement('canvas');
        frame.width=pose.rect[2]; frame.height=pose.rect[3];
        const frameCtx=frame.getContext('2d',{willReadFrequently:true});
        frameCtx.drawImage(image,...pose.rect,0,0,frame.width,frame.height);
        if(config.removeWhiteBorder) removeConnectedWhite(frameCtx,frame.width,frame.height);
        poseImages[direction]={image:config.trimAlpha ? trimTransparentFrame(frame,config.trimAlpha) : frame,flipX:pose.flipX===true};
      }
      entries.set(id,{ image, ...config, poseImages });
    } catch { /* Native pixel art remains available for this slot. */ }
  }));
  return entries;
}

function trimTransparentFrame(frame,threshold) {
  const ctx=frame.getContext('2d'),pixels=ctx.getImageData(0,0,frame.width,frame.height).data;
  let minX=frame.width,minY=frame.height,maxX=-1,maxY=-1;
  for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++)if(pixels[(y*frame.width+x)*4+3]>=threshold) {
    minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
  }
  if(maxX<minX)return frame;
  const result=document.createElement('canvas');result.width=maxX-minX+1;result.height=maxY-minY+1;
  result.getContext('2d').drawImage(frame,minX,minY,result.width,result.height,0,0,result.width,result.height);
  return result;
}

function removeConnectedWhite(ctx,width,height) {
  // Only the white background touching a crop border is keyed out.
  // Enclosed white cat fur stays opaque. The original JPEG is never modified.
  const pixels=ctx.getImageData(0,0,width,height), data=pixels.data;
  const seen=new Uint8Array(width*height), queue=new Int32Array(width*height);
  let head=0,tail=0;
  function add(index) {
    if(index<0||index>=seen.length||seen[index]) return;
    seen[index]=1;
    const p=index*4, r=data[p],g=data[p+1],b=data[p+2];
    if(Math.min(r,g,b)>230 && Math.max(r,g,b)-Math.min(r,g,b)<25) queue[tail++]=index;
  }
  for(let x=0;x<width;x++){add(x);add((height-1)*width+x);}
  for(let y=0;y<height;y++){add(y*width);add(y*width+width-1);}
  while(head<tail) {
    const i=queue[head++]; data[i*4+3]=0;
    if(i%width) add(i-1); if(i%width<width-1) add(i+1); add(i-width);add(i+width);
  }
  ctx.putImageData(pixels,0,0);
}

export function drawSpriteFrame(ctx, assets, id, x, y, { state='idle', direction='down', time=0, scale=1 } = {}) {
  const sprite = assets?.get(id);
  if (!sprite) return false;
  const pose=sprite.poseImages?.[direction] || sprite.poseImages?.down;
  if(pose) {
    const height=(sprite.displayHeight||48)*scale;
    const width=height*pose.image.width/pose.image.height;
    const bob=state==='walk' ? Math.round(Math.sin(time*14))*scale : 0;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y+bob));
    if(pose.flipX) ctx.scale(-1,1);
    ctx.drawImage(pose.image,Math.round(-width/2),Math.round(-height),Math.round(width),Math.round(height));
    ctx.restore();return true;
  }
  const { image } = sprite;
  const fw = sprite.frameWidth || image.width, fh = sprite.frameHeight || image.height;
  const animation = sprite.animations?.[state] || sprite.animations?.idle || {};
  const frames = animation.frames?.length ? animation.frames : [0];
  const frame = frames[Math.floor(Math.max(0,time) * (animation.fps || 6)) % frames.length];
  const row = animation.rows?.[direction] ?? animation.row ?? 0;
  if (fw <= 0 || fh <= 0 || frame < 0 || row < 0 || (frame+1)*fw > image.width || (row+1)*fh > image.height) return false;
  const size = (sprite.scale || 1) * scale;
  const anchor = sprite.anchor || [0.5,1];
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  ctx.translate(Math.round(x),Math.round(y));
  if (sprite.flipLeft && direction==='left') ctx.scale(-1,1);
  ctx.drawImage(image,frame*fw,row*fh,fw,fh,Math.round(-fw*size*anchor[0]),Math.round(-fh*size*anchor[1]),Math.round(fw*size),Math.round(fh*size));
  ctx.restore();
  return true;
}
