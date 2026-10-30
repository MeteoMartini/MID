import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeRun,summarizeCohort,renderMarkdown,githubRuns} from '../tools/ci/release-timing.mjs';

const sample = (id, name, conclusion='success') => ({
  id,name,conclusion,head_sha:'a'.repeat(40),created_at:'2026-10-30T08:58:00Z',
  jobs:[
    {name:'Core',conclusion:'success',started_at:'2026-10-30T09:00:00Z',completed_at:'2026-10-30T09:10:00Z',
     steps:[{name:'compile',started_at:'2026-10-30T09:01:00Z',completed_at:'2026-10-30T09:04:00Z'}]},
    {name:'Heavy',conclusion:'success',started_at:'2026-10-30T09:00:00Z',completed_at:'2026-10-30T09:07:00Z',
     steps:[{name:'browser',started_at:'2026-10-30T09:01:00Z',completed_at:'2026-10-30T09:06:00Z'}]},
    {name:'Skipped retry',conclusion:'skipped',started_at:null,completed_at:null},
  ],
});
test('parallel job durations are measured as wall time, never summed', () => {
  const r=summarizeRun(sample(12,'Install MID release and deploy'));
  assert.equal(r.durationSeconds,600);
  assert.equal(r.queueSeconds,120);
  assert.deepEqual(r.longestJob,{name:'Core',seconds:600});
  assert.equal(r.expensiveSteps[0].name,'browser');
  assert.equal(r.incompleteJobs,0);
  assert.equal(r.jobCount,3);
});
test('missing and malformed timings remain null, not zero', () => {
  const r=sample(13,'X');
  r.jobs=[{name:'Partial',conclusion:'failure',started_at:'bad timestamp',completed_at:null}];
  const out=summarizeRun(r);
  assert.equal(out.durationSeconds,null);
  assert.equal(out.queueSeconds,null);
  assert.equal(out.incompleteJobs,1);
  assert.equal(out.longestJob,null);
});
test('backwards clocks or impossible values cannot create negative times', () => {
  const r=sample(14,'X');
  r.jobs=[{name:'bad',conclusion:'success',started_at:'2026-10-30T10:00:00Z',completed_at:'2026-10-30T09:00:00Z'}];
  assert.equal(summarizeRun(r).durationSeconds,null);
  assert.equal(summarizeRun(r).incompleteJobs,1);
});
test('zero-second real timed job is distinct from missing data', () => {
  const r=sample(15,'X');
  r.jobs=[{name:'instant',conclusion:'success',started_at:'2026-10-30T09:00:00Z',completed_at:'2026-10-30T09:00:00Z'}];
  assert.equal(summarizeRun(r).durationSeconds,0);
});
test('p50/p95 include only successful measurable runs', () => {
  const s=sample(10,'X'),a=sample(11,'X'),bad=sample(12,'X','failure');
  a.jobs[0].completed_at='2026-10-30T09:20:00Z';
  bad.jobs[0].completed_at='2026-10-30T10:00:00Z';
  const report=summarizeCohort([s,a,bad]);
  assert.equal(report.byWorkflow.X.count,3);
  assert.equal(report.byWorkflow.X.successful,2);
  assert.equal(report.byWorkflow.X.failureCount,1);
  assert.equal(report.byWorkflow.X.p50Seconds,600);
  assert.equal(report.byWorkflow.X.p95Seconds,1200);
});
test('Markdown safely escapes names; explicit warning is always present', () => {
  const x=sample(22,'Workflow | risky');
  const md=renderMarkdown(summarizeCohort([x]));
  assert.match(md,/Workflow \\[|] risky/);
  assert.match(md,/never zero/);
  assert.match(md,/no release authorization effect/);
});
test('corrupt input fails closed', () => {
  assert.throws(()=>summarizeRun({id:'bad',jobs:[]}),/Invalid/);
  assert.throws(()=>summarizeCohort({}),/Expected/);
});
test('GitHub API client rejects unsafe repository and sample size before network requests',async()=>{
  await assert.rejects(githubRuns('../evil',2,''),/Invalid repository/);
  await assert.rejects(githubRuns('MeteoMartini/MID',31,''),/Count/);
});
