#!/usr/bin/env node
/** MID AI Router selector: no automatic priced fallback, offline QA. */
import assert from 'node:assert/strict';
import {planMidAiResearchRoute} from './mid-ai-router-selector.mjs';
import {MID_SONAR_MODEL} from './mid-ai-router-sonar.mjs';
const now=Date.parse('2026-11-10T05:00:00.000Z'),ts=new Date(now).toISOString();
const sha='a'.repeat(40),teamId='team_WdBAGpkorvKDeFeqvBj9Eysv';
const snapshot={mainSha:sha,stableSha:sha,version:'0.9.85.451'};
const task={requestId:'mid-sonar-research-QA01',userInitiated:true,expectedStableSha:sha,
 kind:'external-research',dataClass:'public-redacted',prompt:'Public WMO guidance.'};
const providers=[{id:'openrouter',model:'google/gemma-3-27b-it:free',
 priority:1,enabled:true,accountTier:'free',hardStopVerified:true,
 paidFallback:false,paidOveragePossible:false,priceInputUsd:0,
 priceOutputUsd:0,freePriceProven:true,credentialPresent:true,
 modelAvailabilityVerified:true,privacyApproved:true,privacyCheckedAt:ts,
 proofCheckedAt:ts,remainingRequests:2,capabilities:['external-research']}];
const sonarProof={
 teamId,account:{teamId,tier:'free',purchasedCreditsUsd:0,autoTopUpEnabled:false,
  byokEnabled:false,remainingFreeCreditsUsd:5},
 budget:{scope:'api-key',limitUsd:1,refreshPeriod:'none',enforced:true,checkedAt:ts},
 model:{id:MID_SONAR_MODEL,freeTierEligible:true,checkedAt:ts,maxEstimatedRequestUsd:0.02},
 evidence:{origin:'independent-protected-account-readback',teamId,modelId:MID_SONAR_MODEL,
  digest:'c'.repeat(64),checkedAt:ts}
};
const sonarTask={...task,preferredProvider:'sonar-included-credit',
 allowIncludedCreditUse:true,maxAdditionalCashUsd:0,maxExternalCalls:1};
let count=0;const ok=(name,fn)=>{fn();count++;};
const denial=(args,reason)=>assert.throws(()=>planMidAiResearchRoute(args),
 e=>e?.reason===reason,reason);
ok('default direct free',()=>{
 const p=planMidAiResearchRoute({task,snapshot,providers,now});
 assert.equal(p.provider,'openrouter');assert.equal(p.selection,'DIRECT_FREE_ONLY');
 assert.equal(p.dispatchAuthorized,false);
});
ok('explicit sonar not chosen by priority',()=>{
 const p=planMidAiResearchRoute({task,snapshot,providers,sonarProof,now});
 assert.equal(p.provider,'openrouter');
});
ok('no silent sonar fallback when direct free unavailable',()=>{
 denial({task,snapshot,providers:[],sonarProof,now},'NO_VERIFIED_ZERO_COST_PROVIDER');
});
ok('explicit credit authorization selects sonar',()=>{
 const p=planMidAiResearchRoute({task:sonarTask,snapshot,providers,sonarProof,now});
 assert.equal(p.model,MID_SONAR_MODEL);assert.equal(p.selection,'EXPLICIT_SONAR_CREDIT_ONLY');
 assert.equal(p.dispatchAuthorized,false);assert.equal(p.maxAdditionalCashUsd,0);
});
ok('unknown preference denied',()=>denial({
 task:{...task,preferredProvider:'auto'},snapshot,providers,now
},'UNSUPPORTED_PROVIDER_PREFERENCE'));
ok('missing explicit credit use denied',()=>denial({
 task:{...sonarTask,allowIncludedCreditUse:false},snapshot,sonarProof,now
},'EXPLICIT_SONAR_CREDIT_AUTHORIZATION_REQUIRED'));
ok('spending cash cannot be granted',()=>denial({
 task:{...sonarTask,maxAdditionalCashUsd:1},snapshot,sonarProof,now
},'EXPLICIT_SONAR_CREDIT_AUTHORIZATION_REQUIRED'));
ok('double billable request denied',()=>denial({
 task:{...sonarTask,maxExternalCalls:2},snapshot,sonarProof,now
},'EXPLICIT_SONAR_CREDIT_AUTHORIZATION_REQUIRED'));
ok('private request denied',()=>denial({
 task:{...sonarTask,dataClass:'private'},snapshot,sonarProof,now
},'EXPLICIT_SONAR_CREDIT_AUTHORIZATION_REQUIRED'));
ok('missing user authorization denied',()=>denial({
 task:{...sonarTask,userInitiated:false},snapshot,sonarProof,now
},'USER_AUTHORIZATION_REQUIRED'));
ok('no account proof denied',()=>denial({
 task:sonarTask,snapshot,sonarProof:null,now
},'SONAR_ACCOUNT_PROOF_REQUIRED'));
ok('unverified model free tier cannot be routed',()=>{
 const p={...sonarProof,model:{...sonarProof.model,freeTierEligible:false}};
 denial({task:sonarTask,snapshot,sonarProof:p,now},'VERCEL_EVIDENCE_BLOCKED');
});
ok('never claim a planned Sonar route was dispatched',()=>{
 const p=planMidAiResearchRoute({task:sonarTask,snapshot,sonarProof,now});
 assert.equal(p.status,'PLAN_ONLY');
 assert.ok(!JSON.stringify(p).includes('FAKE_TEST_KEY'));
});
console.log('MID AI Router research selection offline QA OK; scenarios='+count+'; no live API used.');
