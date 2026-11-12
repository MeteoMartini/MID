import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {runBounded} from '../tools/ci/bounded-process.mjs';
import {verifyMidBrowserEngines,midBrowserNeedsHostDependencies} from '../tools/ci/browser-runtime-admission.mjs';

const cli=await realpath(process.env.MID_PLAYWRIGHT_CLI||execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:90000,stdio:['ignore','pipe','inherit']}).trim());
const require=createRequire(import.meta.url);
assert.equal(require(join(dirname(cli),'package.json')).version,'1.56.1','Pinned browser runner required');
const playwright=require(join(dirname(cli),'index.js'));
console.log('[browser-setup] pinned Playwright 1.56.1; Chromium + WebKit required');

// The GitHub Ubuntu mirror DNS incident needlessly stalled multiple shards for
// five minutes *before* the existing engines could be tested. Install the
// pinned browser binaries first, then launch BOTH browsers and a real DOM.
await runBounded(process.execPath,[cli,'install','chromium','webkit'],{timeoutMs:180000});

let needsApt=false;
try{
 await verifyMidBrowserEngines(playwright);
 console.log('[browser-setup] both pinned engines launched; apt not needed');
}catch(error){
 if(!midBrowserNeedsHostDependencies(error))throw error;
 needsApt=true;
}
if(needsApt){
 if(process.platform!=='linux')throw Error('MID_BROWSER_HOST_DEPENDENCIES_MISSING');
 // Missing libraries are not suppressed. Keep signed Ubuntu packages and
 // strict bounded, root-owned apt process. A DNS failure still fails closed.
 await runBounded('sudo',['-n','sed','-i','s#http://azure.archive.ubuntu.com/ubuntu#https://archive.ubuntu.com/ubuntu#g','/etc/apt/apt-mirrors.txt'],{timeoutMs:15000});
 await runBounded('sudo',['-n','timeout','--signal=TERM','--kill-after=10s','300s',process.execPath,cli,'install-deps','chromium','webkit'],{timeoutMs:320000,graceMs:15000});
 await verifyMidBrowserEngines(playwright);
 console.log('[browser-setup] signed system dependencies installed; both engines launched');
}
console.log('[browser-setup] Chromium/WebKit verified; full browser regression matrix remains mandatory');
