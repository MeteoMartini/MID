/**
 * MID AI Router: signed and source-bound quota admission verifier (QA).
 *
 * Runtime-neutral WebCrypto Ed25519 (Node22 and Cloudflare Workers).
 * This verifier does not mint grants or read provider billing. A separately
 * trusted grant issuer MUST authenticate real free account, exact model,
 * provider data policy and hard cash stop before signing. The runner MUST
 * independently read verified Github main/stable and authenticate the caller.
 * User-submitted flags, keys and prices never authorize an API request.
 */
const HASH40=/^[a-f0-9]{40}$/;
const HASH64=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const KEYID=/^[a-z0-9][a-z0-9._-]{3,63}$/;
const B64URL=/^[A-Za-z0-9_-]+$/;
const MODELS=Object.freeze({
 groq:/^[a-z0-9][a-z0-9/_.-]{3,120}$/,
 openrouter:/^[a-z0-9][a-z0-9/_.-]{3,120}:free$/,
 gemini:/^gemini-[a-z0-9.-]{3,100}$/
});
const FIELDS=Object.freeze([
 'schema','audience','keyId','requestId','principalSha256','taskDigest',
 'expectedStableSha','provider','model','quotaSubject',
 'maxDailyRequests','freePlanVerified','modelAvailable',
 'zeroPriceVerified','hardStopVerified','noPaidFallbackVerified',
 'privacyApproved','globalSubjectVerified','sourceAligned',
 'userAuthorized','dataClass','maxAdditionalCashUsd',
 'issuedAtMs','expiresAtMs'
]);
const fail=reason=>{const e=new Error('MID signed quota verification blocked: '+reason);
 e.name='MidAiSignedQuotaBlocked';e.reason=reason;throw e;};
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const bytesB64=(s,len)=>{
 if(typeof s!=='string'||!B64URL.test(s)||
    s.length!==(len===32?43:86))fail('INVALID_BASE64URL');
 let result;
 try{const decoded=atob(s.replace(/-/g,'+').replace(/_/g,'/')+(len===32?'=':'=='));
  result=Uint8Array.from(decoded,c=>c.charCodeAt(0));
 }catch{fail('INVALID_BASE64URL');}
 if(result.length!==len)fail('INVALID_BASE64URL');
 const encoded=btoa(String.fromCharCode(...result)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
 if(encoded!==s)fail('NONCANONICAL_BASE64URL');
 return result;
};
export function midAiQuotaGrantBytes(grant){
 if(!plain(grant)||Object.keys(grant).length!==FIELDS.length ||
    !FIELDS.every(k=>Object.hasOwn(grant,k)))fail('INVALID_GRANT_SCHEMA');
 if(grant.schema!=='mid.ai-router.quota-grant.v1'||
    grant.audience!=='mid-ai-router-global-admission-v1'||
    !KEYID.test(grant.keyId)||!ID.test(grant.requestId)||
    !HASH64.test(grant.principalSha256)||!HASH64.test(grant.taskDigest)||!HASH40.test(grant.expectedStableSha)||
    !Object.hasOwn(MODELS,grant.provider)||
    typeof grant.model!=='string'||!MODELS[grant.provider].test(grant.model)||
    !HASH64.test(grant.quotaSubject)||
    !Number.isSafeInteger(grant.maxDailyRequests)||
    grant.maxDailyRequests<1||grant.maxDailyRequests>1000||
    !['freePlanVerified','modelAvailable','zeroPriceVerified',
      'hardStopVerified','noPaidFallbackVerified','privacyApproved',
      'globalSubjectVerified','sourceAligned','userAuthorized'].every(k=>grant[k]===true)||
    grant.dataClass!=='public-redacted'||
    !Object.is(grant.maxAdditionalCashUsd,0)||
    !Number.isSafeInteger(grant.issuedAtMs)||
    !Number.isSafeInteger(grant.expiresAtMs)||
    grant.issuedAtMs<0||grant.expiresAtMs<=grant.issuedAtMs||
    grant.expiresAtMs-grant.issuedAtMs>300000)
   fail('INVALID_GRANT_POLICY');
 return new TextEncoder().encode('MID-AI-QUOTA-GRANT-V1\0'+JSON.stringify(
   FIELDS.map(k=>grant[k])));
}
/**
 * Constructor must receive the protected operator-pinned public verification
 * key, never a public key supplied in the untrusted task/grant. Caller supplies
 * trustedSourceReadback from a verified fixed-origin GitHub connection.
 */
export async function createMidAiSignedQuotaVerifier({
 pinnedPublicKeyBase64url,pinnedKeyId,
 trustedSourceReadback,now=()=>Date.now(),cryptoImpl=globalThis.crypto
}={}){
 if(!KEYID.test(pinnedKeyId||'')||
    typeof trustedSourceReadback!=='function'||
    typeof now!=='function'||!cryptoImpl?.subtle)
   fail('INDEPENDENT_VERIFIER_NOT_CONFIGURED');
 const pub=bytesB64(pinnedPublicKeyBase64url,32);
 let key;
 try{key=await cryptoImpl.subtle.importKey('raw',pub,{name:'Ed25519'},
   false,['verify']);}
 catch{fail('PINNED_ED25519_KEY_IMPORT_FAILED');}
 return async request=>{
  if(!plain(request)||!ID.test(request.requestId||'')||
     !HASH40.test(request.expectedStableSha||'')||
     !HASH64.test(request.principalSha256||'')||
     !HASH64.test(request.taskDigest||''))
   fail('INVALID_BOUND_REQUEST');
  const grant=request.grant;
  const payload=midAiQuotaGrantBytes(grant);
  if(grant.keyId!==pinnedKeyId)fail('GRANT_KEY_ID_MISMATCH');
  if(request.requestId!==grant.requestId||
     request.expectedStableSha!==grant.expectedStableSha||
     request.principalSha256!==grant.principalSha256||
     request.taskDigest!==grant.taskDigest)
   fail('GRANT_BINDING_MISMATCH');
  const instant=now();
  if(!Number.isSafeInteger(instant)||instant<0||
     grant.issuedAtMs>instant||instant-grant.issuedAtMs>300000||
     grant.expiresAtMs<=instant)
   fail('GRANT_EXPIRED_OR_CLOCK_INVALID');
  const sig=bytesB64(request.signature,64);
  let valid;
  try{valid=await cryptoImpl.subtle.verify({name:'Ed25519'},key,sig,payload);}
  catch{fail('GRANT_SIGNATURE_VERIFICATION_ERROR');}
  if(valid!==true)fail('INVALID_ED25519_SIGNATURE');
  // Source proof is fetched by the protected runner, NOT taken from grant.
  let source;
  try{source=await trustedSourceReadback();}
  catch{fail('TRUSTED_SOURCE_READBACK_FAILED');}
  const current=now();
  const checkedAt=Date.parse(source?.checkedAt);
  if(!Number.isSafeInteger(current)||!Number.isFinite(checkedAt)||
     checkedAt>current||current-checkedAt>30000)
   fail('SOURCE_READBACK_STALE');
  if(!HASH40.test(source?.mainSha||'')||
     !HASH40.test(source?.stableSha||'')||
     source.mainSha!==source.stableSha||
     source.stableSha!==grant.expectedStableSha)
   fail('SOURCE_DRIFT');
  const hashed=await cryptoImpl.subtle.digest('SHA-256',payload);
  const digest=Array.from(new Uint8Array(hashed),x=>x.toString(16).padStart(2,'0')).join('');
  return Object.freeze({
    verified:true,requestId:grant.requestId,principalSha256:grant.principalSha256,
    taskDigest:grant.taskDigest,
    expectedStableSha:grant.expectedStableSha,provider:grant.provider,
    model:grant.model,quotaSubject:grant.quotaSubject,
    maxDailyRequests:grant.maxDailyRequests,expiresAtMs:grant.expiresAtMs,
    grantDigest:digest,
    userAuthorized:true,sourceAligned:true,freePlanVerified:true,
    modelAvailable:true,zeroPriceVerified:true,hardStopVerified:true,
    noPaidFallbackVerified:true,privacyApproved:true,
    globalSubjectVerified:true
  });
 };
}
