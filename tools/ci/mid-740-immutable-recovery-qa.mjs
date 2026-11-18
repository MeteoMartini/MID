#!/usr/bin/env node
/** MID #740: read-only metadata preflight for *future* immutable GitHub Release recovery.
 * Caller authenticates GitHub reads and performs independent bytes/attestation verification.
 * Never grants deployment, review, protection, promotion or release authorization.
 */
const SHA=/^[a-f0-9]{40}$/;
const DIGEST=/^sha256:[a-f0-9]{64}$/;
const VERSION=/^0\.[0-9]+\.[0-9]+\.[0-9]+$/;
const REPO='MeteoMartini/MID';
export const REQUIRED_ASSETS=Object.freeze(['MID-professional-replacement.zip','MID-dist-release.zip','MID-release-manifest.json']);
const reject=reason=>Object.freeze({schema:'mid.740.immutable-recovery-qa.v1',status:'BLOCKED',reason,metadataCoherent:false,releaseAuthorized:false,recoveryAuthorized:false,reviewEnforced:false,bytesVerified:false,attestationVerified:false});
const positive=n=>Number.isSafeInteger(n)&&n>0;
export function assessMid740ImmutableRecovery({release,tagSha,sourceSha,mainSha,stableSha,currentSha=sourceSha,version,independentDigests}={}){
 if(!SHA.test(sourceSha??'')||!SHA.test(tagSha??'')||!SHA.test(mainSha??'')||!SHA.test(stableSha??'')||!SHA.test(currentSha??'')||!VERSION.test(version??''))return reject('BAD_SHA_OR_VERSION');
 if(mainSha!==currentSha||stableSha!==currentSha)return reject('STABLE_MAIN_DRIFT');
 // release.target_commitish can be a branch. Caller must dereference tag via authenticated Git API.
 if(tagSha!==sourceSha)return reject('TAG_TARGET_DRIFT');
 if(!positive(release?.id)||release?.tag_name!=='v'+version||release?.immutable!==true||release?.draft!==false||release?.prerelease!==false)return reject('NO_PUBLISHED_IMMUTABLE_RELEASE');
 const created=Date.parse(release.created_at??'');
 const published=Date.parse(release.published_at??'');
 if(!Number.isFinite(created)||!Number.isFinite(published)||published<created)return reject('INVALID_RELEASE_CHRONOLOGY');
 if(!Array.isArray(release.assets)||release.assets.length!==REQUIRED_ASSETS.length||!independentDigests||typeof independentDigests!=='object'||Object.keys(independentDigests).length!==REQUIRED_ASSETS.length)return reject('INCOMPLETE_ASSET_INVENTORY');
 if(new Set(release.assets.map(x=>x?.name)).size!==REQUIRED_ASSETS.length||new Set(release.assets.map(x=>x?.id)).size!==REQUIRED_ASSETS.length)return reject('DUPLICATE_ASSET');
 const verified=[];
 for(const name of REQUIRED_ASSETS){
  const asset=release.assets.find(x=>x?.name===name);
  const expected=independentDigests[name];
  if(!positive(asset?.id)||asset?.state!=='uploaded'||!positive(asset?.size)||asset.size>=2*1024*1024*1024||!DIGEST.test(asset?.digest??'')||!DIGEST.test(expected??'')||asset.digest!==expected)return reject('ASSET_DIGEST_OR_SIZE_INVALID');
  if(asset.url!=='https://api.github.com/repos/'+REPO+'/releases/assets/'+asset.id||asset.browser_download_url!=='https://github.com/'+REPO+'/releases/download/v'+version+'/'+name)return reject('UNTRUSTED_ASSET_URL');
  verified.push(Object.freeze({name,id:asset.id,digest:asset.digest,size:asset.size}));
 }
 return Object.freeze({schema:'mid.740.immutable-recovery-qa.v1',status:'METADATA_COHERENT',metadataCoherent:true,sourceSha,version,assetMetadata:Object.freeze(verified),releaseAuthorized:false,recoveryAuthorized:false,reviewEnforced:false,bytesVerified:false,attestationVerified:false});
}
