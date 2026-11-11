// MID release concept QA: read-only version freeze and advisory review dispositions.
// Never grant merge, source-gate, installer, reviewer or release authorization.
import {readFile} from 'node:fs/promises';
import {makeProposedVersion,parseMidVersion} from './mid-release-version-proposal.mjs';

const SHA=/^[0-9a-f]{40}$/;
const SEVERITIES=new Set(['P0','P1','P2','P3']);
const DISPOSITIONS=new Set(['unreviewed','fixed','false-positive','deferred']);
const finiteText=(value,min=8)=>typeof value==='string'&&value.trim().length>=min;
const deny=(blockers,observations=[])=>Object.freeze({
  evidenceConsistent:blockers.length===0,releaseAuthorized:false,
  mergeAuthorized:false,blockers,observations,
});

export function assessMidVersionFreeze({
  stableSha,mainSha,expectedStableSha,baseVersion,targetVersion,
  impact,candidateHeadSha,reviewedHeadSha
}={}){
  const blockers=[],observations=[];
  if(!SHA.test(stableSha??'')||stableSha!==mainSha||stableSha!==expectedStableSha)
    blockers.push('PUBLISHED_STABLE_SHA_DRIFT');
  if(!SHA.test(candidateHeadSha??'')||candidateHeadSha!==reviewedHeadSha)
    blockers.push('FINAL_INTEGRATION_HEAD_NOT_FROZEN');
  try{
    parseMidVersion(baseVersion);
    parseMidVersion(targetVersion);
    if(!['maintenance','feature'].includes(impact))
      blockers.push('IMPACT_NOT_INDEPENDENTLY_CLASSIFIED');
    else if(makeProposedVersion(baseVersion,impact)!==targetVersion)
      blockers.push('TARGET_VERSION_DOES_NOT_MATCH_SCOPE');
    else observations.push('Version arithmetic only: final semantic impact needs independent domain verification');
  }catch{
    blockers.push('VERSION_TRANSITION_INVALID');
  }
  observations.push('Checked data is advisory, not authenticated GitHub review/diff/source gate evidence');
  return deny(blockers,observations);
}

const ROOT_PATHS=[
 'package.json','package-lock.json','MID_BASELINE.json','contracts/index.json',
 'MID_IOS_STATUS.json','src/version.ts','public/version.json','index.html',
 'worker-src/00-core-observations.js','worker/metar-proxy.js','worker.js',
 'public/service-worker.js','public/sw.js','ios/App/App.xcodeproj/project.pbxproj',
 'RELEASE_NOTES.md','CHANGELOG.md','public/CHANGELOG.md',
 'MID_SOURCE_OF_TRUTH.md','MID_BUILD_CHANGELOG.md'
];
export const MID_RELEASE_MIRROR_PATHS=Object.freeze([...ROOT_PATHS]);
const pathReader=path=>readFile(new URL('../../'+path,import.meta.url),'utf8');

