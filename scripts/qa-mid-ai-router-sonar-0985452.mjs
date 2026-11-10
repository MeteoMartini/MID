#!/usr/bin/env node
/** MID AI Router Sonar fixed-model/prepaid-credit offline negative QA. */
import assert from 'node:assert/strict';
import {
 MID_SONAR_MODEL,MID_SONAR_ENDPOINT,MID_SONAR_LIVE_DISPATCH_ALLOWED,
 planMidAiSonar,buildMidAiSonarRequest,parseMidAiSonarResponse,dispatchMidAiSonar
} from './mid-ai-router-sonar.mjs';
const now=Date.parse('2026-11-10T05:00:00.000Z'),date=new Date(now).toISOString();
const sha='a'.repeat(40),teamId='team_WdBAGpkorvKDeFeqvBj9Eysv';
const task={requestId:'mid-sonar-QA01',expectedStableSha:sha,userInitiated:true,
 kind:'external-research',dataClass:'public-redacted',
 prompt:'Summarize public WMO guidelines with source URLs.'};
const snapshot={mainSha:sha,stableSha:sha,version:'0.9.85.451'};
const setup=()=>({task:{...task},snapshot:{...snapshot},teamId,now,
 account:{teamId,tier:'free',purchasedCreditsUsd:0,autoTopUpEnabled:false,
  byokEnabled:false,remainingFreeCreditsUsd:5},
 budget:{scope:'api-key',limitUsd:1,refreshPeriod:'none',enforced:true,checkedAt:date},
 model:{id:MID_SONAR_MODEL,freeTierEligible:true,checkedAt:date,maxEstimatedRequestUsd:0.01},
 evidence:{teamId,modelId:MID_SONAR_MODEL,origin:'independent-protected-account-readback',
  digest:'b'.repeat(64),checkedAt:date}
});
let count=0;const ok=(description,fn)=>{fn();count++};
const denied=(fn,reason)=>assert.throws(fn,e=>e?.name==='MidAiSonarBlocked'&&e?.reason===reason,reason);
const plan=planMidAiSonar(setup());
const response={id:'gen_test_only_123',model:MID_SONAR_MODEL,
 choices:[{message:{content:'Public information [1]'},finish_reason:'stop'}],
 citations:['https://wmo.int/'],search_results:[{url:'https://www.dwd.de/'}],
 usage:{prompt_tokens:100,completion_tokens:50}};
const encoded=()=>JSON.stringify(response);
ok('safe plan only',()=>{
 assert.equal(plan.status,'PLAN_ONLY');
 assert.equal(plan.dispatchAuthorized,false);
 assert.equal(plan.maxAdditionalCashUsd,0);
 assert.equal(plan.costClass,'PRICED_INCLUDED_CREDIT_ONLY');
});
ok('no live dispatcher',()=>{assert.equal(MID_SONAR_LIVE_DISPATCH_ALLOWED,false);
 denied(()=>dispatchMidAiSonar(),'SONAR_LIVE_RUNNER_NOT_RELEASED')});
