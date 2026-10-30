#!/usr/bin/env node
// Experimental read-only Source-Gate evidence validator.
// This cannot grant release, replace installer tests, or validate build artifacts.
const SHA=/^[0-9a-f]{40}$/;
const validRepo = value => typeof value==='string' && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value) && !value.split('/').some(p=>p==='.'||p==='..');
const EXPECTED_PATH='.github/workflows/chatgpt-pr-gate.yml';
const REQUIRED=[
  'Source-Kern vollständig prüfen',
  'Core-Regression · core-1/4',
  'Core-Regression · core-2/4',
  'Core-Regression · core-3/4',
  'Core-Regression · core-4/4',
  'Heavy-Regression · heavy-browser-state ·',
  'Heavy-Regression · heavy-native-map ·',
  'Heavy-Regression · heavy-mountain-visual ·',
  'Heavy-Regression · heavy-unified-map · 1/3',
  'Heavy-Regression · heavy-unified-map · 2/3',
  'Heavy-Regression · heavy-unified-map · 3/3',
  'Agent-Quellstand vollständig prüfen',
];
const OPTIONAL = new Set([
  'RUC +27h Kern, EPS und Gesamtpaket',
  'Extremwetterpolygone · echte Browserpixel',
]);
const clean = sha => typeof sha==='string' && SHA.test(sha);
const norm = value => String(value ?? '').trim();

export function validateSourceGateEvidence({expected,mainSha,stableSha,pr,run,jobs}) {
  const blockers = [];
  const reject = reason => blockers.push(reason);
  if (!expected || !clean(expected.headSha) || !Number.isSafeInteger(expected.prNumber) ||
      !Number.isSafeInteger(expected.runId) || expected.prNumber<=0 || expected.runId<=0 ||
      !validRepo(expected.repository)) {
    throw Error('Invalid expected provenance inputs');
  }
  if (!clean(mainSha)||mainSha!==stableSha) reject('main/mid-stable SHA drift');
  if (!pr || pr.number!==expected.prNumber || pr.state!=='open' || pr.draft!==false ||
      pr.base?.ref!=='main' || pr.base?.sha!==mainSha ||
      pr.head?.sha!==expected.headSha ||
      pr.head?.repo?.full_name!==expected.repository) reject('PR HEAD, base, state, draft or repository mismatch');
  if (!run || run.id!==expected.runId || run.name!=='MID-Agent-Quellstand prüfen' ||
      run.path!==EXPECTED_PATH || run.event!=='pull_request' ||
      run.head_sha!==expected.headSha || run.status!=='completed' ||
      run.conclusion!=='success' || !Number.isSafeInteger(run.run_attempt) ||
      run.run_attempt<1 || run.repository?.full_name!==expected.repository) {
    reject('Source Gate run identity, event, attempt or conclusion mismatch');
  }
  if (!Array.isArray(jobs) || jobs.length<REQUIRED.length || jobs.length>100) reject('Incomplete job inventory');
  const seen = new Map(), jobIds = new Set();
  for (const job of Array.isArray(jobs)?jobs:[]) {
    const name=norm(job?.name);
    if (!name || !Number.isSafeInteger(job?.id) || job.id<=0 || jobIds.has(job.id) ||
        job.run_attempt!==run?.run_attempt || job.head_sha!==expected.headSha ||
        !Number.isSafeInteger(job?.run_id) || job.run_id!==expected.runId) {
      reject('Invalid job identity/run reference');continue;
    }
    jobIds.add(job.id);
    if (seen.has(name)) reject('Duplicated job name '+name);
    seen.set(name,job);
    if (!REQUIRED.includes(name) && !OPTIONAL.has(name)) reject('Unknown job '+name);
    if (job.status!=='completed' || !['success','skipped'].includes(job.conclusion)) reject('Unsuccessful or unfinished job '+name);
    if (REQUIRED.includes(name) && job.conclusion!=='success') reject('Required gate not green '+name);
  }
  for (const name of REQUIRED) if (!seen.has(name)) reject('Missing required gate '+name);
  // The optional matrix may be skipped, but never allowed to fail.
  return {
    schema:1,kind:'source-gate-readonly-probe',sourceRunId:expected.runId,
    headSha:expected.headSha,baseSha:mainSha,sourceAttempt:run?.run_attempt??null,
    requiredJobs:REQUIRED.length,validatedJobs:jobs?.length??null,
    eligibleForFurtherEvidenceReview:blockers.length===0,
    blockers,
    warning:'This report is NOT a security attestation, deploy approval, build reuse entitlement or Stable promotion.'
  };
}
async function api(repo,endpoint,token) {
  const response=await fetch('https://api.github.com/repos/'+repo+'/'+endpoint,{
    headers: {Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'MID-readonly-source-qualifier',...(token?{Authorization:'Bearer '+token}:{})},
    signal:AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error('GitHub evidence read error HTTP '+response.status);
  return response.json();
}
export async function inspectSourceGate(expected,token) {
  const {repository,prNumber,runId}=expected;
  if (!validRepo(repository) ||
      !Number.isSafeInteger(prNumber)||prNumber<=0 ||
      !Number.isSafeInteger(runId)||runId<=0 || !clean(expected.headSha)) {
    throw Error('Invalid CLI evidence request');
  }
  const [main,stable,pr,run]=await Promise.all([
    api(repository,'git/ref/heads/main',token),
    api(repository,'git/ref/heads/mid-stable',token),
    api(repository,'pulls/'+prNumber,token),
    api(repository,'actions/runs/'+runId,token),
  ]);
  if (!Number.isSafeInteger(run.run_attempt) || run.run_attempt<1) throw Error('Invalid source run attempt');
  const jobs=[];
  for(let page=1;page<=10;page++){
    const data=await api(repository,'actions/runs/'+runId+'/attempts/'+run.run_attempt+'/jobs?per_page=100&page='+page,token);
    if (!Array.isArray(data.jobs)) throw Error('Missing jobs data');
    jobs.push(...data.jobs);
    if (data.jobs.length<100) break;
    if(page===10)throw Error('Job pagination incomplete');
  }
  const [finalMain,finalStable,finalPr,finalRun]=await Promise.all([
    api(repository,'git/ref/heads/main',token),api(repository,'git/ref/heads/mid-stable',token),
    api(repository,'pulls/'+prNumber,token),api(repository,'actions/runs/'+runId,token),
  ]);
  if (main.object?.sha!==finalMain.object?.sha || stable.object?.sha!==finalStable.object?.sha ||
      run.run_attempt!==finalRun.run_attempt) throw Error('Evidence changed during inspection');
  const before=validateSourceGateEvidence({expected,mainSha:main.object?.sha,stableSha:stable.object?.sha,pr,run,jobs});
  const after=validateSourceGateEvidence({expected,mainSha:finalMain.object?.sha,stableSha:finalStable.object?.sha,pr:finalPr,run:finalRun,jobs});
  if (!before.eligibleForFurtherEvidenceReview) return before;
  return after;
}
if (process.argv[1]?.endsWith('source-gate-evidence.mjs')) {
  const [pr,run,headSha]=process.argv.slice(2);
  const input={
    repository:process.env.GITHUB_REPOSITORY??'',
    prNumber:Number(pr),runId:Number(run),headSha
  };
  inspectSourceGate(input,process.env.GITHUB_TOKEN??'')
    .then(report=>{console.log(JSON.stringify(report,null,2));
      if (!report.eligibleForFurtherEvidenceReview)process.exitCode=1;})
    .catch(error=>{console.error('Source evidence blocked: '+error.message);process.exitCode=1;});
}
