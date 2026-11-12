// MID release concept: advisory review convergence; never merges or publishes.
// Source/Installer/native GitHub protections remain authoritative.
import {createHash} from 'node:crypto';

const SHA_RE=/^[a-f0-9]{40}$/;
const SEVERITIES=new Set(['P0','P1','P2','P3']);
const DISPOSITIONS=new Set(['open','fixed','false-positive','deferred']);
const PHASES=new Set(['draft','frozen','source-verified']);
export const MAX_AUTOMATIC_FIX_ROUNDS=2;
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const normal=x=>String(x??'').normalize('NFKC').trim().toLowerCase().replace(/\s+/g,' ');
const result=(action,reasons,extra={})=>Object.freeze({
  schema:'mid.review-convergence.v1',action,reasons:[...new Set(reasons)],
  maxAutomaticFixRounds:MAX_AUTOMATIC_FIX_ROUNDS,
  mergeAuthorized:false,releaseAuthorized:false,sourceGateAuthorized:false,
  autoMerge:false,autoCloseThreads:false,...extra
});
function findingIdentity(f){
  // A fingerprint is stable across repeated AI comments, but scoped to the
  // source SHA and code location. Never deduplicate different SHA revisions.
  if(!nonempty(f.path)||!nonempty(f.rule)||!nonempty(f.anchor))
    return null;
  const source=[f.headSha,normal(f.path),normal(f.rule),normal(f.anchor)].join('\n');
  return createHash('sha256').update(source).digest('hex');
}
export function assessMidReviewConvergence(input={}){
  const {mainSha,stableSha,baseSha,headSha,reviewedHeadSha,phase,
    automaticFixRounds,sourceGateHeadSha,findings,
    openReviewThreads,changesRequested}=input;
  const errors=[];
  if(!SHA_RE.test(mainSha??'')||mainSha!==stableSha||mainSha!==baseSha)
    errors.push('BASE_OR_STABLE_DRIFT');
  if(!SHA_RE.test(headSha??'')||headSha!==reviewedHeadSha)
    errors.push('REVIEW_HEAD_NOT_FROZEN');
  if(!PHASES.has(phase))errors.push('PHASE_INVALID');
  if(!Number.isInteger(automaticFixRounds)||automaticFixRounds<0||automaticFixRounds>MAX_AUTOMATIC_FIX_ROUNDS)
    errors.push('ROUND_INVALID');
  if(!Number.isInteger(openReviewThreads)||openReviewThreads<0||
     !Number.isInteger(changesRequested)||changesRequested<0)
    errors.push('NATIVE_REVIEW_STATE_INVALID');
  if(!Array.isArray(findings)||findings.length>500)errors.push('FINDINGS_INCOMPLETE');
  if(phase==='source-verified'&&sourceGateHeadSha!==headSha)
    errors.push('SOURCE_GATE_SHA_MISMATCH');
  if(errors.length)return result('BLOCK_INVALID_EVIDENCE',errors);

  const seen=new Map(),unique=[],duplicates=[],findingsErrors=[];
  for(const f of findings){
    if(!f||!nonempty(f.id)||!SEVERITIES.has(f.severity)||
      !DISPOSITIONS.has(f.disposition)||f.headSha!==headSha||
      typeof f.domainCritical!=='boolean'){
      findingsErrors.push('FINDING_INVALID_OR_STALE');
      continue;
    }
    const fp=findingIdentity(f);
    if(!fp){findingsErrors.push('FINGERPRINT_MISSING');continue;}
    const prior=seen.get(fp);
    if(prior){
      duplicates.push({originalId:prior.id,repeatedId:f.id,fingerprint:fp});
      // Reviewer comments can contradict themselves; do not silently discard
      // an apparent duplicate with stricter severity or changed disposition.
      if(prior.severity!==f.severity||prior.disposition!==f.disposition||
         prior.domainCritical!==f.domainCritical||
         (prior.ownerRiskAccepted===true)!==(f.ownerRiskAccepted===true)||
         prior.independentVerified!==f.independentVerified||
         prior.evidenceSha!==f.evidenceSha||prior.evidenceRef!==f.evidenceRef)
        findingsErrors.push('CONFLICTING_REPEAT');
      continue;
    }
    seen.set(fp,f);
    unique.push({...f,fingerprint:fp});
  }
  if(findingsErrors.length)return result('BLOCK_INVALID_EVIDENCE',findingsErrors,{
    rawFindings:findings.length,uniqueFindings:unique.length,duplicateFindings:duplicates
  });

  const critical=[],needsEvidence=[],needsTriage=[],backlog=[];
  for(const f of unique){
    const material=f.severity==='P0'||f.severity==='P1'||f.domainCritical;
    const independentlyQualified=f.independentVerified===true&&
      f.evidenceSha===headSha&&nonempty(f.evidenceRef)&&f.evidenceRef.trim().length>=12;
    if(f.disposition==='fixed'||f.disposition==='false-positive'){
      if(!independentlyQualified)needsEvidence.push(f.id);
      continue;
    }
    if(f.disposition==='deferred'){
      if(material)critical.push(f.id);
      else if(f.severity==='P2'&&(f.ownerRiskAccepted!==true||!independentlyQualified))
        needsTriage.push(f.id);
      else backlog.push(f.id);
      continue;
    }
    if(material)critical.push(f.id);
    else if(f.severity==='P2')needsTriage.push(f.id);
    else backlog.push(f.id);
  }
  const status={automaticFixRounds,remainingAutomaticFixRounds:
    MAX_AUTOMATIC_FIX_ROUNDS-automaticFixRounds,
    uniqueFindings:unique.length,duplicateFindings:duplicates,
    unresolvedCritical:critical,needsEvidence,needsTriage,backlog,
    openReviewThreads,changesRequested,
    note:'Review counts, GitHub states, independentVerified and evidenceRef are all caller-provided inputs. This planner does not authenticate evidence and never authorizes merges, releases, native-thread closure, or source gates.'};
  const blocked=[...critical,...needsEvidence,...needsTriage].length>0||
    openReviewThreads>0||changesRequested>0;
  if(blocked){
    const reasons=[];
    if(critical.length)reasons.push('CRITICAL_FINDING_REQUIRES_FIX_OR_SCOPE_REMOVAL');
    if(needsEvidence.length)reasons.push('INDEPENDENT_DISPOSITION_NOT_PROVEN');
    if(needsTriage.length)reasons.push('P2_REVIEW_REQUIRED');
    if(openReviewThreads>0)reasons.push('NATIVE_CONVERSATIONS_OPEN');
    if(changesRequested>0)reasons.push('CHANGE_REQUESTS_OPEN');
    if(phase!=='draft'||automaticFixRounds>=MAX_AUTOMATIC_FIX_ROUNDS)
      return result('HUMAN_SCOPE_DECISION',reasons,status);
    return result('ONE_SCOPED_DRAFT_FIX_ROUND_ALLOWED',reasons,status);
  }
  if(phase==='draft')return result('FREEZE_HEAD_AND_RUN_SOURCE',[],status);
  if(phase==='frozen')return result('RUN_COMPLETE_SOURCE_GATE',[],status);
  return result('AWAIT_NATIVE_MERGE_AND_INSTALLER_GATES',[],status);
}
