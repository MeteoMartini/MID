import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {assessMid740PremergeShadowLink as assess}
 from '../../tools/ci/mid-740-premerge-shadow-link-qa.mjs';

const BASE='a'.repeat(40),HEAD='b'.repeat(40);
const MERGE='c'.repeat(40),PACKAGE='d'.repeat(40),ZIP='e'.repeat(64);
const hash=(s:string)=>createHash('sha256').update(s,'utf8').digest('hex');
function fixture(){
 const receipt={
  schema:'mid.740.premerge-producer-receipt.v1',
  status:'PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:111,sourceGateAttempt:1,
  producerRunId:222,producerAttempt:1,
  prNumber:333,sourceHeadSha:HEAD,sourceBaseSha:BASE,
  producerWorkflowSha:BASE,
  upstreamGateMetadataCoherent:true,producerRunMetadataCoherent:true,
  originalArtifactVerified:false,trustedProductionReceiptAttested:false,
  installerAuthorized:false,releaseAuthorized:false
 };
 const receiptText=JSON.stringify(receipt)+'\n';
 const manifest={
  schema:'mid.740.legacy-producer-shadow.v1',
  packageCommitSha:PACKAGE,sourceMergeSha:MERGE,workflowSha:BASE,
  zipSha256:ZIP,producerRunId:222,producerRunAttempt:1,
  sourceGateRunId:111,sourceGateRunAttempt:1,
  originalPremergeReceiptIncluded:true,
  originalPremergeReceiptSha256:hash(receiptText),
  installerAuthorized:false,releaseAuthorized:false
 };
 const x={receiptText,provenanceText:JSON.stringify(manifest)+'\n',
  sourceMergeSha:MERGE,sourceBaseSha:BASE,sourceHeadSha:HEAD,
  sourceGateRunId:111,producerRunId:222,producerWorkflowSha:BASE,
  packageCommitSha:PACKAGE,originalZipSha256:ZIP};
 return {receipt,manifest,x};
}
const verify=(f:ReturnType<typeof fixture>)=>assess(f.x);
function blocked(mutate:(f:ReturnType<typeof fixture>)=>void){
 const f=fixture();mutate(f);
 const v=verify(f);
 expect(v.status).toBe('BLOCKED');
 expect(v.metadataCoherent).toBe(false);
 expect(v.originalProducerAttested).toBe(false);
 expect(v.installerAuthorized).toBe(false);
 expect(v.releaseAuthorized).toBe(false);
}
describe('MID #740 producer original premerge receipt linked into same Actions envelope (QA)',()=>{
 it('accepts original canonical bytes, but grants no producer or installer privilege',()=>{
  const x=verify(fixture());
  expect(x).toMatchObject({status:'ORIGINAL_SHADOW_RECEIPT_BYTES_COHERENT_QA_ONLY',
   metadataCoherent:true,originalProducerAttested:false,
   installerAuthorized:false,nativeReviewEnforced:false,releaseAuthorized:false});
 });
 it.each([
  ['source merge SHA',f=>{f.x.sourceMergeSha=HEAD}],
  ['source base SHA',f=>{f.x.sourceBaseSha=MERGE}],
  ['workflow source SHA',f=>{f.x.producerWorkflowSha=MERGE}],
  ['source head SHA',f=>{f.x.sourceHeadSha=MERGE}],
  ['source gate run',f=>{f.x.sourceGateRunId=222}],
  ['producer run',f=>{f.x.producerRunId=111}],
  ['package commit',f=>{f.x.packageCommitSha=MERGE}],
  ['zip sha256',f=>{f.x.originalZipSha256='f'.repeat(64)}],
  ['noncanonical original receipt',f=>{f.x.receiptText=JSON.stringify(f.receipt)}],
  ['duplicate receipt key',f=>{f.x.receiptText=f.x.receiptText.replace(/\}\n$/,' ,"sourceHeadSha":"'+HEAD+'"}\n')}],
  ['unknown receipt schema',f=>{f.receipt.schema='fake';f.x.receiptText=JSON.stringify(f.receipt)+'\n'}],
  ['altered receipt status',f=>{f.receipt.status='PASS';f.x.receiptText=JSON.stringify(f.receipt)+'\n'}],
  ['premerge receipt independently claims installer privilege',f=>{f.receipt.installerAuthorized=true;f.x.receiptText=JSON.stringify(f.receipt)+'\n'}],
  ['premerge receipt claims artifact already verified',f=>{f.receipt.originalArtifactVerified=true;f.x.receiptText=JSON.stringify(f.receipt)+'\n'}],
  ['source SHA in original receipt drift',f=>{f.receipt.sourceHeadSha=BASE;f.x.receiptText=JSON.stringify(f.receipt)+'\n';f.manifest.originalPremergeReceiptSha256=hash(f.x.receiptText);f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['wrong original gate attempt',f=>{f.receipt.sourceGateAttempt=2;f.x.receiptText=JSON.stringify(f.receipt)+'\n';f.manifest.originalPremergeReceiptSha256=hash(f.x.receiptText);f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['shadow manifest without receipt',f=>{f.manifest.originalPremergeReceiptIncluded=false;f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['receipt digest does not match bytes',f=>{f.manifest.originalPremergeReceiptSha256='0'.repeat(64);f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['forged producer run in shadow',f=>{f.manifest.producerRunId=333;f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['shadow claims release permission',f=>{f.manifest.releaseAuthorized=true;f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['non-original source zip hash',f=>{f.manifest.zipSha256='0'.repeat(64);f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['shadow producer attempt rerun',f=>{f.manifest.producerRunAttempt=2;f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
  ['non-json receipt',f=>{f.x.receiptText='{' }],
  ['non-json manifest',f=>{f.x.provenanceText='{' }],
  ['source merge equals base',f=>{f.x.sourceMergeSha=BASE}],
  ['wrong receipt producer identity',f=>{f.receipt.producerRunId=444;f.x.receiptText=JSON.stringify(f.receipt)+'\n';f.manifest.originalPremergeReceiptSha256=hash(f.x.receiptText);f.x.provenanceText=JSON.stringify(f.manifest)+'\n'}],
 ] as [string,(f:ReturnType<typeof fixture>)=>void][])('%s is BLOCKED',(_,change)=>blocked(change));
 it('both executable and canonical producer workflows carry the same optional QA receipt',()=>{
  const active=readFileSync('.github/workflows/agent-source-release.yml','utf8');
  const canonical=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
  expect(active).toBe(canonical);
  const receiptPos=active.indexOf('id: premerge_receipt');
  const mergePos=active.indexOf('id: merge\n');
  const zipPos=active.indexOf('id: release_shadow');
  expect(receiptPos).toBeGreaterThan(0);
  expect(mergePos).toBeGreaterThan(receiptPos);
  expect(zipPos).toBeGreaterThan(mergePos);
  expect(active).toContain("MID_TRUSTED_WORKFLOW_SHA: ${{ github.workflow_sha }}");
  expect(active).toContain('steps.premerge_receipt.outcome');
  expect(active).toContain('originalPremergeReceiptIncluded:$receiptIncluded');
  expect(active).toContain('originalPremergeReceiptSha256:(if $receiptIncluded then $receiptSha256 else null end)');
  expect(active).toContain('install -m 600 "$PREMERGE_RECEIPT_PATH" "$shadow_dir/premerge-gate-receipt.json"');
  expect(active).toContain('continue-on-error: true');
  expect(active).toContain('gh workflow run install-mid.yml');
  expect(active).toContain('git push origin HEAD:main');
 });
});
