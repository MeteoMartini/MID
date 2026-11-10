#!/usr/bin/env node
/** End-to-end mocked OAuth + signed Ed25519 + SQLite + fixed provider HTTP. */
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createMidAiOneShotExecutor,midAiOneShotTaskDigest}
 from './mid-ai-router-executor.mjs';
import {midAiQuotaGrantBytes,createMidAiSignedQuotaVerifier}
 from './mid-ai-router-signed-quota.mjs';
import {createMidAiGlobalAdmission}
 from './mid-ai-router-durable-admission.mjs';
const cryptoImpl=webcrypto,now0=Date.parse('2026-11-10T08:00:00.000Z');
let clock=now0,scenarios=0,fetchCalls=0,mode='ok',sourceDriftSecond=false;
const test=async f=>{await f();scenarios++};
const bad=(fn,reason)=>assert.rejects(fn,e=>e?.reason===reason,reason);
const sha='a'.repeat(40),principal='b'.repeat(64);
const kp=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const b64=x=>Buffer.from(x).toString('base64url');
const pub=b64(await webcrypto.subtle.exportKey('raw',kp.publicKey));
const task=(id,props={})=>({
 requestId:'mid-executor-'+id,userInitiated:true,allowExternalInference:true,
 maxExternalCalls:1,maxAdditionalCashUsd:0,kind:'independent-review',
 dataClass:'public-redacted',expectedStableSha:sha,expectedVersion:'0.9.85.453',
 prompt:'Review the public WMO precipitation accumulation semantics.',...props
});
let readCount=0,authOverride={},postResponseDrift=false;
const source=async()=>{
 readCount++;
 return {checkedAt:new Date(clock).toISOString(),
  mainSha:(postResponseDrift || (sourceDriftSecond && readCount%2===0))?'c'.repeat(40):sha,
  stableSha:sha,
  versionMirrors:{package:'0.9.85.453',baseline:'0.9.85.453',registry:'0.9.85.453'}};
};
const verifier=await createMidAiSignedQuotaVerifier({
 pinnedPublicKeyBase64url:pub,pinnedKeyId:'mid-free-issuer-1',
 trustedSourceReadback:source,now:()=>clock,cryptoImpl
});
const db=new DatabaseSync(':memory:');
const sql={exec:(q,...params)=>{
 const s=db.prepare(q);return /^SELECT/i.test(q.trim())?
 {toArray:()=>s.all(...params)}:(s.run(...params),{toArray:()=>[]});
}};
const storage={sql,transactionSync:fn=>{
 db.exec('BEGIN IMMEDIATE');try{const out=fn();db.exec('COMMIT');return out}
 catch(e){db.exec('ROLLBACK');throw e}
}};
const admission=createMidAiGlobalAdmission({storage,verifyIndependentGrant:verifier,now:()=>clock});
const response=(provider,model)=>{
 const data=provider==='gemini'?
 {modelVersion:model,candidates:[{finishReason:'STOP',content:{parts:[{text:'Reviewed public data.'}]}}],
  usageMetadata:{promptTokenCount:10,candidatesTokenCount:5}}:
 {model,choices:[{finish_reason:'stop',message:{content:'Reviewed public data.'}}],
  usage:{prompt_tokens:10,completion_tokens:5}};
 if(mode==='wrongModel')data[provider==='gemini'?'modelVersion':'model']='wrong-model';
 if(mode==='missingUsage'){
  if(provider==='gemini')delete data.usageMetadata;
  else delete data.usage;
 }
 if(mode==='badUsage'){
  if(provider==='gemini')data.usageMetadata={promptTokenCount:'not-a-number',tokenDump:'SECRET'};
  else data.usage={prompt_tokens:'not-a-number',tokenDump:'SECRET'};
 }
 if(mode==='injectedUsage'){
  if(provider==='gemini')data.usageMetadata.tokenDump='malicious untrusted usage data';
  else data.usage.tokenDump='malicious untrusted usage data';
 }
 if(mode==='truncated'){
  if(provider==='gemini')data.candidates[0].finishReason='MAX_TOKENS';
  else data.choices[0].finish_reason='length';
 }
 return data;
};
const requests=[];
const remote=async(url,opts)=>{
 fetchCalls++;requests.push({url,headers:opts.headers,body:JSON.parse(opts.body),
  redirect:opts.redirect,timeout:!!opts.signal});
 if(mode==='network')throw new Error('Fake internal secret from transport');
 if(mode==='429')return new Response('{"error":"quota"}',{status:429});
 const provider=url.includes('groq.com')?'groq':
  url.includes('openrouter.ai')?'openrouter':'gemini';
 const model=provider==='gemini'?decodeURIComponent(url.split('/models/')[1].split(':')[0]):
  JSON.parse(opts.body).model;
 const raw=mode==='oversized'?'x'.repeat(65537):JSON.stringify(response(provider,model));
 if(mode==='postResponseDrift')postResponseDrift=true;
 return new Response(raw,{status:200});
};
const executor=createMidAiOneShotExecutor({
 authenticate:async()=>({authenticated:true,audience:'mid-ai-router',
  scopes:['mid-ai:infer-public'],principalSha256:principal,...authOverride}),
 admission,readback:source,
 credentialFor:async provider=>{
  if(!['groq','openrouter','gemini'].includes(provider))throw new Error('unknown');
  return 'FAKE_PROVIDER_KEY_123456';
 },fetchImpl:remote,now:()=>clock,cryptoImpl
});
const signed=async(t,provider='groq',model='openai/gpt-oss-120b')=>{
 const digest=await midAiOneShotTaskDigest(t,principal,cryptoImpl);
 const grant={
  schema:'mid.ai-router.quota-grant.v1',audience:'mid-ai-router-global-admission-v1',
  keyId:'mid-free-issuer-1',requestId:t.requestId,principalSha256:principal,
  taskDigest:digest,expectedStableSha:sha,provider,model,
  quotaSubject:(provider==='groq'?'d':provider==='openrouter'?'e':'f').repeat(64),
  maxDailyRequests:10,freePlanVerified:true,modelAvailable:true,
  zeroPriceVerified:true,hardStopVerified:true,noPaidFallbackVerified:true,
  privacyApproved:true,globalSubjectVerified:true,sourceAligned:true,
  userAuthorized:true,dataClass:'public-redacted',maxAdditionalCashUsd:0,
  issuedAtMs:clock,expiresAtMs:clock+120000
 };
 const signature=b64(await cryptoImpl.subtle.sign('Ed25519',kp.privateKey,midAiQuotaGrantBytes(grant)));
 return {...t,grant,signature};
};
await test(async()=>{
 const t=await signed(task('first-test-001'));const r=await executor.execute(t);
 assert.equal(r.status,'UNTRUSTED_REVIEW_ONLY');assert.equal(r.provider,'groq');
 assert.equal(fetchCalls,1);assert.equal(r.cashSpendStatus,'NOT_VERIFIED');
 assert.equal(r.credentialsShown,false);assert.equal(r.additionalCashAuthorizedUsd,0);
 assert.equal(requests[0].redirect,'error');assert.equal(requests[0].body.model,'openai/gpt-oss-120b');
 assert.equal(JSON.stringify(r).includes('FAKE_PROVIDER_KEY'),false);
});
await test(async()=>{const t=await signed(task('first-test-001'));
 await bad(()=>executor.execute(t),'DUPLICATE_REQUEST_NO_RETRY');assert.equal(fetchCalls,1)});
