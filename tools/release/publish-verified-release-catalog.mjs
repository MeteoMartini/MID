#!/usr/bin/env node
/** MID GitHub release CATALOG metadata only. No ZIP, rollback, recovery, deployment,
 * backfill, or workflow authority. Must only be invoked after the existing
 * installer finalize job has completed successfully. */
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const REPO='MeteoMartini/MID';
const SHA=/^[a-f0-9]{40}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
const required=[
 'Release-ZIP prüfen und immutable Snapshot vorbereiten',
 'Release-Core, Build, Audit und iOS prüfen',
 'Vollständig geprüften Release sammeln und committen',
 'Geprüften MID-Worker sicher automatisch veröffentlichen',
 'Erfolgreichen Pages-/Worker-Release finalisieren'
];
const core=['core-1/4','core-2/4','core-3/4','core-4/4'];
const heavy=['heavy-mountain-visual ·','heavy-native-map ·','heavy-browser-state ·',
 'heavy-unified-map · 1/3','heavy-unified-map · 2/3','heavy-unified-map · 3/3'];
const block=reason=>Object.freeze({state:'BLOCKED',reason,createAllowed:false,recoveryAuthorized:false});
const succeeded=job=>job?.status==='completed'&&job.conclusion==='success';
export function renderMidCatalogBody({tag,notes,sha,runId}) {
 return [
  '## MID '+tag+' · '+notes.title,'',
  '### Änderungen',...notes.external.map(x=>'- '+x),'',
  '### Nachgewiesene Veröffentlichung',
  '- Stable SHA: '+sha,
  '- Vollständiger Installer/Worker/Pages-Nachweis: https://github.com/'+REPO+'/actions/runs/'+runId,
  '- Changelog: https://github.com/'+REPO+'/blob/'+sha+'/CHANGELOG.md','',
  'Hinweis: GitHub Release-Katalogeintrag ohne attestierte ZIP/Recovery-Assets.',
  'Eine Immutable-Recovery-Freigabe ist damit NICHT verbunden (#839/#740).'
 ].join('\n');
}
const normalizeBody=body=>body.replace(/\r\n/g,'\n').trimEnd();
export function verifyMidCatalogReadback({created,postTag,postRelease,latestRelease,tag,sha,body}) {
 return Number.isSafeInteger(created?.id)&&created.id>0&&
   postTag?.ref==='refs/tags/'+tag&&postTag.object?.type==='commit'&&postTag.object.sha===sha&&
   postRelease?.id===created.id&&postRelease.tag_name===tag&&
   postRelease.name==='MID '+tag&&postRelease.draft===false&&postRelease.prerelease===false&&
   Array.isArray(postRelease.assets)&&postRelease.assets.length===0&&
   typeof postRelease.body==='string'&&normalizeBody(postRelease.body)===normalizeBody(body)&&
   latestRelease?.id===created.id&&latestRelease.tag_name===tag;
}


// A tag is reserved through a single atomic create-ref API call BEFORE its
// release is published. Any mismatch or orphaned tag requires operator review.
export function verifyMidTagReservation({createdTag,readback,tag,sha}={}){
 return SHA.test(sha||'')&&typeof tag==='string'&&
   createdTag?.ref==='refs/tags/'+tag&&createdTag.object?.type==='commit'&&
   createdTag.object.sha===sha&&
   readback?.ref==='refs/tags/'+tag&&readback.object?.type==='commit'&&
   readback.object.sha===sha;
}

// A duplicate/no-op Installer may confirm an already-issued catalog receipt,
 // but must NEVER generate or backfill a new tag on its own event SHA.
