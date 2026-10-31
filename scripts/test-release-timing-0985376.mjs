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
test('skipped synthetic timestamps cannot extend or shrink measured execution',()=>{
  const run=sample(30,'Retry');run.jobs[2]={name:'Skipped retry',conclusion:'skipped',started_at:'2020-01-01T00:00:00Z',completed_at:'2030-01-01T00:00:00Z'};
  assert.equal(summarizeRun(run).durationSeconds,600);
  assert.deepEqual(summarizeRun(run).longestJob,{name:'Core',seconds:600});
});
test('slowest execution and expensive steps include earlier attempts without skipped sentinels',()=>{
 const run=sample(33,'Retry');run.previousAttemptJobs=[{name:'Earlier failed setup',conclusion:'failure',started_at:'2026-10-30T08:00:00Z',completed_at:'2026-10-30T08:30:00Z',steps:[{name:'Earlier npm',started_at:'2026-10-30T08:00:00Z',completed_at:'2026-10-30T08:20:00Z'}]}];
 const report=summarizeRun(run);assert.deepEqual(report.longestJob,{name:'Earlier failed setup',seconds:1800});assert.equal(report.expensiveSteps[0].name,'Earlier npm');
});
test('retries include earlier cancelled work and gaps; retained success is counted once',()=>{
  const run=sample(31,'Retry');run.run_attempt=2;
  run.previousAttemptJobs=[{...run.jobs[0],id:123},{name:'Heavy',conclusion:'cancelled',started_at:'2026-10-30T08:00:00Z',completed_at:'2026-10-30T08:05:00Z'}];
  run.created_at='2026-10-30T07:59:00Z';
  const report=summarizeRun(run);
  assert.equal(report.attemptCount,2);assert.equal(report.durationSeconds,4200);
  assert.equal(report.runnerSeconds,600+420+300);assert.equal(report.executedJobs,3);assert.equal(report.cancelledExecutions,1);
});
test('a partial execution invalidates whole-run timing rather than creating a low P95',()=>{
  const run=sample(32,'Partial');run.jobs.push({name:'Unknown',conclusion:'success',started_at:null,completed_at:null});
  const report=summarizeRun(run);assert.equal(report.durationSeconds,null);assert.equal(report.runnerSeconds,null);
  assert.equal(report.incompleteJobs,1);
});
test('cancelled and timed-out runs remain explicit outcomes outside successful percentiles',()=>{
  const report=summarizeCohort([sample(1,'X'),sample(2,'X','cancelled'),sample(3,'X','timed_out')]).byWorkflow.X;
  assert.equal(report.successful,1);assert.equal(report.cancelledCount,1);assert.equal(report.timedOutCount,1);
});
test('attempt pagination and final identity recheck refuse a concurrent rerun',async()=>{
  const original=globalThis.fetch,run={...sample(40,'X'),run_attempt:2,path:'.github/workflows/install-mid.yml',event:'workflow_dispatch',status:'completed'};
  let changed=false;const calls=[];
  try{
    globalThis.fetch=async url=>{const u=String(url);calls.push(u);let data;
      if(u.includes('/workflows/'))data={workflow_runs:[run]};
      else if(u.includes('/jobs?'))data={jobs:run.jobs};
      else data={...run,run_attempt:changed?3:2};
      return {ok:true,json:async()=>data};
    };
    const map=new Map([['install-mid.yml','workflow_dispatch']]);
    const good=await githubRuns('MeteoMartini/MID',1,'',map);
    assert.equal(good[0].previousAttemptJobs.length,3);assert.ok(calls.some(u=>u.includes('/attempts/1/jobs?')));
    changed=true;await assert.rejects(githubRuns('MeteoMartini/MID',1,'',map),/Run changed/);
  }finally{globalThis.fetch=original}
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

test('GitHub API samples workflow file identities rather than display run-names and excludes skips',async()=>{
  const original=globalThis.fetch;
  const paths=[];
  try{
    globalThis.fetch=async(url)=>{
      paths.push(String(url));
      if(String(url).includes('/actions/workflows/install-mid.yml/runs?')){
        return {ok:true,json:async()=>({workflow_runs:[
          {...sample(101,'MID-Release aus ZIP installieren und veröffentlichen'),path:'.github/workflows/install-mid.yml',event:'push',status:'completed'},
          {...sample(102,'MID-Release aus ZIP installieren und veröffentlichen','skipped'),path:'.github/workflows/install-mid.yml',event:'workflow_dispatch',status:'completed'},
          {...sample(103,'MID-Release aus ZIP installieren und veröffentlichen'),path:'.github/workflows/install-mid.yml',event:'workflow_dispatch',status:'completed'},
        ]})};
      }
      if(String(url).includes('/actions/runs/103/jobs?')){
        return {ok:true,json:async()=>({jobs:sample(103,'any').jobs})};
      }
      throw Error('Unexpected path '+url);
    };
    const runs=await githubRuns('MeteoMartini/MID',1,'',new Map([['install-mid.yml','workflow_dispatch']]));
    assert.equal(runs.length,1);
    assert.equal(runs[0].id,103);
    assert.equal(summarizeRun(runs[0]).workflow,'install-mid.yml');
    assert.equal(paths.length,2);
  }finally{globalThis.fetch=original}
});
test('pagination traverses skipped runs before a real successful source gate',async()=>{
  const original=globalThis.fetch;
  let pages=0;
  try{
    globalThis.fetch=async(url)=>{
      if(String(url).includes('/actions/workflows/chatgpt-pr-gate.yml/runs?')){
        pages++;
        const isFirst=String(url).endsWith('&page=1');
        const batch=isFirst?Array.from({length:100},(_,i)=>({
          ...sample(i+1,'MID-Agent-Quellstand prüfen','skipped'),
          path:'.github/workflows/chatgpt-pr-gate.yml',event:'pull_request',status:'completed'
        })):
          [{...sample(1001,'MID-Agent-Quellstand prüfen'),path:'.github/workflows/chatgpt-pr-gate.yml',
            event:'pull_request',status:'completed'}];
        return {ok:true,json:async()=>({workflow_runs:batch})};
      }
      if(String(url).includes('/actions/runs/1001/jobs?')){
        return {ok:true,json:async()=>({jobs:sample(1001,'any').jobs})};
      }
      throw Error('Unexpected path '+url);
    };
    const runs=await githubRuns('MeteoMartini/MID',1,'',new Map([['chatgpt-pr-gate.yml','pull_request']]));
    assert.equal(runs.length,1);
    assert.equal(runs[0].id,1001);
    assert.equal(pages,2);
  }finally{globalThis.fetch=original}
});
test('invalid workflow identities and absence of real completed runs fail closed',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async()=>({ok:true,json:async()=>({workflow_runs:[]})});
    await assert.rejects(githubRuns('MeteoMartini/MID',1,'',new Map([['../unsafe.yml','pull_request']])),/Unexpected workflow/);
    await assert.rejects(githubRuns('MeteoMartini/MID',1,'',new Map([['install-mid.yml','workflow_dispatch']])),/Incomplete workflow sample/);
  }finally{globalThis.fetch=original}
});

