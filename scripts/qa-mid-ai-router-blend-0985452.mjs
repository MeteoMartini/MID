#!/usr/bin/env node
/** All blend tests are offline. No secrets, model requests, billing or writes. */
import assert from 'node:assert/strict';
import {planMidAiBlend,MID_AI_RESEARCHED_CANDIDATES} from './mid-ai-router-blend.mjs';
import {MidAiRouterBlocked} from './mid-ai-router.mjs';

const now=Date.parse('2026-11-09T12:00:00.000Z');
const sha='a'.repeat(40);
const snapshot={mainSha:sha,stableSha:sha,version:'0.9.85.451'};
const task={requestId:'mid-blend-qa-0001',userInitiated:true,
 expectedStableSha:sha,kind:'independent-review',dataClass:'public-redacted',
 prompt:'Review public, nonsecret scientific statements only.',maxExternalCalls:2};
const model=(id,name,priority)=>({
 id,model:name,priority,enabled:true,accountTier:'free',hardStopVerified:true,
 paidFallback:false,paidOveragePossible:false,priceInputUsd:0,priceOutputUsd:0,
 freePriceProven:true,credentialPresent:true,modelAvailabilityVerified:true,
 privacyApproved:true,privacyCheckedAt:new Date(now).toISOString(),
 proofCheckedAt:new Date(now).toISOString(),remainingRequests:2,
 capabilities:['independent-review','weather-science','bounded-code-review']
});
const groq=model('groq','openai/gpt-oss-20b',1);
const openrouter=model('openrouter','cohere/north-mini-code:free',2);
const gemini=model('gemini','gemini-2.5-flash',3);
const params=(overrides={})=>({task,snapshot,providers:[groq,openrouter,gemini],
 mode:'independent-two-models',now,...overrides});
let scenarios=0;
const test=(name,fn)=>{fn();scenarios++};
const blocked=(p,reason)=>assert.throws(()=>planMidAiBlend(params(p)),
 e=>e instanceof MidAiRouterBlocked&&e.reason===reason,reason);
test('default single needs no blending',()=>{
 const p=planMidAiBlend(params({mode:'single'}));
 assert.equal(p.mode,'single');assert.equal(p.modelCalls,1);
 assert.equal(p.plans.length,1);assert.equal(p.automaticDispatch,false);
});
test('native github readback is zero external model requests',()=>{
 const p=planMidAiBlend(params({mode:'single',task:{...task,kind:'repo-readback'}}));
 assert.equal(p.modelCalls,0);assert.equal(p.plans[0].provider,'github-native');
});
test('independent dual routes pick different provider and family',()=>{
 const p=planMidAiBlend(params());
 assert.equal(p.status,'PLAN_ONLY');assert.equal(p.modelCalls,2);
 assert.deepEqual(p.plans.map(x=>x.provider),['groq','openrouter']);
 assert.notEqual(p.plans[0].taskFingerprint,p.plans[1].taskFingerprint);
 assert.deepEqual(p.plans.map(x=>x.requestId),['mid-blend-qa-0001-a','mid-blend-qa-0001-b']);
 assert.equal(p.automaticDispatch,false);assert.equal(p.mergeIsAuthoritative,false);
 assert.equal(p.sequentialOneShotAdmissionRequired,true);
});
test('deterministic selection independent of registry order',()=>{
 const p=planMidAiBlend(params({providers:[gemini,openrouter,groq]}));
 assert.deepEqual(p.plans.map(x=>x.provider),['groq','openrouter']);
});
test('different provider not independent when same foundational model family',()=>
 blocked({providers:[groq,{...openrouter,model:'openai/gpt-oss-20b:free'}]},
 'TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED'));
test('Google Gemma through OpenRouter and direct Gemini cannot count twice',()=>
 blocked({providers:[{...openrouter,priority:1,model:'google/gemma-4-26b-a4b-it:free'},gemini]},
 'TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED'));
