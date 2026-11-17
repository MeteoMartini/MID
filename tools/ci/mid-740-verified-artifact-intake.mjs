#!/usr/bin/env node
/** MID #740: composed read-only GitHub artifact intake.
 * Only trusted SHA-bound scripts and an independently authenticated artifact
 * may reach this entrypoint. This never merges, deploys or authorizes release.
 */
import {execFileSync} from 'node:child_process';
import {existsSync,linkSync,lstatSync,mkdirSync,mkdtempSync,readFileSync,realpathSync,rmdirSync,rmSync,unlinkSync,writeFileSync} from 'node:fs';
import {resolve,join,dirname,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectMid740GitHubReadback} from './mid-740-github-artifact-readback.mjs';
import {downloadMid740Envelope} from './mid-740-download-artifact-envelope.mjs';

const SHA=/^[0-9a-f]{40}$/;
const reject=code=>{throw Error('MID_740_INTAKE_'+code)};
export async function verifyMid740ArtifactIntake({
 runId,artifactId,sourceMergeSha,trustedWorkflowSha,repository,
 envelopeOutput,artifactDirectory,token
}={}, {get,fetcher=fetch,python=execFileSync}={}){
 if(!SHA.test(sourceMergeSha??'')||!SHA.test(trustedWorkflowSha??'')||
    typeof get!=='function'||typeof fetcher!=='function'||
    typeof python!=='function')reject('BAD_IDENTITY');
 const repo=resolve(repository??'.');
 if(!existsSync(repo)||realpathSync(repo)!==repo)reject('UNTRUSTED_CHECKOUT');
 let checkoutSha;
 try{checkoutSha=execFileSync('git',['rev-parse','HEAD'],{
  cwd:repo,encoding:'utf8',timeout:20000
 }).trim();}catch{reject('UNREADABLE_GIT_SHA')}
 if(checkoutSha!==sourceMergeSha)reject('CHECKOUT_HEAD_DRIFT');
 const meta=await collectMid740GitHubReadback({
  runId,artifactId,sourceMergeSha,trustedWorkflowSha
 },get);
 const jobPath='repos/MeteoMartini/MID/actions/runs/'+runId+
  '/attempts/1/jobs?per_page=100&page=1';
 const checkedJob=async()=>{
  const list=await get(jobPath),job=list?.jobs?.[0];
  const time=[meta.producerRun.run_started_at,meta.producerRun.updated_at,
    job?.started_at,job?.completed_at].map(x=>Date.parse(x??''));
  if(list?.total_count!==1||list.jobs?.length!==1||
     !Number.isSafeInteger(job?.id)||job.id<1||job.run_id!==runId||
     job.run_attempt!==meta.producerRun.run_attempt||
     job.head_sha!==trustedWorkflowSha||
     job.name!=='PR mergen, Release-ZIP erzeugen und Installer starten'||
     job.status!=='completed'||job.conclusion!=='success'||
     !time.every(Number.isFinite)||time[0]>time[2]||
     time[2]>time[3]||time[3]>time[1]||
     !Array.isArray(job.steps)||job.steps.length<2)
    reject('PRODUCER_JOB_NOT_VERIFIED');
  // The source producer currently uploads the shadow artifact with
  // continue-on-error. A SUCCESSFUL JOB does NOT prove upload success.
  // Require the original staging and upload steps in the actual attempt-1
  // job, their ordered execution, and the artifact's creation inside upload.
  const unique=new Set();
  for(const step of job.steps){
   if(!Number.isSafeInteger(step?.number)||step.number<1||
      typeof step.name!=='string'||!step.name||
      unique.has(step.number))reject('PRODUCER_STEPS_UNVERIFIED');
   unique.add(step.number);
  }
  const one=name=>{
   const found=job.steps.filter(s=>s.name===name);
   if(found.length!==1||found[0].status!=='completed'||
      found[0].conclusion!=='success')
    reject('PRODUCER_STEPS_UNVERIFIED');
   return found[0];
  };
  const stage=one('SHA-gebundenes Original-ZIP für #740 bereitstellen');
  const upload=one('Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen');
  const moments=[stage.started_at,stage.completed_at,upload.started_at,
    upload.completed_at].map(s=>Date.parse(s??''));
  const artifactCreated=Date.parse(meta.artifact.created_at??'');
  const artifactUpdated=Date.parse(meta.artifact.updated_at??'');
  if(moments.some(t=>!Number.isFinite(t))||
     !Number.isFinite(artifactCreated)||!Number.isFinite(artifactUpdated)||
     stage.number>=upload.number||moments.some((t,n)=>n>0&&t<moments[n-1])||
     moments[0]<time[2]||moments[3]>time[3]||
     artifactCreated<moments[2]||artifactUpdated>moments[3])
   reject('PRODUCER_UPLOAD_CHRONOLOGY_UNVERIFIED');
  // Fingerprint the entire original job and steps on both GitHub reads:
  // a late upload failure, rerun or step replacement must invalidate intake.
  return JSON.stringify([job.id,job.run_id,job.run_attempt,job.head_sha,
    job.name,job.started_at,job.completed_at,
    job.steps.map(s=>[s.number,s.name,s.status,s.conclusion,
     s.started_at,s.completed_at])]);
 };
 const beforeJob=await checkedJob();
 const identity=x=>JSON.stringify([
  x.producerRun.id,x.producerRun.run_attempt,x.producerRun.updated_at,
  x.artifact.id,x.artifact.name,x.artifact.digest,x.artifact.size_in_bytes,
  x.artifact.created_at,x.artifact.updated_at
 ]);
 const beforeIdentity=identity(meta);
 const destination=value=>{
  if(typeof value!=='string'||!value||value.includes('\\0'))reject('BAD_OUTPUT');
  const path=resolve(value),parent=dirname(path);
  let stat;
  try{stat=lstatSync(parent)}catch{reject('OUTPUT_PARENT_UNAVAILABLE')}
  if(!stat.isDirectory()||stat.isSymbolicLink()||realpathSync(parent)!==parent||
     lstatSync(path,{throwIfNoEntry:false}))reject('OUTPUT_PATH_UNTRUSTED');
  return {path,parent};
 };
 const {path:envelope}=destination(envelopeOutput);
 const {path:outputDir,parent:outputParent}=destination(artifactDirectory);
 if(envelope===outputDir||envelope.startsWith(outputDir+sep)||
    outputDir.startsWith(envelope+sep))reject('OVERLAPPING_OUTPUT_PATHS');
 const staging=mkdtempSync(join(outputParent,'.mid740-intake-private-'));
 const candidateEnvelope=join(staging,'original-envelope.zip');
 const candidateDirectory=join(staging,'verified');
 let ownedDirectory=false,completed=false;
 const published=[];
 const sameFile=(path,stat)=>{
  const now=lstatSync(path,{throwIfNoEntry:false});
  return !!now&&now.dev===stat.dev&&now.ino===stat.ino;
 };
 try{
  const transfer=await downloadMid740Envelope({
   artifact:meta.artifact,output:candidateEnvelope,token
  },fetcher);
  const exe=join(repo,'tools/ci/mid-740-verify-artifact-envelope.py');
  const local=join(repo,'tools/ci/mid-740-verify-local-artifact.py');
  const source=join(repo,'tools/ci/verify-source-release-zip.py');
  let verification;
  try{
   verification=JSON.parse(python('python3',[
    exe,'--envelope',candidateEnvelope,
    '--expected-envelope-sha256',transfer.envelopeSha256,
    '--source-sha',sourceMergeSha,
    '--destination',candidateDirectory,
    '--repository',repo,
    '--local-verifier',local,
    '--source-verifier',source
   ],{cwd:repo,encoding:'utf8',timeout:180000,maxBuffer:1024*1024,
    stdio:['ignore','pipe','ignore']}));
  }catch{reject('NESTED_GIT_TREE_OR_ENVELOPE_INVALID')}
  if(verification?.envelopeBytesVerified!==true||
     verification?.sourceGitTreeVerified!==true||
     verification?.sourceMergeSha!==sourceMergeSha||
     verification?.envelopeSha256!==transfer.envelopeSha256||
     verification?.releaseAuthorized!==false||
     verification?.installerAuthorized!==false)
   reject('INCOMPLETE_FINAL_PROOF');
  const refreshed=await get('repos/MeteoMartini/MID/git/ref/heads/main');
  if(refreshed?.object?.sha!==sourceMergeSha)reject('MAIN_CHANGED_AFTER_DOWNLOAD');
  const after=await collectMid740GitHubReadback({
   runId,artifactId,sourceMergeSha,trustedWorkflowSha
  },get);
  const afterJob=await checkedJob();
  if(identity(after)!==beforeIdentity||afterJob!==beforeJob)
   reject('PRODUCER_CHANGED_AFTER_DOWNLOAD');
  const finalMain=await get('repos/MeteoMartini/MID/git/ref/heads/main');
  if(finalMain?.object?.sha!==sourceMergeSha)reject('FINAL_MAIN_RACE');
  // The final outputs must not appear before the original GitHub race checks.
  // Exclusively reserve the destination; never rename over a racing directory.
  try{mkdirSync(outputDir,{mode:0o700})}catch{reject('OUTPUT_PATH_RACE')}
  ownedDirectory=true;
  const marker=join(outputDir,'.mid740-incomplete');
  writeFileSync(marker,'QA ONLY - NOT PUBLISHED\\n',{flag:'wx',mode:0o600});
  published.push({path:marker,stat:lstatSync(marker)});
  for(const name of ['MID-professional-replacement.zip','MID-source-zip-evidence.json']){
   const input=join(candidateDirectory,name),target=join(outputDir,name);
   const stat=lstatSync(input);
   if(!stat.isFile()||stat.isSymbolicLink()||stat.nlink!==1)
    reject('VERIFIED_MEMBER_TYPE_CHANGED');
   try{linkSync(input,target)}catch{reject('OUTPUT_MEMBER_RACE_OR_LINK_FAILED')}
   published.push({path:target,stat});
  }
  const zipStat=lstatSync(candidateEnvelope);
  if(!zipStat.isFile()||zipStat.nlink!==1)reject('VERIFIED_ENVELOPE_TYPE_CHANGED');
  try{linkSync(candidateEnvelope,envelope)}
  catch{reject('OUTPUT_ENVELOPE_RACE_OR_LINK_FAILED')}
  published.push({path:envelope,stat:zipStat});
  if(!sameFile(marker,published[0].stat))reject('OUTPUT_MARKER_RACE');
  unlinkSync(marker);
  completed=true;
  return Object.freeze({
   schema:'mid.740.end-to-end-intake-qa.v1',
   mainSha:sourceMergeSha,producerRunId:runId,artifactId,
   artifactSha256:transfer.envelopeSha256,
   downloadAndGitTreeVerified:true,metadataVerified:true,
   producerJobVerified:true,producerIdentityReread:true,
   nativeGitHubReviewVerified:false,installerAuthorized:false,
   releaseAuthorized:false
  });
 }finally{
  if(!completed){
   // Only remove our own matching inodes, never a competing foreign file.
   for(const file of published.reverse()){
    try{if(sameFile(file.path,file.stat))unlinkSync(file.path)}catch{}
   }
   if(ownedDirectory){try{rmdirSync(outputDir)}catch{}}
  }
  rmSync(staging,{recursive:true,force:true});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [runId,artifactId,sourceMergeSha,trustedWorkflowSha,repo,envelope,out,...extra]=
   process.argv.slice(2);
  if(extra.length||!/^[1-9][0-9]*$/.test(runId??'')||
     !/^[1-9][0-9]*$/.test(artifactId??''))reject('BAD_CLI_ARGS');
  const get=path=>{
   try{return JSON.parse(execFileSync('gh',['api','--method','GET',path],{
    encoding:'utf8',timeout:25000,maxBuffer:3*1024*1024,
    stdio:['ignore','pipe','ignore']
   }));}catch{reject('GITHUB_API_UNAVAILABLE')}
  };
  const proof=await verifyMid740ArtifactIntake({
   runId:Number(runId),artifactId:Number(artifactId),sourceMergeSha,
   trustedWorkflowSha,repository:repo,envelopeOutput:envelope,
   artifactDirectory:out,token:process.env.GH_TOKEN
  },{get});
  process.stdout.write(JSON.stringify(proof)+'\n');
 }catch(error){
  process.stderr.write((error?.message?.startsWith('MID_740_')?
   error.message:'MID_740_INTAKE_REJECTED')+'\n');
  process.exitCode=1;
 }
}