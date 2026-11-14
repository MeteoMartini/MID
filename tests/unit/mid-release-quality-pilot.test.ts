import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import path from 'node:path';

// Run the real, self-contained QA probes in the existing Vitest/coverage pilot.
// This avoids adding unregistered scripts/test-* entries to MID_BASELINE.json.
const probes=Object.freeze([
 'scripts/qa-mid-workflow-quality-pilot-0985455.mjs',
 'scripts/qa-mid-release-property-invariants-0985455.mjs'
]);
describe('MID release-quality tools (read-only, zero extra permissions)',()=>{
 it.each(probes)('retains its fail-closed unit/property negatives: %s',(file)=>{
  const cwd=process.cwd();
  const run=spawnSync(process.execPath,[path.resolve(cwd,file)],{
   cwd,encoding:'utf8',shell:false,timeout:30_000,
   env:{PATH:process.env.PATH||'/usr/bin:/bin',HOME:process.env.HOME||'/tmp'}
  });
  expect(run.error?.message??'').toBe('');
  expect(run.status,file+'\n'+(run.stderr||'')+'\n'+(run.stdout||'')).toBe(0);
  expect(run.stdout).toContain('PASS');
 });
});

describe('MID offline scanner diagnostic supply-chain and scope',()=>{
 it('limits the real scanner to the isolated QA branch and verifies exact official release digests',()=>{
  const active=readFileSync('.github/workflows/unit-coverage.yml','utf8');
  const canonical=readFileSync('ci/github/workflows/unit-coverage.yml','utf8');
  expect(active).toBe(canonical);
  expect(active).toContain("github.head_ref == 'chatgpt/v0.9.85.455-release-quality-pilot-12'");
  expect(active).toContain('continue-on-error: true');
  expect(active).toContain('8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8');
  expect(active).toContain('bb110cc765eca9cd7efb2e284a956be5974c60027b0970f16397d86208a9957b');
  expect((active.match(/sha256sum --check/g)||[]).length).toBe(2);
  expect(active).toContain('persist-credentials: false');
  expect(active).toContain("GH_TOKEN: ''");
  expect(active).toContain("GITHUB_TOKEN: ''");
  expect(active).toContain("ZIZMOR_OFFLINE: '1'");
  expect(active).toContain('name: mid-offline-actionlint-zizmor-pilot');
  expect(active).toContain('retention-days: 7');
  expect(active).toContain('set +e');
  expect(active).toContain('cat "$report"');
  expect(active).toContain('exit "$result"');
 });
});

describe('MID fast-check isolated integrity and scope',()=>{
 it('pins independent fast-check 4.10.2 with integrity, without root dependency changes',()=>{
  const pkg=JSON.parse(readFileSync('tools/qa/mid-fast-check/package.json','utf8'));
  const lock=JSON.parse(readFileSync('tools/qa/mid-fast-check/package-lock.json','utf8'));
  expect(pkg.devDependencies['fast-check']).toBe('4.10.2');
  expect(lock.packages[''].devDependencies['fast-check']).toBe('4.10.2');
  expect(lock.packages['node_modules/fast-check'].integrity).toMatch(/^sha512-/);
  expect(lock.packages['node_modules/pure-rand'].integrity).toMatch(/^sha512-/);
  expect(lock.packages['node_modules/fast-check'].dependencies['pure-rand']).toBe('^8.0.0');
  const wf=readFileSync('ci/github/workflows/unit-coverage.yml','utf8');
  expect(wf).toContain('npm ci --prefix tools/qa/mid-fast-check --ignore-scripts');
  expect(wf).toContain('node --experimental-strip-types tools/qa/mid-fast-check/properties.mjs');
 });
});
