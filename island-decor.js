import { drawSpriteFrame } from './sprite-assets.js?v=1.7.0';

// Small native details all live on the shared 480×320 scene grid.
export function paintIslandGarden(ctx,time,{future=false}={}) {
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  for(const [x,y]of (future?[[218,366],[738,367],[580,435]]:[[233,373],[726,372],[631,437]])){
    r(x-12,y-5,26,4,'#ab817c');r(x-10,y-1,22,15,'#805f6c');r(x-7,y+14,17,3,'#57485f');
    for(let n=0;n<3;n++){
      const px=x-6+n*7,py=y-14-n%2*7;
      r(px,py,2,y-py,'#798869');r(px-3,py-3,7,7,n%2?'#e7c68e':'#d29dbb');r(px-1,py-1,3,3,'#f7de9c');
    }
  }
  for(const [x,y]of [[303,475],[393,514],[648,487],[730,440]]){
    r(x,y,3,24,'#59694f');r(x-5,y+9,6,3,'#738567');r(x+3,y+16,6,3,'#8b9d73');
  }
  for(let i=0;i<10;i++){
    const x=215+(i*71)%515,y=257+(i*43)%178;
    ctx.globalAlpha=.3+(Math.sin(time/800+i)+1)*.2;r(x,y+Math.round(Math.sin(time/1100+i)*3),2,2,i%2?'#f7d390':'#dab4cf');
  }
  ctx.globalAlpha=1;
}

export function paintLibraryDetails(ctx,time,assets,{complete=false}={}) {
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const p=(points,c)=>{ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  // The same walnut nightstand and upholstered chair as the bedroom.
  drawSpriteFrame(ctx,assets,'nightstand',283,371,{scale:.8,time:time/1000});
  drawSpriteFrame(ctx,assets,'chair',650,410,{scale:.73});
  // Open notebook, folded cipher card and pencil on a second tiny reading stand.
  p([[259,307],[285,296],[315,309],[288,321]],'#b09378');p([[259,307],[288,321],[288,328],[259,314]],'#735b57');p([[288,321],[315,309],[315,316],[288,328]],'#594759');
  r(266,317,4,29,'#514355');r(304,320,4,27,'#514355');
  p([[266,302],[280,297],[287,301],[289,313],[275,309]],'#ecdfbf');p([[287,301],[300,296],[311,302],[297,308],[289,313]],'#d6cfb3');
  ctx.strokeStyle='#aa9b91';ctx.lineWidth=1;for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(271,302+n*2);ctx.lineTo(282,306+n*2);ctx.stroke();}
  p([[296,310],[307,306],[309,308],[299,313]],'#d8b86d');
  // A little decoder wheel hanging on the right pillar.
  ctx.save();ctx.translate(641,264);ctx.scale(1,.8);
  ctx.fillStyle='#b99a70';ctx.beginPath();ctx.arc(0,0,19,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#ead2a0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,13,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<12;i++){const angle=i*Math.PI/6;ctx.fillStyle=i%3?'#725b5e':'#f3dca2';ctx.fillRect(Math.round(Math.cos(angle)*15)-1,Math.round(Math.sin(angle)*15)-1,2,2);}
  r(-2,-2,4,4,'#f4dba7');ctx.restore();
  // Two small ribboned scrolls and a warm candle at the flower-side edge.
  p([[683,367],[708,357],[720,363],[694,373]],'#dbccac');r(697,360,3,10,'#ad7c9d');
  r(675,350,6,14,'#d8c5a9');r(677,344+Math.round(Math.sin(time/90)),3,7,'#f3ce8b');
  if(complete){r(592,273,2,47,'#8cb9c2');r(631,276,2,52,'#6b668b');}
}

export function paintWorkshopDetails(ctx,time,assets) {
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const p=(points,c)=>{ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  // Walnut workbench, a real paper plan and little jars: a place being made together.
  p([[383,333],[451,306],[559,347],[490,380]],'#a27d66');p([[383,333],[490,380],[490,392],[383,345]],'#6e5559');p([[490,380],[559,347],[559,359],[490,392]],'#57475a');
  r(396,349,6,49,'#443c50');r(541,363,6,41,'#443c50');
  p([[414,336],[449,321],[509,345],[473,362]],'#aec3ca');p([[421,336],[449,325],[503,345],[473,358]],'#507788');
  ctx.strokeStyle='#c1d8d7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(441,336);ctx.lineTo(459,329);ctx.lineTo(482,338);ctx.lineTo(482,350);ctx.lineTo(459,342);ctx.lineTo(441,349);ctx.closePath();ctx.stroke();
  r(516,332,11,13,'#c39bb1');r(527,336,4,7,'#8b6d8f');r(518,328,7,3,'#ead8ba');
  p([[399,328],[410,324],[421,329],[410,334]],'#d7bd83');
  drawSpriteFrame(ctx,assets,'chair',597,403,{scale:.76});
  // A cosy cat basket belongs to the same family of room furniture.
  p([[268,387],[301,373],[344,389],[310,408]],'#a68b78');p([[268,387],[310,408],[310,419],[268,399]],'#786174');p([[310,408],[344,389],[344,401],[310,419]],'#8b7380');
  p([[276,387],[301,378],[337,390],[309,401]],'#b2a2b5');
  drawSpriteFrame(ctx,assets,'bounty',308,398,{scale:.9});
  // A bookshelf tucked beneath the workshop sign.
  r(372,305,210,6,'#715a65');
  for(let i=0;i<8;i++){r(386+i*20,284-i%3*4,12,21+i%3*4,['#826f90','#ae8195','#9c9272','#5e8291'][i%4]);r(388+i*20,288-i%3*4,8,2,'#c6b69b');}
  const pulse=.8+Math.sin(time/400)*.13;
  for(const [x,y]of [[244,290],[701,350]]){
    r(x-3,y-8,6,76,'#5c526c');r(x-9,y-17,18,5,'#ac8c93');r(x-6,y-12,12,19,'#d8ba85');r(x-9,y+7,18,4,'#9d7d8b');
    ctx.save();ctx.shadowBlur=14;ctx.shadowColor='#eac890';ctx.globalAlpha=pulse;r(x-2,y-9,4,12,'#f8dfaa');ctx.restore();
  }
  // Bunting instead of a hazard barrier.
  ctx.strokeStyle='#b995ad';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(274,375);ctx.quadraticCurveTo(483,433,686,375);ctx.stroke();
  for(let i=0;i<9;i++){const x=283+i*47,y=377+Math.sin(i/8*Math.PI)*28;p([[x-7,y],[x+7,y],[x,y+13]],i%2?'#ca99b9':'#d8ba8e');}
}
