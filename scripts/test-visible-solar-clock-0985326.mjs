import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir=mkdtempSync(join(tmpdir(),'mid-visible-solar-'));
const originalDocument=globalThis.document,originalWindow=globalThis.window;
try{
 await build({entryPoints:['src/visibleSolarClock.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'clock.mjs')});
 const {startVisibleSolarClock}=await import(pathToFileURL(join(dir,'clock.mjs')).href);
 const documentListeners=new Map(),windowListeners=new Map(),pending=new Map(),delays=[];
 let visible='hidden',seq=0,ticks=0,solarCalls=0,epoch=Date.parse('2026-10-25T00:15:00Z');
 globalThis.document={
  get visibilityState(){return visible},
  addEventListener:(name,fn)=>documentListeners.set(name,fn),
  removeEventListener:(name,fn)=>{if(documentListeners.get(name)===fn)documentListeners.delete(name)}
 };
 globalThis.window={
  setTimeout:(fn,delay)=>{const id=++seq;pending.set(id,fn);delays.push(delay);return id},
  clearTimeout:id=>pending.delete(id),
  addEventListener:(name,fn)=>windowListeners.set(name,fn),
  removeEventListener:(name,fn)=>{if(windowListeners.get(name)===fn)windowListeners.delete(name)}
 };
 const place={latitude:50.8,longitude:7.2,timezone:'Europe/Berlin'};
 const stop=startVisibleSolarClock(place,()=>ticks++,()=>epoch,(at,loc)=>{
  solarCalls++;
  assert.equal(loc.timezone,'Europe/Berlin');
  // A near sunrise/sunset boundary must be seen promptly.
  return {sunrise:new Date(at+5500),sunset:new Date(at+40000)};
 });
 assert.equal(pending.size,0,'initially hidden means no timeout');
 assert.equal(solarCalls,0,'no astronomy computation while hidden');
 documentListeners.get('visibilitychange')();
 assert.equal(pending.size,0,'a repeated hidden notification must not start a timer');
 visible='visible';
 documentListeners.get('visibilitychange')();
 assert.equal(ticks,1,'show must refresh immediately');
 assert.equal(pending.size,1,'show schedules exactly one timer');
 assert.equal(delays.at(-1),5750,'solar boundary keeps the original +250ms guard');
 let next=[...pending.values()][0];pending.clear();
 epoch+=5750;next();
 assert.equal(ticks,2,'foreground scheduled tick refreshes');
 assert.equal(pending.size,1,'foreground schedules next single timeout');
 visible='hidden';documentListeners.get('visibilitychange')();
 assert.equal(pending.size,0,'hide cancels pending timeout');
 const callsBefore=solarCalls;epoch+=3600000;
 windowListeners.get('focus')();
 assert.equal(ticks,2,'a background focus does not force a refresh');
 assert.equal(solarCalls,callsBefore,'no astronomy while hidden');
 visible='visible';windowListeners.get('focus')();
 assert.equal(ticks,3,'foreground focus refreshes immediately, also across DST hours');
 assert.equal(pending.size,1);
 assert.equal(solarCalls,callsBefore+1,'the new epoch is used after return');
 stop();
 assert.equal(pending.size,0);
 assert.equal(documentListeners.size,0);
 assert.equal(windowListeners.size,0);
 console.log('PASS visible solar timer: background pause, foreground catch-up, solar boundary, DST epoch, cleanup');
}finally{
 if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
 if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
 rmSync(dir,{recursive:true,force:true});
}
