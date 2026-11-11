#!/usr/bin/env node
/** Deterministic adversarial QA — no actual network, secrets, release. */
import assert from 'node:assert/strict';
import {assessMidNativeMergeReviewPolicy as audit,
 readMidNativeMergeReviewPolicy as read,
 assessMidClassicBranchReviewPolicy as classicAudit,
 readMidClassicBranchReviewPolicy as readClassic,
 inspectMidMergeReviewPolicy as inspect} from './mid-native-merge-review-policy.mjs';
const id=9028,summary={id,target:'branch',enforcement:'active'};
const rule={type:'pull_request',parameters:{
 required_review_thread_resolution:true,required_approving_review_count:1,
 dismiss_stale_reviews_on_push:true,require_last_push_approval:true}};
const detail={...summary,conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},
 bypass_actors:[],current_user_can_bypass:'never',rules:[rule]};
const data=(change={})=>({summaries:[summary],detailsById:{[id]:{...detail,...change}}});
let n=0;
async function test(name,fn){try{await fn();n++}catch(e){throw new Error(name+': '+e.message)}}
async function reject(name,args,code){
 await test(name,()=>{const x=audit(args);assert.equal(x.ok,false);
  assert.equal(x.reason,code);assert.equal(x.mergeAuthorized,false)});
}
const missing='NATIVE_MERGE_TIME_REVIEW_ENFORCEMENT_MISSING';
await test('valid protected main review policy is not a release pass',()=>{
 const x=audit(data());assert.equal(x.ok,true);assert.equal(x.rulesetId,id);
 assert.equal(x.mergeAuthorized,false);assert.equal(x.releaseAuthorized,false);
});
await reject('no rules',{summaries:[],detailsById:{}},missing);
await reject('missing provenance',{summaries:null,detailsById:{}},'RULESET_PROVENANCE_MISSING');
await reject('wrong branch',{...data(),branch:'refs/heads/mid-stable'},'WRONG_PROTECTED_BRANCH');
await reject('inactive',{summaries:[{...summary,enforcement:'disabled'}],
 detailsById:{[id]:{...detail,enforcement:'disabled'}}},missing);
await reject('excluded main',data({conditions:{ref_name:{
 include:['refs/heads/main'],exclude:['refs/heads/main']}}}),missing);
await reject('wrong target',data({conditions:{ref_name:{
 include:['refs/heads/mid-stable'],exclude:[]}}}),missing);
await reject('release-app bypass',data({bypass_actors:[{
 actor_id:5059236,actor_type:'Integration',bypass_mode:'always'}]}),missing);
await reject('PR-only bypass',data({bypass_actors:[{
 actor_id:75040651,actor_type:'User',bypass_mode:'pull_request'}]}),missing);
await reject('current user bypass',data({current_user_can_bypass:'always'}),missing);
await reject('missing required approval',data({rules:[{...rule,parameters:{
 ...rule.parameters,required_approving_review_count:0}}]}),missing);
await reject('unresolved conversation allowed',data({rules:[{...rule,parameters:{
 ...rule.parameters,required_review_thread_resolution:false}}]}),missing);
await reject('stale approval permitted',data({rules:[{...rule,parameters:{
 ...rule.parameters,dismiss_stale_reviews_on_push:false}}]}),missing);
await reject('latest push unreviewed',data({rules:[{...rule,parameters:{
 ...rule.parameters,require_last_push_approval:false}}]}),missing);
await reject('missing details',{summaries:[summary],detailsById:{}},'RULESET_DETAIL_MISSING');
await reject('metadata mismatch',{summaries:[summary],detailsById:{
 [id]:{...detail,target:'tag'}}},'RULESET_METADATA_MISMATCH');
await reject('duplicate ids',{summaries:[summary,summary],detailsById:{[id]:detail}},'RULESET_ID_MISSING_OR_DUPLICATED');
await reject('valid first cannot hide later corrupt ruleset',{
 summaries:[summary,{...summary,id:9030}],
 detailsById:{[id]:detail,9030:{...detail,id:9030,target:'tag'}}
},'RULESET_METADATA_MISMATCH');
await test('unrelated inactive rulesets do not erase valid rule',()=>{
 const extra={id:9,target:'branch',enforcement:'disabled'};
 assert.equal(audit({summaries:[extra,summary],detailsById:{
  9:{...detail,...extra},[id]:detail}}).ok,true);
});
const fake=(calls,mode='good')=>async(url,opts)=>{
 calls.push({url,opts});
 if(mode==='denied')return {ok:false,text:async()=>''};
 if(mode==='invalid')return {ok:true,text:async()=>'{bad'};
 return {ok:true,text:async()=>JSON.stringify(url.endsWith('true')?[summary]:detail)};
};
const token='dummy-github-credential';
await test('readback uses only fixed GitHub GET and rejects redirects',async()=>{
 const calls=[];const out=await read({fetchImpl:fake(calls),token});
 assert.equal(out.ok,true);assert.equal(calls.length,2);
 for(const c of calls){assert.equal(c.opts.method,'GET');
  assert.equal(c.opts.redirect,'error');assert.equal(c.opts.headers.Authorization,'Bearer '+token);
  assert.ok(c.url.startsWith('https://api.github.com/repos/MeteoMartini/MID/rulesets'));}
});
await test('HTTP denied is blocked',async()=>{
 await assert.rejects(read({fetchImpl:fake([],'denied'),token}),/HTTP_ERROR/);
});
await test('malformed JSON is blocked',async()=>{
 await assert.rejects(read({fetchImpl:fake([],'invalid'),token}),/INVALID_JSON/);
});
await test('missing token is blocked',async()=>{
 await assert.rejects(read({fetchImpl:fake([])}),/INPUT_INVALID/);
});

