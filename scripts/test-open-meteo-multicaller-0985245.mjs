import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const ts=createRequire(import.meta.url)('typescript-strada');
const source=readFileSync(new URL('../src/openMeteoGuard.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const saved=new Map();
globalThis.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)};
const guard=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const originalFetch=globalThis.fetch;
const response=()=>new Response('{"ok":true}',{status:200,headers:{'Content-Type':'application/json'}});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(condition,reason){const end=Date.now()+3500;while(!condition()){if(Date.now()>end)throw new Error(reason);await pause(12)}}
let network=[];
try{
 globalThis.fetch=(url,init)=>new Promise((resolve,reject)=>{
  const call={url:String(url),signal:init.signal,resolve};network.push(call);
  init.signal?.addEventListener('abort',()=>reject(init.signal.reason??new DOMException('Abgebrochen','AbortError')),{once:true});
 });
 const a=new AbortController(),b=new AbortController(),url='https://api.open-meteo.com/v1/forecast?mid=shared';
 const first=guard.guardedOpenMeteoJson(url,{signal:a.signal,cache:'no-store'});
 const second=guard.guardedOpenMeteoJson(url,{signal:b.signal,cache:'no-store'});
 await until(()=>network.length===1,'Shared fetch did not start');
 a.abort(new DOMException('View closed','AbortError'));
 await assert.rejects(first,e=>e?.name==='AbortError');
 assert.equal(network[0].signal.aborted,false,'Cancelling one caller must keep the other alive');
 network[0].resolve(response());
 assert.deepEqual(await second,{ok:true});
 assert.equal(network.length,1,'Identical active requests are fetched once');

 const c=new AbortController(),d=new AbortController(),next='https://api.open-meteo.com/v1/forecast?mid=all-abort';
 const abandoned1=guard.guardedOpenMeteoJson(next,{signal:c.signal});
 const abandoned2=guard.guardedOpenMeteoJson(next,{signal:d.signal});
 await until(()=>network.length===2,'Second shared fetch did not start');
 c.abort();d.abort();
 await Promise.all([assert.rejects(abandoned1,e=>e?.name==='AbortError'),assert.rejects(abandoned2,e=>e?.name==='AbortError')]);
 assert.equal(network[1].signal.aborted,true,'Last subscriber abort must cancel shared transport');
 const renewed=guard.guardedOpenMeteoJson(next,{signal:new AbortController().signal});
 await until(()=>network.length===3,'Abandoned entry prevents fresh request');
 network[2].resolve(response());
 assert.deepEqual(await renewed,{ok:true});

 let hits=0;
 globalThis.fetch=async()=>{hits++;return response()};
 const common='https://api.open-meteo.com/v1/forecast?mid=default';
 assert.deepEqual(await Promise.all([guard.guardedOpenMeteoJson(common),guard.guardedOpenMeteoJson(common)]),[{ok:true},{ok:true}]);
 assert.equal(hits,1,'No-signal identical GET must retain deduplication');
 hits=0;
 const headersUrl='https://api.open-meteo.com/v1/forecast?mid=headers';
 await Promise.all([guard.guardedOpenMeteoJson(headersUrl,{headers:{'X-MID-QA':'one'}}),guard.guardedOpenMeteoJson(headersUrl,{headers:{'X-MID-QA':'two'}})]);
 assert.equal(hits,2,'Requests with different headers must not be coalesced');

 hits=0;
 globalThis.fetch=async()=>{hits++;return new Response('{"reason":"limit"}',{status:429,headers:{'Retry-After':'180','Content-Type':'application/json'}})};
 await assert.rejects(guard.guardedOpenMeteoJson('https://api.open-meteo.com/v1/forecast?mid=429',{}, {priority:'background',maxRetries:0}),e=>guard.isOpenMeteoRateLimitError(e));
 const remaining=guard.openMeteoCooldownRetryAt()-Date.now();
 assert.ok(remaining>175000&&remaining<=180000,'Server Retry-After must not be truncated to 90 seconds');
 await assert.rejects(guard.guardedOpenMeteoJson('https://api.open-meteo.com/v1/forecast?mid=429-later',{}, {priority:'foreground',maxRetries:0}),e=>guard.isOpenMeteoRateLimitError(e));
 assert.equal(hits,1,'Long server cooldown must prevent eager foreground retries');
 console.log('Open-Meteo: independent aborts, last-subscriber cancellation, in-flight reuse, request-key isolation and Retry-After verified.');
}finally{globalThis.fetch=originalFetch}
