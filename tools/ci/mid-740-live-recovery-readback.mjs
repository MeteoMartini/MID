#!/usr/bin/env node
/** Issue #740: authenticated live GitHub metadata recovery QA; no writes or deploys. */
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {assessMid740ImmutableRecovery,REQUIRED_ASSETS} from './mid-740-immutable-recovery-qa.mjs';
const REPO='MeteoMartini/MID',ID=1305110795;
const PREFIX='repos/'+REPO,API='https://api.github.com/repos/'+REPO;
const SITE='https://github.com/'+REPO;
const SHA=/^[0-9a-f]{40}$/,VERSION=/^0\.[0-9]+\.[0-9]+\.[0-9]+$/;
const DIGEST=/^sha256:[0-9a-f]{64}$/;
const goodId=x=>Number.isSafeInteger(x)&&x>0;
const block=reason=>Object.freeze({schema:'mid.740.live-recovery.v1',status:'BLOCKED',reason,
 metadataVerified:false,bytesVerified:false,attestationVerified:false,
 reviewEnforced:false,sourceBotVerified:false,recoveryAuthorized:false,releaseAuthorized:false});
const fingerprint=xs=>JSON.stringify(xs.map(x=>[x?.name,x?.id,x?.digest,x?.size,x?.state])
 .sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
export async function inspectMid740LiveRecovery({version,expectedSourceSha,independentDigests}={},get){
 if(!VERSION.test(version??'')||!SHA.test(expectedSourceSha??'')||typeof get!=='function')
  return block('BAD_INPUT');
 if(!independentDigests||typeof independentDigests!=='object'||
    Object.keys(independentDigests).length!==REQUIRED_ASSETS.length||
    !REQUIRED_ASSETS.every(n=>DIGEST.test(independentDigests[n]??'')))
  return block('INDEPENDENT_DIGEST_EVIDENCE_REQUIRED');
 const tag='v'+version,read=path=>get(PREFIX+(path?'/'+path:''));
 let repo,main,stable;
 try{[repo,main,stable]=await Promise.all([
  read(''),read('git/ref/heads/main'),read('git/ref/heads/mid-stable')
 ])}catch{return block('SOURCE_READ_UNAVAILABLE')}
 if(repo?.id!==ID||repo.full_name!==REPO)return block('REPOSITORY_ID_DRIFT');
 const match=(ref,branch)=>ref?.ref==='refs/heads/'+branch&&
   ref.object?.type==='commit'&&ref.object.sha===expectedSourceSha;
 if(!match(main,'main')||!match(stable,'mid-stable'))return block('SOURCE_REF_DRIFT');
 let release,tagRef;
 try{[release,tagRef]=await Promise.all([
  read('releases/tags/'+tag),read('git/ref/tags/'+tag)
 ])}catch{return block('RELEASE_OR_TAG_UNVERIFIED')}
 if(!goodId(release?.id)||release.tag_name!==tag||
    release.url!==API+'/releases/'+release.id||
    release.html_url!==SITE+'/releases/tag/'+tag)
  return block('RELEASE_ID_DRIFT');
 if(tagRef?.ref!=='refs/tags/'+tag||!SHA.test(tagRef.object?.sha??''))
  return block('TAG_REF_UNVERIFIED');
 let target;
 if(tagRef.object.type==='commit')target=tagRef.object.sha;
 else if(tagRef.object.type==='tag'){
  let annotated;
  try{annotated=await read('git/tags/'+tagRef.object.sha)}
  catch{return block('ANNOTATED_TAG_UNVERIFIED')}
  if(annotated?.sha!==tagRef.object.sha||annotated.tag!==tag||
     annotated.object?.type!=='commit'||!SHA.test(annotated.object?.sha??''))
   return block('ANNOTATED_TAG_DRIFT');
  target=annotated.object.sha;
 }else return block('TAG_TARGET_TYPE_INVALID');
 if(target!==expectedSourceSha)return block('TAG_SOURCE_DRIFT');
 if(!Array.isArray(release.assets)||release.assets.length!==REQUIRED_ASSETS.length)
  return block('RELEASE_ASSET_INVENTORY_INCOMPLETE');
 let listed,details;
 try{
  listed=await read('releases/'+release.id+'/assets?per_page=100&page=1');
  if(!Array.isArray(listed)||listed.length!==REQUIRED_ASSETS.length)
   return block('ASSET_LIST_INCOMPLETE');
  if(fingerprint(listed)!==fingerprint(release.assets))return block('RELEASE_ASSET_LIST_DRIFT');
  details=await Promise.all(listed.map(a=>{
   if(!goodId(a?.id))throw Error('INVALID_ID');
   return read('releases/assets/'+a.id);
  }));
 }catch{return block('ASSET_DETAILS_UNAVAILABLE')}
 if(fingerprint(details)!==fingerprint(listed)||
    details.some((a,i)=>a?.url!==listed[i].url||
      a?.browser_download_url!==listed[i].browser_download_url))
  return block('ASSET_DETAIL_DRIFT');
 const v=assessMid740ImmutableRecovery({
  release:{...release,assets:details},tagSha:target,sourceSha:expectedSourceSha,
  mainSha:main.object.sha,stableSha:stable.object.sha,version,independentDigests
 });
 if(v.status!=='METADATA_COHERENT')return block(v.reason);
 let again;
 try{again=await Promise.all([
  read('git/ref/heads/main'),read('git/ref/heads/mid-stable'),
  read('releases/tags/'+tag),read('git/ref/tags/'+tag)
 ])}catch{return block('FINAL_GITHUB_READ_UNAVAILABLE')}
 const [m2,s2,r2,t2]=again;
 if(!match(m2,'main')||!match(s2,'mid-stable')||
    r2?.id!==release.id||r2?.immutable!==true||
    r2?.tag_name!==tag||r2?.published_at!==release.published_at||
    fingerprint(r2?.assets??[])!==fingerprint(details)||
    t2?.ref!==tagRef.ref||t2?.object?.type!==tagRef.object.type||
    t2?.object?.sha!==tagRef.object.sha)
  return block('FINAL_READBACK_RACE');
 return Object.freeze({schema:'mid.740.live-recovery.v1',status:'METADATA_COHERENT_QA_ONLY',
  version,sourceSha:expectedSourceSha,releaseId:release.id,
  assets:Object.freeze(v.assetMetadata),metadataVerified:true,
  bytesVerified:false,attestationVerified:false,reviewEnforced:false,
  sourceBotVerified:false,recoveryAuthorized:false,releaseAuthorized:false});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [version,sha,digestPath,...extra]=process.argv.slice(2);
  if(extra.length||!version||!sha||!digestPath)throw Error('BAD_CLI_INPUT');
  // Evidence JSON must be constructed from a separate verified binary-source path.
  const independentDigests=JSON.parse(readFileSync(digestPath,'utf8'));
  const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET',path],{
   encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const result=await inspectMid740LiveRecovery({version,
   expectedSourceSha:sha,independentDigests},get);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status!=='METADATA_COHERENT_QA_ONLY')process.exitCode=1;
 }catch{
  process.stdout.write(JSON.stringify(block('CLI_OR_GITHUB_READ_UNAVAILABLE'))+'\n');
  process.exitCode=1;
 }
}