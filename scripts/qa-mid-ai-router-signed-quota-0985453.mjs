#!/usr/bin/env node
/** WebCrypto Ed25519 + SQLite atomic reservation integration, offline only. */
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createMidAiSignedQuotaVerifier,midAiQuotaGrantBytes,isMidAiPinnedCandidateModel}
 from './mid-ai-router-signed-quota.mjs';
import {createMidAiGlobalAdmission}
 from './mid-ai-router-durable-admission.mjs';
let instant=Date.parse('2026-11-10T08:00:00Z'),cases=0;
const ok=async cb=>{await cb();cases++};
const denied=async(cb,reason)=>assert.rejects(cb,e=>e?.reason===reason,reason);
const kp=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
const raw=new Uint8Array(await webcrypto.subtle.exportKey('raw',kp.publicKey));
const base64url=buf=>Buffer.from(buf).toString('base64url');
const sha='a'.repeat(40),taskDigest='b'.repeat(64),
 quotaSubject='c'.repeat(64),principalSha256='d'.repeat(64);
let sourceOverride={};
const sourceReadback=async()=>({
 mainSha:sha,stableSha:sha,checkedAt:new Date(instant).toISOString(),...sourceOverride
});
const base=(id,update={})=>({
 schema:'mid.ai-router.quota-grant.v1',
 audience:'mid-ai-router-global-admission-v1',
 keyId:'mid-free-issuer-1',
 requestId:id,principalSha256,taskDigest,expectedStableSha:sha,
 provider:'groq',model:'openai/gpt-oss-120b',
 quotaSubject,maxDailyRequests:2,
 freePlanVerified:true,modelAvailable:true,zeroPriceVerified:true,
 hardStopVerified:true,noPaidFallbackVerified:true,privacyApproved:true,
 globalSubjectVerified:true,sourceAligned:true,userAuthorized:true,
 dataClass:'public-redacted',maxAdditionalCashUsd:0,
 issuedAtMs:instant,expiresAtMs:instant+120000,...update
});
const sign=async grant=>base64url(await webcrypto.subtle.sign(
 'Ed25519',kp.privateKey,midAiQuotaGrantBytes(grant)));
const req=async(id,update={})=>{
 const grant=base(id,update);
 return {requestId:id,expectedStableSha:sha,principalSha256,taskDigest,
  grant,signature:await sign(grant)};
};
const verifier=await createMidAiSignedQuotaVerifier({
 pinnedPublicKeyBase64url:base64url(raw),pinnedKeyId:'mid-free-issuer-1',
 trustedSourceReadback:sourceReadback,now:()=>instant,cryptoImpl:webcrypto
});
const good=await req('mid-good-request-0001');
await ok(async()=>{
 const p=await verifier(good);
 assert.equal(p.verified,true);assert.equal(p.provider,'groq');
 assert.equal(p.model,'openai/gpt-oss-120b');
 assert.match(p.grantDigest,/^[a-f0-9]{64}$/);
 assert.equal(JSON.stringify(p).includes(good.signature),false);
});
await ok(async()=>{const altered={...good,grant:{...good.grant,model:'openai/gpt-oss-20b'}};
 await denied(()=>verifier(altered),'INVALID_ED25519_SIGNATURE')});
await ok(()=>denied(()=>verifier({...good,signature:base64url(new Uint8Array(64))}),'INVALID_ED25519_SIGNATURE'));
await ok(async()=>{const p=await req('mid-invalidkey-01');
 const other=await webcrypto.subtle.generateKey('Ed25519',true,['sign','verify']);
 const pub=await webcrypto.subtle.exportKey('raw',other.publicKey);
 const verifyOther=await createMidAiSignedQuotaVerifier({
  pinnedPublicKeyBase64url:base64url(pub),pinnedKeyId:'mid-free-issuer-1',
  trustedSourceReadback:sourceReadback,now:()=>instant,cryptoImpl:webcrypto});
 await denied(()=>verifyOther(p),'INVALID_ED25519_SIGNATURE');
});
await ok(async()=>{const invalid={...good,requestId:'mid-request-other'};await denied(()=>verifier(invalid),'GRANT_BINDING_MISMATCH')});
await ok(async()=>{const stolen={...good,principalSha256:'e'.repeat(64)};
 await denied(()=>verifier(stolen),'GRANT_BINDING_MISMATCH')});
