#!/usr/bin/env node
/** MID #740 bounded read-only GitHub REST artifact preflight, QA only.
 * No untrusted URLs, ZIP extraction, workflow dispatch, merge or release.
 */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const REPO='MeteoMartini/MID',REPO_ID=1305110795;
const SHA=/^[a-f0-9]{40}$/;
const API='https://api.github.com/repos/'+REPO+'/actions/artifacts/';
const validId=n=>Number.isSafeInteger(n)&&n>0;
const fail=reason=>{throw new Error('MID_740_'+reason)};
export async function collectMid740GitHubReadback({
 runId,artifactId,sourceMergeSha,trustedWorkflowSha,legacy
}={},get){
 if(!validId(runId)||!validId(artifactId)||!SHA.test(sourceMergeSha??'')||
    !SHA.test(trustedWorkflowSha??'')||typeof get!=='function')fail('BAD_INPUT');
 if(legacy!==undefined&&(!SHA.test(legacy?.packageCommitSha??'')||
    !validId(legacy.producerRunAttempt)||!validId(legacy.installerRunId)))fail('BAD_LEGACY_INPUT');
 const prefix='repos/'+REPO;
 const run=await get(prefix+'/actions/runs/'+runId);
 const artifact=await get(prefix+'/actions/artifacts/'+artifactId);
 if(!legacy){
  const main=await get(prefix+'/git/ref/heads/main');
  if(main?.object?.sha!==sourceMergeSha)fail('MAIN_SOURCE_DRIFT');
 }
 if(run?.id!==runId||!validId(run.workflow_id)||run.run_attempt!==(legacy?.producerRunAttempt??1)||
    run.repository?.id!==REPO_ID||run.head_repository?.id!==REPO_ID||
    run.head_sha!==trustedWorkflowSha||
    run.path!=='.github/workflows/agent-source-release.yml'||
    run.event!=='workflow_run'||run.head_branch!=='main'||
    run.status!=='completed'||run.conclusion!=='success')
  fail('UNTRUSTED_RUN_OR_UNPROVEN_ATTEMPT');
 let registry;
 try{registry=await get(prefix+'/actions/workflows/'+run.workflow_id)}
 catch{fail('WORKFLOW_REGISTRY_UNAVAILABLE')}
 if(registry?.id!==run.workflow_id||
    registry.path!=='.github/workflows/agent-source-release.yml'||
    registry.state!=='active')
  fail('WORKFLOW_REGISTRY_DRIFT');
 const w=artifact?.workflow_run;
 const expectedName=legacy
  ? `mid-740-legacy-shadow-${runId}-${legacy.producerRunAttempt}-${legacy.packageCommitSha}`
  : 'mid-release-'+sourceMergeSha;
 if(artifact?.id!==artifactId||artifact.name!==expectedName||
    artifact.expired!==false||!/^sha256:[a-f0-9]{64}$/.test(artifact.digest??'')||
    !validId(artifact.size_in_bytes)||artifact.size_in_bytes>900*1024*1024||
    artifact.url!==API+artifactId||artifact.archive_download_url!==API+artifactId+'/zip'||
    w?.id!==runId||w.repository_id!==REPO_ID||w.head_repository_id!==REPO_ID||
    w.head_branch!=='main'||w.head_sha!==trustedWorkflowSha)
  fail('UNTRUSTED_ARTIFACT');
 let items=[],total=null;
 for(let p=1;p<=10;p++){
  const page=await get(prefix+'/actions/runs/'+runId+'/artifacts?per_page=100&page='+p);
  if(!Number.isSafeInteger(page?.total_count)||page.total_count<0||
     page.total_count>1000||!Array.isArray(page.artifacts)||
     page.artifacts.length>100||page.artifacts.some(a=>!validId(a?.id)))
   fail('UNVERIFIED_INVENTORY');
  if(total===null)total=page.total_count;
  if(page.total_count!==total)fail('INCONSISTENT_PAGINATION');
  items.push(...page.artifacts);
  if(items.length>=total)break;
  if(page.artifacts.length!==100)fail('TRUNCATED_PAGINATION');
 }
 if(items.length!==total||new Set(items.map(x=>x.id)).size!==items.length)
  fail('INCOMPLETE_INVENTORY');
 const candidates=items.filter(x=>x.name===artifact.name);
 const found=candidates[0];
 if(candidates.length!==1||found.id!==artifactId||found.digest!==artifact.digest||
    found.size_in_bytes!==artifact.size_in_bytes||
    found.workflow_run?.id!==runId||found.workflow_run?.repository_id!==REPO_ID||
    found.workflow_run?.head_sha!==trustedWorkflowSha)
  fail('ARTIFACT_INVENTORY_MISMATCH');
 const started=Date.parse(run.run_started_at??'');
 const completed=Date.parse(run.updated_at??'');
 const created=Date.parse(artifact.created_at??'');
 const artifactUpdated=Date.parse(artifact.updated_at??'');
 if(![started,completed,created,artifactUpdated].every(Number.isFinite)||
    completed<started||created<started||created>completed||
    artifactUpdated<created||artifactUpdated>completed)
  fail('UNVERIFIED_ARTIFACT_CHRONOLOGY');
 if(legacy){
  const {packageCommitSha,installerRunId,producerRunAttempt}=legacy;
  const [pkg,installer,list]=await Promise.all([
   get(prefix+'/git/commits/'+packageCommitSha),
   get(prefix+'/actions/runs/'+installerRunId),
   get(prefix+'/actions/runs/'+runId+'/attempts/'+producerRunAttempt+'/jobs?per_page=100')
  ]);
  if(pkg?.sha!==packageCommitSha||pkg.parents?.length!==1||pkg.parents[0]?.sha!==sourceMergeSha)
   fail('LEGACY_PACKAGE_PARENT_DRIFT');
  if(installer?.id!==installerRunId||installer.path!=='.github/workflows/install-mid.yml'||
     installer.event!=='workflow_dispatch'||installer.head_branch!=='main'||
     installer.head_sha!==packageCommitSha||installer.repository?.id!==REPO_ID||
     installer.head_repository?.id!==REPO_ID||installer.status!=='completed'||
     installer.conclusion!=='success')fail('LEGACY_INSTALLER_DRIFT');
  const job=list?.jobs?.[0];
  if(list?.total_count!==1||list.jobs?.length!==1||job?.run_id!==runId||
     job.run_attempt!==producerRunAttempt||job.head_sha!==trustedWorkflowSha||
     job.status!=='completed'||job.conclusion!=='success'||!Array.isArray(job.steps))
   fail('LEGACY_PRODUCER_JOB_DRIFT');
  const names=['Bewährten MID-Installer explizit starten',
   'SHA-gebundenes Original-ZIP für #740 bereitstellen',
   'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen'];
  const steps=names.map(name=>job.steps.filter(step=>step?.name===name));
  if(steps.some(group=>group.length!==1||group[0].status!=='completed'||
    group[0].conclusion!=='success'||!validId(group[0].number))||
    steps[0][0].number>=steps[1][0].number||steps[1][0].number>=steps[2][0].number)
   fail('LEGACY_PRODUCER_STEPS_UNVERIFIED');
  const uploadStart=Date.parse(steps[2][0].started_at??'');
  const uploadEnd=Date.parse(steps[2][0].completed_at??'');
  if(!Number.isFinite(uploadStart)||!Number.isFinite(uploadEnd)||
     uploadStart<started||uploadEnd>completed||created<uploadStart||artifactUpdated>uploadEnd)
   fail('LEGACY_UPLOAD_CHRONOLOGY_DRIFT');
 }
 return Object.freeze({
  schema:'mid.740.github-readback.v1',mainSha:legacy?null:sourceMergeSha,trustedWorkflowSha,
  ...(legacy&&{legacyInstallerRunId:legacy.installerRunId,legacyPackageCommitSha:legacy.packageCommitSha}),
  producerRun:run,artifact,producerArtifacts:items,producerInventoryComplete:true,
  metadataReadbackConsistent:true,releaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);
  if(args.length!==4||!/^[1-9][0-9]*$/.test(args[0])||
     !/^[1-9][0-9]*$/.test(args[1]))fail('BAD_CLI_INPUT');
  const get=path=>{
   try{return JSON.parse(execFileSync('gh',['api','--method','GET',path],{
    encoding:'utf8',timeout:20000,maxBuffer:3*1024*1024,
    stdio:['ignore','pipe','ignore']
   }));}catch{fail('GITHUB_READBACK_UNAVAILABLE')}
  };
  const x=await collectMid740GitHubReadback({
   runId:Number(args[0]),artifactId:Number(args[1]),
   sourceMergeSha:args[2],trustedWorkflowSha:args[3]
  },get);
  process.stdout.write(JSON.stringify({
   schema:x.schema,runId:x.producerRun.id,artifactId:x.artifact.id,
   envelopeDigest:x.artifact.digest,metadataReadbackConsistent:true,
   releaseAuthorized:false
  })+'\n');
 }catch(e){
  process.stderr.write((e?.message?.startsWith('MID_740_')?e.message:
   'MID_740_READBACK_REJECTED')+'\n');
  process.exitCode=1;
 }
}
