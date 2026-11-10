import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';

// QA-only bridge: the five already registered original Node regression scripts
// must execute together on the exact integrated source tree, not merely pass
// separately in their earlier isolated draft PRs.
const root=fileURLToPath(new URL('../..',import.meta.url));
const scripts=[
 'test-detail-thermal-profile-navigation-09382.mjs',
 'test-display-return-states-0985364.mjs',
 'test-full-calendar-skybar-0985282.mjs',
 'test-posthog-telemetry-0985432.mjs',
 'test-sunshine-duration-contract-09655.mjs',
] as const;

describe('General MID QA: original Node22 regressions on combined 12-path source',()=>{
 for(const script of scripts){
  it(script,()=>{
   const result=spawnSync(process.execPath,[resolve(root,'scripts',script)],{
    cwd:root,encoding:'utf8',timeout:90_000,maxBuffer:4*1024*1024,
    env:{...process.env,FORCE_COLOR:'0'},
   });
   const output=[result.stdout,result.stderr].filter(Boolean).join('\n');
   const diagnosis=result.error?.message||result.signal||output.slice(-3000);
   expect(result.status,script+' failed: '+diagnosis).toBe(0);
  },95_000);
 }
});
