#!/usr/bin/env node
/** SQLite + transactionSync real SQL semantics; no network, keys or provider calls. */
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createMidAiGlobalAdmission} from './mid-ai-router-durable-admission.mjs';
const now0=Date.parse('2026-11-10T12:00:00.000Z');
let timestamp=now0,scenarios=0;
const check=async f=>{await f();scenarios++};
const db=new DatabaseSync(':memory:');
const sql={exec:(query,...args)=>{
 const q=db.prepare(query);
 if(/^SELECT/i.test(query.trim())){
   const rows=q.all(...args);return{toArray:()=>rows};
 }
 q.run(...args);return{toArray:()=>[]};
}};
const storage={sql,transactionSync:(fn)=>{
 db.exec('BEGIN IMMEDIATE');
 try{const result=fn();db.exec('COMMIT');return result}
 catch(e){db.exec('ROLLBACK');throw e}
}};
const sha='a'.repeat(40),taskDigest='b'.repeat(64),
 grantDigest='c'.repeat(64),quotaSubject='d'.repeat(64);
const request=(id,extra={})=>({
 requestId:'mid-'+id,expectedStableSha:sha,taskDigest,...extra
});
const proof=(r,extra={})=>({
 verified:true,userAuthorized:true,sourceAligned:true,
 freePlanVerified:true,modelAvailable:true,zeroPriceVerified:true,
 hardStopVerified:true,noPaidFallbackVerified:true,privacyApproved:true,
 globalSubjectVerified:true,requestId:r.requestId,expectedStableSha:sha,
 taskDigest,grantDigest,provider:'groq',model:'openai/gpt-oss-120b',
 quotaSubject,maxDailyRequests:2,expiresAtMs:timestamp+60_000,...extra
});
let forged={};
const agent=createMidAiGlobalAdmission({storage,verifyIndependentGrant:async r=>proof(r,forged),now:()=>timestamp});
const blocked=async(fn,reason)=>assert.rejects(fn,e=>e?.reason===reason,reason);
await check(async()=>{const r=await agent.reserve(request('first-0001'));
 assert.equal(r.status,'RESERVED_NO_DISPATCH');assert.equal(r.remainingRequests,1);
 assert.equal(r.dispatchAuthorized,false);assert.equal(r.costStatus,'NOT_VERIFIED_POST_CALL')});
await check(()=>blocked(()=>agent.reserve(request('first-0001')),'DUPLICATE_REQUEST_NO_RETRY'));
await check(async()=>{const r=await agent.reserve(request('second001'));
 assert.equal(r.remainingRequests,0)});
await check(()=>blocked(()=>agent.reserve(request('third-001')),'VERIFIED_FREE_QUOTA_EXHAUSTED'));
await check(async()=>{timestamp+=86400000;
 const r=await agent.reserve(request('fourth001'));assert.equal(r.remainingRequests,1)});
await check(()=>blocked(()=>agent.reserve(request('first-0001')),'DUPLICATE_REQUEST_NO_RETRY'));
await check(()=>blocked(()=>agent.reserve(request('bad',{expectedStableSha:'wrong'})),'INVALID_BOUND_REQUEST'));
await check(async()=>{forged={verified:false};
 await blocked(()=>agent.reserve(request('unverified1')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={privacyApproved:false};
 await blocked(()=>agent.reserve(request('privacy01')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={zeroPriceVerified:false};
 await blocked(()=>agent.reserve(request('charged01')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={freePlanVerified:false};
 await blocked(()=>agent.reserve(request('paidpln01')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={noPaidFallbackVerified:false};
 await blocked(()=>agent.reserve(request('fallback1')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={expiresAtMs:timestamp-1};
 await blocked(()=>agent.reserve(request('expired01')),'SHORT_LIVED_GRANT_REQUIRED');forged={}});
await check(async()=>{forged={maxDailyRequests:100000};
 await blocked(()=>agent.reserve(request('invalidQ1')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{forged={globalSubjectVerified:false};
 await blocked(()=>agent.reserve(request('noGlobal1')),'INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');forged={}});
await check(async()=>{
 const rows=sql.exec('SELECT * FROM mid_ai_claims').toArray();
 assert.equal(rows.length,3);assert.equal(rows[0].provider,'groq');
 const v=JSON.stringify(rows);assert.equal(v.includes('password'),false);
 assert.equal(v.includes('FAKE_SECRET'),false);
});
await check(async()=>{
 const claims=await Promise.allSettled(
  Array.from({length:16},()=>agent.reserve(request('parallel1'))));
 // Quota still permits one more today; 1 success, 15 duplicate blockers.
 assert.equal(claims.filter(x=>x.status==='fulfilled').length,1);
 assert.equal(claims.filter(x=>x.status==='rejected'&&
   x.reason.reason==='DUPLICATE_REQUEST_NO_RETRY').length,15);
});
await check(async()=>{
 const second=createMidAiGlobalAdmission({storage,verifyIndependentGrant:async r=>
  proof(r,{provider:'openrouter',model:'cohere/north-mini-code:free'}),now:()=>timestamp});
 await blocked(()=>second.reserve(request('parallel1')),'DUPLICATE_REQUEST_NO_RETRY');
});
await check(async()=>{assert.throws(()=>createMidAiGlobalAdmission({storage,now:()=>timestamp}),
 e=>e.reason==='PROTECTED_SQLITE_AND_INDEPENDENT_VERIFIER_REQUIRED')});
console.log('MID AI Router SQLite durable admission QA OK; scenarios='+scenarios+
 '; no external model, credentials, deployment or network.');
