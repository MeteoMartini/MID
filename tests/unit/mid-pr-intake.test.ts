import {execFileSync} from 'node:child_process';
import {test,expect} from 'vitest';

// Run the same deterministic, zero-network Node test cases as the trusted
// Stable-only workflow, in the ordinary unprivileged Draft/unit CI context.
// No tokens are passed to the spawned test process.
test('MID PR Cleaner: SHA, blob, peer, rename, mirror and checkout negatives',()=>{
 const output=execFileSync(process.execPath,['--test','tools/ci/test-mid-pr-intake.mjs'],{
  cwd:process.cwd(),encoding:'utf8',timeout:45000,
  env:{TZ:'UTC'},
  maxBuffer:1024*1024
 });
 expect(output).toMatch(/# fail 0\b/);
 expect(output).toMatch(/# pass 17\b/);
},60000);
