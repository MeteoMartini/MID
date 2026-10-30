#!/usr/bin/env node
// Protected-main ONLY, manual pilot: sign independent read-only Source-PR gate
// observations. NO build/test reuse or release authority is implied.
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SOURCE_JOBS} from './attested-reuse-policy.mjs';

const REPO='MeteoMartini/MID',REPO_ID=1305110795;
const SOURCE_WORKFLOW='.github/workflows/chatgpt-pr-gate.yml';
const PRODUCER='MeteoMartini/MID/.github/workflows/attested-source-qualification.yml';
const AGGREGATOR='Agent-Quellstand vollständig prüfen';
const OPTIONAL=new Map([
 ['RUC +27h Kern, EPS und Gesamtpaket',new Set(['success','skipped'])],
 ['Extremwetterpolygone · echte Browserpixel',new Set(['success','skipped'])]
]);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{40}$/.test(x);
const number=x=>Number.isSafeInteger(x)&&x>0;
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const fail=s=>{throw Error('Protected Source observation rejected: '+s)};

export function inspectProtectedSource({run,pr,jobs,sourceCommit,main,stable},{runId,prNumber,signerSha,now}){
 if(!number(runId)||!number(prNumber)||!sha(signerSha)||!Number.isFinite(now))fail('invalid inputs');
 if(main?.object?.sha!==signerSha||stable?.object?.sha!==signerSha)
  fail('signer SHA not promoted Stable');
 if(!object(run)||run.id!==runId||!number(run.run_attempt)||
    run.event!=='pull_request'||run.path!==SOURCE_WORKFLOW||
    run.status!=='completed'||run.conclusion!=='success'||!sha(run.head_sha)||
    run.head_sha===signerSha||
    !/^(chatgpt|codex)\/v[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+-[a-zA-Z0-9._-]+$/.test(run.head_branch||'')||
    run.repository?.full_name!==REPO||run.repository?.id!==REPO_ID||
    run.head_repository?.full_name!==REPO||run.head_repository?.id!==REPO_ID)
  fail('Source run identity/attempt/success');
 if(!object(pr)||pr.number!==prNumber||pr.state!=='closed'||pr.merged!==true||
    pr.draft!==false||pr.head?.sha!==run.head_sha||pr.head?.ref!==run.head_branch||
    pr.base?.ref!=='main'||!sha(pr.base?.sha)||
    pr.head?.repo?.id!==REPO_ID||pr.head?.repo?.full_name!==REPO||
    pr.base?.repo?.id!==REPO_ID||pr.base?.repo?.full_name!==REPO)
  fail('PR is not the exact merged trusted branch');
 if(!object(sourceCommit)||sourceCommit.sha!==run.head_sha||!sha(sourceCommit.tree?.sha))
  fail('independent git tree mismatch');
 if(!object(jobs)||!number(jobs.total_count)||!Array.isArray(jobs.jobs)||
    jobs.jobs.length!==jobs.total_count||jobs.jobs.length>SOURCE_JOBS.length+3)
  fail('partial job page or unknown inventory');
 const required=[...SOURCE_JOBS,AGGREGATOR];
 const allowed=new Set([...required,...OPTIONAL.keys()]);
 const indexed=new Map(),ids=new Set();
 for(const job of jobs.jobs){
  if(!object(job)||!allowed.has(job.name)||!number(job.id)||ids.has(job.id)||
     indexed.has(job.name)||job.run_id!==runId||job.run_attempt!==run.run_attempt||
     job.head_sha!==run.head_sha||job.workflow_name!=='MID-Agent-Quellstand prüfen'||
     job.status!=='completed')fail('foreign, duplicate or stale Source job');
  if(OPTIONAL.has(job.name)){
   if(!OPTIONAL.get(job.name).has(job.conclusion))fail('failed optional gate');
  }else if(job.conclusion!=='success')fail('failed mandatory gate');
  indexed.set(job.name,job);ids.add(job.id);
 }
 for(const name of required)if(!indexed.has(name))fail('missing mandatory '+name);
 if(!Number.isFinite(Date.parse(run.created_at))||
    Date.parse(run.created_at)>now||
    !Number.isFinite(Date.parse(run.updated_at))||
    Date.parse(run.updated_at)>now+60000)fail('untrustworthy run chronology');
 return Object.freeze({
  schema:'mid.protected-source-observation.v1',producerWorkflow:PRODUCER,
  repo:REPO,repoId:REPO_ID,signerSourceSha:signerSha,
  sourceSha:run.head_sha,sourceTreeSha:sourceCommit.tree.sha,
  originalBaseSha:pr.base.sha,sourceRunId:runId,runAttempt:run.run_attempt,
  sourcePrNumber:prNumber,issuedAt:new Date(now).toISOString(),
  expiresAt:new Date(now+86400000).toISOString(),
  releaseAuthorized:false,reuseAuthorized:false,
  mandatoryJobs:required.map(name=>({name,id:indexed.get(name).id,conclusion:'success'})),
  optionalJobs:[...OPTIONAL.keys()].filter(name=>indexed.has(name))
   .map(name=>({name,id:indexed.get(name).id,conclusion:indexed.get(name).conclusion}))
 });
}
export function observeProtectedSource({runId,prNumber,signerSha,now=Date.now(),invoke=execFileSync}){
 if(!number(runId)||!number(prNumber)||!sha(signerSha))fail('invalid dispatch input');
 const api=endpoint=>{
  const raw=invoke('gh',['api','-X','GET','repos/'+REPO+'/'+endpoint],{
   encoding:'utf8',maxBuffer:4194304,stdio:['ignore','pipe','pipe']
  });
  if(typeof raw!=='string'||raw.length>4194304)fail('invalid GitHub response');
  return JSON.parse(raw);
 };
 const runPath='actions/runs/'+runId,prPath='pulls/'+prNumber;
 const run=api(runPath),pr=api(prPath);
 if(!sha(run?.head_sha))fail('invalid Source-run HEAD');
 const jobs=api(runPath+'/jobs?filter=latest&per_page=100');
 const sourceCommit=api('git/commits/'+run.head_sha);
 const main=api('git/ref/heads/main'),stable=api('git/ref/heads/mid-stable');
 const report=inspectProtectedSource({run,pr,jobs,sourceCommit,main,stable},
  {runId,prNumber,signerSha,now});
 const afterRun=api(runPath),afterPr=api(prPath);
 const afterMain=api('git/ref/heads/main'),afterStable=api('git/ref/heads/mid-stable');
 const runIdentity=r=>JSON.stringify([r?.id,r?.run_attempt,r?.head_sha,r?.head_branch,
  r?.status,r?.conclusion,r?.event,r?.path,r?.repository?.id,r?.head_repository?.id]);
 const prIdentity=p=>JSON.stringify([p?.number,p?.state,p?.merged,p?.draft,
  p?.head?.sha,p?.head?.ref,p?.head?.repo?.id,p?.base?.sha,p?.base?.ref,p?.base?.repo?.id]);
 if(runIdentity(run)!==runIdentity(afterRun)||prIdentity(pr)!==prIdentity(afterPr)||
    afterMain?.object?.sha!==signerSha||afterStable?.object?.sha!==signerSha)
  fail('run, PR or protected Stable changed while observing');
 return report;
}
async function main(){
 const e=process.env;
 if(e.GITHUB_ACTIONS!=='true'||e.GITHUB_REPOSITORY!==REPO||
    e.GITHUB_EVENT_NAME!=='workflow_dispatch'||e.GITHUB_REF!=='refs/heads/main'||
    e.GITHUB_REF_PROTECTED!=='true'||!sha(e.GITHUB_SHA))
   fail('not on protected main via manual dispatch');
 if(!/^[1-9][0-9]{0,14}$/.test(e.MID_SOURCE_RUN_ID||'')||
    !/^[1-9][0-9]{0,6}$/.test(e.MID_SOURCE_PR_NUMBER||'')||
    !path.isAbsolute(e.MID_OBSERVATION_OUTPUT||''))
   fail('unsafe dispatch or output path');
 const report=observeProtectedSource({runId:Number(e.MID_SOURCE_RUN_ID),
  prNumber:Number(e.MID_SOURCE_PR_NUMBER),signerSha:e.GITHUB_SHA});
 await writeFile(e.MID_OBSERVATION_OUTPUT,JSON.stringify(report,null,2)+'\n',
  {flag:'wx',mode:0o600});
 console.log('Source PR '+report.sourcePrNumber+', '+report.mandatoryJobs.length+
  ' verified jobs; releaseAuthorized=false; reuseAuthorized=false');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(e=>{console.error(e?.message||'Protected observation failed');process.exitCode=1});
