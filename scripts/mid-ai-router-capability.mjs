/**
 * MID AI Router 1.2 – task-to-surface orchestration policy.
 *
 * NONPRODUCTION pure planner. Host capabilities and quality evidence are
 * untrusted input until independently verified. No SDK invocation, mode
 * switch, GitHub issue, external inference, billing or network is performed.
 * Outputs NEVER constitute a dispatch grant or authority to spend.
 */
const SHA40 = /^[a-f0-9]{40}$/;
const VERSION = /^0\.\d+\.\d+\.\d+$/;
const INTENTS = new Set([
  'repo-readback','source-code-change','research','multi-step-work',
  'ux-audit','telemetry-audit','weather-science','independent-review'
]);
const MODE = new Set(['chat','work','codex']);
const CANDIDATE_AGE_MS=14*24*60*60*1000;
const make = (lane,status,reason,additional={})=>Object.freeze({
  lane,status,reason,dispatchPerformed:false,dispatchAuthorized:false,
  externalCallsMade:0,additionalCashAuthorizedUsd:0,...additional
});
const toolReady=(tools,id,operation='read')=>{
  const t=tools?.[id];
  return t?.connected===true && t?.authenticated===true &&
    (operation==='write' ? t?.canWrite===true : t?.canRead===true);
};
const toolsUsed=(tools,names)=>Object.freeze(names.filter(x=>toolReady(tools,x)));
const candidateReady=(p,task,now)=>{
  const q=p?.quality;
  return typeof p?.provider==='string' && typeof p?.model==='string' &&
    p?.freeAccountVerified===true && p?.zeroPriceVerified===true &&
    p?.noPaidOverageVerified===true && p?.privacyApproved===true &&
    p?.exactModelAvailable===true && p?.remainingRequests>0 &&
    Array.isArray(p?.taskKinds) && p.taskKinds.includes(task.intent) &&
    q?.source==='independent-task-evaluation' &&
    q?.taskKind===task.intent && Number.isFinite(q?.score) &&
    q.score>=0 && q.score<=1 && Number.isSafeInteger(q?.samples) &&
    q.samples>=10 && Number.isFinite(Date.parse(q?.checkedAt)) &&
    Date.parse(q.checkedAt)<=now && now-Date.parse(q.checkedAt)<=CANDIDATE_AGE_MS;
};
/** Ranks only supplied independently evaluated, screened FREE candidates.
 * Source/provider claims are *not* authenticated by this function.
 * A winning score is NEVER proof that this model actually ran or is "best".
 */
