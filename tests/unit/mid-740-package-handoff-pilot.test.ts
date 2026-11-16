import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessMid740PackageHandoff as check} from '../../tools/ci/mid-740-package-handoff-pilot.mjs';
const base='a'.repeat(40),merged='b'.repeat(40),digest='c'.repeat(64);
const example=()=>({
 mainSha:merged,mergedSourceSha:merged,sourcePrHeadSha:base,sourceGateSha:base,
 producerRun:{id:111,repository:{full_name:'MeteoMartini/MID'},
   path:'.github/workflows/agent-source-release.yml',
   event:'workflow_run',status:'completed',conclusion:'success',head_branch:'main'},
 artifact:{id:222,name:'mid-release-'+merged,expired:false,digest:'sha256:'+digest,
  workflow_run:{id:111}},
 download:{artifactId:222,runId:111,sha256:digest,isComplete:true},
 zipVerification:{verifiedSourceSha:merged,zipSha256:'d'.repeat(64),
  allGitTreeFilesByteAndModeExact:true,unexpectedFiles:false},
 reviewReadback:{authoritativeNativeRuleAtMerge:true,noReviewBypass:true,
  allCriticalFindingsDispositioned:true}
});
describe('MID #740: immutable Actions artifact handoff (QA-only design)',()=>{
 it('never grants merge/installer/release rights even for a complete synthetic handoff',()=>{
  expect(check(example())).toMatchObject({acceptableMetadata:true,releaseAuthorized:false,reasons:[]});
 });
 it.each([
 ['main race',x=>{x.mainSha=base}],
 ['source gate drift',x=>{x.sourceGateSha=merged}],
 ['untrusted repo',x=>{x.producerRun.repository.full_name='attacker/MID'}],
 ['fork run/event',x=>{x.producerRun.event='pull_request'}],
 ['wrong workflow path',x=>{x.producerRun.path='.github/workflows/other.yml'}],
 ['wrong head branch',x=>{x.producerRun.head_branch='feature'}],
 ['pending producer',x=>{x.producerRun.status='in_progress'}],
 ['failed producer',x=>{x.producerRun.conclusion='failure'}],
 ['expired artifact',x=>{x.artifact.expired=true}],
 ['foreign artifact run',x=>{x.artifact.workflow_run.id=123}],
 ['wrong artifact digest',x=>{x.artifact.digest='sha256:'+'f'.repeat(64)}],
 ['download envelope SHA mismatch',x=>{x.download.sha256='f'.repeat(64)}],
 ['bad downloaded ID',x=>{x.download.artifactId=223}],
 ['incomplete download',x=>{x.download.isComplete=false}],
 ['source-archive mismatch',x=>{x.zipVerification.verifiedSourceSha=base}],
 ['wrong archive mode',x=>{x.zipVerification.allGitTreeFilesByteAndModeExact=false}],
 ['additional archive payload',x=>{x.zipVerification.unexpectedFiles=true}],
 ['no native rule',x=>{x.reviewReadback.authoritativeNativeRuleAtMerge=false}],
 ['ruleset bypass',x=>{x.reviewReadback.noReviewBypass=false}],
 ['missing no-bypass evidence',x=>{delete x.reviewReadback.noReviewBypass}],
 ['unknown extra ZIP members',x=>{delete x.zipVerification.unexpectedFiles}],
 ['untriaged P1',x=>{x.reviewReadback.allCriticalFindingsDispositioned=false}],
 ] as [string,(x:any)=>void][])('%s fails closed',(_,alter)=>{
  const item=example();alter(item);
  expect(check(item).acceptableMetadata).toBe(false);
  expect(check(item).releaseAuthorized).toBe(false);
 });
 it('detects the present legitimate ZIP direct-push conflict; must migrate BEFORE native-rule activation',()=>{
  const active=readFileSync('.github/workflows/agent-source-release.yml','utf8');
  const canonical=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
  expect(active).toBe(canonical);
  expect(active).toContain('git push origin HEAD:main');
  expect(active).toContain('node tools/ci/mid-review-premerge-guard.mjs');
  // This is diagnostic; NEVER enable an uncompensated pull_request rule on
  // main while the existing release bot still needs direct ZIP pushes.
  expect(active.indexOf('node tools/ci/mid-review-premerge-guard.mjs'))
   .toBeLessThan(active.indexOf('git push origin HEAD:main'));
 });
});