await ok(async()=>{const invalid={...good,grant:{...good.grant,extraFlag:true}};await denied(()=>verifier(invalid),'INVALID_GRANT_SCHEMA')});
await ok(async()=>{const invalid={...good,grant:{...good.grant,freePlanVerified:false}};await denied(()=>verifier(invalid),'INVALID_GRANT_POLICY')});
await ok(async()=>{const invalid={...good,grant:{...good.grant,maxAdditionalCashUsd:0.01}};await denied(()=>verifier(invalid),'INVALID_GRANT_POLICY')});
await ok(async()=>{const invalid={...good,grant:{...good.grant,dataClass:'private'}};await denied(()=>verifier(invalid),'INVALID_GRANT_POLICY')});
await ok(async()=>{const invalid={...good,grant:{...good.grant,provider:'vercel-ai-gateway'}};await denied(()=>verifier(invalid),'INVALID_GRANT_POLICY')});
await ok(()=>{
 const candidates=[
  ['groq','openai/gpt-oss-20b'],['groq','openai/gpt-oss-120b'],
  ['openrouter','cohere/north-mini-code:free'],
  ['openrouter','google/gemma-4-26b-a4b-it:free'],
  ['gemini','gemini-3.8-flash']
 ];
 for(const [provider,model] of candidates){
  assert.equal(isMidAiPinnedCandidateModel(provider,model),true);
  assert.doesNotThrow(()=>midAiQuotaGrantBytes(
   base('mid-pinned-candidate-01',{provider,model})));
 }
});
await ok(()=>{
 const model='llama-3.3-70b-versatile';
 assert.equal(isMidAiPinnedCandidateModel('groq',model),false);
 assert.throws(()=>midAiQuotaGrantBytes(base('mid-unpinned-groq-01',{provider:'groq',model})),
  e=>e?.reason==='INVALID_GRANT_POLICY');
});
await ok(()=>{
 const model='meta-llama/llama-3.3-70b-instruct:free';
 assert.equal(isMidAiPinnedCandidateModel('openrouter',model),false);
 assert.throws(()=>midAiQuotaGrantBytes(base('mid-unpinned-openrouter-01',{provider:'openrouter',model})),
  e=>e?.reason==='INVALID_GRANT_POLICY');
});
await ok(()=>{
 const model='openrouter/free';
 assert.equal(isMidAiPinnedCandidateModel('openrouter',model),false);
 assert.throws(()=>midAiQuotaGrantBytes(base('mid-random-model-01',{provider:'openrouter',model})),
  e=>e?.reason==='INVALID_GRANT_POLICY');
});
await ok(()=>{
 const model='gemini-2.5-pro';
 assert.equal(isMidAiPinnedCandidateModel('gemini',model),false);
 assert.throws(()=>midAiQuotaGrantBytes(base('mid-unpinned-gemini-01',{provider:'gemini',model})),
  e=>e?.reason==='INVALID_GRANT_POLICY');
});
await ok(async()=>{const invalid={...good,signature:'bad%signature'};await denied(()=>verifier(invalid),'INVALID_BASE64URL')});
await ok(async()=>{instant+=120000;await denied(()=>verifier(good),'GRANT_EXPIRED_OR_CLOCK_INVALID');instant-=120000});
await ok(async()=>{sourceOverride={mainSha:'d'.repeat(40)};
 await denied(()=>verifier(good),'SOURCE_DRIFT');sourceOverride={}});
await ok(async()=>{sourceOverride={checkedAt:new Date(instant-60000).toISOString()};
 await denied(()=>verifier(good),'SOURCE_READBACK_STALE');sourceOverride={}});
await ok(()=>denied(()=>createMidAiSignedQuotaVerifier({
 pinnedKeyId:'mid-free-issuer-1',pinnedPublicKeyBase64url:base64url(raw),now:()=>instant,cryptoImpl:webcrypto
}),'INDEPENDENT_VERIFIER_NOT_CONFIGURED'));
await ok(async()=>{const expired=base('mid-expired-request',{expiresAtMs:instant-1});assert.throws(()=>midAiQuotaGrantBytes(expired),e=>e?.reason==='INVALID_GRANT_POLICY')});
await ok(async()=>{const long=base('mid-long-request-001',{expiresAtMs:instant+360000});assert.throws(()=>midAiQuotaGrantBytes(long),e=>e?.reason==='INVALID_GRANT_POLICY')});
await ok(async()=>{const mismatched={...good,grant:{...good.grant,quotaSubject:'not-a-digest'}};
 await denied(()=>verifier(mismatched),'INVALID_GRANT_POLICY')});
const db=new DatabaseSync(':memory:');
const sql={exec:(query,...args)=>{
 const q=db.prepare(query);return /^SELECT/i.test(query.trim())?
 {toArray:()=>q.all(...args)}:(q.run(...args),{toArray:()=>[]});
}};
const storage={sql,transactionSync:fn=>{
 db.exec('BEGIN IMMEDIATE');try{const output=fn();db.exec('COMMIT');return output}
 catch(e){db.exec('ROLLBACK');throw e}
}};
const admission=createMidAiGlobalAdmission({storage,verifyIndependentGrant:verifier,now:()=>instant});
await ok(async()=>{const a=await admission.reserve(good);
 assert.equal(a.status,'RESERVED_NO_DISPATCH');assert.equal(a.remainingRequests,1);
 assert.equal(a.dispatchAuthorized,false)});
await ok(()=>denied(()=>admission.reserve(good),'DUPLICATE_REQUEST_NO_RETRY'));
await ok(async()=>{const b=await req('mid-second-request-02');
 const res=await admission.reserve(b);assert.equal(res.remainingRequests,0)});
await ok(async()=>{const third=await req('mid-third-request-03');
 await denied(()=>admission.reserve(third),'VERIFIED_FREE_QUOTA_EXHAUSTED')});
await ok(async()=>{sourceOverride={mainSha:'e'.repeat(40)};
 const fourth=await req('mid-fourth-request4');
 await denied(()=>admission.reserve(fourth),'GRANT_VERIFICATION_UNAVAILABLE');
 sourceOverride={}});
await ok(async()=>{
 const records=sql.exec('SELECT request_id,provider,model_id,grant_digest FROM mid_ai_claims').toArray();
 assert.equal(records.length,2);
 const serialized=JSON.stringify(records);assert.equal(serialized.includes(good.signature),false);
 assert.equal(serialized.includes('api_key'),false);
});
db.close();
console.log('MID AI Router signed Ed25519/SQLite QA OK; scenarios='+cases+
 '; no provider inference, auth bypass, billing or network.');
