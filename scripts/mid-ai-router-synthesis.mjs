/**
 * MID AI Router: offline comparison of two ACTUALLY RETURNED untrusted model
 * answers. This never sends a request, never upgrades source links to proof,
 * and cannot authorize a release or official meteorological warning.
 */
import {candidatePairIndependent} from './mid-ai-router-model-profiles.mjs';
const deny=(reason)=>{const e=new Error('MID blend evidence blocked: '+reason);
  e.name='MidAiBlendEvidenceBlocked';e.reason=reason;throw e;};
const finiteText=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const https=(value)=>{
 if(typeof value!=='string'||value.length>2048)return null;
 try{const url=new URL(value);
  if(url.protocol!=='https:'||!url.hostname||url.username||url.password) return null;
  return url.href;
 }catch{return null;}
};
const SHA40=/^[a-f0-9]{40}$/;
const NAME=/^[a-z][a-z0-9_-]{0,63}$/;
const yes=(x)=>x!==null&&typeof x==='object'&&!Array.isArray(x);
/**
 * Untrusted review report. Absence of a provider answer remains PENDING, not
 * a synthetic answer and never zero cost. Source checks are CLAIMED, not
 * automatically verified, even when the URL looks official.
 */
export function summarizeMidAiBlend({plan,responses=[],sourceChecks=[]}={}){
 if(!plan||plan.status!=='PLAN_ONLY'||plan.mode!=='independent-two-models'||
   plan.modelCalls!==2||!Array.isArray(plan.plans)||plan.plans.length!==2||
   plan.automaticDispatch!==false||plan.mergeIsAuthoritative!==false)
   deny('NOT_AN_AUTHORIZED_TWO_MODEL_PLAN');
 const [a,b]=plan.plans;
 if(!a||!b||a.status!=='PLAN_ONLY'||b.status!=='PLAN_ONLY'||
   !finiteText(a.requestId,80)||!finiteText(b.requestId,80)||
   a.requestId===b.requestId||
   !SHA40.test(a.expectedStableSha||'')||
   a.expectedStableSha!==b.expectedStableSha||
   !candidatePairIndependent(a,b))
   deny('NOT_TWO_INDEPENDENT_MODEL_FAMILIES');
 if(!Array.isArray(responses)||responses.length>2)
   deny('INVALID_RESPONSES');
 if(!Array.isArray(sourceChecks)||sourceChecks.length>100)
   deny('INVALID_SOURCE_EVIDENCE');
 const seen=new Set();
 for(const result of responses){
   if(!result||![a.requestId,b.requestId].includes(result.requestId))
     deny('RESPONSE_REQUEST_ID_MISMATCH');
   if(seen.has(result.requestId))deny('DUPLICATE_OR_MISSING_MODEL_RESPONSE');
   seen.add(result.requestId);
 }
 const pending=[a,b].filter(x=>!seen.has(x.requestId));
 if(pending.length){
   return Object.freeze({
     status:'PENDING_LIVE_MODEL_OUTPUT',modelsExpected:2,modelsReceived:responses.length,
     missingRequestIds:Object.freeze(pending.map(x=>x.requestId)),
     cashCost:'UNKNOWN',sourceClaimsVerified:0,blendAuthoritative:false,
     extraModelCallsTriggered:0
   });
 }
 if(responses.length!==2)deny('INVALID_RESPONSES');
 const rows=[a,b].map(p=>{
   const matching=responses.filter(r=>r?.requestId===p.requestId);
   if(matching.length!==1)deny('DUPLICATE_OR_MISSING_MODEL_RESPONSE');
   const x=matching[0];
   // Two explicitly different, untrusted evidence shapes are supported:
   // legacy structured QA reports and actual one-shot executor receipts.
   // The executor never extracts original-source claims. Do not synthesize
   // such claims from free-form text or accept caller-injected claim arrays.
   const fromExecutor=Object.hasOwn(x,'actualModel')||
                      Object.hasOwn(x,'stableSha');
   const servedModel=fromExecutor?x.actualModel:x.providerReportedModel;
   const sourceSha=fromExecutor?x.stableSha:x.expectedStableSha;
   const rawClaims=fromExecutor?[]:x.claims;
   if(x.status!=='UNTRUSTED_REVIEW_ONLY'||x.provider!==p.provider||
     x.model!==p.model||servedModel!==p.model||
     sourceSha!==p.expectedStableSha||
     !finiteText(x.text,16000)||!Array.isArray(rawClaims)||rawClaims.length>50||
     (fromExecutor&&(Object.hasOwn(x,'claims')||
       x.costStatus!=='NOT_VERIFIED'||x.cashSpendStatus!=='NOT_VERIFIED'||
       (Object.hasOwn(x,'providerReportedModel')&&x.providerReportedModel!==x.actualModel)||
       (Object.hasOwn(x,'expectedStableSha')&&x.expectedStableSha!==x.stableSha))))
      deny('MODEL_RESPONSE_UNTRUSTED_OR_MISMATCHED');
   const claims=new Map();
   for(const c of rawClaims){
     if(!yes(c)||!NAME.test(c.key||'')||
       !(c.value===null||typeof c.value==='string'&&c.value.length<=250)||
       !https(c.sourceUrl)||claims.has(c.key))
       deny('INVALID_OR_DUPLICATE_CLAIM');
     claims.set(c.key,Object.freeze({value:c.value,sourceUrl:https(c.sourceUrl)}));
   }
   return {requestId:p.requestId,provider:p.provider,model:p.model,
     claims,textExcerpt:x.text.slice(0,1200),fromExecutor,
     usageStatus:x.usageStatus==='UPSTREAM_REPORTED_UNVERIFIED'?
        'UPSTREAM_REPORTED_UNVERIFIED':'NOT_VERIFIED',
     costStatus:'NOT_VERIFIED'};
 });
 const keys=[...new Set(rows.flatMap(x=>[...x.claims.keys()]))].sort();
 const checks=sourceChecks.map(x=>{
   if(!yes(x)||!NAME.test(x.claimKey||'')||
     !https(x.sourceUrl)||x.evidenceStatus!=='ORIGINAL_READBACK_SUBMITTED')
     deny('INVALID_SOURCE_EVIDENCE');
   return {key:x.claimKey,sourceUrl:https(x.sourceUrl)};
 });
 const findings=keys.map(key=>{
   const left=rows[0].claims.get(key),right=rows[1].claims.get(key);
   const hasBoth=!!left&&!!right;
   // null is MISSING/NoData, never numeric zero.
   const comparison=!hasBoth?'ONE_MODEL_ONLY':
     left.value===null||right.value===null?'NODATA_UNRESOLVED':
     left.value===right.value?'AGREEMENT_UNVERIFIED':'DISAGREEMENT';
   const sources=[...new Set([left?.sourceUrl,right?.sourceUrl].filter(Boolean))];
   const submittedChecks=checks.filter(x=>x.key===key&&sources.includes(x.sourceUrl)).length;
   return Object.freeze({key,
     modelAValue:left?.value??null,modelBValue:right?.value??null,
     comparison,sourceUrls:Object.freeze(sources),
     submittedOriginalChecks:submittedChecks,originalsActuallyVerified:false});
 });
 return Object.freeze({
   status:'UNTRUSTED_BLEND_REVIEW_ONLY',modelsExpected:2,modelsReceived:2,
   exactModels:Object.freeze(rows.map(x=>({requestId:x.requestId,provider:x.provider,
     model:x.model,usageStatus:x.usageStatus,costStatus:x.costStatus}))),
   findings:Object.freeze(findings),
   // Text remains visible for side-by-side review without inventing claims.
   // Nothing in this result verifies or endorses either model answer.
   untrustedAnswerExcerpts:Object.freeze(rows.map(x=>Object.freeze({
     requestId:x.requestId,provider:x.provider,model:x.model,
     textExcerpt:x.textExcerpt,originalSourceVerified:false
   }))),
   nativeExecutorReceipts:rows.filter(x=>x.fromExecutor).length,
   sourceClaimsVerified:0, // Submitted review flags are NOT independent signed proof.
   cashCost:'UNKNOWN',extraModelCallsTriggered:0,blendAuthoritative:false,
   needIndependentOriginalSourceReview:true,
   recommendation:'DO_NOT_AUTO_ACCEPT_MODEL_AGREEMENT'
 });
}
