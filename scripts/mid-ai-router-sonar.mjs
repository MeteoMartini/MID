/**
 * MID AI Router: Sonar / Vercel AI Gateway fixed-model adapter.
 *
 * Non-production, OFFLINE-only. It creates a bounded, exact-model request
 * envelope and validates its untrusted citations; it never calls the network.
 * Free $5 credits and a $1 API-key budget do not imply a zero-priced model or
 * a hard cost ceiling. There is no deployable execution path in this module.
 */
import {createHash} from 'node:crypto';
import {assessMidVercelFreeCreditPreflight} from './mid-ai-router-vercel-policy.mjs';

export const MID_SONAR_MODEL='perplexity/sonar';
export const MID_SONAR_ENDPOINT='https://ai-gateway.vercel.sh/v1/chat/completions';
export const MID_SONAR_LIVE_DISPATCH_ALLOWED=false;
const SHA40=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
const MAX_PROMPT_CHARS=1800;
const MAX_RESPONSE_BYTES=65536;
const MAX_OUTPUT_TOKENS=256;
const block=(reason)=>{const e=new Error('MID Sonar blocked: '+reason);e.name='MidAiSonarBlocked';e.reason=reason;throw e;};
const fingerprint=(task)=>createHash('sha256').update(JSON.stringify([
  task.requestId,task.kind,task.dataClass,task.expectedStableSha,task.prompt
])).digest('hex');
function validTask(task,snapshot){
 if(!task||task.userInitiated!==true)block('USER_AUTHORIZATION_REQUIRED');
 if(!ID.test(task.requestId||''))block('INVALID_REQUEST_ID');
 if(task.kind!=='external-research'||task.dataClass!=='public-redacted')
   block('ONLY_PUBLIC_REDACTED_RESEARCH');
 if(typeof task.prompt!=='string'||!task.prompt.trim()||task.prompt.length>MAX_PROMPT_CHARS)
   block('INVALID_PROMPT');
 if(/(?:api[_-]?key|bearer|password|secret|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{12,}/i.test(task.prompt))
   block('SECRET_PATTERN');
 if(!SHA40.test(task.expectedStableSha||'')||!snapshot||
     !SHA40.test(snapshot.mainSha||'')||!SHA40.test(snapshot.stableSha||'')||
     snapshot.mainSha!==snapshot.stableSha||
     task.expectedStableSha!==snapshot.stableSha||
     !VERSION.test(snapshot.version||''))
   block('SOURCE_DRIFT');
}
/**
 * A PLAN is not a dispatch grant. These fields cannot be used as an
 * attestation; all provider and account evidence must be checked by
 * a separate protected signer and secure runner before real execution.
 */
export function planMidAiSonar({task,snapshot,teamId,account,budget,model,evidence,now=Date.now()}={}){
 validTask(task,snapshot);
 const audit=assessMidVercelFreeCreditPreflight({
   teamId,modelId:MID_SONAR_MODEL,account,budget,model,evidence,now
 });
 if(audit.status!=='REVIEW_ONLY'||audit.blockers.length)block('VERCEL_EVIDENCE_BLOCKED');
 if(!Number.isSafeInteger(now))block('INVALID_EVIDENCE_TIME');
 return Object.freeze({
   status:'PLAN_ONLY',
   provider:'vercel-ai-gateway',model:MID_SONAR_MODEL,
   requestId:task.requestId,expectedStableSha:snapshot.stableSha,
   version:snapshot.version,taskFingerprint:fingerprint(task),
   maxOutputTokens:MAX_OUTPUT_TOKENS,maxAdditionalCashUsd:0,
   costClass:'PRICED_INCLUDED_CREDIT_ONLY',
   dispatchAuthorized:false,requiresIndependentSignedGrant:true
 });
}
/** Build only; no HTTP call or secret storage. */
export function buildMidAiSonarRequest({plan,task,credential}={}){
 if(!plan||plan.status!=='PLAN_ONLY'||plan.dispatchAuthorized!==false||
    plan.model!==MID_SONAR_MODEL||plan.provider!=='vercel-ai-gateway'||
    plan.maxAdditionalCashUsd!==0||plan.maxOutputTokens!==MAX_OUTPUT_TOKENS||
    !task||fingerprint(task)!==plan.taskFingerprint||
    task.requestId!==plan.requestId||task.expectedStableSha!==plan.expectedStableSha)
   block('PLAN_STALE');
 if(typeof credential!=='string'||credential.length<12||credential.length>1024)
   block('MISSING_CREDENTIAL');
 validTask(task,{mainSha:plan.expectedStableSha,stableSha:plan.expectedStableSha,version:plan.version});
 return Object.freeze({
   url:MID_SONAR_ENDPOINT,
   headers:Object.freeze({
     'content-type':'application/json','authorization':'Bearer '+credential
   }),
   body:JSON.stringify({
     model:MID_SONAR_MODEL,
     messages:[{role:'user',content:task.prompt}],
     stream:false,max_tokens:MAX_OUTPUT_TOKENS,
     providerOptions:{gateway:{
       only:['perplexity'],zeroDataRetention:true
     }}
   })
 });
}
function httpsSource(value){
 if(typeof value!=='string'||value.length>2048)return null;
 try {
   const u=new URL(value);
   if(u.protocol!=='https:'||!u.hostname||u.username||u.password)return null;
   return u.href;
 }catch{return null;}
}
/** Parse complete, byte-limited, UNTRUSTED provider response after transport. */
export function parseMidAiSonarResponse({plan,raw}={}){
 if(plan?.status!=='PLAN_ONLY'||plan.model!==MID_SONAR_MODEL)
   block('UNAUTHORIZED_RESPONSE_PLAN');
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_RESPONSE_BYTES)
   block('INVALID_RESPONSE_SIZE');
 let data;try{data=JSON.parse(raw);}catch{block('INVALID_RESPONSE_JSON');}
 if(data?.model!==MID_SONAR_MODEL)block('RESPONSE_MODEL_MISMATCH');
 const choice=data?.choices?.[0],text=choice?.message?.content;
 if(choice?.finish_reason!=='stop'||typeof text!=='string'||!text.trim())
   block('EMPTY_OR_INCOMPLETE_RESPONSE');
 const sources=[];
 const add=(value)=>{const url=httpsSource(value);if(url&&!sources.includes(url)&&sources.length<20)sources.push(url);};
 if(Array.isArray(data?.citations))for(const url of data.citations)add(url);
 if(Array.isArray(data?.search_results))for(const item of data.search_results)add(item?.url);
 if(!sources.length)block('CITATIONS_MISSING');
 const usage=data.usage&&typeof data.usage==='object'&&!Array.isArray(data.usage)?
   {promptTokens:Number.isSafeInteger(data.usage.prompt_tokens)&&data.usage.prompt_tokens>=0?data.usage.prompt_tokens:null,
    completionTokens:Number.isSafeInteger(data.usage.completion_tokens)&&data.usage.completion_tokens>=0?data.usage.completion_tokens:null}:null;
 return Object.freeze({
   status:'UNTRUSTED_CITATION_REVIEW_ONLY',model:data.model,
   requestId:plan.requestId,expectedStableSha:plan.expectedStableSha,
   text:text.slice(0,16000),citations:Object.freeze(sources),
   providerReportedUsage:usage,
   usageStatus:usage?'UPSTREAM_REPORTED_UNVERIFIED':'NOT_VERIFIED',
   costStatus:'NOT_VERIFIED',cashSpendStatus:'NOT_VERIFIED',
   generationId:typeof data.id==='string'?data.id.slice(0,128):null
 });
}
export function dispatchMidAiSonar(){
 // No public HTTP path exists until a separately secured, signed, globally
 // durable runner with independently verified Free credit admission is audited.
 block('SONAR_LIVE_RUNNER_NOT_RELEASED');
}
