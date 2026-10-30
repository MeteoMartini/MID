import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SOURCE_JOBS,validateTrustedPolicy,examineVerifiedArtifact,verifyThroughGithubCLI} from '../tools/ci/attested-reuse-policy.mjs';

const H=v=>createHash('sha256').update(v).digest('hex');
const NOW=Date.parse('2026-10-30T16:00:00.000Z');
const sha=(x,n)=>x.repeat(n);
function fixture(){
  const policy={schema:'mid.attested-source-policy.v1',repo:'MeteoMartini/MID',repoId:'1305110795',
    sourceSha:sha('a',40),treeSha:sha('b',40),lockSha:sha('c',64),envSha:sha('d',64),
    artifactSha256:'',version:'0.9.85.378',runId:41000000001,attempt:1,
    sourceRef:'refs/heads/main',signerWorkflow:'MeteoMartini/MID/.github/workflows/attested-source-qualification.yml',
    signerDigest:sha('e',40),notAfter:'2026-10-31T00:00:00.000Z'};
  const jobs=Object.fromEntries(SOURCE_JOBS.map(name=>[name,{runId:policy.runId,
    attempt:policy.attempt,headSha:policy.sourceSha,conclusion:'success'}]));
  const report={schema:'mid.attested-source-evidence.v1',releaseAuthorized:false,reuseAuthorized:false,
    repo:policy.repo,repoId:policy.repoId,sourceSha:policy.sourceSha,treeSha:policy.treeSha,
    lockSha:policy.lockSha,envSha:policy.envSha,version:policy.version,runId:policy.runId,
    attempt:policy.attempt,issuedAt:'2026-10-30T15:30:00.000Z',notAfter:policy.notAfter,jobs};
  const bytes=Buffer.from(JSON.stringify(report));policy.artifactSha256=H(bytes);
  const verified=[{verificationResult:{signature:{certificate:{sourceRepository:policy.repo,sourceRepositoryIdentifier:policy.repoId}},
    verifiedTimestamps:[{timestamp:'2026-10-30T15:31:00Z'}],statement:{_type:'https://in-toto.io/Statement/v1',
    predicateType:'https://slsa.dev/provenance/v1',subject:[{name:'signed-evidence.json',digest:{sha256:policy.artifactSha256}}],
    predicate:{buildDefinition:{}}}}}];
  return {policy,report,bytes,verified};
}
function inspect(modifier){
  const f=fixture();modifier?.(f);
  f.bytes=Buffer.from(JSON.stringify(f.report));
  // Re-signing is simulated only to exercise the *consumer policy*; this
  // fixture has no cryptographic trust and can NEVER grant production reuse.
  f.policy.artifactSha256=H(f.bytes);
  f.verified[0].verificationResult.statement.subject[0].digest.sha256=f.policy.artifactSha256;
  return examineVerifiedArtifact(f.policy,f.bytes,f.verified,NOW);
}
test('successfully inspected simulated evidence still cannot authorize release or reuse',()=>{
  const a=inspect();assert.equal(a.provenanceConsistent,true);assert.equal(a.releaseAuthorized,false);
  assert.equal(a.reuseAuthorized,false);assert.equal(a.inspectedJobs,11);
});
for(const k of ['sourceSha','treeSha','lockSha','envSha','version','runId','attempt','notAfter']){
  test('reject signed-report input drift: '+k,()=>{
    assert.throws(()=>inspect(f=>{f.report[k]=typeof f.report[k]==='number'?f.report[k]+1:
      k==='version'?'0.9.85.379':k==='notAfter'?'2026-10-31T01:00:00.000Z':f.report[k].replace(/^./,'f')}),/mismatch|freshness/);
  });
}
for(const k of ['sourceSha','treeSha','lockSha','envSha','signerDigest','artifactSha256']){
  test('reject malformed trusted policy field: '+k,()=>{
    const f=fixture();f.policy[k]='0';assert.throws(()=>validateTrustedPolicy(f.policy,NOW));
  });
}
test('reject changes to trusted repository id, ref, signing workflow and unknown fields',()=>{
  for(const change of [p=>p.repoId='999',p=>p.repo='other/repo',
    p=>p.sourceRef='refs/heads/dev',p=>p.signerWorkflow='MeteoMartini/MID/.github/workflows/unit-coverage.yml',
    p=>p.notAfter='2020-01-01T00:00:00.000Z',p=>p.extra=true]){
    const f=fixture();change(f.policy);assert.throws(()=>validateTrustedPolicy(f.policy,NOW));
  }
});
test('missing, ambiguous, or unverified attestations fail closed',()=>{
  for(const change of [f=>f.verified=[],f=>f.verified.push(structuredClone(f.verified[0])),
    f=>f.verified[0].verificationResult.signature.certificate={},
    f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryIdentifier='42',
    f=>f.verified[0].verificationResult.verifiedTimestamps=[],
    f=>f.verified[0].verificationResult.statement.predicateType='https://spdx.dev/Document/v2.3',
    f=>f.verified[0].verificationResult.statement.subject=[]]){
    const f=fixture();change(f);assert.throws(()=>examineVerifiedArtifact(f.policy,f.bytes,f.verified,NOW));
  }
});
test('actual subject bytes are hashed and cannot be swapped for a different ZIP/report',()=>{
 const f=fixture();assert.throws(()=>examineVerifiedArtifact(f.policy,Buffer.concat([f.bytes,Buffer.from('x')]),f.verified,NOW),/digest/);
 assert.throws(()=>examineVerifiedArtifact(f.policy,Buffer.alloc(262145),f.verified,NOW),/size/);
 assert.throws(()=>examineVerifiedArtifact(f.policy,Buffer.alloc(0),f.verified,NOW),/size/);
});
test('missing, failed, skipped and cross-run mandatory jobs cannot get provenance credit',()=>{
 for(const change of [r=>delete r.jobs[SOURCE_JOBS[0]],r=>r.jobs[SOURCE_JOBS[1]].conclusion='skipped',
   r=>r.jobs[SOURCE_JOBS[2]].conclusion='failure',r=>r.jobs[SOURCE_JOBS[3]].runId=411,
   r=>r.jobs[SOURCE_JOBS[4]].attempt=2,r=>r.jobs[SOURCE_JOBS[5]].headSha=sha('f',40),
   r=>r.jobs.EXTRA={runId:1,attempt:1,headSha:sha('a',40),conclusion:'success'}]){
   assert.throws(()=>inspect(f=>change(f.report)),/inventory|missing|job provenance/);
 }
});
test('self-authorization, extra fields and altered signing metadata are rejected',()=>{
 for(const change of [r=>r.releaseAuthorized=true,r=>r.reuseAuthorized=true,
   r=>r.schema='mid.attested-source-evidence.v0',r=>r.extra='secret',
   r=>r.jobs[SOURCE_JOBS[0]].extra='spoof']){
  assert.throws(()=>inspect(f=>change(f.report)),/fields|identity|permissions|provenance/);
 }
});
test('expired and future-dated source evidence is never accepted',()=>{
 assert.throws(()=>inspect(f=>f.report.issuedAt='2027-01-01T00:00:00.000Z'),/freshness/);
 assert.throws(()=>inspect(f=>f.report.issuedAt='not-a-date'),/freshness/);
 const f=fixture();assert.throws(()=>examineVerifiedArtifact(f.policy,f.bytes,f.verified,Date.parse('2027-01-01T00:00:00Z')),/expired/);
});
test('GitHub CLI requires exact signer, repository, source digest and ref, never offline bundles',()=>{
 const f=fixture();let called;
 const output=verifyThroughGithubCLI(f.policy,'/tmp/source-report.json',{now:NOW,
   invoke:(name,args,opts)=>{called={name,args,opts};return JSON.stringify(f.verified)}});
 assert.equal(output.length,1);assert.equal(called.name,'gh');assert.equal(called.opts.encoding,'utf8');
 for(const [flag,value] of [['--repo',f.policy.repo],['--signer-workflow',f.policy.signerWorkflow],
   ['--signer-digest',f.policy.signerDigest],['--source-ref','refs/heads/main'],
   ['--source-digest',f.policy.sourceSha]]){
   assert.equal(called.args[called.args.indexOf(flag)+1],value);
 }
 for(const flag of ['--bundle','--owner','--cert-identity-regex','--no-public-good'])
   assert.equal(called.args.includes(flag),false);
 assert.equal(called.args.includes('--deny-self-hosted-runners'),true);
 assert.equal(called.args.includes('--format'),true);
 assert.throws(()=>verifyThroughGithubCLI(f.policy,'/tmp/source-report.json',{now:NOW,invoke:()=>{throw Error('signature invalid')}}),/signature invalid/);
});