export function rankMidAiFreeCandidates({task,candidates=[],now=Date.now()}={}){
  if(!task||task.dataClass!=='public-redacted'||!INTENTS.has(task.intent)||
     !['research','weather-science','independent-review'].includes(task.intent))
    return Object.freeze([]);
  if(!Array.isArray(candidates)||!Number.isFinite(now))return Object.freeze([]);
  const eligible=candidates.filter(p=>candidateReady(p,task,now)).sort((a,b)=>
    b.quality.score-a.quality.score || b.quality.samples-a.quality.samples ||
    a.provider.localeCompare(b.provider) || a.model.localeCompare(b.model));
  return Object.freeze(eligible.map(p=>Object.freeze({
    provider:p.provider,model:p.model,foundationPublisher:p.foundationPublisher??null,
    foundationFamily:p.foundationFamily??null,
    score:p.quality.score,samples:p.quality.samples,
    evaluationCheckedAt:p.quality.checkedAt,dispatchAuthorized:false
  })));
}
export function planMidAiTaskSurface({
  task,snapshot,host={mode:'chat',tools:{}},candidates=[],now=Date.now()
}={}){
  if(task?.userInitiated!==true || !INTENTS.has(task?.intent))
    return make(null,'BLOCKED','INVALID_OR_UNAUTHORIZED_TASK');
  if(!SHA40.test(task.expectedStableSha||'') ||
     !SHA40.test(snapshot?.mainSha||'') ||
     !SHA40.test(snapshot?.stableSha||'') ||
     !VERSION.test(snapshot?.version||''))
    return make(null,'BLOCKED','UNVERIFIED_SOURCE_OR_VERSION');
  if(!MODE.has(host.mode))return make(null,'BLOCKED','INVALID_HOST_MODE');
  const sourceAligned=snapshot.mainSha===snapshot.stableSha &&
                      task.expectedStableSha===snapshot.stableSha;
  const t=host.tools??{};
  const intent=task.intent;
  const sensitive=task.dataClass!=='public-redacted';
  const externalAllowed=!sensitive && sourceAligned &&
     task.allowExternalInference===true &&
     (task.maxExternalCalls===1 || task.maxExternalCalls===2);
  const evidence=()=>Object.freeze({
    sourceSha:snapshot.stableSha,sourceAligned,
    providerProofIsNotIndependentlyAuthenticated:true
  });
  // Source browsing stays useful even during release drift, but reports it.
  if(intent==='repo-readback'){
    if(!toolReady(t,'github'))return make(null,'BLOCKED','GITHUB_CONNECTOR_UNAVAILABLE',{sourceAligned});
    return make('github','CONNECTED_TOOL_PLAN','READ_ONLY_GITHUB_READBACK',{
      requiredTools:toolsUsed(t,['github']),...evidence()
    });
  }
  if(intent==='source-code-change'){
    if(!sourceAligned)return make(null,'BLOCKED','SOURCE_DRIFT');
    if(host.mode==='codex' && toolReady(t,'codex','write') &&
       t.codex?.includedQuotaVerified===true)
      return make('codex','CONNECTED_TOOL_PLAN','CODEX_AUTHORIZED_SANDBOX_REQUIRED',{
        requiredTools:toolsUsed(t,['codex','github']),...evidence()
      });
    if(task.preferredMode==='codex')
      return make('codex','MODE_SWITCH_REQUIRED','CODEX_HOST_MUST_BE_SELECTED_BY_USER',{
        ...evidence()
      });
    if(toolReady(t,'github','write'))
      return make('chatgpt-github','CONNECTED_TOOL_PLAN','AUTHORIZED_INTEGRATION_BRANCH_ONLY',{
        requiredTools:toolsUsed(t,['github']),...evidence()
      });
    if(toolReady(t,'copilot','write') && toolReady(t,'github') &&
       t.copilot?.includedQuotaVerified===true &&
       t.copilot?.paidOverageDisabled===true)
      return make('copilot-issue','CONNECTED_TOOL_PLAN','ISSUE_TO_UNTRUSTED_COPILOT_DRAFT_ONLY',{
        requiredTools:toolsUsed(t,['github','copilot']),...evidence()
      });
    return make('codex','MODE_SWITCH_REQUIRED','CODEX_OR_CONNECTED_GITHUB_REQUIRED');
  }
  if(intent==='multi-step-work'){
    if(host.mode==='work' && toolReady(t,'work','write'))
      return make('work','CONNECTED_TOOL_PLAN','WORK_CURRENT_HOST',{
        requiredTools:toolsUsed(t,['work','github']),...evidence()
      });
    return make('work','MODE_SWITCH_REQUIRED','USER_MUST_SELECT_WORK_MODE',{
      ...evidence()
    });
  }
  if(intent==='ux-audit'){
    if(toolReady(t,'product-design'))
      return make('product-design','CONNECTED_TOOL_PLAN','UX_AUDIT_WITH_SNAPSHOT',{
        requiredTools:toolsUsed(t,['product-design','github']),...evidence()
      });
    return make('work','MODE_SWITCH_REQUIRED','PRODUCT_DESIGN_UNAVAILABLE');
  }
  if(intent==='telemetry-audit'){
    if(task.telemetryConsent!==true)
      return make(null,'BLOCKED','TELEMETRY_CONSENT_NOT_VERIFIED');
    if(toolReady(t,'posthog'))
      return make('posthog','CONNECTED_TOOL_PLAN','CONSENT_BOUND_READ_ONLY_TELEMETRY',{
        requiredTools:toolsUsed(t,['posthog']),...evidence()
      });
    return make(null,'BLOCKED','POSTHOG_NOT_CONNECTED');
  }
  const nativeNames=intent==='research'?
    ['firecrawl','context7','github']:['github','firecrawl','context7'];
  const nativeTools=toolsUsed(t,nativeNames);
  // Do not fake a model call: no backend tool means no API execution.
  if(externalAllowed && toolReady(t,'mid-ai-mcp','write') &&
     t['mid-ai-mcp']?.signedGrantRunnerVerified===true &&
     t['mid-ai-mcp']?.globalAtomicLedgerVerified===true &&
     t['mid-ai-mcp']?.zeroAdditionalCashVerified===true){
    const ranked=rankMidAiFreeCandidates({task,candidates,now});
    const need=task.maxExternalCalls===2?2:1;
    const selected=[];
    for(const p of ranked){
      if(selected.length===need)break;
      if(need===2 && (!p.foundationPublisher || !p.foundationFamily))continue;
      if(selected.some(s=>s.provider===p.provider ||
          s.foundationPublisher===p.foundationPublisher ||
          s.foundationFamily===p.foundationFamily))continue;
      selected.push(p);
    }
    if(selected.length===need)
      return make('mid-ai-mcp','SIGNED_EXECUTOR_REQUIRED','QUALITY_RANKED_FREE_CANDIDATE_PLAN',{
        selected:Object.freeze(selected),plannedExternalCalls:need,
        requiredTools:toolsUsed(t,['mid-ai-mcp']),...evidence()
      });
  }
  if(nativeTools.length)
    return make('chatgpt-native','CONNECTED_TOOL_PLAN',
      externalAllowed?'NATIVE_PRIMARY_SOURCES_EXTERNAL_NOT_ATTESTED':'NATIVE_PRIMARY_SOURCES_FIRST',{
      requiredTools:nativeTools,
      requestedExternalButUnavailable:task.allowExternalInference===true,
      ...evidence()
    });
  return make(null,'BLOCKED',
    externalAllowed?'NO_VERIFIED_MODEL_OR_SOURCE_TOOL':'NO_APPROVED_EXECUTION_SURFACE');
}
