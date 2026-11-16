#!/usr/bin/env node
/** MID #740: read-only native-review policy vs. two legacy main-write paths.
 * Both possible outcomes DENY cutover. No ruleset write, no merge, no release.
 */
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const ROOT='repos/MeteoMartini/MID';
const EXPECTED_STABLE='a78465b655d25cafc9ecc0390080694cb7aca957';
const RULE_IDS=[20109260,21919727,23917545,23917807,23963851];
const WORKFLOWS=[
 '.github/workflows/agent-source-release.yml',
 '.github/workflows/install-mid.yml'
];
const deny=reason=>Object.freeze({
 schema:'mid.740.native-review-cutover.v1',status:'BLOCKED',
 reason,nativeReviewEnforcementVerified:false,
 installerAuthorized:false,cutoverAuthorized:false,releaseAuthorized:false
});
const sha=x=>typeof x==='string'&&/^[0-9a-f]{40}$/.test(x);
function validRef(x,branch){
 return x?.commit&&sha(x.commit.sha)&&x.name===branch;
}
function blob(x,path){
 if(x?.path!==path||x.type!=='file'||x.encoding!=='base64'||
    typeof x.content!=='string'||!sha(x.sha))return null;
 const encoded=x.content.replace(/\s/g,'');
 if(!encoded||!/^[A-Za-z0-9+/]*={0,2}$/.test(encoded))return null;
 const bytes=Buffer.from(encoded,'base64');
 if(!bytes.length||bytes.length!==x.size||
    bytes.toString('base64')!==encoded)return null;
 const objectSha=createHash('sha1').update('blob '+bytes.length+'\0')
  .update(bytes).digest('hex');
 if(objectSha!==x.sha)return null;
 return bytes.toString('utf8');
}
function detailsOK(all){
 if(all.length!==RULE_IDS.length)return false;
 const ids=new Set();
 for(const r of all){
  if(!RULE_IDS.includes(r?.id)||ids.has(r.id)||r.enforcement!=='active'||
     !Array.isArray(r.rules)||!Array.isArray(r.bypass_actors)||
     !Array.isArray(r.conditions?.ref_name?.include))return false;
  ids.add(r.id);
 }
 const p=all.find(r=>r.id===23963851);
 const st=all.find(r=>r.id===21919727);
 if(p.name!=='MID Production Branch Guard'||
    st.name!=='MID Stable Protection')return false;
 if(JSON.stringify(p.conditions.ref_name.include.slice().sort())!==
    JSON.stringify(['refs/heads/main','refs/heads/mid-stable'].sort())||
    JSON.stringify(st.conditions.ref_name.include)!==
    JSON.stringify(['refs/heads/mid-stable']))return false;
 const rules=new Set(p.rules.map(x=>x.type));
 if(!['deletion','non_fast_forward','update'].every(x=>rules.has(x))||
    rules.has('pull_request'))return false;
 if(p.bypass_actors.length!==1||
    p.bypass_actors[0].actor_id!==5059236||
    p.bypass_actors[0].actor_type!=='Integration'||
    p.bypass_actors[0].bypass_mode!=='always')return false;
 const checked=st.rules.find(r=>r.type==='required_status_checks');
 return !!checked?.parameters?.required_status_checks?.some(c=>
    c.context==='MID / release-candidate-quality'&&c.integration_id===5059236);
}
export async function inspectMid740NativeReviewCutover(get){
 if(typeof get!=='function')return deny('NO_AUTHENTICATED_READER');
 const read=x=>get(ROOT+'/'+x);
 let repository,main,stable,list,details,files;
 let readPhase='REPOSITORY_BRANCH_AND_RULESET_LIST';
 try{
  [repository,main,stable,list]=await Promise.all([
   get(ROOT),read('branches/main'),read('branches/mid-stable'),
   read('rulesets?per_page=100')
  ]);
  if(!Array.isArray(list)||list.length!==RULE_IDS.length||
     new Set(list.map(x=>x.id)).size!==list.length||
     list.some(x=>!RULE_IDS.includes(x.id)||x.enforcement!=='active'))
   return deny('RULESET_REGISTRY_DRIFT');
  readPhase='RULESET_DETAILS_AND_STABLE_WORKFLOW_BLOBS';
  [details,files]=await Promise.all([
   Promise.all(RULE_IDS.map(id=>read('rulesets/'+id))),
   Promise.all(WORKFLOWS.map(path=>read(
    'contents/'+path+'?ref='+EXPECTED_STABLE)))
  ]);
 }catch{return deny('GITHUB_METADATA_UNAVAILABLE_'+readPhase)}
 if(repository?.id!==1305110795||repository.full_name!=='MeteoMartini/MID'||
    repository.owner?.type!=='User'||
    !validRef(main,'main')||!validRef(stable,'mid-stable')||
    main.commit.sha!==EXPECTED_STABLE||stable.commit.sha!==EXPECTED_STABLE)
  return deny('STABLE_OR_REPOSITORY_DRIFT');
 if(!detailsOK(details)||details.some(d=>
     list.find(r=>r.id===d.id)?.name!==d.name)){
  // Deliberately report only bounded booleans from public policy metadata.
  // Never print GitHub API response bodies, credentials or raw errors.
  const p=details.find(r=>r.id===23963851);
  const st=details.find(r=>r.id===21919727);
  const fields=details.map(r=>String(r?.id)+
   (r?.enforcement==='active'?'A':'I')+
   (Array.isArray(r?.rules)?'R':'X')+
   (Array.isArray(r?.bypass_actors)?'B':'X')+
   (Array.isArray(r?.conditions?.ref_name?.include)?'C':'X')).join('_');
  const flags=[
   p?.name==='MID Production Branch Guard',
   st?.name==='MID Stable Protection',
   JSON.stringify(p?.conditions?.ref_name?.include?.slice()?.sort())===
    JSON.stringify(['refs/heads/main','refs/heads/mid-stable'].sort()),
   JSON.stringify(st?.conditions?.ref_name?.include)===
    JSON.stringify(['refs/heads/mid-stable']),
   p?.bypass_actors?.length===1,
   p?.bypass_actors?.[0]?.actor_id===5059236,
   p?.bypass_actors?.[0]?.bypass_mode==='always',
   !!st?.rules?.find(r=>r.type==='required_status_checks')?.
    parameters?.required_status_checks?.some(c=>
     c.context==='MID / release-candidate-quality'&&c.integration_id===5059236),
   details.every(d=>list.find(r=>r.id===d.id)?.name===d.name)
  ].map(x=>x?'1':'0').join('');
  return deny('ACTIVE_RULESET_OR_BYPASS_DRIFT_'+fields+'_'+flags);
 }
 const code=files.map((f,i)=>blob(f,WORKFLOWS[i]));
 if(code.some(s=>!s))return deny('TRUSTED_WORKFLOW_BLOB_INVALID');
 if(!code[0].includes('git push origin HEAD:main')||
    !code[0].includes('gh api --method PUT')||
    !code[0].includes('node tools/ci/mid-review-premerge-guard.mjs')||
    !code[1].includes('git push origin HEAD:main'))
  return deny('LEGACY_MAIN_WRITE_PATH_DRIFT');
 // Classic branch protection may return 403 with the Actions read token.
 // Unavailable is UNKNOWN, never "no review required".
 const classic={};
 await Promise.all(['main','mid-stable'].map(async branch=>{
  try{
   const x=await read('branches/'+branch+'/protection');
   classic[branch]=x&&typeof x==='object'&&
    Object.hasOwn(x,'required_pull_request_reviews')?'READABLE':'UNVERIFIED';
  }catch{classic[branch]='UNVERIFIED'}
 }));
 let again,latestMain,latestStable,againList,againDetails;
 try{
  [latestMain,latestStable,againList,againDetails]=await Promise.all([
   read('branches/main'),read('branches/mid-stable'),
   read('rulesets?per_page=100'),
   Promise.all(RULE_IDS.map(id=>read('rulesets/'+id)))
  ]);
 }catch{return deny('FINAL_POLICY_READBACK_UNAVAILABLE')}
 if(!validRef(latestMain,'main')||!validRef(latestStable,'mid-stable')||
    latestMain.commit.sha!==EXPECTED_STABLE||
    latestStable.commit.sha!==EXPECTED_STABLE||
    JSON.stringify(againList)!==JSON.stringify(list)||
    JSON.stringify(againDetails)!==JSON.stringify(details))
  return deny('FINAL_POLICY_OR_STABLE_RACE');
 return Object.freeze({
  schema:'mid.740.native-review-cutover.v1',
  status:'LEGACY_MAIN_WRITES_BLOCK_NO_BYPASS_CUTOVER_QA_ONLY',
  stableSha:EXPECTED_STABLE,
  registryAndRuleDetailsVerified:true,
  twoLegacyMainWritePathsSHAAndBlobVerified:true,
  productionRulesetHasRequiredPR:false,
  productionReleaseIntegrationAlwaysBypasses:true,
  stableRequiredStatusCheckObserved:true,
  classicProtection:classic,
  // Not a guarantee of missing reviews outside the observable rulesets.
  nativeReviewEnforcementVerified:false,
  protectedBranchPoliciesFullyVisible:Object.values(classic)
   .every(x=>x==='READABLE'),
  noBypassCutoverCompatible:false,
  installerAuthorized:false,cutoverAuthorized:false,releaseAuthorized:false
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  if(process.env.GITHUB_EVENT_NAME!=='pull_request'||
     process.env.GITHUB_REPOSITORY!=='MeteoMartini/MID'||
     !sha(process.env.EXPECTED_PR_HEAD))
   throw Error('UNTRUSTED_CLI_CONTEXT');
  const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET',path],{
   encoding:'utf8',timeout:20000,maxBuffer:5*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const result=await inspectMid740NativeReviewCutover(get);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='LEGACY_MAIN_WRITES_BLOCK_NO_BYPASS_CUTOVER_QA_ONLY')
   process.exitCode=1;
 }catch{
  process.stdout.write(JSON.stringify(deny('CLI_READBACK_FAILED'))+'\n');
  process.exitCode=1;
 }
}