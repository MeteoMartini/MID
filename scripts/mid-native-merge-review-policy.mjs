/** MID native merge-time review protection: QA only, NOT a merge permit.
 * Two GraphQL readbacks cannot close GitHub REST merge TOCTOU.
 * Authenticated GitHub-native PR protection must do so at the merge boundary.
 */
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const HOST='https://api.github.com/repos/MeteoMartini/MID';
const MAIN='refs/heads/main';
const block=reason=>Object.freeze({ok:false,reason,mergeAuthorized:false,releaseAuthorized:false});
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function assessMidNativeMergeReviewPolicy({summaries,detailsById,branch=MAIN}={}){
 if(branch!==MAIN)return block('WRONG_PROTECTED_BRANCH');
 if(!Array.isArray(summaries)||!detailsById||typeof detailsById!=='object'||
    Array.isArray(detailsById))return block('RULESET_PROVENANCE_MISSING');
 if(summaries.length>100)return block('RULESET_COLLECTION_OVERSIZE');
 const ids=new Set();
 for(const s of summaries){
  if(!Number.isSafeInteger(s?.id)||s.id<1||ids.has(s.id))
   return block('RULESET_ID_MISSING_OR_DUPLICATED');
  ids.add(s.id);
  const r=detailsById[String(s.id)];
  if(!r||r.id!==s.id)return block('RULESET_DETAIL_MISSING');
  if(r.enforcement!==s.enforcement||r.target!==s.target)
   return block('RULESET_METADATA_MISMATCH');
 }
 // Validate every ruleset before accepting even one protective rule.
 // Otherwise a valid first entry can mask a later duplicate or corrupt ID.
 for(const s of summaries){
  const r=detailsById[String(s.id)];
  if(r.enforcement!=='active'||r.target!=='branch')continue;
  const refs=r.conditions?.ref_name;
  if(!Array.isArray(refs?.include)||!refs.include.includes(MAIN)||
     !Array.isArray(refs?.exclude)||refs.exclude.length!==0)continue;
  if(!Array.isArray(r.bypass_actors)||r.bypass_actors.length!==0)continue;
  if(r.current_user_can_bypass&&r.current_user_can_bypass!=='never')continue;
  if(!Array.isArray(r.rules))continue;
  for(const item of r.rules){
   if(item?.type!=='pull_request')continue;
   const p=item.parameters;
   if(p?.required_review_thread_resolution!==true||
      !Number.isSafeInteger(p.required_approving_review_count)||
      p.required_approving_review_count<1||
      p.dismiss_stale_reviews_on_push!==true||
      p.require_last_push_approval!==true)continue;
   return Object.freeze({ok:true,reason:'NATIVE_REVIEW_RULE_METADATA_VERIFIED',
     rulesetId:s.id,mergeAuthorized:false,releaseAuthorized:false,
     sourceGatePassed:false});
  }
 }
 return block('NATIVE_MERGE_TIME_REVIEW_ENFORCEMENT_MISSING');
}
export async function readMidNativeMergeReviewPolicy({fetchImpl=globalThis.fetch,
 token,timeoutMs=15000}={}){
 if(typeof fetchImpl!=='function'||typeof token!=='string'||token.length<12||
    !Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)
  throw new Error('MID_REVIEW_AUDIT_INPUT_INVALID');
 async function get(path){
  if(!/^\/rulesets(?:\?includes_parents=true|\/[1-9][0-9]*)$/.test(path))
   throw new Error('MID_REVIEW_AUDIT_PATH_INVALID');
  const reply=await fetchImpl(HOST+path,{method:'GET',redirect:'error',
   signal:AbortSignal.timeout(timeoutMs),headers:{
    Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'}});
  if(!reply||reply.ok!==true)throw new Error('MID_REVIEW_AUDIT_HTTP_ERROR');
  const body=await reply.text();
  if(typeof body!=='string'||body.length>1048576)
   throw new Error('MID_REVIEW_AUDIT_RESPONSE_TOO_LARGE');
  try{return JSON.parse(body)}catch{throw new Error('MID_REVIEW_AUDIT_INVALID_JSON')}
 }
 const summaries=await get('/rulesets?includes_parents=true');
 if(!Array.isArray(summaries)||summaries.length>100)
  throw new Error('MID_REVIEW_AUDIT_LIST_INVALID');
 const detailsById=Object.create(null);
 for(const s of summaries){
  if(!Number.isSafeInteger(s?.id)||s.id<1||has(detailsById,String(s.id)))
   throw new Error('MID_REVIEW_AUDIT_ID_INVALID');
  detailsById[String(s.id)]=await get('/rulesets/'+s.id);
 }
 return assessMidNativeMergeReviewPolicy({summaries,detailsById});
}

/** Optional classic branch-protection route: GitHub enforces review state at
 * merge time independently of the release workflow's prior GraphQL snapshots.
 * GitHub App may get HTTP 403; report UNREADABLE, never "unprotected".
 */
export function assessMidClassicBranchReviewPolicy({protection,branch=MAIN}={}){
 if(branch!==MAIN)return block('CLASSIC_WRONG_BRANCH');
 if(!protection||typeof protection!=='object'||Array.isArray(protection))
  return block('CLASSIC_PROTECTION_NOT_ATTESTED');
 const pr=protection.required_pull_request_reviews,limits=pr?.bypass_pull_request_allowances;
 const empty=k=>Array.isArray(limits?.[k])&&limits[k].length===0;
 if(protection.enforce_admins?.enabled!==true)
  return block('CLASSIC_ADMIN_BYPASS_NOT_EXCLUDED');
 if(protection.required_conversation_resolution?.enabled!==true)
  return block('CLASSIC_UNRESOLVED_THREADS_NOT_BLOCKED');
 if(protection.allow_force_pushes?.enabled!==false||
    protection.allow_deletions?.enabled!==false)
  return block('CLASSIC_HISTORY_MUTATION_NOT_BLOCKED');
 if(!pr||!Number.isSafeInteger(pr.required_approving_review_count)||
    pr.required_approving_review_count<1||pr.dismiss_stale_reviews!==true||
    pr.require_last_push_approval!==true)
  return block('CLASSIC_INDEPENDENT_REVIEW_NOT_ENFORCED');
 if(!empty('users')||!empty('teams')||!empty('apps'))
  return block('CLASSIC_REVIEW_BYPASS_NOT_EXCLUDED');
 return Object.freeze({ok:true,reason:'CLASSIC_MAIN_REVIEW_METADATA_VERIFIED',
  branch:MAIN,mergeAuthorized:false,releaseAuthorized:false,sourceGatePassed:false});
}
/** GET only, exact fixed path and host; never leak credentials, never change
 * protection. 403/404 are evidence of *unreadability*, not missing rules.
 */
export async function readMidClassicBranchReviewPolicy({
 fetchImpl=globalThis.fetch,token,timeoutMs=15000
}={}){
 if(typeof fetchImpl!=='function'||typeof token!=='string'||token.length<12||
    !Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)
  return block('CLASSIC_READ_INPUT_INVALID');
 try{
  const reply=await fetchImpl(HOST+'/branches/main/protection',{
   method:'GET',redirect:'error',signal:AbortSignal.timeout(timeoutMs),
   headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28'}
  });
  if(reply?.ok!==true)return block('CLASSIC_PROTECTION_NOT_READABLE');
  const raw=await reply.text();
  if(typeof raw!=='string'||raw.length>1048576)
   return block('CLASSIC_PROTECTION_NOT_READABLE');
  const data=JSON.parse(raw);
  return assessMidClassicBranchReviewPolicy({protection:data});
 }catch{return block('CLASSIC_PROTECTION_NOT_READABLE')}
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 // Read-only independent QA. This CLI never merges, approves or changes rules.
 if(process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||!process.env.GH_TOKEN){
  process.stderr.write('MID native review audit BLOCKED: identity/credentials missing\n');
  process.exitCode=2;
 }else{
  try{
   // Both native forms must be checked. A classic-API 403 is not proof of
   // missing protection, and a ruleset-only readback cannot rule classic out.
   const [native,classic]=await Promise.allSettled([
    readMidNativeMergeReviewPolicy({token:process.env.GH_TOKEN}),
    readMidClassicBranchReviewPolicy({token:process.env.GH_TOKEN})
   ]);
   const a=native.status==='fulfilled'?native.value:block('RULESETS_NOT_READABLE');
   const b=classic.status==='fulfilled'?classic.value:block('CLASSIC_PROTECTION_NOT_READABLE');
   if(a.ok||b.ok){
    process.stdout.write('MID merge-time review metadata: '+(a.ok?'ruleset ':'')+
      (b.ok?'classic':'')+' (NOT a release authorization)\n');
   }else{
    process.stderr.write('MID native review audit BLOCKED: '+a.reason+
      '; '+b.reason+'\n');
    process.exitCode=1;
   }
  }catch{
   process.stderr.write('MID native review audit BLOCKED: GitHub readback unavailable\n');
   process.exitCode=1;
  }
 }
}
