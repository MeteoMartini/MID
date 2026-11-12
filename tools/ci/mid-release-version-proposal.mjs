#!/usr/bin/env node
// Read-only MID four-component release version proposal. Not a release/merge gate.
import {readFile} from 'node:fs/promises';

const SHA=/^[0-9a-f]{40}$/;
const PART=/^(0|[1-9][0-9]*)$/;
const ALLOWED=new Set(['maintenance','feature','generation','breaking','unknown']);
const VALID_PATH=/^(?!\/)(?!.*(?:^|\/)\.{1,2}(?:\/|$))(?!.*\\)[^\x00-\x1f]+$/;

export function parseMidVersion(version) {
  if(typeof version!=='string') throw Error('MID version must be a four-component string');
  const fields=version.split('.');
  if(fields.length!==4 || fields.some(x=>!PART.test(x))) throw Error('Invalid four-component MID version');
  const numbers=fields.map(Number);
  if(numbers.some(x=>!Number.isSafeInteger(x))) throw Error('MID version component exceeds safe integer range');
  return numbers;
}

export function makeProposedVersion(baseVersion,impact) {
  const [x,y,z,w]=parseMidVersion(baseVersion);
  if(impact==='maintenance' && Number.isSafeInteger(w+1)) return `${x}.${y}.${z}.${w+1}`;
  if(impact==='feature' && Number.isSafeInteger(z+1)) return `${x}.${y}.${z+1}.0`;
  throw Error('No automatic version for unknown, generation, breaking or overflow impact');
}

export function analyzeReleaseVersion(manifest,live) {
  if(!manifest || typeof manifest!=='object' || Array.isArray(manifest) || manifest.schema!==1)
    throw Error('Invalid release version manifest');
  const baseVersion=manifest.baseVersion;
  const [baseMajor]=parseMidVersion(baseVersion);
  if(!SHA.test(manifest.stableSha??'') || !SHA.test(manifest.mainSha??'') || manifest.mainSha!==manifest.stableSha)
    throw Error('Expected identical full main/stable SHAs');
  if(!Array.isArray(manifest.candidates) || manifest.candidates.length<1 || manifest.candidates.length>5)
    throw Error('Expected 1-5 release candidates');
  const blockers=[],observations=[];
  if(!live || live.mainSha!==manifest.mainSha || live.stableSha!==manifest.stableSha || live.version!==baseVersion)
    blockers.push('Current main/stable SHA or release version drift; stop and inspect published Stable');
  if(baseMajor!==0) observations.push('Major is not zero; no automatic major changes are supported');
  const prs=new Set(),heads=new Set();
  let rank=0;
  for(const c of manifest.candidates){
    if(!c || !Number.isSafeInteger(c.pr) || c.pr<1 || !SHA.test(c.headSha??'') ||
       typeof c.impact!=='string' || !ALLOWED.has(c.impact) ||
       typeof c.reason!=='string' || !c.reason.trim() || c.reason.length>2000 ||
       !Array.isArray(c.changedPaths) || !c.changedPaths.length ||
       c.changedPaths.some(p=>typeof p!=='string' || !VALID_PATH.test(p)) ||
       new Set(c.changedPaths).size!==c.changedPaths.length)
      throw Error('Incomplete or invalid SHA-bound candidate evidence');
    if(prs.has(c.pr)||heads.has(c.headSha)) throw Error('Duplicate candidate PR or HEAD');
    prs.add(c.pr);heads.add(c.headSha);
    if(c.impact==='unknown') blockers.push(`PR #${c.pr}: unknown impact must be independently reviewed`);
    if(c.impact==='generation') blockers.push(`PR #${c.pr}: Y-generation change requires separate product decision; never auto-bump`);
    if(c.impact==='breaking') blockers.push(`PR #${c.pr}: incompatible change requires separate product decision; X never auto-bumps`);
    if(c.impact==='feature')rank=Math.max(rank,2);
    else if(c.impact==='maintenance')rank=Math.max(rank,1);
    observations.push(`PR #${c.pr}: ${c.impact} declared; actual diff, impact and provenance remain independently verifiable`);
  }
  const bump=blockers.length?null:rank===2?'feature':'maintenance';
  const proposedVersion=bump?makeProposedVersion(baseVersion,bump):null;
  return {schema:1,baseVersion,stableSha:manifest.stableSha,mainSha:manifest.mainSha,
    proposedVersion,bump,versionProposalOnly:true,releaseAuthorized:false,
    readyForIntegrationReview:blockers.length===0,blockers,observations,
    notice:'Read-only recommendation from declared, SHA-bound evidence. It has NOT verified GitHub diffs, reviewers, CI, official weather data, approvals or release gates.'};
}

