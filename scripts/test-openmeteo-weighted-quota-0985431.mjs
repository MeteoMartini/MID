import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
import {getEventListeners} from 'node:events';
const ts=createRequire(import.meta.url)('typescript-strada');
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const compile=source=>ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
function workerSource(){
 const source=read('worker-src/00-core-observations.js'),ast=ts.createSourceFile('worker.js',source,ts.ScriptTarget.ES2022,true,ts.ScriptKind.JS);
 const names=new Set(['openMeteoQuotaResetAt','openMeteoQuotaOrigin','rememberOpenMeteoQuota','fetchWithDeadline']);
 const nodes=ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&names.has(node.name?.text)||ts.isVariableStatement(node)&&node.declarationList.declarations.some(x=>x.name.getText(ast)==='openMeteoQuotaCooldownByOrigin'));
 assert.equal(nodes.length,5);return nodes.map(x=>x.getText(ast)).join('\n')+'\nglobalThis.qa={openMeteoQuotaResetAt,fetchWithDeadline};';
}
const start=Date.parse('2026-11-05T12:00:00Z');
function runtime(source){
 let now=start,id=0;const timers=new Map(),saved=new Map(),calls=[];
 class ClockDate extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
 const sandbox={exports:{},Date:ClockDate,Headers,Response,Request,URL,AbortController,DOMException,console,
  setTimeout:(fn,ms=0)=>{const n=++id;timers.set(n,{fn,at:now+Math.max(0,ms)});return n},clearTimeout:n=>timers.delete(n),
  localStorage:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,String(v)),removeItem:k=>saved.delete(k)},
  fetch:(url,init)=>new Promise((resolve,reject)=>{const call={url:String(url),resolve,signal:init?.signal};calls.push(call);if(init?.signal?.aborted)reject(init.signal.reason);else init?.signal?.addEventListener('abort',()=>reject(init.signal.reason),{once:true})})};
 runInNewContext(source,sandbox);
 const flush=async()=>{for(let n=0;n<12;n++)await Promise.resolve()};
 const tick=async ms=>{const target=now+ms;for(;;){const next=[...timers].filter(([,t])=>t.at<=target).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;timers.delete(next[0]);next[1].fn();await flush()}now=target;await flush()};
 return {api:sandbox.qa||sandbox.exports,calls,saved,flush,tick,now:()=>now};
}
const headers=(seconds,extra={})=>new Headers({'X-RateLimit-Cost':'2.5','X-RateLimit-Limit':'600.0','X-RateLimit-Remaining':'0.0','X-RateLimit-Window':String(seconds),'X-RateLimit-Reset':String(start/1000+seconds),...extra});
const ok=(h={})=>new Response('{"temperature":4.5,"missing":null}',{headers:{'content-type':'application/json',...Object.fromEntries(new Headers(h))}});
const clientCode=compile(read('src/openMeteoGuard.ts')),workerCode=workerSource();
let cases=0;
for(const code of [clientCode,workerCode]){
 const parse=runtime(code).api.openMeteoQuotaResetAt;
 for(const seconds of [60,3600,86400]){assert.equal(parse(headers(seconds),start),start+seconds*1000);cases++}
 for(const override of [
  {'X-RateLimit-Remaining':'0.1'},{'X-RateLimit-Remaining':'-1'},{'X-RateLimit-Remaining':''},
  {'X-RateLimit-Limit':'0'},{'X-RateLimit-Limit':'NaN'},{'X-RateLimit-Limit':'Infinity'},
  {'X-RateLimit-Reset':String(start/1000-1)},{'X-RateLimit-Reset':String(start/1000+90000)},
  {'X-RateLimit-Reset':'60000'},{'X-RateLimit-Reset':'0x1234'},{'X-RateLimit-Reset':'1e99'},
  {'X-RateLimit-Reset':String(start/1000+60.5)},{'X-RateLimit-Window':'30'},
  {'X-RateLimit-Cost':'bad'},{'X-RateLimit-Cost':'-1'}
 ]){assert.equal(parse(headers(60,override),start),0,JSON.stringify(override));cases++}
 for(const missing of ['X-RateLimit-Limit','X-RateLimit-Remaining','X-RateLimit-Window','X-RateLimit-Reset']){const h=headers(60);h.delete(missing);assert.equal(parse(h,start),0);cases++}
 const quota429=headers(60);quota429.delete('X-RateLimit-Cost');assert.equal(parse(quota429,start),start+60000,'429 may omit cost');cases++;
 assert.equal(parse(headers(60),NaN),0);cases++;
}
// A successful last quota unit must not release a slot into the queued third call.
{
 const r=runtime(clientCode),a=new AbortController(),url='https://api.open-meteo.com/v1/forecast';
 const one=r.api.guardedOpenMeteoFetch(url+'?a',{}, {maxRetries:0});await r.flush();
 const two=r.api.guardedOpenMeteoFetch(url+'?b',{}, {maxRetries:0});
 const queued=r.api.guardedOpenMeteoFetch(url+'?c',{signal:a.signal},{maxRetries:0}).then(()=>null,e=>e);
 await r.tick(440);assert.equal(r.calls.length,2);
 r.calls[0].resolve(ok(headers(3600)));await r.flush();
 const delivered=await one;assert.equal(delivered.status,200);assert.equal((await delivered.json()).missing,null);
 const error=await queued;assert.equal(error.name,'OpenMeteoRateLimitError');assert.equal(error.retryAt,start+3600000);
 assert.equal(getEventListeners(a.signal,'abort').length,0,'Rejected queued consumer must release abort listener');
 assert.equal(r.calls.length,2,'No queued request launched after a successful depleted response');
 r.calls[1].resolve(ok());await two;
 assert.equal(r.api.openMeteoCooldownRetryAt(),start+3600000,'A later response without quota must not clear a valid hold');
 await assert.rejects(r.api.guardedOpenMeteoFetch(url+'?d'),e=>e.name==='OpenMeteoRateLimitError');
 assert.equal(r.calls.length,2);cases++;
}
// A minute hold resumes after absolute reset, preserving cancellation and the body.
{
 const r=runtime(clientCode),url='https://api.open-meteo.com/v1/forecast';
 const one=r.api.guardedOpenMeteoFetch(url,{}, {maxRetries:0});await r.flush();r.calls[0].resolve(ok(headers(60)));await one;
 const controller=new AbortController(),aborted=r.api.guardedOpenMeteoFetch(url+'?abort',{signal:controller.signal},{maxRetries:0}).then(()=>null,e=>e);
 controller.abort();assert.equal((await aborted).name,'AbortError');
 const next=r.api.guardedOpenMeteoFetch(url+'?next',{}, {maxRetries:0});
 await r.tick(59999);assert.equal(r.calls.length,1);await r.tick(10);assert.equal(r.calls.length,2);
 r.calls[1].resolve(ok());assert.equal((await next).status,200);cases++;
}
{
 const r=runtime(clientCode),promise=r.api.guardedOpenMeteoFetch('https://api.open-meteo.com/v1/forecast',{}, {maxRetries:0}).then(()=>null,e=>e);
 await r.flush();const h=headers(60);h.set('Retry-After','180');r.calls[0].resolve(new Response('{}',{status:429,headers:h}));
 assert.equal((await promise).retryAt,start+180000,'Retry-After longer than quota reset must still win');cases++;
}
// Worker admission applies only to charged API paths and the same quota origin.
{
 const r=runtime(workerCode),url='https://api.open-meteo.com/v1/forecast';
 const first=r.api.fetchWithDeadline(url);r.calls[0].resolve(ok(headers(60)));assert.equal((await first).status,200);
 const blocked=await r.api.fetchWithDeadline(url+'?again');assert.equal(blocked.status,429);assert.equal(blocked.headers.get('cache-control'),'no-store');assert.equal(r.calls.length,1);
 for(const other of ['https://ensemble-api.open-meteo.com/v1/ensemble','https://api.open-meteo.com/data/model/static/meta.json','https://api.brightsky.dev/weather']){
  const promise=r.api.fetchWithDeadline(other);r.calls.at(-1).resolve(ok());assert.equal((await promise).status,200);
 }
 await r.tick(60001);const renewed=r.api.fetchWithDeadline(url);r.calls.at(-1).resolve(ok());assert.equal((await renewed).status,200);assert.equal(r.calls.length,5);cases++;
}
{
 const r=runtime(workerCode),url='https://api.open-meteo.com/v1/forecast',first=r.api.fetchWithDeadline(url);
 r.calls[0].resolve(new Response('{}',{status:429,headers:{'Retry-After':'180'}}));await first;
 assert.equal((await r.api.fetchWithDeadline(url)).status,429);await r.tick(179999);assert.equal((await r.api.fetchWithDeadline(url)).status,429);
 await r.tick(2);const renewed=r.api.fetchWithDeadline(url);r.calls.at(-1).resolve(ok());await renewed;assert.equal(r.calls.length,2);cases++;
}
console.log(`Open-Meteo weighted quota: ${cases} deterministic parser/queue/abort/Retry-After/origin/metadata cases passed; client and Worker agree; no live API calls.`);
