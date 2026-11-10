import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';

const script=resolve('scripts','mid-pr-review-gate.mjs');
const cases=resolve('scripts','mid-pr-review-gate-qa-cases.mjs');

describe('MID #740 review-evidence pre-merge QA (standalone, not release-active)',()=>{
 it('has valid Node22 ESM source',()=>{
  const result=spawnSync(process.execPath,['--check',script],{encoding:'utf8',timeout:20000});
  expect(result.status, result.stderr||result.error?.message).toBe(0);
 });
 it('fails closed on stale heads, unresolved Cubic findings and absent triage evidence',()=>{
  const result=spawnSync(process.execPath,[cases],{encoding:'utf8',timeout:25000,env:{...process.env,GH_TOKEN:''}});
  expect(result.status,[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(result.stdout).toContain('NO workflow attached');
 });
});
