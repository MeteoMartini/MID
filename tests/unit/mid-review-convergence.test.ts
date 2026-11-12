import {describe,it,expect} from 'vitest';
import {assessMidReviewConvergence,MAX_AUTOMATIC_FIX_ROUNDS} from '../../tools/ci/mid-review-convergence.mjs';
import {assessMidPrBacklog,classifyMidPrPaths} from '../../tools/ci/mid-pr-backlog.mjs';

const stable='a'.repeat(40),head='b'.repeat(40),old='c'.repeat(40);
const finding=(overrides:any={})=>({
 id:'review-1',headSha:head,path:'tools/ci/example.mjs',rule:'unsafe-merge',
 anchor:'line:42',severity:'P1',domainCritical:false,disposition:'open',...overrides
});
const input=(overrides:any={})=>({stableSha:stable,mainSha:stable,baseSha:stable,
 headSha:head,reviewedHeadSha:head,phase:'draft',automaticFixRounds:0,
 findings:[],openReviewThreads:0,changesRequested:0,...overrides});
describe('MID review convergence without review/release bypass',()=>{
 it('never supplies merge, release, or source-gate approval',()=>{
  for(const phase of ['draft','frozen','source-verified'] as const){
   const o=assessMidReviewConvergence(input({phase,sourceGateHeadSha:head}));
   expect(o.mergeAuthorized).toBe(false);
   expect(o.releaseAuthorized).toBe(false);
   expect(o.sourceGateAuthorized).toBe(false);
   expect(o.autoCloseThreads).toBe(false);
  }
 });
 it('advises draft freeze only after a clean review state',()=>{
  expect(assessMidReviewConvergence(input()).action).toBe('FREEZE_HEAD_AND_RUN_SOURCE');
  expect(assessMidReviewConvergence(input({phase:'frozen'})).action).toBe('RUN_COMPLETE_SOURCE_GATE');
  expect(assessMidReviewConvergence(input({phase:'source-verified',sourceGateHeadSha:head})).action)
   .toBe('AWAIT_NATIVE_MERGE_AND_INSTALLER_GATES');
 });
 it('permits maximum two scoped automatic fix rounds, not an infinite loop',()=>{
  expect(MAX_AUTOMATIC_FIX_ROUNDS).toBe(2);
  for(const round of [0,1]){
   const o=assessMidReviewConvergence(input({automaticFixRounds:round,findings:[finding()]}));
   expect(o.action).toBe('ONE_SCOPED_DRAFT_FIX_ROUND_ALLOWED');
   expect(o.remainingAutomaticFixRounds).toBe(2-round);
  }
  const o=assessMidReviewConvergence(input({automaticFixRounds:2,findings:[finding()]}));
  expect(o.action).toBe('HUMAN_SCOPE_DECISION');
  expect(o.unresolvedCritical).toEqual(['review-1']);
  expect(assessMidReviewConvergence(input({automaticFixRounds:3})).action).toBe('BLOCK_INVALID_EVIDENCE');
 });
 it('blocks P0/P1 and domain-critical P2 even if labeled deferred',()=>{
  for(const f of [finding({severity:'P0',disposition:'deferred'}),
   finding({severity:'P1',disposition:'deferred'}),
   finding({severity:'P2',domainCritical:true,disposition:'deferred',ownerRiskAccepted:true})]){
   const o=assessMidReviewConvergence(input({phase:'frozen',findings:[f]}));
   expect(o.action).toBe('HUMAN_SCOPE_DECISION');
   expect(o.unresolvedCritical.length).toBe(1);
  }
 });
 it('does not accept self-claimed fixes without SHA-bound independent evidence',()=>{
  const unverified=finding({disposition:'fixed',independentVerified:false,evidenceSha:head,evidenceRef:'https://example.org/longref'});
  const o=assessMidReviewConvergence(input({findings:[unverified]}));
  expect(o.needsEvidence).toEqual(['review-1']);
  const verified={...unverified,independentVerified:true};
  expect(assessMidReviewConvergence(input({findings:[verified]})).action)
   .toBe('FREEZE_HEAD_AND_RUN_SOURCE');
 });
 it('refuses stale source evidence, any open native threads, change requests or drift',()=>{
  expect(assessMidReviewConvergence(input({mainSha:old})).action).toBe('BLOCK_INVALID_EVIDENCE');
  expect(assessMidReviewConvergence(input({reviewedHeadSha:old})).action).toBe('BLOCK_INVALID_EVIDENCE');
  expect(assessMidReviewConvergence(input({findings:[finding({headSha:old})]})).action)
   .toBe('BLOCK_INVALID_EVIDENCE');
  expect(assessMidReviewConvergence(input({phase:'source-verified',sourceGateHeadSha:old})).action)
   .toBe('BLOCK_INVALID_EVIDENCE');
  for(const key of ['openReviewThreads','changesRequested'] as const)
   expect(assessMidReviewConvergence(input({[key]:1,phase:'source-verified',sourceGateHeadSha:head})).action)
    .toBe('HUMAN_SCOPE_DECISION');
 });
 it('groups repeated AI reports but never suppresses conflicting dispositions or newer heads',()=>{
  const f=finding();
  const same=finding({id:'second AI report'});
  const o=assessMidReviewConvergence(input({findings:[f,same]}));
  expect(o.uniqueFindings).toBe(1);
  expect(o.duplicateFindings).toHaveLength(1);
  expect(assessMidReviewConvergence(input({findings:[f,{...same,disposition:'fixed'}]})).action)
   .toBe('BLOCK_INVALID_EVIDENCE');
 });
 it('rejects a string risk-acceptance flag and conflicting same-fingerprint acceptance evidence',()=>{
  const base=finding({severity:'P2',disposition:'deferred',
   independentVerified:true,evidenceSha:head,evidenceRef:'https://github.com/example/proof',
   ownerRiskAccepted:'false'});
  const invalid=assessMidReviewConvergence(input({findings:[base]}));
  expect(invalid.needsTriage).toEqual(['review-1']);
  const proven={...base,ownerRiskAccepted:true};
  const sameFingerprint={...proven,id:'review-2',ownerRiskAccepted:false};
  expect(assessMidReviewConvergence(input({findings:[proven,sameFingerprint]})).action)
   .toBe('BLOCK_INVALID_EVIDENCE');
  expect(assessMidReviewConvergence(input({findings:[proven]})).backlog)
   .toEqual(['review-1']); // Merely caller-supplied triage, no real review authentication.
 });
 it('tracks noncritical P3 and requires disposition for noncritical P2',()=>{
  expect(assessMidReviewConvergence(input({findings:[finding({severity:'P3'})]})).action)
    .toBe('FREEZE_HEAD_AND_RUN_SOURCE');
  expect(assessMidReviewConvergence(input({findings:[finding({severity:'P2'})]})).action)
    .toBe('ONE_SCOPED_DRAFT_FIX_ROUND_ALLOWED');
 });
});
const pr=(number:number,baseSha=stable,files:string[]=[],draft=true)=>({
 number,state:'open',draft,headSha:String(number).padStart(40,'d'),baseSha,files
});
describe('MID PR backlog: read-only path and lineage triage',()=>{
 it('fails closed if Stable differs from main',()=>{
  const o=assessMidPrBacklog({mainSha:old,stableSha:stable,pullRequests:[]});
  expect(o.valid).toBe(false);
  expect(o.releaseAuthorized).toBe(false);
 });
 it('never marks Draft or suggested path batches as release authorized',()=>{
  const o=assessMidPrBacklog({mainSha:stable,stableSha:stable,
   pullRequests:[pr(755,stable,['src/map-popup.ts']),pr(759,stable,['ci/github/workflows/codeql.yml'])]});
  expect(o.valid).toBe(true);
  expect(o.proposedReviewBatch).toContain(755);
  expect(o.proposedReviewBatch).toContain(759);
  expect(o.entries.every((x:any)=>x.releaseAuthorized===false)).toBe(true);
  expect(o.mergeAuthorized).toBe(false);
  expect(o.autoClosePrs).toBe(false);
 });
 it('requires SHA lineage review for old bases and a verified changed-path inventory',()=>{
  const o=assessMidPrBacklog({mainSha:stable,stableSha:stable,
   pullRequests:[pr(741,old,['src/wind.ts']),pr(742,stable,[])]});
  expect(o.proposedReviewBatch).toEqual([]);
  expect(o.entries.find((p:any)=>p.number===741).checksRequired).toContain('SOURCE_LINEAGE_REVIEW');
  expect(o.entries.find((p:any)=>p.number===742).checksRequired).toContain('CHANGED_FILES_NOT_VERIFIED');
 });
 it('never treats path overlap with published code as proof of already merged',()=>{
  const o=assessMidPrBacklog({mainSha:stable,stableSha:stable,
   alreadyReleasedPaths:['tools/ci/mid-review-premerge-guard.mjs'],
   pullRequests:[pr(758,stable,['tools/ci/mid-review-premerge-guard.mjs'])]});
  expect(o.entries[0].checksRequired).toContain('LIVE_DIFF_COMPARE_REQUIRED');
  expect(JSON.stringify(o)).not.toContain('ALREADY_MERGED');
 });
 it('detects collisions and caps integration planning at the existing 5-PR contract',()=>{
  const o=assessMidPrBacklog({mainSha:stable,stableSha:stable,maxBatch:2,
   pullRequests:[pr(750,stable,['src/ruc.ts']),pr(755,stable,['src/map.ts']),
    pr(757,stable,['src/map.ts']),pr(759,stable,['tools/ci/scan.mjs'])]});
  expect(o.valid).toBe(true);
  expect(o.proposedReviewBatch).toHaveLength(2);
  expect(o.pathCollisions).toHaveLength(1);
  expect(o.pathCollisions[0].pr).toBe(757);
  expect(assessMidPrBacklog({mainSha:stable,stableSha:stable,maxBatch:6,pullRequests:[]}).valid).toBe(false);
 });
 it('does not invent self-conflicts for repeated paths or reject harmless literal double dots',()=>{
  const o=assessMidPrBacklog({mainSha:stable,stableSha:stable,pullRequests:[
   pr(755,stable,['src/model..old.ts','src/model..old.ts']),
   pr(757,stable,['src/map-popup.ts']),
  ]});
  expect(o.valid).toBe(true);
  expect(o.entries.find((p:any)=>p.number===755).changedPaths).toBe(1);
  expect(o.proposedReviewBatch).toContain(755);
  expect(o.proposedReviewBatch).toContain(757);
  expect(o.pathCollisions).toHaveLength(0);
  const unsafe=assessMidPrBacklog({mainSha:stable,stableSha:stable,pullRequests:[
   pr(760,stable,['src/../secrets.ts']),
  ]});
  expect(unsafe.entries[0].checksRequired).toContain('CHANGED_FILES_NOT_VERIFIED');
  expect(unsafe.proposedReviewBatch).toEqual([]);
 });
 it('classifies by real paths, not misleading PR titles',()=>{
  expect(classifyMidPrPaths(['ci/github/workflows/install-mid.yml'])).toBe('release-security');
  expect(classifyMidPrPaths(['src/ruc/model.ts'])).toBe('meteorology-ruc');
  expect(classifyMidPrPaths(['src/map-popup.ts'])).toBe('maps-ui');
 });
});
