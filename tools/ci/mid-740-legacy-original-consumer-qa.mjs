#!/usr/bin/env node
/** MID #740: original legacy Producer -> original ZIP artifact -> Installer
 * post-hoc verification. READ-ONLY QA. Never merges, dispatches, promotes,
 * writes Git refs, alters rulesets, or grants installer/release authority.
 *
 * Original bytes are fetched from authenticated GitHub REST Artifact metadata,
 * not supplied by a PR, an LLM, or an external manifest. The ZIP is never
 * executed. The full source-gate/PR/merge/installer causality is independently
 * read back after cryptographic ZIP and Git-blob checks.
 */
import {execFileSync} from 'node:child_process';
import {existsSync,lstatSync,mkdtempSync,readFileSync,realpathSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectMid740GitHubReadback} from './mid-740-github-artifact-readback.mjs';
import {downloadMid740Envelope} from './mid-740-download-artifact-envelope.mjs';
import {assessMid740PostProducerCausality} from './mid-740-postproducer-causality-qa.mjs';

const REPO='MeteoMartini/MID',ROOT='repos/'+REPO+'/',SHA=/^[0-9a-f]{40}$/;
const DIGEST=/^[0-9a-f]{64}$/;
const positive=x=>Number.isSafeInteger(x)&&x>0;
const fail=code=>{throw Error('MID_740_ORIGINAL_CONSUMER_'+code)};
const stepNames=[
 'Original-Source-Gate-Receipt für #740 vor Merge sichern (QA)',
 'Geprüften Agent-PR automatisch zusammenführen',
 'SHA-gebundenes Original-ZIP für #740 bereitstellen',
 'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen',
 'Bewährten MID-Installer explizit starten'
];
const reportIdentity=x=>JSON.stringify([
 x?.producerRun?.id,x?.producerRun?.run_attempt,x?.producerRun?.workflow_id,
 x?.producerRun?.head_sha,x?.producerRun?.status,x?.producerRun?.conclusion,
 x?.producerRun?.updated_at,x?.artifact?.id,x?.artifact?.name,
 x?.artifact?.digest,x?.artifact?.size_in_bytes,
 x?.artifact?.created_at,x?.artifact?.updated_at,
 x?.producerArtifacts?.map(a=>[a.id,a.name,a.digest,a.size_in_bytes])
]);
function safeNewOutput(path){
 if(typeof path!=='string'||!path)fail('OUTPUT_PATH_ABSENT');
 const output=resolve(path),parent=dirname(output);
 if(!existsSync(parent)||lstatSync(parent).isSymbolicLink()||
    realpathSync(parent)!==parent||
    existsSync(output))fail('UNSAFE_OR_EXISTING_OUTPUT');
 return {output,parent};
}
const stepStamp=step=>JSON.stringify([step?.number,step?.name,step?.status,
 step?.conclusion,step?.started_at,step?.completed_at]);
async function originalSteps(get,runId,trustedWorkflowSha){
 const list=await get(ROOT+'actions/runs/'+runId+'/attempts/1/jobs?per_page=100');
 const job=list?.jobs?.[0];
 if(list?.total_count!==1||list.jobs?.length!==1||
    !positive(job?.id)||job.run_id!==runId||job.run_attempt!==1||
    job.head_sha!==trustedWorkflowSha||job.status!=='completed'||
    job.conclusion!=='success'||!Array.isArray(job.steps))
   fail('ORIGINAL_PRODUCER_JOB_UNVERIFIED');
 const indexes=new Set();
 for(const step of job.steps){
  if(!positive(step?.number)||indexes.has(step.number)||
     typeof step.name!=='string')fail('AMBIGUOUS_JOB_STEPS');
  indexes.add(step.number);
 }
 const found=stepNames.map(name=>{
  const group=job.steps.filter(s=>s.name===name);
  if(group.length!==1||group[0].status!=='completed'||
     group[0].conclusion!=='success')fail('ORIGINAL_PREMERGE_UPLOAD_OR_INSTALLER_STEP_UNVERIFIED');
  return group[0];
 });
 const times=found.flatMap(s=>[Date.parse(s.started_at??''),
  Date.parse(s.completed_at??'')]);
 if(found.some((s,i)=>i>0&&s.number<=found[i-1].number)||
    times.some(t=>!Number.isFinite(t))||
    times.some((t,i)=>i>0&&t<times[i-1]))
  fail('ORIGINAL_PRODUCER_STEP_CHRONOLOGY_DRIFT');
 return JSON.stringify([job.id,job.run_id,job.run_attempt,job.head_sha,
  job.status,job.conclusion,job.steps.map(stepStamp)]);
}
/**
 * The legacy Installer must ALREADY have completed successfully; this cannot
 * be used as the pre-Installer cutover gate. It proves only a post-hoc QA chain.
 *
 * The default dependencies are actual GitHub REST, SHA256-checked download,
 * original Git objects and trusted Python verifiers. Injected dependencies are
 * intended ONLY for offline adversarial unit tests, never for authorization.
 */
