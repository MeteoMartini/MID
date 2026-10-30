#!/usr/bin/env node
/**
 * Independent, read-only observation of GitHub's *actual* Source PR run/jobs.
 * Qualification evidence only; it is NEVER authorization to reuse tests/builds.
 * The attestation policy and a future protected signer remain separate gates.
 */
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {SOURCE_JOBS,validateTrustedPolicy} from './attested-reuse-policy.mjs';

const AGGREGATOR='Agent-Quellstand vollständig prüfen';
const OPTIONAL=new Map([
 ['RUC +27h Kern, EPS und Gesamtpaket',new Set(['success','skipped'])],
 ['Extremwetterpolygone · echte Browserpixel',new Set(['success','skipped'])]
]);
const OWN_REPO='MeteoMartini/MID';
const OWN_ID=1305110795;
const SOURCE_WORKFLOW='.github/workflows/chatgpt-pr-gate.yml';
const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const integer=x=>Number.isSafeInteger(x)&&x>0;
const abort=why=>{throw Error('Independent Source run evidence rejected: '+why)};
const ok=x=>x?.status==='completed'&&x?.conclusion==='success';

export function inspectSourceRun(policy,run,payload,now=Date.now()){
 validateTrustedPolicy(policy,now);
 if(!isObject(run)||run.id!==policy.runId||run.run_attempt!==policy.attempt||
    run.path!==SOURCE_WORKFLOW||run.event!=='pull_request'||
    run.head_sha!==policy.sourceSha||!ok(run))abort('wrong source run identity/status');
 if(run.repository?.full_name!==OWN_REPO||run.repository?.id!==OWN_ID||
    run.head_repository?.full_name!==OWN_REPO||run.head_repository?.id!==OWN_ID)
   abort('wrong source repository/fork');
 if(typeof run.head_branch!=='string'||!/^(chatgpt|codex)\/v[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+-[a-zA-Z0-9._-]+$/.test(run.head_branch))
   abort('untrusted head branch');
 if(!isObject(payload)||!Number.isSafeInteger(payload.total_count)||
    !Array.isArray(payload.jobs)||payload.total_count!==payload.jobs.length||
    payload.jobs.length<SOURCE_JOBS.length+1||payload.jobs.length>100)
   abort('partial or invalid latest job listing');
 const expected=new Set([...SOURCE_JOBS,AGGREGATOR,...OPTIONAL.keys()]);
 const counts=new Map(),ids=new Set();
 for(const job of payload.jobs){
  if(!isObject(job)||typeof job.name!=='string'||!expected.has(job.name)||
     !integer(job.id)||ids.has(job.id)||job.run_id!==policy.runId||
     job.run_attempt!==policy.attempt||job.head_sha!==policy.sourceSha||
     job.status!=='completed')abort('unexpected/stale/duplicated job');
  if(job.workflow_name!=='MID-Agent-Quellstand prüfen')abort('wrong job workflow');
  ids.add(job.id);
  counts.set(job.name,(counts.get(job.name)||0)+1);
  if(counts.get(job.name)!==1)abort('duplicate required job');
  if(OPTIONAL.has(job.name)){
   if(!OPTIONAL.get(job.name).has(job.conclusion))abort('optional job failed');
  }else if(job.conclusion!=='success')abort('mandatory Source gate not successful: '+job.name);
 }
 for(const name of [...SOURCE_JOBS,AGGREGATOR])
  if(counts.get(name)!==1)abort('missing mandatory Source gate: '+name);
 // This *only* documents observable run/job claims; no actor, signed identity,
 // package SHA, trust boundary or build equivalence has been established.
 return Object.freeze({schema:'mid.source-run-observation.v1',sourceSha:policy.sourceSha,
  runId:policy.runId,attempt:policy.attempt,mandatoryJobs:SOURCE_JOBS.length+1,
  conditionalJobs:[...OPTIONAL.keys()].filter(name=>counts.has(name)).length,
  observedJobIds:[...ids].sort((a,b)=>a-b),
  sourceRunsObserved:true,releaseAuthorized:false,reuseAuthorized:false});
}

/**
 * A merged PR's Actions run may have pull_requests: []. Verify the original
 * immutable PR HEAD and base through a separate authenticated GitHub request.
 * A caller-supplied PR number without verified metadata grants nothing.
 */
export function inspectSourcePullRequest(policy,run,pr,now=Date.now()){
 validateTrustedPolicy(policy,now);
 if(!isObject(pr)||pr.number!==policy.prNumber||pr.draft!==false||
    !(pr.state==='open'||(pr.state==='closed'&&pr.merged===true))||
    !isObject(pr.head)||!isObject(pr.base)||
    pr.head.sha!==policy.sourceSha||pr.head.ref!==run.head_branch||
    pr.base.sha!==policy.baseSha||pr.base.ref!=='main'||
    pr.head.repo?.id!==OWN_ID||pr.head.repo?.full_name!==OWN_REPO||
    pr.base.repo?.id!==OWN_ID||pr.base.repo?.full_name!==OWN_REPO)
  abort('PR identity, original base, head, or merge state mismatch');
 return Object.freeze({prIdentityObserved:true,prNumber:policy.prNumber,baseSha:policy.baseSha});
}
const runIdentity=r=>JSON.stringify([
 r?.id,r?.run_attempt,r?.head_sha,r?.head_branch,r?.status,r?.conclusion,
 r?.path,r?.event,r?.repository?.id,r?.head_repository?.id
]);
const prIdentity=p=>JSON.stringify([
 p?.number,p?.head?.sha,p?.head?.ref,p?.head?.repo?.id,
 p?.base?.sha,p?.base?.ref,p?.base?.repo?.id,p?.draft,p?.state,p?.merged
]);

export function observeSourceThroughGithubCLI(policy,{invoke=execFileSync,now=Date.now()}={}){
 validateTrustedPolicy(policy,now);
 const endpoint=path=>'repos/'+OWN_REPO+'/actions/runs/'+policy.runId+path;
 const api=url=>{
  const raw=invoke('gh',['api','-X','GET',url],{encoding:'utf8',maxBuffer:2097152,stdio:['ignore','pipe','pipe']});
  if(typeof raw!=='string'||raw.length>2097152)abort('invalid GitHub API result');
  return JSON.parse(raw);
 };
 const run=api(endpoint(''));
 const jobs=api(endpoint('/jobs?filter=latest&per_page=100'));
 const prEndpoint='repos/'+OWN_REPO+'/pulls/'+policy.prNumber;
 const pr=api(prEndpoint);
 // A rerun or PR-head/base change during the inspection is always rejected.
 const runAfter=api(endpoint(''));
 const prAfter=api(prEndpoint);
 if(runIdentity(run)!==runIdentity(runAfter)||prIdentity(pr)!==prIdentity(prAfter))
   abort('Source run or PR changed during authenticated inspection');
 const source=inspectSourceRun(policy,run,jobs,now);
 return Object.freeze({...source,...inspectSourcePullRequest(policy,run,pr,now)});
}
async function main(){
 if(process.argv.length!==3)throw Error('Usage: node source-run-observation.mjs trusted-policy.json');
 const {readFile}=await import('node:fs/promises');
 const policy=JSON.parse(await readFile(process.argv[2],'utf8'));
 process.stdout.write(JSON.stringify(observeSourceThroughGithubCLI(policy),null,2)+'\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
 main().catch(()=>{console.error('Independent Source observation failed closed; no reuse authorized.');process.exitCode=1;});
