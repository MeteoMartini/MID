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
 'GitHub-Pages-Artefakt parallel vorbereiten',
 'Erfolgreichen Pages-/Worker-Release finalisieren'
];
const core=['core-1/4','core-2/4','core-3/4','core-4/4'];
const heavy=['heavy-mountain-visual ·','heavy-native-map ·','heavy-browser-state ·',
 'heavy-unified-map · 1/3','heavy-unified-map · 2/3','heavy-unified-map · 3/3'];
const block=reason=>Object.freeze({state:'BLOCKED',reason,createAllowed:false,recoveryAuthorized:false});
const succeeded=job=>job?.status==='completed'&&job.conclusion==='success';

export function assessMidCatalogEvidence(data={}){
 const {repo,releaseSha,localSha,mainSha,stableSha,versions,notes,
  run,runId,attempt,jobs,stableCommit,packageCommit,packageCompare,
  tagRef,existingRelease}=data;
 if(repo!==REPO||![releaseSha,localSha,mainSha,stableSha].every(x=>SHA.test(x||'')))
  return block('INVALID_SHA_OR_REPOSITORY');
 if(new Set([releaseSha,localSha,mainSha,stableSha]).size!==1)return block('BRANCH_OR_CHECKOUT_DRIFT');
 const version=versions?.package;
 if(!VERSION.test(version||'')||Object.keys(versions||{}).length!==6||
   Object.values(versions).some(x=>x!==version))return block('VERSION_MIRROR_MISMATCH');
 if(notes?.schema!==1||notes.version!==version||typeof notes.title!=='string'||
  !notes.title.trim()||notes.title.length>160||
  !/^20\d\d-\d\d-\d\d$/.test(notes.date||'')||
  !Array.isArray(notes.external)||notes.external.length<1||notes.external.length>30||
  notes.external.some(x=>typeof x!=='string'||!x.trim()||x.length>1000))
  return block('RELEASE_NOTES_INVALID');
 if(!Number.isSafeInteger(runId)||runId<=0||!Number.isSafeInteger(attempt)||attempt<=0||
   run?.id!==runId||run.run_attempt!==attempt||run?.repository?.full_name!==REPO||
   typeof run.path!=='string'||!run.path.includes('/.github/workflows/install-mid.yml')||
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
    packageCompare.files[0]?.status!=='added')
  return block('PACKAGE_NOT_ZIP_ONLY_OR_UNPROVEN');
 if(!Array.isArray(jobs)||jobs.length===0||jobs.length>=100)return block('INCOMPLETE_JOB_INVENTORY');
 const exactlyOneSuccess=name=>jobs.filter(j=>j?.name===name).length===1&&
  succeeded(jobs.find(j=>j?.name===name));
 for(const name of required)if(!exactlyOneSuccess(name))return block('REQUIRED_JOB_NOT_GREEN');
 for(const id of core)if(!exactlyOneSuccess('Release-Core-Regression · '+id))
  return block('CORE_SHARD_NOT_GREEN');
 for(const id of heavy)if(!exactlyOneSuccess('Release-Heavy · '+id))
  return block('HEAVY_SHARD_NOT_GREEN');
 if(!jobs.some(j=>j.name?.startsWith('MID auf GitHub Pages veröffentlichen · Versuch ')&&succeeded(j)))
  return block('PAGES_DEPLOYMENT_NOT_GREEN');
 const tag='v'+version;
 if(tagRef!=null&&(tagRef.ref!=='refs/tags/'+tag||
    tagRef.object?.type!=='commit'||tagRef.object.sha!==releaseSha))
  return block('EXISTING_TAG_CONFLICT');
 if(existingRelease!=null){
  if(!tagRef||existingRelease.tag_name!==tag||
     existingRelease.draft!==false||existingRelease.prerelease!==false||
     typeof existingRelease.body!=='string'||
     !existingRelease.body.includes(releaseSha)||!existingRelease.body.includes(tag))
   return block('EXISTING_RELEASE_CONFLICT');
  return Object.freeze({state:'EXISTS',tag,version,releaseSha,createAllowed:false,recoveryAuthorized:false});
 }
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
 if(!process.env.GH_TOKEN||process.env.GITHUB_REPOSITORY!==REPO||!SHA.test(sha)||
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
 const evidence=assessMidCatalogEvidence({
  repo:REPO,releaseSha:sha,localSha:git.stdout.trim(),
  mainSha:refSha('main'),stableSha:refSha('mid-stable'),
  versions,notes,run,runId,attempt,jobs:inventory.jobs,
  stableCommit,packageCommit,packageCompare,tagRef,existingRelease
 });
 if(evidence.state==='EXISTS'){
  console.log('MID catalog already exists with verified tag '+tag);
  return;
 }
 if(!evidence.createAllowed)throw Error('Catalog blocked: '+evidence.reason);
 if(refSha('main')!==sha||refSha('mid-stable')!==sha)
  throw Error('Branch SHA drift immediately before catalog create');
 const body=[
  '## MID '+tag+' · '+notes.title,'',
  '### Änderungen',...notes.external.map(x=>'- '+x),'',
  '### Nachgewiesene Veröffentlichung',
  '- Stable SHA: '+sha,
  '- Vollständiger Installer/Worker/Pages-Nachweis: https://github.com/'+REPO+'/actions/runs/'+runId,
  '- Changelog: https://github.com/'+REPO+'/blob/'+sha+'/CHANGELOG.md','',
  'Hinweis: GitHub Release-Katalogeintrag ohne attestierte ZIP/Recovery-Assets.',
  'Eine Immutable-Recovery-Freigabe ist damit NICHT verbunden (#839/#740).'
 ].join('\n');
 const created=githubApi('repos/'+REPO+'/releases','POST',{
  tag_name:tag,target_commitish:sha,name:'MID '+tag,
  body,draft:false,prerelease:false,make_latest:'true'
 });
 const postTag=githubApi('repos/'+REPO+'/git/ref/tags/'+tag);
 const postRelease=githubApi('repos/'+REPO+'/releases/tags/'+tag);
 if(postTag?.object?.type!=='commit'||postTag.object.sha!==sha||
    postRelease?.id!==created.id||postRelease.tag_name!==tag||
    postRelease.draft!==false||postRelease.prerelease!==false||
    !postRelease.body?.includes(sha))
  throw Error('New release tag/SHA/readback mismatch');
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
