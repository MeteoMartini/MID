import assert from 'node:assert/strict';
import {fetchJsonWithRetry,isTransientApiStatus,classifyApiTransportError} from './api-contract-request.mjs';


const rootError=(code)=>new TypeError('fetch failed',{cause:Object.assign(new Error('hidden cause details'),{code})});
for(const [code,expected] of [['ENOTFOUND','DNS'],['EAI_AGAIN','DNS'],['CERT_HAS_EXPIRED','TLS'],['UNABLE_TO_VERIFY_LEAF_SIGNATURE','TLS'],['UND_ERR_CONNECT_TIMEOUT','TIMEOUT'],['ECONNRESET','CONNECTIVITY']]){
 assert.equal(classifyApiTransportError(rootError(code)),expected,'Only structured transport codes classify network failure');
}
assert.equal(classifyApiTransportError(Object.assign(new Error('slow'),{name:'TimeoutError'})),'TIMEOUT');
assert.equal(classifyApiTransportError(new TypeError('fetch failed')),'UNCLASSIFIED_TRANSPORT');
assert.equal(classifyApiTransportError(new Error('https://secret.example/?token=private')),'UNCLASSIFIED_TRANSPORT');

const response=(status,payload={ok:true},headers={})=>({
 ok:status>=200&&status<300,
 status,
 headers:{get:name=>headers[String(name).toLowerCase()]??null},
 json:async()=>payload
});
const noSleep=async()=>{};

assert.equal(isTransientApiStatus(408),true);
assert.equal(isTransientApiStatus(425),true);
assert.equal(isTransientApiStatus(429),true);
assert.equal(isTransientApiStatus(503),true);
assert.equal(isTransientApiStatus(400),false);
assert.equal(isTransientApiStatus(404),false);

{
 let calls=0;
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;if(calls<3)throw new TypeError('fetch failed');return response(200,{value:1})},
  sleep:noSleep,timeoutMs:50
 });
 assert.equal(calls,3);
 assert.equal(result.attemptsUsed,3);
 assert.equal(result.payload.value,1);
}
{
 let calls=0;
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;return calls===1?response(503,{error:true}):response(200,{value:2})},
  sleep:noSleep,timeoutMs:50
 });
 assert.equal(calls,2);
 assert.equal(result.attemptsUsed,2);
 assert.equal(result.payload.value,2);
}
{
 let calls=0;
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;return response(400,{error:true})},
  sleep:noSleep,timeoutMs:50
 });
 assert.equal(calls,1,'Nicht-transiente 4xx dürfen nicht künstlich wiederholt werden.');
 assert.equal(result.response.status,400);
 assert.equal(result.attemptsUsed,1);
}
{
 let calls=0;
 await assert.rejects(()=>fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;throw new TypeError('fetch failed')},
  sleep:noSleep,timeoutMs:50
 }),/fetch failed/);
 assert.equal(calls,3,'Transportfehler müssen nach drei begrenzten Versuchen weiterhin fail-closed enden.');
}

const source=await import('node:fs/promises').then(({readFile})=>readFile(new URL('./check-api-contracts.mjs',import.meta.url),'utf8'));
assert.match(source,/fetchJsonWithRetry\(url\)/,'API-Vertragsprüfung muss den Retry-Helper verwenden.');
assert.match(source,/Vertrag ungültig \(HTTP \$\{response\.status\}\)/,'Inhaltlich ungültige HTTP-Antworten bleiben echte Vertragsfehler.');

assert.ok(source.includes('Provider HTTP ${response.status} (kein Schemaurteil)'), 'Provider HTTP 5xx must not be mislabeled as a JSON contract violation.');
assert.ok(source.includes('Transportfehler (${classifyApiTransportError(error)})'), 'Transport failures must retain a fail-closed but transport-specific verdict.');

console.log('MID v0.9.85.111: API-Vertragsprüfung wiederholt nur transiente Transport-/HTTP-Fehler begrenzt und bleibt danach fail-closed.');

