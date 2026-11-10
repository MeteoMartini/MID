/**
 * MID AI Router Github IssueOps handoff. PUBLIC QA DRAFT ONLY.
 * No network, issue creation, label, secret, workflow or inference.
 * Actual workflow must be independently reviewed and deployed through
 * the canonical MID source/release path.
 */
const SHA=/^[a-f0-9]{40}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
const EXACT=Object.freeze({
 groq:new Set(['openai/gpt-oss-120b','openai/gpt-oss-20b']),
 openrouter:new Set(['cohere/north-mini-code:free','google/gemma-4-26b-a4b-it:free']),
 gemini:new Set(['gemini-3.8-flash'])
});
const SECRET=/(?:api[_-]?key|bearer|password|secret|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{12,}|\b(?:gh[upso]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{18,}|sk-[A-Za-z0-9_-]{16,})\b|[?&](?:token|key|apikey|api_key)=[^\s&]+/i;
const EMAIL=/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const stop=reason=>Object.freeze({status:'BLOCKED',reason,
 dispatchAuthorized:false,issueCreated:false,workflowTriggered:false,externalCallsMade:0});
export function planMidAiGithubFreeReviewIssue({task,snapshot}={}){
 if(task?.userInitiated!==true||task.publicRedactedConfirmed!==true||
    task.dataClass!=='public-redacted')
   return stop('PUBLIC_REQUEST_NOT_USER_APPROVED');
 if(!ID.test(task.requestId||'')||typeof task.prompt!=='string'||
    !task.prompt.trim()||task.prompt.length>1800||SECRET.test(task.prompt)||
    EMAIL.test(task.prompt))
   return stop('INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT');
 if(task.maxExternalCalls!==1||!Object.is(task.maxAdditionalCashUsd,0)||
    task.allowExternalInference!==true||
    !['independent-review','external-research','weather-science','bounded-code-review'].includes(task.kind))
   return stop('UNAPPROVED_SCOPE_OR_CASH');
 if(!Object.hasOwn(EXACT,task.provider)||!EXACT[task.provider].has(task.model))
   return stop('MODEL_NOT_PINNED_TO_REVIEWED_FREE_CANDIDATE');
 if(!SHA.test(task.expectedStableSha||'')||!VERSION.test(task.expectedVersion||'')||
    !SHA.test(snapshot?.mainSha||'')||!SHA.test(snapshot?.stableSha||'')||
    snapshot.mainSha!==snapshot.stableSha||
    snapshot.stableSha!==task.expectedStableSha||
    snapshot.versionMirrors?.package!==task.expectedVersion||
    snapshot.versionMirrors?.baseline!==task.expectedVersion||
    snapshot.versionMirrors?.registry!==task.expectedVersion)
   return stop('SOURCE_DRIFT_OR_VERSION_UNVERIFIED');
 const packet={schema:'mid-ai-github-public-review.v1',
   requestId:task.requestId,expectedStableSha:task.expectedStableSha,
   expectedVersion:task.expectedVersion,kind:task.kind,
   provider:task.provider,model:task.model,dataClass:'public-redacted',
   maxExternalCalls:1,maxAdditionalCashUsd:0,prompt:task.prompt};
 return Object.freeze({
  status:'PUBLIC_REVIEW_DRAFT_ONLY',repository:'MeteoMartini/MID',
  title:'[MID-AI-REVIEW][NO DISPATCH] '+task.requestId,
  body:'PUBLIC REVIEW DRAFT — NOT EXECUTABLE. Anyone can read this issue.\n'+
       'No auto-run label or API credential is attached.\n\n'+
       '~~~json\n'+JSON.stringify(packet,null,2)+'\n~~~\n',
  dispatchAuthorized:false,issueCreated:false,workflowTriggered:false,
  externalCallsMade:0
 });
}
