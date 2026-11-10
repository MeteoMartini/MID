import {describe,expect,it} from 'vitest';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const runner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-0985452.mjs', import.meta.url));
const ledgerRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-ledger-0985452.mjs', import.meta.url));
const sonarSelectorRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-selector-0985452.mjs', import.meta.url));
const sonarRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-sonar-0985452.mjs', import.meta.url));
const vercelPolicyRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-vercel-policy-0985452.mjs', import.meta.url));
const githubReadbackRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-github-readback-0985452.mjs', import.meta.url));
const synthesisRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-synthesis-0985454.mjs', import.meta.url));
const profileRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-model-profiles-0985454.mjs', import.meta.url));
const blendRunner = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-blend-0985452.mjs', import.meta.url));

describe('MID AI Router: separate direct Free-provider safety QA (issue #725)', () => {
  it('runs all zero-cost/privacy/SHA/idempotency mocked cases in real Node, without external API access', () => {
    const r = spawnSync(process.execPath, [runner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router offline tests OK; scenarios=84; no live API used\./);
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
    expect(r.stdout).toMatch(/MID AI Router free blend QA OK; scenarios=27; no live API used\./);
    expect(r.stderr).toBe('');
  });
  it('verifies live GitHub origin/SHAs and version mirrors with mock fetch, never network', () => {
    const r = spawnSync(process.execPath, [githubReadbackRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router GitHub fixed-origin readback QA OK; scenarios=14; no network or secrets\./);
    expect(r.stderr).toBe('');
  });

  it('keeps Vercel $1 soft budgets and included credits non-executable without verified zero-cash controls', () => {
    const r = spawnSync(process.execPath, [vercelPolicyRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router Vercel soft-budget offline QA OK; scenarios=23; no live API used\./);
    expect(r.stderr).toBe('');
  });

  it('checks fixed-model Perplexity Sonar against prepaid credit, trusted citations and fail-closed dispatch', () => {
    const r = spawnSync(process.execPath, [sonarRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router Sonar credit-only offline QA OK; scenarios=29; no live API used\./);
    expect(r.stderr).toBe('');
  });

  it('selects Sonar only for explicit one-call prepaid public research, never as fallback', () => {
    const r = spawnSync(process.execPath, [sonarSelectorRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router research selection offline QA OK; scenarios=13; no live API used\./);
    expect(r.stderr).toBe('');
  });

  it('audits exact public model identities, independence and Free evidence without authorizing calls', () => {
    const r = spawnSync(process.execPath, [profileRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router model profile QA OK; scenarios=21; no account\/API network used\./);
    expect(r.stderr).toBe('');
  });

  it('compares two actual untrusted model responses without invented source verification, consensus or costs', () => {
    const r = spawnSync(process.execPath, [synthesisRunner], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router two-model synthesis offline QA OK; scenarios=20; no live API used\./);
    expect(r.stderr).toBe('');
  });

});

describe('MID AI Router: adaptive capability / Work / Codex selection is non-executable', () => {
  it('tests source, privacy, consent, quota, mode-switch and measured model ranking in Node without API calls', () => {
    const script = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-capability-0985453.mjs', import.meta.url));
    const r = spawnSync(process.execPath, [script], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router capability QA OK; scenarios=\d+; no network, paid AI calls or mode switch\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: durable SQLite one-shot admission is fail-closed', () => {
  it('reserves globally unique request IDs and free quotas atomically, without provider API calls', () => {
    const script = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-durable-admission-0985453.mjs', import.meta.url));
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router SQLite durable admission QA OK; scenarios=23; no external model, credentials, deployment or network\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: signed quota/source proof binds atomic SQLite admission', () => {
  it('accepts only fresh Ed25519-authenticated public zero-cash requests (offline Node22)', () => {
    const script = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-signed-quota-0985453.mjs', import.meta.url));
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router signed Ed25519\/SQLite QA OK; scenarios=30; no provider inference, auth bypass, billing or network\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: one-shot external executor with signed OAuth/SQLite gate', () => {
  it('runs fixed Groq/OpenRouter/Gemini mock responses with zero paid fallback and no network', () => {
    const script = fileURLToPath(new URL('../../scripts/qa-mid-ai-router-executor-0985453.mjs', import.meta.url));
    const r = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', script], {
      cwd: root, timeout: 20_000, encoding: 'utf8', maxBuffer: 128 * 1024,
      env: { PATH: process.env.PATH || '' }, stdio: ['ignore', 'pipe', 'pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status, r.stderr || r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router Worker one-shot end-to-end mock QA OK; scenarios=25; provider HTTP calls simulated, no external inference, credentials or billing\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: public GitHub IssueOps handoff only', () => {
  it('creates a safe non-executable draft with verified SHA and explicit consent', () => {
    const file=fileURLToPath(new URL('../../scripts/qa-mid-ai-router-github-issueops-0985453.mjs', import.meta.url));
    const r=spawnSync(process.execPath,[file],{
      cwd:root,timeout:20_000,encoding:'utf8',maxBuffer:128*1024,
      env:{PATH:process.env.PATH||''},stdio:['ignore','pipe','pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status,r.stderr||r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router public GitHub IssueOps packet QA OK; scenarios=16; no issue, label, workflow, model call or network\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: Groq connection qualification with no inference', () => {
  it('checks exact active models using only one mock GET and SHA-bound readback', () => {
    const script=fileURLToPath(new URL('../../scripts/qa-mid-ai-router-groq-connectivity-0985453.mjs',import.meta.url));
    const r=spawnSync(process.execPath,[script],{
      cwd:root,timeout:20_000,encoding:'utf8',maxBuffer:128*1024,
      env:{PATH:process.env.PATH||''},stdio:['ignore','pipe','pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status,r.stderr||r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID AI Router Groq API GET models QA OK; scenarios=21; no network, inference, credentials or paid calls\./);
    expect(r.stderr).toBe('');
  });
});

describe('MID AI Router: ChatGPT GitHub issue to stable-only Groq catalog relay', () => {
  it('blocks untrusted issues and admits only the source-bound owner issue', () => {
    const p=fileURLToPath(new URL('../../scripts/qa-mid-ai-router-groq-issue-bridge-0985453.mjs',import.meta.url));
    const r=spawnSync(process.execPath,[p],{
      cwd:root,timeout:20_000,encoding:'utf8',maxBuffer:128*1024,
      env:{PATH:process.env.PATH||''},stdio:['ignore','pipe','pipe']
    });
    expect(r.error).toBeUndefined();
    expect(r.status,r.stderr||r.stdout).toBe(0);
    expect(r.stdout).toMatch(/MID Groq ChatGPT Issue bridge QA OK; scenarios=24; no GitHub actions, secrets, provider calls or network\./);
    expect(r.stderr).toBe('');
  });
});
