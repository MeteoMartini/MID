import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {environmentFingerprint} from './build-parity.mjs';

export const releaseBuildInputs = Object.freeze([
  'METAR_PROXY_URL',
  'ALERT_PROXY_URL',
  'RADAR_PROXY_URL',
  'WORKER_SAME_ORIGIN_PATH',
  'WORKER_FALLBACK_URLS',
  'CLOUDFLARE_WEB_ANALYTICS_TOKEN',
  'POSTHOG_PROJECT_TOKEN',
  'POSTHOG_HOST',
]);

export function resolveReleaseBuildInputs(environment) {
  const inputs = Object.fromEntries(releaseBuildInputs.map(name => [`VITE_${name}`, environment[`VITE_${name}`] ?? '']));
  inputs.VITE_ALERT_PROXY_URL ||= inputs.VITE_METAR_PROXY_URL;
  inputs.VITE_RADAR_PROXY_URL ||= inputs.VITE_METAR_PROXY_URL;
  inputs.VITE_WORKER_SAME_ORIGIN_PATH ||= '/api/mid-worker';
  return inputs;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const inputs = resolveReleaseBuildInputs(process.env);
  const unexpected = Object.keys(process.env).filter(name => name.startsWith('VITE_') && !Object.hasOwn(inputs, name));
  if (unexpected.length) throw new Error('Unexpected Vite build inputs: ' + unexpected.join(', '));
  for (const name of ['.env', '.env.local', '.env.production', '.env.production.local']) {
    try {
      readFileSync(name);
      throw new Error('Untracked build configuration is forbidden: ' + name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  console.log('MID Vite input SHA-256: ' + environmentFingerprint(inputs));
  const {appendFileSync} = await import('node:fs');
  if (!process.env.GITHUB_ENV) throw new Error('GITHUB_ENV is required');
  for (const value of Object.values(inputs)) {
    if (/[\r\n]/.test(value)) throw new Error('Multiline Vite build input is forbidden');
  }
  appendFileSync(process.env.GITHUB_ENV, Object.entries(inputs).map(([key,value])=>`${key}=${value}\n`).join(''));
}
