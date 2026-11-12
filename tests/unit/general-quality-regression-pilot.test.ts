import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {describe,expect,it} from 'vitest';
import {classifyReleaseFailure} from '../../tools/ci/release-self-heal-classify.mjs';

// QA-only bridge: the original registered Node regression scripts
// must execute together on the exact integrated source tree, not merely pass
// separately in their earlier isolated draft PRs.
const root=fileURLToPath(new URL('../..',import.meta.url));
const scripts=[
 'test-detail-thermal-profile-navigation-09382.mjs',
 'test-mid-weather-profile-sultry-09325.mjs',
 'test-display-return-states-0985364.mjs',
 'test-full-calendar-skybar-0985282.mjs',
 'test-posthog-telemetry-0985432.mjs',
 'test-chatgpt-github-write-contract-098510.mjs',
 'test-sunshine-duration-contract-09655.mjs',
 'test-pollen-compact-dwd-levels-0985129.mjs',
] as const;

describe('Release retry: deterministic regression beats unrelated HTTP 503',()=>{
 it('blocks a concrete German regression failure even with transient log noise',()=>{
  const result=classifyReleaseFailure({
   failedLog:'Regressionstests fehlgeschlagen\\nHTTP 503',attempt:1,
   jobs:{total_count:1,jobs:[{name:'Release-Core · core-1/4',conclusion:'failure'}]},
  });
  expect(result).toEqual({retry:false,reason:'deterministic'});
 });
 it('preserves legitimate transport-only retry classification',()=>{
  const result=classifyReleaseFailure({
   failedLog:'HTTP 503 upstream temporarily unavailable',attempt:1,
   jobs:{total_count:1,jobs:[{name:'Release-Core · core-1/4',conclusion:'failure'}]},
  });
  expect(result).toEqual({retry:true,reason:'transient'});
 });
});

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

describe('Optional DWD pollen chunk: keep responsive/offline contract',()=>{
 it('loads only when enabled and is explicitly included in the checked offline shell',()=>{
  const app=readFileSync(resolve(root,'src/App.tsx'),'utf8');
  const vite=readFileSync(resolve(root,'vite.config.ts'),'utf8');
  const pollen=readFileSync(resolve(root,'src/PollenForecast.tsx'),'utf8');
  expect(app).toContain("const LazyPollenForecast=lazy(()=>import('./PollenForecast')");
  expect(app).toContain("return props.enabled?<Suspense fallback=");
  expect(app).toContain("pollenDisplaySettings.showPollenForecast");
  expect(vite).toContain("chunk.facadeModuleId?.endsWith('/src/PollenForecast.tsx')");
  expect(vite).toContain("if(pollenRoots.length!==1)throw new Error");
  expect(vite).toContain("visit(pollenRoots[0].fileName)");
  expect(pollen).toContain('export function PollenForecast(');
 },20_000);
});

describe('Read-only release-train fail-closed diagnostics',()=>{
 it('keeps active/canonical workflow mirrors and publishes blocked results before a nonzero exit',()=>{
  const active=readFileSync(resolve(root,'.github/workflows/release-train-preflight.yml'),'utf8');
  const canonical=readFileSync(resolve(root,'ci/github/workflows/release-train-preflight.yml'),'utf8');
  const cli=readFileSync(resolve(root,'tools/ci/release-train-plan.mjs'),'utf8');
  expect(active).toBe(canonical);
  expect(active).toContain('preflight_status=$?');
  expect(active).toContain('cat "$RUNNER_TEMP/mid-release-train-result.json"');
  const summaryEnd=active.indexOf('} >> "$GITHUB_STEP_SUMMARY"');
  const exitIndex=active.indexOf('exit "$preflight_status"');
  expect(summaryEnd).toBeGreaterThan(-1);
  expect(exitIndex).toBeGreaterThan(summaryEnd);
  expect(cli).toContain("process.stderr.write('Release train preflight BLOCKED:");
  expect(cli).toContain('process.exitCode=1');
 },20_000);
});
