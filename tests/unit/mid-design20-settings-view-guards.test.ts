/**
 * MID Design 2.0 — fail-closed, read-only admission of the nine settings routes
 * and protected forecast/map views. Source QA is not rendered browser QA.
 */
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {describe,expect,it} from 'vitest';

const root=fileURLToPath(new URL('../../',import.meta.url));
const path=(name:string)=>fileURLToPath(new URL('../../'+name,import.meta.url));
const appPath=path('src/App.tsx');
const gitBlob=(source:string)=>createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0'+source).digest('hex');
const run=(script:string,...args:string[])=>execFileSync(process.execPath,[path(script),...args],{
 cwd:root,encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']
});
const inspect=(script:string,...args:string[])=>JSON.parse(run(script,...args));
const ORIGINAL_APP_BLOB='d5fd0cee5c6cf8df187f3493c864d136ab11bcd9';

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
  const original=gitBlob(before)===ORIGINAL_APP_BLOB;
  const state=original?'--selftest':'--check-after';
  const first=inspect('scripts/qa/design20SettingsTabSplit.mjs',state);
  const second=inspect('scripts/qa/design20SettingsTabSplit.mjs',state);
  expect(first).toEqual(second);
  if(original){
   expect(first.result).toBe('PASS-dry-run');
   expect(first.writes).toBe(0);
   expect(first.baseBlob).toBe(ORIGINAL_APP_BLOB);
   expect(first.tabOwnerGroups).toBe(13);
   expect(first.deltaBytes).toBeGreaterThanOrEqual(200);
   expect(first.deltaBytes).toBeLessThanOrEqual(500);
  }else{
   expect(first.result).toBe('PASS-after');
   expect(first.sha).toBe(gitBlob(before));
   expect(first.checks).toEqual({groups:11,items:9});
  }
  expect(readFileSync(appPath,'utf8')).toBe(before);
 });
 it('executes nine-route ownership verifier inside Vitest',()=>{
  const before=readFileSync(appPath,'utf8');
  expect(run('scripts/qa/verifyDesign20SettingsRouteOwners.mjs')).toContain('9 routes accepted');
  expect(readFileSync(appPath,'utf8')).toBe(before);
 });
});
