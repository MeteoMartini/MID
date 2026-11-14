/**
 * MID AI Router model research and multi-model blend planner.
 * QA/DRAFT ONLY. No network or model dispatch.
 * Static research is information, NOT a cost/free-tier attestation.
 * Actual direct dispatch still needs signed, fresh account-specific proof.
 * Publisher evidence must be independently attested; provider/gateway model IDs
 * are not themselves provenance of a distinct foundation family.
 */
import {planMidAiRoute,MidAiRouterBlocked} from './mid-ai-router.mjs';

const block=reason=>{throw new MidAiRouterBlocked(reason);};
const EVIDENCE_DATE='2026-11-09';
const MODES=new Set(['single','independent-two-models']);
const TWO_KINDS=new Set(['independent-review','bounded-code-review','weather-science']);
export const MID_AI_RESEARCHED_CANDIDATES=Object.freeze([
  Object.freeze({id:'groq',status:'EXISTING_DIRECT_QA',costType:'free-rate-limited'}),
  Object.freeze({id:'openrouter',status:'EXISTING_DIRECT_QA',costType:'free-suffix-only'}),
  Object.freeze({id:'gemini',status:'EXISTING_DIRECT_QA',costType:'free-unbilled-project-only'}),
  Object.freeze({id:'github-copilot',status:'EXISTING_GITHUB_BRIDGE',costType:'included-subscription-limits'}),
  Object.freeze({id:'github-copilot-fusion',status:'EXISTING_SUPPORTED_COPILOT_CLIENT_ONLY',costType:'included-ai-credit-budget-not-api'}),
  Object.freeze({id:'cohere-trial',status:'EVALUATION_ONLY_NOT_PRODUCTION',costType:'free-trial-key'}),
  Object.freeze({id:'sambanova',status:'CANDIDATE_NO_KEY_OR_ATTESTER',costType:'free-account-rate-limited'}),
  Object.freeze({id:'cloudflare-workers-ai',status:'CANDIDATE_FREE_PLAN_ONLY',costType:'10000-free-neurons-per-day'}),
  Object.freeze({id:'vercel-perplexity-sonar',status:'CANDIDATE_ACCOUNT_BILLING_PROOF_REQUIRED',costType:'included-monthly-5-usd-credits-not-zero-price',cashRisk:'PAYMENT_METHOD_REQUIRED_SOFT_BUDGET',directExecutionAllowed:false}),
  Object.freeze({id:'huggingface-inference',status:'LOW_PRIORITY_CREDIT_GRANT',costType:'included-monthly-0.10-usd-credits'}),
  Object.freeze({id:'perplexity-direct',status:'BLOCKED_NO_FREE_API_CREDITS',costType:'paid-api'}),
  Object.freeze({id:'github-models',status:'RETIRED_2026_07_30',costType:'unavailable'}),
  Object.freeze({id:'mistral-api',status:'BLOCKED_FREE_MODE_NO_API',costType:'billing-activation-required'}),
  Object.freeze({id:'cerebras',status:'BLOCKED_NOT_RECURRING_FREE',costType:'trial-credit-only'}),
  Object.freeze({id:'chatgpt-plus-api',status:'BLOCKED_PLUS_NO_API_GRANT',costType:'separate-api-billing'})
]);
export const MID_AI_RESEARCH_DATE=EVIDENCE_DATE;

