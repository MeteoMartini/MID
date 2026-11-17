import {describe,it,expect} from 'vitest';
import {collectMid740GitHubReadback as read} from '../../tools/ci/mid-740-github-artifact-readback.mjs';
const sha='a'.repeat(40),wf='b'.repeat(40),rid=1305110795;
const api='https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/';
const prefix='repos/MeteoMartini/MID';
const fixture=()=>{
 const run={id:123,workflow_id:88,run_attempt:1,
  repository:{id:rid},head_repository:{id:rid},head_sha:wf,
  path:'.github/workflows/agent-source-release.yml',event:'workflow_run',
  head_branch:'main',status:'completed',conclusion:'success',
  run_started_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:05:00Z'};
 const artifact={id:456,name:'mid-release-'+sha,expired:false,
  digest:'sha256:'+'c'.repeat(64),size_in_bytes:1024,
  url:api+'456',archive_download_url:api+'456/zip',
  workflow_run:{id:123,repository_id:rid,head_repository_id:rid,
   head_branch:'main',head_sha:wf},created_at:'2026-11-16T10:01:00Z',
  updated_at:'2026-11-16T10:02:00Z'};
 const page={total_count:1,artifacts:[{...artifact,workflow_run:{...artifact.workflow_run}}]};
 const replies:any={
  [prefix+'/actions/runs/123']:run,
  [prefix+'/actions/workflows/88']:{id:88,path:'.github/workflows/agent-source-release.yml',state:'active'},
  [prefix+'/actions/artifacts/456']:artifact,
  [prefix+'/git/ref/heads/main']:{object:{sha}},
  [prefix+'/actions/runs/123/artifacts?per_page=100&page=1']:page
 };
 const get=async(path:string)=>{if(!(path in replies))throw Error('bad path '+path);return replies[path]};
 return {run,artifact,page,replies,get,
  args:{runId:123,artifactId:456,sourceMergeSha:sha,trustedWorkflowSha:wf}};
};
describe('MID 740 authenticated REST readback transport logic (mocked source)',()=>{
 it('can join exact run and artifact metadata, never grants release',async()=>{
  const x=fixture(),result=await read(x.args,x.get);
  expect(result).toMatchObject({metadataReadbackConsistent:true,
   producerInventoryComplete:true,releaseAuthorized:false,mainSha:sha});
 });
 it.each([
  ['main drift',x=>{x.replies[prefix+'/git/ref/heads/main'].object.sha=wf}],
  ['producer repo',x=>{x.run.repository.id=1}],
  ['head repo',x=>{x.run.head_repository.id=1}],
  ['run head',x=>{x.run.head_sha=sha}],
  ['wrong event',x=>{x.run.event='pull_request'}],
  ['untrusted rerun',x=>{x.run.run_attempt=2}],
  ['not completed',x=>{x.run.status='in_progress'}],
  ['foreign workflow',x=>{x.run.path='.github/workflows/other.yml'}],
  ['expired',x=>{x.artifact.expired=true}],
  ['artifact repo',x=>{x.artifact.workflow_run.repository_id=1}],
  ['artifact head',x=>{x.artifact.workflow_run.head_sha=sha}],
  ['bad artifact URL',x=>{x.artifact.url='https://evil.invalid/456'}],
  ['bad archive URL',x=>{x.artifact.archive_download_url='https://evil.invalid/zip'}],
  ['bad digest',x=>{x.artifact.digest='bad'}],
  ['bad size',x=>{x.artifact.size_in_bytes=0}],
  ['created too early',x=>{x.artifact.created_at='2026-11-16T09:00:00Z'}],
  ['workflow registry ID drift',x=>{x.replies[prefix+'/actions/workflows/88'].id=89}],
  ['workflow registry path drift',x=>{x.replies[prefix+'/actions/workflows/88'].path='.github/workflows/other.yml'}],
  ['workflow disabled',x=>{x.replies[prefix+'/actions/workflows/88'].state='disabled_manually'}],
  ['run completed before artifact',x=>{x.run.updated_at='2026-11-16T10:00:30Z'}],
  ['artifact updated after run',x=>{x.artifact.updated_at='2026-11-16T10:06:00Z'}],
  ['artifact time out of order',x=>{x.artifact.updated_at='2026-11-16T10:00:30Z'}],
  ['missing inventory',x=>{x.page.artifacts=[]}],
  ['truncated inventory',x=>{x.page.total_count=2}],
  ['wrong inventory digest',x=>{x.page.artifacts[0].digest='sha256:'+'d'.repeat(64)}],
  ['duplicate named artifact',x=>{x.page.total_count=2;x.page.artifacts.push({...x.artifact,id:457})}],
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s fails closed',async(_,mutate)=>{
  const x=fixture();mutate(x);
  await expect(read(x.args,x.get)).rejects.toThrow(/MID_740_/);
 });
 it('fails closed when the workflow registry endpoint is missing',async()=>{
  const x=fixture();delete x.replies[prefix+'/actions/workflows/88'];
  await expect(read(x.args,x.get)).rejects.toThrow('MID_740_WORKFLOW_REGISTRY_UNAVAILABLE');
 });
 it('rejects invalid IDs or untrusted SHAs before calling API',async()=>{
  const x=fixture();
  await expect(read({...x.args,runId:-1},x.get)).rejects.toThrow('MID_740_BAD_INPUT');
  await expect(read({...x.args,trustedWorkflowSha:'main'},x.get)).rejects.toThrow('MID_740_BAD_INPUT');
 });
});
describe('MID #740 legacy source shadow readback',()=>{
 const packageCommitSha='f'.repeat(40);
 const legacy={packageCommitSha,producerRunAttempt:2,installerRunId:321};
 const jobPath=prefix+'/actions/runs/123/attempts/2/jobs?per_page=100';
 const installerPath=prefix+'/actions/runs/321';
 const packagePath=prefix+'/git/commits/'+packageCommitSha;
 const legacyFixture=()=>{
  const x=fixture();
  x.run.run_attempt=2;
  x.artifact.name='mid-740-legacy-shadow-123-2-'+packageCommitSha;
  x.page.artifacts[0].name=x.artifact.name;
  delete x.replies[prefix+'/git/ref/heads/main'];
  x.replies[packagePath]={sha:packageCommitSha,parents:[{sha}]};
  x.replies[installerPath]={...x.run,id:321,path:'.github/workflows/install-mid.yml',
   event:'workflow_dispatch',head_sha:packageCommitSha};
  x.replies[jobPath]={total_count:1,jobs:[{run_id:123,run_attempt:2,head_sha:wf,
   status:'completed',conclusion:'success',steps:[
    'Bewährten MID-Installer explizit starten',
    'SHA-gebundenes Original-ZIP für #740 bereitstellen',
    'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen'
   ].map((name,i)=>({name,number:i+1,status:'completed',conclusion:'success',
    started_at:['2026-11-16T10:00:15Z','2026-11-16T10:00:42Z',
      '2026-11-16T10:01:00Z'][i],
    completed_at:['2026-11-16T10:00:40Z','2026-11-16T10:00:58Z',
      '2026-11-16T10:02:00Z'][i]}))}]};
  return x;
 };
 it('joins the historical post-dispatch ZIP shadow and authenticated Installer result',async()=>{
  const x=legacyFixture();
  expect(await read({...x.args,legacy},x.get)).toMatchObject({
   legacyPackageCommitSha:packageCommitSha,legacyInstallerRunId:321,mainSha:null,
   metadataReadbackConsistent:true,releaseAuthorized:false});
 });
 it('also accepts the new pre-dispatch ORIGINAL upload only with strict causal chronology',async()=>{
  const x=legacyFixture(),steps=x.replies[jobPath].jobs[0].steps;
  // Original SHA/run/artifact/Installer identities remain byte-for-byte.
  [steps[0],steps[1],steps[2]]=[steps[1],steps[2],steps[0]];
  steps.forEach((step:any,i:number)=>{step.number=i+1});
  // Array is now stage→upload→dispatch. Both artifact timestamps are
  // before Installer dispatch but within the exact upload step.
  steps[0].started_at='2026-11-16T10:00:15Z';
  steps[0].completed_at='2026-11-16T10:00:40Z';
  steps[1].started_at='2026-11-16T10:01:00Z';
  steps[1].completed_at='2026-11-16T10:02:00Z';
  steps[2].started_at='2026-11-16T10:02:10Z';
  steps[2].completed_at='2026-11-16T10:02:40Z';
  expect(await read({...x.args,legacy},x.get)).toMatchObject({
   metadataReadbackConsistent:true,legacyInstallerRunId:321,
   releaseAuthorized:false
  });
  const mutate=async (fn:(bad:ReturnType<typeof legacyFixture>,steps:any[])=>void)=>{
   const bad=legacyFixture(),j=bad.replies[jobPath].jobs[0].steps;
   [j[0],j[1],j[2]]=[j[1],j[2],j[0]];
   j.forEach((step:any,i:number)=>{step.number=i+1});
   j[0].started_at='2026-11-16T10:00:15Z';
   j[0].completed_at='2026-11-16T10:00:40Z';
   j[1].started_at='2026-11-16T10:01:00Z';
   j[1].completed_at='2026-11-16T10:02:00Z';
   j[2].started_at='2026-11-16T10:02:10Z';
   j[2].completed_at='2026-11-16T10:02:40Z';
   fn(bad,j);
   await expect(read({...bad.args,legacy},bad.get)).rejects.toThrow(/MID_740_/);
  };
  await mutate((x,j)=>{j[2].started_at='2026-11-16T10:01:30Z'});
  await mutate((x,j)=>{j[1].completed_at='2026-11-16T10:03:00Z'});
  await mutate((x,j)=>{x.artifact.updated_at='2026-11-16T10:02:30Z'});
  await mutate((x,j)=>{j[1].number=j[0].number});
  await mutate((x,j)=>{j[2].number=1});
 });
 it.each(['old artifact','wrong installer source','failed installer','wrong parent','wrong attempt',
  'failed upload','duplicate upload','wrong upload time'] as const)('rejects %s',async kind=>{
  const x=legacyFixture();
  const job=x.replies[jobPath].jobs[0],installer=x.replies[installerPath];
  switch(kind){
   case 'old artifact': x.artifact.name=x.page.artifacts[0].name=x.artifact.name.replace('-2-','-1-'); break;
   case 'wrong installer source': installer.head_sha=sha; break;
   case 'failed installer': installer.conclusion='failure'; break;
   case 'wrong parent': x.replies[packagePath].parents[0].sha=wf; break;
   case 'wrong attempt': job.run_attempt=1; break;
   case 'failed upload': job.steps[2].conclusion='failure'; break;
   case 'duplicate upload': job.steps.push({...job.steps[2]}); break;
   case 'wrong upload time': job.steps[2].started_at='2026-11-16T10:01:01Z'; break;
  }
  await expect(read({...x.args,legacy},x.get)).rejects.toThrow(/MID_740_/);
 });
});
