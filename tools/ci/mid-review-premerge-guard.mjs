#!/usr/bin/env node
/** MID premerge evidence readback only; native GitHub rules close TOCTOU. */
import {auditFailedRelease} from './audit-failed-release.mjs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const REPO='MeteoMartini/MID',SHA=/^[a-f0-9]{40}$/;
const BRANCH=/^(chatgpt|codex)\/[^/]+(?:\/[^/]+)*$/;
const QUERY='query($owner:String!,$name:String!,$number:Int!,$threadAfter:String,$reviewAfter:String){repository(owner:$owner,name:$name){pullRequest(number:$number){number headRefOid headRefName baseRefName isDraft state reviewThreads(first:100,after:$threadAfter){nodes{id isResolved isOutdated comments(first:100){nodes{id body createdAt updatedAt author{login __typename}}pageInfo{hasNextPage}}}pageInfo{hasNextPage endCursor}} reviews(first:100,after:$reviewAfter){nodes{id state body author{login __typename} submittedAt}pageInfo{hasNextPage endCursor}}}}}';
const block=reason=>({ok:false,reason:'MID_REVIEW_'+reason,mergeAuthorized:false,releaseAuthorized:false});

// Body-only severity findings are review evidence, even when there are no
// GitHub inline threads.  Number critical items by their order in the review
// so a later independent GitHub approval must address *each* one.
export function criticalMidReviewItems(body){
 if(typeof body!=='string')return null;
 // A Cubic XML violation and an independent plain/Markdown finding can
 // coexist in one body. Scan ALL severity markers in source order; taking
 // only the XML matches would silently discard later critical findings.
 // Conservative over-detection blocks a merge for independent disposition.
 const matches=[...body.matchAll(/\b(P[01])(?:\*\*|\])?\s*(?::|[—–-](?=\s))/gi)];
 if(matches.length>1000)return null; // refuse unbounded/incomplete evidence
 return matches.map(match=>match[1].toUpperCase());
}
function validMidEvidence(uri,headSha,number){
 try{
  const url=new URL(uri);
  if(url.origin!=='https://github.com'||url.username||url.password||
     url.search||!url.pathname.startsWith('/MeteoMartini/MID/'))return false;
  const path=url.pathname.slice('/MeteoMartini/MID/'.length);
  if(path.startsWith('blob/'+headSha+'/')&&path.length>46&&!url.hash)return true;
  if(/^actions\/runs\/[1-9][0-9]*(?:\/job\/[1-9][0-9]*)?$/.test(path)&&!url.hash)return true;
  if(path==='pull/'+number&&/^#(?:discussion_r[0-9]+|issuecomment-[0-9]+)$/.test(url.hash))return true;
  return false;
 }catch{return false}
}
const DISPOSITION=/^MID-740-DISPOSITION v1 sha=([a-f0-9]{40}) review=([a-zA-Z0-9_-]{8,128}) item=([1-9][0-9]{0,3}) result=(fixed|false-positive) evidence=(https:\/\/\S+)$/;


export function assessMidPremerge({before,after,main,stable,data,number,sha,branch,sourceBaseSha,recovery}={}){
 if(!Number.isSafeInteger(number)||number<1||!SHA.test(sha??'')||!BRANCH.test(branch??''))return block('BAD_INPUT');
 if(!SHA.test(sourceBaseSha??''))return block('SOURCE_BASE_UNVERIFIED');
 if(!SHA.test(main?.commit?.sha??'')||!SHA.test(stable?.commit?.sha??'')||main.commit.sha!==sourceBaseSha)return block('SOURCE_DRIFT');
 if(main.commit.sha!==stable.commit.sha&&(recovery?.main!==main.commit.sha||
  recovery?.stable!==stable.commit.sha||recovery?.eligibleForReview!==true))return block('SOURCE_DRIFT');
 const match=p=>p?.number===number&&p.state==='open'&&p.draft===false&&
  p.base?.ref==='main'&&p.base?.sha===main.commit.sha&&p.head?.ref===branch&&
  p.head?.sha===sha&&p.head?.repo?.full_name===REPO;
 if(!match(before)||!match(after))return block('PR_DRIFT');
 if(data?.truncated!==false||!Array.isArray(data.threads)||!Array.isArray(data.reviews))return block('EVIDENCE_INCOMPLETE');
 const p=data.meta;
 if(p?.number!==number||p.headRefOid!==sha||p.headRefName!==branch||
    p.baseRefName!=='main'||p.state!=='OPEN'||p.isDraft!==false)return block('GRAPHQL_PR_DRIFT');
 const threadIds=new Set(),inlineCommentIds=new Set(),inlineCritical=[];
 for(const t of data.threads){
  if(typeof t?.id!=='string'||!t.id||threadIds.has(t.id)||
    typeof t.isResolved!=='boolean'||typeof t.isOutdated!=='boolean')return block('BAD_THREAD');
  threadIds.add(t.id);
  if(t.comments?.pageInfo?.hasNextPage!==false||
     !Array.isArray(t.comments?.nodes)||t.comments.nodes.length===0||
     t.comments.nodes.length>100)return block('INCOMPLETE_THREAD_COMMENTS');
  for(const c of t.comments.nodes){
   if(typeof c?.id!=='string'||!/^[A-Za-z0-9_-]{8,128}$/.test(c.id)||
      inlineCommentIds.has(c.id)||typeof c.body!=='string'||
      typeof c.author?.login!=='string'||!c.author.login||
      typeof c.author.__typename!=='string'||
      !Number.isFinite(Date.parse(c.createdAt??''))||
      !Number.isFinite(Date.parse(c.updatedAt??''))||
      Date.parse(c.updatedAt)<Date.parse(c.createdAt))
    return block('BAD_INLINE_COMMENT');
   inlineCommentIds.add(c.id);
   const items=criticalMidReviewItems(c.body);
   if(items===null)return block('CRITICAL_INLINE_EVIDENCE_INVALID');
   if(items.length)inlineCritical.push({review:{
    id:c.id,body:c.body,author:c.author,
    // A critical edit after review approval invalidates the older disposition.
    submittedAt:new Date(Math.max(Date.parse(c.createdAt),Date.parse(c.updatedAt))).toISOString()
   },items});
  }
  if(!t.isResolved)return block('OPEN_THREAD');
 }
 const reviewIds=new Set(),requests=new Set();
 for(const r of data.reviews){
  if(typeof r?.id!=='string'||!r.id||reviewIds.has(r.id)||
     typeof r.author?.login!=='string'||!r.author.login||typeof r.body!=='string'||
     !['APPROVED','CHANGES_REQUESTED','COMMENTED','DISMISSED','PENDING'].includes(r.state)||
     (r.state!=='PENDING'&&!Number.isFinite(Date.parse(r.submittedAt??''))))return block('BAD_REVIEW');
  reviewIds.add(r.id);
 }
 // A PENDING draft review has no submittedAt. Including it in Date.parse
 // creates a NaN sort comparator and can reorder submitted change requests.
 const submitted=data.reviews.filter(r=>r.state!=='PENDING').sort((a,b)=>
  Date.parse(a.submittedAt)-Date.parse(b.submittedAt));
 // GitHub timestamps may collide at second precision. If a reviewer's
 // CHANGES_REQUESTED and clearing review share a timestamp, collection order
 // is not authoritative and must never erase an active critical request.
 const tied=new Map();
 for(const r of submitted){
  const key=r.author.login.toLowerCase()+'|'+r.submittedAt;
  if(!tied.has(key))tied.set(key,new Set());
  tied.get(key).add(r.state);
 }
 for(const states of tied.values())
  if(states.has('CHANGES_REQUESTED')&&
    (states.has('APPROVED')||states.has('DISMISSED')))
   return block('AMBIGUOUS_REVIEW_ORDER');
 for(const r of submitted){
  const author=r.author.login.toLowerCase();
  if(r.state==='CHANGES_REQUESTED')requests.add(author);
  else if(r.state==='APPROVED')requests.delete(author);
  // A separate DISMISSED approval is not evidence that this author's
  // outstanding CHANGES_REQUESTED was dismissed. Fail closed without identity.
 }
 if(requests.size)return block('CHANGES_REQUESTED');
 // Original #740 failure: Cubic COMMENTED review bodies can contain P0/P1
 // without CHANGES_REQUESTED; thread resolution by itself is not disposition.
 // An attesting review MUST come from a different authenticated human, be
 // later than the finding, bind the exact source SHA, and enumerate every
 // critical item with a GitHub evidence reference. No self-approval.
 const classified=submitted.map(r=>({review:r,items:
  ['COMMENTED','APPROVED'].includes(r.state)?criticalMidReviewItems(r.body):[]}));
 // Never silently drop invalid/oversized review evidence during filtering.
 if(classified.some(x=>x.items===null))return block('CRITICAL_REVIEW_EVIDENCE_INVALID');
 const criticalReviews=classified.filter(x=>x.items.length);
 const critical=[...criticalReviews,...inlineCritical];
 if(critical.length){
  const author=before?.user?.login?.toLowerCase();
  if(!author||after?.user?.login?.toLowerCase()!==author)return block('AUTHOR_UNVERIFIED');
  const attestations=new Map();
  for(const approved of submitted.filter(r=>r.state==='APPROVED')){
   if(approved.author?.__typename!=='User'||approved.author.login.toLowerCase()===author)continue;
   for(const line of approved.body.split(/\r?\n/)){
    const entry=DISPOSITION.exec(line.trim());
    if(!entry||entry[1]!==sha||!validMidEvidence(entry[5],sha,number))continue;
    const key=entry[2]+'|'+entry[3];
    if(!attestations.has(key))attestations.set(key,[]);
    attestations.get(key).push({date:Date.parse(approved.submittedAt),
     author:approved.author.login.toLowerCase(),result:entry[4]});
   }
  }
  for(const {review,items} of critical){
   for(let index=1;index<=items.length;index++){
    const matching=(attestations.get(review.id+'|'+index)||[]).filter(item=>
      item.author!==review.author.login.toLowerCase()&&
      item.date>Date.parse(review.submittedAt));
    if(matching.length!==1)return block('CRITICAL_REVIEW_UNATTESTED');
   }
  }
 }
 return {ok:true,reason:'READBACK_CLEAN',threadCount:data.threads.length,reviewCount:data.reviews.length,
  independentlyReviewed:false,reviewDispositionAttested:critical.length>0,
  criticalReviewCount:criticalReviews.length,criticalInlineCommentCount:inlineCritical.length,
  criticalItemCount:critical.reduce((n,x)=>n+x.items.length,0),
  mergeAuthorized:false,releaseAuthorized:false,nativeEnforcementRequired:true};
}

export async function collectMidReviews(query,number,sha){
 if(typeof query!=='function'||!Number.isSafeInteger(number)||number<1||!SHA.test(sha??''))throw Error('BAD_QUERY_INPUT');
 const threads=[],reviews=[],threadIds=new Set(),reviewIds=new Set();
 let threadAfter=null,reviewAfter=null,threadsDone=false,reviewsDone=false,meta=null;
 const cursors=new Set();
 for(let page=0;page<50;page++){
  const response=await query({threadAfter,reviewAfter}),p=response?.data?.repository?.pullRequest;
  if(response?.errors?.length||!p?.reviewThreads||!p?.reviews||
    p.number!==number||p.headRefOid!==sha||p.baseRefName!=='main'||
    p.isDraft!==false||p.state!=='OPEN'||typeof p.headRefName!=='string'||
    (meta&&meta.headRefName!==p.headRefName))throw Error('REVIEW_SNAPSHOT_INVALID');
  meta={number:p.number,headRefOid:p.headRefOid,headRefName:p.headRefName,baseRefName:p.baseRefName,isDraft:p.isDraft,state:p.state};
  for(const [connection,target,seen,done] of [[p.reviewThreads,threads,threadIds,threadsDone],[p.reviews,reviews,reviewIds,reviewsDone]]){
   if(!Array.isArray(connection?.nodes)||typeof connection.pageInfo?.hasNextPage!=='boolean')throw Error('INCOMPLETE_REVIEW_PAGE');
   if(!done)for(const node of connection.nodes){
    if(typeof node?.id!=='string'||!node.id||seen.has(node.id)||
       (target===reviews&&typeof node.body!=='string')||
       (target===threads&&(
        node.comments?.pageInfo?.hasNextPage!==false||
        !Array.isArray(node.comments?.nodes)||node.comments.nodes.length===0)))
     throw Error('DUPLICATE_OR_INCOMPLETE_REVIEW_ITEM');
    seen.add(node.id);target.push(node);
   }
  }
  const t=p.reviewThreads.pageInfo,r=p.reviews.pageInfo;
  if(!threadsDone&&t.hasNextPage){
   if(typeof t.endCursor!=='string'||!t.endCursor||t.endCursor===threadAfter)throw Error('BAD_THREAD_CURSOR');
   threadAfter=t.endCursor;
  }else threadsDone=true;
  if(!reviewsDone&&r.hasNextPage){
   if(typeof r.endCursor!=='string'||!r.endCursor||r.endCursor===reviewAfter)throw Error('BAD_REVIEW_CURSOR');
   reviewAfter=r.endCursor;
  }else reviewsDone=true;
  if(threadsDone&&reviewsDone){
   if(threads.length>5000||reviews.length>5000)throw Error('REVIEW_LIMIT');
   return {meta,threads,reviews,truncated:false};
  }
  const key=String(threadAfter)+'/'+String(reviewAfter);
  if(cursors.has(key))throw Error('PAGINATION_CYCLE');
  cursors.add(key);
 }
 throw Error('REVIEW_PAGE_LIMIT');
}
function gh(args){
 const result=execFileSync('gh',['api',...args],{encoding:'utf8',timeout:20000,maxBuffer:5000000,stdio:['ignore','pipe','pipe']});
 try{return JSON.parse(result)}catch{throw Error('GITHUB_BAD_JSON')}
}
export async function runMidReviewGuard(env=process.env){
 const number=Number(env.PR_NUMBER),sha=env.EXPECTED_HEAD_SHA,branch=env.EXPECTED_BRANCH,
  sourceBaseSha=env.EXPECTED_SOURCE_BASE_SHA;
 if(env.GITHUB_REPOSITORY!==REPO||typeof env.GH_TOKEN!=='string'||env.GH_TOKEN.length<12||
    !Number.isSafeInteger(number)||number<1||!SHA.test(sha??'')||!BRANCH.test(branch??'')||!SHA.test(sourceBaseSha??''))
  throw Error('HOST_IDENTITY_INVALID');
 const get=path=>gh(['--method','GET',path]);
 const before=get('repos/'+REPO+'/pulls/'+number);
 const main=get('repos/'+REPO+'/branches/main'),stable=get('repos/'+REPO+'/branches/mid-stable');
 const data=await collectMidReviews(async({threadAfter,reviewAfter})=>{
  const args=['graphql','-f','query='+QUERY,'-f','owner=MeteoMartini','-f','name=MID','-F','number='+number];
  if(threadAfter!==null)args.push('-f','threadAfter='+threadAfter);
  if(reviewAfter!==null)args.push('-f','reviewAfter='+reviewAfter);
  return gh(args);
 },number,sha);
 let recovery;
 if(main.commit.sha!==stable.commit.sha&&main.commit.sha===sourceBaseSha){
  const read=path=>get('repos/'+REPO+'/'+path);
  const inventory=read('actions/workflows/install-mid.yml/runs?per_page=100&head_sha='+sourceBaseSha);
  const failures=inventory.workflow_runs?.filter(run=>run.event==='workflow_dispatch'&&run.conclusion==='failure');
  if(failures?.length===1){
   const evidence=await auditFailedRelease({expectedMain:sourceBaseSha,expectedStable:stable.commit.sha,
    installerId:String(failures[0].id)},read);
   recovery={...evidence,main:sourceBaseSha,stable:stable.commit.sha};
  }
 }
 const after=get('repos/'+REPO+'/pulls/'+number);
 const finalMain=get('repos/'+REPO+'/branches/main'),finalStable=get('repos/'+REPO+'/branches/mid-stable');
 if(finalMain.commit.sha!==main.commit.sha||finalStable.commit.sha!==stable.commit.sha)return block('SOURCE_DRIFT');
 return assessMidPremerge({before,after,main,stable,data,number,sha,branch,sourceBaseSha,recovery});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const d=await runMidReviewGuard();
  if(!d.ok){process.stderr.write('MID review BLOCKED: '+d.reason+'\n');process.exitCode=1;}
  else process.stdout.write('MID review readback verified ('+d.threadCount+' threads, '+d.reviewCount+' reviews). Native merge-time rule still mandatory.\n');
 }catch{
  process.stderr.write('MID review BLOCKED: UNAVAILABLE_OR_INCONSISTENT_GITHUB_EVIDENCE\n');
  process.exitCode=1;
 }
}