// Independent reviews require canonical model-publisher identity, NOT a
// gateway namespace or the first token of an upstream model ID. This is a
// separate, account-verified attestation whose evidence is included in the
// execution grant's signed proofFingerprint (see mid-ai-router.mjs).
// Unknown aliases fail closed rather than falsely claiming independence.
const PUBLISHER_ALIASES=Object.freeze({
  'meta':'meta','meta-llama':'meta','openai':'openai','cohere':'cohere',
  'google':'google','qwen':'qwen','deepseek':'deepseek',
  'mistral':'mistral','mistralai':'mistral'
});
const LINEAGE_FRESH_MS=6*60*60*1000;
function expectedPublisher(p){
  if(!p||typeof p.model!=='string')return null;
  if(p.id==='gemini')return 'google';
  let namespace=null;
  if(p.id==='openrouter'){
    if(!p.model.includes('/'))return null;
    namespace=p.model.split('/')[0];
  }else if(p.id==='groq'){
    if(/^llama[-/]/.test(p.model))namespace='meta';
    else if(/^gemma[-/]/.test(p.model))namespace='google';
    else if(/^qwen[-/]/.test(p.model))namespace='qwen';
    else if(/^deepseek[-/]/.test(p.model))namespace='deepseek';
    else if(p.model.includes('/'))namespace=p.model.split('/')[0];
  }
  return Object.hasOwn(PUBLISHER_ALIASES,namespace)?PUBLISHER_ALIASES[namespace]:null;
}
function family(p,now){
  if(p?.lineageVerified!==true ||
     typeof p.foundationPublisher!=='string' ||
     !/^[a-z][a-z0-9_-]{1,39}$/.test(p.foundationPublisher) ||
     !/^[a-f0-9]{64}$/.test(p.lineageEvidenceSha256||'') ||
     typeof p.lineageCheckedAt!=='string')return null;
  const checked=Date.parse(p.lineageCheckedAt);
  if(!Number.isFinite(checked)||checked>now||now-checked>LINEAGE_FRESH_MS)
    return null;
  const expected=expectedPublisher(p);
  return expected!==null&&expected===p.foundationPublisher?expected:null;
}
/**
 * Deliberate bounded two-model PLAN, never automatic fanout.
 * Caller must approve task.maxExternalCalls=2. Each route still requires
 * separate signed one-shot grant and durable claim before any dispatch.
 * Different gateways for same foundation model family are not independent.
 */
export function planMidAiBlend({task,snapshot,providers=[],mode='single',now=Date.now()}) {
  if(!MODES.has(mode))block('UNSUPPORTED_BLEND_MODE');
  if(mode==='single'){
    const plan=planMidAiRoute({task,snapshot,providers,now});
    return Object.freeze({
      status:'PLAN_ONLY',mode,modelCalls:plan.provider==='github-native'?0:1,
      plans:Object.freeze([plan]),automaticDispatch:false,mergeIsAuthoritative:false
    });
  }
  if(!task || task.userInitiated!==true || task.maxExternalCalls!==2)
    block('TWO_CALL_APPROVAL_REQUIRED');
  if(!TWO_KINDS.has(task.kind))block('BLEND_TASK_NOT_ELIGIBLE');
  if(task.dataClass!=='public-redacted')block('DATA_NOT_CLEARED');
  if(typeof task.requestId!=='string' || task.requestId.length>70)
    block('BLEND_REQUEST_ID_TOO_LONG');
  if(!Array.isArray(providers))block('INVALID_PROVIDER_REGISTRY');
  const ids=providers.map(p=>p?.id);
  if(new Set(ids).size!==ids.length)block('DUPLICATE_PROVIDER_REGISTRY');
  const primaryTask={...task,requestId:task.requestId+'-a'};
  const secondaryTask={...task,requestId:task.requestId+'-b'};
  const first=planMidAiRoute({task:primaryTask,snapshot,providers,now});
  if(first.provider==='github-native')block('BLEND_GITHUB_READBACK_ONLY');
  const selected=providers.find(p=>p.id===first.provider);
  const firstFamily=family(selected,now);
  if(!firstFamily)block('UNKNOWN_PRIMARY_MODEL_FAMILY');
  const candidates=providers.filter(p=>p.id!==first.provider &&
    family(p,now)!==null && family(p,now)!==firstFamily);
  let second;
  try {
    second=planMidAiRoute({task:secondaryTask,snapshot,providers:candidates,now});
  }catch(e){
    if(e?.reason==='NO_VERIFIED_ZERO_COST_PROVIDER')
      block('TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED');
    throw e;
  }
  if(second.provider===first.provider || second.provider==='github-native')
    block('TWO_INDEPENDENT_FREE_PROVIDERS_REQUIRED');
  const plans=Object.freeze([first,second]);
  return Object.freeze({
    status:'PLAN_ONLY',mode,modelCalls:2,plans,automaticDispatch:false,
    mergeIsAuthoritative:false,sourceVerification:'OFFICIAL_ORIGINALS_REQUIRED',
    requestIdRule:'input-requestId-plus-a-or-b',
    sequentialOneShotAdmissionRequired:true
  });
}
