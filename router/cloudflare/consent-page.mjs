/** Pure, dependency-free OAuth consent renderer; no token or network access. */
const ALLOWED=new Set(['mid-ai:read','mid-ai:infer-public']);
const fail=reason=>{const e=new Error('MID_OAUTH_'+reason);e.reason=reason;throw e;};
const text=(x,max)=>typeof x==='string'&&x.length>0&&x.length<=max;
const escape=x=>String(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
function validScopes(scopes){
 return Array.isArray(scopes)&&scopes.length>0&&scopes.length<=ALLOWED.size&&
  scopes.every(s=>typeof s==='string'&&ALLOWED.has(s))&&
  new Set(scopes).size===scopes.length;
}
export function validateMidAiConsentScopes(requested,selected){
 if(!validScopes(requested)||!validScopes(selected)||
    !requested.includes('mid-ai:read')||!selected.includes('mid-ai:read')||
    selected.some(s=>!requested.includes(s)))fail('UNREQUESTED_OR_INVALID_SCOPE');
 return Object.freeze([...selected]);
}
export function renderMidAiConsentPage(details,handle){
 if(!details||!text(details.clientName,200)||!text(details.redirectHost,255)||
    !text(handle,200)||!validScopes(details.scope)||
    !details.scope.includes('mid-ai:read')||
    (details.clientDomain!=null&&!text(details.clientDomain,255)))
   fail('INVALID_CONSENT_DESCRIPTION');
 const client=escape(details.clientName),host=escape(details.redirectHost);
 const publisher=details.clientDomain?
  'Verifizierte Client-Domain: <strong>'+escape(details.clientDomain)+'</strong>.':
  'Der angezeigte Clientname ist kein verifizierter Herausgebernachweis.';
 const loopback=details.redirectIsLoopback===true||
  /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(details.redirectHost);
 const localWarning=loopback?
  '<p><strong>Lokales Ziel:</strong> Der Zugang wird an eine Anwendung auf diesem Gerät weitergeleitet. Nur erlauben, wenn die Anmeldung selbst gestartet wurde.</p>':'';
 const read='<label><input type="checkbox" name="scope" value="mid-ai:read" checked required> Modelle und Pläne lesen</label>';
 const write=details.scope.includes('mid-ai:infer-public')?
  '<p><label><input type="checkbox" name="scope" value="mid-ai:infer-public"> Öffentliche Free-Modellanfragen nur nach separater signierter Einzelfreigabe</label></p>':'';
 return '<!doctype html><html lang="de"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>MID AI Router OAuth</title></head><body><main><h1>MID AI Router</h1>'+
  '<p>Client: <strong>'+client+'</strong></p><p>'+publisher+'</p>'+
  '<p>Zugang wird weitergeleitet an: <strong>'+host+'</strong>.</p>'+localWarning+
  '<p>Nur öffentliche, anonymisierte Anfragen. Externe Modellkosten erfordern eine separate signierte Freigabe.</p>'+
  '<form method="POST" action="/authorize">'+
  '<input type="hidden" name="handle" value="'+escape(handle)+'">'+read+write+
  '<p><button type="submit" name="decision" value="approve">Freigeben</button> '+
  '<button type="submit" name="decision" value="deny" formnovalidate>Ablehnen</button></p>'+
  '</form></main></body></html>';
}

/**
 * MID-specific original scope evidence. Cloudflare's OAuth SDK v1.2.4
 * deliberately permits approveConsent() to widen the requested scopes;
 * approved.request.scope therefore contains the *selected* scopes.
 * Never compare that overwritten array with the form and call it protection.
 *
 * Store a 10-minute, SHA-256 handle-keyed original-scope snapshot in the
 * existing protected OAUTH_KV. No raw handle, redirect or token is stored.
 * A missing, stale, altered or unreadable record fails closed. This remains
 * a QA-only candidate: actual KV cost/consistency and OAuth E2E are unverified.
 */
const SNAPSHOT_SCHEMA='mid.ai.oauth.consent-original-scopes.v1';
const HANDLE=/^[A-Za-z0-9_-]{40,90}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const sha=async(cryptoImpl,value)=>Array.from(
 new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',
  new TextEncoder().encode(value))),
 byte=>byte.toString(16).padStart(2,'0')).join('');
