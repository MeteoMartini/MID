#!/usr/bin/env node
/** Deterministic adversarial QA — no actual network, secrets, release. */
import assert from 'node:assert/strict';
import {assessMidNativeMergeReviewPolicy as audit,
 readMidNativeMergeReviewPolicy as read} from './mid-native-merge-review-policy.mjs';
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
console.log('MID native merge review QA OK; scenarios='+n+'; ZERO network, secrets or release writes.');