test('A failed run never consumes the quota of successful runs for P50/P95',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async(url)=>{
   if(String(url).includes('/actions/workflows/install-mid.yml/runs?'))
    return {ok:true,json:async()=>({workflow_runs:[
      {...sample(201,'Installer','failure'),path:'.github/workflows/install-mid.yml',event:'workflow_dispatch',status:'completed'},
      {...sample(202,'Installer','success'),path:'.github/workflows/install-mid.yml',event:'workflow_dispatch',status:'completed'},
    ]})};
   if(String(url).includes('/actions/runs/201/jobs?')||String(url).includes('/actions/runs/202/jobs?'))
    return {ok:true,json:async()=>({jobs:sample(201,'any').jobs})};
   throw Error('Unexpected path '+url);
  };
  const runs=await githubRuns('MeteoMartini/MID',1,'',new Map([['install-mid.yml','workflow_dispatch']]));
  assert.equal(runs.length,2);
  const summary=summarizeCohort(runs).byWorkflow['install-mid.yml'];
  assert.equal(summary.successful,1);
  assert.equal(summary.failureCount,1);
  assert.equal(summary.p50Seconds,600);
 }finally{globalThis.fetch=original}
});
test('an incomplete success sample is an explicit error, not an invented green P95',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>({ok:true,json:async()=>({workflow_runs:[
   {...sample(301,'Installer','failure'),path:'.github/workflows/install-mid.yml',
    event:'workflow_dispatch',status:'completed'}
  ]})});
  await assert.rejects(githubRuns('MeteoMartini/MID',1,'',new Map([['install-mid.yml','workflow_dispatch']])),/Incomplete workflow sample/);
 }finally{globalThis.fetch=original}
});

// Read-only stage timing, parallel wall-time and missing-data regression.
await import('../tools/ci/release-phase-observation.test.mjs');
// Verify the complete read-only Source/Bot/ZIP/Installer/Stable lineage as one gate-safe observation.
await import('../tools/ci/release-chain-integrity.test.mjs');
