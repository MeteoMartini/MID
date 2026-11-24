import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const worker = 'mid-logicc-write';
const baselineVersion = 'c92c57f2-e52e-48b0-a790-0a47a8e43566';
const baselineDeployment = '39d373f2-f1c5-4e53-b64d-31e8c05dbe4c';
const compatibilityDate = '2026-11-24';
const expectedHash = '2d8544bc4298f3445884e46151f41176b87e80348c9ff9ce439e215bf1cdacd4';
const secretNames = ['MID_GITHUB_APP_PRIVATE_KEY', 'MID_WRITE_GATEWAY_KEY'];
const versionTag = 'logicc-0.1.1-' + expectedHash.slice(0, 16);
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

class UploadCheckError extends Error {}

function requireCondition(condition, message) {
  if (!condition) throw new UploadCheckError(message);
}

function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

// The exact Workers Version GET schema documents omitted compatibility_flags
// as zero explicitly configured flags. This is NOT a default for other APIs.
export function verifySettings(version, {versionResponse = false} = {}) {
  const flags = version?.compatibility_flags;
  requireCondition(version?.compatibility_date === compatibilityDate &&
    ((versionResponse && !Object.hasOwn(version, 'compatibility_flags')) ||
      (Array.isArray(flags) && flags.length === 0)), 'Compatibility settings drift.');
  requireCondition(version.usage_model === 'standard', 'Usage model drift or missing evidence.');
  const names = Array.isArray(version.bindings) ? version.bindings.filter(binding => binding?.type === 'secret_text')
    .map(binding => binding.name).sort() : null;
  requireCondition(version.bindings?.length === secretNames.length &&
    JSON.stringify(names) === JSON.stringify(secretNames), 'Bindings drift.');
}

export function verifyModule(version, id, sha, bytes) {
  const module = version?.modules?.[0];
  requireCondition(version?.id === id && version.annotations?.['workers/tag'] === versionTag &&
    version.annotations?.['workers/message'] === 'MID SHA ' + sha &&
    version.main_module === 'worker.mjs' && Array.isArray(version.modules) && version.modules.length === 1 &&
    module?.name === 'worker.mjs' && module.content_type === 'application/javascript+module' &&
    typeof module.content_base64 === 'string' && module.content_base64 === bytes.toString('base64') &&
    hash(bytes) === expectedHash, 'Uploaded version readback does not match the approved artifact.');
}
export async function upload({env = process.env, fetcher = globalThis.fetch} = {}) {
  const account = env.LOGICC_CF_ACCOUNT_ID;
  const token = env.LOGICC_CF_VERSION_TOKEN;
  const ghToken = env.GH_TOKEN;
  const sha = env.GITHUB_SHA;
  requireCondition(ghToken && /^[0-9a-f]{40}$/.test(sha ?? ''), 'Missing released SHA context.');
  requireCondition(/^[a-f0-9]{32}$/i.test(account ?? '') && token,
    'Protected environment credentials are missing or invalid.');
  const bytes = await readFile(new URL('./worker.mjs', import.meta.url));
  requireCondition(hash(bytes) === expectedHash, 'Worker SHA-256 differs from approved artifact.');
  const base = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/workers/';
  const versions = 'workers/' + worker + '/versions';
  const script = 'scripts/' + worker;

  async function request(path, body) {
    const method = body ? 'POST' : 'GET';
    const response = await fetcher(base + path, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(25_000),
    });
    requireCondition(response.ok, method + ' failed with HTTP ' + response.status + '.');
    const payload = await response.json();
    requireCondition(payload.success === true && payload.result, method + ' failed at Cloudflare.');
    return payload.result;
  }

  async function verifyAllocation() {
    const { deployments } = await request(script + '/deployments');
    const active = deployments?.[0];
    requireCondition(active?.id === baselineDeployment && active.versions?.length === 1 &&
      active.versions[0].version_id === baselineVersion && active.versions[0].percentage === 100,
      'Active deployment differs from the recorded 100% baseline.');
    const subdomain = await request(script + '/subdomain');
    requireCondition(subdomain.enabled === true && subdomain.previews_enabled === false,
      'Worker subdomain or preview configuration drift.');
  }

  async function verifyRefs() {
    for (const branch of ['main', 'mid-stable']) {
      const response = await fetcher('https://api.github.com/repos/MeteoMartini/MID/git/ref/heads/' + branch, {
        headers: { Authorization: 'Bearer ' + ghToken, Accept: 'application/vnd.github+json' },
        redirect: 'error', signal: AbortSignal.timeout(15_000),
      });
      requireCondition(response.ok, 'GitHub ref read failed.');
      const ref = await response.json();
      requireCondition(ref.ref === 'refs/heads/' + branch && ref.object?.type === 'commit' &&
        ref.object.sha === sha, 'Released SHA drift.');
    }
  }
  await verifyRefs();
  await verifyAllocation();
  const baseline = await request(versions + '/' + baselineVersion + '?include=modules');
  requireCondition(baseline.id === baselineVersion, 'Baseline version identity drift.');
  verifySettings(baseline, {versionResponse: true});
  verifySettings(await request(script + '/settings'));
  requireCondition(baseline.main_module === 'worker.mjs' && Array.isArray(baseline.modules) &&
    baseline.modules.length === 1 && baseline.modules[0]?.name === 'worker.mjs' &&
    baseline.modules[0]?.content_type === 'application/javascript+module' &&
    typeof baseline.modules[0]?.content_base64 === 'string' && baseline.modules[0].content_base64.length > 0,
    'Baseline module readback missing.');
  const recent = await request(versions + '?per_page=10');
  requireCondition(Array.isArray(recent) && recent[0]?.id === baselineVersion,
    'Newest upload differs from the baseline. Reconcile Cloudflare history before running.');
  await verifyAllocation();
  verifySettings(await request(script + '/settings'));
  await verifyRefs();
  const created = await request(versions + '?deploy=false', {
    annotations: { 'workers/tag': versionTag, 'workers/message': 'MID SHA ' + sha },
    compatibility_date: compatibilityDate,
    compatibility_flags: [],
    usage_model: 'standard',
    bindings: secretNames.map(name => ({ type: 'inherit', name, version_id: baselineVersion })),
    main_module: 'worker.mjs',
    modules: [{ name: 'worker.mjs', content_type: 'application/javascript+module',
      content_base64: bytes.toString('base64') }],
  });
  requireCondition(uuid.test(created.id ?? '') && created.id !== baselineVersion,
    'Upload response has no new version ID. Reconcile Cloudflare history.');
  console.log('Cloudflare upload returned version ' + created.id);
  const readback = await request(versions + '/' + created.id + '?include=modules');
  verifySettings(readback, {versionResponse: true});
  verifyModule(readback, created.id, sha, bytes);
  await verifyAllocation();
  verifySettings(await request(script + '/settings'));
  await verifyRefs();
  console.log('Verified upload ' + created.id + ' SHA-256 ' + expectedHash +
    ' with baseline deployment ' + baselineDeployment + ' still at 100%.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) upload().catch(error => {
  if (error instanceof UploadCheckError) console.error(error.message);
  console.error('Logicc upload stopped. Check prior sanitized evidence and Cloudflare version history before any rerun.');
  process.exitCode = 1;
});
