#!/usr/bin/env node
/** Issue #740: authenticated release readback and isolated local restore QA. */
import {execFileSync} from 'node:child_process';
import {constants,readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {open,realpath} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
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
async function matchesLocalAsset(path,asset,capture=false){
 if(capture&&asset.size>65536)return false;
 const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW|constants.O_NONBLOCK);
 try{
  const stat=await file.stat();
  if(!stat.isFile()||stat.size!==asset.size)return false;
  const hash=createHash('sha256');
  const chunks=[];
  let bytes=0;
  for await(const chunk of file.createReadStream({autoClose:false})){
   bytes+=chunk.length;
   if(bytes>asset.size)return false;
   hash.update(chunk);
   if(capture)chunks.push(chunk);
  }
  if(bytes!==asset.size||'sha256:'+hash.digest('hex')!==asset.digest)return false;
  return capture?Buffer.concat(chunks):true;
 }finally{await file.close()}
}

export async function inspectMid740LiveRecovery({
 version,expectedSourceSha,independentDigests,assetDirectory,restoreDestination,installerEvidence=false
}={},get,verifyAsset,restoreDist,verifyInstallerManifest){
 if(!VERSION.test(version??'')||!SHA.test(expectedSourceSha??'')||typeof get!=='function')
  return block('BAD_INPUT');
 if(!independentDigests||typeof independentDigests!=='object'||
    Object.keys(independentDigests).length!==REQUIRED_ASSETS.length||
    !REQUIRED_ASSETS.every(n=>DIGEST.test(independentDigests[n]??'')))
  return block('INDEPENDENT_DIGEST_EVIDENCE_REQUIRED');
 const restoreRequested=restoreDestination!==undefined;
 if(restoreRequested&&(typeof restoreDestination!=='string'||!restoreDestination||
    !assetDirectory||typeof restoreDist!=='function'))return block('ISOLATED_RESTORE_INPUT_REQUIRED');
 if(installerEvidence&&(!restoreRequested||typeof verifyInstallerManifest!=='function'))
  return block('INSTALLER_ATTESTATION_INPUT_REQUIRED');
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
 let distTreeSha;
 if(restoreRequested&&!installerEvidence){
  try{
   const commit=await read('git/commits/'+expectedSourceSha);
   if(commit?.sha!==expectedSourceSha||!SHA.test(commit.tree?.sha??''))
    return block('RECOVERY_COMMIT_TREE_DRIFT');
   const root=await read('git/trees/'+commit.tree.sha);
   if(root?.sha!==commit.tree.sha||root.truncated!==false||!Array.isArray(root.tree))
    return block('RECOVERY_ROOT_TREE_UNVERIFIED');
   const dist=root.tree.filter(entry=>entry?.path==='dist');
   if(dist.length!==1||dist[0].type!=='tree'||dist[0].mode!=='040000'||!SHA.test(dist[0].sha??''))
    return block('RECOVERY_DIST_TREE_UNVERIFIED');
   distTreeSha=dist[0].sha;
  }catch{return block('RECOVERY_TREE_READ_UNAVAILABLE')}
 }
 const checkBytes=assetDirectory!==undefined;
 if(checkBytes){
  if(typeof assetDirectory!=='string'||!assetDirectory||typeof verifyAsset!=='function')
   return block('LOCAL_ASSETS_AND_ATTESTATION_REQUIRED');
  const directory=resolve(assetDirectory);
  try{
   if(await realpath(directory)!==directory)return block('LOCAL_ASSET_DIRECTORY_UNSAFE');
   for(const asset of v.assetMetadata){
    const path=join(directory,asset.name);
    const capture=installerEvidence&&asset.name==='MID-release-manifest.json';
    const verified=await matchesLocalAsset(path,asset,capture);
    if(!verified)return block('LOCAL_ASSET_DIGEST_OR_SIZE_MISMATCH');
    if(await verifyAsset(tag,path)!==true)return block('RELEASE_ASSET_ATTESTATION_UNVERIFIED');
    if(capture){
     if(await verifyInstallerManifest(verified,expectedSourceSha)!==true)
      return block('INSTALLER_MANIFEST_ATTESTATION_UNVERIFIED');
     const manifest=JSON.parse(verified.toString('utf8'));
     const dist=v.assetMetadata.find(item=>item.name==='MID-dist-release.zip');
     if(manifest?.schema!=='mid.740.installer-dist.v1'||manifest.version!==version||
        manifest.sourceSha!==expectedSourceSha||manifest.distDigest!==dist.digest||
        !SHA.test(manifest.distTreeSha??''))return block('INSTALLER_MANIFEST_IDENTITY_DRIFT');
     const snapshotFields=['snapshotManifestSha256','snapshotArchiveSha256'];
     if(snapshotFields.some(key=>Object.hasOwn(manifest,key))&&
        !snapshotFields.every(key=>typeof manifest[key]==='string'&&
          /^[0-9a-f]{64}$/.test(manifest[key])))
      return block('INSTALLER_SNAPSHOT_DIGESTS_INVALID');
     distTreeSha=manifest.distTreeSha;
    }
   }
  }catch{return block('LOCAL_ASSET_OR_ATTESTATION_UNAVAILABLE')}
 }
 let again;
 try{again=await Promise.all([
  read('git/ref/heads/main'),read('git/ref/heads/mid-stable'),
  read('releases/tags/'+tag),read('git/ref/tags/'+tag)
 ])}catch{return block('FINAL_GITHUB_READ_UNAVAILABLE')}
 const [m2,s2,r2,t2]=again;
 if(!match(m2,'main')||!match(s2,'mid-stable')||
    r2?.id!==release.id||r2?.immutable!==true||r2.draft!==false||r2.prerelease!==false||
    r2?.tag_name!==tag||r2?.published_at!==release.published_at||
    fingerprint(r2?.assets??[])!==fingerprint(details)||
    t2?.ref!==tagRef.ref||t2?.object?.type!==tagRef.object.type||
    t2?.object?.sha!==tagRef.object.sha)
  return block('FINAL_READBACK_RACE');
 let restored;
 if(restoreRequested){
  const asset=v.assetMetadata.find(a=>a.name==='MID-dist-release.zip');
  try{
   restored=await restoreDist(join(resolve(assetDirectory),asset.name),resolve(restoreDestination),
    asset.digest.slice('sha256:'.length),distTreeSha,version);
  }catch{return block('DIST_RESTORE_REJECTED')}
  if(restored?.status!=='DIST_RESTORED_QA_ONLY'||restored.distTreeSha!==distTreeSha||
     restored.version!==version||!goodId(restored.files)||restored.recoveryAuthorized!==false||
     restored.releaseAuthorized!==false)return block('DIST_RESTORE_PROOF_INVALID');
 }
 return Object.freeze({schema:'mid.740.live-recovery.v1',
  status:restored?'ATTESTED_DIST_RESTORED_QA_ONLY':
   checkBytes?'ATTESTED_ASSETS_VERIFIED_QA_ONLY':'METADATA_COHERENT_QA_ONLY',
  ...(restored&&{distTreeSha,restoredFiles:restored.files,
   distTreeEvidence:installerEvidence?'installer-attestation':'stable-git-tree'}),
  version,sourceSha:expectedSourceSha,releaseId:release.id,
  assets:Object.freeze(v.assetMetadata),metadataVerified:true,
  bytesVerified:checkBytes,attestationVerified:checkBytes,reviewEnforced:false,
  sourceBotVerified:false,recoveryAuthorized:false,releaseAuthorized:false});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const [version,sha,digestPath,assetDirectory,restoreDestination,mode,...extra]=process.argv.slice(2);
  if(extra.length||!version||!sha||!digestPath||(mode!==undefined&&mode!=='--installer-attestation'))
   throw Error('BAD_CLI_INPUT');
  // Evidence JSON must be constructed from a separate verified binary-source path.
  const independentDigests=JSON.parse(readFileSync(digestPath,'utf8'));
  const get=path=>JSON.parse(execFileSync('gh',['api','--method','GET',path],{
   encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024,
   stdio:['ignore','pipe','ignore']
  }));
  const verifyAsset=(tag,path)=>{
   execFileSync('gh',['release','verify-asset',tag,path,'--repo','github.com/'+REPO],{
    timeout:60000,stdio:['ignore','ignore','ignore']
   });
   return true;
  };
  const restoreDist=(...args)=>JSON.parse(execFileSync('python3',[
   fileURLToPath(new URL('./mid_740_restore_dist.py',import.meta.url)),...args
  ],{encoding:'utf8',timeout:180000,maxBuffer:1024*1024,stdio:['ignore','pipe','ignore']}));
  const verifyInstallerManifest=(bytes,sourceSha)=>{
   const directory=mkdtempSync(join(tmpdir(),'mid740-installer-attestation-'));
   try{
    const path=join(directory,'MID-release-manifest.json');
    writeFileSync(path,bytes,{mode:0o600,flag:'wx'});
    execFileSync('gh',['attestation','verify',path,'--repo',REPO,'--hostname','github.com',
     '--signer-workflow',REPO+'/.github/workflows/install-mid.yml',
     '--signer-digest',sourceSha,'--source-digest',sourceSha,
     '--source-ref','refs/heads/main','--deny-self-hosted-runners'],
    {timeout:60000,stdio:['ignore','ignore','ignore']});
    return true;
   }finally{rmSync(directory,{recursive:true,force:true})}
  };
  const result=await inspectMid740LiveRecovery({version,
   expectedSourceSha:sha,independentDigests,assetDirectory,restoreDestination,
   installerEvidence:mode!==undefined},get,verifyAsset,restoreDist,verifyInstallerManifest);
  process.stdout.write(JSON.stringify(result)+'\n');
  if(result.status==='BLOCKED')process.exitCode=1;
 }catch{
  process.stdout.write(JSON.stringify(block('CLI_OR_GITHUB_READ_UNAVAILABLE'))+'\n');
  process.exitCode=1;
 }
}
