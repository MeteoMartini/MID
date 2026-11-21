/**
 * MID Design 2.0 — fail-closed, read-only admission of the nine settings routes
 * and protected forecast/map views. Source QA is not rendered browser QA.
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';
import {transformSync} from 'esbuild';

const root=fileURLToPath(new URL('../../',import.meta.url));
const path=(name:string)=>fileURLToPath(new URL('../../'+name,import.meta.url));
const appPath=path('src/App.tsx');
const gitBlob=(source:string)=>createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0'+source).digest('hex');
const run=(script:string,...args:string[])=>execFileSync(process.execPath,[path(script),...args],{
 cwd:root,encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']
});
const inspect=(script:string,...args:string[])=>JSON.parse(run(script,...args));
const PR_BASE_APP_BLOB='985ff40005ba4e3103149df494f70e818da0e3b3'; // Stable .499 verified input, not historical .497

describe('MID Design20 source-owner and protected-view guards',()=>{
 it('keeps eight productive view groups and inventories six candidates without deleting them',()=>{
  const before=readFileSync(appPath,'utf8');
  const report=inspect('scripts/qa/verifyDesign20ViewReachability.mjs') as {
   result:string;stableKept:number;removals:number;
   candidates:{id:string;present:boolean;action:string}[]
  };
  expect(report.result).toBe('PASS');
  expect(report.stableKept).toBe(8);
  expect(report.removals).toBe(0);
  expect(report.candidates.map(candidate=>candidate.id)).toEqual([
   'old-navigation-fallback','cockpit-ribbons','obsolete-preload-presentationMode',
   'fixed-bottom-bar-contract-drift','old-24h-navigation','inactive-parameter-quality-indicator'
  ]);
  expect(report.candidates.every(candidate=>candidate.present&&candidate.action.length>15)).toBe(true);
  expect(report.candidates.find(candidate=>candidate.id==='inactive-parameter-quality-indicator')?.action).toContain('not a user-visible quality UI');
  expect(readFileSync(appPath,'utf8')).toBe(before);
 });
 it('checks the exact source patch or the reviewed post-patch state twice without writes',()=>{
  const before=readFileSync(appPath,'utf8');
  // An unmodified .499 App must not be accepted as the deployed .500 Settings split.
  expect(gitBlob(before)).not.toBe(PR_BASE_APP_BLOB);
  const first=inspect('scripts/qa/design20SettingsTabSplit.mjs','--check-after');
  const second=inspect('scripts/qa/design20SettingsTabSplit.mjs','--check-after');
  expect(first).toEqual(second);
  expect(first.result).toBe('PASS-after');
  expect(first.sha).toBe(gitBlob(before));
  expect(first.checks).toEqual({groups:11,items:9});
  const verifier=readFileSync(path('scripts/qa/verifyDesign20SettingsRouteOwners.mjs'),'utf8');
  expect(verifier).toContain("['--check-after']");
  expect(verifier).not.toContain("'--selftest'");
  const applyHelper=readFileSync(path('scripts/qa/design20SettingsTabSplit.mjs'),'utf8');
  expect(applyHelper).toContain("['status','--porcelain','--untracked-files=all']");
  expect(readFileSync(appPath,'utf8')).toBe(before);
 });
 it('executes nine-route ownership verifier inside Vitest',()=>{
  const before=readFileSync(appPath,'utf8');
  expect(run('scripts/qa/verifyDesign20SettingsRouteOwners.mjs')).toContain('9 routes accepted');
  expect(readFileSync(appPath,'utf8')).toBe(before);
 });
 it('parses the entire productive App.tsx after the 13 JSX gates without a synthetic replacement tree',()=>{
  const content=readFileSync(appPath,'utf8');
  expect(gitBlob(content)).not.toBe(PR_BASE_APP_BLOB);
  const result=transformSync(content,{loader:'tsx',format:'esm',target:'es2022',sourcefile:'src/App.tsx',logLevel:'silent'});
  expect(result.code.length).toBeGreaterThan(350000);
  expect(content).toContain("{section==='navigation'&&<DashboardModuleSettingsPanel");
  expect(content).toContain("{(section==='view'||section==='weather')&&<section className=\"settings-section settings-primary-options\">");
  expect(content).toContain("{section==='units'&&<section className=\"settings-section settings-units-section\">");
  expect(content).toContain("{section==='view'&&<section className=\"settings-section settings-theme-section\">");
  expect(content).toContain("{section==='weather'&&layoutMode==='advanced'&&<div className=\"advanced-feature-settings\">");
 });
});
