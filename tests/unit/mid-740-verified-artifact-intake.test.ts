import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {copyFileSync,existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyMid740ArtifactIntake as intake} from '../../tools/ci/mid-740-verified-artifact-intake.mjs';

const path='repos/MeteoMartini/MID',rid=1305110795;
const workflowSha='b'.repeat(40),api='https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/';
const cdn='https://production.mid.blob.core.windows.net/artifact?sv=signed';
const builder=resolve('tools/ci/mid-740-build-source-zip.py');
const script=String.raw`import sys
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
directory=Path(sys.argv[1]);output=Path(sys.argv[2])
with ZipFile(output,'w',ZIP_DEFLATED) as z:
 for name in ('MID-professional-replacement.zip','MID-source-zip-evidence.json'):
  z.write(directory/name,name)
`;
function run(cwd:string,command:string,args:string[]){
 const x=spawnSync(command,args,{cwd,encoding:'utf8',timeout:30000});
 if(x.error)throw x.error;return x;
}
function scenario(root:string){
 const repo=join(root,'repo'),artifactDir=join(root,'payload'),outer=join(root,'outer.zip');
 mkdirSync(join(repo,'tools','ci'),{recursive:true});
 writeFileSync(join(repo,'source.txt'),'Trusted MID QA bytes\n');
 for(const name of ['mid-740-verify-artifact-envelope.py',
  'mid-740-verify-local-artifact.py','verify-source-release-zip.py'])
  copyFileSync(resolve('tools/ci',name),join(repo,'tools','ci',name));
 for(const args of [['init','--object-format=sha1','-q'],['add','.'],
  ['-c','user.name=MID QA','-c','user.email=qa@example.invalid',
   '-c','commit.gpgsign=false','commit','-qm','fixture']])
  expect(run(repo,'git',args).status).toBe(0);
 const sha=run(repo,'git',['rev-parse','HEAD']).stdout.trim();
 const result=run(repo,'python3',[builder,'--repository',repo,'--source-sha',sha,
  '--destination',artifactDir]);
 expect(result.status,result.stderr).toBe(0);
 expect(run(repo,'python3',['-c',script,artifactDir,outer]).status).toBe(0);
 const bytes=readFileSync(outer),digest=createHash('sha256').update(bytes).digest('hex');
 const runMeta={id:123,workflow_id:567,run_attempt:1,repository:{id:rid},
  head_repository:{id:rid},head_sha:workflowSha,
  path:'.github/workflows/agent-source-release.yml',event:'workflow_run',
  head_branch:'main',status:'completed',conclusion:'success',
  run_started_at:'2026-11-16T10:00:00Z',updated_at:'2026-11-16T10:05:00Z'};
 const artifact={id:456,name:'mid-release-'+sha,expired:false,
  digest:'sha256:'+digest,size_in_bytes:bytes.length,url:api+'456',
  archive_download_url:api+'456/zip',created_at:'2026-11-16T10:01:00Z',
  updated_at:'2026-11-16T10:02:00Z',
  workflow_run:{id:123,repository_id:rid,head_repository_id:rid,
   head_branch:'main',head_sha:workflowSha}};
 const replies:any={
  [path+'/actions/runs/123']:runMeta,
  [path+'/actions/workflows/567']:{id:567,path:'.github/workflows/agent-source-release.yml',state:'active'},
  [path+'/actions/runs/123/attempts/1/jobs?per_page=100&page=1']:{total_count:1,jobs:[{id:789,run_id:123,head_sha:workflowSha,name:'PR mergen, Release-ZIP erzeugen und Installer starten',status:'completed',conclusion:'success',started_at:'2026-11-16T10:00:20Z',completed_at:'2026-11-16T10:04:50Z'}]},
  [path+'/actions/artifacts/456']:artifact,
  [path+'/actions/runs/123/artifacts?per_page=100&page=1']:
   {total_count:1,artifacts:[{...artifact,workflow_run:{...artifact.workflow_run}}]}
 };
 let mainSha=sha,mainReads=0,artifactReads=0;
 let afterFirstArtifactRead:(()=>void)|undefined;
 const onSecondArtifactRead=(f:()=>void)=>{afterFirstArtifactRead=f};
 const get=async(key:string)=>{
  if(key===path+'/git/ref/heads/main')
   return {object:{sha:++mainReads>=2?mainSha:sha}};
  if(key===path+'/actions/artifacts/456'&&++artifactReads===2)
   afterFirstArtifactRead?.();
  return key in replies?structuredClone(replies[key]):undefined;
 };
 const fetcher=async(url:string)=>url===api+'456/zip'?
  new Response(null,{status:302,headers:{location:cdn}}):
  new Response(bytes,{status:200});
 const inputs={runId:123,artifactId:456,sourceMergeSha:sha,
  trustedWorkflowSha:workflowSha,repository:repo,
  envelopeOutput:join(root,'downloaded.zip'),
  artifactDirectory:join(root,'verified'),
  token:'trusted-test-token'};
 return {inputs,get,fetcher,replies,onSecondArtifactRead,
  setCurrentMain:(next:string)=>{mainSha=next;}};
}
describe('MID #740 complete artifact intake: mocked API + real binary ZIP and Git validation',()=>{
 it('validates bytes and Git-blob identity but NEVER authorizes installer/release',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-intake-'));
  try{
   const x=scenario(root);
   const result=await intake(x.inputs,{get:x.get,fetcher:x.fetcher});
   expect(result).toMatchObject({mainSha:x.inputs.sourceMergeSha,
    metadataVerified:true,downloadAndGitTreeVerified:true,
    producerJobVerified:true,producerIdentityReread:true,
    nativeGitHubReviewVerified:false,installerAuthorized:false,releaseAuthorized:false});
   expect(existsSync(x.inputs.artifactDirectory)).toBe(true);
  }finally{rmSync(root,{recursive:true,force:true})}
 },60000);
 it('rejects changed artifact identity after verifying real ZIP and Git bytes',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-intake-artifact-race-'));
  try{
   const x=scenario(root);
   x.onSecondArtifactRead(()=>{
    const digest='sha256:'+'f'.repeat(64);
    x.replies[path+'/actions/artifacts/456'].digest=digest;
    x.replies[path+'/actions/runs/123/artifacts?per_page=100&page=1'].artifacts[0].digest=digest;
   });
   await expect(intake(x.inputs,{get:x.get,fetcher:x.fetcher}))
    .rejects.toThrow('MID_740_INTAKE_PRODUCER_CHANGED_AFTER_DOWNLOAD');
   expect(existsSync(x.inputs.envelopeOutput)).toBe(false);
   expect(existsSync(x.inputs.artifactDirectory)).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true})}
 },60000);
 it('rejects changed producer job status after verifying real ZIP and Git bytes',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-intake-job-race-'));
  try{
   const x=scenario(root);
   x.onSecondArtifactRead(()=>{
    x.replies[path+'/actions/runs/123/attempts/1/jobs?per_page=100&page=1']
     .jobs[0].conclusion='failure';
   });
   await expect(intake(x.inputs,{get:x.get,fetcher:x.fetcher}))
    .rejects.toThrow('MID_740_INTAKE_PRODUCER_JOB_NOT_VERIFIED');
   expect(existsSync(x.inputs.envelopeOutput)).toBe(false);
   expect(existsSync(x.inputs.artifactDirectory)).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true})}
 },60000);
 it('fails closed on a main race after ZIP verification and cleans downloaded files',async()=>{
  const root=mkdtempSync(join(tmpdir(),'mid740-intake-race-'));
  try{
   const x=scenario(root);
   x.setCurrentMain('f'.repeat(40));
   await expect(intake(x.inputs,{get:x.get,fetcher:x.fetcher}))
    .rejects.toThrow('MID_740_INTAKE_MAIN_CHANGED_AFTER_DOWNLOAD');
   expect(existsSync(x.inputs.envelopeOutput)).toBe(false);
   expect(existsSync(x.inputs.artifactDirectory)).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true})}
 },60000);
});