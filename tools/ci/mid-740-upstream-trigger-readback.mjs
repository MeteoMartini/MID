#!/usr/bin/env node
/** #740: GitHub workflow_run upstream Source-Gate identity, read-only QA.
 * Never authorizes merge, installer or release, even on successful metadata.
 * The trusted GITHUB_EVENT_PATH may be used ONLY inside a genuine workflow_run.
 */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const R='MeteoMartini/MID',ID=1305110795,P='repos/'+R+'/';
const WID=358449552,WP='.github/workflows/chatgpt-pr-gate.yml',WN='MID ChatGPT/Codex Source-PR Gate';
const SHA=/^[0-9a-f]{40}$/;
const BRANCH=/^(?:chatgpt|codex)\/[^/]+(?:\/[^/]+)*$/;
const core=['Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
const positive=n=>Number.isSafeInteger(n)&&n>0;
const blocked=reason=>Object.freeze({schema:'mid.740.upstream-trigger-qa.v1',status:'BLOCKED',reason,
 upstreamGateMetadataCoherent:false,sourceGateRosterVerified:false,
 trustedProductionTriggerAuthenticated:false,sourceBotProducerVerified:false,
 nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false});
const reviewRun=x=>x?.id&&positive(x.id)&&x.workflow_id===WID&&x.path===WP&&x.name===WN&&
 x.event==='pull_request'&&x.status==='completed'&&x.conclusion==='success'&&
 x.run_attempt===1&&SHA.test(x.head_sha??'')&&BRANCH.test(x.head_branch??'')&&
 x.repository?.id===ID&&x.head_repository?.id===ID;
const jobsOk=x=>{
 if(!Array.isArray(x?.jobs)||!Number.isSafeInteger(x.total_count)||
   x.total_count!==x.jobs.length||x.total_count<core.length||x.total_count>100)return false;
 const names=new Map();
 for(const j of x.jobs){
  if(!positive(j?.id)||typeof j.name!=='string'||names.has(j.name)||
     j.status!=='completed'||!['success','skipped'].includes(j.conclusion))return false;
  names.set(j.name,j.conclusion);
 }
 if(!core.every(n=>names.get(n)==='success'))return false;
 if(!optional.every(n=>['success','skipped',undefined].includes(names.get(n))))return false;
 // Any new (unknown) job must be successful; skip is allowed only for known optional jobs.
 return [...names].every(([name,state])=>state==='success'||optional.includes(name));
};
const branchSha=(x,branch,sha)=>x?.ref==='refs/heads/'+branch&&
 x.object?.type==='commit'&&x.object.sha===sha;
const sameRun=(a,b)=>reviewRun(b)&&a.id===b.id&&
 a.workflow_id===b.workflow_id&&a.run_attempt===b.run_attempt&&
 a.head_sha===b.head_sha&&a.head_branch===b.head_branch&&
 a.path===b.path&&a.conclusion===b.conclusion;
const matchPr=(p,g,base)=>p?.number>0&&Number.isSafeInteger(p.number)&&
 p.state==='open'&&p.draft===false&&p.merged_at==null&&
 p.base?.ref==='main'&&p.base.sha===base&&
 p.head?.repo?.id===ID&&p.head.repo.full_name===R&&
 p.head.sha===g.head_sha&&p.head.ref===g.head_branch;
const collectPrs=async(get)=>{
 const seen=[],ids=new Set();
 for(let page=1;page<=10;page++){
  const r=await get(P+'pulls?state=open&base=main&per_page=100&page='+page);
  if(!Array.isArray(r)||r.length>100)return null;
  for(const p of r){if(!positive(p?.number)||ids.has(p.number))return null;
   ids.add(p.number);seen.push(p);}
  if(r.length<100)return seen;
 }
 return null; // no reliance on a truncated open-PR inventory
};
export async function assessMid740UpstreamTrigger({event,repository,expectedGateRunId}={},get){
 if(typeof get!=='function'||!positive(expectedGateRunId)||
    repository!==R||event?.action!=='completed'||event.repository?.id!==ID||
    event.repository.full_name!==R)return blocked('UNTRUSTED_WORKFLOW_RUN_EVENT');
 const e=event.workflow_run;
 if(!reviewRun(e)||e.id!==expectedGateRunId)return blocked('EVENT_GATE_IDENTITY_DRIFT');
 let run,registry,main,stable,inventory,prs;
 try{
  [run,registry,main,stable,inventory,prs]=await Promise.all([
   get(P+'actions/runs/'+e.id),get(P+'actions/workflows/'+WID),
   get(P+'git/ref/heads/main'),get(P+'git/ref/heads/mid-stable'),
   get(P+'actions/runs/'+e.id+'/jobs?per_page=100&page=1'),collectPrs(get)
  ]);
 }catch{return blocked('GITHUB_READ_UNAVAILABLE')}
 if(!sameRun(e,run)||registry?.id!==WID||registry.path!==WP||
    registry.name!==WN||registry.state!=='active')return blocked('GATE_REGISTRY_RUN_DRIFT');
 if(!jobsOk(inventory))return blocked('REQUIRED_GATE_JOBS_NOT_VERIFIED');
 if(!SHA.test(main?.object?.sha??'')||
    !branchSha(main,'main',stable?.object?.sha))return blocked('PROTECTED_SOURCE_DRIFT');
 if(!branchSha(stable,'mid-stable',main.object.sha))
  return blocked('PROTECTED_STABLE_DRIFT');
 if(!Array.isArray(prs))return blocked('PR_INVENTORY_INCOMPLETE');
 const matches=prs.filter(p=>matchPr(p,e,main.object.sha));
 if(matches.length!==1)return blocked('PR_NOT_UNIQUELY_AUTHENTICATED');
 const pr=matches[0];
 // A simultaneous PR update or late gate rerun invalidates the event pairing.
 let afterPr,afterRun,afterMain,afterStable;
 try{
  [afterPr,afterRun,afterMain,afterStable]=await Promise.all([
   get(P+'pulls/'+pr.number),get(P+'actions/runs/'+e.id),
   get(P+'git/ref/heads/main'),get(P+'git/ref/heads/mid-stable')
  ]);
 }catch{return blocked('FINAL_READBACK_UNAVAILABLE')}
 if(afterPr?.number!==pr.number||!matchPr(afterPr,e,main.object.sha)||!sameRun(e,afterRun)||
    !branchSha(afterMain,'main',main.object.sha)||
    !branchSha(afterStable,'mid-stable',main.object.sha))
  return blocked('FINAL_SOURCE_GATE_RACE');
 return Object.freeze({schema:'mid.740.upstream-trigger-qa.v1',status:'UPSTREAM_GATE_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:e.id,sourceGateAttempt:e.run_attempt,sourceHeadSha:e.head_sha,
  sourceBaseSha:main.object.sha,prNumber:pr.number,upstreamGateMetadataCoherent:true,
  sourceGateRosterVerified:true,trustedProductionTriggerAuthenticated:false,
  sourceBotProducerVerified:false,nativeReviewEnforced:false,
  installerAuthorized:false,releaseAuthorized:false});
}
// The workflow_run context is a hard requirement of the CLI. There is no
// fallback from PR-supplied metadata or a guessed GitHub REST run identity.
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const env=process.env;
  if(env.GITHUB_EVENT_NAME!=='workflow_run'||env.GITHUB_REPOSITORY!==R||
     !env.GITHUB_EVENT_PATH||!/^[1-9][0-9]*$/.test(env.MID_EXPECTED_GATE_RUN_ID??''))
   throw Error('TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED');
  const event=JSON.parse(readFileSync(env.GITHUB_EVENT_PATH,'utf8'));
  const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET',path],{
   encoding:'utf8',timeout:20000,maxBuffer:5*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const result=await assessMid740UpstreamTrigger({
   event,repository:env.GITHUB_REPOSITORY,
   expectedGateRunId:Number(env.MID_EXPECTED_GATE_RUN_ID)},get);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='UPSTREAM_GATE_METADATA_COHERENT_QA_ONLY')process.exitCode=1;
 }catch(e){
  process.stdout.write(JSON.stringify(blocked(
   e?.message==='TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED'?
    'TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED':'TRIGGER_READBACK_UNAVAILABLE'))+'\n');
  process.exitCode=1;
 }
}