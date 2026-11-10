/**
 * MID AI Router: bounded Workers-compatible external inference executor.
 * Candidate library; NO deployed endpoint, OAuth server, issuer or credentials.
 * The runtime MUST supply authenticated caller identity, signed quota admission,
 * fixed-origin live GitHub readback and server-only credential lookup.
 * Every actual call consumes one global, unrecoverable reservation. No retry,
 * paid route, hidden model switch, tool execution or arbitrary HTTP endpoint.
 */
const SHA=/^[a-f0-9]{40}$/, HASH=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
// Defense in depth: public-redacted is not permission to forward PII or keys.
// The independent issuer must also approve actual data classification.
const SECRET=/(?:api[_-]?key|bearer|password|secret|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{12,}|\b(?:gh[upso]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{18,}|sk-[A-Za-z0-9_-]{16,}|gsk_[A-Za-z0-9_-]{12,})\b|[?&](?:token|key|apikey|api_key)=[^\s&]+/i;
const EMAIL=/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const INTENTS=new Set(['independent-review','external-research','weather-science','bounded-code-review']);
const ENDPOINTS=Object.freeze({
 groq:'https://api.groq.com/openai/v1/chat/completions',
 openrouter:'https://openrouter.ai/api/v1/chat/completions',
 gemini:'https://generativelanguage.googleapis.com/v1beta/models/'
});
const deny=reason=>{const e=new Error('MID external one-shot blocked: '+reason);
 e.name='MidAiOneShotBlocked';e.reason=reason;throw e;};
const hex=buf=>Array.from(new Uint8Array(buf),x=>x.toString(16).padStart(2,'0')).join('');
const isSafeTask=t=>t?.userInitiated===true && t?.allowExternalInference===true &&
 t?.maxExternalCalls===1 && Object.is(t?.maxAdditionalCashUsd,0) &&
 INTENTS.has(t?.kind) && t?.dataClass==='public-redacted' &&
 ID.test(t?.requestId||'') && SHA.test(t?.expectedStableSha||'') &&
 VERSION.test(t?.expectedVersion||'') &&
 typeof t?.prompt==='string' && t.prompt.trim().length>0 &&
 t.prompt.length<=2000 &&
 !SECRET.test(t.prompt) && !EMAIL.test(t.prompt);
export async function midAiOneShotTaskDigest(task,principalSha256,cryptoImpl=globalThis.crypto){
 if(!isSafeTask(task)||!HASH.test(principalSha256||'')||!cryptoImpl?.subtle)
   deny('TASK_SCOPE_INVALID');
 const wire=new TextEncoder().encode('MID-AI-ONE-SHOT-V1\0'+JSON.stringify([
   task.requestId,task.kind,task.dataClass,task.expectedStableSha,
   task.expectedVersion,principalSha256,task.prompt
 ]));
 return hex(await cryptoImpl.subtle.digest('SHA-256',wire));
}
async function verifySource(readback,task,now){
 let state;try{state=await readback();}catch{deny('SOURCE_READBACK_UNAVAILABLE');}
 const time=Date.parse(state?.checkedAt),current=now();
 if(!Number.isSafeInteger(current)||!Number.isFinite(time)||
    time>current||current-time>30000)deny('SOURCE_READBACK_STALE');
 const versions=state?.versionMirrors;
 if(state?.mainSha!==task.expectedStableSha||
    state?.stableSha!==task.expectedStableSha||
    versions?.package!==task.expectedVersion||
    versions?.baseline!==task.expectedVersion||
    versions?.registry!==task.expectedVersion)
   deny('SOURCE_DRIFT_OR_VERSION_MISMATCH');
}
function envelope(provider,model,prompt,credential){
 if(typeof credential!=='string'||credential.length<12||
    credential.length>2048)deny('SERVER_CREDENTIAL_MISSING');
 if(!Object.hasOwn(ENDPOINTS,provider))deny('PROVIDER_NOT_ALLOWED');
 if(typeof model!=='string'||model.length>130 ||
    (provider==='openrouter'&&!/^[a-z0-9][a-z0-9/_.-]{3,120}:free$/.test(model))||
    (provider==='gemini'&&!/^gemini-[a-z0-9.-]{3,100}$/.test(model))||
    (provider==='groq'&&!/^[a-z0-9][a-z0-9/_.-]{3,120}$/.test(model)))
   deny('MODEL_NOT_ALLOWED');
 if(provider==='gemini')return {
  url:ENDPOINTS.gemini+encodeURIComponent(model)+':generateContent',
  headers:{'content-type':'application/json','x-goog-api-key':credential},
  body:JSON.stringify({contents:[{role:'user',parts:[{text:prompt}]}],
    generationConfig:{maxOutputTokens:256}})
 };
 const payload={model,messages:[{role:'user',content:prompt}],
  stream:false};
 if(provider==='groq')payload.max_completion_tokens=256;
 else {
  payload.max_tokens=256;
  payload.provider={allow_fallbacks:false,data_collection:'deny',zdr:true,
   max_price:{prompt:0,completion:0,request:0}};
 }
 return {url:ENDPOINTS[provider],
  headers:{'content-type':'application/json',authorization:'Bearer '+credential},
  body:JSON.stringify(payload)};
}
async function boundedJson(response){
 if(!response || response.ok!==true)
   deny('PROVIDER_HTTP_'+(Number.isSafeInteger(response?.status)?response.status:'UNKNOWN'));
 const len=response.headers?.get?.('content-length');
 if(len!==null&&len!==undefined&&len!==''){
  const n=Number(len);
  if(!Number.isSafeInteger(n)||n<0||n>65536)deny('INVALID_OR_EXCESSIVE_RESPONSE_LENGTH');
 }
 if(!response.body || typeof response.body.getReader!=='function')deny('UNSTREAMED_PROVIDER_RESPONSE');
 const reader=response.body.getReader();
 const decoder=new TextDecoder('utf-8',{fatal:true});
 let bytes=0,text='';
 try{
  while(true){
   const r=await reader.read();
   if(r.done)break;
   if(!(r.value instanceof Uint8Array))deny('INVALID_PROVIDER_CHUNK');
   bytes+=r.value.byteLength;
   if(bytes>65536)deny('PROVIDER_RESPONSE_TOO_LARGE');
   text+=decoder.decode(r.value,{stream:true});
  }
  text+=decoder.decode();
 }catch(e){
  try{await reader.cancel()}catch{}
  if(e?.name==='MidAiOneShotBlocked')throw e;
  deny('INVALID_PROVIDER_STREAM');
 }finally{reader.releaseLock()}
 try{return JSON.parse(text)}catch{deny('INVALID_PROVIDER_JSON')}
}
/**
 * Upstream usage is untrusted telemetry, never evidence of zero price.
 * Keep only known nonnegative integer token counts; never echo arbitrary
 * provider metadata, prompts, keys or unexpected string properties.
 */
function sanitizeProviderUsage(provider,json){
 const raw=provider==='gemini'?json?.usageMetadata:json?.usage;
 if(raw===null||raw===undefined)
   return {usage:null,usageStatus:'NOT_REPORTED'};
 if(typeof raw!=='object'||Array.isArray(raw))
   return {usage:null,usageStatus:'INVALID_UPSTREAM_USAGE'};
 const keys=provider==='gemini'?
   ['promptTokenCount','candidatesTokenCount','totalTokenCount']:
   ['prompt_tokens','completion_tokens','total_tokens'];
 const safe={};
 for(const name of keys){
  if(Object.hasOwn(raw,name)){
   if(!Number.isSafeInteger(raw[name])||raw[name]<0)
     return {usage:null,usageStatus:'INVALID_UPSTREAM_USAGE'};
   safe[name]=raw[name];
  }
 }
 if(Object.keys(safe).length===0)
   return {usage:null,usageStatus:'INVALID_UPSTREAM_USAGE'};
 return {usage:Object.freeze(safe),usageStatus:'UPSTREAM_REPORTED_UNVERIFIED'};
}
export function createMidAiOneShotExecutor({
 authenticate,admission,readback,credentialFor,fetchImpl,now=()=>Date.now(),
 cryptoImpl=globalThis.crypto
}={}){
 if(typeof authenticate!=='function'||typeof admission?.reserve!=='function'||
    typeof readback!=='function'||typeof credentialFor!=='function'||
    typeof fetchImpl!=='function'||typeof now!=='function'||!cryptoImpl?.subtle)
   deny('PROTECTED_RUNTIME_NOT_CONFIGURED');
 return Object.freeze({
  async execute(task){
   if(!isSafeTask(task))deny('TASK_SCOPE_INVALID');
   let user;
   try{user=await authenticate()}catch{deny('AUTHENTICATION_UNAVAILABLE')}
   if(user?.authenticated!==true||user?.audience!=='mid-ai-router'||
      !Array.isArray(user.scopes)||!user.scopes.includes('mid-ai:infer-public')||
      !HASH.test(user.principalSha256||''))
     deny('AUTHENTICATED_PUBLIC_SCOPE_REQUIRED');
   const taskDigest=await midAiOneShotTaskDigest(task,user.principalSha256,cryptoImpl);
   if(!task?.grant||!task?.signature)deny('SIGNED_GRANT_REQUIRED');
   // This callback MUST verify Ed25519, authenticated account/real quota and
   // source SHA before a transaction; the caller does not choose the verifier.
   const claim=await admission.reserve({
    requestId:task.requestId,taskDigest,expectedStableSha:task.expectedStableSha,
    principalSha256:user.principalSha256,grant:task.grant,signature:task.signature
   });
   if(claim?.status!=='RESERVED_NO_DISPATCH'||
      claim.requestId!==task.requestId||claim.stableSha!==task.expectedStableSha)
     deny('DURABLE_CLAIM_NOT_PROVEN');
   // NO retry or release of claim if anything below fails.
   await verifySource(readback,task,now);
   if(!Number.isSafeInteger(task.grant.expiresAtMs)||
      task.grant.expiresAtMs<=now())deny('GRANT_EXPIRED_AFTER_ADMISSION');
   // Model and provider are cryptographically bound to the grant checked by
   // admission. Credential never comes from task, GitHub or public browser.
   let credential;
   try{credential=await credentialFor(task.grant.provider)}
   catch{deny('SERVER_CREDENTIAL_UNAVAILABLE')}
   const req=envelope(task.grant.provider,task.grant.model,task.prompt,credential);
   let response;
   try{
    response=await fetchImpl(req.url,{method:'POST',headers:req.headers,
     body:req.body,redirect:'error',signal:AbortSignal.timeout(15000)});
   }catch{deny('PROVIDER_TRANSPORT_FAILED')}
   const json=await boundedJson(response);
   const provider=task.grant.provider,model=task.grant.model;
   const actual=provider==='gemini'?
     (typeof json?.modelVersion==='string'?json.modelVersion.replace(/^models\//,''):null):
      json?.model;
   if(actual!==model)deny('REPORTED_MODEL_MISMATCH');
   const candidate=provider==='gemini'?json?.candidates?.[0]:json?.choices?.[0];
   const finish=provider==='gemini'?candidate?.finishReason:candidate?.finish_reason;
   if(finish!==(provider==='gemini'?'STOP':'stop'))deny('INCOMPLETE_OR_FILTERED_RESPONSE');
   const answer=provider==='gemini'?
      candidate?.content?.parts?.map(p=>p?.text).filter(x=>typeof x==='string').join('\n'):
      candidate?.message?.content;
   if(typeof answer!=='string'||!answer.trim())deny('EMPTY_PROVIDER_RESPONSE');
   const reportedUsage=sanitizeProviderUsage(provider,json);
   return Object.freeze({
    status:'UNTRUSTED_REVIEW_ONLY',provider,model,actualModel:actual,
    requestId:task.requestId,stableSha:task.expectedStableSha,
    text:answer.slice(0,16000),
    usage:reportedUsage.usage,
    usageStatus:reportedUsage.usageStatus,
    costStatus:'NOT_VERIFIED',cashSpendStatus:'NOT_VERIFIED',
    checkedSources:'REQUIRES_INDEPENDENT_ORIGINAL_VERIFICATION',
    authenticatedPrincipalShown:false,credentialsShown:false,
    automaticRetry:false,additionalCashAuthorizedUsd:0
   });
  }
 });
}
