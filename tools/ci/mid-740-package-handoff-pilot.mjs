/** MID #740: read-only proposed artifact handoff identity classifier.
 * No workflow dispatch, merge, extraction, deployment, or release permission.
 * All inputs are caller-provided; an ACCEPTED result is a test preflight ONLY.
 */
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^sha256:([a-f0-9]{64})$/;
const REPO='MeteoMartini/MID';
const REPO_ID=1305110795; // immutable GitHub repository ID, independently verified
const ARTIFACT_API='https://api.github.com/repos/MeteoMartini/MID/actions/artifacts/';
const MAX_ENVELOPE_BYTES=900*1024*1024;
const WORKFLOW='.github/workflows/agent-source-release.yml';
const block=(...reason)=>Object.freeze({schema:'mid.740.package-handoff-pilot.v1',
 acceptableMetadata:false,releaseAuthorized:false,reasons:[...new Set(reason)]});
export function assessMid740PackageHandoff(input={}){
 const {mainSha,mergedSourceSha,sourcePrHeadSha,sourceGateSha,
  producerRun,artifact,download,zipVerification,reviewReadback,
  trustedWorkflowSha,producerArtifacts,producerInventoryComplete}=input;
 const reasons=[];
 if(!SHA.test(mainSha??'')||mainSha!==mergedSourceSha)reasons.push('MAIN_MERGE_SHA_DRIFT');
 if(!SHA.test(sourcePrHeadSha??'')||sourceGateSha!==sourcePrHeadSha)
  reasons.push('SOURCE_GATE_HEAD_DRIFT');
 if(!Number.isSafeInteger(producerRun?.id)||producerRun.id<1||
    producerRun.repository?.full_name!==REPO||
    producerRun.path!==WORKFLOW||
    producerRun.event!=='workflow_run'||
    producerRun.status!=='completed'||producerRun.conclusion!=='success'||
    producerRun.head_branch!=='main')
  reasons.push('UNTRUSTED_PRODUCER_RUN');
 // A workflow_run is privileged. Bind its source workflow revision, attempt,
 // repository and head repository; the merge SHA is deliberately distinct.
 if(!SHA.test(trustedWorkflowSha??'')||producerRun?.head_sha!==trustedWorkflowSha||
    !Number.isSafeInteger(producerRun?.run_attempt)||producerRun.run_attempt<1||
    !Number.isSafeInteger(producerRun?.workflow_id)||producerRun.workflow_id<1)
  reasons.push('PRODUCER_WORKFLOW_SOURCE_OR_ATTEMPT_UNVERIFIED');
 if(producerRun?.repository?.id!==REPO_ID||producerRun?.head_repository?.id!==REPO_ID)
  reasons.push('PRODUCER_REPOSITORY_ID_MISMATCH');
 if(!Number.isSafeInteger(artifact?.id)||artifact.id<1||
    artifact.name!=='mid-release-'+mergedSourceSha||
    artifact.expired!==false||
    !DIGEST.test(artifact.digest??'')||
    artifact.workflow_run?.id!==producerRun?.id||
    artifact.workflow_run?.repository_id!==REPO_ID||
    artifact.workflow_run?.head_repository_id!==REPO_ID||
    artifact.workflow_run?.head_branch!==producerRun?.head_branch||
    artifact.workflow_run?.head_sha!==producerRun?.head_sha||
    artifact.url!==ARTIFACT_API+artifact.id||
    artifact.archive_download_url!==ARTIFACT_API+artifact.id+'/zip'||
    !Number.isSafeInteger(artifact.size_in_bytes)||artifact.size_in_bytes<1||
    artifact.size_in_bytes>MAX_ENVELOPE_BYTES)
  reasons.push('UNTRUSTED_ARTIFACT_OR_INCOMPLETE_RUN_BINDING');
 // Require an explicitly complete run-specific artifact list. Never accept
 // another attempt's same-name artifact as the immutable producer output.
 const sameName=Array.isArray(producerArtifacts)?producerArtifacts.filter(a=>
  a?.name===artifact?.name):[];
 if(producerInventoryComplete!==true||!Array.isArray(producerArtifacts)||
    sameName.length!==1||sameName[0]?.id!==artifact?.id||
    sameName[0]?.digest!==artifact?.digest)
  reasons.push('PRODUCER_ARTIFACT_INVENTORY_UNVERIFIED');
 if(download?.artifactId!==artifact?.id||
    download?.runId!==producerRun?.id||
    download?.sha256!==artifact?.digest?.slice(7)||
    download?.isComplete!==true||
    download?.runAttempt!==producerRun?.run_attempt)
  reasons.push('ENVELOPE_SHA256_UNVERIFIED');
 if(zipVerification?.verifiedSourceSha!==mergedSourceSha||
    !SHA.test(zipVerification?.verifiedSourceSha??'')||
    !/^[a-f0-9]{64}$/.test(zipVerification?.zipSha256??'')||
    zipVerification?.allGitTreeFilesByteAndModeExact!==true||
    zipVerification?.unexpectedFiles!==false)
  reasons.push('ZIP_TREE_IDENTITY_UNVERIFIED');
 if(reviewReadback?.authoritativeNativeRuleAtMerge!==true||
    reviewReadback?.noReviewBypass!==true||
    reviewReadback?.allCriticalFindingsDispositioned!==true)
  reasons.push('NATIVE_REVIEW_OR_DISPOSITION_UNVERIFIED');
 // Deliberately not a release proof: the caller must independently authenticate
 // these GitHub REST readbacks, archive bytes and ZIP tree. The future live
 // Installer must recheck every dependency, its own Core/Heavy/Worker/Pages gates.
 if(reasons.length)return block(...reasons);
 return Object.freeze({schema:'mid.740.package-handoff-pilot.v1',
  acceptableMetadata:true,releaseAuthorized:false,reasons:[],
  note:'Metadata-only design contract. Caller values remain untrusted until authenticated REST readbacks and exact envelope/ZIP bytes, native merge rule and Installer/Pages/Stable gates are independently verified.'});
}
