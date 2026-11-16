#!/usr/bin/env node
/** MID #740: original workflow_run Source-Gate -> privileged producer receipt.
 * PRE-MERGE METADATA ONLY. No upload, no executable untrusted input, no writes.
 * Consumer must independently authenticate actual completed producer/artifact
 * and compare the receipt to original source ZIP bytes and protected Git SHAs.
 */
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assessMid740UpstreamTrigger} from './mid-740-upstream-trigger-readback.mjs';
const R='MeteoMartini/MID',P='repos/'+R+'/',RID=1305110795;
const PRODUCER_WID=358777143,PATH='.github/workflows/agent-source-release.yml';
const NAME='Geprüften Agent-PR automatisch veröffentlichen';
const SHA=/^[a-f0-9]{40}$/;
const validId=n=>Number.isSafeInteger(n)&&n>0;
const deny=reason=>Object.freeze({
 schema:'mid.740.premerge-producer-receipt.v1',
 status:'BLOCKED',reason,upstreamGateMetadataCoherent:false,
 producerRunMetadataCoherent:false,originalArtifactVerified:false,
 trustedProductionReceiptAttested:false,installerAuthorized:false,
 releaseAuthorized:false
});
const sameProducer=(a,b,workflowSha,runId)=>
 a?.id===runId&&b?.id===runId&&
 a.workflow_id===PRODUCER_WID&&b.workflow_id===PRODUCER_WID&&
 a.path===PATH&&b.path===PATH&&a.name===NAME&&b.name===NAME&&
 a.run_attempt===1&&b.run_attempt===1&&
 a.head_sha===workflowSha&&b.head_sha===workflowSha&&
 a.head_branch==='main'&&b.head_branch==='main'&&
 a.event==='workflow_run'&&b.event==='workflow_run'&&
 a.repository?.id===RID&&b.repository?.id===RID&&
 a.head_repository?.id===RID&&b.head_repository?.id===RID&&
 a.status==='in_progress'&&b.status==='in_progress'&&
 a.conclusion==null&&b.conclusion==null;
export async function prepareMid740ProducerGateReceipt({
 event,repository,gateRunId,producerRunId,producerAttempt,producerWorkflowSha
}={},get){
 if(typeof get!=='function'||repository!==R||!validId(gateRunId)||
    !validId(producerRunId)||producerAttempt!==1||
    !SHA.test(producerWorkflowSha??''))
  return deny('UNTRUSTED_PRODUCER_IDENTITY');
 const upstream=await assessMid740UpstreamTrigger({
  event,repository,expectedGateRunId:gateRunId
 },get);
 if(upstream.status!=='UPSTREAM_GATE_METADATA_COHERENT_QA_ONLY')
  return deny('ORIGINAL_UPSTREAM_GATE_UNVERIFIED');
 let producer,registry,gate;
 try{
  [producer,registry,gate]=await Promise.all([
   get(P+'actions/runs/'+producerRunId),
   get(P+'actions/workflows/'+PRODUCER_WID),
   get(P+'actions/runs/'+gateRunId)
  ]);
 }catch{return deny('PRODUCER_REGISTRY_OR_GATE_READ_UNAVAILABLE')}
 if(registry?.id!==PRODUCER_WID||registry.path!==PATH||
    registry.name!==NAME||registry.state!=='active'||
    !sameProducer(producer,producer,producerWorkflowSha,producerRunId))
  return deny('PRODUCER_RUN_OR_REGISTRY_DRIFT');
 const gateFinished=Date.parse(gate?.updated_at??'');
 const producerCreated=Date.parse(producer.created_at??'');
 const producerStarted=Date.parse(producer.run_started_at??'');
 if(![gateFinished,producerCreated,producerStarted].every(Number.isFinite)||
    producerCreated<gateFinished||producerStarted<producerCreated)
  return deny('PRODUCER_STARTED_BEFORE_GATE_FINISHED');
 let again,main,stable,pr;
 try{
  [again,main,stable,pr]=await Promise.all([
   get(P+'actions/runs/'+producerRunId),
   get(P+'git/ref/heads/main'),get(P+'git/ref/heads/mid-stable'),
   get(P+'pulls/'+upstream.prNumber)
  ]);
 }catch{return deny('FINAL_PRODUCER_READBACK_UNAVAILABLE')}
 if(!sameProducer(producer,again,producerWorkflowSha,producerRunId)||
    again.run_started_at!==producer.run_started_at||
    again.created_at!==producer.created_at||
    main?.object?.sha!==upstream.sourceBaseSha||
    stable?.object?.sha!==upstream.sourceBaseSha||
    pr?.number!==upstream.prNumber||pr.state!=='open'||pr.draft!==false||
    pr.base?.ref!=='main'||pr.base.sha!==upstream.sourceBaseSha||
    pr.head?.sha!==upstream.sourceHeadSha||
    pr.head?.repo?.id!==RID)
  return deny('FINAL_PRODUCER_OR_SOURCE_RACE');
 return Object.freeze({
  schema:'mid.740.premerge-producer-receipt.v1',
  status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:upstream.sourceGateRunId,
  sourceGateAttempt:upstream.sourceGateAttempt,
  sourceHeadSha:upstream.sourceHeadSha,
  sourceBaseSha:upstream.sourceBaseSha,
  prNumber:upstream.prNumber,
  producerRunId,producerAttempt,producerWorkflowSha,
  upstreamGateMetadataCoherent:true,producerRunMetadataCoherent:true,
  // Recorded BEFORE merge, ZIP upload and producer completion.
  originalArtifactVerified:false,trustedProductionReceiptAttested:false,
  installerAuthorized:false,releaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const e=process.env;
  if(e.GITHUB_EVENT_NAME!=='workflow_run'||e.GITHUB_REPOSITORY!==R||
     !e.GITHUB_EVENT_PATH||!/^[1-9][0-9]*$/.test(e.MID_EXPECTED_GATE_RUN_ID??'')||
     !/^[1-9][0-9]*$/.test(e.GITHUB_RUN_ID??'')||
     e.GITHUB_RUN_ATTEMPT!=='1'||!SHA.test(e.GITHUB_SHA??''))
   throw Error('TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED');
  const event=JSON.parse(readFileSync(e.GITHUB_EVENT_PATH,'utf8'));
  const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET',path],{
   encoding:'utf8',timeout:25000,maxBuffer:6*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const out=await prepareMid740ProducerGateReceipt({
   event,repository:e.GITHUB_REPOSITORY,
   gateRunId:Number(e.MID_EXPECTED_GATE_RUN_ID),
   producerRunId:Number(e.GITHUB_RUN_ID),
   producerAttempt:Number(e.GITHUB_RUN_ATTEMPT),
   producerWorkflowSha:e.GITHUB_SHA
  },get);
  process.stdout.write(JSON.stringify(out)+'\n');
  if(out.status!=='PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY')
   process.exitCode=1;
 }catch(error){
  process.stdout.write(JSON.stringify(deny(
   error?.message==='TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED'?
    'TRUSTED_WORKFLOW_RUN_CONTEXT_REQUIRED':'PRODUCER_RECEIPT_UNAVAILABLE'))+'\n');
  process.exitCode=1;
 }
}