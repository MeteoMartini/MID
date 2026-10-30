#!/usr/bin/env node
// MID release train preflight is read-only and NEVER authorizes or performs merging.
import {readFile} from 'node:fs/promises';
const SHA=/^[0-9a-f]{40}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const validRepo = value => typeof value === 'string' && REPO.test(value) && !value.split('/').some(p=>p==='.'||p==='..');
const SENSITIVE = /^(?:\.github\/|ci\/github\/|worker(?:-src)?\/|workflow-patches\/|tools\/ci\/|tools\/ruc\/|tools\/release\/|tools\/cloudflare\/|package(?:-lock)?\.json$|MID_(?:BASELINE|SOURCE_OF_TRUTH)|AGENTS\.md)/;

export function validateManifest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.schema !== 1) throw Error('Invalid manifest schema');
  if (!SHA.test(raw.stableSha) || !SHA.test(raw.mainSha) || raw.stableSha !== raw.mainSha) {
    throw Error('Expected stable and main must match and be full SHAs');
  }
  if (raw.candidateMode !== undefined && !['non-draft','draft-planning'].includes(raw.candidateMode)) throw Error('Invalid candidate mode');
  if (!Array.isArray(raw.changes) || raw.changes.length < 1 || raw.changes.length > 5) {
    throw Error('Release train must contain 1–5 independently reviewed changes');
  }
  const seen=new Set(),heads=new Set();
  for (const change of raw.changes) {
    if (!change || typeof change !== 'object' || !Number.isSafeInteger(change.pr) || change.pr < 1 || !SHA.test(change.headSha)) throw Error('Invalid PR or expected head SHA');
    if (seen.has(change.pr) || heads.has(change.headSha)) throw Error('Duplicated candidate');
    seen.add(change.pr);heads.add(change.headSha);
  }
  return raw;
}

