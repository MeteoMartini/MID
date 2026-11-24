// Read the original installer attempt without changing release or GitHub state.
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {assessPostInstallEvidence} from './post-install-recovery-evidence.mjs';

const sha = /^[a-f0-9]{40}$/;
const read = path => JSON.parse(execFileSync('gh', [
  'api', '--method', 'GET', 'repos/MeteoMartini/MID/' + path,
], {encoding: 'utf8', timeout: 20_000, maxBuffer: 10_000_000, stdio: ['ignore', 'pipe', 'pipe']}));

export async function auditPostInstallRecovery({main, stable, installerId}, get = read) {
  if (!sha.test(main ?? '') || !sha.test(stable ?? '') || !/^[1-9][0-9]{0,15}$/.test(installerId ?? '')) {
    throw new Error('Expected two full branch SHAs and an installer run ID');
  }
  const refs = async () => {
    const [mainRef, stableRef] = await Promise.all([
      get('git/ref/heads/main'), get('git/ref/heads/mid-stable'),
    ]);
    return {main: mainRef.object?.sha, stable: stableRef.object?.sha};
  };
  const start = await refs();
  if (start.main !== main || start.stable !== stable) throw new Error('Branch heads changed');
  const [installed, run, inventory, lineage] = await Promise.all([
    get('commits/' + main),
    get('actions/runs/' + installerId),
    get('actions/runs/' + installerId + '/attempts/1/jobs?per_page=100'),
    get('compare/' + stable + '...' + main),
  ]);
  const packetSha = installed.parents?.[0]?.sha;
  if (installed.sha !== main || String(run.id) !== installerId || !sha.test(packetSha ?? '')) {
    throw new Error('Original installer or package identity does not match');
  }
  const packet = await get('commits/' + packetSha);
  const latest = await get('actions/runs/' + installerId);
  if (latest.id !== run.id || latest.run_attempt !== run.run_attempt ||
      latest.status !== run.status || latest.conclusion !== run.conclusion) {
    throw new Error('Installer attempt changed during audit');
  }
  return assessPostInstallEvidence({installed, packet, stable, lineage, run, inventory, finalRefs: await refs()});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [main, stable, installerId] = process.argv.slice(2);
  try {
    const result = await auditPostInstallRecovery({main, stable, installerId});
    console.log(JSON.stringify(result));
    if (!result.evidenceComplete) process.exitCode = 1;
  } catch (error) {
    console.error('Post-install audit stopped: GitHub evidence or branch identity could not be verified.');
    process.exitCode = 1;
  }
}
