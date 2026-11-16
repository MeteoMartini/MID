#!/usr/bin/env node
/** Authentic PR #729 inline P1 REST+GraphQL shape probe. READ ONLY; NO MERGE. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {MID_REVIEW_QUERY,criticalMidReviewItems} from './mid-review-premerge-guard.mjs';
const REPO='MeteoMartini/MID',ID=1305110795,N=729;
const HEAD='29d12f103b5529a04dea519477f9a371ac310c65';
const CID='PRRC_kwDOTcppC88AAAABDYUk5A';
const deny=reason=>({status:'BLOCKED',reason,realEvidenceRead:false,
 nativeReviewEnforced:false,mergeAuthorized:false,releaseAuthorized:false});
export function checkOriginalCubicEvidence(rest,graphql){
 const p=graphql?.data?.repository?.pullRequest;
 if(graphql?.errors?.length||p?.number!==N||p.state!=='MERGED'||p.isDraft!==false||
    p.headRefOid!==HEAD||rest?.number!==N||rest.state!=='closed'||rest.merged!==true||
    rest.head?.sha!==HEAD||rest.head?.repo?.id!==ID||
    !Number.isFinite(Date.parse(rest.merged_at??'')))return deny('SOURCE_PR_DRIFT');
 const th=p.reviewThreads,re=p.reviews;
 if(!Array.isArray(th?.nodes)||th.nodes.length!==21||
    th.pageInfo?.hasNextPage!==false||
    !Array.isArray(re?.nodes)||re.nodes.length<1||
    re.pageInfo?.hasNextPage!==false)return deny('REVIEW_PAGINATION_INCOMPLETE');
 const seenT=new Set(),seenC=new Set();let inlineP1=0;
 for(const t of th.nodes){
  if(!t?.id||seenT.has(t.id)||t.isResolved!==false||
     typeof t.isOutdated!=='boolean'||t.comments?.pageInfo?.hasNextPage!==false||
     !Array.isArray(t.comments?.nodes)||!t.comments.nodes.length)
   return deny('THREAD_OR_INLINE_PAGE_INCOMPLETE');
  seenT.add(t.id);
  for(const c of t.comments.nodes){
   if(!c?.id||seenC.has(c.id)||typeof c.body!=='string'||
      typeof c.author?.login!=='string'||!c.author.login||
      !Number.isFinite(Date.parse(c.createdAt??''))||
      !Number.isFinite(Date.parse(c.updatedAt??''))||
      Date.parse(c.updatedAt)<Date.parse(c.createdAt))return deny('INLINE_COMMENT_INVALID');
   seenC.add(c.id);
   const items=criticalMidReviewItems(c.body);
   if(items===null)return deny('INLINE_CRITICAL_EVIDENCE_INVALID');
   if(c.id===CID){
    if(c.author.login!=='cubic-dev-ai'||c.author.__typename!=='Bot'||
       items.filter(x=>x==='P1').length!==1)return deny('CUBIC_P1_COMMENT_DRIFT');
    inlineP1++;
   }
  }
 }
 if(inlineP1!==1||seenC.size<21)return deny('CUBIC_INLINE_P1_MISSING');
 const seenR=new Set();let criticalSummaries=0;
 for(const r of re.nodes){
  if(!r?.id||seenR.has(r.id)||typeof r.body!=='string'||
     !Number.isFinite(Date.parse(r.submittedAt??''))||
     typeof r.author?.login!=='string')return deny('REVIEW_BODY_INVALID');
  seenR.add(r.id);
  const critical=criticalMidReviewItems(r.body);
  if(critical===null)return deny('REVIEW_CRITICAL_INVALID');
  if(r.author.login==='cubic-dev-ai'&&critical.includes('P1'))criticalSummaries++;
 }
 if(!criticalSummaries)return deny('CUBIC_REVIEW_P1_MISSING');
 return {status:'HISTORICAL_CUBIC_GRAPHQL_QA_ONLY',pr:N,head:HEAD,
  threads:seenT.size,unresolvedThreads:seenT.size,inlineComments:seenC.size,
  originalInlineP1:CID,criticalSummaries,
  realEvidenceRead:true,nativeReviewEnforced:false,
  mergeAuthorized:false,releaseAuthorized:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'||
     process.env.GITHUB_REPOSITORY!==REPO||
     !/^[0-9a-f]{40}$/.test(process.env.EXPECTED_PR_HEAD??''))
   throw Error('BAD_RUN_CONTEXT');
  const gh=args=>JSON.parse(execFileSync('gh',['api',...args],{
   encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024,
   stdio:['ignore','pipe','ignore']}));
  const rest=gh(['--method','GET','repos/'+REPO+'/pulls/'+N]);
  const gql=gh(['graphql','-f','query='+MID_REVIEW_QUERY,
   '-f','owner=MeteoMartini','-f','name=MID','-F','number='+N]);
  const out=checkOriginalCubicEvidence(rest,gql);
  process.stdout.write(JSON.stringify(out)+'\n');
  if(out.status!=='HISTORICAL_CUBIC_GRAPHQL_QA_ONLY')process.exitCode=1;
 }catch{process.stdout.write(JSON.stringify(deny('LIVE_GITHUB_READ_UNAVAILABLE'))+'\n');process.exitCode=1}
}