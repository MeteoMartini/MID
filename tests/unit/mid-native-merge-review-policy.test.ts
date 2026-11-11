import {describe,it,expect} from 'vitest';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
describe('MID native GitHub merge-time review protection (QA only)',()=>{
 it('executes real pure-policy deny/allow regressions offline',()=>{
  const script=fileURLToPath(new URL('../../scripts/qa-mid-native-merge-review-policy.mjs',import.meta.url));
  const r=spawnSync(process.execPath,[script],{encoding:'utf8',timeout:30000,
   env:{PATH:process.env.PATH??'',NODE_ENV:'test'}});
  expect(r.error).toBeUndefined();
  expect(r.status, (r.stderr || '') + (r.stdout || '')).toBe(0);
  expect(r.stdout).toContain('MID native merge review QA OK; scenarios=61; ZERO network, secrets or release writes.');
 });
});