// Classic branch protection is a separate GitHub-native merge-time rule.
// Explicitly deny incomplete/opaque protection; 403 is NOT proof of absence.
const classicGood={enforce_admins:{enabled:true},
 required_conversation_resolution:{enabled:true},
 allow_force_pushes:{enabled:false},allow_deletions:{enabled:false},
 required_pull_request_reviews:{required_approving_review_count:1,
  dismiss_stale_reviews:true,require_last_push_approval:true,
  bypass_pull_request_allowances:{users:[],teams:[],apps:[]}}};
const classicDenial=async(name,change,reason)=>{
 await test(name,()=>{const x=classicAudit({protection:{...classicGood,...change}});
  assert.equal(x.ok,false);assert.equal(x.reason,reason);
  assert.equal(x.mergeAuthorized,false);});
};
await test('classic policy metadata is a plan, not authority',()=>{
 const x=classicAudit({protection:classicGood});assert.equal(x.ok,true);
 assert.equal(x.releaseAuthorized,false);assert.equal(x.sourceGatePassed,false);
});
await test('classic wrong protected branch denied',()=>{
 const x=classicAudit({protection:classicGood,branch:'refs/heads/mid-stable'});
 assert.equal(x.ok,false);assert.equal(x.reason,'CLASSIC_WRONG_BRANCH');
});
await test('classic missing document denied',()=>{
 const x=classicAudit({});assert.equal(x.reason,'CLASSIC_PROTECTION_NOT_ATTESTED');
});
await classicDenial('classic admin bypass',{enforce_admins:{enabled:false}},
 'CLASSIC_ADMIN_BYPASS_NOT_EXCLUDED');
await classicDenial('classic no thread resolution',{
 required_conversation_resolution:{enabled:false}},'CLASSIC_UNRESOLVED_THREADS_NOT_BLOCKED');
await classicDenial('classic force push still enabled',{
 allow_force_pushes:{enabled:true}},'CLASSIC_HISTORY_MUTATION_NOT_BLOCKED');
await classicDenial('classic deletion still enabled',{
 allow_deletions:{enabled:true}},'CLASSIC_HISTORY_MUTATION_NOT_BLOCKED');
const changeReviews=(diff)=>({required_pull_request_reviews:{
 ...classicGood.required_pull_request_reviews,...diff}});
await classicDenial('classic no approvals',changeReviews({required_approving_review_count:0}),
 'CLASSIC_INDEPENDENT_REVIEW_NOT_ENFORCED');
await classicDenial('classic stale approvals',changeReviews({dismiss_stale_reviews:false}),
 'CLASSIC_INDEPENDENT_REVIEW_NOT_ENFORCED');
await classicDenial('classic self approves latest push',changeReviews({require_last_push_approval:false}),
 'CLASSIC_INDEPENDENT_REVIEW_NOT_ENFORCED');
await classicDenial('classic ambiguous bypass allowances',changeReviews({
 bypass_pull_request_allowances:undefined}),'CLASSIC_REVIEW_BYPASS_NOT_EXCLUDED');
