const assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const {createCanvas,Image,GlobalFonts}=require('@napi-rs/canvas');
for(const font of ['NimbusMonoPS-Regular.otf','NimbusMonoPS-Bold.otf']){const f='/usr/share/fonts/opentype/urw-base35/'+font;if(require('node:fs').existsSync(f))GlobalFonts.registerFromPath(f,'Courier New');}
const root=path.resolve(__dirname,'..');
const all=e=>[e,...(e.children||[]).flatMap(all)];
function matches(e,selector){
  if(selector.startsWith('#'))return e.id===selector.slice(1);
  if(selector.startsWith('.'))return e.className?.split(' ').includes(selector.slice(1));
  if(selector==='[hidden]')return e.hidden;
  const attr=selector.match(/^\[data-([^\]]+)\]$/);if(attr)return e.dataset?.[attr[1].replace(/-([a-z])/g,(_,x)=>x.toUpperCase())]!==undefined;
  return selector.split(',').map(x=>x.trim()).includes(e.tagName);
}
class Element{
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attributes={};this.dataset={};this.hidden=false;this.value='';}
 append(...items){for(const item of items){item.parentElement=this;this.children.push(item);}}
 replaceChildren(...items){this.children=[];this.append(...items);}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
 focus(){}
 querySelector(s){return all(this).find(e=>matches(e,s));}
 querySelectorAll(s){return all(this).filter(e=>matches(e,s));}
 closest(s){let e=this;while(e){if(matches(e,s))return e;e=e.parentElement;}return null;}
}
function nativeCanvas(w=300,h=150){
 const c=createCanvas(w,h);Object.assign(c,{tagName:'canvas',children:[],events:{},attributes:{},dataset:{}});
 for(const name of ['addEventListener','setAttribute','focus','closest'])c[name]=Element.prototype[name];
 c.getBoundingClientRect=()=>({left:0,top:0,width:c.width,height:c.height});return c;
}
function fixture(){
 const body=new Element('body'),shell=new Element('main');shell.className='game-shell';body.append(shell);
 const create=(tag,id,parent=body)=>{const e=tag==='canvas'?nativeCanvas():new Element(tag);e.id=id;if(parent)parent.append(e);return e;};
 const canvas=create('canvas','gameCanvas',shell);canvas.width=960;canvas.height=640;
 const panel=create('section','mission-panel'),paper=create('section','paper-entry');panel.hidden=paper.hidden=true;
 const entryArt=create('canvas','entry-art',paper);entryArt.width=720;entryArt.height=480;
 const paperForm=create('form','paper-form',paper);create('input','paper-key',paperForm);create('button','paper-submit',paperForm);create('p','paper-feedback',paperForm);
 const dock=create('aside','world-dock',shell);dock.hidden=true;
 for(const id of ['world-focus-title','world-focus-description','world-open','world-overview','world-zoom-value'])create(id.startsWith('world-o')?'button':'span',id,dock);
 for(const value of ['-.2','.2'])create('button','zoom'+value,dock).dataset.mapZoom=value;
 create('button','world-return',shell);create('p','game-status');const tools=create('nav','preview-tools');tools.hidden=true;
 for(const value of ['map','cats','final','birthday','future','entry'])create('button','preview-'+value,tools).dataset.preview=value;
 const document={body,hidden:false,createElement:t=>t==='canvas'?nativeCanvas():new Element(t),getElementById:id=>all(body).find(e=>e.id===id),querySelector:s=>all(body).find(e=>matches(e,s)),querySelectorAll:s=>all(body).filter(e=>matches(e,s)),addEventListener(){}};
 canvas.ownerDocument=document;
 class LocalImage extends Image{addEventListener(k,fn){this['on'+k]=fn;}set src(v){if(typeof v==='string'&&!v.startsWith('data:'))v=path.join(root,new URL(v,'http://boco/').pathname);super.src=v;}get src(){return super.src;}}
 const memory=new Map(),context=vm.createContext({document,Image:LocalImage,console,URL,performance,location:{href:'http://boco/game.html'},requestAnimationFrame(){},queueMicrotask,sessionStorage:{getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)},fetch:async u=>({ok:true,json:async()=>JSON.parse(await fs.readFile(path.join(root,new URL(u,'http://boco/').pathname),'utf8'))})});
 context.window=context;context.events={};context.addEventListener=Element.prototype.addEventListener;
 return {document,canvas,panel,paper,shell,context,memory,byId:document.getElementById,byClass:s=>all(panel).find(e=>matches(e,'.'+s))};
}
function fire(e,name,event={}){for(const fn of e.events[name]||[])fn({preventDefault(){},...event});}
async function boot(preview){
 const f=fixture(),html=await fs.readFile(path.join(root,'BOCO_PREVIEW.html'),'utf8');
 let script=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];if(!preview)script=script.replace('const IS_PREVIEW = true;','const IS_PREVIEW = false;');
 script=script.replace(/start\(\);\s*$/,'globalThis.__ready=start();');
 script+='\nglobalThis.__test={get level(){return catIsland},get state(){return gameState},key:dispatchKeyAction,focus:focusIsland,travel:beginIslandTransition,activate:activateIsland,render:gameLoop,mission,paperAccess,camera};';
 vm.runInContext('Math.random=(()=>{let s=17;return()=>((s=(s*1664525+1013904223)>>>0)/4294967296)})()',f.context);
 new vm.Script(script,{filename:'BOCO_PREVIEW.html'}).runInContext(f.context);await f.context.__ready;f.app=f.context.__test;return f;
}
function advance(app,start,frames=48){for(let i=0;i<frames;i++)app.render(start+i*1000/60);}
async function drive(level,stopOnCarry=false){
 const step=12,cells=[];for(let y=0;y<640;y+=step)for(let x=0;x<960;x+=step)if(level.canPlayerStand(x,y))cells.push({x,y,id:`${x},${y}`});
 const byId=new Map(cells.map(p=>[p.id,p])),distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function route(player,target){const start=cells.reduce((a,b)=>distance(a,player)<distance(b,player)?a:b),q=[start],parents=new Map([[start.id,null]]);let end;
  for(let i=0;i<q.length;i++){const p=q[i];if(distance(p,target)<12){end=p;break;}for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const id=`${p.x+dx},${p.y+dy}`;if(byId.has(id)&&!parents.has(id)){parents.set(id,p);q.push(byId.get(id));}}}
  const result=[];while(end){result.unshift(end);end=parents.get(end.id);}return result;}
 let points=[];
 for(let i=0;i<18000;i++){const s=level.getSnapshot();assert.ok(s.catsInsideBounds&&s.catsOutsideFurniture);
  if(s.phase==='win'||(stopOnCarry&&s.carrying))return s;
  const target=s.carrying?{x:145,y:350}:s.activeCats.reduce((a,b)=>!a||distance(b,s.player)<distance(a,s.player)?b:a,null),keys=new Set(['e']);let dt=1/30;
  if(target){if(i%9===0||!points.length)points=route(s.player,target);while(points.length&&distance(points[0],s.player)<1)points.shift();const n=points[0]||target,dx=n.x-s.player.x,dy=n.y-s.player.y;
   if(Math.abs(dx)>.5){keys.add(dx>0?'d':'a');dt=Math.min(dt,Math.abs(dx)/(168*(s.carrying?.84:1)));}else if(Math.abs(dy)>.5){keys.add(dy>0?'s':'w');dt=Math.min(dt,Math.abs(dy)/(168*(s.carrying?.84:1)));}}
  level.update(dt,keys);}
 throw new Error('Cat route failed: '+JSON.stringify(level.getSnapshot()));
}
(async()=>{
 const f=await boot(false),{app,byId,byClass}=f,destination=path.join(root,'docs/previews');await fs.mkdir(destination,{recursive:true});
 assert.ok(app.level);assert.equal(f.paper.hidden,false);assert.equal(app.paperAccess.granted,false);assert.equal(f.shell.inert,true);
 app.activate(0);assert.equal(app.state.scene,'map','Direct actions cannot bypass paper entry');
 app.render(1000);await fs.writeFile(path.join(destination,'entry.png'),byId('entry-art').toBuffer('image/png'));
 byId('paper-key').value='BOCO';fire(byId('paper-form'),'submit');assert.equal(f.paper.hidden,false);
 byId('paper-key').value='SIMPLE';fire(byId('paper-form'),'submit');assert.equal(f.paper.hidden,true);assert.equal(f.shell.inert,false);assert.equal(f.memory.get('boco.paper-access.v1'),'SIMPLE');
 app.render(2000);await fs.writeFile(path.join(destination,'world.png'),f.canvas.toBuffer('image/png'));
 app.focus(0);advance(app,2100,100);assert.ok(app.camera.zoom>1.6);await fs.writeFile(path.join(destination,'island-zoom.png'),f.canvas.toBuffer('image/png'));
 const point=app.camera.worldToScreen({x:388,y:250});fire(f.canvas,'pointerdown',{clientX:point.x,clientY:point.y,pointerId:1});fire(f.canvas,'pointerup',{clientX:point.x,clientY:point.y,pointerId:1});advance(app,3900);
 assert.equal(app.state.scene,'catIsland');app.key('enter');assert.equal(app.level.getSnapshot().phase,'chase');
 await drive(app.level,true);app.level.draw(5000);await fs.mkdir(path.join(root,'test-artifacts'),{recursive:true});await fs.writeFile(path.join(root,'test-artifacts/carrying.png'),f.canvas.toBuffer('image/png'));
 assert.equal((await drive(app.level)).catsDelivered,3);assert.equal(app.state.catIslandCompleted,true);assert.equal(f.panel.hidden,true);
 app.key('enter');app.render(6000);assert.equal(app.state.scene,'map');app.key('enter');advance(app,6100);assert.equal(app.state.scene,'finaleIsland');
 assert.equal(byId('vigenere-key').value,'SIMPLE','Reuse the paper key instead of requesting it twice');fire(byClass('decode-actions').children[0],'click');
 for(let i=0;i<30;i++)app.render(7200+i*150);
 assert.equal(byClass('decoded-output').textContent,'DAS GESCHENK IST BEI BOMBSITE A');fire(byClass('discover-gift'),'click');app.render(12500);
 assert.equal(app.state.finaleCompleted,true);assert.equal(byId('finale-title').textContent,'Dein PC wartet auf dich!');await fs.writeFile(path.join(destination,'birthday-island.png'),byClass('finale-art').toBuffer('image/png'));
 app.mission.close();app.travel(2);advance(app,13000);assert.equal(app.state.scene,'futureIsland');app.render(14000);await fs.writeFile(path.join(destination,'future-island.png'),f.canvas.toBuffer('image/png'));
 app.key('escape');assert.equal(app.state.scene,'map');assert.equal(f.shell.inert,false);
 const preview=await boot(true);assert.equal(preview.paper.hidden,true);assert.equal(preview.byId('preview-tools').hidden,false);assert.equal(preview.memory.size,0);
 fire(preview.byId('preview-birthday'),'click');preview.app.render(1000);assert.equal(preview.byId('finale-title').textContent,'Dein PC wartet auf dich!');assert.equal(preview.memory.size,0,'Owner preview must not change real browser progress');
 fire(preview.byId('preview-final'),'click');assert.equal(preview.byId('finale-title').textContent,'Eine Nachricht für dich.','Puzzle preview must work again after the birthday preview');
 fire(preview.byId('preview-cats'),'click');assert.equal(preview.app.state.catIslandCompleted,false);assert.equal(preview.app.level.getSnapshot().phase,'intro');
 fire(preview.byId('preview-entry'),'click');assert.equal(preview.paper.hidden,false);fire(preview.byId('preview-map'),'click');assert.equal(preview.paper.hidden,true);assert.equal(preview.app.state.scene,'map');
 console.log('Canvas integration passed: one paper entry → zoomed island hit-test → cats → map flight → reused key / Vigenère → PC greeting → detailed future visit; organizer scene previews remain separate. No browser/CSS/Safari coverage claimed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
