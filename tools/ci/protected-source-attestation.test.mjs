import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SOURCE_JOBS} from './attested-reuse-policy.mjs';
import {inspectProtectedSource,observeProtectedSource} from './protected-source-attestation.mjs';
const NOW=Date.parse('2026-10-30T20:00:00.000Z');
const HEAD='a'.repeat(40),STABLE='f'.repeat(40),REPO='MeteoMartini/MID';
const own=()=>({full_name:REPO,id:1305110795});
function fixture(){
 const run={id:41104670773,run_attempt:1,event:'pull_request',
  path:'.github/workflows/chatgpt-pr-gate.yml',status:'completed',conclusion:'success',
  head_sha:HEAD,head_branch:'chatgpt/v0.9.85.378-diagram-lines',
  repository:own(),head_repository:own(),pull_requests:[],
  created_at:'2026-10-30T18:00:00.000Z',updated_at:'2026-10-30T18:15:00.000Z'};
 const pr={number:531,state:'closed',merged:true,draft:false,
  head:{sha:HEAD,ref:run.head_branch,repo:own()},
  base:{ref:'main',sha:'b'.repeat(40),repo:own()}};
 const names=[...SOURCE_JOBS,'Agent-Quellstand vollständig prüfen',
  'RUC +27h Kern, EPS und Gesamtpaket','Extremwetterpolygone · echte Browserpixel'];
 const items=names.map((name,i)=>({name,id:123400+i,run_id:run.id,
  run_attempt:1,head_sha:HEAD,workflow_name:'MID-Agent-Quellstand prüfen',
  status:'completed',conclusion:i<SOURCE_JOBS.length+1?'success':'skipped'}));
 return {run,pr,jobs:{total_count:items.length,jobs:items},
  sourceCommit:{sha:HEAD,tree:{sha:'c'.repeat(40)}},
  main:{object:{sha:STABLE}},stable:{object:{sha:STABLE}}};
}
const check=change=>{
 const f=fixture();change?.(f);
 return inspectProtectedSource(f,{runId:f.run.id,prNumber:531,signerSha:STABLE,now:NOW});
};
test('protected observation verifies 12 mandatory jobs, never grants reuse or release',()=>{
 const r=check();assert.equal(r.mandatoryJobs.length,12);
 assert.equal(r.optionalJobs.length,2);assert.equal(r.sourceSha,HEAD);
 assert.equal(r.originalBaseSha,'b'.repeat(40));assert.equal(r.releaseAuthorized,false);
 assert.equal(r.reuseAuthorized,false);
 assert.equal(Date.parse(r.expiresAt)-Date.parse(r.issuedAt),86400000);
});
for(const [label,change] of [
 ['not-promoted main',f=>f.main.object.sha='0'.repeat(40)],
 ['not-promoted stable',f=>f.stable.object.sha='0'.repeat(40)],
 ['failed source run',f=>f.run.conclusion='failure'],
 ['wrong event',f=>f.run.event='workflow_dispatch'],
 ['untrusted workflow',f=>f.run.path='other.yml'],
 ['untrusted branch',f=>f.run.head_branch='main'],
 ['fork source',f=>f.run.head_repository.full_name='attacker/MID'],
 ['closed but unmerged',f=>f.pr.merged=false],
 ['draft PR',f=>f.pr.draft=true],
 ['wrong PR head',f=>f.pr.head.sha='0'.repeat(40)],
 ['wrong main base',f=>f.pr.base.ref='mid-stable'],
 ['foreign PR repo',f=>f.pr.head.repo.id=4],
 ['source-tree mismatch',f=>f.sourceCommit.sha='0'.repeat(40)],
 ['missing mandatory core',f=>{f.jobs.jobs.shift();f.jobs.total_count--}],
 ['skipped mandatory core',f=>f.jobs.jobs[0].conclusion='skipped'],
 ['failed optional gate',f=>f.jobs.jobs.at(-1).conclusion='failure'],
 ['duplicate job ID',f=>f.jobs.jobs[1].id=f.jobs.jobs[0].id],
 ['foreign job SHA',f=>f.jobs.jobs[2].head_sha='0'.repeat(40)],
 ['stale job attempt',f=>f.jobs.jobs[3].run_attempt=2],
 ['unknown mandatory job',f=>{f.jobs.jobs.push({...f.jobs.jobs[0],id:99999,name:'new gate'});f.jobs.total_count++}],
 ['pagination partial',f=>f.jobs.total_count++],
 ['future Source run',f=>f.run.created_at='2027-01-01T00:00:00.000Z']
]){
 test('protected pilot rejects '+label,()=>assert.throws(()=>check(change),/Protected Source observation rejected/));
}
test('optional gate absence does not imply a successful gate',()=>{
 const x=check(f=>{f.jobs.jobs.pop();f.jobs.total_count--});
 assert.equal(x.mandatoryJobs.length,12);assert.equal(x.optionalJobs.length,1);
});
test('the pilot queries fixed authenticated GitHub GET endpoints and rechecks races',()=>{
 const f=fixture(),seen=[];
 const reader=(name,args)=>{
  assert.equal(name,'gh');assert.deepEqual(args.slice(0,3),['api','-X','GET']);
  const endpoint=args[3].replace('repos/MeteoMartini/MID/','');seen.push(endpoint);
  if(endpoint.includes('/jobs?filter=latest'))return JSON.stringify(f.jobs);
  if(endpoint.startsWith('actions/runs/'))return JSON.stringify(f.run);
  if(endpoint.startsWith('pulls/'))return JSON.stringify(f.pr);
  if(endpoint.startsWith('git/commits/'))return JSON.stringify(f.sourceCommit);
  if(endpoint==='git/ref/heads/main')return JSON.stringify(f.main);
  if(endpoint==='git/ref/heads/mid-stable')return JSON.stringify(f.stable);
  throw Error('unrecognized endpoint');
 };
 const r=observeProtectedSource({runId:f.run.id,prNumber:531,signerSha:STABLE,now:NOW,invoke:reader});
 assert.equal(r.mandatoryJobs.length,12);assert.equal(seen.length,10);
 assert.equal(seen.filter(s=>s==='git/ref/heads/main').length,2);
 let reads=0;
 assert.throws(()=>observeProtectedSource({runId:f.run.id,prNumber:531,signerSha:STABLE,now:NOW,
  invoke:(name,args)=>{reads++;if(reads===7)return JSON.stringify({...f.run,run_attempt:2});
   return reader(name,args);}}),/Protected Source observation rejected/);
});
test('protected signer workflow is manual-only, pinned, least privilege and cannot deploy',async()=>{
 const a=await readFile(new URL('../../ci/github/workflows/attested-source-qualification.yml',import.meta.url),'utf8');
 const b=await readFile(new URL('../../.github/workflows/attested-source-qualification.yml',import.meta.url),'utf8');
 assert.equal(a,b);
 for(const token of ['workflow_dispatch:','source_run_id:','pr_number:',
  "github.ref == 'refs/heads/main'","github.repository == 'MeteoMartini/MID'",
  'id-token: write','attestations: write','contents: read','GITHUB_REF_PROTECTED',
  'MID_SOURCE_RUN_ID','MID_SOURCE_PR_NUMBER',
  'node tools/ci/protected-source-attestation.mjs','subject-path:'])
  assert.ok(a.includes(token),token);
 assert.match(a,/uses: actions\/attest@[0-9a-f]{40}/);
 assert.doesNotMatch(a,/pull_request_target:|pull_request:|workflow_run:|contents: write|pages: write|MID-professional-replacement\.zip|continue-on-error/);
 assert.ok(!a.includes('secrets.')&&!a.includes('ref: $'+'{{ inputs.'));
});