export function verifyMidNoopCatalog({sha,versions,notes,currentRun,currentRunId,
 tagRef,existingRelease,latestRelease,previousRun,packageSha}={}){
 const version=versions?.package,tag='v'+version;
 const keys=['baseline','notes','package','public','registry','source'];
 if(!SHA.test(sha||'')||!SHA.test(packageSha||'')||!VERSION.test(version||'')||
   !versions||Object.keys(versions).sort().join('|')!==keys.join('|')||
   keys.some(k=>versions[k]!==version)||notes?.version!==version||
   notes?.schema!==1||!Array.isArray(notes.external)||notes.external.length===0||
   !Array.isArray(notes.internal)||notes.internal.length===0)
  return false;
 if(!Number.isSafeInteger(currentRunId)||currentRunId<=0||
   currentRun?.id!==currentRunId||currentRun.event!=='workflow_dispatch'||
   currentRun.path!=='.github/workflows/install-mid.yml'||
   currentRun.status!=='in_progress'||currentRun.conclusion!==null||
   currentRun.head_sha!==sha||currentRun.repository?.full_name!==REPO)
  return false;
 const lines=[...(existingRelease?.body||'').matchAll(
  /^- Vollständiger Installer\/Worker\/Pages-Nachweis: https:\/\/github\.com\/MeteoMartini\/MID\/actions\/runs\/([1-9]\d+)$/gm)];
 if(lines.length!==1)return false;
 const oldId=Number(lines[0][1]);
 if(!Number.isSafeInteger(oldId)||oldId===currentRunId||
    previousRun?.id!==oldId||previousRun.status!=='completed'||
    previousRun.conclusion!=='success'||previousRun.event!=='workflow_dispatch'||
    previousRun.path!=='.github/workflows/install-mid.yml'||
    previousRun.head_sha!==packageSha||previousRun.repository?.full_name!==REPO)
  return false;
 const body=renderMidCatalogBody({tag,notes,sha,runId:oldId});
 return verifyMidExistingCatalogLatest({existingRelease,tagRef,latestRelease,tag,sha,body});
}

// An idempotent entry is only complete if GitHub still lists it as latest.
export function verifyMidExistingCatalogLatest({existingRelease,tagRef,latestRelease,tag,sha,body}){
 return verifyMidCatalogReadback({created:existingRelease,postTag:tagRef,
   postRelease:existingRelease,latestRelease,tag,sha,body});
}

