import assert from 'node:assert/strict';
import {fetchJsonWithRetry,isTransientApiStatus} from './api-contract-request.mjs';

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

console.log('MID v0.9.85.111: API-Vertragsprüfung wiederholt nur transiente Transport-/HTTP-Fehler begrenzt und bleibt danach fail-closed.');