export function analyzeCandidates(manifest, current, pullRequests) {
  validateManifest(manifest);
  const blockers=[], observations=[];
  const draftPlanning = manifest.candidateMode === 'draft-planning';
  if (current.mainSha !== manifest.mainSha || current.stableSha !== manifest.stableSha ||
      current.mainSha !== current.stableSha) blockers.push('Stale main/stable SHA: refresh from promoted Stable');
  const paths=new Map();
  for (const expected of manifest.changes) {
    const p=pullRequests.find(p=>p.number===expected.pr);
    if (!p) {blockers.push('Missing pull request #'+expected.pr);continue;}
    if (p.headSha !== expected.headSha || !SHA.test(p.headSha)) blockers.push('PR #'+p.number+' changed head');
    if (p.state !== 'open' || typeof p.draft !== 'boolean' || (!draftPlanning && p.draft) || p.merged !== false) blockers.push('PR #'+p.number+' not an eligible open candidate');
    if (!/^(?:chatgpt|codex)\//.test(p.headRef ?? '')) blockers.push('PR #'+p.number+' unauthorized source branch');
    if (draftPlanning && p.draft) observations.push('Draft #'+p.number+' remains Draft; planning only, do not mark Ready to collect changes');
    if (p.base !== 'main' || p.headRepo !== current.repository) blockers.push('PR #'+p.number+' unexpected base or head repository');
    if (p.baseSha !== manifest.mainSha) blockers.push('PR #'+p.number+' baseline drift: integration review required');
    if (!Array.isArray(p.files) || p.files.length === 0) blockers.push('PR #'+p.number+' lacks verified file inventory');
    else {
      for (const filename of p.files) {
        if (typeof filename !== 'string' || filename.includes('..') || filename.startsWith('/')) {
          blockers.push('PR #'+p.number+' unsafe filename'); continue;
        }
        const previous=paths.get(filename);
        if (previous !== undefined) blockers.push('Overlapping file '+filename+' (#'+previous+' / #'+p.number+')');
        else paths.set(filename,p.number);
        if (SENSITIVE.test(filename)) observations.push('Sensitive path '+filename+' (#'+p.number+'); separate domain-specific review and integration gate');
      }
    }
  }
  return {schema:1,candidateMode:manifest.candidateMode ?? 'non-draft',releaseAuthorized:false,validForIntegrationReview:blockers.length===0,blockers,observations,
    candidates:manifest.changes.map(c=>c.pr),totalChangedFiles:paths.size,
    notice:'Read-only planning result; not a test, approval, merge authorization or release gate.'};
}
async function api(repository,path,token) {
  const response=await fetch('https://api.github.com/repos/'+repository+'/'+path,{
    headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',
      'User-Agent':'MID-release-train-preflight',...(token?{Authorization:'Bearer '+token}:{})},
    signal:AbortSignal.timeout(20000),
  });
  if (!response.ok) throw Error('GitHub read failed: HTTP '+response.status);
  return response.json();
}
export async function inspectRemote(manifest,repository,token) {
  if (!validRepo(repository)) throw Error('Invalid repository');
  validateManifest(manifest);
  const [main,stable]=await Promise.all([
    api(repository,'git/ref/heads/main',token),api(repository,'git/ref/heads/mid-stable',token),
  ]);
  const data=[];
  for (const change of manifest.changes) {
    const pr=await api(repository,'pulls/'+change.pr,token);
    const files=[];
    for (let page=1; page<=10; page++) {
      const list=await api(repository,'pulls/'+change.pr+'/files?per_page=100&page='+page,token);
      if (!Array.isArray(list)) throw Error('Missing file inventory');
      files.push(...list);
      if (list.length<100) break;
      if (page===10) throw Error('Incomplete file inventory');
    }
    if (!Number.isSafeInteger(pr.changed_files) || pr.changed_files !== files.length) throw Error('Incomplete file inventory');
    const fresh=await api(repository,'pulls/'+change.pr,token);
    const identity = p => JSON.stringify([p.number,p.state,p.draft,p.merged,p.head?.sha,p.head?.ref,p.head?.repo?.full_name,p.base?.ref,p.base?.sha,p.changed_files]);
    if (identity(pr)!==identity(fresh)) throw Error('PR changed during file inventory');
    data.push({number:pr.number,state:pr.state,draft:pr.draft,merged:pr.merged,
      headSha:pr.head?.sha,headRef:pr.head?.ref,headRepo:pr.head?.repo?.full_name,
      base:pr.base?.ref,baseSha:pr.base?.sha,
      files:[...new Set(files.flatMap(f=>f.status==='renamed'?[f.filename,f.previous_filename]:[f.filename]))]});
  }
  const [finalMain,finalStable]=await Promise.all([
    api(repository,'git/ref/heads/main',token),api(repository,'git/ref/heads/mid-stable',token),
  ]);
  if (main.object?.sha !== finalMain.object?.sha || stable.object?.sha !== finalStable.object?.sha) throw Error('Main/Stable changed during planning');
  // Recheck every head after all inventories; a later PR fetch must not hide an earlier head update.
  for (const candidate of data) {
    const finalPr=await api(repository,'pulls/'+candidate.number,token);
    if (finalPr.head?.sha!==candidate.headSha || finalPr.head?.ref!==candidate.headRef ||
        finalPr.head?.repo?.full_name!==candidate.headRepo || finalPr.base?.ref!==candidate.base ||
        finalPr.base?.sha!==candidate.baseSha || finalPr.state!==candidate.state || finalPr.draft!==candidate.draft ||
        finalPr.merged!==candidate.merged) throw Error('PR changed before planning completed');
  }
  return analyzeCandidates(manifest,{
    mainSha:main.object?.sha,stableSha:stable.object?.sha,repository,
  },data);
}
async function main() {
  const [file,repository] = process.argv.slice(2);
  if (!file || !repository) throw Error('Usage: release-train-plan.mjs <manifest.json> <owner/repo>');
  const manifest=validateManifest(JSON.parse(await readFile(file,'utf8')));
  const result=await inspectRemote(manifest,repository,process.env.GITHUB_TOKEN || '');
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if (!result.validForIntegrationReview) process.exitCode=1;
}
if (process.argv[1]?.endsWith('release-train-plan.mjs')) {
  main().catch(error=>{console.error('Release train preflight blocked: '+error.message);process.exitCode=1;});
}
