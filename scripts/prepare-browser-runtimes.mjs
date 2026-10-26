import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runBounded} from '../tools/ci/bounded-process.mjs';
const cli=await realpath(process.env.MID_PLAYWRIGHT_CLI||execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:90000,stdio:['ignore','pipe','inherit']}).trim());
assert.equal(createRequire(import.meta.url)(join(dirname(cli),'package.json')).version,'1.56.1','Pinned browser runner required');
console.log('[browser-setup] pinned Playwright 1.56.1; Chromium + WebKit required');
// Run the root-owned apt process under a root-owned timeout, so its descendants
// receive TERM/KILL too. Browser downloads stay under the unprivileged runner.
if(process.platform==='linux')await runBounded('sudo',['-n','timeout','--signal=TERM','--kill-after=10s','300s',process.execPath,cli,'install-deps','chromium','webkit'],{timeoutMs:320000,graceMs:15000});
await runBounded(process.execPath,[cli,'install','chromium','webkit'],{timeoutMs:180000});
console.log('[browser-setup] preparation completed; real engine launches remain mandatory in parity QA');
