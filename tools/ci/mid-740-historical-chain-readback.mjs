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
const SOURCE_WORKFLOW='.github/workflows/chatgpt-pr-gate.yml';
const SOURCE_JOB='Source-Kern vollständig prüfen';
const CHECKOUT_STEP='PR-Mergezustand laden';
const CHECK_SOURCE_STEP='MID-Quellstruktur und PR-ZIP-Provenienz prüfen';
const SHA=/^[a-f0-9]{40}$/;
const LOG_LIMIT=5*1024*1024;
const required=[
 SOURCE_JOB,'Determine whether complete original RUC admission is required',
 'Agent-Quellstand vollständig prüfen',...[1,2,3,4].map(i=>'Core-Regression · core-'+i+'/4'),
 'Heavy-Regression · heavy-browser-state ·','Heavy-Regression · heavy-mountain-visual ·',
 'Heavy-Regression · heavy-native-map ·',
 ...[1,2,3].map(i=>'Heavy-Regression · heavy-unified-map · '+i+'/3')];
const optional=['Extremwetterpolygone · echte Browserpixel','RUC +27h Kern, EPS und Gesamtpaket',
 'Admit three genuine DWD 27h original runs, codec and contour (read-only)'];
const reject=reason=>Object.freeze({status:'BLOCKED',reason,sourceGateVerified:false,
 testedSourceBaseVerified:false,
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

// Read the exact checkout command, reported checkout SHA and the original
// event environment from the successful initial steps, before PR code ran.
function testedCheckout(log,spec,checkout,source){
 if(typeof log!=='string'||Buffer.byteLength(log)>LOG_LIMIT)return null;
 const markers={fetch:[],commit:[],command:[],base:[],head:[]};
 const stamp=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z) (.*)$/;
 const refspec=/^\[command\].*\/git .* fetch .* \+([a-f0-9]{40}):refs\/remotes\/pull\/([1-9][0-9]*)\/merge$/;
 const eventField=/^  EXPECTED_PR_(BASE|HEAD)_SHA: (.*)$/;
 for(const [index,line] of log.split(/\r?\n/).entries()){
  const match=stamp.exec(line);
  if(!match)continue;
  const [,time,message]=match;
  const point={index,time:moment(time),value:message};
  const fetch=refspec.exec(message);
  if(fetch)markers.fetch.push({...point,value:fetch[1],pr:Number(fetch[2])});
  if(/^\[command\].*\/git log -1 --format=%H$/.test(message))markers.command.push(point);
  if(SHA.test(message))markers.commit.push(point);
  const event=eventField.exec(message);
  if(event)markers[event[1].toLowerCase()].push({...point,value:event[2]});
 }
 // REST step timestamps have second precision while the runner log has fractions.
 const during=(p,step)=>p.time>=moment(step.started_at)&&p.time<moment(step.completed_at)+1000;
 const commits=markers.commit.filter(p=>during(p,checkout));
 if([markers.fetch,markers.command,commits,markers.head,markers.base].some(x=>x.length!==1))return null;
 const [fetch]=markers.fetch,[command]=markers.command,[commit]=commits,[head]=markers.head,[base]=markers.base;
 if(!during(fetch,checkout)||!during(command,checkout)||!during(head,source)||!during(base,source)||
  fetch.index>=command.index||commit.index!==command.index+1||commit.index>=head.index||
  head.index>=base.index||fetch.pr!==spec.pr||fetch.value!==commit.value||
  head.value!==spec.head||base.value!==spec.base)return null;
 return commit.value;
}

export async function inspectMid740HistoricChain(spec=SPEC,get,getLog){
 if(!spec||typeof get!=='function'||typeof getLog!=='function'||
  ![spec.pr,spec.gate,spec.bot,spec.installer].every(n=>Number.isSafeInteger(n)&&n>0))return reject('BAD_INPUT');
 let data;
 try{
  const names=['pulls/'+spec.pr,...['gate','bot','installer'].map(k=>'actions/runs/'+spec[k]),
   ...['merge','package','installed'].map(k=>'git/commits/'+spec[k]),
   'actions/runs/'+spec.gate+'/attempts/1/jobs?per_page=100&page=1',
   'actions/runs/'+spec.bot+'/jobs?per_page=100&page=1',
   'actions/runs/'+spec.bot+'/artifacts?per_page=100&page=1',
   ...['gateWorkflow','botWorkflow','installerWorkflow'].map(k=>'actions/workflows/'+spec[k])];
  data=await Promise.all(names.map(n=>get(ROOT+n)));
 }catch{return reject('GITHUB_READ_UNAVAILABLE')}
 const [pr,gate,bot,installer,merge,pkg,installed,gateJobs,botJobs,art,gw,bw,iw]=data;
 const registry=(r,id,path)=>r?.id===id&&r.path===path&&r.state==='active';
 if(!registry(gw,spec.gateWorkflow,SOURCE_WORKFLOW)||
  !registry(bw,spec.botWorkflow,'.github/workflows/agent-source-release.yml')||
  !registry(iw,spec.installerWorkflow,'.github/workflows/install-mid.yml'))return reject('REGISTRY_DRIFT');
 if(!runOk(gate,spec.gate,spec.gateWorkflow,SOURCE_WORKFLOW,
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
 const core=gateJobs.jobs.find(j=>j.name===SOURCE_JOB);
 if(!Number.isSafeInteger(core?.id)||core.id<=0||core.run_id!==spec.gate||core.run_attempt!==1||
  core.head_sha!==spec.head||!Array.isArray(core.steps))return reject('SOURCE_CORE_JOB_DRIFT');
 const successfulStep=(name,number)=>{
  const steps=core.steps.filter(step=>step?.name===name||step?.number===number);
  const step=steps[0];
  return steps.length===1&&step.name===name&&step.number===number&&step.status==='completed'&&
   step.conclusion==='success'&&moment(step.started_at)<=moment(step.completed_at)?step:null;
 };
 const checkout=successfulStep(CHECKOUT_STEP,2),source=successfulStep(CHECK_SOURCE_STEP,3);
 if(!checkout||!source||moment(checkout.completed_at)>moment(source.started_at))return reject('SOURCE_CORE_STEP_DRIFT');
 let log;
 try{log=await getLog(ROOT+'actions/jobs/'+core.id+'/logs')}
 catch{return reject('TESTED_CHECKOUT_LOG_UNAVAILABLE')}
 const testedMerge=testedCheckout(log,spec,checkout,source);
 if(!testedMerge)return reject('TESTED_CHECKOUT_LOG_DRIFT');
 let synthetic,testedWorkflow,baseWorkflow;
 try{
  [synthetic,testedWorkflow,baseWorkflow]=await Promise.all([
   get(ROOT+'git/commits/'+testedMerge),
   get(ROOT+'contents/'+SOURCE_WORKFLOW+'?ref='+testedMerge),
   get(ROOT+'contents/'+SOURCE_WORKFLOW+'?ref='+spec.base)
  ]);
 }catch{return reject('TESTED_SOURCE_READ_UNAVAILABLE')}
 if(synthetic?.sha!==testedMerge||synthetic.committer?.name!=='GitHub'||
  synthetic.verification?.verified!==true||synthetic.verification?.reason!=='valid'||
  synthetic.parents?.length!==2||synthetic.parents[0]?.sha!==spec.base||synthetic.parents[1]?.sha!==spec.head||
  !SHA.test(synthetic.tree?.sha??'')||merge.tree?.sha!==synthetic.tree.sha)return reject('TESTED_GIT_MERGE_DRIFT');
 if(testedWorkflow?.path!==SOURCE_WORKFLOW||baseWorkflow?.path!==SOURCE_WORKFLOW||
  testedWorkflow.type!=='file'||baseWorkflow.type!=='file'||
  !SHA.test(testedWorkflow.sha??'')||testedWorkflow.sha!==baseWorkflow.sha)return reject('TESTED_GATE_WORKFLOW_DRIFT');
 return Object.freeze({status:'HISTORIC_LEGACY_LINEAGE_QA_ONLY',sourceGateVerified:true,
  testedSourceBaseVerified:true,testedMergeSha:testedMerge,testedSourceTreeSha:synthetic.tree.sha,
  originalSourceGateJobsVerified:true,gitParentChainVerified:true,
  originalGatePrCount:(gate.pull_requests??[]).length,
  originalBotPrCount:(bot.pull_requests??[]).length,
  producerArtifactCount:0,installerStartedBeforeBotFinished:true,
  upstreamEventLinkVerified:false,producerArtifactVerified:false,
  nativeReviewVerified:false,installerAuthorized:false,
  recoveryAuthorized:false,releaseAuthorized:false});
}

async function readOriginalJobLog(endpoint){
 // The REST endpoint redirects to a temporary Azure or GitHub log URL.
 // Fetch removes Authorization on cross-origin redirects.
 const url=new URL('https://api.github.com/'+endpoint);
 const response=await fetch(url,{headers:{Authorization:'Bearer '+process.env.GH_TOKEN},
  signal:AbortSignal.timeout(30000)});
 if(!response.ok||!response.body)throw Error('JOB_LOG_HTTP');
 const bytes=[];
 let size=0;
 for await(const chunk of response.body){
  size+=chunk.byteLength;
  if(size>LOG_LIMIT)throw Error('JOB_LOG_SIZE');
  bytes.push(chunk);
 }
 return Buffer.concat(bytes).toString('utf8');
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const read=p=>execFileSync('gh',['api','--method','GET',p],{
   encoding:'utf8',timeout:20000,maxBuffer:5*1024*1024,stdio:['ignore','pipe','ignore']});
  const v=await inspectMid740HistoricChain(SPEC,p=>JSON.parse(read(p)),readOriginalJobLog);
  process.stdout.write(JSON.stringify(v)+'\n');
  if(v.status!=='HISTORIC_LEGACY_LINEAGE_QA_ONLY')process.exitCode=1;
 }catch{process.stdout.write(JSON.stringify(reject('CLI_FAILED'))+'\n');process.exitCode=1;}
}
