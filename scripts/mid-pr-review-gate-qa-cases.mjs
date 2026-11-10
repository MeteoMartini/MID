// Pure regression for issue #740; no credentials, network or workflow writes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessMidReviewEvidence} from './mid-pr-review-gate.mjs';
const HEAD='a'.repeat(40);
const ready={headRefOid:HEAD,state:'OPEN',isDraft:false,baseRefName:'main'};
const review=(id,state='COMMENTED',bodyText='15 issues found')=>({id,state,bodyText,submittedAt:'2026-11-10T06:31:56Z',commit:{oid:HEAD}});
const bot={author:{__typename:'Bot',login:'cubic-dev-ai'},authorAssociation:'NONE',bodyText:'P1 error'};
const human={author:{__typename:'User',login:'reviewer'},authorAssociation:'COLLABORATOR',bodyText:'Checked exact SHA and fixed with regression evidence.'};
const thread=(id,resolved=true,comments=[bot,human],outdated=false)=>({id,isResolved:resolved,isOutdated:outdated,comments:{nodes:comments}});
const check=(pr=ready,reviews=[],threads=[])=>assessMidReviewEvidence({pr,reviews,threads,expectedHead:HEAD});
assert.equal(check().ok,true,'No incoming reviews must not create artificial approval gate');
assert.ok(check({...ready,headRefOid:'b'.repeat(40)}).blockers.includes('HEAD_CHANGED'));
assert.ok(check({...ready,isDraft:true}).blockers.includes('PR_NOT_READY'));
assert.ok(check({...ready,state:'MERGED'}).blockers.includes('PR_NOT_READY'));
assert.ok(check(ready,[review('r1','CHANGES_REQUESTED','')]).blockers.includes('CHANGES_REQUESTED:r1'));
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
// Original issue #740 readback: PR #729 received 15+6 Cubic findings and
// 21 unresolved threads before its merge. This synthetic regression embeds
// only counts and resolution state; it never claims an authenticated replay.
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
assert.match(captured729.prHeadSha,/^[a-f0-9]{40}$/);
assert.equal(captured729.reviewSummaries.length,2);
assert.equal(captured729.threads.length,21);
assert.deepEqual(captured729.reviewSummaries.map(x=>x.issueCount),[15,6]);
assert.ok(captured729.reviewSummaries.every(x=>Date.parse(x.submittedAt)<Date.parse(captured729.mergedAt)),
 'All 21 Cubic findings were submitted before the actual merge');
assert.ok(captured729.threads.every(x=>x.resolved===false),'Historical unresolved review threads must not be silently considered fixed');
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
console.log('MID review evidence fail-closed QA: authentic GitHub #729 review/thread metadata and synthetic negatives PASS; NO workflow attached.');
