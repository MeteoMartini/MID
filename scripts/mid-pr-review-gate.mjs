// MID issue #740: fail-closed pre-merge PR review evidence readback.
// QA candidate only. NOT an approval system and NOT wired to release workflows.
// The calling release workflow must use an authenticated, trusted GitHub App token.
import {fileURLToPath} from 'node:url';

const TRUSTED_ASSOCIATIONS=new Set(['OWNER','MEMBER','COLLABORATOR']);
const ISSUE_SUMMARY=/\b(\d+)\s+issues?\s+found\b/i;
const MAX_PAGES=20;

function trustedHuman(comment){
 return comment?.author?.__typename==='User'&&
  TRUSTED_ASSOCIATIONS.has(comment.authorAssociation)&&
  typeof comment.bodyText==='string'&&comment.bodyText.trim().length>=12;
}
function failure(code){return code}
export function assessMidReviewEvidence({pr,reviews,threads,expectedHead}){
 const blockers=[];
 if(!pr||typeof pr!=='object')return {ok:false,blockers:['PR_NOT_READABLE']};
 if(!/^[0-9a-f]{40}$/i.test(String(expectedHead)))blockers.push(failure('EXPECTED_SHA_INVALID'));
 if(pr.headRefOid!==expectedHead)blockers.push(failure('HEAD_CHANGED'));
 if(pr.state!=='OPEN'||pr.isDraft||pr.baseRefName!=='main')blockers.push(failure('PR_NOT_READY'));
 if(!Array.isArray(reviews)||!Array.isArray(threads))return {ok:false,blockers:[...blockers,'REVIEW_DATA_MISSING']};
 const seen=new Set();
 for(const thread of threads){
  if(!thread?.id||seen.has(thread.id)){blockers.push(failure('THREAD_ID_DUPLICATED_OR_MISSING'));continue}
  seen.add(thread.id);
  // Outdated does not mean non-actionable: explicit resolution is necessary.
  if(thread.isResolved!==true){blockers.push(failure('UNRESOLVED_REVIEW_THREAD:'+thread.id));continue}
  const replies=thread.comments?.nodes;
  if(!Array.isArray(replies)||replies.length<2||!trustedHuman(replies.at(-1)))
   blockers.push(failure('RESOLUTION_EVIDENCE_MISSING:'+thread.id));
 }
 let reportedIssues=0,submittedReviews=0;
 for(const review of reviews){
  if(!review||!review.id){blockers.push(failure('REVIEW_ID_MISSING'));continue}
  if(review.state==='PENDING'||review.state==='DISMISSED')continue;
  submittedReviews++;
  if(!review.submittedAt||!review.commit?.oid)blockers.push(failure('REVIEW_PROVENANCE_MISSING:'+review.id));
  if(review.state==='CHANGES_REQUESTED')blockers.push(failure('CHANGES_REQUESTED:'+review.id));
  const body=String(review.bodyText||'').trim();
  if(review.state!=='APPROVED'&&body){
   const match=body.match(ISSUE_SUMMARY);
   if(match){const count=Number(match[1]);if(!Number.isSafeInteger(count)||count>2000)blockers.push(failure('ISSUE_COUNT_UNTRUSTED:'+review.id));else reportedIssues+=count}
   else if(!threads.length)blockers.push(failure('REVIEW_SUMMARY_WITHOUT_THREADS:'+review.id));
  }
 }
 if(reportedIssues>threads.length)blockers.push(failure('ISSUE_SUMMARY_THREADS_INCOMPLETE'));
 // An approval never replaces thread evidence or formal GitHub branch protection.
 return {ok:blockers.length===0,blockers,reviewCount:submittedReviews,threadCount:threads.length,reportedIssues};
}
async function graphql(token,query,variables){
 const response=await fetch('https://api.github.com/graphql',{
  method:'POST',headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'Content-Type':'application/json','User-Agent':'MID-reviewed-release-gate'},
  body:JSON.stringify({query,variables}),signal:AbortSignal.timeout(20000)
 });
 if(!response.ok)throw new Error('GitHub GraphQL HTTP '+response.status);
 const payload=await response.json();
 if(!payload||payload.errors?.length||!payload.data?.repository?.pullRequest)
  throw new Error('GitHub review readback incomplete or GraphQL rejected query');
 return payload.data.repository.pullRequest;
}
const QUERY=String.raw`query($owner:String!,$name:String!,$number:Int!,$rCursor:String,$tCursor:String){
 repository(owner:$owner,name:$name){pullRequest(number:$number){
  id state isDraft headRefOid baseRefName
  reviews(first:100,after:$rCursor){
   nodes{id state submittedAt bodyText commit{oid}}
   pageInfo{hasNextPage endCursor}
  }
  reviewThreads(first:100,after:$tCursor){
   nodes{id isResolved isOutdated comments(last:2){
    nodes{bodyText authorAssociation author{login __typename}}
   }}
   pageInfo{hasNextPage endCursor}
  }
 }}
}`;
export async function readMidReviewEvidence({repo,number,token}){
 if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)||!Number.isSafeInteger(number)||number<1||!token)
  throw new Error('Invalid review gate configuration');
 const [owner,name]=repo.split('/');
 const reviews=[],threads=[];
 let rCursor=null,tCursor=null,prMeta=null,reviewPagesComplete=false,threadPagesComplete=false;
 for(let page=0;page<MAX_PAGES;page++){
  const pr=await graphql(token,QUERY,{owner,name,number,rCursor,tCursor});
  if(!prMeta)prMeta={id:pr.id,state:pr.state,isDraft:pr.isDraft,headRefOid:pr.headRefOid,baseRefName:pr.baseRefName};
  if(prMeta.headRefOid!==pr.headRefOid||prMeta.state!==pr.state||prMeta.isDraft!==pr.isDraft)
   throw new Error('PR head/state moved during review pagination');
  const rp=pr.reviews?.pageInfo,tp=pr.reviewThreads?.pageInfo;
  if(!rp||!tp||!Array.isArray(pr.reviews.nodes)||!Array.isArray(pr.reviewThreads.nodes))
   throw new Error('Review page missing');
  if(!reviewPagesComplete)reviews.push(...pr.reviews.nodes);
  if(!threadPagesComplete)threads.push(...pr.reviewThreads.nodes);
  reviewPagesComplete=!rp.hasNextPage;threadPagesComplete=!tp.hasNextPage;
  if(reviewPagesComplete&&threadPagesComplete)return {pr:prMeta,reviews,threads};
  if((rp.hasNextPage&&!rp.endCursor)||(tp.hasNextPage&&!tp.endCursor))
   throw new Error('Review pagination cursor missing');
  rCursor=rp.hasNextPage?rp.endCursor:rCursor;
  tCursor=tp.hasNextPage?tp.endCursor:tCursor;
 }
 throw new Error('Review page cap exceeded; fail closed');
}
async function main(){
 const [numberString,expectedHead]=process.argv.slice(2),number=Number(numberString);
 const {GITHUB_REPOSITORY:repo,GH_TOKEN:token}=process.env;
 const evidence=await readMidReviewEvidence({repo,number,token});
 const result=assessMidReviewEvidence({...evidence,expectedHead});
 console.log('MID review gate: '+(result.ok?'PASS':'BLOCKED')+
  ' · reviews='+result.reviewCount+' · threads='+result.threadCount+
  ' · summary-issues='+result.reportedIssues);
 for(const b of result.blockers)console.error('::error::MID review gate: '+b);
 if(!result.ok)process.exitCode=1;
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 main().catch(error=>{console.error('::error::MID review gate failed closed: '+(error?.message||'unknown error'));process.exitCode=1});
}
