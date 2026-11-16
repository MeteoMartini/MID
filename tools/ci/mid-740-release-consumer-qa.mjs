/** MID #740: read-only inventory of legacy downstream release consumers.
 * Explicitly NOT a release gate, attestation or authorization mechanism.
 * The two direct main writes are audited separately in mid-740-main-write-inventory.
 */
const valid = value => typeof value === 'string' && value.length > 0;
const count = (text, pattern) => [...text.matchAll(pattern)].length;
const REPO = 'MeteoMartini/MID';

export function assessMid740ReleaseConsumers({sourceBot, installer, installerTwin, manualDeploy,
  manualDeployTwin, chainObserver, phaseObserver, releasePlanTest} = {}) {
  const inputs = {sourceBot, installer, installerTwin, manualDeploy, manualDeployTwin,
    chainObserver, phaseObserver, releasePlanTest};
  const missingInputs = Object.entries(inputs).filter(([, value]) => !valid(value)).map(([key]) => key);
  if (missingInputs.length) return Object.freeze({
    schema: 'mid.740.release-consumer-qa.v1', repository: REPO,
    status: 'BLOCKED_MISSING_INPUT', missingInputs: Object.freeze(missingInputs),
    legacyConsumers: Object.freeze({}), unverifiedDependencies: Object.freeze([]),
    nativePolicyActivationAuthorized: false, recoveryAuthorized: false, releaseAuthorized: false
  });

  // Every property represents a CURRENT, separately migratable consumer of the
  // legacy source -> ZIP commit -> installed dist commit lineage.
  const legacyConsumers = Object.freeze({
    botDispatchUsesPackageCommit: sourceBot.includes('gh workflow run install-mid.yml') &&
      sourceBot.includes('-f expected_package_sha="$EXPECTED_PACKAGE_SHA"'),
    installerPackageShaInput: installer.includes('expected_package_sha:') &&
      installer.includes('EXPECTED_PACKAGE_SHA') && installer.includes('EVENT_SHA'),
    installerZipFromGitCheckout: installer.includes('archive="MID-professional-replacement.zip"'),
    workerUsesInstallCommit: /deploy_worker:[\s\S]*?ref:\s*\$\{\{\s*needs\.install_build\.outputs\.commit_sha\s*\}\}/.test(installer),
    pagesRetriesUseInstallCommitAndDist: count(installer, /ref:\s*\$\{\{\s*needs\.install_build\.outputs\.commit_sha\s*\}\}/g) >= 2 &&
      count(installer, /test -f dist\/index\.html/g) >= 3,
    manualStableRedeployUsesCommittedDist: manualDeploy.includes('mid-stable') &&
      count(manualDeploy, /test -f dist\/index\.html/g) >= 3,
    chainObserverRequiresThreeCommits: chainObserver.includes('packageCommit.parents[0]?.sha!==mergeCommit.sha') &&
      chainObserver.includes('stableCommit.parents[0]?.sha!==packageCommit.sha') &&
      chainObserver.includes('installerRun?.head_sha!==packageCommit.sha'),
    phaseObserverNamesLegacyPackageCommit: phaseObserver.includes('Vollständig geprüften Release sammeln und committen'),
    releasePlanTestPinsPackageSha: releasePlanTest.includes('expected_package_sha') &&
      releasePlanTest.includes('EXPECTED_PACKAGE_SHA')
  });
  const unverifiedDependencies = Object.entries(legacyConsumers)
    .filter(([, value]) => !value).map(([key]) => key);
  const mirrorDrift = installer !== installerTwin || manualDeploy !== manualDeployTwin;
  return Object.freeze({
    schema: 'mid.740.release-consumer-qa.v1', repository: REPO,
    status: mirrorDrift ? 'BLOCKED_MIRROR_DRIFT' : unverifiedDependencies.length ?
      'BLOCKED_INCOMPLETE_LEGACY_INVENTORY' : 'LEGACY_CONSUMERS_CONFIRMED',
    missingInputs: Object.freeze([]), mirrorDrift,
    legacyConsumers, unverifiedDependencies: Object.freeze(unverifiedDependencies),
    // Even successful discovery, or simulated removal of every legacy consumer,
    // cannot prove authenticated artifact provenance or native merge-time review.
    nativePolicyActivationAuthorized: false, recoveryAuthorized: false, releaseAuthorized: false
  });
}
