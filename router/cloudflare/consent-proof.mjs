/** Original OAuth scope proof: stateless HMAC bound to SDK consent handle.
 * OAuth SDK 1.2.4 approveConsent() overwrites original scopes with selected.
 * A dedicated server-only MID_AI_CONSENT_HMAC_KEY (>=32 random chars) is required.
 */
import {validateMidAiConsentScopes} from './consent-page.mjs';
const error=reason=>{const e=new Error('MID_OAUTH_'+reason);e.reason=reason;throw e;};
const e=new TextEncoder();
const b64=x=>btoa(String.fromCharCode(...new Uint8Array(x))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
const un64=x=>{try{const s=atob(x.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-x.length%4)%4));
 const b=Uint8Array.from(s,c=>c.charCodeAt(0));if(b64(b)!==x)error('INVALID_PROOF');return b;
 }catch{error('INVALID_PROOF')}};
const digest=async(c,v)=>b64(await c.subtle.digest('SHA-256',e.encode(v)));
const identity=r=>{
 const required=['clientId','redirectUri','resource','issuer','state'];
 if(!r||required.some(k=>typeof r[k]!=='string'||r[k].length>4096||
   (k!=='state'&&!r[k].length)))error('INVALID_ORIGINAL_REQUEST');
 for(const k of ['codeChallenge','codeChallengeMethod'])
  if(r[k]!=null&&(typeof r[k]!=='string'||r[k].length>4096))
   error('INVALID_ORIGINAL_REQUEST');
 return JSON.stringify([...required.map(k=>r[k]),r.codeChallenge??null,r.codeChallengeMethod??null]);
};
async function context(secret,handle,now,cryptoImpl){
 if(typeof secret!=='string'||secret.length<32||secret.length>512||
   !/^[A-Za-z0-9_-]{40,90}$/.test(handle||'')||typeof now!=='function'||
   typeof cryptoImpl?.subtle?.importKey!=='function')error('SIGNER_NOT_CONFIGURED');
 const time=now();if(!Number.isSafeInteger(time)||time<0)error('BAD_CLOCK');
 const key=await cryptoImpl.subtle.importKey('raw',e.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 return {time,key};
}
const prefix='MID-AI-OAUTH-SCOPE-V1\u0000';
export async function issueMidAiScopeProof({secret,handle,request,now=Date.now,
 cryptoImpl=globalThis.crypto}={}){
 const {time,key}=await context(secret,handle,now,cryptoImpl);
 const requested=validateMidAiConsentScopes(request?.scope,request?.scope);
 const record={v:1,time,handle:await digest(cryptoImpl,'h\u0000'+handle),
  origin:await digest(cryptoImpl,'o\u0000'+identity(request)),requested};
 const payload=b64(e.encode(JSON.stringify(record)));
 const sig=b64(await cryptoImpl.subtle.sign('HMAC',key,e.encode(prefix+payload)));
 return payload+'.'+sig;
}
export async function verifyMidAiScopeProof({secret,handle,proof,request,selected,
 now=Date.now,cryptoImpl=globalThis.crypto}={}){
 const {time,key}=await context(secret,handle,now,cryptoImpl);
 if(typeof proof!=='string'||!/^[A-Za-z0-9_-]{80,1400}\.[A-Za-z0-9_-]{43}$/.test(proof))
  error('INVALID_PROOF');
 const [payload,signature]=proof.split('.');
 if(!await cryptoImpl.subtle.verify('HMAC',key,un64(signature),e.encode(prefix+payload)))
  error('INVALID_SIGNATURE');
 let record;
 try{record=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(un64(payload)))}
 catch{error('INVALID_PROOF')}
 if(record?.v!==1||!Number.isSafeInteger(record.time)||
   record.time>time||time-record.time>600000)error('PROOF_EXPIRED');
 if(record.handle!==await digest(cryptoImpl,'h\u0000'+handle)||
   record.origin!==await digest(cryptoImpl,'o\u0000'+identity(request)))
  error('PROOF_CONTEXT_MISMATCH');
 const scopes=validateMidAiConsentScopes(record.requested,selected);
 if(!Array.isArray(request.scope)||request.scope.length!==scopes.length||
    request.scope.some((x,i)=>x!==scopes[i]))error('SDK_SCOPE_MISMATCH');
 return scopes;
}
