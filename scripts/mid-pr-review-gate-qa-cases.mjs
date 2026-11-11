// Pure regression for issue #740; no credentials, network or workflow writes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessMidReviewEvidence,readMidReviewEvidence} from './mid-pr-review-gate.mjs';
const HEAD='a'.repeat(40);
const ready={headRefOid:HEAD,state:'OPEN',isDraft:false,baseRefName:'main'};
const review=(id,state='COMMENTED',bodyText='15 issues found')=>({id,state,bodyText,submittedAt:'2026-11-10T06:31:56Z',commit:{oid:HEAD}});
const bot={author:{__typename:'Bot',login:'cubic-dev-ai'},authorAssociation:'NONE',bodyText:'P1 error'};
const human={author:{__typename:'User',login:'reviewer'},authorAssociation:'COLLABORATOR',bodyText:'Checked exact SHA and fixed with regression evidence.'};
const thread=(id,resolved=true,comments=[bot,human],outdated=false)=>({id,isResolved:resolved,isOutdated:outdated,comments:{nodes:comments}});
const check=(pr=ready,reviews=[],threads=[])=>assessMidReviewEvidence({pr,reviews,threads,expectedHead:HEAD});
assert.equal(check().ok,true,'No incoming reviews must not create artificial approval gate');
assert.equal(check(ready,[review('approved','APPROVED','')]).ok,true,'Approval on exact head is permitted, but not required');
assert.equal(check(ready,[review('approved-lgtm','APPROVED','LGTM')]).ok,true,'An unstructured approval with no issues is not a finding');
assert.ok(check(ready,[review('approved-findings','APPROVED','1 issue found')]).blockers.includes('ISSUE_SUMMARY_THREADS_INCOMPLETE'),'Even an explicit approved review finding must not be ignored');
assert.ok(check(ready,[{...review('stale','APPROVED',''),commit:{oid:'b'.repeat(40)}}]).blockers.includes('REVIEW_HEAD_SHA_STALE:stale'),'An old-head approval never authorizes new changes');
assert.ok(check(ready,[review('mixed','COMMENTED','0 issues found; 2 issues found')]).blockers.includes('REVIEW_ISSUE_COUNT_CONFLICT:mixed'),'Contradictory zero/nonzero finding summaries must fail closed');
assert.ok(check({...ready,headRefOid:'b'.repeat(40)}).blockers.includes('HEAD_CHANGED'));
assert.ok(check({...ready,isDraft:true}).blockers.includes('PR_NOT_READY'));
assert.ok(check({...ready,state:'MERGED'}).blockers.includes('PR_NOT_READY'));
assert.ok(check(ready,[review('r1','CHANGES_REQUESTED','')]).blockers.includes('CHANGES_REQUESTED:r1'));
assert.ok(check(ready,[review('unknown','UNKNOWN','')]).blockers.includes('REVIEW_STATE_UNEXPECTED:unknown'),
 'New or corrupted review states must fail closed, even with empty body');
