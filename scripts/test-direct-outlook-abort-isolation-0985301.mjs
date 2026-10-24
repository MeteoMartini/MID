import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContext,runInContext} from 'node:vm';

// Test the generated direct-fetch PRELUDE/Epilogue from the canonical generator,
// not a manually maintained imitation of its AbortSignal logic.
const source=readFileSync('scripts/build-maintenance-aggregates.mjs','utf8');
const tick=String.fromCharCode(96);
const a=source.indexOf('const directPrelude='+tick);
const b=source.indexOf(tick+';\nconst directEpilogue=',a);
const c=source.indexOf('const directEpilogue='+tick,b);
const d=source.indexOf(tick+';\nconst cacheDeclaration=',c);
assert.ok(a>=0&&b>a&&c>b&&d>c,'Direct module generator changed: fail closed');
const prelude=source.slice(a+('const directPrelude='+tick).length,b);
const epilogue=source.slice(c+('const directEpilogue='+tick).length,d);
assert.match(prelude,/function createDirectOutlookContext\(signal\)/);
assert.doesNotMatch(prelude+epilogue,/directRequestSignal/);
const start=prelude.replace(/^import .*;\s*$/gm,'');
const body=[
 'async function dachExtremeOutlookData(){',
 " await fetchWithDeadline('https://example.invalid/normal/first');",
 " await gate.wait('normal');",
 " await fetchWithDeadline('https://example.invalid/normal/second');",
 " return {scope:'normal'};",
 '}',
 'async function dachExtendedExtremeOutlookData(){',
 " await fetchWithDeadline('https://example.invalid/extended/first');",
 " await gate.wait('extended');",
 " await fetchWithDeadline('https://example.invalid/extended/second');",
 " return {scope:'extended'};",
 '}'
].join('\n');
const code=start+'\n'+body+'\n'+epilogue.replace(/export async function/g,'async function')+
 '\nglobalThis.directApi={loadDirectDachExtremeOutlook,loadDirectDachExtendedExtremeOutlook};';
const version=JSON.parse(readFileSync('package.json','utf8')).version;

function newHarness(abortedKind,with429=false){
 const controllers={normal:new AbortController(),extended:new AbortController()};
 const starts=new Map(),releases=new Map(),calls=[],activeTimers=new Set(),activeListeners=new Set();
 const setTracked=(fn,ms)=>{const handle=setTimeout(fn,ms);activeTimers.add(handle);return handle};
 const clearTracked=handle=>{activeTimers.delete(handle);clearTimeout(handle)};
 for(const controller of Object.values(controllers)){
  const signal=controller.signal;
  const add=signal.addEventListener.bind(signal),remove=signal.removeEventListener.bind(signal);
  signal.addEventListener=(type,listener,opts)=>{
   if(type==='abort')activeListeners.add(listener);
   return add(type,listener,opts);
  };
  signal.removeEventListener=(type,listener,opts)=>{
   if(type==='abort')activeListeners.delete(listener);
   return remove(type,listener,opts);
  };
 }
 const gate={wait:kind=>new Promise(resolve=>{releases.set(kind,resolve);starts.get(kind)?.()})};
 const ready=Promise.all(['normal','extended'].map(kind=>new Promise(resolve=>starts.set(kind,resolve))));
 const guardedOpenMeteoFetch=async(url,init,policy)=>{
  const [,kind,step]=new URL(url).pathname.split('/');
  calls.push({kind,step,aborted:init.signal.aborted});
  assert.equal(policy?.maxRetries,0,'Direct fetch retry contract must remain 0');
  if(init.signal.aborted)throw new DOMException('Aborted','AbortError');
  if(with429&&step==='second'&&kind!==abortedKind){
   const error=new Error('Synthetic HTTP 429');error.status=429;throw error;
  }
  return {ok:true,status:200};
 };
 const context=createContext({AbortController,DOMException,Headers,URL,MID_VERSION:version,
  setTimeout:setTracked,clearTimeout:clearTracked,guardedOpenMeteoFetch,gate});
 runInContext(code,context,{timeout:3000});
 return {controllers,ready,releases,calls,activeTimers,activeListeners,api:context.directApi};
}
async function testConcurrent(abortedKind,with429=false){
 const h=newHarness(abortedKind,with429);
 const normal=h.api.loadDirectDachExtremeOutlook(h.controllers.normal.signal);
 const extended=h.api.loadDirectDachExtendedExtremeOutlook(h.controllers.extended.signal);
 const results=Promise.allSettled([normal,extended]);
 await h.ready;
 h.controllers[abortedKind].abort(new DOMException('Navigation','AbortError'));
 h.releases.get('normal')();h.releases.get('extended')();
 const [n,e]=await results;const outcome={normal:n,extended:e};
 const survivor=abortedKind==='normal'?'extended':'normal';
 assert.equal(outcome[abortedKind].status,'rejected');
 assert.equal(outcome[abortedKind].reason?.name,'AbortError');
 if(with429){
  assert.equal(outcome[survivor].status,'rejected');
  assert.equal(outcome[survivor].reason?.status,429,'Unrelated 429 must retain identity');
 }else assert.equal(outcome[survivor].status,'fulfilled');
 assert.equal(h.calls.filter(x=>x.kind===abortedKind&&x.step==='second').length,0,
  'Cancelled request MUST NOT invoke follow-up provider call');
 assert.equal(h.calls.filter(x=>x.kind===survivor&&x.step==='second').length,1);
 assert.equal(h.calls.length,3);
 assert.ok(h.calls.every(x=>!x.aborted));
 assert.equal(h.activeTimers.size,0,'Timeout leak');
 assert.equal(h.activeListeners.size,0,'Parent AbortSignal listener leak');
}
async function testAlreadyAborted(kind){
 const controller=new AbortController();controller.abort(new DOMException('Navigation','AbortError'));
 let attempts=0;const timers=new Set();
 const setTracked=(fn,ms)=>{const h=setTimeout(fn,ms);timers.add(h);return h};
 const clearTracked=h=>{timers.delete(h);clearTimeout(h)};
 const context=createContext({AbortController,DOMException,Headers,URL,MID_VERSION:version,
  setTimeout:setTracked,clearTimeout:clearTracked,
  guardedOpenMeteoFetch:async()=>{attempts++;return {ok:true}},
  gate:{wait:()=>Promise.resolve()}});
 runInContext(code,context,{timeout:3000});
 const method=kind==='normal'?'loadDirectDachExtremeOutlook':'loadDirectDachExtendedExtremeOutlook';
 await assert.rejects(context.directApi[method](controller.signal),err=>err?.name==='AbortError');
 assert.equal(attempts,0,'Pre-aborted request must not invoke provider');
 assert.equal(timers.size,0,'Pre-aborted timer leak');
}
for(const kind of ['normal','extended']){
 await testConcurrent(kind,false);
 await testAlreadyAborted(kind);
 await testConcurrent(kind,true);
}
console.log('MID #345: six direct-fetch AbortSignal/429 isolation cases passed.');
