import {describe,it,expect} from 'vitest';
import {mkdtempSync,readFileSync,existsSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifyMid740OriginalLegacyPostinstaller as verify}
 from '../../tools/ci/mid-740-legacy-original-consumer-qa.mjs';

const repoName='MeteoMartini/MID',prefix='repos/'+repoName+'/';
const SRC='b'.repeat(40),PKG='c'.repeat(40),DIGEST='d'.repeat(64);
const SOURCE_HEAD='e'.repeat(40);
type Fixture=ReturnType<typeof setup>;
function setup(){
 const root=mkdtempSync(join(tmpdir(),'mid740-original-postinstaller-'));
 const repo=join(root,'repo');
 execFileSync('mkdir',[repo]);
 const git=(...args:string[])=>execFileSync('git',args,{
  cwd:repo,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
 git('init','--object-format=sha1','-q');
 git('config','user.name','MID QA');
 git('config','user.email','qa@example.invalid');
 writeFileSync(join(repo,'trusted.txt'),'source workflow is SHA-bound\n');
 git('add','trusted.txt');
 git('commit','-qm','trusted producer workflow');
 const TRUST=git('rev-parse','HEAD');
 const steps=[
  'Original-Source-Gate-Receipt für #740 vor Merge sichern (QA)',
  'Geprüften Agent-PR automatisch zusammenführen',
  'SHA-gebundenes Original-ZIP für #740 bereitstellen',
  'Original-ZIP und Zuordnung kurzlebig als Nachweis hochladen',
  'Bewährten MID-Installer explizit starten'
 ].map((name,i)=>({
  name,number:i+1,status:'completed',conclusion:'success',
  started_at:new Date(Date.parse('2026-11-16T10:00:00Z')+i*60*1000).toISOString(),
  completed_at:new Date(Date.parse('2026-11-16T10:00:00Z')+(i+1)*60*1000).toISOString()
 }));
 const jobs={
  total_count:1,jobs:[{
   id:123,run_id:222,run_attempt:1,head_sha:TRUST,
   status:'completed',conclusion:'success',steps
  }]
 };
 const receipt={
  schema:'mid.740.premerge-producer-receipt.v1',
  status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:111,sourceGateAttempt:1,sourceHeadSha:SOURCE_HEAD,
  sourceBaseSha:TRUST,prNumber:777,producerRunId:222,producerAttempt:1,
  producerWorkflowSha:TRUST,
  upstreamGateMetadataCoherent:true,producerRunMetadataCoherent:true,
  originalArtifactVerified:false,trustedProductionReceiptAttested:false,
  installerAuthorized:false,releaseAuthorized:false
 };
 const raw=JSON.stringify(receipt)+'\n';
 const receiptHash=createHash('sha256').update(raw).digest('hex');
 const manifest={
  schema:'mid.740.legacy-producer-shadow.v1',
  packageCommitSha:PKG,sourceMergeSha:SRC,workflowSha:TRUST,
  producerRunId:222,producerRunAttempt:1,sourceGateRunId:111,
  sourceGateRunAttempt:1,zipSha256:'f'.repeat(64),
  originalPremergeReceiptIncluded:true,
  originalPremergeReceiptSha256:receiptHash,
  installerAuthorized:false,releaseAuthorized:false
 };
 const artifact={
  id:333,name:'mid-740-legacy-shadow-222-1-'+PKG,
  digest:'sha256:'+DIGEST,size_in_bytes:20,created_at:'2026-11-16T10:02:00Z',
  updated_at:'2026-11-16T10:03:00Z'
 };
 const before={
  metadataReadbackConsistent:true,producerInventoryComplete:true,
  legacyInstallerRunId:444,legacyPackageCommitSha:PKG,
  producerRun:{id:222,run_attempt:1,workflow_id:100,
   head_sha:TRUST,status:'completed',conclusion:'success',
   updated_at:'2026-11-16T10:08:00Z'},
  artifact,producerArtifacts:[artifact],releaseAuthorized:false
 };
 const inspector={
  schema:'mid.740.original-legacy-shadow-inspection.v1',
  status:'ORIGINAL_BYTES_READ_QA_ONLY',
  originalEnvelopeSha256:DIGEST,
  originalPremergeReceiptText:raw,
  originalPremergeReceiptSha256:receiptHash,
  originalPremergeReceipt:receipt,originalManifest:manifest,
  authenticatedGitHubProducer:false,nativeReviewVerified:false,
  installerAuthorized:false,releaseAuthorized:false
 };
 const bytes={
  schema:'mid.740.legacy-shadow-parity.v1',
  packageCommitSha:PKG,sourceMergeSha:SRC,envelopeSha256:DIGEST,
  innerZipSha256:manifest.zipSha256,packageAndInstallerDigestMatch:true,
  originalPremergeReceiptBytesVerified:true,
  originalPremergeReceiptSha256:receiptHash,
  authenticatedGitHubProducer:false,nativeReviewVerified:false,
  installerAuthorized:false,releaseAuthorized:false
 };
 const proof={
  status:'POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY',
  originalLegacyInstallerReadbackVerified:true,
  sourceDiffEquivalenceVerified:true,
  originalSourceGateAttemptJobsVerified:true,
  sourcePrBotMergeAndParentReadbackVerified:true,
  producerArtifactInventoryAndCausalityReadbackVerified:true,
  postVerificationRaceReadbackVerified:true,
  originalProducerReceiptAttested:false,nativeGitHubReviewVerified:false,
  installerAuthorized:false,releaseAuthorized:false
 };
 const flags={readbackCount:0,callCount:0,causalityCount:0};
 const args={
  runId:222,artifactId:333,sourceMergeSha:SRC,packageCommitSha:PKG,
  trustedWorkflowSha:TRUST,installerRunId:444,
  repository:repo,envelopeOutput:join(root,'original-envelope.zip'),
  token:'testing-token-no-network'
 };
 const get=async(path:string)=>{
  if(path===prefix+'actions/runs/222/attempts/1/jobs?per_page=100')
   return structuredClone(jobs);
  if(path===prefix+'git/ref/heads/mid-stable')
   return {object:{sha:TRUST}};
  throw Error('NO_GITHUB_FIXTURE_'+path);
 };
 const readback=async()=>{flags.readbackCount++;return structuredClone(before)};
 const downloader=async({output}:any)=>{
  writeFileSync(output,Buffer.from('original bytes fixture'));
  return {artifactId:333,envelopeSha256:DIGEST,
   downloadedEnvelopeBytesVerified:true,installerAuthorized:false,releaseAuthorized:false};
 };
 const python=(_cmd:string,options:string[])=>{
  flags.callCount++;
  return JSON.stringify(options.includes('--inspect-original-premerge')?
   inspector:bytes);
 };
 const causality=async()=>{flags.causalityCount++;return structuredClone(proof)};
 return {root,repo,TRUST,receipt,raw,receiptHash,manifest,artifact,before,
  jobs,inspector,bytes,proof,args,get,readback,downloader,python,causality,flags};
}
const deps=(f:Fixture)=>({get:f.get,readback:f.readback,downloader:f.downloader,
 python:f.python,causality:f.causality});
async function rejected(mutate:(f:Fixture)=>void,
 reason:RegExp=/MID_740_ORIGINAL_CONSUMER_/){
 const f=setup();
 try{
  mutate(f);
  await expect(verify(f.args,deps(f))).rejects.toThrow(reason);
  expect(f.flags.causalityCount).toBeLessThanOrEqual(1);
  expect(existsSync(f.args.envelopeOutput)).toBe(false);
 }finally{rmSync(f.root,{force:true,recursive:true})}
}
describe('#740 original GitHub ZIP + premerge receipt + source gate + completed legacy installer QA',()=>{
 it('composes all independent stages; grants NO release, installer or native review permission',async()=>{
  const f=setup();
  try{
   const result=await verify(f.args,deps(f));
   expect(result).toMatchObject({
    schema:'mid.740.original-legacy-postinstaller-consumer-qa.v1',
    status:'ORIGINAL_GITHUB_ZIP_PREMERGE_SOURCE_AND_INSTALLER_QA_ONLY',
    sourceMergeSha:SRC,packageCommitSha:PKG,installerRunId:444,
    sourceGateRunId:111,producerRunId:222,artifactId:333,
    originalEnvelopeSha256:DIGEST,originalPremergeReceiptSha256:f.receiptHash,
    originalByteAndGitPackageParityVerified:true,
    independentSourcePrSourceGateMergeCausalityVerified:true,
    originalProducerJobStepAndArtifactReadbackVerified:true,
    completedLegacyInstallerReadbackVerified:true,
    originalProducerReceiptAttested:false,nativeGitHubReviewVerified:false,
    installerAuthorized:false,releaseAuthorized:false});
   expect(f.flags.readbackCount).toBe(2);
   expect(f.flags.callCount).toBe(2);
   expect(f.flags.causalityCount).toBe(1);
   expect(existsSync(f.args.envelopeOutput)).toBe(true);
  }finally{rmSync(f.root,{force:true,recursive:true})}
 });
 it.each([
  ['untrusted source checkout',f=>{f.args.trustedWorkflowSha=SRC}],
  ['caller attempts different package SHA',f=>{f.args.packageCommitSha=TRICK}],
  ['negative artifact ID',f=>{f.args.artifactId=-1}],
  ['missing original producer readback',f=>{f.before.metadataReadbackConsistent=false}],
  ['incomplete artifact inventory',f=>{f.before.producerInventoryComplete=false}],
  ['wrong verified installer',f=>{f.before.legacyInstallerRunId=333}],
  ['producer stage was skipped',f=>{f.jobs.jobs[0].steps[2].conclusion='skipped'}],
  ['premerge receipt step failed',f=>{f.jobs.jobs[0].steps[0].conclusion='failure'}],
  ['installer dispatch step skipped',f=>{f.jobs.jobs[0].steps[4].conclusion='skipped'}],
  ['no original merge step',f=>{f.jobs.jobs[0].steps.splice(1,1)}],
  ['reordered staging step',f=>{f.jobs.jobs[0].steps[2].number=1}],
  ['wrong job source HEAD',f=>{f.jobs.jobs[0].head_sha=SRC}],
  ['inner ZIP digest wrong',f=>{f.bytes.innerZipSha256='0'.repeat(64)}],
  ['premerge different original source base',f=>{f.inspector.originalPremergeReceipt.sourceBaseSha=SRC}],
  ['original package SHA mutated',f=>{f.inspector.originalManifest.packageCommitSha=SRC}],
  ['original source run SHA mutated',f=>{f.inspector.originalManifest.workflowSha=SRC}],
  ['independent Python flags missing',f=>{f.bytes.originalPremergeReceiptBytesVerified=false}],
  ['fake original ZIP/Git proof',f=>{f.bytes.packageAndInstallerDigestMatch=false}],
  ['untrusted premerge claim of authorization',f=>{f.inspector.releaseAuthorized=true}],
  ['negative independent source causality',f=>{f.proof.status='BLOCKED'}],
  ['missing independent source tree equality',f=>{f.proof.sourceDiffEquivalenceVerified=false}],
  ['postproducer claimed release allowed',f=>{f.proof.releaseAuthorized=true}],
 ] as [string,(f:Fixture)=>void][])('%s is rejected',async(_,mutate)=>{
  await rejected(mutate);
 });
 it('blocks altered second Producer readback and preserves no partial output',async()=>{
  const f=setup();
  try{
   const original=f.readback;
   f.readback=async()=>{
    const value=await original();
    if(f.flags.readbackCount===2)value.artifact.digest='sha256:'+'0'.repeat(64);
    return value;
   };
   await expect(verify(f.args,deps(f))).rejects.toThrow(
    'MID_740_ORIGINAL_CONSUMER_FINAL_ORIGINAL_PRODUCER_OR_UPLOAD_RACE');
   expect(existsSync(f.args.envelopeOutput)).toBe(false);
  }finally{rmSync(f.root,{recursive:true,force:true})}
 });
 it('keeps rejected partial download bytes entirely private',async()=>{
  const f=setup();
  try{
   f.downloader=async({output}:any)=>{
    writeFileSync(output,Buffer.from('PARTIAL UNTRUSTED BYTES'));
    throw Error('SIMULATED_INTERRUPTED_DOWNLOAD');
   };
   await expect(verify(f.args,deps(f))).rejects.toThrow(
    'SIMULATED_INTERRUPTED_DOWNLOAD');
   expect(existsSync(f.args.envelopeOutput)).toBe(false);
   expect(readdirSync(f.root).filter(n=>n.startsWith('.mid740-original-only-')))
    .toEqual([]);
   expect(f.flags.causalityCount).toBe(0);
  }finally{rmSync(f.root,{recursive:true,force:true})}
 });
 it('never publishes downloaded bytes before final source and Stable readback',async()=>{
  const f=setup();
  try{
   const original=f.causality;
   f.causality=async()=>{
    expect(existsSync(f.args.envelopeOutput)).toBe(false);
    return original();
   };
   await verify(f.args,deps(f));
   expect(existsSync(f.args.envelopeOutput)).toBe(true);
   expect(readFileSync(f.args.envelopeOutput,'utf8'))
    .toBe('original bytes fixture');
  }finally{rmSync(f.root,{recursive:true,force:true})}
 });
 it('rejects an output-path race without overwriting an unrelated file',async()=>{
  const f=setup();
  try{
   const original=f.causality;
   f.causality=async()=>{
    const result=await original();
    writeFileSync(f.args.envelopeOutput,'UNRELATED FILE', {flag:'wx'});
    return result;
   };
   await expect(verify(f.args,deps(f))).rejects.toThrow(
    'MID_740_ORIGINAL_CONSUMER_OUTPUT_PATH_RACE');
   expect(readFileSync(f.args.envelopeOutput,'utf8'))
    .toBe('UNRELATED FILE');
   expect(readdirSync(f.root).filter(n=>n.startsWith('.mid740-original-only-')))
    .toEqual([]);
  }finally{rmSync(f.root,{recursive:true,force:true})}
 });
 it('rejects late source-base drift after all original ZIP and Source checks',async()=>{
  const f=setup();
  try{
   f.get=async path=>{
    if(path===prefix+'actions/runs/222/attempts/1/jobs?per_page=100')
     return structuredClone(f.jobs);
    if(path===prefix+'git/ref/heads/mid-stable')
     return {object:{sha:SRC}};
    throw Error('NO_GITHUB_FIXTURE');
   };
   await expect(verify(f.args,deps(f))).rejects.toThrow(
    'MID_740_ORIGINAL_CONSUMER_FINAL_STABLE_RACE');
   expect(existsSync(f.args.envelopeOutput)).toBe(false);
  }finally{rmSync(f.root,{recursive:true,force:true})}
 });
});
const TRICK='a'.repeat(40);
