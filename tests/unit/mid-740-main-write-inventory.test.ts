import {describe,it,expect} from 'vitest';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assessMid740MainWriteInventory as check} from '../../tools/ci/mid-740-main-write-inventory.mjs';
const fixtures=()=>({
 source:readFileSync('.github/workflows/agent-source-release.yml','utf8'),
 sourceTwin:readFileSync('ci/github/workflows/agent-source-release.yml','utf8'),
 installer:readFileSync('.github/workflows/install-mid.yml','utf8'),
 installerTwin:readFileSync('ci/github/workflows/install-mid.yml','utf8'),
 installerPatch:readFileSync('workflow-patches/install-mid.yml','utf8'),
 manualDeploy:readFileSync('.github/workflows/deploy.yml','utf8'),
 manualDeployTwin:readFileSync('ci/github/workflows/deploy.yml','utf8')
});

describe('MID #740 legacy producer shadow',()=>{
 it('stages the exact committed ZIP before legacy Installer dispatch, preserving fail-closed provenance',()=>{
  const workflow=fixtures().source;
  const stage=workflow.split('id: release_shadow\n')[1]
   ?.split('      - name: Original-ZIP und Zuordnung')[0];
  const script=stage?.split('        run: |\n')[1]?.replace(/^ {10}/gm,'');
  expect(script).toBeTruthy();
  expect(stage).toContain("if: steps.package.outcome == 'success'");
  expect(stage).not.toContain('steps.installer_dispatch.outcome');
  expect(stage).toContain('continue-on-error: true');
  expect(workflow.indexOf('id: release_shadow')).toBeLessThan(workflow.indexOf('id: source_shadow_upload'));
  expect(workflow.indexOf('id: source_shadow_upload')).toBeLessThan(workflow.indexOf('id: installer_dispatch'));
  expect(workflow.indexOf('git push origin HEAD:main')).toBeLessThan(workflow.indexOf('id: release_shadow'));
  expect(workflow).toContain('gh workflow run install-mid.yml --repo');
  expect(workflow).toContain("if: steps.release_shadow.outcome == 'success'\n        continue-on-error: true");
  const dir=mkdtempSync(join(tmpdir(),'mid740-producer-shadow-test-'));
  try{
   const runnerTemp=join(dir,'runner');
   mkdirSync(runnerTemp);
   const git=(...args:string[])=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
   git('init','-q');
   git('config','user.name','Test');
   git('config','user.email','test@example.invalid');
   git('commit','-q','--allow-empty','-m','source');
   const source=git('rev-parse','HEAD');
   const filename='MID-professional-replacement.zip';
   const original=Buffer.from('ZIP fixture bytes');
   writeFileSync(join(dir,filename),original);
   git('add',filename);
   git('commit','-qm','package');
   const pkg=git('rev-parse','HEAD');
   writeFileSync(join(dir,filename),'unrelated local worktree bytes');
   const output=join(runnerTemp,'outputs');
   const env={...process.env,RUNNER_TEMP:runnerTemp,GITHUB_OUTPUT:output,PACKAGE_SHA:pkg,
    SOURCE_MERGE_SHA:source,WORKFLOW_SHA:source,SOURCE_GATE_ID:'123',SOURCE_GATE_ATTEMPT:'1',
    GITHUB_RUN_ID:'456',GITHUB_RUN_ATTEMPT:'1'};
   const run=(overrides:Record<string,string>={})=>spawnSync('bash',['-c',script!],
    {cwd:dir,env:{...env,...overrides},encoding:'utf8'});
   const first=run();
   expect(first.status,first.stderr).toBe(0);
   const artifact=readFileSync(output,'utf8').trim().replace(/^directory=/,'');
   expect(readdirSync(artifact).sort()).toEqual([filename,'provenance.json']);
   expect(readFileSync(join(artifact,filename))).toEqual(original);
   expect(JSON.parse(readFileSync(join(artifact,'provenance.json'),'utf8'))).toMatchObject({
    packageCommitSha:pkg,sourceMergeSha:source,workflowSha:source,
    zipSha256:createHash('sha256').update(original).digest('hex'),
    producerRunId:456,producerRunAttempt:1,sourceGateRunId:123,sourceGateRunAttempt:1,
    installerAuthorized:false,releaseAuthorized:false
   });
   expect(run({SOURCE_MERGE_SHA:pkg}).status).not.toBe(0);
   expect(run({SOURCE_GATE_ATTEMPT:'0'}).status).not.toBe(0);
   writeFileSync(join(dir,'unexpected'),'extra change');
   git('add','unexpected');
   git('commit','-qm','unrelated commit');
   expect(run({PACKAGE_SHA:git('rev-parse','HEAD'),SOURCE_MERGE_SHA:pkg}).status).not.toBe(0);
   expect(readdirSync(runnerTemp).sort()).toEqual([artifact.split('/').pop(),'outputs'].sort());
  }finally{rmSync(dir,{recursive:true,force:true})}
 });
});
describe('MID #740: all known direct-main writes before native review policy',()=>{
 it('source and installer are two distinct live direct-main blockers',()=>{
  const result=check(fixtures());
  expect(result).toMatchObject({sourceMirrored:true,installerMirrored:true,
   sourcePushes:1,installerPushes:1,manualMirrored:true,stableRedeployNeedsDist:true,
   nativePolicyActivationAuthorized:false,releaseAuthorized:false});
  expect(result.detectedDirectMainWrites).toEqual([
   'agent-source-release.yml:ZIP_COMMIT_DIRECT_MAIN_PUSH',
   'install-mid.yml:POST_BUILD_DIRECT_MAIN_PUSH']);
  expect(result.reasons).toContain('UNMIGRATED_DIRECT_MAIN_WRITES');
  expect(result.reasons).toContain('STABLE_REDEPLOY_REQUIRES_PERSISTENT_DIST');
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
  expect(check({...x,manualDeployTwin:x.manualDeployTwin+'# unexpected'}).reasons)
   .toContain('MANUAL_DEPLOY_MIRROR_DRIFT');
 });
 it('even a simulated double migration cannot authorize native policy or release',()=>{
  const x=fixtures();
  x.source=x.source.replace('git push origin HEAD:main','echo "immutable ZIP"');
  x.sourceTwin=x.source;
  x.installer=x.installer.replace('git push origin HEAD:main','echo "verified install"');
  x.installerTwin=x.installer;x.installerPatch=x.installer;
  const result=check(x);
  expect(result.detectedDirectMainWrites).toHaveLength(0);
  expect(result.stableRedeployNeedsDist).toBe(true);
  expect(result.reasons).toContain('STABLE_REDEPLOY_REQUIRES_PERSISTENT_DIST');
  expect(result.reasons).toContain('NEEDS_INDEPENDENT_FULL_WRITE_PATH_AUDIT');
  expect(result.nativePolicyActivationAuthorized).toBe(false);
  expect(result.releaseAuthorized).toBe(false);
 });
});
