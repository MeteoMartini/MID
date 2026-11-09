#!/usr/bin/env node
/** MID AI Router Vercel risk preflight mock QA: no requests or credentials. */
import assert from 'node:assert/strict';
import {assessMidVercelFreeCreditPreflight as assess,
  MID_VERCEL_DISPATCH_ENABLED} from './mid-ai-router-vercel-policy.mjs';
const now=Date.parse('2026-11-09T20:00:00.000Z');
const checkedAt=new Date(now).toISOString();
const teamId='team_WdBAGpkorvKDeFeqvBj9Eysv',modelId='perplexity/sonar';
const fixture=()=>({
 teamId,modelId,now,
 account:{teamId,tier:'free',purchasedCreditsUsd:0,autoTopUpEnabled:false,
  byokEnabled:false,remainingFreeCreditsUsd:5},
 budget:{scope:'api-key',limitUsd:1,refreshPeriod:'none',enforced:true,checkedAt},
 model:{id:modelId,freeTierEligible:true,checkedAt,maxEstimatedRequestUsd:0.01},
 evidence:{origin:'independent-protected-account-readback',teamId,modelId,
  digest:'a'.repeat(64),checkedAt}
});
let count=0;
const test=(fn)=>{fn();count++};
const must=(data,reason)=>{
 const r=assess(data);
 assert.equal(r.dispatchAuthorized,false);
 assert.equal(r.extraCashAuthorizedUsd,0);
 assert.ok(r.blockers.includes(reason),reason);
 return r;
};
test(()=>{const r=assess();assert.equal(r.status,'EVIDENCE_BLOCKED');assert.equal(r.dispatchAuthorized,false)});
test(()=>{const r=assess({budget:{limitUsd:1}});assert.equal(r.status,'EVIDENCE_BLOCKED');assert.equal(r.userReportedDollarLimitIsSoft,true)});
test(()=>{const r=assess(fixture());assert.equal(r.status,'REVIEW_ONLY');assert.equal(r.dispatchAuthorized,false);assert.equal(r.isHardCashCap,false)});
test(()=>{const f=fixture();f.account.tier='paid';must(f,'FREE_ONLY_ACCOUNT_NOT_VERIFIED')});
test(()=>{const f=fixture();f.account.purchasedCreditsUsd=1;must(f,'FREE_ONLY_ACCOUNT_NOT_VERIFIED')});
test(()=>{const f=fixture();delete f.account.autoTopUpEnabled;must(f,'AUTO_TOP_UP_NOT_VERIFIED_DISABLED')});
test(()=>{const f=fixture();f.account.autoTopUpEnabled=true;must(f,'AUTO_TOP_UP_NOT_VERIFIED_DISABLED')});
test(()=>{const f=fixture();f.account.byokEnabled=true;must(f,'BYOK_MUST_BE_DISABLED')});
test(()=>{const f=fixture();f.account.remainingFreeCreditsUsd=undefined;must(f,'FREE_CREDIT_BALANCE_NOT_VERIFIED')});
test(()=>{const f=fixture();f.budget.scope='team';must(f,'ONE_DOLLAR_KEY_BUDGET_NOT_VERIFIED')});
test(()=>{const f=fixture();f.budget.limitUsd=100;must(f,'ONE_DOLLAR_KEY_BUDGET_NOT_VERIFIED')});
test(()=>{const f=fixture();f.budget.enforced=false;must(f,'KEY_BUDGET_ENFORCEMENT_UNVERIFIED')});
test(()=>{const f=fixture();f.budget.checkedAt='2026-11-08T20:00:00.000Z';must(f,'KEY_BUDGET_ENFORCEMENT_UNVERIFIED')});
test(()=>{const f=fixture();f.model.freeTierEligible=undefined;must(f,'MODEL_FREE_TIER_ELIGIBILITY_UNVERIFIED')});
test(()=>{const f=fixture();f.model.maxEstimatedRequestUsd=6;must(f,'SINGLE_REQUEST_CREDIT_HEADROOM_UNVERIFIED')});
test(()=>{const f=fixture();f.evidence.origin='user-screenshot';must(f,'INDEPENDENT_ATTESTATION_MISSING')});
test(()=>{const f=fixture();f.evidence.checkedAt='2026-11-08T20:00:00.000Z';must(f,'INDEPENDENT_ATTESTATION_MISSING')});
test(()=>{const f=fixture();f.teamId='team_unrecognized123';must(f,'TEAM_IDENTITY_NOT_PROVEN')});
test(()=>{const f=fixture();f.modelId='unverified-model';must(f,'MODEL_FREE_TIER_ELIGIBILITY_UNVERIFIED')});
test(()=>{
 const f=fixture();f.key='TOP_SECRET_KEY';f.prompt='private info';
 const r=assess(f);const result=JSON.stringify(r);
 assert.ok(!result.includes(f.key));assert.ok(!result.includes(f.prompt));
 assert.equal(MID_VERCEL_DISPATCH_ENABLED,false);
});
console.log('MID AI Router Vercel soft-budget offline QA OK; scenarios='+count+'; no live API used.');
