#!/usr/bin/env node
/** MID #740: independently read original .488 producer/installer history.
 * A successful legacy installer never attests a completed producer artifact.
 * Read-only QA. Never executes external code or permits any release action.
 */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const SPEC=Object.freeze({
 producer:44121439604,producerWorkflow:358777143,producerJob:134173572538,
 installer:44121560818,installerWorkflow:315863138,
 source:'9dffb1abc7a2b158eb7f4255e34fb1dead5b6de9',
 package:'c086e51c2bad1e4958651111eb5fa01a808179fa',
 installed:'9fe4dfbcdfd5a1f8fec55efa868e22110a612953',
 trustedWorkflowSha:'ee70a92ae6ed83d3fa46445f4941e3db8b8675d4',
 repoId:1305110795
});
const ROOT='repos/MeteoMartini/MID/';
const deny=reason=>Object.freeze({
 schema:'mid.740.legacy-producer-gap.v1',status:'BLOCKED',reason,
 originalProducerArtifactAttested:false,independentPreInstallerVerified:false,
 nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false
});
const stamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?Date.parse(s):NaN;
const runKey=r=>JSON.stringify([r?.id,r?.workflow_id,r?.run_attempt,r?.path,
 r?.event,r?.head_sha,r?.head_branch,r?.status,r?.conclusion,
 r?.run_started_at,r?.updated_at,r?.repository?.id,r?.head_repository?.id]);
const listKey=j=>JSON.stringify([j?.total_count,j?.jobs?.map(x=>[
 x.id,x.name,x.run_id,x.status,x.conclusion,
 x.steps?.map(s=>[s.number,s.name,s.status,s.conclusion])])]);
const shaCommit=(c,sha,parent)=>c?.sha===sha&&
 c.parents?.length===1&&c.parents[0]?.sha===parent;
