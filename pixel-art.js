import { drawSpriteFrame } from './sprite-assets.js?v=1.7.0';

export function createPixelArt(ctx, assets = new Map()) {
  const rect = (x,y,w,h,color) => { ctx.fillStyle=color; ctx.fillRect(Math.round(x),Math.round(y),w,h); };
  function poly(points,fill,stroke) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath();
    ctx.fillStyle=fill; ctx.fill();
    if (stroke) { ctx.lineWidth=2; ctx.strokeStyle=stroke; ctx.stroke(); }
  }
  function line(points,color,width=2) {
    ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
    ctx.lineWidth=width; ctx.strokeStyle=color; ctx.stroke();
  }
  function shadow(x,y,w,h) { ctx.save(); ctx.globalAlpha=.26; poly([[x-w/2,y],[x,y-h/2],[x+w/2,y],[x,y+h/2]],'#020611'); ctx.restore(); }

  function rug() {
    poly([[400,407],[603,326],[770,417],[566,505]],'#141f36','#46526d');
    poly([[413,407],[603,333],[755,417],[567,496]],'#26344f','#57617b');
    poly([[427,407],[604,339],[742,417],[568,488]],'#273650');
    for(let i=0;i<6;i++) {
      line([[448+i*31,400-i*12],[583+i*28,474-i*12]],i%2 ? '#34435c':'#3b435f',2);
    }
    for(let i=0;i<11;i++) {
      rect(568+i*17,502-i*7,2,5,'#7d7890');
      rect(403+i*18,410-i*7,2,5,'#7d7890');
    }
  }
  function bed() {
    if (drawSpriteFrame(ctx,assets,'bed',350,467)) return;
    shadow(355,443,210,64);
    // Four floor corners stay within the bed's collision footprint.
    poly([[260,349],[361,309],[453,418],[350,460]],'#2a2631','#111729');
    poly([[260,349],[350,460],[350,474],[260,364]],'#292536','#121b2b');
    poly([[350,460],[453,418],[453,433],[350,474]],'#3b3140','#161b2a');
    poly([[266,349],[360,314],[445,416],[351,455]],'#c1bfcb','#666a83');
    // Deep violet quilt, stitched panels and a folded edge.
    poly([[294,379],[389,342],[444,414],[351,451]],'#615571','#302f4d');
    poly([[300,385],[395,350],[437,411],[352,445]],'#766580');
    poly([[294,379],[389,342],[398,354],[304,392]],'#95849a');
    for(let i=0;i<4;i++) line([[314+i*15,401+i*14],[407+i*10,366+i*15]],'#5c526e',2);
    line([[350,401],[386,444]],'#9b87a3',2);
    // Two pillows sit at the head of the bed.
    poly([[275,348],[312,333],[331,354],[294,369]],'#e3d9dc','#9591aa');
    poly([[320,330],[353,317],[371,338],[338,351]],'#ddd7dd','#9591aa');
    line([[282,350],[312,339],[324,353]],'#f3e7e6',2);
    line([[326,331],[352,322],[365,337]],'#f3e7e6',2);
    // Raised wooden headboard and feet.
    poly([[256,347],[359,306],[359,283],[256,324]],'#655048','#1a2434');
    line([[262,327],[354,291]],'#a27e64',3);
    line([[263,342],[354,306]],'#8d6d59',2);
    rect(352,468,7,9,'#191d2b'); rect(444,430,6,8,'#191d2b');
    rect(268,365,5,8,'#191d2b');
    // A discreet BOCO badge at the foot of the quilt.
    poly([[377,413],[398,405],[407,415],[385,424]],'#302b40');
    line([[383,414],[396,410]],'#d3b75e',2);
  }
  function nightstand(time) {
    if (drawSpriteFrame(ctx,assets,'nightstand',474,371,{time})) {
      const p=candlePosition(),f=Math.sin(time*13)+Math.sin(time*21);
      rect(p.x,p.y-5+(f>0?0:1),3,6,'#e2a345');rect(p.x+1,p.y-3,1,3,'#fff0aa');
      return;
    }
    shadow(477,369,67,22);
    poly([[451,336],[478,326],[499,337],[472,348]],'#927a66','#253047');
    poly([[451,336],[472,348],[472,374],[451,362]],'#4f4954','#253047');
    poly([[472,348],[499,337],[499,364],[472,374]],'#70616a','#253047');
    line([[475,357],[496,349]],'#a08a85',2); rect(485,355,5,2,'#d9bd66');
    // Book, candle and a phone.
    poly([[479,331],[489,327],[495,331],[485,335]],'#668598');
    line([[482,332],[491,329]],'#d0cec0',2);
    rect(459,327,8,8,'#d7bea0'); rect(461,324,4,5,'#e4d6b6');
    const f=Math.sin(time*13)+Math.sin(time*21);
    rect(462,319+(f>0?0:1),3,6,'#e2a345'); rect(463,321,1,3,'#fff0aa');
    poly([[476,341],[481,339],[485,341],[480,343]],'#0b1526','#608293');
  }
  function candlePosition() {
    const sprite=assets.get('nightstand'), frame=sprite?.poseImages?.down?.image;
    if(!frame)return {x:463,y:321};
    const h=sprite.displayHeight,w=h*frame.width/frame.height,p=sprite.lightPoint||[.5,0];
    return {x:Math.round(474-w/2+p[0]*w),y:Math.round(371-h+p[1]*h)};
  }
  function wardrobe() {
    if (drawSpriteFrame(ctx,assets,'wardrobe',832,422)) return;
    shadow(832,422,115,37);
    poly([[781,283],[813,269],[871,300],[840,315]],'#8b7057','#222a3a');
    poly([[781,283],[840,315],[840,421],[781,387]],'#6a5449','#202a3d');
    poly([[840,315],[871,300],[871,405],[840,421]],'#493e3f','#202a3d');
    poly([[787,294],[810,306],[810,394],[787,381]],'#836954','#534745');
    poly([[815,310],[834,320],[834,408],[815,397]],'#806450','#534745');
    line([[789,299],[807,309]],'#a68a68',2); line([[818,316],[832,324]],'#a68a68',2);
    rect(805,348,3,10,'#c8ab6a'); rect(818,355,3,10,'#c8ab6a');
    for(let i=0;i<6;i++) line([[790,315+i*11],[806,323+i*11]],'#775e4f',1);
    rect(788,388,5,7,'#322f37'); rect(835,417,5,7,'#322f37');
    // Storage box above the wardrobe.
    poly([[803,273],[823,264],[845,275],[825,284]],'#506077','#1a293d');
    poly([[803,273],[825,284],[825,294],[803,283]],'#35455d','#1a293d');
    poly([[825,284],[845,275],[845,285],[825,294]],'#2d3a51');
    rect(818,282,5,2,'#bba361');
  }
  function tvCabinet() {
    if (drawSpriteFrame(ctx,assets,'tvCabinet',704,343)) return;
    shadow(703,341,120,30);
    poly([[650,308],[683,296],[754,326],[721,339]],'#7c685a','#202a3e');
    poly([[650,308],[721,339],[721,362],[650,331]],'#534a50','#202a3e');
    poly([[721,339],[754,326],[754,348],[721,362]],'#3c3c49','#202a3e');
    line([[657,320],[716,345]],'#93806a',2);
    rect(675,330,5,2,'#b89d6b'); rect(703,342,5,2,'#b89d6b');
    // Angled screen, frame, controller and little receiver.
    poly([[654,243],[733,274],[733,321],[654,290]],'#0a1529','#59718b');
    poly([[660,251],[727,278],[727,312],[660,286]],'#162d48');
    poly([[665,255],[723,279],[723,283],[665,259]],'#28435d');
    line([[664,277],[680,270],[701,285],[722,280]],'#346b86',2);
    line([[687,303],[696,307],[696,315]],'#18283c',3);
    poly([[685,315],[696,311],[708,317],[697,322]],'#142339');
    rect(742,333,2,2,'#62d8a4');
    poly([[661,310],[670,307],[679,312],[671,316]],'#26364d','#8a95a4');
    rect(667,309,2,4,'#b7b7ac');
  }
  function chair() {
    if (drawSpriteFrame(ctx,assets,'chair',192,500)) return;
    shadow(193,499,74,25);
    poly([[159,450],[184,440],[220,457],[195,468]],'#ad8f6e','#3c3945');
    poly([[159,450],[195,468],[195,498],[159,480]],'#806b59','#3c3945');
    poly([[195,468],[220,457],[220,487],[195,498]],'#665749','#3c3945');
    poly([[164,450],[185,444],[211,457],[192,464]],'#cbc0a2');
    poly([[159,450],[184,440],[184,422],[159,432]],'#a38b6c','#3c3945');
    poly([[165,437],[181,430],[181,440],[165,447]],'#c5b390');
    rect(163,480,5,15,'#3c3640'); rect(214,488,5,13,'#3c3640');
    poly([[180,454],[190,451],[199,456],[189,461]],'#263d59');
    line([[183,455],[193,458]],'#50728f',2);
  }
  function airPurifier(time) {
    if (drawSpriteFrame(ctx,assets,'airPurifier',658,470,{time})) return;
    shadow(657,469,51,19);
    poly([[638,426],[660,417],[681,427],[659,436]],'#d7d4cd','#67778c');
    poly([[638,426],[659,436],[659,474],[638,462]],'#a8b4c1','#67778c');
    poly([[659,436],[681,427],[681,464],[659,474]],'#c4cbd0','#67778c');
    poly([[645,426],[659,421],[673,427],[659,432]],'#26394e');
    for(let i=0;i<4;i++) line([[644+i*6,425],[656+i*5,430]],'#667a8b',1);
    for(let i=0;i<5;i++) line([[663,443+i*5],[677,437+i*5]],'#96a4af',1);
    rect(649,442,3,3,'#81c8d5');
    rect(647,452,2,2,'#71879c');
  }

  function drawCat(cat,time=0,scale=1,carried=false) {
    const x=Math.round(cat.x), y=Math.round(cat.y-(cat.jumpHeight||0));
    if (drawSpriteFrame(ctx,assets,cat.sourceId||'coco',x,y+10,{state:carried?'carry':cat.jump?'jump':cat.moving?'walk':'idle',direction:cat.direction||'down',time,scale})) return;
    ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
    if (cat.direction==='left') ctx.scale(-1,1);
    const step=cat.moving ? Math.sin((cat.tailPhase||time*8)*1.5) : 0;
    const blink=!carried && Math.sin(time*.8+(cat.sourceId==='bounty'?2:0))>.996;
    rect(-13,-10,26,18,'#9daec0');
    rect(-11,-13,24,19,'#dae3ea'); rect(-9,-12,20,14,'#f4f1eb');
    rect(-8,-17,18,14,'#e5eaf0'); rect(-7,-19,5,7,'#eef0ed'); rect(5,-19,5,7,'#eef0ed');
    rect(-5,-18,2,3,'#dbaeb4'); rect(6,-18,2,3,'#dbaeb4');
    rect(-10,4+Math.round(step),6,6,'#e7edf0'); rect(6,4-Math.round(step),6,6,'#e7edf0');
    rect(-4,6,4,3,'#b7c6d2'); rect(3,6,4,3,'#b7c6d2');
    rect(-8,-5,18,3,cat.collar||'#e6ca4b'); rect(1,-3,3,3,'#f2e6aa');
    rect(-5,-12,3,blink?1:3,'#7fbce6'); rect(4,-12,3,blink?1:3,'#7fbce6');
    if(!blink) { rect(-4,-11,1,2,'#182b41'); rect(5,-11,1,2,'#182b41'); }
    rect(0,-8,2,2,'#d895a6'); rect(-4,-7,3,1,'#bac5d0'); rect(4,-7,4,1,'#bac5d0');
    const tail=Math.round(Math.sin(cat.tailPhase||time*3)*2);
    rect(12,-2+tail,8,4,'#dbe7ec'); rect(17,-7+tail,5,6,'#edf0ec'); rect(18,-10+tail,3,4,'#edf0ec');
    ctx.restore();
  }
  function player(character,carriedCat,time=0) {
    const x=Math.round(character.x), y=Math.round(character.y);
    shadow(x,y+4,32,10);
    const bob=character.moving?Math.round(Math.sin(character.step*2)):0;
    const pose=carriedCat?'carry':character.moving?'walk':'idle';
    if (!drawSpriteFrame(ctx,assets,'dominik',x,y+8,{state:pose,direction:character.direction,time})) {
      ctx.save(); ctx.translate(x,y+bob);
      if(character.direction==='left') ctx.scale(-1,1);
      const stride=character.moving?Math.round(Math.sin(character.step)*3):0;
      rect(-9,-8,7,15+stride,'#2b3c58'); rect(3,-8,7,15-stride,'#344a68');
      rect(-10,5+stride,9,4,'#151d2c'); rect(3,5-stride,10,4,'#151d2c');
      rect(-12,-27,25,22,'#151e2e'); rect(-9,-26,19,17,'#26354a');
      rect(-12,-23,3,13,'#e8cc55'); rect(10,-23,3,13,'#e8cc55');
      rect(-7,-19,15,3,'#f0d25c'); rect(-6,-14,10,2,'#778aa4');
      rect(-15,-24,5,14,'#263449'); rect(12,-24,5,14,'#1a293d');
      rect(-15,-11,5,5,'#cfaa8b'); rect(12,-11,5,5,'#ddb599');
      rect(-8,-43,18,17,'#d3a586'); rect(-6,-41,15,13,'#e5b998');
      rect(-9,-46,20,8,'#45332e'); rect(-10,-42,5,10,'#3d2f2c');
      rect(-5,-48,12,3,'#574034'); rect(9,-40,3,7,'#b9836f');
      if(character.direction==='up') rect(-8,-43,17,11,'#45332e');
      else {
        rect(-4,-36,2,2,'#263447'); rect(5,-36,2,2,'#263447');
        rect(0,-31,5,1,'#b67f70'); rect(-5,-28,12,2,'#805c53');
      }
      if(carriedCat) { rect(-12,-20,5,8,'#ddb599'); rect(11,-22,5,9,'#ddb599'); }
      ctx.restore();
    }
    if (carriedCat) drawCat({...carriedCat,x:x+9,y:y-23,jumpHeight:0,moving:false,direction:'down'},time,.8,true);
  }
  function sleeping(time=0,includeDominik=true) {
    function sleepingHead(id,x,y,size) {
      const frame=assets.get(id)?.poseImages?.down?.image;
      if(!frame) return false;
      ctx.save();ctx.translate(x,y);ctx.rotate(-.34);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(frame,0,0,frame.width,Math.round(frame.height*.49),-size/2,-size,size,size);
      ctx.restore();return true;
    }
    sleepingHead('darina',346,343,29);
    if(!includeDominik) return;
    if(drawSpriteFrame(ctx,assets,'dominikSleep',315,379,{state:'sleep',time})) return;
    const rise=Math.sin(time*2)>0?1:0;
    if(sleepingHead('dominik',307,362+rise,28)) {
      ctx.save();ctx.font='12px monospace';ctx.fillStyle='#b6cadc';ctx.fillText('z',320,330-Math.floor(time%2)*3);ctx.restore();
      return;
    }
    poly([[302,350+rise],[318,344+rise],[333,362+rise],[316,370+rise]],'#d3ad93','#695765');
    poly([[300,350+rise],[314,344+rise],[318,348+rise],[303,355+rise]],'#49352f');
    poly([[319,367+rise],[336,360+rise],[367,399+rise],[350,406+rise]],'#283d59');
    line([[307,355+rise],[311,354+rise]],'#4b3a39',2);
    ctx.save(); ctx.font='bold 12px monospace'; ctx.fillStyle='#a4b9d2';
    ctx.fillText('z',321,328-Math.floor(time%2)*3); ctx.fillStyle='#637e9e';ctx.fillText('z',335,315-Math.floor(time%2)*3); ctx.restore();
  }
  function furniture(time=0) { rug(); bed(); nightstand(time); tvCabinet(); wardrobe(); chair(); airPurifier(time); }
  return { rug,bed,nightstand,wardrobe,tvCabinet,chair,airPurifier,player,cat:drawCat,sleeping,furniture,shadow,poly,line,candlePosition };
}