export function assessMidCatalogEvidence(data={}){
 const {repo,releaseSha,localSha,mainSha,stableSha,versions,notes,
  run,runId,attempt,jobs,stableCommit,packageCommit,packageCompare,
  tagRef,existingRelease}=data;
 if(repo!==REPO||![releaseSha,localSha,mainSha,stableSha].every(x=>SHA.test(x||'')))
  return block('INVALID_SHA_OR_REPOSITORY');
 if(new Set([releaseSha,localSha,mainSha,stableSha]).size!==1)return block('BRANCH_OR_CHECKOUT_DRIFT');
 const version=versions?.package;
 const expectedVersionKeys=['baseline','notes','package','public','registry','source'];
 if(!VERSION.test(version||'')||!versions||Array.isArray(versions)||
   Object.keys(versions).sort().join('|')!==expectedVersionKeys.join('|')||
   expectedVersionKeys.some(key=>versions[key]!==version))
  return block('VERSION_MIRROR_MISMATCH');
 if(notes?.schema!==1||notes.version!==version||typeof notes.title!=='string'||
  !notes.title.trim()||notes.title.length>160||
  !/^20\d\d-\d\d-\d\d$/.test(notes.date||'')||
  !Array.isArray(notes.external)||notes.external.length<1||notes.external.length>30||
  notes.external.some(x=>typeof x!=='string'||!x.trim()||x.length>1000))
  return block('RELEASE_NOTES_INVALID');
 if(!Number.isSafeInteger(runId)||runId<=0||!Number.isSafeInteger(attempt)||attempt<=0||
   run?.id!==runId||run.run_attempt!==attempt||run?.repository?.full_name!==REPO||
   run.path!=='.github/workflows/install-mid.yml'||
   run.event!=='workflow_dispatch'||run.status!=='in_progress'||run.conclusion!==null)
  return block('INVALID_INSTALLER_RUN');
 const zipSha=packageCommit?.sha;
 const mergeSha=packageCommit?.parents?.[0]?.sha;
 if(stableCommit?.sha!==releaseSha||stableCommit.parents?.length!==1||
    !SHA.test(zipSha||'')||stableCommit.parents[0]?.sha!==zipSha||
    packageCommit.parents?.length!==1||!SHA.test(mergeSha||'')||
    run.head_sha!==zipSha)return block('RELEASE_STABLE_ZIP_LINEAGE_MISMATCH');
 if(packageCompare?.status!=='ahead'||packageCompare.ahead_by!==1||
    packageCompare.behind_by!==0||packageCompare.total_commits!==1||
    packageCompare.base_commit?.sha!==mergeSha||
    packageCompare.commits?.length!==1||packageCompare.commits[0]?.sha!==zipSha||
    packageCompare.files?.length!==1||
    packageCompare.files[0]?.filename!=='MID-professional-replacement.zip'||
    !['added','modified'].includes(packageCompare.files[0]?.status))
  return block('PACKAGE_NOT_ZIP_ONLY_OR_UNPROVEN');
 if(!Array.isArray(jobs)||jobs.length===0||jobs.length>=100)return block('INCOMPLETE_JOB_INVENTORY');
 const catalogJobs=jobs.filter(j=>j?.name==='SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren');
 if(catalogJobs.length!==1||catalogJobs[0].status!=='in_progress'||catalogJobs[0].conclusion!==null)
  return block('CATALOG_JOB_PROVENANCE_INVALID');
 // Only genuine earlier Pages retry failures may be superseded by an
 // independently successful later deployment. Every other failed/cancelled
 // Installer job remains a hard blocker (including cancelled Heavy shards).
 const pagesName=/^MID auf GitHub Pages veröffentlichen · Versuch ([123])$/;
 const pageJobs=jobs.filter(j=>pagesName.test(j?.name||''));
 const pageAttempts=pageJobs.map(j=>Number(pagesName.exec(j.name)[1]));
 const successes=pageJobs.filter(succeeded);
 if(pageJobs.length<1||pageJobs.length>3||
    new Set(pageAttempts).size!==pageAttempts.length||successes.length!==1)
  return block('PAGES_DEPLOYMENT_NOT_GREEN');
 const successfulAttempt=Number(pagesName.exec(successes[0].name)[1]);
 const supersededPages=new Set(pageJobs.filter(j=>j.conclusion==='failure'&&
   Number(pagesName.exec(j.name)[1])<successfulAttempt));
 if(pageJobs.some(j=>j.status!=='completed'||
    !['success','skipped'].includes(j.conclusion)&&!supersededPages.has(j)))
  return block('PAGES_DEPLOYMENT_NOT_GREEN');
 if(jobs.some(j=>j?.name!=='SHA-verifizierten GitHub Release-Katalog nach Stable aktualisieren'&&
    !supersededPages.has(j)&&
    (j?.status!=='completed'||!['success','skipped'].includes(j.conclusion))))
  return block('OTHER_INSTALLER_JOB_UNVERIFIED');
 const exactlyOneSuccess=name=>jobs.filter(j=>j?.name===name).length===1&&
  succeeded(jobs.find(j=>j?.name===name));
 for(const name of required)if(!exactlyOneSuccess(name))return block('REQUIRED_JOB_NOT_GREEN');
 for(const id of core)if(!exactlyOneSuccess('Release-Core-Regression · '+id))
  return block('CORE_SHARD_NOT_GREEN');
 for(const id of heavy)if(!exactlyOneSuccess('Release-Heavy · '+id))
  return block('HEAVY_SHARD_NOT_GREEN');
 const optionalPrep=jobs.filter(j=>j?.name==='GitHub-Pages-Artefakt parallel vorbereiten');
 if(optionalPrep.length!==1||optionalPrep[0].status!=='completed'||
    !['success','skipped'].includes(optionalPrep[0].conclusion))
  return block('PAGES_ARTIFACT_PREPARATION_INVALID');
 // A skipped staging job is permissible only when the verified real
 // deployment above succeeded and no later failed/cancelled attempt exists.
 const tag='v'+version;
 if(tagRef!=null&&(tagRef.ref!=='refs/tags/'+tag||
    tagRef.object?.type!=='commit'||tagRef.object.sha!==releaseSha))
  return block('EXISTING_TAG_CONFLICT');
 const expectedBody=renderMidCatalogBody({tag,notes,sha:releaseSha,runId});
 if(existingRelease!=null){
  if(!tagRef||!Number.isSafeInteger(existingRelease.id)||existingRelease.id<=0||
     existingRelease.tag_name!==tag||existingRelease.name!=='MID '+tag||
     existingRelease.draft!==false||existingRelease.prerelease!==false||
     !Array.isArray(existingRelease.assets)||existingRelease.assets.length!==0||
     typeof existingRelease.body!=='string'||
     normalizeBody(existingRelease.body)!==normalizeBody(expectedBody))
   return block('EXISTING_RELEASE_CONFLICT');
  return Object.freeze({state:'EXISTS',tag,version,releaseSha,createAllowed:false,recoveryAuthorized:false});
 }
 // A pre-existing tag without an exact matching Catalog release has untrusted provenance.
 if(tagRef!=null)return block('UNPAIRED_PREEXISTING_TAG');
 return Object.freeze({state:'ELIGIBLE_METADATA_ONLY',tag,version,releaseSha,createAllowed:true,recoveryAuthorized:false});
}

