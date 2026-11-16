#!/usr/bin/env node
/** MID #740: completed source-producer causality, read-only QA ONLY.
 * Compose the existing authenticated run/artifact inventory readback with
 * the earlier pre-merge receipt and the byte/tree-verified intake report.
 * Neither caller-supplied report is a signed attestation. This module cannot
 * authorize an installer, GitHub ruleset change, merge, or release.
 */
import {collectMid740GitHubReadback} from './mid-740-github-artifact-readback.mjs';

const REPO='MeteoMartini/MID',ROOT='repos/'+REPO+'/',REPO_ID=1305110795;
const SOURCE_WORKFLOW_ID=358449552,PRODUCER_WORKFLOW_ID=358777143;
const SOURCE_PATH='.github/workflows/chatgpt-pr-gate.yml';
const PRODUCER_PATH='.github/workflows/agent-source-release.yml';
const SOURCE_NAME='MID-Agent-Quellstand prüfen';
const PRODUCER_NAME='Geprüften Agent-PR automatisch veröffentlichen';
const BOT_ID=333327823;
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const positive=n=>Number.isSafeInteger(n)&&n>0;
const timestamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s))?
 Date.parse(s):NaN;
const blocked=reason=>Object.freeze({
 schema:'mid.740.postproducer-causality-qa.v1',status:'BLOCKED',reason,
 originalProducerReceiptAttested:false,sourceDiffEquivalenceVerified:false,
 nativeGitHubReviewVerified:false,installerAuthorized:false,
 recoveryAuthorized:false,releaseAuthorized:false
});
const runIdentity=r=>JSON.stringify([
 r?.id,r?.run_attempt,r?.workflow_id,r?.path,r?.name,r?.event,
 r?.head_sha,r?.head_branch,r?.status,r?.conclusion,
 r?.created_at,r?.run_started_at,r?.updated_at,
 r?.repository?.id,r?.head_repository?.id
]);
const artifactIdentity=a=>JSON.stringify([
 a?.id,a?.name,a?.digest,a?.size_in_bytes,a?.expired,
 a?.created_at,a?.updated_at,a?.workflow_run?.id,
 a?.workflow_run?.repository_id,a?.workflow_run?.head_sha
]);
const prIdentity=p=>JSON.stringify([
 p?.number,p?.state,p?.draft,p?.merged,p?.merged_at,
 p?.merge_commit_sha,p?.base?.ref,p?.base?.sha,p?.head?.ref,
 p?.head?.sha,p?.head?.repo?.id,p?.merged_by?.id,
 p?.merged_by?.login,p?.merged_by?.type
]);
const commitIdentity=c=>JSON.stringify([
 c?.sha,c?.tree?.sha,c?.parents?.map(x=>x.sha)
]);

