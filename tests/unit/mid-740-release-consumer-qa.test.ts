import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessMid740ReleaseConsumers} from '../../tools/ci/mid-740-release-consumer-qa.mjs';
const read=(path:string)=>readFileSync(path,'utf8');
const fixtures=()=>({
  sourceBot:read('.github/workflows/agent-source-release.yml'),
  installer:read('.github/workflows/install-mid.yml'),
  installerTwin:read('ci/github/workflows/install-mid.yml'),
  manualDeploy:read('.github/workflows/deploy.yml'),
  manualDeployTwin:read('ci/github/workflows/deploy.yml'),
  chainObserver:read('tools/ci/release-chain-integrity.mjs'),
  phaseObserver:read('tools/ci/release-phase-observation.mjs'),
  releasePlanTest:read('scripts/test-release-train-plan-0985376.mjs')
});
describe('MID #740 legacy release-consumer cutover inventory (QA-only)',()=>{
  it('records all nine independent consumers before cutover',()=>{
    const result=assessMid740ReleaseConsumers(fixtures());
    expect(result.status).toBe('LEGACY_CONSUMERS_CONFIRMED');
    expect(Object.keys(result.legacyConsumers)).toHaveLength(9);
    expect(Object.values(result.legacyConsumers)).toEqual(Array(9).fill(true));
    expect(result.unverifiedDependencies).toEqual([]);
    expect(result.releaseAuthorized).toBe(false);
    expect(result.nativePolicyActivationAuthorized).toBe(false);
  });
  it('partial ZIP migration without installer migration is never authorization',()=>{
    const x=fixtures();
    x.sourceBot=x.sourceBot.replace('-f expected_package_sha="$EXPECTED_PACKAGE_SHA"', '-f artifact_id="$ARTIFACT_ID"');
    const result=assessMid740ReleaseConsumers(x);
    expect(result.status).toBe('BLOCKED_INCOMPLETE_LEGACY_INVENTORY');
    expect(result.unverifiedDependencies).toContain('botDispatchUsesPackageCommit');
    expect(result.legacyConsumers.installerZipFromGitCheckout).toBe(true);
    expect(result.releaseAuthorized).toBe(false);
  });
  it('missing manual or Pages dist recovery is detected independently',()=>{
    const x=fixtures();
    x.manualDeploy=x.manualDeploy.replaceAll('test -f dist/index.html','echo missing');
    x.manualDeployTwin=x.manualDeploy;
    x.installer=x.installer.replaceAll('test -f dist/index.html','echo missing');
    x.installerTwin=x.installer;
    const result=assessMid740ReleaseConsumers(x);
    expect(result.unverifiedDependencies).toContain('manualStableRedeployUsesCommittedDist');
    expect(result.unverifiedDependencies).toContain('pagesRetriesUseInstallCommitAndDist');
    expect(result.recoveryAuthorized).toBe(false);
  });
  it('old read-only lineage observer and workflow mirrors cannot silently drift',()=>{
    const x=fixtures();
    x.chainObserver=x.chainObserver.replace('stableCommit.parents[0]?.sha!==packageCommit.sha','true');
    expect(assessMid740ReleaseConsumers(x).unverifiedDependencies).toContain('chainObserverRequiresThreeCommits');
    x.chainObserver=fixtures().chainObserver;
    x.installerTwin+='\n# divergent mirror';
    expect(assessMid740ReleaseConsumers(x).status).toBe('BLOCKED_MIRROR_DRIFT');
  });
  it('invalid evidence, or synthetic disappearance of a legacy consumer, cannot grant release',()=>{
    const base=fixtures();
    expect(assessMid740ReleaseConsumers({...base,phaseObserver:''}).status).toBe('BLOCKED_MISSING_INPUT');
    const x=fixtures();
    x.releasePlanTest='synthetic new provenance';
    const result=assessMid740ReleaseConsumers(x);
    expect(result.unverifiedDependencies).toContain('releasePlanTestPinsPackageSha');
    expect(result.nativePolicyActivationAuthorized).toBe(false);
    expect(result.recoveryAuthorized).toBe(false);
    expect(result.releaseAuthorized).toBe(false);
  });
});
