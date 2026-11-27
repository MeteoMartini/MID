// Signed, R2-free MID Fast publisher provenance from GitHub Actions OIDC.
// The JWT audience cryptographically binds the immutable native manifest SHA.
export const FAST_OIDC_ISSUER='https://token.actions.githubusercontent.com';
export const FAST_OIDC_JWKS=FAST_OIDC_ISSUER+'/.well-known/jwks';
export const FAST_OIDC_WORKFLOW='MeteoMartini/MID/.github/workflows/mid-ruc-preprocess.yml@refs/heads/main';
export const FAST_OIDC_REPOSITORY_ID='1305110795';
const SHA256_RE=/^[0-9a-f]{64}$/;
const SHA40_RE=/^[0-9a-f]{40}$/;
const RUN_RE=/^20\d{2}-\d{2}-\d{2}T\d{2}:00$/;
const JWT_PART=/^[A-Za-z0-9_-]+$/;
export function fastOidcAudience(sha){
 if(!SHA256_RE.test(String(sha)))throw new Error('invalid SHA for Fast OIDC audience');
 return 'mid-ruc-fast-manifest:v1:'+sha;
}
function jwtPart(part){
 if(typeof part!=='string'||part.length>10000||!JWT_PART.test(part))throw new Error('noncanonical Fast OIDC JWT part');
 const padded=part.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-part.length%4)%4);
 return Uint8Array.from(atob(padded),ch=>ch.charCodeAt(0));
}
function jsonJwtPart(part){return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(jwtPart(part)))}
function safeEpoch(value){return Number.isSafeInteger(value)&&value>0?value*1000:NaN}
export async function verifyFastOidcProof(proof,jwks,{now=Date.now()}={}){
 if(!Number.isFinite(now)||!proof||proof.schema!=='mid.ruc.fast-oidc-proof.v1'||
    !SHA256_RE.test(proof.manifestSha256)||!SHA40_RE.test(proof.stableSha)||
    !RUN_RE.test(proof.run)||typeof proof.oidcToken!=='string'||proof.oidcToken.length>12000||
    !Number.isSafeInteger(proof.runId)||proof.runId<=0||
    !Number.isSafeInteger(proof.runAttempt)||proof.runAttempt<=0)return null;
 const runMs=Date.parse(proof.run+'Z');
 if(!Number.isFinite(runMs)||new Date(runMs).toISOString().slice(0,16)!==proof.run||
    now<runMs-5*60000||now-runMs>4*3600000)return null;
 const parts=proof.oidcToken.split('.');if(parts.length!==3)return null;
 let header,claims,signature;
 try{header=jsonJwtPart(parts[0]);claims=jsonJwtPart(parts[1]);signature=jwtPart(parts[2])}catch{return null}
 if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>128||
    claims?.iss!==FAST_OIDC_ISSUER||claims?.aud!==fastOidcAudience(proof.manifestSha256)||
    claims?.repository!=='MeteoMartini/MID'||String(claims?.repository_id)!==FAST_OIDC_REPOSITORY_ID||
    claims?.ref!=='refs/heads/main'||claims?.workflow_ref!==FAST_OIDC_WORKFLOW||
    claims?.sha!==proof.stableSha||String(claims?.run_id)!==String(proof.runId)||
    String(claims?.run_attempt)!==String(proof.runAttempt)||
    !['schedule','workflow_dispatch'].includes(claims?.event_name))return null;
 const iat=safeEpoch(claims.iat),exp=safeEpoch(claims.exp),nbf=claims.nbf==null?iat:safeEpoch(claims.nbf);
 if(!Number.isFinite(iat)||!Number.isFinite(exp)||!Number.isFinite(nbf)||
    iat>now+60000||now-iat>4*3600000||exp<iat||exp-iat>15*60000||
    nbf>iat+60000||nbf>now+60000||iat<runMs-5*60000)return null;
 // JWT exp is an issuance-credential lifetime, not the validity of an
 // immutable, signed historical assertion. Meteorological/run freshness above
 // separately limits acceptance to four hours.
 const keys=Array.isArray(jwks?.keys)?jwks.keys:[];
 const match=keys.filter(k=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256'&&k.use==='sig'&&
   typeof k.n==='string'&&typeof k.e==='string');
 if(match.length!==1)return null;
 try{
  const key=await crypto.subtle.importKey('jwk',match[0],{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,new TextEncoder().encode(parts[0]+'.'+parts[1]));
  if(!valid)return null;
 }catch{return null}
 return {sha:proof.manifestSha256,run:proof.run,stableSha:proof.stableSha,runId:proof.runId};
}
