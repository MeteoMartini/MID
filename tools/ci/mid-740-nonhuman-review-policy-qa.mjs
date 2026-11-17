#!/usr/bin/env node
/** MID #740: QA-only future no-human-review branch policy and check provenance.
 * Never changes rulesets, accepts an AI claim as a GitHub approval, or grants
 * merge/installer/release permission. Caller-supplied REST objects are UNTRUSTED.
 */
export const MID_740_PLANNED_CHECKS=Object.freeze([
 'MID / source-gate-provenance',
 'MID / independent-automated-review',
 'MID / critical-P0-P1-P2-dispositions',
 'MID / core-heavy-release-admission'
]);
const REPO='MeteoMartini/MID',REPO_ID=1305110795;
const GITHUB_ACTIONS_APP_ID=15368; // Observed genuine GitHub Checks App on #839
const SHA=/^[a-f0-9]{40}$/;
const RUN_URL=/^https:\/\/github\.com\/MeteoMartini\/MID\/actions\/runs\/([1-9]\d*)\/job\/([1-9]\d*)$/;
const expectedPath='.github/workflows/mid-740-automated-review-gate.yml';
const reject=(reason)=>Object.freeze({
 schema:'mid.740.nonhuman-review-policy-qa.v1',status:'BLOCKED',reason,
 metadataCoherent:false,automatedReviewAttested:false,
 nativePolicyActiveAndQualified:false,installerAuthorized:false,
 mergeAuthorized:false,releaseAuthorized:false
});
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const integer=n=>Number.isSafeInteger(n)&&n>0;
function activeStableGuard(rulesets){
 return Array.isArray(rulesets)&&
  rulesets.some(r=>r?.name==='MID Stable Protection'&&
    r.enforcement==='active'&&
    r.conditions?.ref_name?.include?.includes('refs/heads/mid-stable'));
}
function validTarget(r){
 const ref=r?.conditions?.ref_name;
 return r?.enforcement==='active'&&r.target==='branch'&&
   Array.isArray(ref?.include)&&ref.include.length===1&&
   ref.include[0]==='refs/heads/main'&&
   Array.isArray(ref.exclude)&&ref.exclude.length===0&&
   Array.isArray(r.bypass_actors)&&r.bypass_actors.length===0;
}
function validRequiredRules(r){
 if(!Array.isArray(r?.rules))return false;
 if(r.rules.some(x=>x.type==='update'))return false;
 const pr=r.rules.filter(x=>x.type==='pull_request');
 const checks=r.rules.filter(x=>x.type==='required_status_checks');
 if(pr.length!==1||checks.length!==1)return false;
 const p=pr[0].parameters,c=checks[0].parameters;
 if(p?.required_approving_review_count!==0||
    p.require_code_owner_review!==false||
    p.require_last_push_approval!==false||
    p.required_review_thread_resolution!==true||
    c?.strict_required_status_checks_policy!==true||
    !Array.isArray(c.required_status_checks)||
    c.required_status_checks.length!==MID_740_PLANNED_CHECKS.length)
  return false;
 const contexts=new Set();
 for(const check of c.required_status_checks){
  if(!MID_740_PLANNED_CHECKS.includes(check?.context)||
     check.integration_id!==GITHUB_ACTIONS_APP_ID||
     contexts.has(check.context))return false;
  contexts.add(check.context);
 }
 return contexts.size===MID_740_PLANNED_CHECKS.length;
}
function checkEvidenceForContext(context,head,base,all){
 const set=all.filter(x=>x?.name===context);
 if(set.length!==1)return false;
 const item=set[0],c=item.check,r=item.run,j=item.job;
 if(!integer(c?.id)||c.name!==context||c.head_sha!==head||
    c.status!=='completed'||c.conclusion!=='success'||
    c.app?.id!==GITHUB_ACTIONS_APP_ID||c.app.slug!=='github-actions'||
    !integer(r?.id)||r.workflow_id!==item.trustedWorkflowId||
    !integer(r.workflow_id)||r.path!==expectedPath||
    r.event!=='pull_request'||r.run_attempt!==1||
    r.repository?.id!==REPO_ID||r.head_repository?.id!==REPO_ID||
    r.head_sha!==head||r.status!=='completed'||r.conclusion!=='success'||
    !integer(j?.id)||j.id!==item.jobId||j.run_id!==r.id||
    j.run_attempt!==1||j.head_sha!==head||
    j.name!==context||j.status!=='completed'||j.conclusion!=='success'||
    !Array.isArray(j.steps)||j.steps.length<2||
    j.steps.some(step=>step.status!=='completed'||step.conclusion!=='success'))
  return false;
 const url=RUN_URL.exec(c.details_url??'');
 if(!url||Number(url[1])!==r.id||Number(url[2])!==j.id)return false;
 const moments=[r.run_started_at,j.started_at,j.completed_at,r.updated_at]
  .map(s=>Date.parse(s??''));
 if(moments.some(x=>!Number.isFinite(x))||
    moments.some((x,i)=>i>0&&x<moments[i-1]))return false;
 // Positive checks must originate from the separately trusted workflow
 // anchored to stable source; untrusted PR workflow code must not issue them.
 if(!SHA.test(item.workflowDefinitionSha??'')||
    item.workflowDefinitionSha!==item.expectedTrustedDefinitionSha||
    item.trustedBaseSha!==base||
    !SHA.test(item.trustedBaseSha??''))return false;
 return true;
}
/**
 * This verifies the SHAPE of the future GitHub-native zero-approval
 * automated policy, with two independent caller-provided REST snapshots.
 * It is not a remote authentication or independent model execution.
 *
 * The mandatory checks above are PLANNED and not present in stable.
 */
