export const PAPER_ACCESS_KEY='boco.paper-access.v1';
export const PAPER_SOLUTION='SIMPLE';
export function normalizePaperAnswer(value) {
  return String(value).toUpperCase().replace(/Ü/g,'UE').replace(/[^A-Z]/g,'');
}
export function checkPaperAnswer(value) {
  return ['SIMPLE','DERSCHLUESSELISTSIMPLE'].includes(normalizePaperAnswer(value));
}
export function safeSessionStorage(host=globalThis) {
  try {const storage=host.sessionStorage;storage.getItem(PAPER_ACCESS_KEY);return storage;}catch{}
  const memory=new Map();
  return {getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,String(value)),removeItem:key=>memory.delete(key)};
}
export function createPaperAccessController(panel,storage,{preview=false,onEnter=()=>{},onLock=()=>{}}={}) {
  let granted=preview;
  try {granted ||= storage.getItem(PAPER_ACCESS_KEY)==='SIMPLE'||storage.getItem(PAPER_ACCESS_KEY)==='true';}catch{}
  const input=panel.querySelector('#paper-key'),feedback=panel.querySelector('#paper-feedback'),form=panel.querySelector('form');
  function unlock(value,{persist=true}={}) {
    if(!checkPaperAnswer(value))return false;
    granted=true;
    if(persist&&!preview)try {storage.setItem(PAPER_ACCESS_KEY,PAPER_SOLUTION);}catch{}
    panel.hidden=true;onEnter(PAPER_SOLUTION);return true;
  }
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!unlock(input.value)){
      feedback.textContent='Fast! Trage das Schlüsselwort aus der letzten Zeile deiner Caesar-Nachricht ein. Groß- und Kleinschreibung sind egal.';
      input.setAttribute('aria-invalid','true');
    }else input.removeAttribute('aria-invalid');
  });
  function show(){
    panel.hidden=false;onLock();
    queueMicrotask(()=>{
      const heading=globalThis.matchMedia?.('(pointer: coarse)')?.matches?panel.querySelector('#paper-title'):null;
      (heading||input).focus({preventScroll:true});
    });
  }
  return {
    get granted(){return granted;},get key(){return granted?PAPER_SOLUTION:'';},
    start(){if(granted){panel.hidden=true;onEnter(PAPER_SOLUTION);}else show();},
    show,
    unlock,
    handleKeyDown(event){
      if(event.key!=='Tab')return;
      const focusable=[...panel.querySelectorAll('input,button,summary')].filter(e=>!e.disabled&&!e.closest('[hidden]'));
      const first=focusable[0],last=focusable.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }
  };
}
