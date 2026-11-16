#!/usr/bin/env node
/** MID #740: strictly read-only PR-draft artifact shadow. NEVER authorizes production. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const REPO='MeteoMartini/MID',RID=1305110795,PR=839;
const BRANCH='chatgpt/v0.9.85.484-issue740-merge-review-artifact-qa';
const WORKFLOW='.github/workflows/mid-740-pr-artifact-shadow-qa.yml',API='https://api.github.com/repos/'+REPO+'/actions/artifacts/';
const SHA=/^[a-f0-9]{40}$/,HEX=/^[a-f0-9]{64}$/;
const pos=n=>Number.isSafeInteger(n)&&n>0;
const fail=x=>{throw Error('MID_740_SHADOW_'+x)};
const time=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?Date.parse(s):NaN;
export async function inspectMid740DraftArtifact({runId,attempt,artifactId,headSha,uploadDigest}={},get){
 if(!pos(runId)||!pos(attempt)||!pos(artifactId)||!SHA.test(headSha??'')||
    !HEX.test(uploadDigest??'')||typeof get!=='function')fail('BAD_INPUT');
 const prefix='repos/'+REPO;
 const [run,art,pr,main,stable]=await Promise.all([
  get(prefix+'/actions/runs/'+runId),get(prefix+'/actions/artifacts/'+artifactId),
  get(prefix+'/pulls/'+PR),get(prefix+'/git/ref/heads/main'),
  get(prefix+'/git/ref/heads/mid-stable')]);
 const base=main?.object?.sha;
 if(!SHA.test(base??'')||base!==stable?.object?.sha||pr?.number!==PR||
    pr?.state!=='open'||pr.draft!==true||pr.base?.ref!=='main'||
    pr.base?.sha!==base||pr.head?.sha!==headSha||
    pr.head?.ref!==BRANCH||pr.head?.repo?.id!==RID)
  fail('PR_OR_STABLE_DRIFT');
 if(!pos(run?.workflow_id))fail('BAD_WORKFLOW_ID');
 let workflow;
 try{workflow=await get(prefix+'/actions/workflows/'+run.workflow_id)}
 catch{fail('WORKFLOW_METADATA_UNAVAILABLE')}
 if(workflow?.id!==run.workflow_id||workflow.path!==WORKFLOW||
    workflow.state!=='active')fail('WORKFLOW_IDENTITY_DRIFT');
 if(run?.id!==runId||
    run.path!==WORKFLOW||run.event!=='pull_request'||
    run.run_attempt!==attempt||run.head_sha!==headSha||
    run.head_branch!==BRANCH||run.repository?.id!==RID||
    run.head_repository?.id!==RID||
    !['in_progress','completed'].includes(run.status)||
    (run.status==='completed'&&run.conclusion!=='success')||
    !Array.isArray(run.pull_requests)||
    !run.pull_requests.some(p=>p.number===PR&&p.head?.sha===headSha&&
      p.head?.repo?.id===RID&&p.base?.sha===base))
  fail('UNTRUSTED_PR_RUN');
 const name='mid-740-pr-shadow-'+runId+'-'+attempt,w=art?.workflow_run;
 if(art?.id!==artifactId||art.name!==name||art.expired!==false||
    art.digest!=='sha256:'+uploadDigest||!pos(art.size_in_bytes)||
    art.size_in_bytes>900*1024*1024||art.url!==API+artifactId||
    art.archive_download_url!==API+artifactId+'/zip'||
    w?.id!==runId||w.repository_id!==RID||w.head_repository_id!==RID||
    w.head_branch!==BRANCH||w.head_sha!==headSha)
  fail('UNTRUSTED_ARTIFACT');
 const start=time(run.run_started_at),created=time(art.created_at),
       expires=time(art.expires_at);
 if(!Number.isFinite(start)||!Number.isFinite(created)||
    !Number.isFinite(expires)||created<start||expires<=created)
  fail('BAD_CHRONOLOGY');
 let total=null,all=[];
 for(let page=1;page<=10;page++){
  const data=await get(prefix+'/actions/runs/'+runId+'/artifacts?per_page=100&page='+page);
  if(!Number.isSafeInteger(data?.total_count)||data.total_count<1||
     data.total_count>1000||!Array.isArray(data.artifacts)||
     data.artifacts.length>100)fail('BAD_INVENTORY_PAGE');
  if(total===null)total=data.total_count;
  if(total!==data.total_count)fail('PAGINATION_RACE');
  all.push(...data.artifacts);
  if(all.length>=total)break;
  if(data.artifacts.length!==100)fail('TRUNCATED_INVENTORY');
 }
 if(all.length!==total||new Set(all.map(a=>a.id)).size!==all.length)
  fail('INCOMPLETE_INVENTORY');
 const matches=all.filter(a=>a.name===name);
 if(matches.length!==1||matches[0].id!==artifactId||
    matches[0].digest!==art.digest||
    matches[0].size_in_bytes!==art.size_in_bytes||
    matches[0].workflow_run?.id!==runId||
    matches[0].workflow_run?.head_sha!==headSha)fail('INVENTORY_DRIFT');
 return Object.freeze({schema:'mid.740.pr-artifact-shadow.v1',
  runId,attempt,artifactId,headSha,baseSha:base,
  envelopeDigest:'sha256:'+uploadDigest,prShadowMetadataVerified:true,
  actualSourceProducerVerified:false,nativeGitHubReviewVerified:false,
  installerAuthorized:false,recoveryAuthorized:false,releaseAuthorized:false});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [run,attempt,id,sha,digest,...extra]=process.argv.slice(2);
  if(extra.length||![run,attempt,id].every(s=>/^[1-9][0-9]*$/.test(s??'')))
   fail('BAD_ARGS');
  const get=path=>{
   try{return JSON.parse(execFileSync('gh',['api','--method','GET',path],{
    encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,
    stdio:['ignore','pipe','ignore']}));}
   catch{fail('GITHUB_READBACK_UNAVAILABLE')}
  };
  const result=await inspectMid740DraftArtifact({
   runId:Number(run),attempt:Number(attempt),artifactId:Number(id),
   headSha:sha,uploadDigest:digest},get);
  process.stdout.write(JSON.stringify(result)+'\n');
 }catch(e){
  process.stderr.write((e?.message?.startsWith('MID_740_SHADOW_')?
   e.message:'MID_740_SHADOW_REJECTED')+'\n');
  process.exitCode=1;
 }
}
