import { drawSpriteFrame } from './sprite-assets.js?v=1.7.0';
import { paintIslandGarden,paintLibraryDetails,paintWorkshopDetails } from './island-decor.js?v=1.7.0';

// Same 480×320 pixel grid as the cat room, reused for the map and the final scene.
const finalePixelBuffers=new WeakMap();
function renderFinalePixels(target,paint,timestamp,assets,options) {
  if(!globalThis.document?.createElement)return paint(target,timestamp,assets,options);
  let pixels=finalePixelBuffers.get(target.canvas);
  if(!pixels){pixels=document.createElement('canvas');pixels.width=480;pixels.height=320;finalePixelBuffers.set(target.canvas,pixels);}
  paint(pixels.getContext('2d'),timestamp,assets,options);
  target.save();target.imageSmoothingEnabled=false;target.clearRect(0,0,target.canvas.width,target.canvas.height);
  target.drawImage(pixels,0,0,target.canvas.width,target.canvas.height);target.restore();
}
export function drawFinaleIsland(ctx,timestamp,assets=new Map(),options={}) {renderFinalePixels(ctx,paintFinaleIsland,timestamp,assets,options);}
export function drawFutureIsland(ctx,timestamp,assets=new Map(),options={}) {renderFinalePixels(ctx,paintFutureIsland,timestamp,assets,options);}
export function drawEntryIsland(ctx,timestamp,assets=new Map(),options={}) {renderFinalePixels(ctx,paintEntryIsland,timestamp,assets,options);}