export function assessMid740NonHumanReviewPolicy({
 repository,mainSha,stableSha,sourceHeadSha,policy,allRulesets,
 checkEvidence,finalPolicy,finalEvidence,legacyPushes,
 automatedReviewOriginalEvidence
}={}){
 if(repository!==REPO||!SHA.test(mainSha??'')||
    !SHA.test(stableSha??'')||mainSha!==stableSha||
    !SHA.test(sourceHeadSha??'')||sourceHeadSha===mainSha)
  return reject('INVALID_REPOSITORY_OR_SOURCE_BASE');
 if(!activeStableGuard(allRulesets))
  return reject('STABLE_PROTECTION_MISSING');
 if(!validTarget(policy)||!same(policy,finalPolicy))
  return reject('MAIN_ONLY_ACTIVE_NO_BYPASS_RULE_UNVERIFIED');
 if(!validRequiredRules(policy))
  return reject('PR_ZERO_APPROVAL_OR_TRUSTED_CHECK_RULE_UNVERIFIED');
 if(!Array.isArray(checkEvidence)||!Array.isArray(finalEvidence)||
    checkEvidence.length!==MID_740_PLANNED_CHECKS.length||
    !same(checkEvidence,finalEvidence)||
    !MID_740_PLANNED_CHECKS.every(n=>
      checkEvidenceForContext(n,sourceHeadSha,mainSha,checkEvidence)))
  return reject('ORIGINAL_CHECK_RUN_JOB_APP_PROVENANCE_UNVERIFIED');
 // Zero approvals never means zero review: independent tools must be
 // SHA-bound, preserve every P0/P1/P2 finding, prove non-skipped results and
 // carry evidence independent of the PR source and chatbot assertions.
 // Still not an attestation: user-provided proof must be independently fetched.
 if(automatedReviewOriginalEvidence?.sourceHeadSha!==sourceHeadSha||
    automatedReviewOriginalEvidence?.allP0P1P2Dispositioned!==true||
    automatedReviewOriginalEvidence?.originalRunAndArtifactVerified!==true||
    automatedReviewOriginalEvidence?.noUnreviewedSourceChanges!==true)
  return reject('AUTOMATED_FINDINGS_OR_ORIGINAL_ARTIFACT_UNVERIFIED');
 if(!legacyPushes||legacyPushes.source!==0||legacyPushes.installer!==0)
  return reject('LEGACY_DIRECT_MAIN_PUSHES_REMAIN');
 return Object.freeze({
  schema:'mid.740.nonhuman-review-policy-qa.v1',
  status:'FUTURE_RULESET_AND_CHECK_METADATA_COHERENT_QA_ONLY',
  sourceHeadSha,mainSha,plannedCheckCount:MID_740_PLANNED_CHECKS.length,
  requiredApprovals:0,requiredAppId:GITHUB_ACTIONS_APP_ID,
  metadataCoherent:true,automatedReviewAttested:false,
  nativePolicyActiveAndQualified:false,installerAuthorized:false,
  mergeAuthorized:false,releaseAuthorized:false
 });
}