export async function inspectMidReleaseMirrors(expectedVersion,readText=pathReader){
  const blockers=[],observations=[],observed={};
  let segments;
  try{segments=parseMidVersion(expectedVersion)}
  catch{return {...deny(['EXPECTED_VERSION_INVALID']),expectedVersion,observed,pathsChecked:0}}
  if(typeof readText!=='function')
    return {...deny(['MIRROR_READER_INVALID']),expectedVersion,observed,pathsChecked:0};
  const raw={};
  for(const path of ROOT_PATHS){
    try{
      const content=await readText(path);
      if(typeof content!=='string'||!content.trim())throw Error('empty');
      raw[path]=content;
    }catch{blockers.push('MISSING_OR_UNREADABLE_MIRROR:'+path)}
  }
  const record=(label,actual)=>{
    observed[label]=actual??null;
    if(actual!==expectedVersion)blockers.push('MIRROR_MISMATCH:'+label);
  };
  const json=(path,selector)=>{
    try{return selector(JSON.parse(raw[path]))}
    catch{return null}
  };
  record('package.json',json('package.json',p=>p.version));
  record('package-lock.json',json('package-lock.json',p=>p.version));
  record('package-lock.json#root',json('package-lock.json',p=>p.packages?.['']?.version));
  record('MID_BASELINE.json#version',json('MID_BASELINE.json',p=>p.version));
  record('MID_BASELINE.json#releaseVersion',json('MID_BASELINE.json',p=>p.releaseVersion));
  record('contracts/index.json',json('contracts/index.json',p=>p.releaseVersion));
  record('MID_IOS_STATUS.json',json('MID_IOS_STATUS.json',p=>p.releaseVersion));
  record('public/version.json',json('public/version.json',p=>p.version));
  const match=(path,regex)=>raw[path]?.match(regex)?.[1]??null;
  record('src/version.ts',match('src/version.ts',/export const MID_VERSION='([^']+)';/));
  record('index.html',match('index.html',/<meta name="mid-version" content="([^"]+)">/));
  for(const p of ['worker-src/00-core-observations.js','worker/metar-proxy.js','worker.js'])
    record(p,match(p,/const WORKER_VERSION='([^']+)';/));
  for(const p of ['public/service-worker.js','public/sw.js'])
    record(p,match(p,/const CACHE='mid-shell-v([^']+)';/));
  for(const p of ['RELEASE_NOTES.md','CHANGELOG.md','public/CHANGELOG.md','MID_SOURCE_OF_TRUTH.md'])
    record(p,match(p,/^# MID v(\d+\.\d+\.\d+(?:\.\d+)?)(?![\d.])/));
  record('MID_BUILD_CHANGELOG.md',match('MID_BUILD_CHANGELOG.md',/^## MID v(\d+\.\d+\.\d+(?:\.\d+)?)(?![\d.])/));

  // On MID's iOS-only Xcode project, changing marketing version may restart
  // CFBundleVersion at one. This is not an automatic macOS-versioning policy.
  const marketing=segments.slice(0,3).join('.'),build=String(segments[3]+1);
  const pbx=raw['ios/App/App.xcodeproj/project.pbxproj']??'';
  for(const [field,expect] of [['MARKETING_VERSION',marketing],['CURRENT_PROJECT_VERSION',build]]){
    const matches=[...pbx.matchAll(new RegExp('\\b'+field+'\\s*=\\s*([^;]+);','g'))].map(x=>x[1].trim());
    observed['ios/'+field]=matches;
    if(!matches.length||matches.some(x=>x!==expect))
      blockers.push('IOS_BUILD_MIRROR_MISMATCH:'+field);
  }
  observations.push('Mirror check is local and read-only; GitHub HEAD, semantic impact, reviewer attestations, full tests and deployment remain independently required');
  return {...deny([...new Set(blockers)],observations),expectedVersion,observed,pathsChecked:ROOT_PATHS.length};
}

// Cubic is optional evidence. Its green check NEVER means its findings are clear;
// its absence/pending/timeout is not itself a reason to hold a qualified source.
// Verified security/meteorology defects always remain actionable regardless of AI status.
export function assessMidReviewDispositions({headSha,cubic,independentReview,findings}={}){
  const blockers=[],observations=[];
  if(!SHA.test(headSha??''))blockers.push('REVIEW_HEAD_INVALID');
  if(!independentReview||independentReview.headSha!==headSha||
     independentReview.status!=='qualified'||!finiteText(independentReview.evidenceRef,12))
    blockers.push('INDEPENDENT_REVIEW_EVIDENCE_MISSING');
  const state=cubic?.state??'unavailable';
  if(!['unavailable','pending','completed'].includes(state))
    blockers.push('CUBIC_STATE_UNKNOWN');
  if(state!=='completed')
    observations.push('Cubic not required: use qualified independent SHA-bound review and address previously known findings');
  if(state==='completed'&&cubic?.headSha!==headSha)
    observations.push('Cubic review is stale; it is not positive clearance for this HEAD');
  if(!Array.isArray(findings)){
    blockers.push('KNOWN_FINDINGS_NOT_INVENTORIED');
  }else{
    const ids=new Set();
    for(const finding of findings){
      if(!finding||!finiteText(finding.id,1)||ids.has(finding.id)||
         !SEVERITIES.has(finding.severity)||!DISPOSITIONS.has(finding.disposition)){
        blockers.push('INVALID_OR_DUPLICATE_FINDING');
        continue;
      }
      ids.add(finding.id);
      const critical=finding.severity==='P0'||finding.severity==='P1'||finding.domainCritical===true;
      const traceable=finding.reviewedHeadSha===headSha&&finiteText(finding.evidenceRef,12)&&
        finiteText(finding.rationale,16);
      switch(finding.disposition){
        case 'fixed':
        case 'false-positive':
          if(!traceable)blockers.push('FINDING_DISPOSITION_NOT_VERIFIED:'+finding.id);
          break;
        case 'deferred':
          if(critical||finding.severity==='P2'&&finding.ownerRiskAccepted!==true)
            blockers.push('CRITICAL_OR_UNAPPROVED_DEFERRED_FINDING:'+finding.id);
          else if(!traceable)blockers.push('DEFERRED_FINDING_WITHOUT_EVIDENCE:'+finding.id);
          break;
        default:
          if(critical||finding.severity==='P2')
            blockers.push('UNRESOLVED_ACTIONABLE_FINDING:'+finding.id);
          else observations.push('Noncritical P3 finding still requires tracking: '+finding.id);
      }
    }
  }
  observations.push('Disposition text is not independently authenticated: require normal reviewer, GitHub permissions, CI and merge protections');
  return {...deny(blockers,observations),cubicRequired:false,reviewAgentSuccessDoesNotClearFindings:true};
}