export async function inspectMid740LegacyProducerGap(get){
 if(typeof get!=='function')return deny('MISSING_ORIGINAL_GITHUB_READER');
 const read=p=>get(ROOT+p);
 const snapshot=async()=>{
  const [run,installer,artifacts,joblist,src,pkg,installed,
   registry,installRegistry]=await Promise.all([
    read('actions/runs/'+SPEC.producer),
    read('actions/runs/'+SPEC.installer),
    read('actions/runs/'+SPEC.producer+'/artifacts?per_page=100&page=1'),
    read('actions/runs/'+SPEC.producer+'/attempts/1/jobs?per_page=100'),
    read('git/commits/'+SPEC.source),
    read('git/commits/'+SPEC.package),
    read('git/commits/'+SPEC.installed),
    read('actions/workflows/'+SPEC.producerWorkflow),
    read('actions/workflows/'+SPEC.installerWorkflow)
   ]);
  return {run,installer,artifacts,joblist,src,pkg,installed,
   registry,installRegistry};
 };
 let before,after;
 try{before=await snapshot()}catch{return deny('ORIGINAL_GITHUB_SNAPSHOT_UNAVAILABLE')}
 const {run,installer,artifacts,joblist,src,pkg,installed,registry,installRegistry}=before;
 const runOK=(r,id,wid,path,event,head)=>
  r?.id===id&&r.workflow_id===wid&&r.run_attempt===1&&
  r.path===path&&r.event===event&&r.head_sha===head&&
  r.head_branch==='main'&&r.status==='completed'&&r.conclusion==='success'&&
  r.repository?.id===SPEC.repoId&&r.head_repository?.id===SPEC.repoId;
 if(!runOK(run,SPEC.producer,SPEC.producerWorkflow,
   '.github/workflows/agent-source-release.yml','workflow_run',SPEC.trustedWorkflowSha)||
    !runOK(installer,SPEC.installer,SPEC.installerWorkflow,
   '.github/workflows/install-mid.yml','workflow_dispatch',SPEC.package))
  return deny('ORIGINAL_PRODUCER_OR_INSTALLER_IDENTITY_DRIFT');
 if(registry?.id!==SPEC.producerWorkflow||
    registry.path!=='.github/workflows/agent-source-release.yml'||
    registry.state!=='active'||installRegistry?.id!==SPEC.installerWorkflow||
    installRegistry.path!=='.github/workflows/install-mid.yml'||
    installRegistry.state!=='active')
  return deny('ORIGINAL_WORKFLOW_REGISTRY_DRIFT');
 if(!shaCommit(src,SPEC.source,SPEC.trustedWorkflowSha)||
    !shaCommit(pkg,SPEC.package,SPEC.source)||
    !shaCommit(installed,SPEC.installed,SPEC.package))
  return deny('ORIGINAL_SOURCE_PACKAGE_INSTALLER_GIT_LINEAGE_DRIFT');
 if(artifacts?.total_count!==0||!Array.isArray(artifacts.artifacts)||
    artifacts.artifacts.length!==0)
  return deny('ORIGINAL_PRODUCER_ARTIFACT_INVENTORY_CHANGED');
 const jobs=joblist?.jobs;
 if(joblist?.total_count!==1||!Array.isArray(jobs)||jobs.length!==1||
    jobs[0]?.id!==SPEC.producerJob||jobs[0]?.run_id!==SPEC.producer||
    jobs[0]?.status!=='completed'||jobs[0]?.conclusion!=='success'||
    jobs[0]?.name!=='PR mergen, Release-ZIP erzeugen und Installer starten'||
    !Array.isArray(jobs[0]?.steps))
  return deny('ORIGINAL_PRODUCER_JOB_DRIFT');
 const steps=jobs[0].steps,names=[
  'Geprüften Agent-PR automatisch zusammenführen',
  'Release-ZIP aus dem aktuellen main-Quellstand erzeugen und committen',
  'Bewährten MID-Installer explizit starten'
 ];
 const matched=names.map(name=>steps.filter(s=>s?.name===name));
 if(matched.some(g=>g.length!==1||g[0].status!=='completed'||
     g[0].conclusion!=='success')||
    !(matched[0][0].number<matched[1][0].number&&
      matched[1][0].number<matched[2][0].number)||
    steps.some(s=>[
     'SHA-gebundenes Original-ZIP für #740 bereitstellen',
     'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen'
    ].includes(s.name)))
  return deny('ORIGINAL_PRODUCER_STEP_HISTORY_CHANGED');
 const start=stamp(run.run_started_at),finish=stamp(run.updated_at),
  installerStart=stamp(installer.run_started_at),
  installerEnd=stamp(installer.updated_at);
 if(![start,finish,installerStart,installerEnd].every(Number.isFinite)||
    !(start<=installerStart&&installerStart<finish&&
      finish<=installerEnd))
  return deny('ORIGINAL_PRODUCER_INSTALLER_CHRONOLOGY_DRIFT');
 try{after=await snapshot()}catch{return deny('SECOND_ORIGINAL_GITHUB_SNAPSHOT_UNAVAILABLE')}
 const same=a=>JSON.stringify([runKey(a.run),runKey(a.installer),
  a.artifacts?.total_count,a.artifacts?.artifacts,
  listKey(a.joblist),a.src,a.pkg,a.installed,
  a.registry?.id,a.registry?.path,a.registry?.state,
  a.installRegistry?.id,a.installRegistry?.path,a.installRegistry?.state]);
 if(same(before)!==same(after))return deny('ORIGINAL_RELEASE_CHAIN_RACE');
 return Object.freeze({
  schema:'mid.740.legacy-producer-gap.v1',
  status:'ORIGINAL_488_PRODUCER_ARTIFACT_GAP_QA_ONLY',
  producerRunId:SPEC.producer,installerRunId:SPEC.installer,
  sourceMergeSha:SPEC.source,packageSha:SPEC.package,installedSha:SPEC.installed,
  originalProducerArtifactCount:0,
  originalProducerJobAndGitLineageVerified:true,
  installerStartedBeforeProducerCompleted:true,
  originalProducerArtifactAttested:false,independentPreInstallerVerified:false,
  nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.argv.length!==2||process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||
     process.env.GITHUB_EVENT_NAME!=='pull_request')
   throw Error('UNTRUSTED_READ_ONLY_CONTEXT');
  const get=p=>JSON.parse(execFileSync('gh',['api','--method','GET',p],{
   encoding:'utf8',timeout:30000,maxBuffer:4*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const proof=await inspectMid740LegacyProducerGap(get);
  process.stdout.write(JSON.stringify(proof)+'\n');
  if(proof.status!=='ORIGINAL_488_PRODUCER_ARTIFACT_GAP_QA_ONLY')
   process.exitCode=1;
 }catch{
  process.stdout.write(JSON.stringify(deny('ORIGINAL_GITHUB_READBACK_FAILED'))+'\n');
  process.exitCode=1;
 }
}
