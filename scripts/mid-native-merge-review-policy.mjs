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
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 // Read-only independent QA. This CLI never merges, approves or changes rules.
 if(process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||!process.env.GH_TOKEN){
  process.stderr.write('MID native review audit BLOCKED: identity/credentials missing\n');
  process.exitCode=2;
 }else{
  try{
   const result=await readMidNativeMergeReviewPolicy({token:process.env.GH_TOKEN});
   if(!result.ok){
    process.stderr.write('MID native review audit BLOCKED: '+result.reason+'\n');
    process.exitCode=1;
   }else{
    process.stdout.write('MID native ruleset evidence verified: '+result.rulesetId+
      ' (NOT a release authorization)\n');
   }
  }catch{
   process.stderr.write('MID native review audit BLOCKED: GitHub readback unavailable\n');
   process.exitCode=1;
  }
 }
}
