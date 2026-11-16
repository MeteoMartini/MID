#!/usr/bin/env node
/** #740: historical GitHub REST chain; never infer a workflow_run trigger from timestamps. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
export const SPEC=Object.freeze({pr:847,gate:43874951889,bot:43876424579,installer:43876511311,
 gateWorkflow:358449552,botWorkflow:358777143,installerWorkflow:315863138,
 head:'e39cf853ab0e893f08012c3b3ebe7be1b96d658b',
 base:'ccd1c0f60d67925aa01dd8d946b490fde4142709',
 merge:'6985ec5238ce9d71bff71b390968949b30d25434',
 package:'1f01ec96ae54e664097899f2a7d480d505334950',
 installed:'a78465b655d25cafc9ecc0390080694cb7aca957',
 branch:'chatgpt/v0.9.85.486-lc20-timeline-14d-qa'});
const ROOT='repos/MeteoMartini/MID/',RID=1305110795;
const required=[
 'Source-Kern vollständig prüfen','Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
const reject=reason=>Object.freeze({status:'BLOCKED',reason,sourceGateVerified:false,
 upstreamEventLinkVerified:false,producerArtifactVerified:false,
 installerAuthorized:false,recoveryAuthorized:false,releaseAuthorized:false});
const runOk=(r,id,workflow,path,ev,sha,branch)=>r?.id===id&&r.workflow_id===workflow&&
 r.path===path&&r.event===ev&&r.head_sha===sha&&r.head_branch===branch&&
 r.repository?.id===RID&&r.head_repository?.id===RID&&r.run_attempt===1&&
 r.status==='completed'&&r.conclusion==='success';
const ancestry=(r,sha,parent)=>r?.sha===sha&&r.parents?.length===1&&r.parents[0].sha===parent;
const jobsOk=(r,req,opt=[])=>{
 if(!Array.isArray(r?.jobs)||r.jobs.length!==r.total_count||
    r.total_count!==req.length+opt.length)return false;
 const map=new Map(r.jobs.map(j=>[j.name,j]));
 if(map.size!==r.jobs.length)return false;
 return req.every(n=>map.get(n)?.conclusion==='success'&&map.get(n)?.status==='completed')&&
  opt.every(n=>['success','skipped'].includes(map.get(n)?.conclusion)&&map.get(n)?.status==='completed');
};
const moment=s=>typeof s==='string'?Date.parse(s):NaN;
export async function inspectMid740HistoricChain(spec=SPEC,get){
 if(!spec||typeof get!=='function'||![spec.pr,spec.gate,spec.bot,spec.installer].every(n=>Number.isSafeInteger(n)&&n>0))return reject('BAD_INPUT');
 let data;
 try{
  const names=['pulls/'+spec.pr,...['gate','bot','installer'].map(k=>'actions/runs/'+spec[k]),
   ...['merge','package','installed'].map(k=>'git/commits/'+spec[k]),
   'actions/runs/'+spec.gate+'/jobs?per_page=100&page=1',
   'actions/runs/'+spec.bot+'/jobs?per_page=100&page=1',
   'actions/runs/'+spec.bot+'/artifacts?per_page=100&page=1',
   ...['gateWorkflow','botWorkflow','installerWorkflow'].map(k=>'actions/workflows/'+spec[k])];
  data=await Promise.all(names.map(n=>get(ROOT+n)));
 }catch{return reject('GITHUB_READ_UNAVAILABLE')}
 const [pr,gate,bot,installer,merge,pkg,installed,gateJobs,botJobs,art,gw,bw,iw]=data;
 const registry=(r,id,path)=>r?.id===id&&r.path===path&&r.state==='active';
 if(!registry(gw,spec.gateWorkflow,'.github/workflows/chatgpt-pr-gate.yml')||
  !registry(bw,spec.botWorkflow,'.github/workflows/agent-source-release.yml')||
  !registry(iw,spec.installerWorkflow,'.github/workflows/install-mid.yml'))return reject('REGISTRY_DRIFT');
 if(!runOk(gate,spec.gate,spec.gateWorkflow,'.github/workflows/chatgpt-pr-gate.yml',
  'pull_request',spec.head,spec.branch)||
  !runOk(bot,spec.bot,spec.botWorkflow,'.github/workflows/agent-source-release.yml',
  'workflow_run',spec.base,'main')||
  !runOk(installer,spec.installer,spec.installerWorkflow,'.github/workflows/install-mid.yml',
  'workflow_dispatch',spec.package,'main'))return reject('RUN_DRIFT');
 if(pr?.number!==spec.pr||pr.merged!==true||pr.merge_commit_sha!==spec.merge||
  pr.head?.sha!==spec.head||pr.head?.ref!==spec.branch||pr.head?.repo?.id!==RID||
  pr.base?.sha!==spec.base)return reject('PR_DRIFT');
 if(!ancestry(merge,spec.merge,spec.base)||!ancestry(pkg,spec.package,spec.merge)||
  !ancestry(installed,spec.installed,spec.package))return reject('GIT_PARENT_DRIFT');
 if(!jobsOk(gateJobs,required,optional)||!jobsOk(botJobs,['PR mergen, Release-ZIP erzeugen und Installer starten']))return reject('JOB_ROSTER_INCOMPLETE');
 if(art?.total_count!==0||!Array.isArray(art.artifacts)||art.artifacts.length!==0)return reject('LEGACY_ARTIFACT_INVENTORY_DRIFT');
 const order=[moment(gate.updated_at),moment(bot.created_at),moment(pr.merged_at),
  moment(installer.created_at),moment(bot.updated_at),moment(installer.updated_at)];
 if(!order.every(Number.isFinite)||order.some((t,i)=>i>0&&t<order[i-1]))return reject('CHRONOLOGY_DRIFT');
 return Object.freeze({status:'HISTORIC_LEGACY_LINEAGE_QA_ONLY',sourceGateVerified:true,
  originalSourceGateJobsVerified:true,gitParentChainVerified:true,
  originalGatePrCount:(gate.pull_requests??[]).length,
  originalBotPrCount:(bot.pull_requests??[]).length,
  producerArtifactCount:0,installerStartedBeforeBotFinished:true,
  upstreamEventLinkVerified:false,producerArtifactVerified:false,
  nativeReviewVerified:false,installerAuthorized:false,
  recoveryAuthorized:false,releaseAuthorized:false});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const get=p=>JSON.parse(execFileSync('gh',['api','--method','GET',p],{
   encoding:'utf8',timeout:20000,maxBuffer:5*1024*1024,stdio:['ignore','pipe','ignore']}));
  const v=await inspectMid740HistoricChain(SPEC,get);
  process.stdout.write(JSON.stringify(v)+'\n');
  if(v.status!=='HISTORIC_LEGACY_LINEAGE_QA_ONLY')process.exitCode=1;
 }catch{process.stdout.write(JSON.stringify(reject('CLI_FAILED'))+'\n');process.exitCode=1;}
}