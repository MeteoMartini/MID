// Evidence classifier for an installer that wrote main before Pages failed.
// Its inputs must be fetched from GitHub by the caller. This result does not
// replace live Pages/Worker provenance checks or authorize a release.
const sha = /^[a-f0-9]{40}$/;
const bot = 'mid-release-bot-meteomartini[bot]';
const installJob = 'Vollständig geprüften Release sammeln und committen';
const workerJob = 'Geprüften MID-Worker sicher automatisch veröffentlichen';
const finalizer = 'Erfolgreichen Pages-/Worker-Release finalisieren';

export function assessPostInstallEvidence({installed, packet, stable, lineage, run, inventory, finalRefs} = {}) {
  const result = (reason, evidenceComplete = false) => ({
    reason, evidenceComplete, mergeAuthorized: false, releaseAuthorized: false,
  });
  if (![installed?.sha, packet?.sha, stable].every(value => sha.test(value ?? '')) ||
      new Set([installed.sha, packet.sha, stable]).size !== 3 ||
      finalRefs?.main !== installed.sha || finalRefs?.stable !== stable ||
      lineage?.status !== 'ahead' || lineage.base_commit?.sha !== stable ||
      lineage.merge_base_commit?.sha !== stable) return result('REF_OR_ANCESTRY_MISMATCH');
  if (installed.author?.login !== bot || installed.committer?.login !== bot ||
      installed.parents?.length !== 1 || installed.parents[0].sha !== packet.sha ||
      !/^Install MID v\d+(?:\.\d+){3}$/.test(installed.commit?.message?.trim()) ||
      !installed.files?.some(f => f.filename === 'MID-professional-replacement.zip' && f.status === 'removed') ||
      packet.author?.login !== bot || packet.committer?.login !== bot ||
      packet.parents?.length !== 1 ||
      packet.files?.length !== 1 || packet.files[0].filename !== 'MID-professional-replacement.zip' ||
      !['added', 'modified'].includes(packet.files[0].status)) return result('UNEXPECTED_INSTALL_CHAIN');
  if ((!Number.isSafeInteger(run?.id) || run.id <= 0) || run?.path !== '.github/workflows/install-mid.yml' ||
      run.head_repository?.full_name !== 'MeteoMartini/MID' ||
      run.head_sha !== packet.sha || run.head_branch !== 'main' ||
      run.event !== 'workflow_dispatch' || run.run_attempt !== 1 ||
      run.status !== 'completed' || run.conclusion !== 'failure') return result('UNEXPECTED_INSTALL_RUN');
  const jobs = inventory?.jobs;
  if (!Array.isArray(jobs) || jobs.length !== inventory.total_count ||
      new Set(jobs.map(j => j.id)).size !== jobs.length ||
      jobs.some(j => !Number.isSafeInteger(j.id) || j.id <= 0 || j.run_id !== run.id ||
        j.run_attempt !== run.run_attempt || j.head_sha !== packet.sha || j.status !== 'completed' ||
        !['success','failure','skipped'].includes(j.conclusion))) return result('INCOMPLETE_JOBS');
  const exact = name => {
    const matches = jobs.filter(j => j.name === name);
    return matches.length === 1 ? matches[0] : undefined;
  };
  const isStep = (job, name, status) => {
    const steps = job?.steps?.filter(step => step.name === name) ?? [];
    return steps.length === 1 && steps[0].conclusion === status;
  };
  const installedJob = exact(installJob);
  const core = jobs.filter(j => j.name.startsWith('Release-Core-Regression · '));
  const heavy = jobs.filter(j => j.name.startsWith('Release-Heavy · '));
  if (exact('Release-ZIP prüfen und immutable Snapshot vorbereiten')?.conclusion !== 'success' ||
      exact('Release-Core, Build, Audit und iOS prüfen')?.conclusion !== 'success' ||
      core.length !== 4 || heavy.length !== 6 ||
      [...core, ...heavy].some(j => j.conclusion !== 'success') ||
      installedJob?.conclusion !== 'success' ||
      !isStep(installedJob, 'Neue MID-Version committen', 'success') ||
      exact(workerJob)?.conclusion !== 'success') return result('RELEASE_VERIFICATION_INCOMPLETE');
  for (const attempt of [1, 2, 3]) {
    const job = exact('MID auf GitHub Pages veröffentlichen · Versuch ' + attempt);
    if (attempt === 1 ? job?.conclusion !== 'skipped' || !Array.isArray(job.steps) || job.steps.length !== 0 :
      job?.conclusion !== 'failure' ||
      !isStep(job, 'Frischen Fast-Snapshot aus dem aktiven Pages-Artefakt erhalten', 'failure') ||
      !isStep(job, 'GitHub-Pages-Deployment · Versuch ' + attempt, 'skipped')) {
      return result('PAGES_SIDE_EFFECT_UNKNOWN');
    }
  }
  if (exact(finalizer)?.conclusion !== 'skipped' ||
      exact('SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren')?.conclusion !== 'skipped') {
    return result('FINALIZATION_SIDE_EFFECT_UNKNOWN');
  }
  return result('POST_INSTALL_PRE_PAGES_FAILURE', true);
}
