#!/usr/bin/env node
import assert from 'node:assert/strict';
import {planMidAiGithubFreeReviewIssue as plan} from './mid-ai-router-github-issueops.mjs';
const sha='a'.repeat(40),ver='0.9.85.453';
const snapshot={mainSha:sha,stableSha:sha,
 versionMirrors:{package:ver,baseline:ver,registry:ver}};
const original={requestId:'mid-public-00001',
 prompt:'Compare WMO 24h precipitation accumulation rules in the public standard.',
 userInitiated:true,publicRedactedConfirmed:true,
 provider:'groq',model:'openai/gpt-oss-120b',dataClass:'public-redacted',
 kind:'weather-science',maxExternalCalls:1,maxAdditionalCashUsd:0,
 allowExternalInference:true,expectedStableSha:sha,expectedVersion:ver};
let count=0;
const test=fn=>{fn();count++};
const blocked=(task,reason,snapshotOverride=snapshot)=>{
 const r=plan({task,snapshot:snapshotOverride});
 assert.equal(r.status,'BLOCKED');assert.equal(r.reason,reason);
 assert.equal(r.externalCallsMade,0);
};
test(()=>{const r=plan({task:original,snapshot});
 assert.equal(r.status,'PUBLIC_REVIEW_DRAFT_ONLY');
 assert.equal(r.dispatchAuthorized,false);assert.equal(r.issueCreated,false);
 assert.ok(r.title.includes('[NO DISPATCH]'));
 const parsed=JSON.parse(r.body.split('~~~json\n')[1].split('\n~~~')[0]);
 assert.equal(parsed.expectedStableSha,sha);
 assert.equal(parsed.maxAdditionalCashUsd,0);
 assert.equal(parsed.prompt,original.prompt);
});
test(()=>blocked({...original,userInitiated:false},'PUBLIC_REQUEST_NOT_USER_APPROVED'));
test(()=>blocked({...original,publicRedactedConfirmed:false},'PUBLIC_REQUEST_NOT_USER_APPROVED'));
test(()=>blocked({...original,dataClass:'private'},'PUBLIC_REQUEST_NOT_USER_APPROVED'));
test(()=>blocked({...original,prompt:''},'INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT'));
test(()=>blocked({...original,prompt:'x'.repeat(1801)},'INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT'));
test(()=>blocked({...original,prompt:'account@test.com'},'INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT'));
test(()=>blocked({...original,prompt:'api_key=123456789012345'},'INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT'));
test(()=>blocked({...original,prompt:'https://x.tld/a?token=123456789000'},'INVALID_OR_POTENTIALLY_PRIVATE_PUBLIC_PROMPT'));
test(()=>blocked({...original,maxExternalCalls:2},'UNAPPROVED_SCOPE_OR_CASH'));
test(()=>blocked({...original,maxAdditionalCashUsd:1},'UNAPPROVED_SCOPE_OR_CASH'));
test(()=>blocked({...original,provider:'openrouter',model:'openrouter/free'},'MODEL_NOT_PINNED_TO_REVIEWED_FREE_CANDIDATE'));
test(()=>blocked({...original,model:'openai/gpt-oss-120b:paid'},'MODEL_NOT_PINNED_TO_REVIEWED_FREE_CANDIDATE'));
test(()=>blocked({...original,expectedStableSha:'b'.repeat(40)},'SOURCE_DRIFT_OR_VERSION_UNVERIFIED'));
test(()=>blocked(original,'SOURCE_DRIFT_OR_VERSION_UNVERIFIED',
 {...snapshot,versionMirrors:{...snapshot.versionMirrors,baseline:'0.9.85.454'}}));
test(()=>{const r=plan({task:{...original,provider:'gemini',model:'gemini-3.8-flash'},snapshot});
 assert.equal(r.status,'PUBLIC_REVIEW_DRAFT_ONLY');
 assert.equal(r.externalCallsMade,0)});
console.log('MID AI Router public GitHub IssueOps packet QA OK; scenarios='+count+
 '; no issue, label, workflow, model call or network.');
