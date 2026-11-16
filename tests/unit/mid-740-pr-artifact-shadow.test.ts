import {describe,it,expect} from 'vitest';
import {inspectMid740DraftArtifact as inspect} from '../../tools/ci/mid-740-pr-artifact-shadow.mjs';
const sha='a'.repeat(40),base='b'.repeat(40),dig='c'.repeat(64),RID=1305110795;
const branch='chatgpt/v0.9.85.484-issue740-merge-review-artifact-qa';
const p='repos/MeteoMartini/MID',api='https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/';
function fixture(){
 const pr:any={number:839,state:'open',draft:true,
   head:{sha,ref:branch,repo:{id:RID}},base:{ref:'main',sha:base}};
 const run:any={id:111,workflow_id:370984997,run_attempt:2,
   path:'.github/workflows/mid-740-pr-artifact-shadow-qa.yml',event:'pull_request',
   head_branch:branch,head_sha:sha,repository:{id:RID},
   head_repository:{id:RID},status:'in_progress',conclusion:null,
   run_started_at:'2026-11-16T13:00:00Z',
   pull_requests:[{number:839,head:{sha,repo:{id:RID}},base:{sha:base}}]};
 const art:any={id:222,name:'mid-740-pr-shadow-111-2',expired:false,
   digest:'sha256:'+dig,size_in_bytes:1024,url:api+'222',
   archive_download_url:api+'222/zip',created_at:'2026-11-16T13:01:00Z',
   expires_at:'2026-11-17T13:01:00Z',
   workflow_run:{id:111,repository_id:RID,head_repository_id:RID,
      head_branch:branch,head_sha:sha}};
 const inventory:any={total_count:1,artifacts:[{
   ...art,workflow_run:{...art.workflow_run}}]};
 const data:any={
  [p+'/actions/runs/111']:run,
  [p+'/actions/workflows/370984997']:{id:370984997,path:'.github/workflows/mid-740-pr-artifact-shadow-qa.yml',state:'active'},
  [p+'/actions/artifacts/222']:art,
  [p+'/pulls/839']:pr,
  [p+'/git/ref/heads/main']:{object:{sha:base}},
  [p+'/git/ref/heads/mid-stable']:{object:{sha:base}},
  [p+'/actions/runs/111/artifacts?per_page=100&page=1']:inventory
 };
 const get=async (path:string)=>{
  if(!(path in data))throw Error('BAD_MOCK_PATH: '+path);
  return data[path];
 };
 return {pr,run,art,inventory,data,get,
   args:{runId:111,attempt:2,artifactId:222,headSha:sha,uploadDigest:dig}};
}
describe('MID #740 PR-only upload/download shadow provenance',()=>{
 it('accepts exact run/attempt/metadata but never authorizes source production',async()=>{
  const x=fixture();const out=await inspect(x.args,x.get);
  expect(out).toMatchObject({runId:111,attempt:2,artifactId:222,
   prShadowMetadataVerified:true,actualSourceProducerVerified:false,
   nativeGitHubReviewVerified:false,installerAuthorized:false,
   recoveryAuthorized:false,releaseAuthorized:false});
 });
 it.each([
  ['main changed',(x:any)=>{x.data[p+'/git/ref/heads/main'].object.sha=sha}],
  ['stable changed',(x:any)=>{x.data[p+'/git/ref/heads/mid-stable'].object.sha=sha}],
  ['PR not draft',(x:any)=>{x.pr.draft=false}],
  ['PR merged',(x:any)=>{x.pr.state='closed'}],
  ['PR SHA changed',(x:any)=>{x.pr.head.sha=base}],
  ['foreign PR',(x:any)=>{x.pr.head.repo.id=2}],
  ['PR base changed',(x:any)=>{x.pr.base.sha=sha}],
  ['wrong workflow ID',(x:any)=>{x.run.workflow_id=2}],
  ['wrong workflow path',(x:any)=>{x.run.path='.github/workflows/agent-source-release.yml'}],
  ['inactive workflow',(x:any)=>{x.data[p+'/actions/workflows/370984997'].state='disabled_manually'}],
  ['registry wrong workflow',(x:any)=>{x.data[p+'/actions/workflows/370984997'].path='.github/workflows/unit-coverage.yml'}],
  ['wrong event',(x:any)=>{x.run.event='workflow_run'}],
  ['rerun attempt drift',(x:any)=>{x.run.run_attempt=1}],
  ['foreign run repository',(x:any)=>{x.run.repository.id=3}],
  ['run SHA drift',(x:any)=>{x.run.head_sha=base}],
  ['PR association missing',(x:any)=>{x.run.pull_requests=[]}],
  ['failed run',(x:any)=>{x.run.status='completed';x.run.conclusion='failure'}],
  ['artifact wrong attempt',(x:any)=>{x.art.name='mid-740-pr-shadow-111-1'}],
  ['artifact expired',(x:any)=>{x.art.expired=true}],
  ['artifact changed digest',(x:any)=>{x.art.digest='sha256:'+'d'.repeat(64)}],
  ['artifact foreign SHA',(x:any)=>{x.art.workflow_run.head_sha=base}],
  ['URL substitution',(x:any)=>{x.art.archive_download_url='https://evil.invalid/x'}],
  ['empty artifact',(x:any)=>{x.art.size_in_bytes=0}],
  ['artifact timestamp prior to run',(x:any)=>{x.art.created_at='2026-11-16T12:00:00Z'}],
  ['empty inventory',(x:any)=>{x.inventory.artifacts=[]}],
  ['inventory altered digest',(x:any)=>{x.inventory.artifacts[0].digest='sha256:'+'e'.repeat(64)}],
  ['incomplete pagination',(x:any)=>{x.inventory.total_count=2}],
  ['duplicate ID',(x:any)=>{x.inventory.total_count=2;x.inventory.artifacts.push({...x.art})}]
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s fails closed',async(_label,mutate)=>{
  const x=fixture();mutate(x);
  await expect(inspect(x.args,x.get)).rejects.toThrow(/MID_740_SHADOW_/);
 });
 it('invalid IDs and digest never contact GitHub',async()=>{
  const x=fixture();
  await expect(inspect({...x.args,runId:0},x.get)).rejects.toThrow('MID_740_SHADOW_BAD_INPUT');
  await expect(inspect({...x.args,uploadDigest:'bad'},x.get)).rejects.toThrow('MID_740_SHADOW_BAD_INPUT');
 });
});
