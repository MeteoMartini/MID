const sha = /^[0-9a-f]{40}$/;
const zipPath = 'MID-professional-replacement.zip';
const installerPath = '.github/workflows/install-mid.yml';
const bot = 'mid-release-bot-meteomartini[bot]';
const noDeployment = [
  'Vollständig geprüften Release sammeln und committen',
  'Geprüften MID-Worker sicher automatisch veröffentlichen',
  'MID auf GitHub Pages veröffentlichen · Versuch 1',
  'MID auf GitHub Pages veröffentlichen · Versuch 2',
  'MID auf GitHub Pages veröffentlichen · Versuch 3',
  'Erfolgreichen Pages-/Worker-Release finalisieren',
];

// Diagnostic only. Inputs must be independently read from GitHub; JSON alone
// is neither authenticated evidence nor authority to merge or deploy.
export function assessFailedReleaseEvidence({main, stable, finalRefs, source, packet, run, jobs, installerRuns} = {}) {
  const result = (eligibleForReview, reason) => ({eligibleForReview, reason, mergeAuthorized: false, releaseAuthorized: false});
  if (![main, stable, source?.sha, packet?.sha].every(value => sha.test(value ?? '')) ||
      new Set([main, stable, source.sha]).size !== 3 || packet.sha !== main ||
      finalRefs?.main !== main || finalRefs?.stable !== stable) {
    return result(false, 'REF_MISMATCH');
  }
  if (packet.parents?.length !== 1 || packet.parents[0]?.sha !== source.sha ||
      packet.author?.login !== bot || packet.committer?.login !== bot ||
      packet.files?.length !== 1 || packet.files[0]?.filename !== zipPath ||
      !['added', 'modified'].includes(packet.files[0]?.status) ||
      source.parents?.length !== 1 || source.parents[0]?.sha !== stable) {
    return result(false, 'UNEXPECTED_LINEAGE');
  }
  if (!run || run.path !== installerPath || run.head_branch !== 'main' ||
      run.head_sha !== main || run.event !== 'workflow_dispatch' ||
      run.status !== 'completed' || run.conclusion !== 'failure' ||
      !Number.isSafeInteger(run.id) || run.id < 1 || run.run_attempt !== 1) {
    return result(false, 'UNEXPECTED_INSTALLER_RUN');
  }
  // A retry can have earlier attempts with side effects. This initial checker
  // only qualifies complete first attempts and the normal skipped bot push.
  const runs = installerRuns?.workflow_runs;
  if (!Array.isArray(runs) || runs.length !== installerRuns.total_count ||
      runs.filter(item => item.id === run.id && item.run_attempt === run.run_attempt && item.conclusion === 'failure').length !== 1 ||
      runs.some(item => item.id !== run.id && !(item.head_sha === main &&
        item.event === 'push' && item.status === 'completed' && item.conclusion === 'skipped'))) {
    return result(false, 'COMPETING_OR_INCOMPLETE_INSTALLER_HISTORY');
  }
  const entries = jobs?.jobs;
  if (!Array.isArray(entries) || entries.length !== jobs.total_count ||
      new Set(entries.map(job => job?.id)).size !== entries.length ||
      entries.some(job => !Number.isSafeInteger(job?.id) || job.run_id !== run.id ||
        job.status !== 'completed' || !['success', 'failure', 'skipped'].includes(job.conclusion))) {
    return result(false, 'INCOMPLETE_JOB_INVENTORY');
  }
  for (const name of noDeployment) {
    const matches = entries.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].conclusion !== 'skipped' || matches[0].steps?.length) {
      return result(false, 'DEPLOYMENT_STARTED_OR_UNVERIFIED');
    }
  }
  if (!entries.some(job => job.conclusion === 'failure' &&
    /^Release-(Core|Heavy)\b/.test(job.name))) {
    return result(false, 'NO_PREDEPLOY_VERIFICATION_FAILURE');
  }
  return result(true, 'PREDEPLOY_FAILURE_CONFIRMED');
}
