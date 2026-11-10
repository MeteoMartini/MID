import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
// Bounded real required core tests on the combined QA Draft, not a substitute
// for the full mandatory core/heavy Source-Gate matrix.
const cases=[
 'scripts/test-c23-cloud-missing-0985206.mjs',
 'scripts/test-cloud-layer-day-night-details-09130.mjs',
 'scripts/test-security-pollen-maintenance-0985128.mjs',
 'scripts/test-skybar-week-solar-0985342.mjs',
 'scripts/test-skybar-sunshine-time-alignment-097881.mjs',
];
describe('MID bundled original NoData / DST / Skybar core contract probes',()=>{
 for(const path of cases)it('executes '+path,()=>{
  const r=spawnSync(process.execPath,[path],{cwd:process.cwd(),encoding:'utf8',
   timeout:90_000,maxBuffer:8*1024*1024,env:{...process.env,GITHUB_ACTIONS:'false'}});
  expect(r.status,[path,r.error?.message,r.stdout?.slice(-2800),r.stderr?.slice(-2800)].filter(Boolean).join('\n')).toBe(0);
 },100_000);
});