for(const type of ['users','teams','apps']){
 await classicDenial('classic '+type+' bypass',changeReviews({
  bypass_pull_request_allowances:{users:[],teams:[],apps:[],[type]:['untrusted']}
 }), 'CLASSIC_REVIEW_BYPASS_NOT_EXCLUDED');
}
const classicFake=(calls,mode='good')=>async(url,opts)=>{
 calls.push({url,opts});
 if(mode==='403')return {ok:false,status:403,text:async()=>''};
 if(mode==='invalid')return {ok:true,text:async()=>'{bad'};
 return {ok:true,text:async()=>JSON.stringify(classicGood)};
};
await test('classic read uses fixed GET only and enforces redirect error',async()=>{
 const calls=[];const x=await readClassic({fetchImpl:classicFake(calls),token});
 assert.equal(x.ok,true);assert.equal(calls.length,1);
 assert.equal(calls[0].url,'https://api.github.com/repos/MeteoMartini/MID/branches/main/protection');
 assert.equal(calls[0].opts.method,'GET');assert.equal(calls[0].opts.redirect,'error');
 assert.equal(calls[0].opts.headers.Authorization,'Bearer '+token);
});
await test('classic 403 means unreadable, not unprotected',async()=>{
 const x=await readClassic({fetchImpl:classicFake([],'403'),token});
 assert.equal(x.ok,false);assert.equal(x.reason,'CLASSIC_PROTECTION_NOT_READABLE');
});
await test('classic invalid JSON cannot attest rules',async()=>{
 const x=await readClassic({fetchImpl:classicFake([],'invalid'),token});
 assert.equal(x.ok,false);assert.equal(x.reason,'CLASSIC_PROTECTION_NOT_READABLE');
});
await test('classic no token cannot attest rules',async()=>{
 const x=await readClassic({fetchImpl:classicFake([])});
 assert.equal(x.ok,false);assert.equal(x.reason,'CLASSIC_READ_INPUT_INVALID');
});


// Least-privilege default must never issue the Administration:read classic GET.
// The owner UI (2026-11-11) shows no classic protection rules on MID.
await test('default checks only Rulesets and never calls classic',async()=>{
 let classicCalls=0;
 const x=await inspect({token,nativeReader:async()=>audit(data()),
  classicReader:async()=>{classicCalls++;throw new Error('must not call')}});
 assert.equal(x.ok,true);assert.equal(classicCalls,0);
 assert.equal(x.classicQueried,false);
 assert.equal(x.classic.reason,'CLASSIC_SKIPPED_ADMIN_SCOPE');
 assert.equal(x.mergeAuthorized,false);assert.equal(x.releaseAuthorized,false);
});
await test('absent native review stays blocked without a classic 403',async()=>{
 let classicCalls=0;
 const x=await inspect({token,nativeReader:async()=>audit({
  summaries:[],detailsById:{}}),
  classicReader:async()=>{classicCalls++;return classicAudit({protection:classicGood})}});
 assert.equal(x.ok,false);assert.equal(classicCalls,0);
 assert.equal(x.native.reason,'NATIVE_MERGE_TIME_REVIEW_ENFORCEMENT_MISSING');
});
await test('Ruleset read error is a real evidence failure not admin 403',async()=>{
 const x=await inspect({token,nativeReader:async()=>{throw new Error('403')},
  classicReader:async()=>{throw new Error('must not call')}});
 assert.equal(x.ok,false);assert.equal(x.native.reason,'RULESETS_NOT_READABLE');
 assert.equal(x.classic.reason,'CLASSIC_SKIPPED_ADMIN_SCOPE');
});
await test('privileged classic probe remains explicitly opt-in',async()=>{
 let calls=0;
 const x=await inspect({token,includeClassic:true,
  nativeReader:async()=>audit({summaries:[],detailsById:{}}),
  classicReader:async()=>{calls++;return readClassic({
   fetchImpl:classicFake([],'403'),token
  })}});
 assert.equal(calls,1);assert.equal(x.classicQueried,true);
 assert.equal(x.ok,false);
 assert.equal(x.classic.reason,'CLASSIC_PROTECTION_NOT_READABLE');
});
await test('a validated opted-in classic rule is metadata not release authorization',async()=>{
 const x=await inspect({token,includeClassic:true,
  nativeReader:async()=>audit({summaries:[],detailsById:{}}),
  classicReader:async()=>classicAudit({protection:classicGood})});
 assert.equal(x.ok,true);assert.equal(x.native.ok,false);
 assert.equal(x.classic.ok,true);
 assert.equal(x.mergeAuthorized,false);assert.equal(x.releaseAuthorized,false);
});
await test('invalid opt-in mode is fail closed',async()=>{
 const x=await inspect({token,includeClassic:'yes',
  nativeReader:async()=>audit(data())});
 assert.equal(x.ok,false);assert.equal(x.native.ok,false);
 assert.equal(x.classicQueried,false);
 assert.equal(x.native.reason,'RULESETS_NOT_READABLE');
});
await test('malformed positive reader result cannot supply review proof',async()=>{
 const x=await inspect({token,
  nativeReader:async()=>({ok:true,mergeAuthorized:true,releaseAuthorized:true})});
 assert.equal(x.ok,false);
 assert.equal(x.native.reason,'RULESETS_EVIDENCE_INVALID');
});

console.log('MID native merge review QA OK; scenarios='+n+'; ZERO network, secrets or release writes.');
