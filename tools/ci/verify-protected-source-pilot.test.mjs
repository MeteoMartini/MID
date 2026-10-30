import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {inspectSignedObservation,verificationArgs} from './verify-protected-source-pilot.mjs';

const SIGNER='a'.repeat(40),SOURCE='b'.repeat(40);
const NOW=Date.parse('2026-10-30T20:20:00.000Z');
const H=x=>createHash('sha256').update(x).digest('hex');
const clone=x=>structuredClone(x);
function fixture(){
 const mandatoryJobs=Array.from({length:12},(_,i)=>({name:'required-'+i,id:100+i,conclusion:'success'}));
 const report={schema:'mid.protected-source-observation.v1',
  producerWorkflow:'MeteoMartini/MID/.github/workflows/attested-source-qualification.yml',
  repo:'MeteoMartini/MID',repoId:1305110795,signerSourceSha:SIGNER,
  sourceSha:SOURCE,sourceTreeSha:'c'.repeat(40),originalBaseSha:'d'.repeat(40),
  sourceRunId:41116474513,runAttempt:1,sourcePrNumber:532,
  issuedAt:'2026-10-30T20:02:00.000Z',expiresAt:'2026-10-31T20:02:00.000Z',
  releaseAuthorized:false,reuseAuthorized:false,mandatoryJobs,optionalJobs:[]};
 const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');
 const run={id:5001,run_attempt:1,head_sha:SIGNER,head_branch:'main',
  path:'.github/workflows/attested-source-qualification.yml',event:'workflow_dispatch',
  status:'in_progress',conclusion:null,created_at:'2026-10-30T20:01:00.000Z',
  repository:{id:1305110795,full_name:'MeteoMartini/MID'},
  head_repository:{id:1305110795,full_name:'MeteoMartini/MID'}};
 const jobs={total_count:2,jobs:[{name:'GitHub-Quellgates unabhängig prüfen und Beobachtung attestieren',
  id:1,run_id:5001,run_attempt:1,head_sha:SIGNER,status:'completed',conclusion:'success'},
  {name:'Verifizierte Source-Signatur unabhängig gegenprüfen',id:2,run_id:5001,
   run_attempt:1,head_sha:SIGNER,status:'in_progress',conclusion:null}]};
 const verified=[{verificationResult:{signature:{certificate:{
  sourceRepository:'MeteoMartini/MID',sourceRepositoryIdentifier:'1305110795',
  sourceRepositoryDigest:SIGNER,sourceRepositoryRef:'refs/heads/main'}},
  verifiedTimestamps:[{timestamp:'2026-10-30T20:03:00Z'}],
  statement:{_type:'https://in-toto.io/Statement/v1',
   predicateType:'https://slsa.dev/provenance/v1',
   subject:[{name:'mid-source-observation.json',digest:{sha256:H(bytes)}}]}}}];
 return {run,jobs,bytes,verified,independent:clone(report),
  expected:{signerSha:SIGNER,signingRunId:5001,signingAttempt:1,
    sourceRunId:41116474513,prNumber:532,now:NOW}};
}
test('synthetic signed-source observation verifies but grants zero production permission',()=>{
 const f=fixture(),result=inspectSignedObservation(f,f.expected);
 assert.equal(result.signatureVerified,true);
 assert.equal(result.sourceReverified,true);
 assert.equal(result.mandatoryJobs,12);
 assert.equal(result.reuseAuthorized,false);
 assert.equal(result.releaseAuthorized,false);
});
test('actual gh verifier parameters restrict workflow, SHA and ref without --bundle',()=>{
 const args=verificationArgs('/tmp/mid-source-observation.json',SIGNER).join(' ');
 for(const token of ['--repo MeteoMartini/MID','--signer-digest '+SIGNER,
   '--source-ref refs/heads/main','--source-digest '+SIGNER,
   '--signer-workflow MeteoMartini/MID/.github/workflows/attested-source-qualification.yml',
   '--deny-self-hosted-runners','--format json'])assert.ok(args.includes(token),token);
 assert.doesNotMatch(args,/--bundle\b|--insecure/);
 assert.throws(()=>verificationArgs('relative.json',SIGNER));
});
test('untrusted signing actor, branch, attempt, repository, job or workflow is rejected',()=>{
 const mutations=[
  f=>f.run.head_sha=SOURCE,f=>f.run.head_branch='feature',
  f=>f.run.path='.github/workflows/other.yml',
  f=>f.run.event='pull_request',f=>f.run.run_attempt=2,
  f=>f.run.repository.id=7,f=>f.run.head_repository.full_name='other/repo',
  f=>f.run.status='queued',f=>f.jobs.total_count++,
  f=>f.jobs.jobs[0].conclusion='skipped',f=>f.jobs.jobs[0].run_attempt=2,
  f=>f.jobs.jobs.push(clone(f.jobs.jobs[0])),
  f=>f.expected.signingRunId=6001,f=>f.expected.signerSha=SOURCE
 ];
 for(const mutate of mutations){
  const f=fixture();mutate(f);assert.throws(()=>inspectSignedObservation(f,f.expected));
 }
});
test('signed JSON must match fresh GitHub evidence, timestamps and immutable permissions',()=>{
 const mutations=[
  f=>f.bytes=Buffer.concat([f.bytes,Buffer.from('x')]),
  f=>{const r=JSON.parse(f.bytes);r.schema='untrusted';f.bytes=Buffer.from(JSON.stringify(r,null,2)+'\n')},
  f=>{const r=JSON.parse(f.bytes);r.releaseAuthorized=true;f.bytes=Buffer.from(JSON.stringify(r,null,2)+'\n')},
  f=>{const r=JSON.parse(f.bytes);r.reuseAuthorized=true;f.bytes=Buffer.from(JSON.stringify(r,null,2)+'\n')},
  f=>{const r=JSON.parse(f.bytes);r.issuedAt='2026-10-29T19:00:00.000Z';f.bytes=Buffer.from(JSON.stringify(r,null,2)+'\n')},
  f=>{const r=JSON.parse(f.bytes);r.expiresAt='2026-10-31T21:02:00.000Z';f.bytes=Buffer.from(JSON.stringify(r,null,2)+'\n')},
  f=>f.independent.mandatoryJobs[0].id=999,
  f=>f.independent.sourceSha='f'.repeat(40),
  f=>f.expected.prNumber=533
 ];
 for(const mutate of mutations){
  const f=fixture();mutate(f);assert.throws(()=>inspectSignedObservation(f,f.expected));
 }
});
test('fake, mismatched or ambiguous Sigstore certificates fail closed',()=>{
 const mutations=[
  f=>f.verified=[],f=>f.verified.push(clone(f.verified[0])),
  f=>f.verified[0].verificationResult.signature.certificate.sourceRepository='other/repo',
  f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryIdentifier='5',
  f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryDigest=SOURCE,
  f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryRef='refs/heads/dev',
  f=>f.verified[0].verificationResult.statement.predicateType='not-slsa',
  f=>f.verified[0].verificationResult.statement.subject=[],
  f=>f.verified[0].verificationResult.verifiedTimestamps=[]
 ];
 for(const mutate of mutations){
  const f=fixture();mutate(f);assert.throws(()=>inspectSignedObservation(f,f.expected));
 }
});
test('canonical bytes reject whitespace aliases and JSON key duplicates',()=>{
 const f=fixture();f.bytes=Buffer.from(f.bytes.toString('utf8').trim());
 assert.throws(()=>inspectSignedObservation(f,f.expected));
 const g=fixture();g.bytes=Buffer.from(g.bytes.toString('utf8').replace(
  '"reuseAuthorized": false,','"reuseAuthorized": true,\n  "reuseAuthorized": false,'));
 assert.throws(()=>inspectSignedObservation(g,g.expected));
});
test('protected signer and read-only verifier are separate with no release/deploy permissions',async()=>{
 const read=p=>readFile(new URL('../../'+p,import.meta.url),'utf8');
 const workflow=await read('ci/github/workflows/attested-source-qualification.yml');
 assert.equal(workflow,await read('.github/workflows/attested-source-qualification.yml'));
 assert.match(workflow,/needs:\s*attest_source/);
 assert.match(workflow,/attestations: read/);
 assert.match(workflow,/actions: read/);
 assert.match(workflow,/pull-requests: read/);
 assert.match(workflow,/id-token: write/);
 assert.match(workflow,/attestations: write/);
 assert.match(workflow,/verify-protected-source-pilot\.mjs/);
 assert.doesNotMatch(workflow,/continue-on-error|contents: write|deployments: write|pages: write|secrets\./);
});
