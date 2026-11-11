#!/usr/bin/env node
/** MID premerge evidence readback only; native GitHub rules close TOCTOU. */
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const REPO='MeteoMartini/MID',SHA=/^[a-f0-9]{40}$/;
const BRANCH=/^(chatgpt|codex)\/[^/]+(?:\/[^/]+)*$/;
const QUERY='query($owner:String!,$name:String!,$number:Int!,$threadAfter:String,$reviewAfter:String){repository(owner:$owner,name:$name){pullRequest(number:$number){number headRefOid headRefName baseRefName isDraft state reviewThreads(first:100,after:$threadAfter){nodes{id isResolved isOutdated}pageInfo{hasNextPage endCursor}} reviews(first:100,after:$reviewAfter){nodes{id state author{login} submittedAt}pageInfo{hasNextPage endCursor}}}}}';
const block=reason=>({ok:false,reason:'MID_REVIEW_'+reason,mergeAuthorized:false,releaseAuthorized:false});

export function assessMidPremerge({before,after,main,stable,data,number,sha,branch,sourceBaseSha}={}){
 if(!Number.isSafeInteger(number)||number<1||!SHA.test(sha??'')||!BRANCH.test(branch??''))return block('BAD_INPUT');
 if(!SHA.test(sourceBaseSha??''))return block('SOURCE_BASE_UNVERIFIED');
 if(!SHA.test(main?.commit?.sha??'')||main.commit.sha!==stable?.commit?.sha||main.commit.sha!==sourceBaseSha)return block('SOURCE_DRIFT');
 const match=p=>p?.number===number&&p.state==='open'&&p.draft===false&&
  p.base?.ref==='main'&&p.base?.sha===main.commit.sha&&p.head?.ref===branch&&
  p.head?.sha===sha&&p.head?.repo?.full_name===REPO;
 if(!match(before)||!match(after))return block('PR_DRIFT');
 if(data?.truncated!==false||!Array.isArray(data.threads)||!Array.isArray(data.reviews))return block('EVIDENCE_INCOMPLETE');
 const p=data.meta;
 if(p?.number!==number||p.headRefOid!==sha||p.headRefName!==branch||
    p.baseRefName!=='main'||p.state!=='OPEN'||p.isDraft!==false)return block('GRAPHQL_PR_DRIFT');
 const threadIds=new Set();
 for(const t of data.threads){
  if(typeof t?.id!=='string'||!t.id||threadIds.has(t.id)||
    typeof t.isResolved!=='boolean'||typeof t.isOutdated!=='boolean')return block('BAD_THREAD');
  threadIds.add(t.id);
  if(!t.isResolved)return block('OPEN_THREAD');
 }
 const reviewIds=new Set(),requests=new Set();
 for(const r of data.reviews){
  if(typeof r?.id!=='string'||!r.id||reviewIds.has(r.id)||
     typeof r.author?.login!=='string'||!r.author.login||
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
 return {ok:true,reason:'READBACK_CLEAN',threadCount:data.threads.length,reviewCount:data.reviews.length,
  // GitHub conversation state is not independent reviewer attestation.
  independentlyReviewed:false,reviewDispositionAttested:false,
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
    if(typeof node?.id!=='string'||!node.id||seen.has(node.id))throw Error('DUPLICATE_REVIEW_ITEM');
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
 const after=get('repos/'+REPO+'/pulls/'+number);
 return assessMidPremerge({before,after,main,stable,data,number,sha,branch,sourceBaseSha});
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
