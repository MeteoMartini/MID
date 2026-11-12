// SHA-bound, read-only inventory of parallel MID PR candidates.
// No repository writes, PR closure, merging, release or API credentials.
const SHA=/^[0-9a-f]{40}$/;
const DOMAINS=Object.freeze(['release-security','meteorology-ruc','maps-ui','dependency-quality','other']);
const safeFiles=arr=>Array.isArray(arr)&&arr.length>0&&arr.length<=200&&arr.every(x=>
  typeof x==='string'&&x.length>0&&x.length<300&&!x.includes('..')&&!x.startsWith('/'));
export function classifyMidPrPaths(paths){
  if(!safeFiles(paths))return 'unknown-paths';
  if(paths.some(x=>/(^\.github\/|^ci\/|^tools\/ci\/|^contracts\/|release|security|codeql)/i.test(x)))
    return 'release-security';
  if(paths.some(x=>/(ruc|grib|radar|dwd|ecmwf|precipitation|weather|worker)/i.test(x)))
    return 'meteorology-ruc';
  if(paths.some(x=>/(map|layer|legend|responsive|layout|popup|ui|css|chart)/i.test(x)))
    return 'maps-ui';
  if(paths.some(x=>/(lock\.json|^tests\/|^scripts\/qa-|dependenc|test-)/i.test(x)))
    return 'dependency-quality';
  return 'other';
}
export function assessMidPrBacklog({mainSha,stableSha,pullRequests,maxBatch=5,alreadyReleasedPaths=[]}={}){
  const errors=[];
  if(!SHA.test(mainSha??'')||mainSha!==stableSha)errors.push('STABLE_DRIFT');
  if(!Array.isArray(pullRequests)||pullRequests.length>200)errors.push('PR_LIST_INVALID');
  if(!Number.isInteger(maxBatch)||maxBatch<1||maxBatch>5)errors.push('MAX_BATCH_INVALID');
  if(!Array.isArray(alreadyReleasedPaths)||alreadyReleasedPaths.some(x=>typeof x!=='string'))
    errors.push('RELEASED_PATH_LIST_INVALID');
  if(errors.length)return {schema:'mid.pr-backlog.v1',valid:false,errors,
    releaseAuthorized:false,mergeAuthorized:false};
  const entries=[],ids=new Set(),stablePaths=new Set(alreadyReleasedPaths);
  for(const p of pullRequests){
    if(!p||!Number.isInteger(p.number)||p.number<1||ids.has(p.number)||
       p.state!=='open'||typeof p.draft!=='boolean'||!SHA.test(p.headSha??'')||
       !SHA.test(p.baseSha??'')||!Array.isArray(p.files)||p.files.length>200){
      errors.push('INVALID_OR_DUPLICATE_PR');continue;
    }
    ids.add(p.number);
    const paths=safeFiles(p.files)?[...new Set(p.files)]:[];
    const domain=classifyMidPrPaths(paths);
    const overlapWithReleased=paths.filter(x=>stablePaths.has(x));
    entries.push({
      number:p.number,headSha:p.headSha,baseSha:p.baseSha,draft:p.draft,
      domain,changedPaths:paths.length,overlapWithReleased,
      // This is NOT proof that any code was already integrated.
      checksRequired:[...new Set([
        ...(p.baseSha!==stableSha?['SOURCE_LINEAGE_REVIEW']:[]),
        ...(!paths.length?['CHANGED_FILES_NOT_VERIFIED']:[]),
        ...(overlapWithReleased.length?['LIVE_DIFF_COMPARE_REQUIRED']:[]),
        ...(p.draft?['DRAFT_NOT_RELEASE_ELIGIBLE']:[])
      ])],
      releaseAuthorized:false
    });
  }
  if(errors.length)return {schema:'mid.pr-backlog.v1',valid:false,errors,
    entries,releaseAuthorized:false,mergeAuthorized:false};
  const weights={'release-security':0,'meteorology-ruc':1,'maps-ui':2,
    'dependency-quality':3,'other':4,'unknown-paths':5};
  entries.sort((a,b)=>weights[a.domain]-weights[b.domain]||a.number-b.number);
  const groups=Object.fromEntries([...DOMAINS,'unknown-paths'].map(x=>[x,entries.filter(e=>e.domain===x).map(e=>e.number)]));
  const candidateNumbers=[],claimed=new Map(),allSeen=new Map(),pathCollisions=[];
  // Detect overlaps across ALL eligible drafts, even after the batch cap.
  // Planning only. Draft PRs stay Draft; no automatic bot/source eligibility.
  for(const e of entries){
    if(e.checksRequired.includes('SOURCE_LINEAGE_REVIEW')||
       e.checksRequired.includes('CHANGED_FILES_NOT_VERIFIED'))continue;
    const conflicts=[];
    const pr=pullRequests.find(x=>x.number===e.number);
    for(const path of pr.files){
      if(allSeen.has(path))conflicts.push({path,withPr:allSeen.get(path)});
      else allSeen.set(path,e.number);
    }
    if(conflicts.length){pathCollisions.push({pr:e.number,conflicts});continue;}
    if(candidateNumbers.length>=maxBatch)continue;
    if(pr.files.some(path=>claimed.has(path)))continue;
    candidateNumbers.push(e.number);
    for(const path of pr.files)claimed.set(path,e.number);
  }
  return {schema:'mid.pr-backlog.v1',valid:true,stableSha,
    entries,groups,pathCollisions,
    proposedReviewBatch:candidateNumbers,
    notes:[
      'Candidate batch means path-level non-overlapping planning only, NOT cherry-pick authorization.',
      'Changed filenames do not prove historical integration or absence of semantic conflict.',
      'Every Draft and every selected PR requires independently reviewed exact source SHA and full MID release gates.'
    ],
    releaseAuthorized:false,mergeAuthorized:false,autoClosePrs:false};
}
