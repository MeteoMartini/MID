/**
 * MID AI Router — Vercel AI Gateway credit/account PRECHECK only.
 *
 * A user-configured $1 budget is a SOFT CAP; it does not authorize a cash
 * spend or a single live request. Included $5 credits are NOT a zero-priced
 * foundation model. No API keys, network calls, approvals or dispatch here.
 * Never treat this evaluator as a signed account/billing attester.
 */
export const MID_VERCEL_DISPATCH_ENABLED=false;
const finite=(value)=>typeof value==='number'&&Number.isFinite(value)&&value>=0;
const fresh=(iso,now)=>{
 const time=typeof iso==='string'?Date.parse(iso):NaN;
 return Number.isFinite(time)&&time<=now&&now-time<=5*60*1000;
};
const SHA=/^[a-f0-9]{64}$/;
const TEAM=/^team_[a-zA-Z0-9]{6,64}$/;
export function assessMidVercelFreeCreditPreflight({
  teamId=null,modelId=null,account={},budget={},model={},evidence={},
  now=Date.now()
}={}){
 const blockers=[];
 const deny=(code)=>{if(!blockers.includes(code))blockers.push(code);};
 if(!TEAM.test(teamId||'')||account.teamId!==teamId)
   deny('TEAM_IDENTITY_NOT_PROVEN');
 if(account.tier!=='free'||account.purchasedCreditsUsd!==0)
   deny('FREE_ONLY_ACCOUNT_NOT_VERIFIED');
 if(account.autoTopUpEnabled!==false)
   deny('AUTO_TOP_UP_NOT_VERIFIED_DISABLED');
 if(account.byokEnabled!==false)
   deny('BYOK_MUST_BE_DISABLED');
 if(!finite(account.remainingFreeCreditsUsd)||account.remainingFreeCreditsUsd<=0)
   deny('FREE_CREDIT_BALANCE_NOT_VERIFIED');
 if(budget.scope!=='api-key'||!finite(budget.limitUsd)||budget.limitUsd!==1)
   deny('ONE_DOLLAR_KEY_BUDGET_NOT_VERIFIED');
 if(!['none','daily','weekly','monthly'].includes(budget.refreshPeriod))
   deny('KEY_BUDGET_RESET_UNVERIFIED');
 if(budget.enforced!==true||!fresh(budget.checkedAt,now))
   deny('KEY_BUDGET_ENFORCEMENT_UNVERIFIED');
 if(typeof modelId!=='string'||!/^([a-z0-9_-]+)\/([a-z0-9_.-]+)$/.test(modelId)||
     model.id!==modelId||model.freeTierEligible!==true||
     !fresh(model.checkedAt,now))
   deny('MODEL_FREE_TIER_ELIGIBILITY_UNVERIFIED');
 if(!finite(model.maxEstimatedRequestUsd)||model.maxEstimatedRequestUsd<=0||
     !finite(account.remainingFreeCreditsUsd)||
     model.maxEstimatedRequestUsd>=account.remainingFreeCreditsUsd)
   deny('SINGLE_REQUEST_CREDIT_HEADROOM_UNVERIFIED');
 if(evidence.origin!=='independent-protected-account-readback'||
     evidence.teamId!==teamId||evidence.modelId!==modelId||
     !SHA.test(evidence.digest||'')||!fresh(evidence.checkedAt,now))
   deny('INDEPENDENT_ATTESTATION_MISSING');
 // Even passing this report NEVER certifies source, signer, or global
 // exactly-once state; the separate executor has no Vercel adapter.
 return Object.freeze({
   status:blockers.length?'EVIDENCE_BLOCKED':'REVIEW_ONLY',
   provider:'vercel-ai-gateway',
   dispatchAuthorized:false,
   extraCashAuthorizedUsd:0,
   isHardCashCap:false,
   userReportedDollarLimitIsSoft:true,
   modelFreeTierIsNotZeroListPrice:true,
   blockers:Object.freeze(blockers),
   nextGate:'INDEPENDENT_SIGNED_ZERO_CASH_ATTESTATION_AND_RUNNER_QA'
 });
}
