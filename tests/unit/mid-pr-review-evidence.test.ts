import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';

const script=resolve('scripts','mid-pr-review-gate.mjs');
const cases=resolve('scripts','mid-pr-review-gate-qa-cases.mjs');

describe('MID #740 review-evidence QA and the trusted SHA-bound release-workflow attachment',()=>{
 it('has valid Node22 ESM source',()=>{
  const result=spawnSync(process.execPath,['--check',script],{encoding:'utf8',timeout:20000});
  expect(result.status, result.stderr||result.error?.message).toBe(0);
 });
 it('fails closed on stale heads, unresolved Cubic findings and absent triage evidence',()=>{
  const result=spawnSync(process.execPath,[cases],{encoding:'utf8',timeout:25000,env:{...process.env,GH_TOKEN:''}});
  expect(result.status,[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(result.stdout).toContain('NO workflow attached');
  // The standalone evaluator remains a fixture; the trusted Python premerge gate
  // must independently be attached to both canonical release workflow copies.
 });
 it('requires the trusted premerge review guard in both workflow mirrors before SHA-merge',()=>{
  const canonical=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
  const active=readFileSync('.github/workflows/agent-source-release.yml','utf8');
  expect(active).toBe(canonical);
  const identify=canonical.indexOf('- name: Geprüften PR robust identifizieren');
  const premerge=canonical.indexOf('- name: Unabhängigen Reviewstand vor SHA-Merge fail-closed prüfen');
  const merge=canonical.indexOf('- name: Geprüften Agent-PR automatisch zusammenführen');
  expect(identify).toBeGreaterThan(0);
  expect(premerge).toBeGreaterThan(identify);
  expect(merge).toBeGreaterThan(premerge);
  for(const proof of [
   'second=snapshot()', 'if first!=second:', 'if first["threads"]:',
   'review_sha!=head', 'if state=="CHANGES_REQUESTED"',
   'PR review evidence changed during readback',
   'raise ValueError("Submitted review on stale SHA")',
   'gh api --method PUT'
  ])expect(canonical).toContain(proof);
  expect(canonical).toContain('EXPECTED_HEAD_SHA:');
  expect(canonical).not.toContain('pull_request_target:');
 });
});
