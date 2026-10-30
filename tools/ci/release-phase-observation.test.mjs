import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRunPhases,analyzePhaseCohort,renderPhaseMarkdown} from './release-phase-observation.mjs';

const time=minute=>new Date(Date.parse('2026-10-30T10:00:00.000Z')+minute*60000).toISOString();
const job=(name,start,end,steps=[],conclusion='success')=>({
 name,conclusion,started_at:start===null?null:time(start),
 completed_at:end===null?null:time(end),steps
});
const step=(name,start,end,conclusion='success')=>({
 name,conclusion,started_at:start===null?null:time(start),
 completed_at:end===null?null:time(end)
});
const run=(id,jobs,conclusion='success')=>({
 id,created_at:time(-1),head_sha:'a'.repeat(40),conclusion,jobs
});
test('parallel heavy wall time is union, never sum; runner work is measured separately',()=>{
 const r=run(1,[job('Release-Heavy · heavy-unified-map · 1/3',0,10),
  job('Release-Heavy · heavy-unified-map · 2/3',2,8),
  job('Release-Heavy · heavy-native-map ·',12,14)]);
 const p=analyzeRunPhases(r).phases.heavy;
 assert.equal(p.observed,3);
 assert.equal(p.wallSeconds,720);
 assert.equal(p.spanSeconds,840);
 assert.equal(p.runnerSeconds,1080);
 assert.equal(analyzeRunPhases(r).phases.queue.wallSeconds,60);
});
test('setup npm and build are step events, never padded with full job duration',()=>{
 const r=run(2,[job('Release-Core, Build, Audit und iOS prüfen',0,14,[
  step('Set up job',0,1),step('Node.js 22 mit npm-Cache einrichten',1,2),
  step('Abhängigkeiten reproduzierbar installieren',2,5),
  step('SHA-identischen Produktionsbuild für Heavy-Regression erzeugen',5,8)
 ])]);
 const phases=analyzeRunPhases(r).phases;
 assert.equal(phases.setup.wallSeconds,120);
 assert.equal(phases.npm.wallSeconds,180);
 assert.equal(phases.build.wallSeconds,180);
 assert.equal(phases.core.wallSeconds,840);
 assert.equal(phases.heavy.wallSeconds,null);
 assert.equal(phases.heavy.observed,0);
});
test('gaps are retained as span but never mislabeled as compute',()=>{
 const r=run(3,[job('Release-Heavy · heavy-native-map ·',0,2),
 job('Release-Heavy · heavy-mountain-visual ·',8,9)]);
 const p=analyzeRunPhases(r).phases.heavy;
 assert.equal(p.wallSeconds,180);
 assert.equal(p.spanSeconds,540);
 assert.equal(p.runnerSeconds,180);
});
test('duplicate retries counted once; cancelled earlier work retained',()=>{
 const a=job('Release-Heavy · heavy-native-map ·',0,3);
 const r=run(4,[a]);
 r.previousAttemptJobs=[{...a,id:999},job('Release-Heavy · heavy-native-map ·',-10,-7,[],'cancelled')];
 const p=analyzeRunPhases(r).phases.heavy;
 assert.equal(p.observed,2);
 assert.equal(p.wallSeconds,360);
 assert.equal(p.spanSeconds,780);
 assert.equal(p.runnerSeconds,360);
});
test('skipped jobs and skipped setup steps cannot impersonate zero-duration success',()=>{
 const r=run(5,[job('Release-Heavy · heavy-native-map ·',0,0,[
 step('Node.js 22 mit npm-Cache einrichten',1,2,'skipped')
 ],'skipped')]);
 const p=analyzeRunPhases(r).phases;
 assert.equal(p.heavy.observed,0);
 assert.equal(p.heavy.wallSeconds,null);
 assert.equal(p.setup.observed,0);
 assert.equal(p.setup.wallSeconds,null);
});
test('zero real measured duration is not missing timestamp',()=>{
 const r=run(6,[job('Release-Heavy · heavy-native-map ·',0,0)]);
 const p=analyzeRunPhases(r).phases.heavy;
 assert.equal(p.wallSeconds,0);
 assert.equal(p.missing,0);
});
test('partial, invalid and backwards clocks block phase P50 rather than silently drop incomplete work',()=>{
 const r=run(7,[job('Release-Heavy · heavy-native-map ·',0,3),
 job('Release-Heavy · heavy-unified-map · 2/3',4,null)]);
 const phase=analyzeRunPhases(r).phases.heavy;
 assert.equal(phase.observed,2);
 assert.equal(phase.missing,1);
 assert.equal(phase.wallSeconds,null);
 assert.equal(phase.runnerSeconds,null);
 const wrong=run(8,[job('Release-Heavy · heavy-native-map ·',5,2)]);
 assert.equal(analyzeRunPhases(wrong).phases.heavy.missing,1);
 const cohort=analyzePhaseCohort([r,wrong]);
 assert.equal(cohort.summary.heavy.measuredRuns,0);
 assert.equal(cohort.summary.heavy.incompleteRuns,2);
 assert.equal(cohort.summary.heavy.p95WallSeconds,null);
});
test('cohort p50/p95 have explicit sample and missing counts; failure cannot pollute successful series',()=>{
 const slow=run(9,[job('Release-Heavy · heavy-native-map ·',0,10)]);
 const fast=run(10,[job('Release-Heavy · heavy-native-map ·',0,2)]);
 const fail=run(11,[job('Release-Heavy · heavy-native-map ·',0,100)],'failure');
 const absent=run(12,[job('Source-Kern vollständig prüfen',0,4)]);
 const report=analyzePhaseCohort([slow,fast,fail,absent]);
 assert.equal(report.summary.heavy.measuredRuns,2);
 assert.equal(report.summary.heavy.successfulRuns,3);
 assert.equal(report.summary.heavy.absentRuns,1);
 assert.equal(report.summary.heavy.p50WallSeconds,120);
 assert.equal(report.summary.heavy.p95WallSeconds,600);
 assert.equal(report.releaseAuthorized,false);
 assert.equal(report.reuseAuthorized,false);
});
test('real worker, pages, stable jobs use independent non-overlapping stage labels',()=>{
 const r=run(13,[job('Geprüften MID-Worker sicher automatisch veröffentlichen',0,3),
 job('MID auf GitHub Pages veröffentlichen · Versuch 1',1,5),
 job('Erfolgreichen Pages-/Worker-Release finalisieren',5,6),
 job('Release-ZIP prüfen und immutable Snapshot vorbereiten',0,1)]);
 const p=analyzeRunPhases(r).phases;
 assert.equal(p.worker.wallSeconds,180);
 assert.equal(p.pages.wallSeconds,240);
 assert.equal(p.stable.wallSeconds,60);
 assert.equal(p.package.wallSeconds,60);
 assert.equal(p.bot.wallSeconds,null);
});
test('report explicitly separates wall and runner observations and prohibits summing phases',()=>{
 const report=analyzePhaseCohort([run(14,[job('Core-Regression · core-1/4',0,2)])]);
 const text=renderPhaseMarkdown({'chatgpt-pr-gate.yml':report});
 assert.match(text,/not additive/);
 assert.match(text,/P50/);
 assert.match(text,/n\/a/);
 assert.match(text,/no estimate, automated release permission/);
});
test('untrusted timing shape is refused and cannot be counted as clean',()=>{
 assert.throws(()=>analyzeRunPhases({jobs:{}}),/Invalid timing run/);
 assert.throws(()=>analyzeRunPhases({jobs:[null]}),/Untrusted timing job/);
 assert.throws(()=>analyzeRunPhases({jobs:[],previousAttemptJobs:{}}),/Invalid previous attempt/);
 assert.throws(()=>analyzePhaseCohort({}),/Invalid phase cohort/);
});

test('missing start on an executed sibling invalidates queue rather than shortening it',()=>{
 const r=run(15,[job('Source-Kern vollständig prüfen',0,2),
  job('Core-Regression · core-2/4',null,4)]);
 const p=analyzeRunPhases(r).phases.queue;
 assert.equal(p.wallSeconds,null);
 assert.equal(p.missing,1);
 assert.equal(analyzePhaseCohort([r]).summary.queue.measuredRuns,0);
});
