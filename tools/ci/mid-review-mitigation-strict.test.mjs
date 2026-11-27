import {test} from 'node:test';
import assert from 'node:assert/strict';
import {planReviewMitigation, countMitigationRounds, proposeNotesSplit, MAX_ROUNDS} from './mid-review-mitigation-plan.mjs';
const base='a'.repeat(40),head='b'.repeat(40),repo='MeteoMartini/MID',branch='chatgpt/test';
const pr={number:7,state:'open',draft:false,base:{ref:'main',sha:base},head:{sha:head,ref:branch,repo:{full_name:repo}}};
const source={id:77,path:'.github/workflows/chatgpt-pr-gate.yml',event:'pull_request',status:'completed',conclusion:'success',head_sha:head,head_branch:branch,head_repository:{full_name:repo},pull_requests:[{number:7,head:{sha:head},base:{sha:base}}]};
const ref={protected:true,commit:{sha:base}};
const guard={ok:false,reason:'MID_REVIEW_OPEN_THREAD',openThreads:2,resolvedThreads:10,activeChangeRequests:0};
const fixture=(patch={})=>({repository:repo,source,pr,main:ref,stable:ref,fromVersion:'0.9.85.526',target:{fromVersion:'0.9.85.526',toVersion:'0.9.85.527',requireSourceOfTruth:true},commits:[{sha:head,parents:[{sha:base}],commit:{message:'fix'}}],guard,final:{pr,main:base,stable:base},...patch});
function noAuthority(r){for(const k of ['externalCallsAuthorized','writeAuthorized','releaseAuthorized','reviewEvidenceVerified'])assert.equal(r[k],false);}
for(const [name,counts] of [
 ['open-thread reason without open threads',{openThreads:0,activeChangeRequests:1}],
 ['changes-requested reason without requests',{reason:'MID_REVIEW_CHANGES_REQUESTED',openThreads:2,activeChangeRequests:0}],
 ['changes-requested reason contradicts open-thread priority',{reason:'MID_REVIEW_CHANGES_REQUESTED',openThreads:2,activeChangeRequests:1}]
])test(name,()=>{const r=planReviewMitigation(fixture({guard:{...guard,...counts}}));noAuthority(r);assert.equal(r.reason,'REVIEW_EVIDENCE_INCONSISTENT');assert.equal(r.state,'HOLD');});
for(const v of ['0.9.85.525','0.9.84.9999','0.8.999.999','0.09.85.527','0.9.85.0527','0.9.85.9007199254740992','0.9.85.526','0.9.85.527\n'])test('reject invalid or nonascending version '+v,()=>{const f=fixture();f.target.toVersion=v;const r=planReviewMitigation(f);noAuthority(r);assert.equal(r.reason,'VERSION_UNVERIFIED');});
for(const v of ['0.9.85.527','0.9.86.0','0.10.0.0'])test('accept ascending version '+v,()=>{const f=fixture();f.target.toVersion=v;const r=planReviewMitigation(f);noAuthority(r);assert.equal(r.state,'REVIEW_HOLD_OBSERVED');});
test('native guard priority: open threads plus requests remains formal hold',()=>{const r=planReviewMitigation(fixture({guard:{...guard,activeChangeRequests:1}}));noAuthority(r);assert.equal(r.reason,'FORMAL_CHANGE_REQUEST_REQUIRES_DISPOSITION');});
test('native guard priority: requests only remains formal hold',()=>{const r=planReviewMitigation(fixture({guard:{...guard,reason:'MID_REVIEW_CHANGES_REQUESTED',openThreads:0,activeChangeRequests:1}}));noAuthority(r);assert.equal(r.reason,'FORMAL_CHANGE_REQUEST_REQUIRES_DISPOSITION');});
test('caller clean counts remain explicitly unverified HOLD',()=>{const r=planReviewMitigation(fixture({guard:{...guard,ok:true,reason:'READBACK_CLEAN',openThreads:0,pr:999,head:'c'.repeat(40)}}));noAuthority(r);assert.equal(r.state,'HOLD');assert.equal(r.reason,'CLEAN_COUNTS_UNVERIFIED');});
test('round history rejects noncanonical or unsafe version components',()=>{for(const version of ['0.09.85.527','0.9.85.9007199254740992'])assert.equal(countMitigationRounds({base,head,version,commits:fixture().commits}),null);});
const version='0.9.85.527';
const trailer='MID-Review-Mitigation: '+version+'/1-of-'+MAX_ROUNDS;
const rounds=message=>countMitigationRounds({base,head,version,commits:[{sha:head,parents:[{sha:base}],commit:{message}}]});
for(const [name,message,expected] of [
 ['canonical terminal trailer','fix\n\n'+trailer,1],
 ['CRLF and adjacent valid trailers','fix\r\n\r\nReviewed-by: Reviewer\r\n'+trailer+'\r\n',1],
 ['body mention before final prose','fix\n\n'+trailer+'\n\nMore prose',0],
 ['body mention before different final trailer','fix\n\n'+trailer+'\n\nSigned-off-by: Reviewer',0],
 ['subject marker is ambiguous, not a counted round',trailer,null],
 ['mixed terminal prose and marker','fix\n\nprose\n'+trailer,null],
 ['duplicate terminal marker','fix\n\n'+trailer+'\n'+trailer,null],
 ['noncanonical continuation','fix\n\n'+trailer+'\n continuation',null],
 ['wrong budget suffix','fix\n\n'+trailer.replace('-of-'+MAX_ROUNDS,'-of-99'),null]
])test('trailer boundary: '+name,()=>assert.equal(rounds(message),expected));
const validNotes={schema:1,version,external:['Visible'],internal:['Alpha; Beta','Keep'],sourceOfTruth:['Pinned evidence']};
const propose=notes=>proposeNotesSplit({raw:JSON.stringify(notes),index:0,segments:['Alpha','Beta']});
test('valid notes proposal preserves external and provenance entries without authority',()=>{const r=propose(validNotes);assert.deepEqual(JSON.parse(r.content),{...validNotes,internal:['Alpha','Beta','Keep']});assert.equal(r.writeAuthorized,false);assert.equal(r.releaseAuthorized,false);});
for(const [field,value] of [['external',undefined],['external',[]],['external',['']],['external',[0]],['sourceOfTruth',[]],['sourceOfTruth',undefined],['internal',['Alpha; Beta',' ']]])test('notes reject missing or malformed '+field+' '+JSON.stringify(value),()=>assert.throws(()=>propose({...validNotes,[field]:value}),/REPAIR_NOT_LOSSLESS/));
