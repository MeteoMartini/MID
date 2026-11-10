#!/usr/bin/env node
import assert from 'node:assert/strict';
import {summarizeMidAiBlend as report} from './mid-ai-router-synthesis.mjs';
let n=0;const t=f=>{f();n++};
const sha='a'.repeat(40);
const a={status:'PLAN_ONLY',requestId:'mid-blend-req-a',provider:'groq',model:'openai/gpt-oss-120b',expectedStableSha:sha};
const b={status:'PLAN_ONLY',requestId:'mid-blend-req-b',provider:'openrouter',model:'cohere/north-mini-code:free',expectedStableSha:sha};
const plan={status:'PLAN_ONLY',mode:'independent-two-models',modelCalls:2,plans:[a,b],
 automaticDispatch:false,mergeIsAuthoritative:false};
const evidence=(p,claims=[])=>({status:'UNTRUSTED_REVIEW_ONLY',requestId:p.requestId,
 provider:p.provider,model:p.model,providerReportedModel:p.model,
 expectedStableSha:sha,text:'Untrusted provider answer',claims});
const c=(key,value,sourceUrl='https://wmo.int/')=>({key,value,sourceUrl});
const good=[evidence(a,[c('value_a','1'),c('value_b','2'),c('missing_value',null)]),
 evidence(b,[c('value_a','1'),c('value_b','3'),c('missing_value','0')])];
const blocked=(args,code)=>assert.throws(()=>report(args),e=>e?.reason===code,code);
t(()=>blocked({},'NOT_AN_AUTHORIZED_TWO_MODEL_PLAN'));
t(()=>blocked({plan:{...plan,automaticDispatch:true}},'NOT_AN_AUTHORIZED_TWO_MODEL_PLAN'));
t(()=>blocked({plan:{...plan,plans:[a,{...a,requestId:b.requestId}]}},
 'NOT_TWO_INDEPENDENT_MODEL_FAMILIES'));
t(()=>blocked({plan:{...plan,plans:[a,{...b,provider:'groq',model:'openai/gpt-oss-20b'}]}},
 'NOT_TWO_INDEPENDENT_MODEL_FAMILIES'));
t(()=>{const r=report({plan});assert.equal(r.status,'PENDING_LIVE_MODEL_OUTPUT');assert.equal(r.modelsReceived,0);assert.equal(r.cashCost,'UNKNOWN')});
t(()=>{const r=report({plan,responses:[good[0]]});assert.equal(r.modelsReceived,1);assert.deepEqual(r.missingRequestIds,[b.requestId])});
t(()=>blocked({plan,responses:[{...good[0],requestId:'unrelated'}]},'RESPONSE_REQUEST_ID_MISMATCH'));
t(()=>{const r=report({plan,responses:good});assert.equal(r.status,'UNTRUSTED_BLEND_REVIEW_ONLY');assert.equal(r.blendAuthoritative,false);assert.equal(r.sourceClaimsVerified,0)});
t(()=>{const r=report({plan,responses:good});assert.equal(r.findings.find(x=>x.key==='value_a').comparison,'AGREEMENT_UNVERIFIED')});
t(()=>{const r=report({plan,responses:good});assert.equal(r.findings.find(x=>x.key==='value_b').comparison,'DISAGREEMENT')});
t(()=>{const r=report({plan,responses:good});const f=r.findings.find(x=>x.key==='missing_value');assert.equal(f.comparison,'NODATA_UNRESOLVED');assert.equal(f.modelAValue,null);assert.equal(f.modelBValue,'0')});
t(()=>blocked({plan,responses:[good[0],{...good[1],providerReportedModel:'nvidia/other'}]},'MODEL_RESPONSE_UNTRUSTED_OR_MISMATCHED'));
t(()=>blocked({plan,responses:[good[0],{...good[1],requestId:a.requestId}]},'DUPLICATE_OR_MISSING_MODEL_RESPONSE'));
t(()=>blocked({plan,responses:[evidence(a,[c('key','one'),c('key','two')]),good[1]]},'INVALID_OR_DUPLICATE_CLAIM'));
t(()=>blocked({plan,responses:[evidence(a,[c('key','x','http://invalid.test')]),good[1]]},'INVALID_OR_DUPLICATE_CLAIM'));
t(()=>{const r=report({plan,responses:good,sourceChecks:[{claimKey:'value_a',sourceUrl:'https://wmo.int/',evidenceStatus:'ORIGINAL_READBACK_SUBMITTED'}]});assert.equal(r.findings.find(x=>x.key==='value_a').submittedOriginalChecks,1);assert.equal(r.sourceClaimsVerified,0)});
t(()=>blocked({plan,responses:good,sourceChecks:[{claimKey:'value_a',sourceUrl:'https://wmo.int/',evidenceStatus:'VERIFIED'}]},'INVALID_SOURCE_EVIDENCE'));
t(()=>{const r=report({plan,responses:good});assert.equal(r.cashCost,'UNKNOWN');assert.equal(r.extraModelCallsTriggered,0);assert.ok(r.exactModels.every(x=>x.costStatus==='NOT_VERIFIED'))});
t(()=>{const r=report({plan,responses:[{...good[0],usageStatus:'UPSTREAM_REPORTED_UNVERIFIED'},good[1]]});assert.equal(r.exactModels[0].usageStatus,'UPSTREAM_REPORTED_UNVERIFIED');assert.equal(r.exactModels[1].usageStatus,'NOT_VERIFIED')});
t(()=>blocked({plan,responses:[good[0],good[1],good[1]]},'INVALID_RESPONSES'));
console.log('MID AI Router two-model synthesis offline QA OK; scenarios='+n+'; no live API used.');