assert.ok(check(ready,[],[thread('t1',false)]).blockers.includes('UNRESOLVED_REVIEW_THREAD:t1'));
assert.ok(check(ready,[],[thread('t1',false,[bot,human],true)]).blockers.includes('UNRESOLVED_REVIEW_THREAD:t1'),'Outdated but untriaged stays blocked');
assert.ok(check(ready,[],[thread('t1',true,[bot])]).blockers.includes('RESOLUTION_EVIDENCE_MISSING:t1'));
assert.ok(check(ready,[],[thread('t1',true,[bot,{...human,author:{__typename:'Bot',login:'other'}}])]).blockers.includes('RESOLUTION_EVIDENCE_MISSING:t1'));
assert.ok(check(ready,[],[thread('t1',true,[bot,{...human,bodyText:'fixed'}])]).blockers.includes('RESOLUTION_EVIDENCE_MISSING:t1'));
assert.ok(check(ready,[],[thread('t1')]).blockers.includes('INDEPENDENT_TRIAGE_ATTESTATION_REQUIRED'),'Human reply and resolved thread are insufficient without independently verified SHA-bound correction');
assert.equal(check(ready,[review('dismissed','DISMISSED')],[]).ok,true,'Dismissed submission alone is not a live defect');
assert.ok(check(ready,[review('r1')],[]).blockers.includes('ISSUE_SUMMARY_THREADS_INCOMPLETE'));
assert.ok(check(ready,[review('r1','COMMENTED','Nontrivial review without inline comments')],[]).blockers.includes('REVIEW_SUMMARY_WITHOUT_THREADS:r1'));
const threads=Array.from({length:15},(_,i)=>thread('t'+i,true));
assert.ok(check(ready,[review('r1')],threads).blockers.includes('INDEPENDENT_TRIAGE_ATTESTATION_REQUIRED'),'Even 15 resolved reviewer findings require separate verified disposition');
assert.equal(check(ready,[review('r1')],threads.map((t,i)=>i===14?{...t,isResolved:false}:t)).ok,false);
assert.ok(check(ready,[],[thread('t1'),thread('t1')]).blockers.includes('THREAD_ID_DUPLICATED_OR_MISSING'));
assert.ok(check(ready,[{...review('r1'),commit:null}],threads).blockers.includes('REVIEW_PROVENANCE_MISSING:r1'));
assert.ok(check(ready,[review('r1'),review('r1')],threads).blockers.includes('REVIEW_ID_DUPLICATED:r1'));
assert.equal(check(ready,[review('r0','COMMENTED','0 issues found')],[]).ok,true,'Zero-finding summary is not a substantive review blocker');
assert.ok(check(ready,[],[thread('resolved',true,[bot,human],true)]).blockers.includes('INDEPENDENT_TRIAGE_ATTESTATION_REQUIRED'),'Outdated human answered thread still requires original code provenance');
// Original issue #740: PR #729 received 15+6 Cubic findings before merge.
// All 21 resolution states in the real public fixture were read POST-MERGE;
// the unresolved pre-merge example here is deliberately SYNTHETIC, not an
// authenticated reconstruction of review state at the prior merge instant.
const cubic729=Array.from({length:21},(_,i)=>thread('review729-t'+i,false,[bot]));
const historic=check(ready,[review('cubic1','COMMENTED','15 issues found'),review('cubic2','COMMENTED','6 issues found')],cubic729);
assert.equal(historic.ok,false);
assert.equal(historic.reportedIssues,21);
assert.equal(historic.threadCount,21);
assert.ok(historic.blockers.includes('UNRESOLVED_REVIEW_THREAD:review729-t0'));
assert.ok(historic.blockers.includes('INDEPENDENT_TRIAGE_ATTESTATION_REQUIRED'));
// Metadata below was captured from the actual PR #729 GitHub review record.
// Historical GitHub state is MERGED; the OPEN state here models the instant
// before the original merge. The review's commit OID is simulated because the
// normalized public review record does not expose its original review commit.
const captured729=JSON.parse(readFileSync(new URL('../tests/fixtures/mid-pr729-cubic-reviewed-record-20261110.json',import.meta.url),'utf8'));
assert.equal(captured729.schema,1);
assert.equal(captured729.pr,729);
assert.ok(captured729.source.startsWith('Post-merge')&&captured729.source.includes('NOT a verified pre-merge'),'Historical thread provenance must stay explicitly post-merge');
assert.match(captured729.prHeadSha,/^[a-f0-9]{40}$/);
assert.equal(captured729.reviewSummaries.length,2);
assert.equal(captured729.threads.length,21);
assert.deepEqual(captured729.reviewSummaries.map(x=>x.issueCount),[15,6]);
assert.ok(captured729.reviewSummaries.every(x=>Date.parse(x.submittedAt)<Date.parse(captured729.mergedAt)),
 'All 21 Cubic findings were submitted before the actual merge');
assert.ok(captured729.threads.every(x=>x.resolved===false),'Threads observed unresolved at post-merge readback are not proven unresolved at merge time');
assert.equal(captured729.threads.filter(x=>x.priority==='P1').length,1);
const realFormatReviews=captured729.reviewSummaries.map(x=>({
 id:x.id,state:x.state,submittedAt:x.submittedAt,
 bodyText:x.issueCount+' issues found',commit:{oid:captured729.prHeadSha}
}));
const realFormatThreads=captured729.threads.map(x=>({
 id:x.id,isResolved:x.resolved,isOutdated:x.outdated,
 comments:{nodes:[{bodyText:'Historic public Cubic review, see '+x.path,
  authorAssociation:'NONE',author:{__typename:'Bot',login:x.firstCommentAuthor}}]}
}));
const realPrReady={...ready,headRefOid:captured729.prHeadSha};
const realPreMerge=assessMidReviewEvidence({pr:realPrReady,reviews:realFormatReviews,
 threads:realFormatThreads,expectedHead:captured729.prHeadSha});
assert.equal(realPreMerge.ok,false);
assert.equal(realPreMerge.threadCount,21);
assert.equal(realPreMerge.reportedIssues,21);
assert.equal(realPreMerge.blockers.filter(x=>x.startsWith('UNRESOLVED_REVIEW_THREAD:')).length,21);
assert.ok(realPreMerge.blockers.includes('INDEPENDENT_TRIAGE_ATTESTATION_REQUIRED'));
assert.ok(assessMidReviewEvidence({pr:{...realPrReady,state:'MERGED'},
 reviews:realFormatReviews,threads:realFormatThreads,
 expectedHead:captured729.prHeadSha}).blockers.includes('PR_NOT_READY'));
