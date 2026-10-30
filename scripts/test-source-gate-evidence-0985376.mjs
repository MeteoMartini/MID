import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSourceGateEvidence,inspectSourceGate} from '../tools/ci/source-gate-evidence.mjs';

const a='a'.repeat(40),b='b'.repeat(40);
const names=[
  'Source-Kern vollständig prüfen',
  ...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
  'Heavy-Regression · heavy-browser-state ·',
  'Heavy-Regression · heavy-native-map ·',
  'Heavy-Regression · heavy-mountain-visual ·',
  ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3'),
  'Agent-Quellstand vollständig prüfen',
];
const fixtures=()=>{
  const expected={repository:'MeteoMartini/MID',prNumber:525,runId:1234567,headSha:b};
  const pr={number:525,state:'open',draft:false,head:{sha:b,repo:{full_name:expected.repository}},
    base:{ref:'main',sha:a}};
  const run={id:1234567,name:'MID-Agent-Quellstand prüfen',
    path:'.github/workflows/chatgpt-pr-gate.yml',repository:{full_name:expected.repository},
    head_sha:b,event:'pull_request',status:'completed',conclusion:'success',run_attempt:1};
  const jobs=names.map((name,i)=>({id:i+1,run_id:1234567,name,status:'completed',conclusion:'success'}));
  return {expected,mainSha:a,stableSha:a,pr,run,jobs};
};
const check=data=>validateSourceGateEvidence(data);
test('independent full matrix gate succeeds only for an exact source/PR/run lineage',()=>{
 const v=check(fixtures());
 assert.equal(v.eligibleForFurtherEvidenceReview,true);
 assert.equal(v.requiredJobs,12);
 assert.equal(v.validatedJobs,12);
 assert.match(v.warning,/NOT a security attestation/);
});
test('PR is required to be active, from same repository, same base SHA, non-draft',()=>{
 for(const patch of [{draft:true},{state:'closed'},{base:{ref:'develop',sha:a}},
   {base:{ref:'main',sha:b}},{head:{sha:a,repo:{full_name:'MeteoMartini/MID'}}},
   {head:{sha:b,repo:{full_name:'foreign/repo'}}}]) {
   const f=fixtures();Object.assign(f.pr,patch);
   assert.equal(check(f).eligibleForFurtherEvidenceReview,false,JSON.stringify(patch));
 }
});
test('Source gate identity, path, head, event, run ID and final conclusion must match',()=>{
 for(const patch of [{id:99},{path:'.github/workflows/dummy.yml'},{head_sha:a},
  {event:'workflow_dispatch'},{status:'in_progress'},{conclusion:'skipped'},
  {conclusion:'failure'},{run_attempt:0},{repository:{full_name:'foreign/MID'}}]) {
   const f=fixtures();Object.assign(f.run,patch);
   assert.equal(check(f).eligibleForFurtherEvidenceReview,false,JSON.stringify(patch));
 }
});
test('Missing, skipped, failing, incomplete and duplicated mandatory shards all block',()=>{
 const transforms=[
  f=>f.jobs.pop(),
  f=>f.jobs[2].conclusion='skipped',
  f=>f.jobs[2].conclusion='failure',
  f=>f.jobs[2].status='in_progress',
  f=>f.jobs[2].run_id=12,
  f=>f.jobs[2].name=f.jobs[1].name,
  f=>f.jobs.push({name:'Unknown success',run_id:f.expected.runId,status:'completed',conclusion:'success'}),
 ];
 for(const transform of transforms) {
  const f=fixtures();transform(f);
  assert.equal(check(f).eligibleForFurtherEvidenceReview,false);
 }
});
test('Skipped OPTIONAL jobs permitted; failed optional must block',()=>{
 const f=fixtures();
 f.jobs.push({name:'Extremwetterpolygone · echte Browserpixel',run_id:f.expected.runId,
  status:'completed',conclusion:'skipped'});
 assert.equal(check(f).eligibleForFurtherEvidenceReview,true);
 f.jobs.at(-1).conclusion='failure';
 assert.equal(check(f).eligibleForFurtherEvidenceReview,false);
});
test('Main/Stable divergence and invalid evidence inputs fail closed',()=>{
 const f=fixtures();f.stableSha=b;assert.equal(check(f).eligibleForFurtherEvidenceReview,false);
 assert.throws(()=>check({...fixtures(),expected:{repository:'a/b',prNumber:-1,runId:1,headSha:a}}),/Invalid/);
});
test('Remote inspector blocks unauthorized repository before any network calls',async()=>{
 await assert.rejects(inspectSourceGate({repository:'../bad',prNumber:1,runId:2,headSha:a},''),/Invalid CLI/);
});
