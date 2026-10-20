import assert from 'node:assert/strict';
import { createMissionController, MISSION_KEY } from '../mission.js';
// Exercise the actual form handlers without requiring a browser download.
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.hidden=true;this.value='';}
 append(...items){this.children.push(...items)}
 replaceChildren(...items){this.children=items}
 setAttribute(){}
 addEventListener(name,handler){this.events[name]=handler}
 focus(){}
}
globalThis.document={createElement:tag=>new Element(tag)};
const panel=new Element('section');
const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
const controller=createMissionController(panel,storage);
controller.open();assert.equal(panel.children.length,0,'Finale must stay locked before cat mission');
controller.completeCats();assert.equal(panel.hidden,false);
function find(tag,root=panel){for(const item of root.children){if(item.tagName===tag)return item;const match=find(tag,item);if(match)return match;}}
function submit(answer){find('input').value=answer;find('form').events.submit({preventDefault(){}});}
submit('BOMBSITE B');assert.equal(controller.progress.location,false);
submit('Das Geschenk ist bei Bombsite A.');assert.equal(controller.progress.location,true);
submit('2626');assert.equal(controller.progress.complete,false);
submit('3427');assert.equal(controller.progress.complete,true);
assert.equal(find('h1').textContent,'MISSION COMPLETE');
const resumed=createMissionController(new Element('section'),storage);
assert.equal(resumed.progress.complete,true);assert.ok(data.get(MISSION_KEY));
console.log('Actual finale UI handlers: locked before win, wrong/correct answers, saved completion passed.');
