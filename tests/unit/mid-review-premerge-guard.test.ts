import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {assessMidPremerge as check,collectMidReviews,criticalMidReviewItems} from '../../tools/ci/mid-review-premerge-guard.mjs';
const sha='a'.repeat(40),stable='b'.repeat(40),branch='chatgpt/v0.9.85.455-review-native-guard';
const pr={number:777,state:'open',draft:false,base:{ref:'main',sha:stable},head:{ref:branch,sha,repo:{full_name:'MeteoMartini/MID'}},user:{login:'coder'}};
const meta={number:777,headRefOid:sha,headRefName:branch,baseRefName:'main',state:'OPEN',isDraft:false};
const input=(x:any={})=>({number:777,sha,branch,sourceBaseSha:stable,before:pr,after:pr,main:{commit:{sha:stable}},stable:{commit:{sha:stable}},data:{meta,threads:[],reviews:[],truncated:false},...x});
const thread=(isResolved:boolean,isOutdated=false,id='t1')=>({isResolved,isOutdated,id});
const review=(state:string,id='r1',author='auditor',submittedAt='2026-11-11T15:00:00Z',body='')=>
 ({state,id,body,author:{login:author,__typename:author==='cubic-dev-ai'?'Bot':'User'},submittedAt});
const page=(t:any[]=[],r:any[]=[],tNext=false,rNext=false)=>({data:{repository:{pullRequest:{...meta,
 reviewThreads:{nodes:t,pageInfo:{hasNextPage:tNext,endCursor:tNext?'nextT':null as string|null}},
 reviews:{nodes:r,pageInfo:{hasNextPage:rNext,endCursor:rNext?'nextR':null as string|null}}
}}}});
describe('SHA-bound MID merge-time review guard',()=>{
 it('source base must match both CURRENT protected refs, not just live main=Stable',()=>{
  for(const sourceBaseSha of [undefined,'', 'c'.repeat(40)]){
   const result=check(input({sourceBaseSha}));
   expect(result.ok).toBe(false);
   expect(result.reason).toMatch(/^MID_REVIEW_SOURCE_(BASE_UNVERIFIED|DRIFT)$/);
  }
  expect(check(input()).ok).toBe(true);
 });
 it('accepts only verified pre-deploy recovery for the tested main and Stable',()=>{
  const packet='c'.repeat(40);
  const recovery={main:packet,stable,eligibleForReview:true};
  const based={...pr,base:{ref:'main',sha:packet}};
  const state={main:{commit:{sha:packet}},sourceBaseSha:packet,before:based,after:based};
  expect(check(input(state)).ok).toBe(false);
  expect(check(input({...state,recovery})).ok).toBe(true);
  expect(check(input({...state,recovery:{...recovery,stable:sha}})).ok).toBe(false);
  expect(check(input({...state,recovery,data:{meta,threads:[thread(false)],reviews:[],truncated:false}})).ok).toBe(false);
 });
 it('does not claim a clean readback is merge or release authorization',()=>{
  expect(check(input())).toMatchObject({ok:true,mergeAuthorized:false,releaseAuthorized:false,nativeEnforcementRequired:true});
 });
 it.each([false,true])('blocks unresolved review thread, even outdated=%s',outdated=>{
  expect(check(input({data:{meta,threads:[thread(false,outdated)],reviews:[],truncated:false}})).ok).toBe(false);
 });
 it('accepts a resolved GitHub conversation but never claims independent approval',()=>{
  expect(check(input({data:{meta,threads:[thread(true)],reviews:[review('COMMENTED')],truncated:false}})))
   .toMatchObject({ok:true,independentlyReviewed:false,reviewDispositionAttested:false,
    mergeAuthorized:false,releaseAuthorized:false,nativeEnforcementRequired:true});
 });
 it('does not invent a required approval for a COMMENTED-only PR',()=>{
  expect(check(input({data:{meta,threads:[],reviews:[review('COMMENTED')],truncated:false}})))
   .toMatchObject({ok:true,independentlyReviewed:false,reviewDispositionAttested:false,
    mergeAuthorized:false,releaseAuthorized:false});
 });
 it('blocks P1/P0 Cubic body-only findings even with no unresolved inline threads',()=>{
  const body='<violation number="1">\nP1: native season interval=0 is rejected</violation>\n'+
   '<violation number="2">\nP2: noncritical display spacing</violation>\n'+
   '<violation number="3">\nP0: unsafe native publishing</violation>';
  const cubic=review('COMMENTED','PRR_critical001','cubic-dev-ai','2026-11-11T15:00:00Z',body);
  const checkReviews=(items:any[])=>check(input({data:{meta,threads:[],reviews:items,truncated:false}}));
  expect(checkReviews([cubic])).toMatchObject({ok:false,reason:'MID_REVIEW_CRITICAL_REVIEW_UNATTESTED'});
  const evidence='https://github.com/MeteoMartini/MID/blob/'+sha+'/src/nativeSeasonalComposite.ts';
  const line=(item:number,head=sha)=>'MID-740-DISPOSITION v1 sha='+head+
   ' review=PRR_critical001 item='+item+' result=fixed evidence='+evidence;
  const partial=review('APPROVED','r-approved','reviewer','2026-11-11T15:02:00Z',line(1));
  expect(checkReviews([cubic,partial]).ok).toBe(false);
  const complete=review('APPROVED','r-complete','reviewer','2026-11-11T15:02:00Z',line(1)+'\n'+line(2));
  expect(checkReviews([cubic,complete])).toMatchObject({ok:true,reviewDispositionAttested:true,
   criticalReviewCount:1,criticalItemCount:2,mergeAuthorized:false,releaseAuthorized:false});
  const duplicate=review('APPROVED','r-duplicate','reviewer','2026-11-11T15:03:00Z',line(1));
  expect(checkReviews([cubic,complete,duplicate]).ok).toBe(false);
  expect(checkReviews([cubic,review('APPROVED','r-own','coder','2026-11-11T15:03:00Z',line(1)+'\n'+line(2))]).ok).toBe(false);
  expect(checkReviews([cubic,review('APPROVED','r-early','reviewer','2026-11-11T14:00:00Z',line(1)+'\n'+line(2))]).ok).toBe(false);
  expect(checkReviews([cubic,review('APPROVED','r-stale','reviewer','2026-11-11T15:03:00Z',line(1,'c'.repeat(40))+'\n'+line(2))]).ok).toBe(false);
  const unsafe=line(1).replace('github.com/MeteoMartini/MID','evil.example/MeteoMartini/MID');
  expect(checkReviews([cubic,review('APPROVED','r-unsafe','reviewer','2026-11-11T15:03:00Z',unsafe+'\n'+line(2))]).ok).toBe(false);
  const late=review('COMMENTED','PRR_lateP1x','cubic-dev-ai','2026-11-11T15:04:00Z','P1: later untriaged review');
  expect(checkReviews([cubic,complete,late]).ok).toBe(false);
 });
 it('counts mixed Cubic XML, plain and Markdown severity markers without losing critical items',()=>{
  const body='<violation number="1">\nP1: native seasonal interval bug</violation>\n'+
   'P0: unsafe release race\n**P1**: provenance bypass\n[P0]: unsafe package';
  expect(criticalMidReviewItems(body)).toEqual(['P1','P0','P1','P0']);
  const finding=review('COMMENTED','PRR_mixedcritical','cubic-dev-ai','2026-11-11T15:00:00Z',body);
  const evidence='https://github.com/MeteoMartini/MID/blob/'+sha+'/src/nativeSeasonalComposite.ts';
  const attest=(i:number)=>'MID-740-DISPOSITION v1 sha='+sha+
   ' review=PRR_mixedcritical item='+i+' result=fixed evidence='+evidence;
  const checkBody=(approved:string)=>check(input({data:{meta,threads:[],reviews:[finding,
   review('APPROVED','r-mixedapproval','independent','2026-11-11T15:01:00Z',approved)],truncated:false}}));
  expect(checkBody([1,2,3].map(attest).join('\n'))).toMatchObject({
   ok:false,reason:'MID_REVIEW_CRITICAL_REVIEW_UNATTESTED'});
  expect(checkBody([1,2,3,4].map(attest).join('\n'))).toMatchObject({
   ok:true,criticalItemCount:4,mergeAuthorized:false,releaseAuthorized:false});
 });
 it('fails closed on oversized or unclassified severity evidence',()=>{
  const oversized=('P1: critical item\n').repeat(1001);
  expect(criticalMidReviewItems(oversized)).toBeNull();
  const reviewBody=review('COMMENTED','PRR_largecritical','cubic-dev-ai','2026-11-11T15:00:00Z',oversized);
  expect(check(input({data:{meta,threads:[],reviews:[reviewBody],truncated:false}})))
   .toMatchObject({ok:false,reason:'MID_REVIEW_CRITICAL_REVIEW_EVIDENCE_INVALID'});
 });
 it('does not treat a P1 warning inside an approving review as a clean merge',()=>{
  const reviewBody=review('APPROVED','r-approvalwarning','independent','2026-11-11T15:01:00Z','P1: issue remains open');
  expect(check(input({data:{meta,threads:[],reviews:[reviewBody],truncated:false}})))
   .toMatchObject({ok:false,reason:'MID_REVIEW_CRITICAL_REVIEW_UNATTESTED'});
 });
 it('requires GraphQL review bodies for complete critical evidence',async()=>{
  const missing=page([], [{id:'no-body',state:'COMMENTED',author:{login:'cubic-dev-ai'},
   submittedAt:'2026-11-11T15:00:00Z'}]);
  await expect(collectMidReviews(async()=>missing,777,sha)).rejects.toThrow();
 });
 it('requires real disposition of CHANGES_REQUESTED, not a later comment',()=>{
  const decide=(reviews:any[])=>check(input({data:{meta,threads:[],reviews,truncated:false}})).ok;
  expect(decide([review('CHANGES_REQUESTED'),review('COMMENTED','r2')])).toBe(false);
  expect(decide([review('CHANGES_REQUESTED'),review('APPROVED','r2','auditor','2026-11-11T15:01:00Z')])).toBe(true);
  expect(decide([review('CHANGES_REQUESTED'),review('APPROVED','r2','different','2026-11-11T15:01:00Z')])).toBe(false);
  // A later dismissed *different* review must not clear an outstanding request.
  expect(decide([review('CHANGES_REQUESTED'),review('DISMISSED','r2','auditor','2026-11-11T15:01:00Z')])).toBe(false);
  expect(decide([review('CHANGES_REQUESTED'),review('DISMISSED','r2','different','2026-11-11T15:01:00Z')])).toBe(false);
 });
 it('fails closed when conflicting same-author reviews have the same submission timestamp',()=>{
  const same='2026-11-11T15:00:00Z';
  for(const latest of ['APPROVED','DISMISSED']){
   const original=review('CHANGES_REQUESTED','changes','auditor',same);
   const clearing=review(latest,'clear','auditor',same);
   for(const order of [[original,clearing],[clearing,original]])
    expect(check(input({data:{meta,threads:[],reviews:order,truncated:false}}))).toMatchObject({
     ok:false,reason:'MID_REVIEW_AMBIGUOUS_REVIEW_ORDER'
    });
  }
 });
 it('does not let an interleaved PENDING draft reorder submitted change requests',()=>{
  const reviews=[
   review('APPROVED','approved','auditor','2026-11-11T14:00:00Z'),
   review('PENDING','pending','auditor',null as any),
   review('CHANGES_REQUESTED','changes','auditor','2026-11-11T15:00:00Z')
  ];
  expect(check(input({data:{meta,threads:[],reviews,truncated:false}}))).toMatchObject({
   ok:false,reason:'MID_REVIEW_CHANGES_REQUESTED'
  });
 });
 it('blocks source PR/head/main/Stable drift, missing evidence, duplicates',()=>{
  for(const bad of [
   {after:{...pr,head:{...pr.head,sha:'c'.repeat(40)}}},
   {after:{...pr,state:'closed'}},
   {before:{...pr,head:{...pr.head,repo:{full_name:'other/repo'}}}},
   {main:{commit:{sha:'c'.repeat(40)}}},{stable:{commit:{sha:'c'.repeat(40)}}},
   {data:null},{data:{meta,threads:[],reviews:[],truncated:true}},
   {data:{meta,threads:[thread(true),thread(true)],reviews:[],truncated:false}}
  ])expect(check(input(bad)).ok).toBe(false);
 });
 it('includes later pages with newly reported unresolved review',async()=>{
  let n=0;
  const pages=[page([thread(true,false,'t1')],[review('COMMENTED')],true,true),
   page([thread(false,false,'t2')],[review('CHANGES_REQUESTED','r2')])];
  const cursors:any[]=[];
  const data=await collectMidReviews(async cursorsForPage=>{
   cursors.push(cursorsForPage);
   return pages[n++];
  },777,sha);
  expect(cursors).toEqual([
   {threadAfter:null,reviewAfter:null},
   {threadAfter:'nextT',reviewAfter:'nextR'}
  ]);
  expect(data.threads).toHaveLength(2);
  expect(data.reviews).toHaveLength(2);
  expect(check(input({data})).ok).toBe(false);
 });
 it('fails closed on HTTP-like GraphQL errors, invalid pagination and changed head',async()=>{
  const gqlFail=page();(gqlFail as any).errors=[{message:'403'}];
  await expect(collectMidReviews(async()=>gqlFail,777,sha)).rejects.toThrow();
  const bad=page([],[],true,false);bad.data.repository.pullRequest.reviewThreads.pageInfo.endCursor=null;
  await expect(collectMidReviews(async()=>bad,777,sha)).rejects.toThrow();
  const changed=page();changed.data.repository.pullRequest.headRefOid='c'.repeat(40);
  await expect(collectMidReviews(async()=>changed,777,sha)).rejects.toThrow();
 });
 it('keeps workflow twins, trusted Stable guard and existing merge ZIP installer path',()=>{
  const a=readFileSync('.github/workflows/agent-source-release.yml','utf8');
  const b=readFileSync('ci/github/workflows/agent-source-release.yml','utf8');
  expect(a).toBe(b);
  expect(a.indexOf('node tools/ci/mid-review-premerge-guard.mjs')).toBeGreaterThan(0);
  expect(a.indexOf('node tools/ci/mid-review-premerge-guard.mjs')).toBeLessThan(a.indexOf('gh api --method PUT '));
  expect(a).toContain('ref: ${{ github.workflow_sha }}');
  expect(a).toContain('EXPECTED_WORKFLOW_SHA');
  expect(a).toContain('git rev-parse HEAD');
  expect(a).not.toContain('ref: mid-stable');
  expect(a).toContain('git push origin HEAD:main');
  expect(a).toContain('gh workflow run install-mid.yml --repo "$GITHUB_REPOSITORY" --ref main');
  expect(a).toContain('package_parent="$(git rev-parse HEAD^)"');
  expect(a).toContain('changed_paths="$(git diff-tree --no-commit-id --name-only -r HEAD)"');
  expect(a).toContain('[ "$changed_paths" != "MID-professional-replacement.zip" ]');
  expect(a.indexOf('git diff-tree --no-commit-id --name-only -r HEAD'))
   .toBeLessThan(a.indexOf('git push origin HEAD:main'));
  expect(a.indexOf('git rev-parse HEAD^')).toBeLessThan(a.indexOf('git push origin HEAD:main'));
 });
});