// Native canvas art: the puzzle, its map miniature and the reveal share one scene.
function paintFinaleIsland(ctx, timestamp, assets = new Map(), { complete = false, locked = false, background = false } = {}) {
  const w = ctx.canvas.width, h = ctx.canvas.height;
  ctx.save(); ctx.scale(w / 960, h / 640); ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, 960, 640);
  if (background) {
    ctx.fillStyle = '#070e20'; ctx.fillRect(0, 0, 960, 640);
    for (let i = 0; i < 55; i++) {
      ctx.globalAlpha = .3 + (Math.sin(timestamp / 800 + i) + 1) * .2;
      ctx.fillStyle = i % 5 ? '#8296bf' : '#f1d66e';
      ctx.fillRect((i * 179 + 31) % 950, (i * 97 + 13) % 610, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  const poly = (points, color) => {
    ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fill();
  };
  const rect = (x,y,width,height,color) => { ctx.fillStyle=color; ctx.fillRect(x,y,width,height); };
  const text = (value,x,y,size,color='#f4d768') => {
    ctx.font=`bold ${size}px "Courier New",monospace`; ctx.fillStyle=color; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(value,x,y);
  };
  const glow = (x,y,r,color) => {
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  };
  const heart = (x,y,color,scale=2) => {
    const rows=['0110110','1111111','1111111','0111110','0011100','0001000'];ctx.fillStyle=color;
    rows.forEach((row,iy)=>[...row].forEach((p,ix)=>{if(p==='1')ctx.fillRect(x+ix*scale,y+iy*scale,scale,scale);}));
  };
  const bob=Math.round(Math.sin(timestamp/900)*3);
  ctx.translate(0,bob);
  glow(480,365,230,complete?'rgba(174,91,161,.12)':'rgba(75,110,189,.12)');
  // Layered floating stone, not an ellipse or a flat button.
  poly([[155,382],[468,245],[817,372],[503,534]],'#080d19');
  poly([[155,368],[503,507],[503,555],[423,548],[389,519],[303,503],[272,472],[198,444]],'#182137');
  poly([[503,507],[817,358],[799,420],[733,447],[709,478],[636,501],[609,533],[503,555]],'#10182c');
  poly([[156,349],[467,215],[817,349],[503,502]],'#455268');
  poly([[164,344],[467,224],[806,347],[503,490]],'#283448');
  poly([[181,344],[468,235],[787,347],[502,478]],'#384458');
  for(let i=0;i<6;i++) {
    ctx.strokeStyle='#4a5668';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(220+i*48,330-i*17);ctx.lineTo(531+i*43,451-i*21);ctx.stroke();
  }
  ctx.save();ctx.beginPath();[[181,344],[468,235],[787,347],[502,478]].forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();
  for(let y=248;y<478;y+=10)for(let x=190;x<785;x+=14){
    const grain=(x*19+y*13)%31;rect(x,y,grain%3?4:8,2,grain<16?'#3e4a5d':'#303b50');
  }
  ctx.restore();
  poly([[231,416],[268,430],[268,454],[231,440]],'#637152');
  poly([[687,440],[717,427],[714,449],[687,462]],'#667957');
  [[223,437],[734,425],[611,509]].forEach(([x,y])=>{rect(x,y,4,29,'#53664b');rect(x-5,y+15,9,4,'#71855a');});
  paintIslandGarden(ctx,timestamp);
  // A small ceremonial arch and glowing letter stones.
  rect(335,158,34,174,'#131b30');rect(591,158,34,174,'#131b30');
  rect(331,151,42,20,'#566079');rect(587,151,42,20,'#566079');
  rect(348,105,264,35,'#26334f');rect(367,93,226,19,'#3d4b66');
  rect(373,113,214,4,complete?'#e39eb9':'#dfc657');
  for(let i=0;i<4;i++){rect(337,183+i*34,29,3,'#3b4861');rect(594,183+i*34,29,3,'#3b4861');}
  text(complete?'BIRTHDAY MVP':'ONE LAST LITTLE SECRET',480,128,15,complete?'#f3bdcb':'#f7d970');
  for(let i=0;i<6;i++) {
    const x=390+i*35,y=176+Math.round(Math.sin(timestamp/700+i)*5);
    rect(x-12,y-13,25,28,'#101b31');rect(x-11,y+14,23,2,'#6e6440');
    text(complete?'♥':'SIMPLE'[i],x,y+2,18,complete?'#f0b1c6':'#e9d16f');
  }
  // BOCO emblem in the arch, retaining the actual supplied logo.
  const logo=assets.get('logo')?.image;
  if(logo){ctx.drawImage(logo,446,219,68,68);} else {text('BOCO',480,248,24);}
  // Lanterns, a short garland and softly animated cores, visible from the map.
  ctx.strokeStyle='#63708a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(270,262);ctx.quadraticCurveTo(480,338,692,262);ctx.stroke();
  for(let i=0;i<9;i++) {
    const x=275+i*51,y=264+Math.sin(i/8*Math.PI)*35;
    const c=i%2?'#edb6cc':'#f6db7a';glow(x,y,19,i%2?'rgba(238,154,195,.16)':'rgba(247,204,90,.18)');rect(x-2,y-2,4,5,c);
  }
  for(const [x,y] of [[221,357],[739,357]]) {
    rect(x-3,y-69,6,71,'#171f31');rect(x-12,y-80,24,8,'#53617b');rect(x-9,y-72,18,24,'#e8c46a');
    rect(x-12,y-48,24,5,'#53617b');glow(x,y-61,42,'rgba(254,210,104,.23)');rect(x-4,y-69,8,17,'#fff0b2');
  }
  // Ivy and little flowers keep the final round a cosy birthday place.
  for(const [x,y]of [[333,192],[617,207],[333,260],[617,282],[256,370],[701,398]]){
    rect(x,y,3,22,'#687a60');rect(x-7,y+6,8,5,'#81916c');rect(x+3,y+13,8,5,'#91a27b');
    rect(x-2,y-4,7,7,'#db9eb5');rect(x,y-2,3,3,'#f8d890');
  }
  // Black/yellow match-day banners and a site marker; no external logos required.
  rect(274,221,4,100,'#7a8291');poly([[278,220],[323,229],[323,276],[278,265]],'#e8cd45');
  text('BOCO',301,246,11,'#101621');
  poly([[662,321],[709,303],[733,313],[686,334]],'#e3c947');text('A',697,316,15,'#111a29');
  if(complete) {
    // The wrapped present becomes a complete little RGB desktop setup.
    poly([[407,315],[521,274],[661,320],[544,365]],'#755f5e');
    poly([[407,315],[544,365],[544,380],[407,330]],'#4a3a48');poly([[544,365],[661,320],[661,336],[544,380]],'#352f42');
    rect(420,331,9,76,'#30283c');rect(638,341,9,67,'#30283c');
    rect(472,245,105,65,'#060d1a');rect(477,250,95,54,'#172d4c');
    const screen=ctx.createLinearGradient(477,250,572,304);screen.addColorStop(0,'#4d416a');screen.addColorStop(1,'#20465c');ctx.fillStyle=screen;ctx.fillRect(480,253,89,48);
    heart(510,267,'#f3c9da',3);rect(518,310,12,18,'#172034');rect(499,327,51,5,'#1a2236');
    rect(585,266,52,72,'#090e19');rect(590,272,41,60,'#19243a');rect(595,278,31,48,'#111a2b');
    for(let i=0;i<3;i++) {ctx.strokeStyle=['#df91c0','#e7d17b','#78cbd6'][(i+Math.floor(timestamp/800))%3];ctx.lineWidth=3;ctx.strokeRect(601,281+i*14,17,10);}
    poly([[478,342],[521,328],[562,342],[520,357]],'#182132');rect(604,337,9,5,'#9ed1dc');
  } else {
    poly([[425,324],[481,302],[544,324],[484,350]],'#ecbe64');
    poly([[425,324],[484,350],[484,396],[425,369]],'#ba8156');poly([[484,350],[544,324],[544,370],[484,396]],'#d9a05a');
    poly([[450,314],[460,311],[521,335],[512,339]],'#5e446c');poly([[479,348],[490,348],[490,393],[479,394]],'#67486c');
    rect(464,296,18,15,'#8d6290');rect(483,296,18,15,'#aa78a3');rect(480,303,7,12,'#e8b9cd');
    text('?',485,366,28,'#fff0b3');
  }
  paintLibraryDetails(ctx,timestamp,assets,{complete});
  const actors=complete?[["coco",345,434,.94],["dominik",442,442,1.25],["darina",498,442,1.25],["bounty",577,450,1.1]]
    :[["coco",337,417,.9],["bounty",622,420,1]];
  actors.forEach(([id,x,y,scale])=>drawSpriteFrame(ctx,assets,id,x,y,{direction:'down',time:timestamp,scale}));
  if(complete) {
    for(let i=0;i<16;i++) {
      const x=220+(i*137)%520,y=130+((i*51+timestamp/34)%340);
      if(i%3===0)heart(Math.round(x),Math.round(y),'#e8a9c0',1.5);
      else rect(Math.round(x),Math.round(y),3,6,i%2?'#f3d275':'#8bb6cb');
    }
  }
  if(locked) {ctx.fillStyle='rgba(5,11,23,.32)';ctx.fillRect(160,90,660,470);}
  ctx.restore();
}

function paintFutureIsland(ctx,timestamp,assets=new Map(),{background=false}={}) {
  const w=ctx.canvas.width,h=ctx.canvas.height;ctx.save();ctx.scale(w/960,h/640);ctx.clearRect(0,0,960,640);
  if(background){ctx.fillStyle='#100f1d';ctx.fillRect(0,0,960,640);for(let i=0;i<45;i++){ctx.fillStyle=i%3?'#5b536e':'#b69481';ctx.fillRect((i*137)%940,20+(i*73)%570,2,2);}}
  const p=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  const r=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const t=(s,x,y,size,c)=>{ctx.font=`bold ${size}px "Courier New",monospace`;ctx.textAlign='center';ctx.fillStyle=c;ctx.fillText(s,x,y);};
  p([[169,343],[460,226],[787,350],[499,493]],'#303c4d');p([[169,343],[499,493],[499,548],[392,519],[281,483],[202,428]],'#141e2e');p([[499,493],[787,350],[766,426],[623,490],[583,527],[499,548]],'#0c1526');
  p([[192,341],[460,239],[761,350],[499,475]],'#455060');
  r(346,199,8,205,'#273346');r(610,199,8,205,'#273346');r(337,187,289,17,'#617087');
  r(357,207,250,103,'#0b1424');r(367,217,230,4,'#e4c94b');
  t('MORE MEMORIES',481,252,24,'#e4c893');t('COMING SOON',481,278,15,'#c2a3bd');
  r(232,305,67,54,'#5e5147');r(238,310,55,41,'#78664f');r(249,310,5,41,'#4b4140');r(278,310,5,41,'#4b4140');
  r(695,280,5,85,'#717e90');p([[700,280],[751,293],[751,331],[700,317]],'#e1c646');t('NEXT',725,310,13,'#131d2d');
  for(const [x,y]of [[216,359],[744,368],[609,417]]){r(x,y,4,24,'#6d855e');r(x-6,y+9,8,5,'#8b9f72');r(x-3,y-4,10,9,'#d6a1b3');r(x,y-1,4,3,'#f4d589');}
  const pulse=.55+(Math.sin(timestamp/450)+1)*.2;ctx.globalAlpha=pulse;r(335,178,13,8,'#e7cc69');r(615,178,13,8,'#e7cc69');ctx.globalAlpha=1;
  paintIslandGarden(ctx,timestamp,{future:true});paintWorkshopDetails(ctx,timestamp,assets);
  if(assets.get('logo')?.image)ctx.drawImage(assets.get('logo').image,640,317,35,35);
  ctx.restore();
}

function paintEntryIsland(ctx,timestamp,assets=new Map(),{background=false}={}) {
  ctx.save();ctx.scale(ctx.canvas.width/960,ctx.canvas.height/640);ctx.clearRect(0,0,960,640);
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  const poly=(points,c)=>{ctx.fillStyle=c;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
  if(background){rect(0,0,960,640,'#141222');for(let i=0;i<58;i++){ctx.globalAlpha=.35+(Math.sin(timestamp/850+i)+1)*.16;rect(25+(i*173)%910,25+(i*79)%580,2,2,i%4?'#82718e':'#e7c88b');}ctx.globalAlpha=1;}
  const glow=(x,y,r,c)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);};
  poly([[176,367],[472,240],[790,363],[493,515]],'#3e354e');poly([[176,367],[493,515],[493,549],[402,525],[286,477],[195,423]],'#25243a');poly([[493,515],[790,363],[770,422],[659,478],[573,521],[493,549]],'#1b1e32');
  poly([[195,367],[473,251],[768,365],[493,503]],'#4a4057');
  for(let i=0;i<9;i++){ctx.strokeStyle='#5b4c64';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(246+i*30,349-i*12);ctx.lineTo(499+i*25,472-i*12);ctx.stroke();}
  rect(357,151,243,229,'#28253c');rect(365,151,225,217,'#7e6878');rect(377,166,201,201,'#3e354f');rect(388,177,178,187,'#192033');
  glow(480,296,160,'rgba(230,170,190,.18)');rect(395,185,161,178,'#363647');
  poly([[395,185],[511,208],[511,378],[395,356]],'#725d67');poly([[403,196],[502,215],[502,362],[403,346]],'#8e7275');
  for(let i=0;i<5;i++)rect(409+i*18,208+i*4,2,118,'#a58983');rect(486,293,5,8,'#f2cf82');
  rect(349,139,260,18,'#ad8e88');rect(375,119,208,25,'#44384b');
  ctx.font='bold 17px "Courier New",monospace';ctx.textAlign='center';ctx.fillStyle='#edcf9d';ctx.fillText('FÜR DICH. MIT LIEBE.',480,137);
  const logo=assets.get('logo')?.image;if(logo)ctx.drawImage(logo,440,202,73,73);
  poly([[363,379],[537,399],[594,379],[590,392],[535,417],[363,393]],'#8e7a85');
  poly([[356,396],[535,417],[598,392],[601,405],[535,434],[350,411]],'#685d75');
  for(const [x,y]of [[301,322],[657,322]]){
    rect(x-2,y-83,4,90,'#6e5b70');rect(x-13,y-101,26,8,'#aa8c87');rect(x-9,y-93,18,28,'#d5b681');rect(x-13,y-65,26,5,'#a58a83');
    glow(x,y-79,57,'rgba(255,206,129,.24)');rect(x-3,y-88,6,18,'#fff0b3');
  }
  ctx.strokeStyle='#8b728b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(301,234);ctx.quadraticCurveTo(480,317,657,234);ctx.stroke();
  for(let i=0;i<11;i++){const x=303+i*35,y=235+Math.sin(i/10*Math.PI)*41;glow(x,y,15,i%2?'rgba(224,163,197,.17)':'rgba(247,209,139,.17)');rect(x-2,y-2,4,5,i%2?'#e2b6ce':'#f4d18b');}
  for(const [x,y]of [[238,389],[706,388]]){
    poly([[x-17,y-10],[x+16,y-18],[x+25,y-9],[x-7,y+2]],'#ba8a82');poly([[x-17,y-10],[x-7,y+2],[x-6,y+26],[x-15,y+18]],'#816574');poly([[x-7,y+2],[x+25,y-9],[x+20,y+16],[x-6,y+26]],'#a17c7b');
    rect(x,y-37,4,28,'#8d9c77');rect(x-10,y-31,13,7,'#a3b08a');rect(x+3,y-20,13,6,'#849d7a');rect(x-2,y-45,10,10,'#d7a7bf');rect(x+1,y-42,4,4,'#f5d791');
  }
  drawSpriteFrame(ctx,assets,'coco',367,443,{time:timestamp,scale:1.25});drawSpriteFrame(ctx,assets,'bounty',599,449,{time:timestamp,scale:1.4});
  const heart=['0110110','1111111','1111111','0111110','0011100','0001000'];ctx.fillStyle='#d9a0ba';heart.forEach((row,iy)=>[...row].forEach((bit,ix)=>{if(bit==='1')ctx.fillRect(470+ix*3,440+iy*3,3,3);}));
  ctx.restore();
}