// GitHub GraphQL pagination and failure-mode proof. global.fetch is replaced
// inside this isolated Node test process ONLY, with no real HTTP calls/token.
const originalFetch=globalThis.fetch;
function fakePr(oid=HEAD){
 return {id:'PR-test',state:'OPEN',isDraft:false,headRefOid:oid,baseRefName:'main'};
}
function apiPage({meta=fakePr(),reviewNodes=[],threadNodes=[],reviewNext=false,threadNext=false,
 reviewCursor=null,threadCursor=null}={}){
 return {...meta,
  reviews:{nodes:reviewNodes,pageInfo:{hasNextPage:reviewNext,endCursor:reviewCursor}},
  reviewThreads:{nodes:threadNodes,pageInfo:{hasNextPage:threadNext,endCursor:threadCursor}}};
}
async function mockGraphql(pages,fn){
 const requests=[];
 let index=0;
 globalThis.fetch=async (url,options)=>{
  assert.equal(url,'https://api.github.com/graphql');
  assert.equal(options.method,'POST');
  const request=JSON.parse(options.body);
  requests.push(request.variables);
  const next=pages[index++];
  if(next instanceof Error)throw next;
  if(next===403)return {ok:false,status:403};
  if(!next)throw new Error('Unmocked request was attempted');
  return {ok:true,status:200,json:async()=>next.errors?next:{data:{repository:{pullRequest:next}}}};
 };
 try{return await fn(requests)}finally{globalThis.fetch=originalFetch}
}
const pgReview={id:'review-1',state:'COMMENTED',bodyText:'0 issues found',
 submittedAt:'2026-11-10T06:00:00Z',commit:{oid:HEAD}};
const pgThreadA=thread('thread-A',false);
const pgThreadB=thread('thread-B',false);
await mockGraphql([
 apiPage({reviewNodes:[pgReview],threadNodes:[pgThreadA],threadNext:true,threadCursor:'cursor-B'}),
 apiPage({reviewNodes:[pgReview],threadNodes:[pgThreadB]})
],async requests=>{
 const read=await readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'});
 assert.equal(read.reviews.length,1,'Completed review page must not be counted twice when thread pages continue');
 assert.deepEqual(read.threads.map(t=>t.id),['thread-A','thread-B']);
 assert.equal(requests.length,2);
 assert.equal(requests[0].tCursor,null);
 assert.equal(requests[1].tCursor,'cursor-B');
 assert.equal(requests[1].rCursor,null);
});
await mockGraphql([
 apiPage({threadNodes:[pgThreadA],threadNext:true,threadCursor:null})
],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /Review pagination cursor missing/
));
const missingPaginationFlag=apiPage();
delete missingPaginationFlag.reviewThreads.pageInfo.hasNextPage;
await mockGraphql([missingPaginationFlag],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /Review page missing or pagination state invalid/
));
await mockGraphql([
 apiPage({reviewNext:true,reviewCursor:'same'}),
 apiPage({reviewNext:true,reviewCursor:'same'})
],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /Review pagination cursor missing or stalled/
));
await mockGraphql([
 apiPage({threadNext:true,threadCursor:'second'}),
 apiPage({meta:{...fakePr(),baseRefName:'release'}})
],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /PR identity\/head\/state\/base moved during review pagination/
));
await mockGraphql([
 apiPage({reviewNext:true,reviewCursor:'reviews-page2',threadNodes:[pgThreadA]}),
 apiPage({meta:fakePr('b'.repeat(40)),reviewNodes:[pgReview]})
],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /PR identity\/head\/state\/base moved during review pagination/
));
await mockGraphql([403],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /GitHub GraphQL HTTP 403/
));
await mockGraphql([{errors:[{message:'Access denied'}]}],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:'synthetic-read-only'}),
 /GitHub review readback incomplete/
));
await mockGraphql([apiPage({threadNext:true,threadCursor:'x'})],async()=>assert.rejects(
 ()=>readMidReviewEvidence({repo:'MeteoMartini/MID',number:729,token:''}),
 /Invalid review gate configuration/
));
assert.equal(globalThis.fetch,originalFetch,'Global fetch must be restored after isolated mock');
console.log('MID review GraphQL mock: two-page readback, stale HEAD/base, missing pagination flag, stalled cursor, HTTP 403 and API errors PASS; no network.');
console.log('MID review evidence fail-closed QA: real GitHub #729 review metadata plus synthetic negatives PASS; NO workflow attached.');