await test(async()=>{const t=await signed(task('private-data1'));t.dataClass='private';
 await bad(()=>executor.execute(t),'TASK_SCOPE_INVALID');assert.equal(fetchCalls,1)});
await test(async()=>{const before=fetchCalls;
 await bad(()=>executor.execute(task('email-block-1',{
  prompt:'Contact researcher@mid.example about the public data.'})),'TASK_SCOPE_INVALID');
 assert.equal(fetchCalls,before)});
await test(async()=>{const before=fetchCalls;
 await bad(()=>executor.execute(task('groq-key-block',{
  prompt:'Never transmit gsk_FAKE_SECRET_123456789abcdef.'})),'TASK_SCOPE_INVALID');
 assert.equal(fetchCalls,before)});
await test(async()=>{const before=fetchCalls;
 await bad(()=>executor.execute(task('github-keyblock',{
  prompt:'Never transmit github_pat_FAKE_SECRET_LONGGGGGGGGGGG.'})),'TASK_SCOPE_INVALID');
 assert.equal(fetchCalls,before)});
await test(async()=>{const before=fetchCalls;
 await bad(()=>executor.execute(task('query-token-1',{
  prompt:'Fetch https://example.org/data?token=longSECRETtoken.'})),'TASK_SCOPE_INVALID');
 assert.equal(fetchCalls,before)});
await test(async()=>{const t=await signed(task('paid-request'));t.maxAdditionalCashUsd=1;
 await bad(()=>executor.execute(t),'TASK_SCOPE_INVALID');assert.equal(fetchCalls,1)});
await test(async()=>{authOverride={scopes:[]};const t=await signed(task('unauth-test1'));
 await bad(()=>executor.execute(t),'AUTHENTICATED_PUBLIC_SCOPE_REQUIRED');authOverride={}});
await test(async()=>{authOverride={principalSha256:'9'.repeat(64)};const t=await signed(task('stolen-grant'));
 await bad(()=>executor.execute(t),'GRANT_VERIFICATION_UNAVAILABLE');authOverride={}});
await test(async()=>{const t=await signed(task('changed-text'));
 t.prompt='Changed prompt after signed grant';
 await bad(()=>executor.execute(t),'GRANT_VERIFICATION_UNAVAILABLE')});
await test(async()=>{readCount=0;sourceDriftSecond=true;
 const t=await signed(task('source-race'));
 await bad(()=>executor.execute(t),'SOURCE_DRIFT_OR_VERSION_MISMATCH');
 sourceDriftSecond=false;assert.equal(fetchCalls,1)});
