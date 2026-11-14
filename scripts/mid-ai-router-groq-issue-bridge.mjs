/* MID Groq IssueOps: public, owner-only, secretless catalog request broker.
 * This is a protected read-only preflight candidate, NEVER a model caller.
 */
const SHA=/^[a-f0-9]{40}$/;
const VER=/^0\.\d+\.\d+\.\d+$/;
const REQ=/^mid-groq-[a-z0-9-]{8,40}$/;
const OWNER='MeteoMartini';
const USER_ID=75040651;
const PREFIX='[MID-AI-GROQ-CATALOG] ';
const DESTINATION='mid-ai-router-groq-free-preflight.yml';
const block=reason=>{const e=new Error('MID catalog relay blocked');
 e.name='MidGroqIssueRelayBlocked';e.reason=reason;throw e};
export function makeGroqCatalogIssue({requestId,stableSha,version}={}){
 if(!REQ.test(requestId||'')||!SHA.test(stableSha||'')||!VER.test(version||''))
  block('INVALID_PUBLIC_REQUEST');
 return Object.freeze({title:PREFIX+requestId,
  body:'MID-AI-GROQ-CATALOG-V1\nstable-sha: '+stableSha+
   '\nversion: '+version+'\nrequest-id: '+requestId+'\n',
  repository:'MeteoMartini/MID',noInference:true,noSecrets:true});
}
export function validateGroqCatalogIssue({issue,actor,eventName,repository,
 ref,eventSha,source,now=Date.now()}={}){
 if(actor!==OWNER||repository!=='MeteoMartini/MID'||
    ref!=='refs/heads/main'||eventName!=='issues')
  block('UNTRUSTED_RELAY_EVENT');
 if(issue?.user?.login!==OWNER||issue?.user?.id!==USER_ID||
    issue?.author_association!=='OWNER'||issue?.state!=='open'||
    issue?.pull_request||!Number.isSafeInteger(issue?.number)||issue.number<1)
  block('ISSUE_OWNER_NOT_AUTHORIZED');
 const since=Date.parse(issue?.created_at||'');
 if(!Number.isFinite(since)||!Number.isSafeInteger(now)||
    since>now||now-since>3600000)
  block('ISSUE_NOT_FRESH');
 if(!SHA.test(eventSha||'')||source?.mainSha!==eventSha||
    source?.stableSha!==eventSha||!VER.test(source?.version||''))
  block('LIVE_SOURCE_DRIFT');
 if(typeof issue?.title!=='string'||typeof issue?.body!=='string'||
    issue.body.length>256||!issue.title.startsWith(PREFIX))
  block('NOT_A_SAFE_CATALOG_ISSUE');
 const requestId=issue.title.slice(PREFIX.length);
 const canonical=makeGroqCatalogIssue({
   requestId,stableSha:eventSha,version:source.version});
 if(issue.title!==canonical.title||issue.body!==canonical.body)
  block('ISSUE_BODY_NOT_CANONICAL');
 return Object.freeze({requestId,issueNumber:issue.number,
  stableSha:eventSha,version:source.version});
}
export async function relayGroqCatalogIssue({event,readSource,dispatch,
 now=()=>Date.now()}={}){
 if(typeof readSource!=='function'||typeof dispatch!=='function'||
    typeof now!=='function')block('UNCONFIGURED_RELAY');
 let source;try{source=await readSource()}catch{block('SOURCE_READBACK_FAILED')}
 const item=validateGroqCatalogIssue({...event,source,now:now()});
 let result;
 try{result=await dispatch({workflow:DESTINATION,ref:'mid-stable',
  inputs:{issue_number:String(item.issueNumber),
    request_id:item.requestId,expected_stable_sha:item.stableSha}});}
 catch{block('WORKFLOW_DISPATCH_FAILED')}
 if(result?.accepted!==true)block('WORKFLOW_DISPATCH_NOT_CONFIRMED');
 return Object.freeze({status:'DISPATCH_REQUEST_ACCEPTED',
  requestId:item.requestId,issueNumber:item.issueNumber,
  stableSha:item.stableSha,workflow:DESTINATION,
  inferenceCallsMade:0,secretRead:false,completion:'UNKNOWN'});
}
export async function validateGroqCatalogDispatch({
 actor,repository,ref,eventName,eventSha,inputs,readSource,readIssue,
 now=()=>Date.now()}={}){
 if(repository!=='MeteoMartini/MID'||ref!=='refs/heads/mid-stable'||
    eventName!=='workflow_dispatch'||!SHA.test(eventSha||'')||
    ![OWNER,'github-actions[bot]'].includes(actor)||
    typeof readSource!=='function')
  block('INVALID_DESTINATION_CONTEXT');
 let source;try{source=await readSource()}catch{block('SOURCE_READBACK_FAILED')}
 if(source?.mainSha!==eventSha||source?.stableSha!==eventSha)
  block('LIVE_SOURCE_DRIFT');
 const supplied=!!(inputs?.issue_number||inputs?.request_id||
                  inputs?.expected_stable_sha);
 if(!supplied){
  if(actor!==OWNER)block('BOT_MISSING_ISSUE_PROOF');
  return Object.freeze({sourceSha:eventSha,mode:'OWNER_MANUAL'});
 }
 const num=Number(inputs?.issue_number);
 if(!Number.isSafeInteger(num)||num<1||
    !REQ.test(inputs?.request_id||'')||
    inputs?.expected_stable_sha!==eventSha||
    typeof readIssue!=='function')block('BAD_RELAY_INPUTS');
 let issue;try{issue=await readIssue(num)}catch{block('ISSUE_READBACK_FAILED')}
 let item;
 try{item=validateGroqCatalogIssue({issue,actor:OWNER,eventName:'issues',
  repository,ref:'refs/heads/main',eventSha,source,now:now()})}
 catch{block('RELAY_ORIGIN_ISSUE_REJECTED')}
 if(item.issueNumber!==num||item.requestId!==inputs.request_id)
  block('RELAY_REQUEST_MISMATCH');
 return Object.freeze({sourceSha:eventSha,mode:'OWNER_ISSUE_RELAY',
  requestId:item.requestId,issueNumber:num});
}
