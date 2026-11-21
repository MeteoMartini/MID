#!/usr/bin/env node
/** MID 1.2 deterministic tool/mode/model routing regression; no network or credentials. */
import assert from 'node:assert/strict';
import {planMidAiTaskSurface as route,rankMidAiFreeCandidates as rank}
  from './mid-ai-router-capability.mjs';
const sha='a'.repeat(40),now=Date.parse('2026-11-10T08:00:00Z');
const snapshot={mainSha:sha,stableSha:sha,version:'0.9.85.453'};
const ready=(write=false)=>({connected:true,authenticated:true,canRead:true,canWrite:write});
const tools={github:ready(true),firecrawl:ready(),context7:ready(),
 'product-design':ready(),posthog:ready()};
const task=(intent,props={})=>({userInitiated:true,intent,
 expectedStableSha:sha,dataClass:'public-redacted',...props});
const host=(toolsOverride=tools,mode='chat')=>({mode,tools:toolsOverride});
const run=(t,h=host(),candidates=[])=>route({task:t,host:h,snapshot,candidates,now});
let passed=0;
const check=(f)=>{f();passed++};
const denied=(r,reason)=>{assert.equal(r.dispatchPerformed,false);
 assert.equal(r.dispatchAuthorized,false);assert.equal(r.reason,reason)};
check(()=>{const r=run(task('repo-readback'));assert.equal(r.lane,'github');assert.equal(r.status,'CONNECTED_TOOL_PLAN')});
check(()=>denied(run(task('repo-readback'),host({})),'GITHUB_CONNECTOR_UNAVAILABLE'));
check(()=>denied(run(task('repo-readback',{userInitiated:false})),'INVALID_OR_UNAUTHORIZED_TASK'));
check(()=>denied(run(task('not-a-task')),'INVALID_OR_UNAUTHORIZED_TASK'));
check(()=>denied(run(task('repo-readback',{expectedStableSha:'bad'})),'UNVERIFIED_SOURCE_OR_VERSION'));
check(()=>{const r=route({task:task('repo-readback'),snapshot:{...snapshot,mainSha:'b'.repeat(40)},host:host(),now});assert.equal(r.sourceAligned,false)});
check(()=>denied(route({task:task('source-code-change'),snapshot:{...snapshot,mainSha:'b'.repeat(40)},host:host(),now}),'SOURCE_DRIFT'));
check(()=>{const r=run(task('source-code-change'));assert.equal(r.lane,'chatgpt-github')});
check(()=>denied(run(task('source-code-change',{preferredMode:'codex'})),'CODEX_HOST_MUST_BE_SELECTED_BY_USER'));
check(()=>{const h=host({...tools,codex:{...ready(true),includedQuotaVerified:true}},'codex');
 const r=run(task('source-code-change'),h);assert.equal(r.lane,'codex')});
check(()=>{const h=host({...tools,codex:{...ready(true),includedQuotaVerified:false}},'codex');
 const r=run(task('source-code-change'),h);assert.notEqual(r.lane,'codex')});
check(()=>{const r=run(task('multi-step-work'));assert.equal(r.status,'MODE_SWITCH_REQUIRED')});
check(()=>{const h=host({...tools,work:ready(true)},'work');assert.equal(run(task('multi-step-work'),h).lane,'work')});
check(()=>{assert.equal(run(task('ux-audit')).lane,'product-design')});
check(()=>denied(run(task('telemetry-audit')),'TELEMETRY_CONSENT_NOT_VERIFIED'));
check(()=>assert.equal(run(task('telemetry-audit',{telemetryConsent:true})).lane,'posthog'));
check(()=>denied(run(task('telemetry-audit',{telemetryConsent:true}),host({})),'POSTHOG_NOT_CONNECTED'));
check(()=>assert.equal(run(task('research')).lane,'chatgpt-native'));
check(()=>assert.equal(run(task('research',{dataClass:'private',allowExternalInference:true,maxExternalCalls:2})).lane,'chatgpt-native'));
check(()=>{const r=run(task('research',{allowExternalInference:true,maxExternalCalls:2}));assert.equal(r.externalCallsMade,0)});
const evaluation=(provider,model,publisher,family,score=0.9)=>({
 provider,model,foundationPublisher:publisher,foundationFamily:family,
 freeAccountVerified:true,zeroPriceVerified:true,noPaidOverageVerified:true,
 privacyApproved:true,exactModelAvailable:true,remainingRequests:10,
 taskKinds:['independent-review'],
 quality:{source:'independent-task-evaluation',taskKind:'independent-review',
  score,samples:25,checkedAt:new Date(now).toISOString()}
});
const modelA=evaluation('groq','openai/gpt-oss-120b','openai','gpt-oss');
const modelB=evaluation('openrouter','cohere/north-mini-code:free','cohere','north-mini',0.8);
const modelC=evaluation('openrouter','google/gemma-4:free','google','gemma-4',0.99);
check(()=>assert.deepEqual(rank({task:task('independent-review',{dataClass:'private'}),candidates:[modelA],now}),[]));
check(()=>assert.equal(rank({task:task('independent-review'),candidates:[modelA,modelB,modelC],now})[0].model,modelC.model));
check(()=>assert.equal(rank({task:task('independent-review'),candidates:[{...modelA,quality:{...modelA.quality,samples:1}}],now}).length,0));
check(()=>assert.equal(rank({task:task('independent-review'),candidates:[{...modelA,quality:{...modelA.quality,checkedAt:'2026-01-01'}}],now}).length,0));
check(()=>assert.equal(rank({task:task('independent-review'),candidates:[{...modelA,noPaidOverageVerified:false}],now}).length,0));
const mcp={...ready(true),signedGrantRunnerVerified:true,
 globalAtomicLedgerVerified:true,zeroAdditionalCashVerified:true};
