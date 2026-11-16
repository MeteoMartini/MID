import {describe,it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';

// A fixed, offline Python unittest fixture. No GH_TOKEN, network, ZIP
// extraction, workflow dispatch or release privilege is involved.
describe('MID #740 real installer-archive shadow verifier (offline only)',()=>{
 it('rejects corruption, path traversal, symlinks, wrong event and Git blob mismatches',()=>{
  expect(()=>execFileSync('python3',[
   'tools/ci/test_mid_740_installer_archive_shadow.py'
  ],{cwd:process.cwd(),encoding:'utf8',timeout:20000,
     stdio:['ignore','pipe','pipe']})).not.toThrow();
 });
});
