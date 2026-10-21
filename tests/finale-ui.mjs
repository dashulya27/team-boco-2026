import assert from 'node:assert/strict';
import { createMissionController, MISSION_KEY, FINAL_CIPHER, BIRTHDAY_TITLE } from '../mission.js';

// Exercise the shipped DOM handlers, including the decoder animation, without a browser.
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.events={};this.hidden=false;this.value='';this.attributes={};}
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  setAttribute(name,value){this.attributes[name]=value;}
  addEventListener(name,handler){this.events[name]=handler;}
  getContext(){return null;}
  focus(){}
}
globalThis.document={createElement:tag=>new Element(tag)};
function find(predicate,root){if(predicate(root))return root;for(const child of root.children){const match=find(predicate,child);if(match)return match;}}
const panel=new Element('section');panel.hidden=true;
const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
let wins=0,closes=0;
const controller=createMissionController(panel,storage,{onComplete:()=>wins++,onClose:()=>closes++});
const byId=id=>find(e=>e.id===id,panel);
const byClass=name=>find(e=>e.className?.split(' ').includes(name),panel);
function submit(className){byClass(className).events.submit({preventDefault(){}});}
assert.equal(controller.open(),false,'Final island requires the one cat mission, not an entry password');
assert.equal(panel.children.length,0);
controller.recordCats();assert.equal(panel.hidden,true,'Cat win must not skip the world map');
assert.equal(controller.open(),true);assert.equal(panel.hidden,false);
assert.equal(byId('finale-title').textContent,'Eine Nachricht für dich.');
assert.equal(byClass('discover-gift').hidden,true);
byId('mission-answer').value='BOMBSITE B';submit('answer-form');
assert.equal(controller.progress.complete,false);
byId('vigenere-key').value='BOCO';submit('key-form');assert.equal(byClass('vigenere-tool').hidden,true);
byId('vigenere-key').value='s i m p l e';submit('key-form');assert.equal(byClass('vigenere-tool').hidden,false);
byClass('decode-actions').children[0].events.click();
for(let i=0;i<FINAL_CIPHER.replaceAll(' ','').length;i++)controller.draw(i*150,new Map());
assert.equal(byClass('decoded-output').textContent,'DAS GESCHENK IST BEI BOMBSITE A');
assert.equal(byClass('discover-gift').hidden,false);
const oldDiscover=byClass('discover-gift');oldDiscover.events.click();oldDiscover.events.click();
assert.equal(controller.progress.complete,true);assert.equal(controller.progress.location,true);assert.equal(wins,1);
assert.equal(byId('finale-title').textContent,BIRTHDAY_TITLE);
assert.equal(byId('mission-answer'),undefined,'No binary/code form may gate the birthday reveal');
assert.match(byClass('birthday-message').textContent,/Ich liebe dich/);
assert.match(byClass('birthday-message').textContent,/Teammate/);
controller.handleKeyDown('escape');assert.equal(panel.hidden,true);assert.equal(closes,1);
controller.open();assert.equal(byId('finale-title').textContent,BIRTHDAY_TITLE);
const resumed=createMissionController(new Element('section'),storage);assert.equal(resumed.progress.complete,true);assert.ok(data.get(MISSION_KEY));

// A player who decoded the printed sheet can directly enter the correct place.
const manualPanel=new Element('section');
const manual=createMissionController(manualPanel,{getItem:()=>JSON.stringify({cats:true}),setItem(){}});manual.open();
find(e=>e.id==='mission-answer',manualPanel).value='Das Geschenk ist bei Bombsite A.';
find(e=>e.className==='answer-form',manualPanel).events.submit({preventDefault(){}});
assert.equal(manual.progress.complete,true);
console.log('Final island handlers: one cat prerequisite, wrong/correct key, animated Vigenère, manual solution, one reveal callback, German PC greeting, close/reopen/save; no extra code gate.');