const protectedTools={...tools,'mid-ai-mcp':mcp};
check(()=>{const t=task('independent-review',{allowExternalInference:true,maxExternalCalls:2});
 const r=run(t,host(protectedTools),[modelA,modelB,modelC]);
 assert.equal(r.lane,'mid-ai-mcp');assert.equal(r.status,'SIGNED_EXECUTOR_REQUIRED');
 assert.equal(r.plannedExternalCalls,2);assert.equal(r.externalCallsMade,0);
 assert.equal(new Set(r.selected.map(x=>x.foundationPublisher)).size,2)});
check(()=>{const r=run(task('independent-review',{allowExternalInference:true,maxExternalCalls:2}),
 host(protectedTools),[modelA,{...modelB,foundationPublisher:'openai',foundationFamily:'gpt-oss'}]);
 assert.notEqual(r.lane,'mid-ai-mcp')});
check(()=>{const r=run(task('independent-review',{allowExternalInference:true,maxExternalCalls:1}),
 host({...tools,'mid-ai-mcp':{...mcp,globalAtomicLedgerVerified:false}}),[modelA]);
 assert.notEqual(r.lane,'mid-ai-mcp')});
check(()=>{const r=run(task('independent-review',{dataClass:'private',allowExternalInference:true,maxExternalCalls:1}),
 host(protectedTools),[modelA]);assert.notEqual(r.lane,'mid-ai-mcp')});
check(()=>denied(run(task('independent-review'),host({})),'NO_APPROVED_EXECUTION_SURFACE'));
check(()=>{const r=route({task:task('research'),snapshot,host:{mode:'unsupported',tools},now});denied(r,'INVALID_HOST_MODE')});
check(()=>{const r=run(task('independent-review',{allowExternalInference:true,maxExternalCalls:2}),
 host(protectedTools),[modelA]);
 assert.equal(r.externalCallsMade,0);assert.equal(r.lane,'chatgpt-native')});
check(()=>{const r=run(task('independent-review',{allowExternalInference:true,maxExternalCalls:1}),
 host(protectedTools),[modelA]);
 assert.equal(r.plannedExternalCalls,1);assert.equal(r.dispatchAuthorized,false)});
check(()=>{const r=run(task('source-code-change'),host({github:ready()}));
 assert.equal(r.status,'MODE_SWITCH_REQUIRED')});
// Existing GitHub connection is the only transport: Copilot is an assignee,
// not a second separately authenticated ChatGPT plugin.
const copilotReady={...ready(true),copilotIssueAssignSupported:true,
 copilotCreditState:'verified-available',copilotPaidOverageDisabled:true,
 copilotCreditEvidence:{source:'github-account-quota-readback',
  expectedStableSha:sha,checkedAt:new Date(now).toISOString(),
  remainingIncludedSessions:1,paidOverageDisabled:true}};
const copilotTask=(intent='source-code-change',options={})=>
 task(intent,{preferredMode:'copilot',requestId:'mid-router-copilot-01',
  copilotIssueAlreadyCreated:false,maxAdditionalCashUsd:0,
  maxCopilotSessions:1,...options});
