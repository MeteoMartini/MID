#!/usr/bin/env node
// Read-only MID CI/CD timing auditor. No release actions or secret output.
import {readFile,appendFile} from 'node:fs/promises';

// Match stable workflow file identities, never the user-visible run-name.
const DEFAULT_WORKFLOWS = new Map([
  ['chatgpt-pr-gate.yml', 'pull_request'],
  ['agent-source-release.yml', 'workflow_run'],
  ['install-mid.yml', 'workflow_dispatch'],
]);
const workflowFile = path => {
  const match = /^\.github\/workflows\/([a-z0-9-]+\.yml)$/.exec(path || '');
  return match?.[1] ?? null;
};
const asMs = value => {
  if (typeof value !== 'string' || !value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
};
const seconds = (start, end) => {
  const a = asMs(start), b = asMs(end);
  return a === null || b === null || b < a ? null : Math.round((b - a) / 1000);
};
const percentile = (values, p) => {
  const sorted = values.filter(Number.isFinite).sort((a,b) => a-b);
  return sorted.length ? sorted[Math.max(0, Math.ceil(p * sorted.length)-1)] : null;
};
const format = value => value === null ? 'n/a' : (value / 60).toFixed(1) + ' min';
const safe = value => String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');

export function summarizeRun(run) {
  if (!run || !Number.isSafeInteger(Number(run.id)) || !Array.isArray(run.jobs)) {
    throw new Error('Invalid run/jobs input');
  }
  const jobs = run.jobs.map(job => ({
    name: String(job.name ?? '(unnamed)'),
    conclusion: String(job.conclusion ?? 'unknown'),
    durationSeconds: seconds(job.started_at, job.completed_at),
    startedMs: asMs(job.started_at),
    completedMs: asMs(job.completed_at),
    steps: (Array.isArray(job.steps) ? job.steps : []).map(step => ({
      name: String(step.name ?? '(unnamed)'),
      seconds: seconds(step.started_at, step.completed_at),
    })),
  }));
  const starts = jobs.map(j => j.startedMs).filter(Number.isFinite);
  const ends = jobs.map(j => j.completedMs).filter(Number.isFinite);
  const start = starts.length ? Math.min(...starts) : null;
  const end = ends.length ? Math.max(...ends) : null;
  const durationSeconds = start !== null && end !== null && end >= start
    ? Math.round((end - start)/1000) : null;
  const created = asMs(run.created_at);
  const queueSeconds = created !== null && start !== null && start >= created
    ? Math.round((start - created)/1000) : null;
  const critical = jobs.filter(j => j.durationSeconds !== null)
    .sort((a,b) => b.durationSeconds-a.durationSeconds)[0] ?? null;
  const expensiveSteps = jobs.flatMap(job => job.steps.map(step => ({
    job: job.name, name: step.name, seconds: step.seconds,
  }))).filter(step => step.seconds !== null).sort((a,b) => b.seconds-a.seconds).slice(0,8);
  return {
    id: Number(run.id),
    workflow: workflowFile(run.path) ?? String(run.name ?? '(unknown)'),
    conclusion: String(run.conclusion ?? 'unknown'),
    headSha: typeof run.head_sha === 'string' ? run.head_sha : null,
    jobCount: jobs.length,
    incompleteJobs: jobs.filter(j => j.durationSeconds === null && j.conclusion !== 'skipped').length,
    durationSeconds, queueSeconds,
    longestJob: critical ? {name:critical.name, seconds:critical.durationSeconds} : null,
    expensiveSteps,
    // Reporting never interprets missing timestamps, runs or data as zero.
  };
}

export function summarizeCohort(runs) {
  if (!Array.isArray(runs)) throw new Error('Expected runs array');
  const details = runs.map(summarizeRun);
  const byWorkflow = {};
  for (const workflow of new Set(details.map(d => d.workflow))) {
    const sample = details.filter(d => d.workflow === workflow);
    const successful = sample.filter(d => d.conclusion === 'success');
    byWorkflow[workflow] = {
      count: sample.length, successful:successful.length,
      p50Seconds:percentile(successful.map(d=>d.durationSeconds),0.5),
      p95Seconds:percentile(successful.map(d=>d.durationSeconds),0.95),
      queueP50Seconds:percentile(successful.map(d=>d.queueSeconds),0.5),
      failureCount:sample.filter(d => d.conclusion === 'failure').length,
      unknownTimingCount:sample.filter(d => d.durationSeconds === null).length,
    };
  }
  return {schema:1,details,byWorkflow};
}

export function renderMarkdown(report) {
  let out = '## MID CI/CD – read-only timing audit\n\n';
  out += 'Times are derived from job timestamps; missing measurements remain **n/a**, never zero. ';
  out += 'This is not an end-to-end source-to-Stable measurement and has no release authorization effect.\n\n';
  out += '| Workflow | Runs | Success | Failure | P50 | P95 | Queue P50 |\n';
  out += '|---|---:|---:|---:|---:|---:|---:|\n';
  for (const [name, c] of Object.entries(report.byWorkflow)) {
    out += '| '+safe(name)+' | '+c.count+' | '+c.successful+' | '+c.failureCount+' | '+format(c.p50Seconds)+' | '+format(c.p95Seconds)+' | '+format(c.queueP50Seconds)+' |\n';
  }
  out += '\n| Run | Status | Elapsed | Slowest job | Slowest duration | Incomplete timing |\n|---|---|---:|---|---:|---:|\n';
  for (const r of report.details) {
    out += '| '+r.id+' | '+safe(r.conclusion)+' | '+format(r.durationSeconds)+' | '+
      safe(r.longestJob?.name ?? 'n/a')+' | '+format(r.longestJob?.seconds ?? null)+
      ' | '+r.incompleteJobs+' |\n';
  }
  return out;
}

async function api(path, token) {
  const response = await fetch('https://api.github.com/'+path, {
    headers: {
      Accept:'application/vnd.github+json',
      'X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'MID-readonly-release-timing',
      ...(token ? {Authorization:'Bearer '+token} : {}),
    },
    signal:AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('GitHub read failed: HTTP '+response.status+' for action metadata');
  return response.json();
}
export async function githubRuns(repository, count, token, workflowNames=DEFAULT_WORKFLOWS) {
  if (!/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(repository) || repository.split('/').some(p => p==='.' || p==='..')) throw new Error('Invalid repository');
  if (!Number.isInteger(count) || count < 1 || count > 30) throw new Error('Count must be 1–30');
  if (!(workflowNames instanceof Map) || workflowNames.size === 0) {
    throw new Error('Explicit workflow filename/event map required');
  }
  const selected = [];
  for (const [filename, expectedEvent] of workflowNames) {
    if (!/^[a-z0-9-]+\.yml$/.test(filename) || !['pull_request','workflow_run','workflow_dispatch'].includes(expectedEvent)) {
      throw new Error('Unexpected workflow identity or event');
    }
    let found = 0;
    // Per-workflow REST endpoint prevents frequent skipped Draft PRs from
    // displacing real deploys. Bound pagination to avoid silently endless API reads.
    for (let page=1;page<=10 && found<count;page++) {
      const latest = await api('repos/'+repository+'/actions/workflows/'+filename+'/runs?per_page=100&page='+page,token);
      if (!Array.isArray(latest.workflow_runs)) throw new Error('Missing GitHub workflow_runs list');
      const batch = latest.workflow_runs;
      for (const run of batch) {
        if (workflowFile(run.path)!==filename || run.event!==expectedEvent ||
            run.status!=='completed' || run.conclusion==='skipped') continue;
        selected.push(run);
        found++;
        if (found===count) break;
      }
      if (batch.length<100) break;
      if (page===10 && found<count) throw new Error('Workflow sampling reached 1000 runs without '+count+' non-skipped runs: '+filename);
    }
    if (!found) throw new Error('No completed, non-skipped runs found: '+filename);
  }
  const runs = [];
  for (const run of selected) {
    const jobs = [];
    for (let page=1; page<=10;page++) {
      const data = await api('repos/'+repository+'/actions/runs/'+run.id+'/jobs?per_page=100&page='+page,token);
      const batch = data.jobs ?? [];
      jobs.push(...batch);
      if (batch.length < 100) break;
      if (page === 10) throw new Error('Too many jobs; incomplete pagination refused');
    }
    runs.push({...run, jobs});
  }
  return runs;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = key => {
    const i = args.indexOf(key);
    if (i === -1) return null;
    if (i+1 >= args.length || args[i+1].startsWith('--')) throw new Error('Missing argument '+key);
    return args[i+1];
  };
  const input = arg('--input');
  const n = Number(arg('--count') ?? 5);
  let runs;
  if (input) {
    const payload = JSON.parse(await readFile(input,'utf8'));
    runs = Array.isArray(payload) ? payload : payload.runs;
  } else {
    runs = await githubRuns(arg('--repo') ?? process.env.GITHUB_REPOSITORY ?? '',
      n,process.env.GITHUB_TOKEN ?? '');
  }
  const result = summarizeCohort(runs);
  if (!result.details.length) throw new Error('No runs in sample');
  const md = renderMarkdown(result);
  process.stdout.write(md);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) await appendFile(summaryPath,md,'utf8');
  if (args.includes('--json')) process.stdout.write('\n'+JSON.stringify(result,null,2)+'\n');
}
if (process.argv[1]?.endsWith('release-timing.mjs')) {
  main().catch(error => {console.error('Read-only timing audit failed: '+error.message);process.exitCode=1;});
}