export async function verifyMid740OriginalLegacyPostinstaller({
 runId,artifactId,sourceMergeSha,packageCommitSha,trustedWorkflowSha,
 installerRunId,repository,envelopeOutput,token
}={},{
 get,fetcher=fetch,python=execFileSync,
 downloader=downloadMid740Envelope,readback=collectMid740GitHubReadback,
 causality=assessMid740PostProducerCausality
}={}){
 if(!positive(runId)||!positive(artifactId)||!positive(installerRunId)||
    ![sourceMergeSha,packageCommitSha,trustedWorkflowSha].every(x=>SHA.test(x??''))||
    sourceMergeSha===packageCommitSha||
    typeof get!=='function'||typeof fetcher!=='function'||
    typeof python!=='function'||typeof downloader!=='function'||
    typeof readback!=='function'||typeof causality!=='function')
  fail('BAD_SOURCE_OR_TOOLS');
 const repo=resolve(repository??'.');
 if(!existsSync(repo)||lstatSync(repo).isSymbolicLink()||
    realpathSync(repo)!==repo)fail('UNTRUSTED_SOURCE_CHECKOUT');
 let checkout;
 try{checkout=execFileSync('git',['rev-parse','HEAD'],
  {cwd:repo,encoding:'utf8',timeout:20000,stdio:['ignore','pipe','ignore']}).trim()}
 catch{fail('UNREADABLE_TRUSTED_SOURCE_SHA')}
 if(checkout!==trustedWorkflowSha)fail('WORKFLOW_CODE_CHECKOUT_SHA_DRIFT');
 const {output:envelope,parent}=safeNewOutput(envelopeOutput);
 const legacy={packageCommitSha,producerRunAttempt:1,installerRunId};
 const restArgs={runId,artifactId,sourceMergeSha,trustedWorkflowSha,legacy};
 const before=await readback(restArgs,get);
 if(before?.metadataReadbackConsistent!==true||
    before?.producerInventoryComplete!==true||
    before.legacyInstallerRunId!==installerRunId||
    before.legacyPackageCommitSha!==packageCommitSha||
    before.producerRun?.id!==runId||before.artifact?.id!==artifactId||
    before.releaseAuthorized!==false)
  fail('ORIGINAL_LEGACY_GITHUB_READBACK_UNVERIFIED');
 const initialFingerprint=reportIdentity(before);
 const beforeJob=await originalSteps(get,runId,trustedWorkflowSha);
 let staging,downloaded=false,success=false;
 try{
  const artifact=before.artifact;
  const transfer=await downloader({artifact,output:envelope,token},fetcher);
  downloaded=true;
  if(transfer?.artifactId!==artifactId||
     transfer.envelopeSha256!==artifact.digest?.slice(7)||
     transfer.downloadedEnvelopeBytesVerified!==true||
     transfer.installerAuthorized!==false||transfer.releaseAuthorized!==false)
   fail('ORIGINAL_DOWNLOAD_DIGEST_UNVERIFIED');
  const verifier=join(repo,'tools/ci/mid-740-verify-artifact-envelope.py');
  const args=['--envelope',envelope,
   '--expected-envelope-sha256',transfer.envelopeSha256];
  const call=(more)=> {
   try{return JSON.parse(python('python3',[verifier,...args,...more],
    {cwd:repo,encoding:'utf8',timeout:240000,maxBuffer:1024*1024,
     stdio:['ignore','pipe','ignore']}))}
   catch{fail('ORIGINAL_PYTHON_BYTE_OR_GIT_VERIFICATION_FAILED')}
  };
  const inspection=call(['--inspect-original-premerge']);
  const original=inspection?.originalPremergeReceipt;
  const manifest=inspection?.originalManifest;
  const originalText=inspection?.originalPremergeReceiptText;
  if(inspection?.schema!=='mid.740.original-legacy-shadow-inspection.v1'||
     inspection.status!=='ORIGINAL_BYTES_READ_QA_ONLY'||
     inspection.originalEnvelopeSha256!==transfer.envelopeSha256||
     inspection.authenticatedGitHubProducer!==false||
     inspection.installerAuthorized!==false||inspection.releaseAuthorized!==false||
     typeof originalText!=='string'||!originalText.endsWith('\n')||
     Buffer.byteLength(originalText)>65536||
     inspection.originalPremergeReceiptSha256!==manifest?.originalPremergeReceiptSha256||
     !DIGEST.test(inspection.originalPremergeReceiptSha256??'')||
     manifest.schema!=='mid.740.legacy-producer-shadow.v1'||
     manifest.packageCommitSha!==packageCommitSha||
     manifest.sourceMergeSha!==sourceMergeSha||
     manifest.workflowSha!==trustedWorkflowSha||
     manifest.producerRunId!==runId||manifest.producerRunAttempt!==1||
     manifest.sourceGateRunId!==original?.sourceGateRunId||
     manifest.sourceGateRunAttempt!==original?.sourceGateAttempt||
     manifest.installerAuthorized!==false||manifest.releaseAuthorized!==false||
     original?.producerRunId!==runId||original.producerAttempt!==1||
     original.producerWorkflowSha!==trustedWorkflowSha||
     original.sourceBaseSha!==trustedWorkflowSha)
   fail('ORIGINAL_PREMERGE_CONTENT_OR_RUN_DRIFT');
  staging=mkdtempSync(join(parent,'.mid740-original-only-'));
  const expected=join(staging,'expected-producer.json');
  const receipt=join(staging,'original-premerge.json');
  const fields=['packageCommitSha','sourceMergeSha','workflowSha',
   'producerRunId','producerRunAttempt','sourceGateRunId','sourceGateRunAttempt'];
  const ids=Object.fromEntries(fields.map(key=>[key,manifest[key]]));
  writeFileSync(expected,JSON.stringify(ids),{flag:'wx',mode:0o600});
  writeFileSync(receipt,originalText,{flag:'wx',mode:0o600});
  const bytes=call(['--expected-legacy-receipt',expected,
   '--installer-zip-sha256',manifest.zipSha256,
   '--expected-premerge-receipt',receipt,'--repository',repo]);
  if(bytes.schema!=='mid.740.legacy-shadow-parity.v1'||
     bytes.packageAndInstallerDigestMatch!==true||
     bytes.originalPremergeReceiptBytesVerified!==true||
     bytes.originalPremergeReceiptSha256!==inspection.originalPremergeReceiptSha256||
     bytes.envelopeSha256!==transfer.envelopeSha256||
     bytes.innerZipSha256!==manifest.zipSha256||
     bytes.sourceMergeSha!==sourceMergeSha||
     bytes.packageCommitSha!==packageCommitSha||
     bytes.authenticatedGitHubProducer!==false||
     bytes.installerAuthorized!==false||bytes.releaseAuthorized!==false)
   fail('ORIGINAL_ZIP_GIT_BLOB_OR_PREMERGE_PARITY_FAILED');
  // Do not conflate verified package Git blob/parent with full source Git
  // tree parity: the independent source-gate/PR/merge reader checks that.
  const intake={
   schema:'mid.740.legacy-original-postinstaller-intake-qa.v1',
   sourceMergeSha,packageCommitSha,producerRunId:runId,artifactId,
   artifactSha256:transfer.envelopeSha256,
   packageGitBlobAndAncestryVerified:true,
   originalPremergeReceiptBytesVerified:true,
   originalPremergeReceiptSha256:inspection.originalPremergeReceiptSha256,
   originalLegacyInstallerReadbackVerified:true,
   metadataVerified:true,producerJobVerified:true,
   producerIdentityReread:true,nativeGitHubReviewVerified:false,
   installerAuthorized:false,releaseAuthorized:false
  };
  const source=await causality({
   premergeReceipt:original,verifiedIntake:intake,sourceMergeSha,legacy
  },get);
  if(source?.status!=='POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY'||
     source.originalLegacyInstallerReadbackVerified!==true||
     source.sourceDiffEquivalenceVerified!==true||
     source.originalSourceGateAttemptJobsVerified!==true||
     source.sourcePrBotMergeAndParentReadbackVerified!==true||
     source.producerArtifactInventoryAndCausalityReadbackVerified!==true||
     source.postVerificationRaceReadbackVerified!==true||
     source.originalProducerReceiptAttested!==false||
     source.nativeGitHubReviewVerified!==false||
     source.installerAuthorized!==false||source.releaseAuthorized!==false)
   fail('INDEPENDENT_SOURCE_GATE_OR_BOT_MERGE_CAUSALITY_BLOCKED');
  const refreshed=await readback(restArgs,get);
  const afterJob=await originalSteps(get,runId,trustedWorkflowSha);
  if(refreshed?.metadataReadbackConsistent!==true||
     reportIdentity(refreshed)!==initialFingerprint||afterJob!==beforeJob)
   fail('FINAL_ORIGINAL_PRODUCER_OR_UPLOAD_RACE');
  const finalStable=await get(ROOT+'git/ref/heads/mid-stable');
  if(finalStable?.object?.sha!==original.sourceBaseSha)
   fail('FINAL_STABLE_RACE');
  success=true;
  return Object.freeze({
   schema:'mid.740.original-legacy-postinstaller-consumer-qa.v1',
   status:'ORIGINAL_GITHUB_ZIP_PREMERGE_SOURCE_AND_INSTALLER_QA_ONLY',
   sourceMergeSha,packageCommitSha,installerRunId,producerRunId:runId,
   sourceGateRunId:original.sourceGateRunId,artifactId,
   originalEnvelopeSha256:transfer.envelopeSha256,
   originalPremergeReceiptSha256:inspection.originalPremergeReceiptSha256,
   originalByteAndGitPackageParityVerified:true,
   independentSourcePrSourceGateMergeCausalityVerified:true,
   originalProducerJobStepAndArtifactReadbackVerified:true,
   completedLegacyInstallerReadbackVerified:true,
   originalProducerReceiptAttested:false,
   nativeGitHubReviewVerified:false,
   installerAuthorized:false,releaseAuthorized:false
  });
 }finally{
  if(staging&&existsSync(staging))rmSync(staging,{recursive:true,force:true});
  if(!success&&downloaded&&existsSync(envelope))rmSync(envelope,{force:true});
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const args=process.argv.slice(2);
  if(args.length!==8||args.slice(0,2).some(x=>!/^[1-9]\d*$/.test(x))||
     !/^[1-9]\d*$/.test(args[5]))fail('BAD_CLI_ARGS');
  const get=path=>{
   if(!path.startsWith(ROOT))fail('UNTRUSTED_API_PATH');
   try{return JSON.parse(execFileSync('gh',['api','--method','GET',path],{
    encoding:'utf8',timeout:25000,maxBuffer:5*1024*1024,
    stdio:['ignore','pipe','ignore']}))}
   catch{fail('ORIGINAL_GITHUB_API_UNAVAILABLE')}
  };
  const proof=await verifyMid740OriginalLegacyPostinstaller({
   runId:Number(args[0]),artifactId:Number(args[1]),
   sourceMergeSha:args[2],packageCommitSha:args[3],
   trustedWorkflowSha:args[4],installerRunId:Number(args[5]),
   repository:args[6],envelopeOutput:args[7],token:process.env.GH_TOKEN
  },{get});
  process.stdout.write(JSON.stringify(proof)+'\n');
 }catch(error){
  process.stderr.write((error?.message?.startsWith('MID_740_')?
   error.message:'MID_740_ORIGINAL_CONSUMER_REJECTED')+'\n');
  process.exitCode=1;
 }
}
