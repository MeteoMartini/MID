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