import {describe,it,expect} from 'vitest';
import {checkOriginalCubicEvidence as verify} from '../../tools/ci/mid-740-live-cubic-review-readback.mjs';
const sha='29d12f103b5529a04dea519477f9a371ac310c65',cid='PRRC_kwDOTcppC88AAAABDYUk5A';
function fixture(){
 const nodes=Array.from({length:21},(_,i)=>({
  id:'PRRT_'+i,isResolved:false,isOutdated:false,
  comments:{pageInfo:{hasNextPage:false},nodes:[{
   id:i?('PRRC_'+i):cid,body:i?'P2: minor note':'P1: companion intervalHours===0 rejected',
   createdAt:'2026-11-10T06:28:54Z',updatedAt:'2026-11-10T06:29:19Z',
   author:{login:'cubic-dev-ai',__typename:'Bot'}}]}
 }));
 return {
  rest:{number:729,state:'closed',merged:true,merged_at:'2026-11-10T06:47:41Z',
   head:{sha,repo:{id:1305110795}}},
  gql:{data:{repository:{pullRequest:{
   number:729,state:'MERGED',isDraft:false,headRefOid:sha,
   reviewThreads:{nodes,pageInfo:{hasNextPage:false}},
   reviews:{nodes:[{id:'PRR_cubic',body:'P1: companion intervalHours===0 rejected',
    submittedAt:'2026-11-10T06:29:19Z',author:{login:'cubic-dev-ai',__typename:'Bot'}}],
    pageInfo:{hasNextPage:false}}
  }}}}
 };
}
const run=(mutate:(x:ReturnType<typeof fixture>)=>void)=>{
 const x=fixture();mutate(x);return verify(x.rest,x.gql);
};
describe('MID #740 real historical original Cubic GraphQL readback',()=>{
 it('synthetic coherent snapshot is QA only, never merge authority',()=>{
  expect(run(()=>{})).toMatchObject({status:'HISTORICAL_CUBIC_GRAPHQL_QA_ONLY',
   threads:21,unresolvedThreads:21,inlineComments:21,originalInlineP1:cid,
   nativeReviewEnforced:false,mergeAuthorized:false,releaseAuthorized:false});
 });
 it.each([
  ['rest SHA',x=>{x.rest.head.sha='b'.repeat(40)}],
  ['GraphQL HEAD',x=>{x.gql.data.repository.pullRequest.headRefOid='c'.repeat(40)}],
  ['not merged',x=>{x.rest.merged=false}],
  ['missing thread',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes.pop()}],
  ['page truncated',x=>{x.gql.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage=true}],
  ['resolved thread',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[0].isResolved=true}],
  ['inline page truncated',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[0].comments.pageInfo.hasNextPage=true}],
  ['removed original P1',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[0].comments.nodes[0].body='P2 only'}],
  ['spoofed author',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[0].comments.nodes[0].author.login='x'}],
  ['duplicate ID',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[1].comments.nodes[0].id=cid}],
  ['missing summary',x=>{x.gql.data.repository.pullRequest.reviews.nodes[0].body='P2 only'}],
  ['review pagination truncated',x=>{x.gql.data.repository.pullRequest.reviews.pageInfo.hasNextPage=true}],
  ['edited before creation',x=>{x.gql.data.repository.pullRequest.reviewThreads.nodes[0].comments.nodes[0].updatedAt='2026-11-01T00:00:00Z'}],
 ] as [string,(x:ReturnType<typeof fixture>)=>void][])('%s fails closed',(_,mutate)=>{
  expect(run(mutate).status).toBe('BLOCKED');
 });
});