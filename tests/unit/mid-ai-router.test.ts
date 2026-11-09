import {describe,expect,it} from 'vitest';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const runner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-0985452.mjs', import.meta.url));
const ledgerRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-ledger-0985452.mjs', import.meta.url));
const blendRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-blend-0985452.mjs', import.meta.url));

describe('MID AI Router: separate direct Free-provider safety QA (issue #725)', () => {
  it('runs all zero-cost/privacy/SHA/idempotency mocked cases in real Node, without external API access', () => {
    const r = spawnSync(process.execPath, [runner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router offline tests OK; scenarios=70; no live API used\./);
    expect(r.stderr).toBe('');
  });
  it('blocks durable duplicate dispatch across concurrent processes and restarts without secrets or network', () => {
    const r = spawnSync(process.execPath, [ledgerRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router local ledger QA OK; scenarios=15; no network or secrets\./);
    expect(r.stderr).toBe('');
  });
  it('plans two independent free providers without dispatch, paid fallback or credit purchases', () => {
    const r = spawnSync(process.execPath, [blendRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router free blend QA OK; scenarios=20; no live API used\./);
    expect(r.stderr).toBe('');
  });
});