await test(async()=>{
 // Promotion in the middle of the only authorized provider request must
 // suppress its answer. A consumed signed quota claim can never be retried.
 const before=fetchCalls,t=await signed(task('post-response-source-race'));
 mode='postResponseDrift';
 try{
  await bad(()=>executor.execute(t),'SOURCE_DRIFT_OR_VERSION_MISMATCH');
 }finally{mode='ok';postResponseDrift=false;}
 assert.equal(fetchCalls,before+1);
 await bad(()=>executor.execute(t),'DUPLICATE_REQUEST_NO_RETRY');
 assert.equal(fetchCalls,before+1);
});
await test(async()=>{mode='wrongModel';const t=await signed(task('wrong-model1'));
 await bad(()=>executor.execute(t),'REPORTED_MODEL_MISMATCH');mode='ok';assert.equal(fetchCalls,2)});
await test(async()=>{mode='truncated';const t=await signed(task('partial-work'));
 await bad(()=>executor.execute(t),'INCOMPLETE_OR_FILTERED_RESPONSE');mode='ok'});
await test(async()=>{mode='429';const t=await signed(task('quota-http1'));
 await bad(()=>executor.execute(t),'PROVIDER_HTTP_429');mode='ok'});
await test(async()=>{mode='network';const t=await signed(task('network-fail'));
 await bad(()=>executor.execute(t),'PROVIDER_TRANSPORT_FAILED');mode='ok'});
await test(async()=>{mode='oversized';const t=await signed(task('oversized-01'));
 await bad(()=>executor.execute(t),'PROVIDER_RESPONSE_TOO_LARGE');mode='ok'});
await test(async()=>{mode='missingUsage';const t=await signed(task('no-usage-01'));
 const r=await executor.execute(t);assert.equal(r.usage,null);
 assert.equal(r.usageStatus,'NOT_REPORTED');mode='ok'});
await test(async()=>{mode='badUsage';const t=await signed(task('bad-usage-1'));
 const r=await executor.execute(t);assert.equal(r.usage,null);
 assert.equal(r.usageStatus,'INVALID_UPSTREAM_USAGE');mode='ok'});
await test(async()=>{mode='injectedUsage';const t=await signed(task('injection-01'));
 const r=await executor.execute(t);assert.equal(r.usageStatus,'UPSTREAM_REPORTED_UNVERIFIED');
 assert.deepEqual(r.usage,{prompt_tokens:10,completion_tokens:5});
 assert.equal(JSON.stringify(r).includes('malicious untrusted usage data'),false);mode='ok'});
await test(async()=>{const t=await signed(task('openrouter-ok'),'openrouter','cohere/north-mini-code:free');
 const r=await executor.execute(t);assert.equal(r.provider,'openrouter');
 const p=requests.at(-1).body.provider;
 assert.equal(p.allow_fallbacks,false);assert.equal(p.zdr,true);
 assert.equal(p.data_collection,'deny');assert.equal(p.max_price.request,0)});
await test(async()=>{const t=await signed(task('gemini-free1'),'gemini','gemini-3.8-flash');
 const r=await executor.execute(t);assert.equal(r.provider,'gemini');
 assert.equal(requests.at(-1).headers['x-goog-api-key'],'FAKE_PROVIDER_KEY_123456');
 assert.equal(JSON.stringify(requests.at(-1).body).includes('FAKE_PROVIDER_KEY'),false)});
await test(async()=>{
 // Deliberately compromised admission proof: the executor must still block
 // unpinned models before any simulated provider HTTP request.
 const before=fetchCalls;
 const forgedAdmission=createMidAiOneShotExecutor({
  authenticate:async()=>({authenticated:true,audience:'mid-ai-router',
   scopes:['mid-ai:infer-public'],principalSha256:principal}),
  admission:{reserve:async ({requestId,expectedStableSha})=>({
   status:'RESERVED_NO_DISPATCH',requestId,stableSha:expectedStableSha
  })},
  readback:source,credentialFor:async()=> 'FAKE_PROVIDER_KEY_123456',
  fetchImpl:remote,now:()=>clock,cryptoImpl
 });
 const unpinned=[
  ['groq','llama-3.3-70b-versatile'],
  ['openrouter','meta-llama/llama-3.3-70b-instruct:free'],
  ['gemini','gemini-2.5-pro']
 ];
 for(const [provider,model] of unpinned){
  const t=task('compromised-'+provider);
  await bad(()=>forgedAdmission.execute({...t,grant:{
   provider,model,expiresAtMs:clock+60000
  },signature:'FAKE_SIGNATURE_NO_REAL_PERMISSION'}),'MODEL_NOT_ALLOWED');
 }
 assert.equal(fetchCalls,before);
});
db.close();
console.log('MID AI Router Worker one-shot end-to-end mock QA OK; scenarios='+scenarios+
 '; provider HTTP calls simulated, no external inference, credentials or billing.');
