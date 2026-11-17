/** MID #740 · existing rolling widget GitHub release vs repository immutability.
 * QA-only. An existing mutable release is not evidence that deletion and
 * recreation would preserve the rolling widget download under immutability.
 * No GitHub writes, secrets, network, or release authority.
 */
const SHA=/^[0-9a-f]{40}$/;
const EXPECTED=Object.freeze(['manifest.json','mid-widget-export-latest.zip',
 'mid-widget-export-latest.zip.sha256','SHA256SUMS.txt']);
const deny=reason=>Object.freeze({
 schema:'mid.740.widget-immutable-compat.v1',status:'BLOCKED',reason,
 currentRollingReleaseMetadataVerified:false,rollingRecoveryVerified:false,
 releaseByteProvenanceVerified:false,globalImmutabilityCutoverAuthorized:false,
 widgetPublishingAuthorized:false,releaseAuthorized:false
});
export function assessMid740WidgetImmutableCompatibility({
 release,installedWorkflow,canonicalWorkflow,mainSha,stableSha
}={}){
 if(!SHA.test(mainSha??'')||mainSha!==stableSha)return deny('MAIN_STABLE_DRIFT');
 if(typeof installedWorkflow!=='string'||!installedWorkflow||
    installedWorkflow!==canonicalWorkflow)return deny('WIDGET_WORKFLOW_MIRROR_DRIFT');
 if(!/tag="widget-latest"/.test(installedWorkflow)||
    !/gh release view "\$tag"/.test(installedWorkflow)||
    !/gh release edit "\$tag"/.test(installedWorkflow)||
    !/gh release create "\$tag"/.test(installedWorkflow)||
    !/gh release upload "\$tag"/.test(installedWorkflow)||
    !/--clobber/.test(installedWorkflow)||
    !installedWorkflow.includes('releases/download/widget-latest/mid-widget-export-latest.zip'))
  return deny('ROLLING_WORKFLOW_CONTRACT_DRIFT');
 if(!Number.isSafeInteger(release?.id)||release.id<=0||
    release.tag_name!=='widget-latest'||
    release.immutable!==false||release.draft!==false||
    release.prerelease!==true)return deny('EXISTING_WIDGET_RELEASE_NOT_MUTABLE');
 const assets=release.assets;
 if(!Array.isArray(assets)||assets.length!==EXPECTED.length||
    new Set(assets.map(x=>x?.name)).size!==EXPECTED.length||
    new Set(assets.map(x=>x?.id)).size!==EXPECTED.length||
    !EXPECTED.every(name=>assets.some(a=>a?.name===name&&
      a.state==='uploaded'&&Number.isSafeInteger(a.id)&&a.id>0&&
      Number.isSafeInteger(a.size)&&a.size>0)))
  return deny('WIDGET_RELEASE_ASSET_INVENTORY_DRIFT');
 return Object.freeze({
  schema:'mid.740.widget-immutable-compat.v1',
  status:'EXISTING_ROLLING_RELEASE_METADATA_QA_ONLY',
  tag:'widget-latest',releaseId:release.id,assets:Object.freeze([...EXPECTED]),
  currentRollingReleaseMetadataVerified:true,
  futureRollingReleaseRecreationSafe:false,rollingRecoveryVerified:false,
  releaseByteProvenanceVerified:false,globalImmutabilityCutoverAuthorized:false,
  widgetPublishingAuthorized:false,releaseAuthorized:false
 });
}
