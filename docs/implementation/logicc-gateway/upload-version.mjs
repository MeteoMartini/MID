import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

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

function verifySettings(version) {
  requireCondition(version.compatibility_date?.split('T')[0] === compatibilityDate &&
    version.compatibility_flags?.length === 0, 'Compatibility settings drift.');
  const names = version.bindings?.filter(binding => binding.type === 'secret_text')
    .map(binding => binding.name).sort();
  requireCondition(version.bindings?.length === secretNames.length &&
    JSON.stringify(names) === JSON.stringify(secretNames), 'Bindings drift.');
}

async function upload() {
  const account = process.env.LOGICC_CF_ACCOUNT_ID;
  const token = process.env.LOGICC_CF_VERSION_TOKEN;
  requireCondition(/^[a-f0-9]{32}$/i.test(account ?? '') && token,
    'Protected environment credentials are missing or invalid.');
  const bytes = await readFile(new URL('./worker.mjs', import.meta.url));
  requireCondition(hash(bytes) === expectedHash, 'Worker SHA-256 differs from approved artifact.');
  const base = 'https://api.cloudflare.com/client/v4/accounts/' + account + '/workers/';
  const versions = 'workers/' + worker + '/versions';
  const script = 'scripts/' + worker;

  async function request(path, body) {
    const method = body ? 'POST' : 'GET';
    const response = await fetch(base + path, {
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
    requireCondition(subdomain.previews_enabled === false, 'Worker previews are enabled or unknown.');
  }

  await verifyAllocation();
  verifySettings(await request(versions + '/' + baselineVersion));
  const recent = await request(versions + '?per_page=10');
  requireCondition(Array.isArray(recent) && recent[0]?.id === baselineVersion,
    'Newest upload differs from the baseline. Reconcile Cloudflare history before running.');
  const created = await request(versions + '?deploy=false', {
    annotations: { 'workers/tag': versionTag, 'workers/message': 'MID SHA ' + process.env.GITHUB_SHA },
    compatibility_date: compatibilityDate,
    compatibility_flags: [],
    bindings: secretNames.map(name => ({ type: 'inherit', name, version_id: baselineVersion })),
    main_module: 'worker.mjs',
    modules: [{ name: 'worker.mjs', content_type: 'application/javascript+module',
      content_base64: bytes.toString('base64') }],
  });
  requireCondition(uuid.test(created.id ?? '') && created.id !== baselineVersion,
    'Upload response has no new version ID. Reconcile Cloudflare history.');
  console.log('Cloudflare upload returned version ' + created.id);
  const readback = await request(versions + '/' + created.id);
  verifySettings(readback);
  requireCondition(readback.id === created.id && readback.annotations?.['workers/tag'] === versionTag &&
    readback.main_module === 'worker.mjs' && readback.modules?.length === 1 &&
    readback.modules[0].name === 'worker.mjs' &&
    hash(Buffer.from(readback.modules[0].content_base64 ?? '', 'base64')) === expectedHash,
    'Uploaded version readback does not match the approved artifact.');
  await verifyAllocation();
  console.log('Verified upload ' + created.id + ' SHA-256 ' + expectedHash +
    ' with baseline deployment ' + baselineDeployment + ' still at 100%.');
}

upload().catch(error => {
  if (error instanceof UploadCheckError) console.error(error.message);
  console.error('Logicc upload stopped. Check prior sanitized evidence and Cloudflare version history before any rerun.');
  process.exitCode = 1;
});
