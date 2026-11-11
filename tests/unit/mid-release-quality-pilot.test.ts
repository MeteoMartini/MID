import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
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
