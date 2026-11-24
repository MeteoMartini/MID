// Read-only audit of a failed MID installer. Runs with a read-only GitHub CLI identity.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assessFailedReleaseEvidence} from './failed-release-evidence.mjs';

const repo = 'repos/MeteoMartini/MID';
const sha = /^[a-f0-9]{40}$/;
const runId = /^[1-9][0-9]{0,15}$/;
const read = path => JSON.parse(execFileSync('gh', ['api', '--method', 'GET', repo + '/' + path], {
  encoding: 'utf8', timeout: 20_000, maxBuffer: 10_000_000, stdio: ['ignore', 'pipe', 'pipe'],
}));

export async function auditFailedRelease({expectedMain, expectedStable, installerId}, get = read) {
  if (!sha.test(expectedMain ?? '') || !sha.test(expectedStable ?? '') || !runId.test(installerId ?? '')) {
    throw new Error('Expected two full SHAs and an installer run ID');
  }
  const refs = async () => {
    const [main, stable] = await Promise.all(['main', 'mid-stable'].map(branch => get('git/ref/heads/' + branch)));
    return {main: main.object?.sha, stable: stable.object?.sha};
  };
  const before = await refs();
  if (before.main !== expectedMain || before.stable !== expectedStable) throw new Error('Live refs differ from expected SHAs');
  const [packet, run, installerRuns] = await Promise.all([
    get('commits/' + expectedMain),
    get('actions/runs/' + installerId),
    get('actions/workflows/install-mid.yml/runs?per_page=100&head_sha=' + expectedMain),
  ]);
  if (String(run.id) !== installerId || !sha.test(packet.parents?.[0]?.sha ?? '')) {
    throw new Error('Installer or package identity mismatch');
  }
  if (!Number.isSafeInteger(run.run_attempt) || run.run_attempt < 1 || run.run_attempt > 10) {
    throw new Error('Installer attempt history outside audit bounds');
  }
  const [source, ...attempts] = await Promise.all([
    get('commits/' + packet.parents[0].sha),
    ...Array.from({length: run.run_attempt}, (_, index) =>
      get('actions/runs/' + installerId + '/attempts/' + (index + 1) + '/jobs?per_page=100')),
  ]);
  const finalRun = await get('actions/runs/' + installerId);
  const finalRefs = await refs();
  if (['id', 'run_attempt', 'status', 'conclusion', 'head_sha', 'path', 'event', 'head_branch']
    .some(key => finalRun[key] !== run[key])) {
    throw new Error('Installer run changed during audit');
  }
  return assessFailedReleaseEvidence({...before, finalRefs, packet, source, run, attempts, installerRuns});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [expectedMain, expectedStable, installerId] = process.argv.slice(2);
  try {
    const result = await auditFailedRelease({expectedMain, expectedStable, installerId});
    console.log(JSON.stringify(result));
    if (!result.eligibleForReview) process.exitCode = 1;
  } catch {
    console.error('Release audit stopped: GitHub evidence, expected refs or credentials could not be verified.');
    process.exitCode = 1;
  }
}