check(()=>{const r=run(copilotTask(),host({github:copilotReady}));
 assert.equal(r.lane,'copilot-issue');assert.equal(r.status,'CONNECTED_TOOL_PLAN');
 assert.equal(r.requestedAssignee,'copilot-swe-agent[bot]');
 assert.deepEqual(r.requiredTools,['github']);
 assert.equal(r.sessionStarted,false);assert.equal(r.dispatchAuthorized,false);
 assert.equal(r.retryAllowed,false);assert.equal(r.issueCreated,false);
 assert.equal(r.requestId,'mid-router-copilot-01');
 assert.equal(r.maxCopilotSessions,1);assert.equal(r.maxAdditionalCashUsd,0);});
check(()=>{const r=run(copilotTask('independent-review'),host({github:copilotReady}));
 assert.equal(r.lane,'copilot-issue');assert.equal(r.dispatchPerformed,false);});
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,copilotCreditState:'exhausted'}})),
 'COPILOT_AI_CREDITS_EXHAUSTED'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,copilotCreditState:'unknown'}})),
 'COPILOT_CREDIT_LIMITS_UNVERIFIED'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,copilotPaidOverageDisabled:false}})),
 'COPILOT_CREDIT_LIMITS_UNVERIFIED'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,copilotIssueAssignSupported:false}})),
 'GITHUB_COPILOT_ASSIGNMENT_NOT_VERIFIED'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,canWrite:false}})),
 'GITHUB_COPILOT_ASSIGNMENT_NOT_VERIFIED'));
check(()=>denied(run(copilotTask('repo-readback'),host({github:copilotReady})),
 'COPILOT_TASK_KIND_NOT_ALLOWED'));
check(()=>denied(run(copilotTask('independent-review',{dataClass:'private'}),host({github:copilotReady})),
 'PUBLIC_REDACTED_ONLY'));
check(()=>denied(run(copilotTask('independent-review',{copilotIssueAlreadyCreated:true}),host({github:copilotReady})),
 'COPILOT_REQUEST_ALREADY_SUBMITTED'));
check(()=>denied(run(copilotTask(),host({github:copilotReady},'codex')),
 'COPILOT_REQUIRES_CHAT_COORDINATOR'));
check(()=>denied(route({task:copilotTask(),host:host({github:copilotReady}),
 snapshot:{...snapshot,mainSha:'b'.repeat(40)},now}),'SOURCE_DRIFT'));

check(()=>denied(run(copilotTask('source-code-change',{requestId:undefined}),
 host({github:copilotReady})),'COPILOT_IDEMPOTENCY_UNVERIFIED'));
check(()=>denied(run(copilotTask('source-code-change',{copilotIssueAlreadyCreated:undefined}),
 host({github:copilotReady})),'COPILOT_IDEMPOTENCY_UNVERIFIED'));
check(()=>denied(run(copilotTask('source-code-change',{maxCopilotSessions:2}),
 host({github:copilotReady})),'COPILOT_ONE_SHOT_ZERO_CASH_REQUIRED'));
check(()=>denied(run(copilotTask('source-code-change',{maxAdditionalCashUsd:0.01}),
 host({github:copilotReady})),'COPILOT_ONE_SHOT_ZERO_CASH_REQUIRED'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:undefined}})),'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 source:'user-assertion'}}})),'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 checkedAt:new Date(now-16*60*1000).toISOString()}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>{const r=run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 checkedAt:new Date(now-14*60*1000).toISOString()}}}));assert.equal(r.lane,'copilot-issue')});
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 checkedAt:new Date(now+1000).toISOString()}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 expectedStableSha:'b'.repeat(40)}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 remainingIncludedSessions:0}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 paidOverageDisabled:false}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditEvidence:{...copilotReady.copilotCreditEvidence,
 checkedAt:'n/a'}}})),
 'COPILOT_QUOTA_EVIDENCE_UNVERIFIED_OR_STALE'));
check(()=>denied(route({task:copilotTask(),host:null,snapshot,now}),
 'INVALID_HOST_MODE'));
check(()=>denied(run(copilotTask(),host({github:{...copilotReady,
 copilotCreditState:'exhausted',copilotCreditEvidence:copilotReady.copilotCreditEvidence}})),
 'COPILOT_AI_CREDITS_EXHAUSTED'));

console.log('MID AI Router capability QA OK; scenarios='+passed+'; no network, paid AI calls or mode switch.');