// Body transport and valid Retry-After are independent of schema validity.
{
 let calls=0;
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>++calls===1?{...response(200),json:async()=>{throw rootError('UND_ERR_BODY_TIMEOUT')}}:response(200,{value:3}),
  sleep:noSleep
 });
 assert.equal(calls,2);assert.equal(result.attemptsUsed,2);assert.equal(result.payload.value,3);
}
{
 let calls=0;
 await assert.rejects(()=>fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;return new Response(new ReadableStream({start(controller){controller.error(new DOMException('private body detail','AbortError'))}}))},sleep:noSleep
 }),error=>classifyApiTransportError(error)==='ABORTED');
 assert.equal(calls,3);
}
{
 let calls=0;
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;return new Response('{broken',{status:200})},sleep:noSleep
 });
 assert.equal(calls,1);assert.equal(result.payload,null);assert.equal(result.response.status,200);
}
for(const status of [429,503])for(const retryAfter of ['120',new Date(Date.now()+120000).toUTCString()]){
 let calls=0;const delays=[];
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>{calls++;return response(status,{}, {'retry-after':retryAfter})},sleep:async ms=>delays.push(ms)
 });
 assert.equal(calls,1);assert.deepEqual(delays,[]);assert.equal(result.retryDeferred,true);assert.equal(result.response.status,status);
}
{
 let calls=0;const delays=[];
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>++calls===1?response(503,{}, {'retry-after':'2'}):response(200),sleep:async ms=>delays.push(ms)
 });
 assert.equal(result.attemptsUsed,2);assert.deepEqual(delays,[2000]);
}
{
 let calls=0;const delays=[];
 const result=await fetchJsonWithRetry('https://example.test',{
  fetchImpl:async()=>++calls===1?{...response(429,{}, {'retry-after':'120'}),json:async()=>{throw rootError('UND_ERR_BODY_TIMEOUT')}}:response(200),sleep:async ms=>delays.push(ms)
 });
 assert.equal(result.response.status,429);assert.equal(result.retryDeferred,true);assert.equal(calls,1);assert.deepEqual(delays,[]);
}
// Exercise the actual CLI with two independent provider origins still reachable.
{
 const {spawnSync}=await import('node:child_process');
 const preload=`
 const counts={};
 globalThis.fetch=async raw=>{
  const u=new URL(raw);counts[u.origin]=(counts[u.origin]||0)+1;
  if(u.origin==='https://api.open-meteo.com')return new Response('{}',{status:503,headers:{'Retry-After':'120'}});
  const hourly={time:Array(8).fill('synthetic')};
  for(const key of (u.searchParams.get('hourly')||'').split(','))hourly[key]=Array(8).fill(2);
  return Response.json({hourly});
 };
 process.on('exit',()=>console.error('ORIGIN_COUNTS='+JSON.stringify(counts)));
 `;
 const cli=await import('node:url').then(({fileURLToPath})=>fileURLToPath(new URL('./check-api-contracts.mjs',import.meta.url)));
 const result=spawnSync(process.execPath,['--import','data:text/javascript,'+encodeURIComponent(preload),cli],{encoding:'utf8',timeout:15000});
 assert.equal(result.status,1,result.stderr);
 assert.match(result.stderr,/Provider HTTP 503 \(kein Schemaurteil\)/);
 assert.match(result.stderr,/ECMWF IFS native 3h Min\/Max: nicht geprüft wegen Retry-After derselben API-Origin/);
 const counts=JSON.parse(result.stderr.match(/ORIGIN_COUNTS=(.+)/)[1]);
 assert.equal(counts['https://api.open-meteo.com'],1);
 assert.equal(counts['https://ensemble-api.open-meteo.com'],1);
 assert.equal(counts['https://air-quality-api.open-meteo.com'],1);
}
console.log('MID API transport: body interruption, malformed JSON, bounded Retry-After and exact-origin CLI isolation passed.');
