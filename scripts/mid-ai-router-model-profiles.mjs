/**
 * MID AI Router - 2026-11 model candidate catalog and readback evaluator.
 * This file DOES NOT discover credential availability and NEVER authorizes
 * a live execution grant. Listed prices are historical public observations;
 * fresh account-specific evidence is required for every real request.
 */
const spec=(provider,model,publisher,group,source,modality='text')=>
  Object.freeze({provider,model,publisher,foundationGroup:group,source,
   modality,stage:'PUBLIC_CANDIDATE_ONLY',dispatchAuthorized:false});
export const MID_AI_MODEL_CANDIDATES=Object.freeze([
 spec('groq','openai/gpt-oss-120b','openai','gpt-oss',
  'https://console.groq.com/docs/rate-limits'),
 spec('groq','openai/gpt-oss-20b','openai','gpt-oss',
  'https://console.groq.com/docs/rate-limits'),
 spec('openrouter','cohere/north-mini-code:free','cohere','north-mini',
  'https://openrouter.ai/cohere/north-mini-code%3Afree'),
 spec('openrouter','google/gemma-4-26b-a4b-it:free','google','gemma-4',
  'https://openrouter.ai/google/gemma-4-26b-a4b-it%3Afree'),
 spec('openrouter','nvidia/nemotron-3.5-super-vl:free','nvidia','nemotron-3.5-super',
  'https://openrouter.ai/collections/free-models','image-and-text'),
 spec('gemini','gemini-3.8-flash','google','gemini-3.8',
  'https://ai.google.dev/gemini-api/docs/pricing'),
 spec('gemini','gemini-3.6-flash','google','gemini-3.6',
  'https://ai.google.dev/gemini-api/docs/pricing'),
 spec('vercel-ai-gateway','perplexity/sonar','perplexity','sonar',
  'https://vercel.com/ai-gateway/models/sonar')
]);
const FRESH_MS=30*60*1000;
const isFresh=(time,now)=>{
 const t=typeof time==='string'?Date.parse(time):NaN;
 return Number.isFinite(t)&&t<=now&&now-t<=FRESH_MS;
};
const proof=(x)=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
/**
 * Audit an exact model+account metadata tuple, NEVER upgrade to executable.
 * 'Verified by independent runner' remains untrusted data until a separately
 * controlled signer validates source credentials, network origin and SHA.
 */
export function assessMidAiModelCandidate({
 provider,model,account={},pricing={},privacy={},lineage={},now=Date.now()
}={}){
 const candidate=MID_AI_MODEL_CANDIDATES.find(x=>x.provider===provider&&x.model===model);
 const blockers=[],no=(s)=>{if(!blockers.includes(s))blockers.push(s);};
 if(!candidate)no('MODEL_NOT_IN_RESEARCH_CATALOG');
 const a=proof(account),p=proof(pricing),v=proof(privacy),l=proof(lineage);
 if(a.provider!==provider||a.model!==model||a.tier!=='free'||
    a.hasPaidFallback!==false||a.additionalCashAllowedUsd!==0||
    a.remainingRequests<=0||!Number.isSafeInteger(a.remainingRequests)||
    !isFresh(a.checkedAt,now))no('ACCOUNT_LIMITS_NOT_VERIFIED');
 if(candidate?.provider==='vercel-ai-gateway'){
   no('PRICED_INCLUDED_CREDIT_REQUIRES_SEPARATE_GATE');
 }else if(p.provider!==provider||p.model!==model||
   p.inputUsdPerM!==0||p.outputUsdPerM!==0||p.requestUsd!==0||
   p.currency!=='USD'||!isFresh(p.checkedAt,now))
   no('ZERO_PRICE_NOT_VERIFIED');
 if(v.provider!==provider||v.model!==model||
    v.publicRedactedOnly!==true||v.allowed!==true||
    v.noTrainingOrApprovedProcessing!==true||
    !isFresh(v.checkedAt,now))no('PRIVACY_NOT_VERIFIED');
 if(!candidate||l.provider!==provider||l.model!==model||
    l.foundationPublisher!==candidate?.publisher||
    l.foundationGroup!==candidate?.foundationGroup||
    !/^[a-f0-9]{64}$/.test(l.evidenceSha256||'')||
    !isFresh(l.checkedAt,now))
    no('FOUNDATION_LINEAGE_NOT_VERIFIED');
 if(candidate?.modality==='image-and-text')
   no('CURRENT_EXECUTOR_TEXT_ONLY');
 return Object.freeze({
  provider,model,modelListed:!!candidate,
  foundationPublisher:candidate?.publisher??null,
  foundationGroup:candidate?.foundationGroup??null,
  stage:blockers.length?'EVIDENCE_BLOCKED':'REVIEW_ONLY',
  additionalCashAuthorizedUsd:0,dispatchAuthorized:false,
  accountEvidenceNeverSelfAuthorizes:true,
  blockers:Object.freeze(blockers)
 });
}
/** Research-only independence: different publisher, different actual family. */
export function candidatePairIndependent(a,b){
 const p=MID_AI_MODEL_CANDIDATES.find(x=>x.provider===a?.provider&&x.model===a?.model);
 const q=MID_AI_MODEL_CANDIDATES.find(x=>x.provider===b?.provider&&x.model===b?.model);
 return !!p&&!!q&&p.provider!==q.provider&&
        p.publisher!==q.publisher&&p.foundationGroup!==q.foundationGroup;
}