test('requires explicit two-call user authorization',()=>
 blocked({task:{...task,maxExternalCalls:undefined}},'TWO_CALL_APPROVAL_REQUIRED'));
test('rejects unauthorised third-call budget',()=>
 blocked({task:{...task,maxExternalCalls:3}},'TWO_CALL_APPROVAL_REQUIRED'));
test('rejects silently supplied system authorization',()=>
 blocked({task:{...task,userInitiated:false}},'TWO_CALL_APPROVAL_REQUIRED'));
test('rejects unsupported blend mode',()=>
 blocked({mode:'auto-cascade'},'UNSUPPORTED_BLEND_MODE'));
test('broad external research cannot double-dispatch by default',()=>
 blocked({task:{...task,kind:'external-research'}},'BLEND_TASK_NOT_ELIGIBLE'));
test('private repository text is not eligible',()=>
 blocked({task:{...task,dataClass:'private'}},'DATA_NOT_CLEARED'));
test('long request IDs fail rather than truncate to colliding IDs',()=>
 blocked({task:{...task,requestId:'q'.repeat(71)}},'BLEND_REQUEST_ID_TOO_LONG'));
test('duplicate provider registry cannot amplify effective quota',()=>
 blocked({providers:[groq,groq,openrouter]},'DUPLICATE_PROVIDER_REGISTRY'));
test('missing free evidence on secondary blocks the blend',()=>
 blocked({providers:[groq,{...openrouter,hardStopVerified:undefined}]},
 'TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED'));
test('missing third party credentials cause fail-closed no second call',()=>
 blocked({providers:[groq,{...openrouter,credentialPresent:false}]},
 'TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED'));
test('source of truth drift blocks all model planning',()=>
 blocked({snapshot:{...snapshot,mainSha:'b'.repeat(40)}},'SOURCE_DRIFT'));
test('secrets and missing prompt blocked by underlying independent planner',()=>
 blocked({task:{...task,prompt:'api_key: supersecretlongtoken123'}},'SECRET_PATTERN'));
test('no eligible first provider fails closed',()=>
 blocked({providers:[{...groq,paidFallback:true}]},'NO_VERIFIED_ZERO_COST_PROVIDER'));
test('candidates do not authorize API calls or billing',()=>{
 const catalog=MID_AI_RESEARCHED_CANDIDATES;
 assert.equal(catalog.find(x=>x.id==='github-models').status,'RETIRED_2026_07_30');
 assert.equal(catalog.find(x=>x.id==='github-copilot-fusion').status,
   'EXISTING_SUPPORTED_COPILOT_CLIENT_ONLY');
 assert.equal(catalog.find(x=>x.id==='perplexity-direct').status,'BLOCKED_NO_FREE_API_CREDITS');
 assert.equal(catalog.find(x=>x.id==='mistral-api').status,'BLOCKED_FREE_MODE_NO_API');
 assert.equal(catalog.find(x=>x.id==='vercel-perplexity-sonar').status,
   'CANDIDATE_ACCOUNT_BILLING_PROOF_REQUIRED');
 assert.equal(catalog.find(x=>x.id==='vercel-perplexity-sonar').directExecutionAllowed,false);
 assert.equal(catalog.find(x=>x.id==='vercel-perplexity-sonar').cashRisk,'PAYMENT_METHOD_REQUIRED_SOFT_BUDGET');
 assert.equal(catalog.find(x=>x.id==='cohere-trial').status,
   'EVALUATION_ONLY_NOT_PRODUCTION');
 const p=planMidAiBlend(params());
 assert.ok(!JSON.stringify(p).includes('API_KEY'));
 assert.ok(!JSON.stringify(p).includes('credential'));
 assert.ok(!JSON.stringify(p).includes(task.prompt));
});
console.log('MID AI Router free blend QA OK; scenarios='+scenarios+'; no live API used.');