const protectedContext=(kv,handle,cryptoImpl,now)=>{
 if(typeof kv?.get!=='function'||typeof kv?.put!=='function'||
    typeof kv?.delete!=='function'||!HANDLE.test(handle||'')||
    typeof now!=='function'||typeof cryptoImpl?.subtle?.digest!=='function')
  fail('PROTECTED_CONSENT_STORAGE_REQUIRED');
 const time=now();
 if(!Number.isSafeInteger(time)||time<0)fail('TRUSTED_CONSENT_CLOCK_INVALID');
 return time;
};
const sourceIdentity=request=>{
 if(!request||typeof request!=='object')fail('INVALID_ORIGINAL_CONSENT_REQUEST');
 const mandatory=['clientId','redirectUri','resource','issuer','state'];
 if(mandatory.some(name=>typeof request[name]!=='string'||
     request[name].length>4096||
     (name!=='state'&&request[name].length===0)))
  fail('INVALID_ORIGINAL_CONSENT_REQUEST');
 const optional=['codeChallenge','codeChallengeMethod'];
 if(optional.some(name=>request[name]!==undefined&&
      (typeof request[name]!=='string'||request[name].length>4096)))
  fail('INVALID_ORIGINAL_CONSENT_REQUEST');
 return JSON.stringify([...mandatory.map(name=>request[name]),
  ...optional.map(name=>request[name]??null)]);
};
const scopedKey=async(cryptoImpl,handle)=>
 'mid-ai:oauth:original-scope:'+await sha(cryptoImpl,'MID-AI-OAUTH-HANDLE-V1\u0000'+handle);
export async function rememberMidAiOAuthRequestedScopes({
 kv,handle,request,now=Date.now,cryptoImpl=globalThis.crypto
}={}){
 const stamp=protectedContext(kv,handle,cryptoImpl,now);
 const requested=validateMidAiConsentScopes(request?.scope,request?.scope);
 const identity=sourceIdentity(request);
 const key=await scopedKey(cryptoImpl,handle);
 const snapshot=JSON.stringify({schema:SNAPSHOT_SCHEMA,
  identitySha256:await sha(cryptoImpl,'MID-AI-OAUTH-REQUEST-V1\u0000'+identity),
  requestedScopes:requested,savedAtMs:stamp});
 try{await kv.put(key,snapshot,{expirationTtl:600});}
 catch{fail('CONSENT_SNAPSHOT_WRITE_FAILED');}
}
export async function verifyMidAiOAuthRequestedScopes({
 kv,handle,approvedRequest,selected,now=Date.now,
 cryptoImpl=globalThis.crypto
}={}){
 const stamp=protectedContext(kv,handle,cryptoImpl,now);
 const key=await scopedKey(cryptoImpl,handle);
 let raw;
 try{raw=await kv.get(key);}
 catch{fail('CONSENT_SNAPSHOT_UNAVAILABLE');}
 // Consume our separate evidence even for malicious forms; the SDK
 // independently consumes the browser-bound consent handle.
 try{await kv.delete(key);}
 catch{fail('CONSENT_SNAPSHOT_DELETE_FAILED');}
 if(typeof raw!=='string'||raw.length>1024)
  fail('CONSENT_SNAPSHOT_UNAVAILABLE');
 let record;
 try{record=JSON.parse(raw);}catch{fail('CONSENT_SNAPSHOT_UNAVAILABLE');}
 if(record?.schema!==SNAPSHOT_SCHEMA||!DIGEST.test(record?.identitySha256||'')||
    !Number.isSafeInteger(record?.savedAtMs))
  fail('CONSENT_SNAPSHOT_UNAVAILABLE');
 if(record.savedAtMs>stamp||stamp-record.savedAtMs>600000)
  fail('CONSENT_SNAPSHOT_EXPIRED');
 const identity=sourceIdentity(approvedRequest);
 if(record.identitySha256!==await sha(cryptoImpl,'MID-AI-OAUTH-REQUEST-V1\u0000'+identity))
  fail('CONSENT_SNAPSHOT_BINDING_MISMATCH');
 const safe=validateMidAiConsentScopes(record.requestedScopes,selected);
 if(!Array.isArray(approvedRequest.scope)||
    safe.length!==approvedRequest.scope.length||
    safe.some((scope,i)=>scope!==approvedRequest.scope[i]))
  fail('APPROVED_SCOPE_MISMATCH');
 return safe;
}