function githubApi(path,method='GET',payload,optional404=false){
 const args=['api','-H','X-GitHub-Api-Version: 2022-11-28'];
 if(method!=='GET')args.push('--method',method);
 args.push(path);
 if(payload!==undefined)args.push('--input','-');
 const x=spawnSync('gh',args,{input:payload===undefined?undefined:JSON.stringify(payload),
  encoding:'utf8',timeout:35000,maxBuffer:20*1024*1024});
 if(x.error)throw Error('GitHub API transport error');
 if(x.status!==0){
  if(optional404&&x.status===1&&/\bHTTP 404\b/.test(x.stderr||''))return null;
  throw Error('GitHub API rejected '+method+' '+path+' (exit '+x.status+')');
 }
 try{return JSON.parse(x.stdout)}catch{throw Error('Invalid GitHub response '+path)}
}
const localJson=path=>JSON.parse(readFileSync(path,'utf8'));
const refSha=name=>githubApi('repos/'+REPO+'/git/ref/heads/'+name)?.object?.sha;
const positiveInt=s=>/^[1-9]\d*$/.test(s||'')?Number(s):NaN;

export function publishMidCatalogFromInstaller(){
 const sha=process.env.STABLE_SHA||'';
 const runId=positiveInt(process.env.GITHUB_RUN_ID);
 const attempt=positiveInt(process.env.GITHUB_RUN_ATTEMPT);
 const releaseNoop=process.env.MID_CATALOG_RELEASE_NOOP;
 if(!['true','false'].includes(releaseNoop)||!process.env.GH_TOKEN||
    process.env.GITHUB_REPOSITORY!==REPO||!SHA.test(sha)||
    !Number.isSafeInteger(runId)||!Number.isSafeInteger(attempt))
  throw Error('No authentic MID Installer publishing context');
 const git=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',timeout:5000});
 if(git.status!==0)throw Error('No verified checkout');
 const version=localJson('package.json').version;
 const notes=localJson('docs/releases/MID_RELEASE_NOTES_'+version+'.json');
 const versions={
  package:version,baseline:localJson('MID_BASELINE.json').releaseVersion,
  registry:localJson('contracts/index.json').releaseVersion,
  public:localJson('public/version.json').version,
  source:/MID_VERSION='([^']+)'/.exec(readFileSync('src/version.ts','utf8'))?.[1],
  notes:notes.version
 };
 const run=githubApi('repos/'+REPO+'/actions/runs/'+runId);
 const inventory=githubApi('repos/'+REPO+'/actions/runs/'+runId+'/jobs?per_page=100');
 const stableCommit=githubApi('repos/'+REPO+'/git/commits/'+sha);
 const packageSha=stableCommit?.parents?.[0]?.sha;
 if(!SHA.test(packageSha||''))throw Error('No verified package parent');
 const packageCommit=githubApi('repos/'+REPO+'/git/commits/'+packageSha);
 const mergeSha=packageCommit?.parents?.[0]?.sha;
 if(!SHA.test(mergeSha||''))throw Error('No verified Source merge parent');
 const packageCompare=githubApi('repos/'+REPO+'/compare/'+mergeSha+'...'+packageSha);
 if(!Array.isArray(inventory.jobs)||inventory.total_count!==inventory.jobs.length)
  throw Error('Installer jobs truncated');
 const tag='v'+version;
 const tagRef=githubApi('repos/'+REPO+'/git/ref/tags/'+tag,'GET',undefined,true);
 const existingRelease=githubApi('repos/'+REPO+'/releases/tags/'+tag,'GET',undefined,true);
 if(releaseNoop==='true'){
  // An original successful no-op has github.sha == existing Stable SHA;
  // a verified *older* catalog entry is the only admissible outcome.
  // No orphan recovery, tag creation, retroactive release or metadata write.
  const match=[...(existingRelease?.body||'').matchAll(
   /^- Vollständiger Installer\/Worker\/Pages-Nachweis: https:\/\/github\.com\/MeteoMartini\/MID\/actions\/runs\/([1-9]\d+)$/gm)];
  const oldId=match.length===1?Number(match[0][1]):0;
  const previousRun=Number.isSafeInteger(oldId)&&oldId>0?
   githubApi('repos/'+REPO+'/actions/runs/'+oldId):null;
  // Re-read mutable tag/release metadata after the previous-run lookup.
  // Never attest an idempotent receipt from stale initial metadata.
  const freshTagRef=githubApi('repos/'+REPO+'/git/ref/tags/'+tag,'GET',undefined,true);
  const freshRelease=githubApi('repos/'+REPO+'/releases/tags/'+tag,'GET',undefined,true);
  const latestRelease=githubApi('repos/'+REPO+'/releases/latest');
  if(refSha('main')!==sha||refSha('mid-stable')!==sha||
     git.stdout.trim()!==sha||
     !verifyMidNoopCatalog({sha,versions,notes,currentRun:run,currentRunId:runId,
       tagRef:freshTagRef,existingRelease:freshRelease,latestRelease,previousRun,packageSha}))
   throw Error('No-op requires existing exact verified latest Catalog; no new publication');
  console.log('MID_GITHUB_CATALOG_NOOP_VERIFIED='+JSON.stringify({sha,tag,runId,catalogOnly:true}));
  return;
 }
 const evidence=assessMidCatalogEvidence({
  repo:REPO,releaseSha:sha,localSha:git.stdout.trim(),
  mainSha:refSha('main'),stableSha:refSha('mid-stable'),
  versions,notes,run,runId,attempt,jobs:inventory.jobs,
  stableCommit,packageCommit,packageCompare,tagRef,existingRelease
 });
 if(evidence.state==='EXISTS'){
  const latestRelease=githubApi('repos/'+REPO+'/releases/latest');
  const expectedBody=renderMidCatalogBody({tag,notes,sha,runId});
  if(refSha('main')!==sha||refSha('mid-stable')!==sha||
    !verifyMidExistingCatalogLatest({existingRelease,tagRef,latestRelease,
      tag,sha,body:expectedBody}))
   throw Error('Existing MID catalog is not latest for verified Stable SHA');
  console.log('MID catalog already exists as verified latest release '+tag);
  return;
 }
 if(!evidence.createAllowed)throw Error('Catalog blocked: '+evidence.reason);
 if(refSha('main')!==sha||refSha('mid-stable')!==sha)
  throw Error('Branch SHA drift immediately before catalog create');
 // The check alone is not atomic: reserve exactly this lightweight tag
 // with a single GitHub create-ref operation, which rejects duplicate refs.
 // On an ambiguous failure NEVER retry or overwrite the tag automatically.
 if(githubApi('repos/'+REPO+'/git/ref/tags/'+tag,'GET',undefined,true)!=null||
    githubApi('repos/'+REPO+'/releases/tags/'+tag,'GET',undefined,true)!=null)
  throw Error('Late tag or release race: refuse metadata publication');
 const createdTag=githubApi('repos/'+REPO+'/git/refs','POST',{
  ref:'refs/tags/'+tag,sha
 });
 const reservedTag=githubApi('repos/'+REPO+'/git/ref/tags/'+tag);
 if(!verifyMidTagReservation({createdTag,readback:reservedTag,tag,sha}))
  throw Error('Atomic tag reservation/readback mismatch; manual review required');
 if(refSha('main')!==sha||refSha('mid-stable')!==sha)
  throw Error('Branch drift after tag reservation; orphaned tag requires operator review');
 const body=renderMidCatalogBody({tag,notes,sha,runId});
 const created=githubApi('repos/'+REPO+'/releases','POST',{
  tag_name:tag,target_commitish:sha,name:'MID '+tag,
  body,draft:false,prerelease:false,make_latest:'true'
 });
 const postTag=githubApi('repos/'+REPO+'/git/ref/tags/'+tag);
 const postRelease=githubApi('repos/'+REPO+'/releases/tags/'+tag);
 const latestRelease=githubApi('repos/'+REPO+'/releases/latest');
 if(!verifyMidCatalogReadback({created,postTag,postRelease,latestRelease,tag,sha,body})||
    refSha('main')!==sha||refSha('mid-stable')!==sha)
  throw Error('New release tag/SHA/content/latest/branch readback mismatch');
 console.log('MID_GITHUB_CATALOG_ENTRY='+JSON.stringify({
  version,tag,sha,runId,releaseId:created.id,catalogOnly:true,recoveryAuthorized:false
 }));
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{publishMidCatalogFromInstaller()}catch(error){
  console.error('MID Release catalog fails closed: '+error.message);
  process.exitCode=1;
 }
}
