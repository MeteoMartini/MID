import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {SOURCE_JOBS,validateTrustedPolicy,examineVerifiedArtifact,verifyThroughGithubCLI} from './attested-reuse-policy.mjs';

const H=v=>createHash('sha256').update(v).digest('hex');
const NOW=Date.parse('2026-10-30T16:00:00.000Z');
const sha=(x,n)=>x.repeat(n);
function fixture(){
  const policy={schema:'mid.attested-source-policy.v1',repo:'MeteoMartini/MID',repoId:'1305110795',
    sourceSha:sha('a',40),baseSha:sha('1',40),prNumber:531,treeSha:sha('b',40),lockSha:sha('c',64),envSha:sha('d',64),
    artifactSha256:'',version:'0.9.85.378',runId:41000000001,attempt:1,
    sourceRef:'refs/heads/main',signerWorkflow:'MeteoMartini/MID/.github/workflows/attested-source-qualification.yml',
    signerDigest:sha('e',40),signerSourceSha:sha('f',40),notAfter:'2026-10-31T00:00:00.000Z'};
  const jobs=Object.fromEntries(SOURCE_JOBS.map(name=>[name,{runId:policy.runId,
    attempt:policy.attempt,headSha:policy.sourceSha,conclusion:'success'}]));
  const report={schema:'mid.attested-source-evidence.v1',releaseAuthorized:false,reuseAuthorized:false,
    repo:policy.repo,repoId:policy.repoId,sourceSha:policy.sourceSha,baseSha:policy.baseSha,
    prNumber:policy.prNumber,treeSha:policy.treeSha,
    lockSha:policy.lockSha,envSha:policy.envSha,version:policy.version,runId:policy.runId,
    attempt:policy.attempt,issuedAt:'2026-10-30T15:30:00.000Z',notAfter:policy.notAfter,jobs};
  const bytes=Buffer.from(JSON.stringify(report));policy.artifactSha256=H(bytes);
  const verified=[{verificationResult:{signature:{certificate:{sourceRepository:policy.repo,sourceRepositoryIdentifier:policy.repoId,sourceRepositoryDigest:policy.signerSourceSha,sourceRepositoryRef:policy.sourceRef}},
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
for(const k of ['sourceSha','baseSha','prNumber','treeSha','lockSha','envSha','version','runId','attempt','notAfter']){
  test('reject signed-report input drift: '+k,()=>{
    assert.throws(()=>inspect(f=>{f.report[k]=typeof f.report[k]==='number'?f.report[k]+1:
      k==='version'?'0.9.85.379':k==='notAfter'?'2026-10-31T01:00:00.000Z':f.report[k].replace(/^./,'f')}),/mismatch|freshness/);
  });
}
for(const k of ['sourceSha','baseSha','treeSha','lockSha','envSha','signerDigest','signerSourceSha','artifactSha256']){
  test('reject malformed trusted policy field: '+k,()=>{
    const f=fixture();f.policy[k]='0';assert.throws(()=>validateTrustedPolicy(f.policy,NOW));
  });
}
test('reject changes to trusted repository id, ref, signing workflow and unknown fields',()=>{
  for(const change of [p=>p.repoId='999',p=>p.repo='other/repo',
    p=>p.sourceRef='refs/heads/dev',p=>p.signerWorkflow='MeteoMartini/MID/.github/workflows/unit-coverage.yml',
    p=>p.notAfter='2020-01-01T00:00:00.000Z',p=>p.prNumber=0,
    p=>p.baseSha=p.sourceSha,p=>p.signerSourceSha=p.sourceSha,p=>p.extra=true]){
    const f=fixture();change(f.policy);assert.throws(()=>validateTrustedPolicy(f.policy,NOW));
  }
});
test('missing, ambiguous, or unverified attestations fail closed',()=>{
  for(const change of [f=>f.verified=[],f=>f.verified.push(structuredClone(f.verified[0])),
    f=>f.verified[0].verificationResult.signature.certificate={},
    f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryIdentifier='42',
    f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryDigest='a'.repeat(40),
    f=>f.verified[0].verificationResult.signature.certificate.sourceRepositoryRef='refs/heads/chatgpt/unsafe',
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
   ['--source-digest',f.policy.signerSourceSha]]){
   assert.equal(called.args[called.args.indexOf(flag)+1],value);
 }
 for(const flag of ['--bundle','--owner','--cert-identity-regex','--no-public-good'])
   assert.equal(called.args.includes(flag),false);
 assert.equal(called.args.includes('--deny-self-hosted-runners'),true);
 assert.equal(called.args.includes('--format'),true);
 assert.throws(()=>verifyThroughGithubCLI(f.policy,'/tmp/source-report.json',{now:NOW,invoke:()=>{throw Error('signature invalid')}}),/signature invalid/);
});


test('protected main signer digest is distinct from PR gate HEAD',()=>{
 const f=fixture();assert.notEqual(f.policy.sourceSha,f.policy.signerSourceSha);
 assert.equal(inspect().reuseAuthorized,false);
 f.policy.signerSourceSha=f.policy.sourceSha;
 assert.throws(()=>validateTrustedPolicy(f.policy,NOW),/signer SHA/);
});

// Independent GitHub REST run/job observation: the signed REPORT alone is never
// accepted as evidence that required jobs actually executed on the right SHA.
const {inspectSourceRun,inspectSourcePullRequest,observeSourceThroughGithubCLI}=await import('./source-run-observation.mjs');
function sourceFixture(){
 const policy=fixture().policy,run={id:policy.runId,run_attempt:policy.attempt,
  event:'pull_request',path:'.github/workflows/chatgpt-pr-gate.yml',
  status:'completed',conclusion:'success',head_sha:policy.sourceSha,
  head_branch:'chatgpt/v0.9.85.378-evidence',
  repository:{id:1305110795,full_name:policy.repo},
  head_repository:{id:1305110795,full_name:policy.repo}};
 const jobs=[...SOURCE_JOBS,'Agent-Quellstand vollständig prüfen',
  'RUC +27h Kern, EPS und Gesamtpaket','Extremwetterpolygone · echte Browserpixel']
  .map((name,i)=>({id:12000000000+i,name,run_id:policy.runId,
   run_attempt:policy.attempt,head_sha:policy.sourceSha,
   workflow_name:'MID-Agent-Quellstand prüfen',status:'completed',
   conclusion:i<=SOURCE_JOBS.length?'success':'skipped'}));
 const pr={number:policy.prNumber,draft:false,state:'closed',merged:true,
  head:{sha:policy.sourceSha,ref:run.head_branch,repo:{id:1305110795,full_name:policy.repo}},
  base:{sha:policy.baseSha,ref:'main',repo:{id:1305110795,full_name:policy.repo}}};
 return{policy,run,pr,payload:{total_count:jobs.length,jobs}};
}
const checkSource=mutate=>{
 const f=sourceFixture();mutate?.(f);
 return inspectSourceRun(f.policy,f.run,f.payload,NOW);
};
test('actual GitHub Source run, all 11 jobs and final aggregator observed without reuse authority',()=>{
 const a=checkSource();
 assert.equal(a.mandatoryJobs,12);
 assert.equal(a.observedJobIds.length,14);
 assert.equal(a.releaseAuthorized,false);
 assert.equal(a.reuseAuthorized,false);
});
for(const [name,mutate] of [
 ['runId',f=>f.run.id++],['run attempt',f=>f.run.run_attempt++],
 ['wrong workflow',f=>f.run.path='.github/workflows/other.yml'],
 ['event',f=>f.run.event='workflow_dispatch'],
 ['head SHA',f=>f.run.head_sha='f'.repeat(40)],
 ['failed run',f=>f.run.conclusion='failure'],
 ['fork',f=>f.run.head_repository.full_name='attacker/MID'],
 ['wrong repository id',f=>f.run.repository.id=77],
 ['wrong branch',f=>f.run.head_branch='main'],
 ['missing core',f=>{f.payload.jobs.shift();f.payload.total_count--}],
 ['missing aggregator',f=>{f.payload.jobs=f.payload.jobs.filter(x=>!x.name.startsWith('Agent-Quellstand'));f.payload.total_count=f.payload.jobs.length}],
 ['failed heavy',f=>f.payload.jobs[7].conclusion='failure'],
 ['skipped required',f=>f.payload.jobs[2].conclusion='skipped'],
 ['stale attempt',f=>f.payload.jobs[3].run_attempt++],
 ['wrong job SHA',f=>f.payload.jobs[4].head_sha='b'.repeat(40)],
 ['cross-run',f=>f.payload.jobs[5].run_id++],
 ['duplicate job ID',f=>f.payload.jobs[1].id=f.payload.jobs[0].id],
 ['duplicate job name',f=>f.payload.jobs[1].name=f.payload.jobs[0].name],
 ['partial pagination',f=>f.payload.total_count++],
 ['unexpected new gate',f=>{f.payload.jobs.push({...f.payload.jobs[0],id:13999999999,name:'new required gate'});f.payload.total_count++}],
 ['optional failure',f=>f.payload.jobs.at(-1).conclusion='failure'],
 ['wrong job workflow',f=>f.payload.jobs[0].workflow_name='other'],
 ['in progress',f=>f.payload.jobs[0].status='in_progress']
]){
 test('independent GitHub evidence rejects '+name,()=>assert.throws(()=>checkSource(mutate),/Source run evidence rejected/));
}
test('known conditional success/absence remains observable, never an implicit pass for core jobs',()=>{
 assert.equal(checkSource(f=>f.payload.jobs.at(-1).conclusion='success').conditionalJobs,2);
 assert.equal(checkSource(f=>{f.payload.jobs.pop();f.payload.total_count--}).conditionalJobs,1);
});
test('PR identity works after protected merge even when the run has no linked PRs',()=>{
 const f=sourceFixture();f.run.pull_requests=[];
 const a=inspectSourcePullRequest(f.policy,f.run,f.pr);
 assert.equal(a.prIdentityObserved,true);assert.equal(a.prNumber,531);
});
for(const [label,mutate] of [
 ['incorrect PR number',f=>f.pr.number=999],
 ['wrong original main base',f=>f.pr.base.sha='2'.repeat(40)],
 ['different PR HEAD',f=>f.pr.head.sha='2'.repeat(40)],
 ['foreign branch',f=>f.pr.head.ref='chatgpt/v0.9.85.378-fake'],
 ['draft PR',f=>f.pr.draft=true],
 ['closed unmerged PR',f=>f.pr.merged=false],
 ['invalid state',f=>f.pr.state='unknown'],
 ['fork head',f=>f.pr.head.repo.full_name='attacker/MID'],
 ['foreign target',f=>f.pr.base.repo.id=444],
 ['wrong main target',f=>f.pr.base.ref='mid-stable'],
 ['missing repository',f=>delete f.pr.head.repo],
 ['missing base',f=>delete f.pr.base]
]){
 test('independent PR evidence rejects '+label,()=>{
  const f=sourceFixture();mutate(f);
  assert.throws(()=>inspectSourcePullRequest(f.policy,f.run,f.pr),/Source run evidence rejected/);
 });
}
test('long-lived signed evidence is rejected even if its signature appears valid',()=>{
 const f=fixture();
 f.policy.notAfter='2026-11-02T15:30:00.000Z';f.report.notAfter=f.policy.notAfter;
 f.bytes=Buffer.from(JSON.stringify(f.report));f.policy.artifactSha256=H(f.bytes);
 f.verified[0].verificationResult.statement.subject[0].digest.sha256=f.policy.artifactSha256;
 assert.throws(()=>examineVerifiedArtifact(f.policy,f.bytes,f.verified,NOW),/freshness/);
});
test('independent gh api reader makes five authenticated GETs, rechecks PR/run and retains no release authority',()=>{
 const f=sourceFixture(),calls=[];
 const invoke=(command,args,opts)=>{
  calls.push({command,args,opts});assert.equal(command,'gh');
  assert.deepEqual(args.slice(0,3),['api','-X','GET']);
  return JSON.stringify(args[3].includes('/jobs?')?f.payload:args[3].includes('/pulls/')?f.pr:f.run);
 };
 const a=observeSourceThroughGithubCLI(f.policy,{now:NOW,invoke});
 assert.equal(calls.length,5);
 assert.equal(calls[0].args[3],'repos/MeteoMartini/MID/actions/runs/'+f.policy.runId);
 assert.equal(calls[1].args[3],calls[0].args[3]+'/jobs?filter=latest&per_page=100');
 assert.equal(calls[2].args[3],'repos/MeteoMartini/MID/pulls/'+f.policy.prNumber);
 assert.equal(calls[3].args[3],calls[0].args[3]);
 assert.equal(calls[4].args[3],calls[2].args[3]);
 assert.equal(a.prIdentityObserved,true);assert.equal(a.reuseAuthorized,false);
 assert.throws(()=>observeSourceThroughGithubCLI(f.policy,{now:NOW,invoke:()=>'{bad json'}));
 assert.throws(()=>observeSourceThroughGithubCLI(f.policy,{now:NOW,invoke:()=>{throw Error('unauthorized')}}),/unauthorized/);
 for(const race of ['run','pr']){
  let n=0;
  assert.throws(()=>observeSourceThroughGithubCLI(f.policy,{now:NOW,invoke:(cmd,args)=>{
   n++;
   if(n===4&&race==='run')return JSON.stringify({...f.run,run_attempt:2});
   if(n===5&&race==='pr')return JSON.stringify({...f.pr,head:{...f.pr.head,sha:'2'.repeat(40)}});
   return JSON.stringify(args[3].includes('/jobs?')?f.payload:args[3].includes('/pulls/')?f.pr:f.run);
  }}),/Source run evidence rejected/);
 }
});