// Consume only a complete SHA-bound remote inventory from the existing release-train
// preflight; a candidate-authored paths list alone never counts as verified evidence.
// This checks *inventory* and arithmetic, NOT semantic impact, review or release authority.
export function analyzeVerifiedReleaseVersion(manifest,live,snapshot) {
 const declared=analyzeReleaseVersion(manifest,live);
 // File/HEAD provenance is independent of a product-impact classification.
 // A complete GitHub diff stays verified even when approval is not granted.
 const inventoryBlockers=[];
 if(!snapshot || snapshot.plan?.releaseAuthorized!==false ||
    snapshot.current?.mainSha!==manifest.mainSha ||
    snapshot.current?.stableSha!==manifest.stableSha)
   inventoryBlockers.push('Remote PR/Stable inventory missing or stale');
 const actual=snapshot?.verifiedCandidates;
 if(!Array.isArray(actual)||actual.length!==manifest.candidates.length)
   inventoryBlockers.push('Remote PR inventory missing or incomplete');
 else {
   const lookup=new Map();
   for(const p of actual){
    if(!p||!Number.isSafeInteger(p.pr)||!SHA.test(p.headSha??'')||
       !Array.isArray(p.files)||p.files.length===0||
       p.files.some(path=>typeof path!=='string'||!VALID_PATH.test(path))||
       new Set(p.files).size!==p.files.length||lookup.has(p.pr)){
      inventoryBlockers.push('Malformed or duplicated verified remote PR evidence');
      continue;
    }
    lookup.set(p.pr,p);
   }
   for(const candidate of manifest.candidates){
    const remote=lookup.get(candidate.pr);
    if(!remote||remote.headSha!==candidate.headSha)
      inventoryBlockers.push('PR #'+candidate.pr+' remote HEAD or identity mismatch');
    else if(remote.files.length!==candidate.changedPaths.length ||
        remote.files.some(p=>!candidate.changedPaths.includes(p)))
      inventoryBlockers.push('PR #'+candidate.pr+' declared paths differ from complete GitHub diff inventory');
   }
 }
 const verifiedDiffInventory=inventoryBlockers.length===0;
 const blockers=[...declared.blockers,...inventoryBlockers];
 // Remote preflight can fail due to overlap or other substantive blockers,
 // independently of whether the actual per-PR paths were SHA-verified.
 if(snapshot?.plan?.validForIntegrationReview!==true)
  blockers.push('Remote PR/Stable preflight not eligible for integration');
 const readyForIntegrationReview=blockers.length===0;
 return {...declared,
   proposedVersion:readyForIntegrationReview?declared.proposedVersion:null,
   readyForIntegrationReview,
   verifiedDiffInventory,
   blockers,
   observations:[...declared.observations,
     'GitHub file inventory and SHA identities checked independently by the existing read-only release-train preflight; declared impact still requires human domain review'],
   notice:'Read-only version proposal from exact GitHub PR inventory and pinned Stable version mirrors; no semantic-impact proof, reviewer attestation, merge approval, Source/Installer gate or release authorization.'};
}

export function verifyProposedTarget(result,targetVersion) {
  if(!result || result.readyForIntegrationReview!==true || !result.proposedVersion)
    throw Error('No eligible version proposal');
  const [baseX,baseY]=parseMidVersion(result.baseVersion);
  const [targetX,targetY]=parseMidVersion(targetVersion);
  if(targetX!==baseX) throw Error('X change forbidden without a separate externally enforced approval path');
  if(targetY!==baseY) throw Error('Y-generation change forbidden without a separate product decision');
  if(result.proposedVersion!==targetVersion) throw Error('Proposed target differs from deterministic version policy');
  return true; // only validates arithmetic, never authorizes release
}

async function main(){
  const [manifestPath,livePath]=process.argv.slice(2);
  if(!manifestPath||!livePath) throw Error('Usage: node tools/ci/mid-release-version-proposal.mjs manifest.json live.json');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const live=JSON.parse(await readFile(livePath,'utf8'));
  const result=analyzeReleaseVersion(manifest,live);
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  if(result.blockers.length) process.exitCode=1;
}
if(process.argv[1]?.endsWith('/mid-release-version-proposal.mjs'))
  main().catch(error=>{console.error('MID version proposal BLOCKED: '+error.message);process.exitCode=1;});
