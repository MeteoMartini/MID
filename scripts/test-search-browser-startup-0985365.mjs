import assert from 'node:assert/strict';
import {access,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=await mkdtemp(join(tmpdir(),'mid-search-start-fault-'));
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
const run=path=>spawnSync(process.execPath,['scripts/test-location-search-layers-0985293.mjs'],{env:{...process.env,CHROMIUM_PATH:path},encoding:'utf8',timeout:150000,maxBuffer:4*1024*1024});
try{
 const broken=join(dir,'always-fail');await writeFile(broken,'#!/bin/sh\necho MID_SEARCH_START_FAULT >&2\nexit 73\n',{mode:0o700});
 const fail=run(broken),failure=String(fail.stdout)+String(fail.stderr);assert.notEqual(fail.status,0,'two failed starts must fail the required gate');assert.ok(!fail.error,'fault process must terminate within its bound');assert.match(failure,/Search Chromium startup failed:[\s\S]*attempt 1:[\s\S]*attempt 2:/);assert.match(failure,/MID_SEARCH_START_FAULT/);assert.ok(!failure.includes('Search 320×740 light:'),'UI matrix cannot be claimed when both starts fail');
 let real;for(const candidate of [process.env.CHROMIUM_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/repl/tools/bin/chromium'].filter(Boolean)){try{await access(candidate);real=candidate;break}catch{}}
 if(!real){if(process.env.GITHUB_ACTIONS==='true')throw Error('real Chromium required for startup recovery proof');console.log('PASS two failed starts block; real-browser recovery runs in CI or with CHROMIUM_PATH');}
 else{
  const marker=join(dir,'first-start'),recover=join(dir,'fail-first');
  await writeFile(recover,`#!/bin/sh\nprofile=''\nfor arg in "$@"; do case "$arg" in --user-data-dir=*) profile="\${arg#--user-data-dir=}";; esac; done\nif [ ! -f ${quote(marker)} ]; then\n : > ${quote(marker)}\n mkdir -p "$profile"\n : > "$profile/start-fault-sentinel"\n echo MID_SEARCH_FIRST_START_FAULT >&2\n exit 73\nfi\nif [ -f "$profile/start-fault-sentinel" ]; then echo PROFILE_WAS_NOT_RESET >&2; exit 74; fi\nsleep 13\nexec ${quote(real)} "$@"\n`,{mode:0o700});
  const success=run(recover),output=String(success.stdout)+String(success.stderr);assert.equal(success.status,0,output);assert.ok(!success.error);assert.match(output,/Search Chromium startup recovered:.*attempt 1:/);assert.match(output,/MID_SEARCH_FIRST_START_FAULT/);assert.equal((output.match(/^Search \d+×\d+ (?:light|dark):/gm)||[]).length,12,'recovery must execute all real UI cases');assert.ok(!output.includes('PROFILE_WAS_NOT_RESET'),'fresh profile required');
  console.log('PASS real search browser fault injection: first process fails, profile contamination removed, delayed (>12s) cold start and full 12-case UI matrix succeed; two failed starts remain fatal');
 }
}finally{await rm(dir,{recursive:true,force:true,maxRetries:5,retryDelay:100})}