ok('no unverified free credit',()=>{
 const s=setup();s.model.freeTierEligible=false;
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('unverified auto top up blocked',()=>{
 const s=setup();s.account.autoTopUpEnabled=true;
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('wrong model blocked',()=>{
 const s=setup();s.model.id='perplexity/sonar-pro';
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('unknown credit balance blocked',()=>{
 const s=setup();delete s.account.remainingFreeCreditsUsd;
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('reset budget blocked',()=>{
 const s=setup();s.budget.refreshPeriod='daily';
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('BYOK blocked',()=>{
 const s=setup();s.account.byokEnabled=true;
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('uncorroborated proof blocked',()=>{
 const s=setup();s.evidence.origin='user-screenshot';
 denied(()=>planMidAiSonar(s),'VERCEL_EVIDENCE_BLOCKED');
});
ok('private request blocked',()=>{
 const s=setup();s.task.dataClass='private';
 denied(()=>planMidAiSonar(s),'ONLY_PUBLIC_REDACTED_RESEARCH');
});
ok('only bounded external research',()=>{
 const s=setup();s.task.kind='release-deploy';
 denied(()=>planMidAiSonar(s),'ONLY_PUBLIC_REDACTED_RESEARCH');
});
ok('source drift blocked',()=>{
 const s=setup();s.snapshot.mainSha='c'.repeat(40);
 denied(()=>planMidAiSonar(s),'SOURCE_DRIFT');
});
ok('secret pattern blocked',()=>{
 const s=setup();s.task.prompt='api_key: abcdef123456789';
 denied(()=>planMidAiSonar(s),'SECRET_PATTERN');
});
ok('prompt length blocked',()=>{
 const s=setup();s.task.prompt='a'.repeat(1801);
 denied(()=>planMidAiSonar(s),'INVALID_PROMPT');
});
ok('request envelope restricts model provider and output',()=>{
 const r=buildMidAiSonarRequest({plan,task,credential:'FAKE_TEST_KEY_123456'});
 const b=JSON.parse(r.body);
 assert.equal(r.url,MID_SONAR_ENDPOINT);
 assert.equal(b.model,MID_SONAR_MODEL);
 assert.equal(b.max_tokens,256);assert.equal(b.stream,false);
 assert.deepEqual(b.providerOptions.gateway.only,['perplexity']);
 assert.equal(b.providerOptions.gateway.zeroDataRetention,true);
 assert.equal(b.models,undefined);
 assert.equal(r.headers.authorization,'Bearer FAKE_TEST_KEY_123456');
 assert.equal(r.body.includes('FAKE_TEST_KEY'),false);
});
ok('missing credential blocked',()=>denied(
 ()=>buildMidAiSonarRequest({plan,task,credential:''}),'MISSING_CREDENTIAL'));
ok('modified prompt blocked after plan',()=>denied(
 ()=>buildMidAiSonarRequest({plan,task:{...task,prompt:'changed'},credential:'FAKE_TEST_KEY_123456'}),
 'PLAN_STALE'));
ok('response citations and cost are unverified',()=>{
 const result=parseMidAiSonarResponse({plan,raw:encoded()});
 assert.equal(result.status,'UNTRUSTED_CITATION_REVIEW_ONLY');
 assert.deepEqual(result.citations,['https://wmo.int/','https://www.dwd.de/']);
 assert.equal(result.costStatus,'NOT_VERIFIED');
 assert.equal(result.cashSpendStatus,'NOT_VERIFIED');
 assert.equal(result.providerReportedUsage.promptTokens,100);
});
ok('omitted or invalid upstream usage is never inferred as zero',()=>{
 const empty=parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,usage:undefined})});
 assert.equal(empty.providerReportedUsage,null);
 assert.equal(empty.usageStatus,'NOT_VERIFIED');
 assert.equal(empty.costStatus,'NOT_VERIFIED');
 const invalid=parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,
  usage:{prompt_tokens:-1,completion_tokens:-20}})});
 assert.equal(invalid.providerReportedUsage.promptTokens,null);
 assert.equal(invalid.providerReportedUsage.completionTokens,null);
});
ok('provider model substitution denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,model:'perplexity/sonar-pro'})}),
 'RESPONSE_MODEL_MISMATCH'));
ok('no citations denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,citations:[],search_results:[]})}),
 'CITATIONS_MISSING'));
ok('non-https and credentials in citations denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,
 citations:['http://insecure.test','https://user:pass@invalid.test'],search_results:[]})}),
 'CITATIONS_MISSING'));
ok('malformed JSON denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:'hello'}),'INVALID_RESPONSE_JSON'));
ok('oversized response denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:'x'.repeat(65537)}),'INVALID_RESPONSE_SIZE'));
ok('incomplete response denied',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,
 choices:[{message:{content:'partial'},finish_reason:'length'}]})}),
 'EMPTY_OR_INCOMPLETE_RESPONSE'));
ok('model identity required',()=>denied(
 ()=>parseMidAiSonarResponse({plan,raw:JSON.stringify({...response,model:undefined})}),
 'RESPONSE_MODEL_MISMATCH'));
ok('evidence never included in plan or request body',()=>{
 const s=setup();s.credential='FAKE_SUPER_SECRET_KEY';
 const p=planMidAiSonar(s),r=buildMidAiSonarRequest({plan:p,task,credential:'FAKE_TEST_KEY_123456'});
 assert.equal(JSON.stringify(p).includes('FAKE_SUPER_SECRET'),false);
 assert.equal(r.body.includes('FAKE_SUPER_SECRET'),false);
});
console.log('MID AI Router Sonar credit-only offline QA OK; scenarios='+count+'; no live API used.');
