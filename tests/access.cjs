const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element{
 constructor(){this.events={};this.hidden=true;this.value='';this.attributes={};}
 addEventListener(name,fn){this.events[name]=fn;}
 setAttribute(k,v){this.attributes[k]=v;}
 removeAttribute(k){delete this.attributes[k];}
 focus(){}
}
function fixture(){
 const panel=new Element(),form=new Element(),input=new Element(),feedback=new Element();
 panel.querySelector=s=>s==='form'?form:s==='#paper-key'?input:feedback;
 panel.querySelectorAll=()=>[];return {panel,form,input,feedback};
}
(async()=>{
 const {createPaperAccessController,checkPaperAnswer,safeSessionStorage}=await import('../paper-access.js');
 for(const value of ['SIMPLE','simple',' S i m p l e ','Der Schlüssel ist SIMPLE.'])assert.ok(checkPaperAnswer(value));
 for(const value of ['BOCO','3427','SIMP','SIMPLEX',''])assert.equal(checkPaperAnswer(value),false);
 const index=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),code=index.match(/<script>([\s\S]*?)<\/script>/)[1];
 let destination;vm.runInNewContext(code,{location:{search:'?test=1',hash:'#a',replace:v=>destination=v}});
 assert.equal(destination,'./game.html?test=1#a','Root and direct URL must share the same one gate');
 let entered=0,locks=0;const memory=safeSessionStorage({}),f=fixture();
 const gate=createPaperAccessController(f.panel,memory,{onEnter:()=>entered++,onLock:()=>locks++});
 gate.start();assert.equal(f.panel.hidden,false);assert.equal(gate.granted,false);assert.equal(locks,1);
 f.input.value='BOCO';f.form.events.submit({preventDefault(){}});assert.equal(gate.granted,false);assert.match(f.feedback.textContent,/Schlüsselwort/);
 f.input.value='simple';f.form.events.submit({preventDefault(){}});assert.equal(gate.granted,true);assert.equal(f.panel.hidden,true);assert.equal(entered,1);
 const resumed=fixture(),again=createPaperAccessController(resumed.panel,memory,{onLock:()=>locks++});again.start();
 assert.equal(again.granted,true);assert.equal(resumed.panel.hidden,true);assert.equal(locks,1,'Do not ask for a second entry after reload');
 const preview=fixture(),organizer=createPaperAccessController(preview.panel,safeSessionStorage({}),{preview:true});organizer.start();assert.equal(preview.panel.hidden,true);
 const denied=fixture(),badStorage={getItem(){throw Error('storage disabled');},setItem(){throw Error('storage disabled');}};
 const transient=createPaperAccessController(denied.panel,badStorage);transient.start();assert.equal(transient.unlock('SIMPLE'),true);assert.equal(transient.granted,true);
 const main=fs.readFileSync(path.join(__dirname,'../main.js'),'utf8');assert.ok(main.includes('const IS_PREVIEW = false;'));
 assert.ok(main.includes('IS_PREVIEW?safeSessionStorage({}):safeSessionStorage(window)'),'Organizer preview must not overwrite real progress');
 console.log('Paper entry: agreed Caesar key, one shared gate, wrong answer, correct answer, session return, storage fallback and isolated organizer preview passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
