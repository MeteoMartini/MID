#!/usr/bin/env node
// MID release train preflight is read-only and NEVER authorizes or performs merging.
import {readFile} from 'node:fs/promises';
const SHA=/^[0-9a-f]{40}$/;
const REPO=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const SENSITIVE = /^(?:\.github\/|ci\/github\/|worker\/|tools\/ruc\/|tools\/release\/|tools\/cloudflare\/|package(?:-lock)?\.json$|MID_(?:BASELINE|SOURCE_OF_TRUTH)|AGENTS\.md)/;

export function validateManifest(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.schema !== 1) throw Error('Invalid manifest schema');
  if (!SHA.test(raw.stableSha) || !SHA.test(raw.mainSha) || raw.stableSha !== raw.mainSha) {
    throw Error('Expected stable and main must match and be full SHAs');
  }
  if (!Array.isArray(raw.changes) || raw.changes.length < 1 || raw.changes.length > 5) {
    throw Error('Release train must contain 1–5 independently reviewed changes');
  }
  const seen=new Set(),heads=new Set();
  for (const change of raw.changes) {
    if (!Number.isSafeInteger(change.pr) || change.pr < 1 || !SHA.test(change.headSha)) throw Error('Invalid PR or expected head SHA');
    if (seen.has(change.pr) || heads.has(change.headSha)) throw Error('Duplicated candidate');
    seen.add(change.pr);heads.add(change.headSha);
  }
  return raw;
}

export function analyzeCandidates(manifest, current, pullRequests) {
  const blockers=[], observations=[];
  if (current.mainSha !== manifest.mainSha || current.stableSha !== manifest.stableSha ||
      current.mainSha !== current.stableSha) blockers.push('Stale main/stable SHA: refresh from promoted Stable');
  const paths=new Map();
  for (const expected of manifest.changes) {
    const p=pullRequests.find(p=>p.number===expected.pr);
    if (!p) {blockers.push('Missing pull request #'+expected.pr);continue;}
    if (p.headSha !== expected.headSha || !SHA.test(p.headSha)) blockers.push('PR #'+p.number+' changed head');
    if (p.state !== 'open' || p.draft === true || p.merged === true) blockers.push('PR #'+p.number+' not a non-draft open candidate');
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
  return {schema:1,validForIntegrationReview:blockers.length===0,blockers,observations,
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
  if (!REPO.test(repository)) throw Error('Invalid repository');
  const [main,stable]=await Promise.all([
    api(repository,'git/ref/heads/main',token),api(repository,'git/ref/heads/mid-stable',token),
  ]);
  const data=[];
  for (const change of manifest.changes) {
    const pr=await api(repository,'pulls/'+change.pr,token);
    const files=[];
    for (let page=1; page<=10; page++) {
      const list=await api(repository,'pulls/'+change.pr+'/files?per_page=100&page='+page,token);
      files.push(...list.map(f=>f.filename));
      if (list.length<100) break;
      if (page===10) throw Error('Incomplete file inventory');
    }
    data.push({number:pr.number,state:pr.state,draft:pr.draft,merged:pr.merged,
      headSha:pr.head?.sha,headRepo:pr.head?.repo?.full_name,
      base:pr.base?.ref,baseSha:pr.base?.sha,files});
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
