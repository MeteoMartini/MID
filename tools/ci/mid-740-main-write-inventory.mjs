/** MID #740: source-only negative inventory for direct main writes.
 * A textual scan is not a general static analyzer and grants NO release rights.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const MAIN_PUSH=/\bgit[ \t]+push[ \t]+origin[ \t]+HEAD:(?:refs\/heads\/)?main\b/g;
const REPO='MeteoMartini/MID';
const valid=x=>typeof x==='string'&&x.length>0;
export function assessMid740MainWriteInventory({source,sourceTwin,installer,installerTwin,installerPatch,manualDeploy,manualDeployTwin}={}){
 const reasons=[];
 if(![source,sourceTwin,installer,installerTwin,installerPatch,manualDeploy,manualDeployTwin].every(valid))
  reasons.push('MISSING_OR_INVALID_SOURCE');
 const sourceMirrored=valid(source)&&source===sourceTwin;
 const installerMirrored=valid(installer)&&installer===installerTwin&&installer===installerPatch;
 if(!sourceMirrored||!installerMirrored)reasons.push('WORKFLOW_MIRROR_DRIFT');
 const manualMirrored=valid(manualDeploy)&&manualDeploy===manualDeployTwin;
 if(!manualMirrored)reasons.push('MANUAL_DEPLOY_MIRROR_DRIFT');
 const stableRedeployNeedsDist=valid(manualDeploy)&&
  /ref:\s*mid-stable/.test(manualDeploy)&&
  /test -f dist\/index\.html/.test(manualDeploy);
 if(stableRedeployNeedsDist)reasons.push('STABLE_REDEPLOY_REQUIRES_PERSISTENT_DIST');
 const sourcePushes=typeof source==='string'?[...source.matchAll(MAIN_PUSH)].length:0;
 const installerPushes=typeof installer==='string'?[...installer.matchAll(MAIN_PUSH)].length:0;
 const paths=[];
 if(sourcePushes)paths.push('agent-source-release.yml:ZIP_COMMIT_DIRECT_MAIN_PUSH');
 if(installerPushes)paths.push('install-mid.yml:POST_BUILD_DIRECT_MAIN_PUSH');
 if(paths.length)reasons.push('UNMIGRATED_DIRECT_MAIN_WRITES');
 else reasons.push('NEEDS_INDEPENDENT_FULL_WRITE_PATH_AUDIT');
 return Object.freeze({
  schema:'mid.740.main-write-inventory.v1',repository:REPO,
  sourceMirrored,installerMirrored,manualMirrored,stableRedeployNeedsDist,sourcePushes,installerPushes,
  detectedDirectMainWrites:Object.freeze(paths),reasons:Object.freeze([...new Set(reasons)]),
  nativePolicyActivationAuthorized:false,releaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const source=readFileSync('.github/workflows/agent-source-release.yml','utf8');
  const sourceTwin=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
  const installer=readFileSync('.github/workflows/install-mid.yml','utf8');
  const installerTwin=readFileSync('ci/github/workflows/install-mid.yml','utf8');
  const installerPatch=readFileSync('workflow-patches/install-mid.yml','utf8');
  const manualDeploy=readFileSync('.github/workflows/deploy.yml','utf8');
  const manualDeployTwin=readFileSync('ci/github/workflows/deploy.yml','utf8');
  const verdict=assessMid740MainWriteInventory({source,sourceTwin,installer,installerTwin,installerPatch,manualDeploy,manualDeployTwin});
  process.stdout.write(JSON.stringify(verdict,null,2)+'\n');
  if(!verdict.sourceMirrored||!verdict.installerMirrored||!verdict.manualMirrored||
     verdict.stableRedeployNeedsDist||verdict.detectedDirectMainWrites.length)
   process.exitCode=1;
 }catch{
  process.stderr.write('MID 740 direct-main-write audit BLOCKED: missing/incomplete evidence\n');
  process.exitCode=1;
 }
}