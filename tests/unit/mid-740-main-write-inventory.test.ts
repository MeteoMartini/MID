import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessMid740MainWriteInventory as check} from '../../tools/ci/mid-740-main-write-inventory.mjs';
const fixtures=()=>({
 source:readFileSync('.github/workflows/agent-source-release.yml','utf8'),
 sourceTwin:readFileSync('ci/github/workflows/agent-source-release.yml','utf8'),
 installer:readFileSync('.github/workflows/install-mid.yml','utf8'),
 installerTwin:readFileSync('ci/github/workflows/install-mid.yml','utf8'),
 installerPatch:readFileSync('workflow-patches/install-mid.yml','utf8')
});
describe('MID #740: all known direct-main writes before native review policy',()=>{
 it('source and installer are two distinct live direct-main blockers',()=>{
  const result=check(fixtures());
  expect(result).toMatchObject({sourceMirrored:true,installerMirrored:true,
   sourcePushes:1,installerPushes:1,
   nativePolicyActivationAuthorized:false,releaseAuthorized:false});
  expect(result.detectedDirectMainWrites).toEqual([
   'agent-source-release.yml:ZIP_COMMIT_DIRECT_MAIN_PUSH',
   'install-mid.yml:POST_BUILD_DIRECT_MAIN_PUSH']);
  expect(result.reasons).toContain('UNMIGRATED_DIRECT_MAIN_WRITES');
 });
 it('migrating only the ZIP transport never clears the installer write blocker',()=>{
  const x=fixtures();
  x.source=x.source.replace('git push origin HEAD:main','echo "ZIP artifact transport"');
  x.sourceTwin=x.source;
  const result=check(x);
  expect(result).toMatchObject({sourcePushes:0,installerPushes:1,
   nativePolicyActivationAuthorized:false});
  expect(result.detectedDirectMainWrites).toEqual([
   'install-mid.yml:POST_BUILD_DIRECT_MAIN_PUSH']);
 });
 it('migrating installer only never clears the ZIP direct push',()=>{
  const x=fixtures();
  x.installer=x.installer.replace('git push origin HEAD:main','echo "installed artifacts"');
  x.installerTwin=x.installer;x.installerPatch=x.installer;
  const result=check(x);
  expect(result.detectedDirectMainWrites).toEqual([
   'agent-source-release.yml:ZIP_COMMIT_DIRECT_MAIN_PUSH']);
  expect(result.nativePolicyActivationAuthorized).toBe(false);
 });
 it('missing or different YAML mirrors refuse a trustworthy inventory',()=>{
  const x=fixtures();
  expect(check({...x,sourceTwin:''}).reasons).toContain('WORKFLOW_MIRROR_DRIFT');
  expect(check({...x,installerPatch:''}).reasons).toContain('WORKFLOW_MIRROR_DRIFT');
  expect(check({...x,installerTwin:x.installerTwin+'# unexpected'}).reasons)
   .toContain('WORKFLOW_MIRROR_DRIFT');
 });
 it('even a simulated double migration cannot authorize native policy or release',()=>{
  const x=fixtures();
  x.source=x.source.replace('git push origin HEAD:main','echo "immutable ZIP"');
  x.sourceTwin=x.source;
  x.installer=x.installer.replace('git push origin HEAD:main','echo "verified install"');
  x.installerTwin=x.installer;x.installerPatch=x.installer;
  const result=check(x);
  expect(result.detectedDirectMainWrites).toHaveLength(0);
  expect(result.reasons).toContain('NEEDS_INDEPENDENT_FULL_WRITE_PATH_AUDIT');
  expect(result.nativePolicyActivationAuthorized).toBe(false);
  expect(result.releaseAuthorized).toBe(false);
 });
});