export async function assessMid740PostProducerCausality({
 premergeReceipt,verifiedIntake,sourceMergeSha
}={},get){
 const r=premergeReceipt,i=verifiedIntake;
 if(typeof get!=='function'||!SHA.test(sourceMergeSha??'')||
    r?.schema!=='mid.740.premerge-producer-receipt.v1'||
    r.status!=='PREMERGE_PRODUCER_EVENT_METADATA_COHERENT_QA_ONLY'||
    !positive(r.sourceGateRunId)||r.sourceGateAttempt!==1||
    !positive(r.producerRunId)||r.producerAttempt!==1||
    !positive(r.prNumber)||!SHA.test(r.sourceHeadSha??'')||
    !SHA.test(r.sourceBaseSha??'')||r.sourceBaseSha===sourceMergeSha||
    r.producerWorkflowSha!==r.sourceBaseSha||
    r.upstreamGateMetadataCoherent!==true||
    r.producerRunMetadataCoherent!==true||
    r.originalArtifactVerified!==false||
    r.trustedProductionReceiptAttested!==false||
    r.installerAuthorized!==false||r.releaseAuthorized!==false||
    i?.schema!=='mid.740.end-to-end-intake-qa.v1'||
    i.mainSha!==sourceMergeSha||i.producerRunId!==r.producerRunId||
    !positive(i.artifactId)||!DIGEST.test(i.artifactSha256??'')||
    i.downloadAndGitTreeVerified!==true||i.metadataVerified!==true||
    i.producerJobVerified!==true||i.producerIdentityReread!==true||
    i.nativeGitHubReviewVerified!==false||i.installerAuthorized!==false||
    i.releaseAuthorized!==false)
  return blocked('UNTRUSTED_RECEIPT_OR_INTAKE_REPORT');

 let meta;
 try{
  meta=await collectMid740GitHubReadback({
   runId:r.producerRunId,artifactId:i.artifactId,
   sourceMergeSha,trustedWorkflowSha:r.producerWorkflowSha
  },get);
 }catch{return blocked('PRODUCER_ARTIFACT_REST_READBACK_UNVERIFIED')}
 if(meta.artifact.digest!=='sha256:'+i.artifactSha256||
    meta.producerRun.path!==PRODUCER_PATH||
    meta.producerRun.workflow_id!==PRODUCER_WORKFLOW_ID||
    meta.producerRun.name!==PRODUCER_NAME)
  return blocked('PRODUCER_OR_ORIGINAL_DIGEST_MISMATCH');

 let gate,gateRegistry,pr,merge,sourceHead,stable;
 try{
  [gate,gateRegistry,pr,merge,sourceHead,stable]=await Promise.all([
   get(ROOT+'actions/runs/'+r.sourceGateRunId),
   get(ROOT+'actions/workflows/'+SOURCE_WORKFLOW_ID),
   get(ROOT+'pulls/'+r.prNumber),
   get(ROOT+'git/commits/'+sourceMergeSha),
   get(ROOT+'git/commits/'+r.sourceHeadSha),
   get(ROOT+'git/ref/heads/mid-stable')
  ]);
 }catch{return blocked('UPSTREAM_MERGE_OR_STABLE_READ_UNAVAILABLE')}
 if(gate?.id!==r.sourceGateRunId||
    gate.workflow_id!==SOURCE_WORKFLOW_ID||gate.path!==SOURCE_PATH||
    gate.name!==SOURCE_NAME||gate.event!=='pull_request'||
    gate.run_attempt!==r.sourceGateAttempt||
    gate.head_sha!==r.sourceHeadSha||
    gate.repository?.id!==REPO_ID||gate.head_repository?.id!==REPO_ID||
    gate.status!=='completed'||gate.conclusion!=='success'||
    gateRegistry?.id!==SOURCE_WORKFLOW_ID||
    gateRegistry.path!==SOURCE_PATH||gateRegistry.name!==SOURCE_NAME||
    gateRegistry.state!=='active')
  return blocked('ORIGINAL_SOURCE_GATE_IDENTITY_DRIFT');
 if(pr?.number!==r.prNumber||pr.state!=='closed'||pr.merged!==true||
    pr.draft!==false||pr.merge_commit_sha!==sourceMergeSha||
    pr.base?.ref!=='main'||pr.base.sha!==r.sourceBaseSha||
    pr.head?.sha!==r.sourceHeadSha||
    pr.head?.repo?.id!==REPO_ID||gate.head_branch!==pr.head.ref||
    !/^(chatgpt|codex)\//.test(pr.head.ref??'')||
    pr.merged_by?.id!==BOT_ID||pr.merged_by?.type!=='Bot'||
    pr.merged_by?.login!=='mid-release-bot-meteomartini[bot]')
  return blocked('SOURCE_PR_OR_BOT_MERGE_IDENTITY_DRIFT');
 if(merge?.sha!==sourceMergeSha||!SHA.test(merge.tree?.sha??'')||
    merge.parents?.length!==1||merge.parents[0]?.sha!==r.sourceBaseSha||
    stable?.object?.type!=='commit'||
    stable.object.sha!==r.sourceBaseSha)
  return blocked('SOURCE_MERGE_PARENT_OR_STABLE_DRIFT');
 // Exact Git tree IDs commit every tracked path, blob OID and Git mode.
 // Equality plus the verified squash parent on the PR's original base means
 // the complete source PR diff relative to base matches the merged diff.
 if(sourceHead?.sha!==r.sourceHeadSha||
    !SHA.test(sourceHead.tree?.sha??'')||
    sourceHead.tree.sha!==merge.tree.sha)
  return blocked('SOURCE_PR_HEAD_TREE_NOT_IDENTICAL_TO_MERGE');

 // Chronology is necessary but NOT sufficient: the causal source comes from
 // exact GitHub run/PR/commit/artifact identities, never timestamps alone.
 const moments=[timestamp(gate.updated_at),
  timestamp(meta.producerRun.created_at),
  timestamp(meta.producerRun.run_started_at),timestamp(pr.merged_at),
  timestamp(meta.artifact.created_at),timestamp(meta.producerRun.updated_at)];
 if(moments.some(x=>!Number.isFinite(x))||
    moments.some((x,n)=>n>0&&x<moments[n-1]))
  return blocked('SOURCE_PRODUCER_MERGE_ARTIFACT_CHRONOLOGY_DRIFT');

 // Final independent REST readback, including a second full producer-artifact
 // inventory. A changed source gate, merge, PR, artifact, stable, or producer
 // invalidates this QA result; the installer must still recheck separately.
 let after,gate2,pr2,merge2,sourceHead2,stable2;
 try{
  [after,gate2,pr2,merge2,sourceHead2,stable2]=await Promise.all([
   collectMid740GitHubReadback({runId:r.producerRunId,
    artifactId:i.artifactId,sourceMergeSha,
    trustedWorkflowSha:r.producerWorkflowSha},get),
   get(ROOT+'actions/runs/'+r.sourceGateRunId),
   get(ROOT+'pulls/'+r.prNumber),
   get(ROOT+'git/commits/'+sourceMergeSha),
   get(ROOT+'git/commits/'+r.sourceHeadSha),
   get(ROOT+'git/ref/heads/mid-stable')
  ]);
 }catch{return blocked('FINAL_CAUSALITY_READBACK_UNAVAILABLE')}
 if(runIdentity(meta.producerRun)!==runIdentity(after.producerRun)||
    artifactIdentity(meta.artifact)!==artifactIdentity(after.artifact)||
    runIdentity(gate)!==runIdentity(gate2)||
    prIdentity(pr)!==prIdentity(pr2)||
    commitIdentity(merge)!==commitIdentity(merge2)||
    commitIdentity(sourceHead)!==commitIdentity(sourceHead2)||
    stable2?.object?.sha!==stable.object.sha)
  return blocked('FINAL_UPSTREAM_MERGE_OR_PRODUCER_RACE');

 return Object.freeze({
  schema:'mid.740.postproducer-causality-qa.v1',
  status:'POST_PRODUCER_CAUSALITY_METADATA_COHERENT_QA_ONLY',
  sourceGateRunId:r.sourceGateRunId,sourceGateAttempt:r.sourceGateAttempt,
  sourceHeadSha:r.sourceHeadSha,sourceBaseSha:r.sourceBaseSha,
  sourcePrNumber:r.prNumber,sourceMergeSha,
  producerRunId:r.producerRunId,producerAttempt:1,
  artifactId:i.artifactId,artifactSha256:i.artifactSha256,
  sourcePrBotMergeAndParentReadbackVerified:true,
  sourceGitTreeSha:sourceHead.tree.sha,
  sourceDiffEquivalenceVerified:true,
  producerArtifactInventoryAndCausalityReadbackVerified:true,
  postVerificationRaceReadbackVerified:true,
  // The premerge receipt and intake proof are supplied objects; this module
  // does not authenticate their production origin or re-verify ZIP bytes.
  originalProducerReceiptAttested:false,
  nativeGitHubReviewVerified:false,
  installerAuthorized:false,recoveryAuthorized:false,releaseAuthorized:false
 });
}
