#!/usr/bin/env node
import assert from 'node:assert/strict';
import {
 MID_AI_MODEL_CANDIDATES as C,assessMidAiModelCandidate as assess,
 candidatePairIndependent as independent
} from './mid-ai-router-model-profiles.mjs';
let n=0;const test=(f)=>{f();n++};
const ref={provider:'groq',model:'openai/gpt-oss-120b'};
const now=Date.parse('2026-11-10T08:00:00.000Z'),time=new Date(now).toISOString();
const proof=()=>({
 ...ref,now,
 account:{...ref,tier:'free',hasPaidFallback:false,additionalCashAllowedUsd:0,
  remainingRequests:12,checkedAt:time},
 pricing:{...ref,currency:'USD',inputUsdPerM:0,outputUsdPerM:0,requestUsd:0,checkedAt:time},
 privacy:{...ref,publicRedactedOnly:true,allowed:true,
  noTrainingOrApprovedProcessing:true,checkedAt:time},
 lineage:{...ref,foundationPublisher:'openai',foundationGroup:'gpt-oss',
  evidenceSha256:'f'.repeat(64),checkedAt:time}
});
const missing=(obj,code)=>{const a=assess(obj);
 assert.equal(a.dispatchAuthorized,false);
 assert.ok(a.blockers.includes(code),code);};
test(()=>assert.equal(C.length,8));
test(()=>assert.equal(new Set(C.map(x=>x.provider+':'+x.model)).size,C.length));
test(()=>assert.ok(C.every(x=>x.dispatchAuthorized===false&&x.stage==='PUBLIC_CANDIDATE_ONLY')));
test(()=>assert.ok(C.filter(x=>x.provider==='openrouter').every(x=>x.model.endsWith(':free'))));
test(()=>{const a=assess(proof());assert.equal(a.stage,'REVIEW_ONLY');assert.equal(a.dispatchAuthorized,false)});
test(()=>missing({...proof(),account:{...proof().account,hasPaidFallback:true}},'ACCOUNT_LIMITS_NOT_VERIFIED'));
test(()=>missing({...proof(),account:{...proof().account,remainingRequests:0}},'ACCOUNT_LIMITS_NOT_VERIFIED'));
test(()=>missing({...proof(),pricing:{...proof().pricing,outputUsdPerM:0.01}},'ZERO_PRICE_NOT_VERIFIED'));
test(()=>missing({...proof(),pricing:{}},'ZERO_PRICE_NOT_VERIFIED'));
test(()=>missing({...proof(),privacy:{...proof().privacy,noTrainingOrApprovedProcessing:false}},'PRIVACY_NOT_VERIFIED'));
test(()=>missing({...proof(),lineage:{...proof().lineage,foundationPublisher:'meta'}},'FOUNDATION_LINEAGE_NOT_VERIFIED'));
test(()=>missing({...proof(),lineage:{...proof().lineage,checkedAt:'2026-11-09T00:00:00Z'}},'FOUNDATION_LINEAGE_NOT_VERIFIED'));
test(()=>missing({provider:'openrouter',model:'openrouter/free'},'MODEL_NOT_IN_RESEARCH_CATALOG'));
test(()=>missing({provider:'vercel-ai-gateway',model:'perplexity/sonar'},
 'PRICED_INCLUDED_CREDIT_REQUIRES_SEPARATE_GATE'));
test(()=>missing({provider:'openrouter',model:'nvidia/nemotron-3.5-super-vl:free'},
 'CURRENT_EXECUTOR_TEXT_ONLY'));
test(()=>assert.equal(independent(
 {provider:'groq',model:'openai/gpt-oss-120b'},
 {provider:'openrouter',model:'cohere/north-mini-code:free'}),true));
test(()=>assert.equal(independent(
 {provider:'groq',model:'openai/gpt-oss-120b'},
 {provider:'groq',model:'openai/gpt-oss-20b'}),false));
test(()=>assert.equal(independent(
 {provider:'openrouter',model:'google/gemma-4-26b-a4b-it:free'},
 {provider:'gemini',model:'gemini-3.6-flash'}),false));
test(()=>assert.equal(independent(
 {provider:'openrouter',model:'google/gemma-4-26b-a4b-it:free'},
 {provider:'gemini',model:'gemini-3.8-flash'}),false));
test(()=>assert.equal(independent(
 {provider:'groq',model:'openai/gpt-oss-120b'},
 {provider:'openrouter',model:'openrouter/free'}),false));
test(()=>assert.ok(!JSON.stringify(assess(proof())).includes('api_key')));
console.log('MID AI Router model profile QA OK; scenarios='+n+'; no account/API network used.');
