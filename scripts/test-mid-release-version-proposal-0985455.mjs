import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMidVersion,makeProposedVersion,analyzeReleaseVersion,verifyProposedTarget} from '../tools/ci/mid-release-version-proposal.mjs';
const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const live={stableSha:a,mainSha:a,version:'0.9.85.454'};
const one=(impact='maintenance')=>({schema:1,stableSha:a,mainSha:a,baseVersion:'0.9.85.454',
 candidates:[{pr:745,headSha:b,impact,reason:'Checked product impact and actual changed code',changedPaths:['src/example.tsx']}]});

test('MID four-component version is preserved without SemVer conversion',()=>{
 assert.deepEqual(parseMidVersion('0.9.85.454'),[0,9,85,454]);
 assert.throws(()=>parseMidVersion('0.9.85'),/four-component/);
 for(const bad of ['1.01.2.3','0.9.85.454+meta','v0.9.85.454','0.9.85.-1','0.9.85.9007199254740992'])
  assert.throws(()=>parseMidVersion(bad));
});
test('only maintenance increments W',()=>{
 const r=analyzeReleaseVersion(one(),live);
 assert.equal(r.proposedVersion,'0.9.85.455');
 assert.equal(r.bump,'maintenance');
 assert.equal(r.releaseAuthorized,false);
 assert.equal(verifyProposedTarget(r,'0.9.85.455'),true);
});
test('a verified prospective independent feature proposes Z and resets W',()=>{
 const r=analyzeReleaseVersion(one('feature'),live);
 assert.equal(r.proposedVersion,'0.9.86.0');
 assert.equal(verifyProposedTarget(r,'0.9.86.0'),true);
});
test('mixed maintenance and feature proposals use highest compatible impact',()=>{
 const m=one();m.candidates.push({...m.candidates[0],pr:748,headSha:c,impact:'feature',changedPaths:['src/another.ts']});
 const r=analyzeReleaseVersion(m,live);
 assert.equal(r.proposedVersion,'0.9.86.0');
});
test('Y and X are never auto-proposed, even if manifest explicitly requests them',()=>{
 for(const impact of ['generation','breaking','unknown']){
  const r=analyzeReleaseVersion(one(impact),live);
  assert.equal(r.proposedVersion,null);
  assert.equal(r.readyForIntegrationReview,false);
  assert.equal(r.releaseAuthorized,false);
  assert.throws(()=>verifyProposedTarget(r,'1.0.0.0'));
 }
});
test('a forged target X or Y is forbidden regardless of impact and intent',()=>{
 const r=analyzeReleaseVersion(one('feature'),live);
 for(const desired of ['1.0.0.0','0.10.0.0','0.9.87.0','0.9.86.1'])
  assert.throws(()=>verifyProposedTarget(r,desired));
});
test('stale source or version blocks, even when candidate evidence says maintenance',()=>{
 for(const changed of [{stableSha:c},{mainSha:c},{version:'0.9.85.455'},null]){
  const r=analyzeReleaseVersion(one(),changed?{...live,...changed}:null);
  assert.equal(r.readyForIntegrationReview,false);
  assert.equal(r.proposedVersion,null);
 }
});
test('malformed evidence and duplicate candidate entries fail closed',()=>{
 const base=one();
 for(const update of [{baseVersion:'0.9.85'}, {stableSha:c},{candidates:[]},{candidates:[null]},
  {candidates:[{...base.candidates[0],changedPaths:['../AGENTS.md']}]},
  {candidates:[{...base.candidates[0],reason:''}]},
  {candidates:[base.candidates[0],base.candidates[0]]}])
  assert.throws(()=>analyzeReleaseVersion({...base,...update},live));
});
test('no automatic major bump even from a future major base',()=>{
 const m=one();m.baseVersion='1.1.1.7';
 const r=analyzeReleaseVersion(m,{...live,version:m.baseVersion});
 assert.equal(r.proposedVersion,'1.1.1.8');
 assert.throws(()=>verifyProposedTarget(r,'2.0.0.0'));
});
test('overflow is never silently wrapped',()=>{
 assert.throws(()=>makeProposedVersion('0.9.85.9007199254740991','maintenance'),/automatic version/);
 assert.throws(()=>makeProposedVersion('0.9.9007199254740991.5','feature'),/automatic version/);
});
