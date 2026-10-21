import { drawFinaleIsland } from './finale-island.js?v=1.7.0';

export const FINAL_CIPHER = 'VIE VPWUPQCV MKB NTT FGUNHTXW I';
// Kept for the existing printed material; no second code-entry gate in this game.
export const FINAL_BINARY = '00110011 00110100 00110010 00110111';
export const MISSION_KEY = 'boco.mission.v1';
export const ACCESS_KEY = 'boco.paper-access.v1';
export const BIRTHDAY_TITLE = 'Dein PC wartet auf dich!';
export const BIRTHDAY_MESSAGE = 'Du bist mein Lieblingsmensch und mein liebster Teammate – nicht nur für eine Runde, sondern für alles, was noch kommt. Danke, dass ich mit dir lachen, Quatsch machen und einfach ich sein kann. Selbst ein ganz normaler Tag ist mit dir schöner.\n\nHeute bist du unser Birthday-MVP. Dein neuer PC wartet auf dich – für neue Clutches, schöne Abende und ganz viele „nur noch eine Runde“. Und ich bin am liebsten weiter an deiner Seite.\n\nIch liebe dich. So, so sehr. ♥';

export function normalizeAnswer(value) { return String(value).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
export function checkLocation(value) { return ['BOMBSITEA','DASGESCHENKISTBEIBOMBSITEA'].includes(normalizeAnswer(value)); }
export function checkCaseCode(value) { return String(value).replace(/\s/g,'')==='3427'; }
export function vigenereSteps(cipher, key) {
  const letters=normalizeAnswer(key).replace(/[^A-Z]/g,'');
  if(!letters)throw new Error('Missing key');
  let i=0;
  return [...cipher.toUpperCase()].map(char=>{
    if(!/[A-Z]/.test(char))return {char,space:true};
    const keyLetter=letters[i++%letters.length];
    const shift=keyLetter.charCodeAt(0)-65, plain=String.fromCharCode(65+(char.charCodeAt(0)-65-shift+26)%26);
    return {char,key:keyLetter,shift,plain,index:i-1};
  });
}
export function decodeVigenere(cipher,key) { return vigenereSteps(cipher,key).map(s=>s.space?s.char:s.plain).join(''); }
export function readProgress(storage) {
  try {
    const data=JSON.parse(storage.getItem(MISSION_KEY)||'{}');
    const cats=data.cats===true,location=cats&&data.location===true;
    return {cats,location,complete:location&&data.complete===true};
  } catch {return {cats:false,location:false,complete:false};}
}

export function createMissionController(panel,storage,{onClose=()=>{},onComplete=()=>{}}={}) {
  const progress=readProgress(storage);
  let hero,heroCtx,refs={},workingKey='',revealed=0,selected=0,running=false,nextAt=0,toolSteps=[];
  const make=(tag,className='',text='')=>{const e=document.createElement(tag);e.className=className;if(text)e.textContent=text;return e;};
  const appendText=(parent,tag,className,text)=>{const e=make(tag,className,text);parent.append(e);return e;};
  const save=()=>{try{storage.setItem(MISSION_KEY,JSON.stringify(progress));}catch{}};
  function close(){running=false;panel.hidden=true;onClose();}
  function finish(){
    if(!progress.cats||progress.complete)return;
    progress.location=true;progress.complete=true;running=false;save();render();onComplete();
  }
  function revealOne(){
    if(!toolSteps.length||revealed>=toolSteps.length)return;
    selected=revealed;revealed++;paintTool();
  }
  function paintTool(){
    if(!refs.tiles)return;
    refs.tool.hidden=!workingKey;
    toolSteps=vigenereSteps(FINAL_CIPHER,workingKey||'SIMPLE').filter(s=>!s.space);
    refs.tiles.forEach((tile,i)=>{
      const step=toolSteps[i];tile.key.textContent=workingKey?step.key:'·';tile.plain.textContent=i<revealed?step.plain:'?';
      tile.button.className='cipher-tile'+(i<revealed?' is-revealed':'')+(i===selected?' is-selected':'');
      tile.button.setAttribute('aria-label',`Zeichen ${i+1}: Geheimtext ${step.char}${workingKey?', Schlüssel '+step.key:''}${i<revealed?', Klartext '+step.plain:''}`);
    });
    const current=toolSteps[Math.min(selected,toolSteps.length-1)];
    refs.cipher.textContent=current.char;refs.key.textContent=current.key;refs.plain.textContent=revealed>selected?current.plain:'?';
    refs.demo.textContent=`Zeile ${current.key}: Suche ${current.char}. Lies darüber den Klartextbuchstaben.`;
    refs.alphabet.replaceChildren();
    const center=current.plain.charCodeAt(0)-65;
    for(let offset=-4;offset<=4;offset++){
      const n=(center+offset+26)%26,cell=make('span','alphabet-cell'+(offset===0?' is-target':''));
      cell.append(make('b','',String.fromCharCode(65+n)),make('span','',String.fromCharCode(65+(n+current.shift)%26)));refs.alphabet.append(cell);
    }
    refs.count.textContent=`${revealed} / ${toolSteps.length} Zeichen`;
    refs.run.textContent=running?'PAUSE':'NACHRICHT ENTSCHLÜSSELN';
    refs.run.disabled=refs.step.disabled=revealed===toolSteps.length;
    refs.discover.hidden=revealed!==toolSteps.length;
    refs.output.textContent=vigenereSteps(FINAL_CIPHER,workingKey||'SIMPLE').map(s=>s.space?s.char:s.index<revealed?s.plain:'·').join('');
  }
  function render(){
    panel.replaceChildren();refs={};panel.className='mission-panel'+(progress.complete?' is-celebration':'');
    const toolbar=make('div','finale-toolbar');
    toolbar.append(make('span','finale-brand','TEAM BOCO // 21.10.2026'));
    const back=make('button','finale-back','← WELTKARTE');back.type='button';back.addEventListener('click',close);toolbar.append(back);panel.append(toolbar);
    const layout=make('div','finale-layout');panel.append(layout);
    const scene=make('div','finale-scene');layout.append(scene);
    appendText(scene,'p','finale-eyebrow',progress.complete?'MISSION COMPLETE // FÜR DOMINIK':'02 // DIE LETZTE INSEL');
    hero=make('canvas','finale-art');hero.width=720;hero.height=480;
    hero.setAttribute('aria-label',progress.complete?'Dominik, Darina, Coco und Bounty bei einem neuen Gaming-PC auf einer Pixelinsel':'Pixelinsel mit einem verschlossenen Geschenk und einem leuchtenden Buchstabentor');
    heroCtx=hero.getContext('2d');scene.append(hero);
    appendText(scene,'p','finale-scene-caption',progress.complete?'MY FAVOURITE TEAMMATE. MY MVP. ♥':'BOCO // FINAL ROUND · ONE LAST CLUTCH');
    const bench=make('div','cipher-workbench');layout.append(bench);
    const title=appendText(bench,'h1','',progress.complete?BIRTHDAY_TITLE:'Eine Nachricht für dich.');title.tabIndex=-1;
    panel.setAttribute('aria-labelledby','finale-title');title.id='finale-title';
    if(progress.complete){
      appendText(bench,'p','birthday-address','Alles Gute zum Geburtstag, mein Sonnenschein!');
      appendText(bench,'p','birthday-message',BIRTHDAY_MESSAGE);
      appendText(bench,'p','birthday-signature','Deine Darina ♥\nund zwei flauschige Support-Spieler: Coco & Bounty');
      appendText(bench,'p','gift-location','DEIN GESCHENK WARTET BEI BOMBSITE A.');
      const details=make('details','gift-code');details.append(make('summary','','Koffer-Code anzeigen'),make('p','mission-code','3427'));bench.append(details);
      const again=make('button','finale-primary','ZURÜCK ZU UNSEREN INSELN');again.type='button';again.addEventListener('click',close);bench.append(again);
      queueMicrotask(()=>title.focus());return;
    }
    appendText(bench,'p','finale-intro','Coco und Bounty sind versorgt. Jetzt wartet nur noch eine verschlüsselte Nachricht auf dich. Sie verrät dir, wo dein Geschenk ist.');
    const keyForm=make('form','key-form'),keyLabel=make('label','','Schlüssel aus dem Papier-Rätsel');keyLabel.htmlFor='vigenere-key';
    const keyRow=make('div','key-row'),keyInput=make('input');keyInput.id='vigenere-key';keyInput.autocomplete='off';keyInput.spellcheck=false;keyInput.maxLength=20;keyInput.placeholder='DEIN SCHLÜSSEL';keyInput.value=workingKey;
    const keySubmit=make('button','finale-secondary','EINSETZEN');keySubmit.type='submit';keyRow.append(keyInput,keySubmit);
    const feedback=make('p','finale-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');keyForm.append(keyLabel,keyRow,feedback);bench.append(keyForm);
    const cipherBox=make('div','cipher-box');cipherBox.append(make('p','cipher-label','GEHEIMTEXT / SCHLÜSSEL / KLARTEXT'));
    const words=make('div','cipher-words');cipherBox.append(words);bench.append(cipherBox);refs.tiles=[];
    let letter=0;
    for(const word of FINAL_CIPHER.split(' ')){
      const group=make('span','cipher-word');words.append(group);
      for(const char of word){
        const index=letter++,button=make('button','cipher-tile');button.type='button';
        const key=make('small'),plain=make('b');button.append(make('span','',char),key,plain);group.append(button);refs.tiles.push({button,key,plain});
        button.addEventListener('click',()=>{selected=index;paintTool();});
      }
    }
    const tool=make('div','vigenere-tool');refs.tool=tool;bench.append(tool);
    const equation=make('div','vigenere-equation');
    for(const [id,label] of [['cipher','GEHEIM'],['key','SCHLÜSSEL'],['plain','KLAR']]){
      const block=make('span','equation-part');block.append(make('small','',label));refs[id]=make('b');block.append(refs[id]);equation.append(block);
      if(id!=='plain')equation.append(make('span','equation-symbol',id==='cipher'?'−':'='));
    }
    tool.append(equation);refs.demo=make('p','vigenere-explanation');refs.alphabet=make('div','alphabet-strip');tool.append(refs.demo,refs.alphabet);
    const actions=make('div','decode-actions');refs.run=make('button','finale-primary','NACHRICHT ENTSCHLÜSSELN');refs.run.type='button';
    refs.step=make('button','finale-secondary','+1 ZEICHEN');refs.step.type='button';refs.count=make('span','decode-count');actions.append(refs.run,refs.step,refs.count);tool.append(actions);
    refs.output=make('p','decoded-output');refs.output.setAttribute('aria-live','off');tool.append(refs.output);
    refs.discover=make('button','finale-primary discover-gift','GESCHENK ENTDECKEN ♥');refs.discover.type='button';refs.discover.addEventListener('click',finish);tool.append(refs.discover);
    refs.run.addEventListener('click',()=>{running=!running;nextAt=0;paintTool();});
    refs.step.addEventListener('click',()=>{running=false;revealOne();});
    keyForm.addEventListener('submit',event=>{
      event.preventDefault();const key=normalizeAnswer(keyInput.value);
      if(key!=='SIMPLE'){feedback.textContent='Schau noch einmal auf das Caesar-Rätsel. Sein Schlüsselwort hat sechs Buchstaben.';return;}
      workingKey=key;feedback.textContent='Schlüssel passt. Schau zu, wie die Buchstaben ihren Platz finden.';paintTool();
    });
    const answerForm=make('form','answer-form');
    const answerLabel=make('label','','Schon selbst gelöst? Gib den Geschenk-Ort ein.');answerLabel.htmlFor='mission-answer';
    const answer=make('input');answer.id='mission-answer';answer.autocomplete='off';answer.spellcheck=false;answer.maxLength=80;answer.required=true;answer.placeholder='WO WARTET DAS GESCHENK?';
    const submit=make('button','finale-secondary','ORT BESTÄTIGEN');submit.type='submit';const answerFeedback=make('p','finale-feedback');answerFeedback.setAttribute('role','status');answerForm.append(answerLabel,answer,submit,answerFeedback);bench.append(answerForm);
    answerForm.addEventListener('submit',event=>{event.preventDefault();if(checkLocation(answer.value))finish();else answerFeedback.textContent='Noch nicht ganz. Entschlüssle die Nachricht mit dem Schlüssel aus deinem Papier-Rätsel.';});
    const hint=make('details','finale-hint');hint.append(make('summary','','Hilfe, falls du festhängst'),make('p','','Der Schlüssel aus dem Caesar-Rätsel lautet SIMPLE. Trage ihn oben ein. Die zwei Alphabetzeilen zeigen dir für jeden Buchstaben, wie Vigenère funktioniert. Du kannst die Nachricht auch mit deiner gedruckten Tabelle lösen.'));bench.append(hint);
    paintTool();queueMicrotask(()=>title.focus());
  }
  return {
    progress,
    usePaperKey(key){if(normalizeAnswer(key)==='SIMPLE')workingKey='SIMPLE';},
    resetPreview(){progress.cats=false;progress.location=false;progress.complete=false;workingKey='SIMPLE';revealed=0;selected=0;running=false;panel.hidden=true;},
    previewPuzzle(){this.resetPreview();progress.cats=true;panel.hidden=false;render();},
    previewBirthday(){progress.cats=true;progress.location=true;progress.complete=true;panel.hidden=false;render();},
    recordCats(){progress.cats=true;save();},
    open(){if(!progress.cats)return false;panel.hidden=false;render();return true;},
    close,
    completeCats(){this.recordCats();this.open();},
    handleKeyDown(key){if(key==='escape')close();},
    draw(timestamp,assets){
      if(panel.hidden)return;
      if(running&&timestamp>=nextAt){revealOne();nextAt=timestamp+135;if(revealed===toolSteps.length){running=false;paintTool();}}
      if(heroCtx)drawFinaleIsland(heroCtx,timestamp,assets,{complete:progress.complete,background:true});
    }
  };
}
