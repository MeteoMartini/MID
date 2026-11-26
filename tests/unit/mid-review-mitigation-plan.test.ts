import {describe,it,expect} from 'vitest';
import {countMitigationRounds,planReviewMitigation,planProvider,proposeNotesSplit} from '../../tools/ci/mid-review-mitigation-plan.mjs';
const base='a'.repeat(40),head='b'.repeat(40),version='0.9.85.523',branch='chatgpt/test',repo='MeteoMartini/MID';
const pr={number:7,state:'open',draft:false,base:{ref:'main',sha:base},head:{sha:head,ref:branch,repo:{full_name:repo}}};
const source={id:77,path:'.github/workflows/chatgpt-pr-gate.yml',event:'pull_request',status:'completed',conclusion:'success',head_sha:head,head_branch:branch,head_repository:{full_name:repo},pull_requests:[{number:7,head:{sha:head},base:{sha:base}}]};
const ref={protected:true,commit:{sha:base}};
const commit=(sha:string,parent:string,message:string)=>({sha,parents:[{sha:parent}],commit:{message}});
const c=commit(head,base,'fix\n\nMID-Review-Mitigation: '+version+'/1-of-4');
const guard={ok:false,reason:'MID_REVIEW_OPEN_THREAD',openThreads:2,resolvedThreads:10,activeChangeRequests:0};
const fixture=(patch:any={})=>({repository:repo,source,pr,main:ref,stable:ref,fromVersion:'0.9.85.522',target:{fromVersion:'0.9.85.522',toVersion:version,requireSourceOfTruth:true},commits:[c],guard,final:{pr,main:base,stable:base},...patch});
describe('review mitigation shadow, no authority',()=>{
 it('observes exact source review halt and budget, never dispatches or writes',()=>{
  expect(planReviewMitigation(fixture())).toMatchObject({state:'REVIEW_HOLD_OBSERVED',rounds:1,remaining:3,openThreads:2,resolvedThreads:10,externalCallsAuthorized:false,writeAuthorized:false,releaseAuthorized:false});
 });
 it('refuses foreign, stale, draft or changed refs and source identity',()=>{
  for(const patch of [{repository:'evil/repo'},{source:{...source,event:'push'}},{source:{...source,conclusion:'failure'}},{source:{...source,pull_requests:[]}},{source:{...source,head_repository:{full_name:'evil/repo'}}},{pr:{...pr,draft:true}},{final:{pr,main:head,stable:base}},{stable:{...ref,protected:false}},{target:{fromVersion:'0.9.85.521',toVersion:version,requireSourceOfTruth:true}}])
   expect(planReviewMitigation(fixture(patch))).toMatchObject({state:'HOLD',writeAuthorized:false,externalCallsAuthorized:false});
 });
 it('rejects missing or inconsistent review counts rather than inventing zero',()=>{
  expect(planReviewMitigation(fixture({guard:{ok:false,reason:'MID_REVIEW_OPEN_THREAD'}}))).toMatchObject({state:'HOLD',openThreads:null,reason:'REVIEW_EVIDENCE_UNKNOWN'});
  expect(planReviewMitigation(fixture({guard:{...guard,openThreads:0}}))).toMatchObject({state:'HOLD',reason:'REVIEW_EVIDENCE_INCONSISTENT'});
  expect(planReviewMitigation(fixture({guard:{...guard,activeChangeRequests:1}}))).toMatchObject({state:'HOLD',reason:'FORMAL_CHANGE_REQUEST_REQUIRES_DISPOSITION'});
  expect(planReviewMitigation(fixture({guard:{ok:true,reason:'READBACK_CLEAN',openThreads:0,resolvedThreads:12,activeChangeRequests:0}}))).toMatchObject({state:'HOLD',reason:'CLEAN_COUNTS_UNVERIFIED',reviewEvidenceVerified:false,releaseAuthorized:false});
 });
 it('counts linear history across HEAD changes and refuses resets, duplicates, malformed trailers and overflow',()=>{
  const chain=[];let prev=base;
  for(let i=1;i<=4;i++){const sha=String(i).repeat(40);chain.push(commit(sha,prev,'fix\n\nMID-Review-Mitigation: '+version+'/'+i+'-of-4'));prev=sha;}
  expect(countMitigationRounds({base,head:prev,version,commits:chain})).toBe(4);
  const nextPr={...pr,head:{...pr.head,sha:prev}};
  expect(planReviewMitigation(fixture({source:{...source,head_sha:prev,pull_requests:[{number:7,head:{sha:prev},base:{sha:base}}]},pr:nextPr,final:{pr:nextPr,main:base,stable:base},commits:chain}))).toMatchObject({state:'HOLD',reason:'BUDGET_EXHAUSTED',remaining:0});
  for(const commits of [[commit(head,base,'MID-Review-Mitigation: '+version+'/2-of-4')],[commit(head,head,'fix')],[commit(head,base,'MID-Review-Mitigation: '+version+'/1-of-4\nMID-Review-Mitigation: '+version+'/1-of-4')],[...chain,commit(head,prev,'MID-Review-Mitigation: '+version+'/5-of-4')]])
   expect(countMitigationRounds({base,head,version,commits})).toBeNull();
 });
 it('never permits a provider, unknown model or paid fallback without separate verified routing',()=>{
  for(const provider of ['openai','groq','openrouter','other','constructor','__proto__'])expect(planProvider(provider)).toMatchObject({state:'HOLD',maxCalls:0,externalCallsAuthorized:false});
 });
 it('only prepares lossless notes split as a ref-free untrusted proposal',()=>{
  const raw=JSON.stringify({schema:1,version,internal:['Alpha; Beta','Gamma'],external:['Keep'],sourceOfTruth:['Pinned evidence']});
  const p=proposeNotesSplit({raw,index:0,segments:['Alpha','Beta']});
  expect(JSON.parse(p.content)).toEqual({schema:1,version,internal:['Alpha','Beta','Gamma'],external:['Keep'],sourceOfTruth:['Pinned evidence']});
  expect(p).toMatchObject({writeAuthorized:false,releaseAuthorized:false,state:'UNTRUSTED_PROPOSAL_ONLY'});
  for(const segments of [['Alpha','Changed'],['Alpha'],[' Alpha','Beta']])expect(()=>proposeNotesSplit({raw,index:0,segments})).toThrow();
 });
});
