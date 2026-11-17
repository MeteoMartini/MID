import {describe,it,expect} from 'vitest';
import {
 assessMid740NonHumanReviewPolicy as assess,MID_740_PLANNED_CHECKS as REQUIRED
} from '../../tools/ci/mid-740-nonhuman-review-policy-qa.mjs';

const BASE='a'.repeat(40),HEAD='b'.repeat(40),WF='c'.repeat(40);
const APP=15368,REPO_ID=1305110795;
function fixture():any{
 const policy={name:'MID Main Automated Review Gate',target:'branch',
  enforcement:'active',bypass_actors:[],
  conditions:{ref_name:{include:['refs/heads/main'],exclude:[]}},
  rules:[
   {type:'pull_request',parameters:{
    required_approving_review_count:0,
    require_code_owner_review:false,
    require_last_push_approval:false,
    required_review_thread_resolution:true
   }},
   {type:'required_status_checks',parameters:{
    strict_required_status_checks_policy:true,
    required_status_checks:REQUIRED.map(context=>({context,integration_id:APP}))
   }}
  ]};
 const checkEvidence=REQUIRED.map((name,i)=>{
  const runId=1000+i,jobId=2000+i;
  return {
   name,trustedWorkflowId:3000,trustedBaseSha:BASE,
   workflowDefinitionSha:WF,expectedTrustedDefinitionSha:WF,jobId,
   check:{id:4000+i,name,head_sha:HEAD,status:'completed',
    conclusion:'success',app:{id:APP,slug:'github-actions'},
    details_url:'https://github.com/MeteoMartini/MID/actions/runs/'+runId+'/job/'+jobId},
   run:{id:runId,workflow_id:3000,run_attempt:1,
    path:'.github/workflows/mid-740-automated-review-gate.yml',
    event:'pull_request',head_sha:HEAD,status:'completed',conclusion:'success',
    repository:{id:REPO_ID},head_repository:{id:REPO_ID},
    run_started_at:'2026-11-17T08:00:00Z',updated_at:'2026-11-17T08:04:00Z'},
   job:{id:jobId,run_id:runId,run_attempt:1,head_sha:HEAD,name,
    status:'completed',conclusion:'success',
    started_at:'2026-11-17T08:01:00Z',completed_at:'2026-11-17T08:03:00Z',
    steps:[{name:'source-verify',status:'completed',conclusion:'success'},
      {name:'evidence-verify',status:'completed',conclusion:'success'}]}
  };
 });
 const data={
  repository:'MeteoMartini/MID',mainSha:BASE,stableSha:BASE,
  sourceHeadSha:HEAD,policy,
  allRulesets:[{name:'MID Stable Protection',enforcement:'active',
   conditions:{ref_name:{include:['refs/heads/mid-stable']}}}],
  checkEvidence,finalPolicy:structuredClone(policy),
  finalEvidence:structuredClone(checkEvidence),
  automatedReviewOriginalEvidence:{sourceHeadSha:HEAD,
   allP0P1P2Dispositioned:true,originalRunAndArtifactVerified:true,
   noUnreviewedSourceChanges:true},
  legacyPushes:{source:0,installer:0}
 };
 return data;
}
type Fixture=any;
function blocked(m:(x:Fixture)=>void){
 const x=fixture();m(x);
 const result=assess(x);
 expect(result.status).toBe('BLOCKED');
 expect(result.metadataCoherent).toBe(false);
 expect(result.mergeAuthorized).toBe(false);
 expect(result.installerAuthorized).toBe(false);
 expect(result.releaseAuthorized).toBe(false);
}
describe('MID #740 no-human GitHub-native check policy: read-only future QA',()=>{
 it('future synthetic metadata never grants actual review or merge authorization',()=>{
  const x=assess(fixture());
  expect(x).toMatchObject({status:'FUTURE_RULESET_AND_CHECK_METADATA_COHERENT_QA_ONLY',
   requiredApprovals:0,requiredAppId:APP,
   metadataCoherent:true,automatedReviewAttested:false,
   nativePolicyActiveAndQualified:false,
   installerAuthorized:false,mergeAuthorized:false,releaseAuthorized:false});
 });
 it.each([
  ['repository identity',x=>{x.repository='other/repo'}],
  ['split stable',x=>{x.stableSha='0'.repeat(40)}],
  ['unprotected stable',x=>{x.allRulesets=[]}],
  ['main+stable scope',x=>{x.policy.conditions.ref_name.include.push('refs/heads/mid-stable')}],
  ['evaluating-only ruleset',x=>{x.policy.enforcement='evaluate'}],
  ['ruleset bypass integration',x=>{x.policy.bypass_actors.push({actor_id:5059236,actor_type:'Integration',bypass_mode:'always'})}],
  ['nonzero human approvals',x=>{x.policy.rules[0].parameters.required_approving_review_count=1}],
  ['code owner approval',x=>{x.policy.rules[0].parameters.require_code_owner_review=true}],
  ['last push approval',x=>{x.policy.rules[0].parameters.require_last_push_approval=true}],
  ['unresolved threads tolerated',x=>{x.policy.rules[0].parameters.required_review_thread_resolution=false}],
  ['missing PR rule',x=>{x.policy.rules.shift()}],
  ['loose checks not strict base',x=>{x.policy.rules[1].parameters.strict_required_status_checks_policy=false}],
  ['missing critical automated gate',x=>{x.policy.rules[1].parameters.required_status_checks.pop()}],
  ['check source any app',x=>{x.policy.rules[1].parameters.required_status_checks[1].integration_id=null}],
  ['duplicate checks',x=>{x.policy.rules[1].parameters.required_status_checks[1].context=REQUIRED[0]}],
  ['app ID spoofed',x=>{x.checkEvidence[0].check.app.id=1}],
  ['neutral is not passing',x=>{x.checkEvidence[0].check.conclusion='neutral'}],
  ['skipped is not passing',x=>{x.checkEvidence[0].check.conclusion='skipped'}],
  ['job was skipped',x=>{x.checkEvidence[0].job.conclusion='skipped'}],
  ['job has no executed steps',x=>{x.checkEvidence[0].job.steps=[]}],
  ['job contains skipped required step',x=>{x.checkEvidence[0].job.steps[0].conclusion='skipped'}],
  ['wrong job context',x=>{x.checkEvidence[0].job.name='another'}],
  ['duplicate check result',x=>{x.checkEvidence.push(structuredClone(x.checkEvidence[0]))}],
  ['check wrong head',x=>{x.checkEvidence[0].check.head_sha=BASE}],
  ['check wrong workflow',x=>{x.checkEvidence[0].run.workflow_id=1}],
  ['source job wrong SHA',x=>{x.checkEvidence[0].job.head_sha=BASE}],
  ['untrusted workflow path',x=>{x.checkEvidence[0].run.path='.github/workflows/pr-untrusted.yml'}],
  ['wrong GitHub check URL',x=>{x.checkEvidence[0].check.details_url='https://evil.example/job'}],
  ['workflow definition altered',x=>{x.checkEvidence[0].workflowDefinitionSha='f'.repeat(40)}],
  ['untrusted base',x=>{x.checkEvidence[0].trustedBaseSha=HEAD}],
  ['wrong repo id',x=>{x.checkEvidence[0].run.repository.id=1}],
  ['check already rerun',x=>{x.checkEvidence[0].run.run_attempt=2}],
  ['job ends after workflow',x=>{x.checkEvidence[0].job.completed_at='2026-11-17T09:00:00Z'}],
  ['unverified P2',x=>{x.automatedReviewOriginalEvidence.allP0P1P2Dispositioned=false}],
  ['unverified original producer byte',x=>{x.automatedReviewOriginalEvidence.originalRunAndArtifactVerified=false}],
  ['unreviewed last push',x=>{x.automatedReviewOriginalEvidence.noUnreviewedSourceChanges=false}],
  ['original source main push remains',x=>{x.legacyPushes.source=1}],
  ['installer direct main push remains',x=>{x.legacyPushes.installer=1}],
  ['late policy race',x=>{x.finalPolicy.rules[0].parameters.required_review_thread_resolution=false}],
  ['late check race',x=>{x.finalEvidence[0].check.conclusion='skipped'}],
 ] as [string,(x:Fixture)=>void][])('%s blocks',(_,mutate)=>blocked(mutate));
 it('today actual ruleset has main+stable and bypass; it is NOT future no-human review proof',()=>{
  const x=fixture();
  x.policy={name:'MID Production Branch Guard',target:'branch',
   enforcement:'active',
   bypass_actors:[{actor_id:5059236,actor_type:'Integration',bypass_mode:'always'}],
   conditions:{ref_name:{include:['refs/heads/main','refs/heads/mid-stable'],exclude:[]}},
   rules:[{type:'deletion'},{type:'non_fast_forward'},{type:'update'}]
  };
  x.finalPolicy=structuredClone(x.policy);
  blocked(y=>Object.assign(y,x));
 });
});
