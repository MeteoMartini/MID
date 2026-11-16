/** MID #740: read-only proposed artifact handoff identity classifier.
 * No workflow dispatch, merge, extraction, deployment, or release permission.
 * All inputs are caller-provided; an ACCEPTED result is a test preflight ONLY.
 */
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^sha256:([a-f0-9]{64})$/;
const REPO='MeteoMartini/MID';
const WORKFLOW='.github/workflows/agent-source-release.yml';
const block=(...reason)=>Object.freeze({schema:'mid.740.package-handoff-pilot.v1',
 acceptableMetadata:false,releaseAuthorized:false,reasons:[...new Set(reason)]});
export function assessMid740PackageHandoff(input={}){
 const {mainSha,mergedSourceSha,sourcePrHeadSha,sourceGateSha,
  producerRun,artifact,download,zipVerification,reviewReadback}=input;
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
 if(!Number.isSafeInteger(artifact?.id)||artifact.id<1||
    artifact.name!=='mid-release-'+mergedSourceSha||
    artifact.expired!==false||
    !DIGEST.test(artifact.digest??'')||
    artifact.workflow_run?.id!==producerRun?.id)
  reasons.push('UNTRUSTED_ARTIFACT_OR_INCOMPLETE_RUN_BINDING');
 if(download?.artifactId!==artifact?.id||
    download?.runId!==producerRun?.id||
    download?.sha256!==artifact?.digest?.slice(7)||
    download?.isComplete!==true)
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
  note:'Metadata-only design contract. No live GitHub Ruleset/Branch-Protection proof, no authenticated ZIP download, no Installer/Pages/Stable gate.'});
}
