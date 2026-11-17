#!/usr/bin/env node
/** #740: read-only original premerge receipt + producer shadow manifest binding.
 * Feed ONLY bytes from independently verified original GitHub Actions envelope;
 * caller supplied strings are NOT credentials, signatures, or attestations.
 * No ZIP extraction, Git writes, dispatch, release or privileged actions.
 */
import {createHash} from 'node:crypto';
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const GOOD=n=>Number.isSafeInteger(n)&&n>0;
const block=reason=>Object.freeze({schema:'mid.740.premerge-shadow-link-qa.v1',
 status:'BLOCKED',reason,metadataCoherent:false,originalProducerAttested:false,
 nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false});
function json(text,canonical=false){
 if(typeof text!=='string'||text.length<2||text.length>32768)return null;
 try{
  const object=JSON.parse(text);
  if(!object||typeof object!=='object'||Array.isArray(object))return null;
  // Original producer emits a single JSON.stringify()+newline. Reject
  // unknown serialization, duplicate keys and hand-edited receipt bodies.
  if(canonical&&text!==JSON.stringify(object)+'\n')return null;
  return object;
 }catch{return null}
}
export function assessMid740PremergeShadowLink({
 receiptText,provenanceText,sourceMergeSha,sourceBaseSha,
 sourceHeadSha,sourceGateRunId,producerRunId,producerWorkflowSha,
 packageCommitSha,originalZipSha256
}={}){
 if(![sourceMergeSha,sourceBaseSha,sourceHeadSha,producerWorkflowSha,packageCommitSha]
      .every(x=>SHA.test(x??''))||
    !GOOD(sourceGateRunId)||!GOOD(producerRunId)||!DIGEST.test(originalZipSha256??'')||
    sourceMergeSha===sourceBaseSha||producerWorkflowSha!==sourceBaseSha)
  return block('UNTRUSTED_EXPECTED_SOURCE_OR_PRODUCER_IDENTITY');
 const receipt=json(receiptText,true),manifest=json(provenanceText);
 if(!receipt||!manifest)return block('UNTRUSTED_OR_NONCANONICAL_JSON');
 const actualDigest=createHash('sha256').update(receiptText,'utf8').digest('hex');
 if(manifest.schema!=='mid.740.legacy-producer-shadow.v1'||
    manifest.originalPremergeReceiptIncluded!==true||
    manifest.originalPremergeReceiptSha256!==actualDigest||
    !DIGEST.test(actualDigest)||manifest.packageCommitSha!==packageCommitSha||
    manifest.sourceMergeSha!==sourceMergeSha||
    manifest.workflowSha!==producerWorkflowSha||
    manifest.zipSha256!==originalZipSha256||
    manifest.producerRunId!==producerRunId||manifest.producerRunAttempt!==1||
    manifest.sourceGateRunId!==sourceGateRunId||manifest.sourceGateRunAttempt!==1||
    manifest.installerAuthorized!==false||manifest.releaseAuthorized!==false)
  return block('PRODUCER_SHADOW_MANIFEST_NOT_BOUND_TO_ORIGINAL_RECEIPT');
 if(receipt.schema!=='mid.740.premerge-producer-receipt.v1'||
    receipt.status!=='PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY'||
    receipt.sourceGateRunId!==sourceGateRunId||receipt.sourceGateAttempt!==1||
    receipt.producerRunId!==producerRunId||receipt.producerAttempt!==1||
    receipt.producerWorkflowSha!==producerWorkflowSha||
    receipt.sourceBaseSha!==sourceBaseSha||receipt.sourceHeadSha!==sourceHeadSha||
    !GOOD(receipt.prNumber)||receipt.upstreamGateMetadataCoherent!==true||
    receipt.producerRunMetadataCoherent!==true||
    receipt.originalArtifactVerified!==false||
    receipt.trustedProductionReceiptAttested!==false||
    receipt.installerAuthorized!==false||receipt.releaseAuthorized!==false)
  return block('PREMERGE_RECEIPT_SOURCE_GATE_OR_RUN_IDENTITY_DRIFT');
 return Object.freeze({schema:'mid.740.premerge-shadow-link-qa.v1',
  status:'ORIGINAL_SHADOW_RECEIPT_BYTES_COHERENT_QA_ONLY',
  sourceMergeSha,sourceHeadSha,packageCommitSha,producerRunId,
  originalPremergeReceiptSha256:actualDigest,
  metadataCoherent:true,originalProducerAttested:false,
  nativeReviewEnforced:false,installerAuthorized:false,releaseAuthorized:false});
}
