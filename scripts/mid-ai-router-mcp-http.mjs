/**
 * MID AI Router: stateless Streamable HTTP MCP boundary. No anonymous calls.
 * The trusted OAuth resource wrapper MUST supply independently validated
 * identity; this module NEVER accepts identity, credentials or roles from JSON.
 * A live execution still requires the separately signed one-shot grant and
 * globally durable quota claim in mid-ai-router-executor.mjs.
 */
const HEX=/^[a-f0-9]{64}$/;
const SHA=/^[a-f0-9]{40}$/;
const REQ=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const VERSION=/^0\.\d+\.\d+\.\d+$/;
const PROMPT_SECRET=/(?:api[_-]?key|bearer|password|secret|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{12,}|\b(?:gh[upso]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{18,}|sk-[A-Za-z0-9_-]{16,}|gsk_[A-Za-z0-9_-]{12,})\b|[?&](?:token|key|apikey|api_key)=[^\s&]+/i;
const EMAIL=/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i;
const CATALOG=Object.freeze([
 Object.freeze({provider:'groq',model:'openai/gpt-oss-20b'}),
 Object.freeze({provider:'groq',model:'openai/gpt-oss-120b'}),
 Object.freeze({provider:'openrouter',model:'cohere/north-mini-code:free'}),
 Object.freeze({provider:'openrouter',model:'google/gemma-4-26b-a4b-it:free'}),
 Object.freeze({provider:'gemini',model:'gemini-3.8-flash'})
]);
const TOOLS=Object.freeze([
 Object.freeze({name:'list_models_status',description:'Read-only: pinned candidate models, NOT live account availability or free billing proof.',
  inputSchema:{type:'object',additionalProperties:false,properties:{}},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}}),
 Object.freeze({name:'plan_request',description:'Read-only, zero-dispatch public-redacted task preflight. No signed grant is minted.',
  inputSchema:{type:'object',additionalProperties:false,required:['requestId','expectedStableSha','expectedVersion','kind','prompt'],
   properties:{requestId:{type:'string'},expectedStableSha:{type:'string'},expectedVersion:{type:'string'},
    kind:{type:'string'},prompt:{type:'string'}}},
  annotations:{readOnlyHint:true,destructiveHint:false,openWorldHint:false}}),
 Object.freeze({name:'execute_public_review',description:'One explicit public-redacted signed review. Requires fresh verified free account, OAuth write scope, exact stable SHA, durable global claim; no retries or paid fallback.',
  inputSchema:{type:'object',additionalProperties:false,required:['task'],properties:{task:{type:'object'}}},
  annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:false,openWorldHint:true}})
]);
const json=(status,data)=>new Response(JSON.stringify(data),{status,headers:{
 'content-type':'application/json; charset=utf-8','cache-control':'no-store',
 'x-content-type-options':'nosniff','content-security-policy':"default-src 'none'"}});
const rpc=(id,result)=>json(200,{jsonrpc:'2.0',id,result});
const fault=(id,code,message,status=200)=>json(status,{jsonrpc:'2.0',id,
 error:{code,message}});
const result=x=>({content:[{type:'text',text:JSON.stringify(x)}],isError:false});
const trouble=reason=>({content:[{type:'text',text:JSON.stringify({
 status:'BLOCKED',reason,externalCallsMade:0,automaticRetry:false
 })}],isError:true});
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 Object.getPrototypeOf(x)===Object.prototype;
const hasScope=(auth,scope)=>auth.scopes.includes(scope);
const validIdentity=auth=>plain(auth)&&auth.verified===true&&
 auth.audience==='mid-ai-router'&&HEX.test(auth.principalSha256||'')&&
 Array.isArray(auth.scopes)&&auth.scopes.every(s=>typeof s==='string')&&
 hasScope(auth,'mid-ai:read');
function validSource(snapshot,now){
 const t=Date.parse(snapshot?.checkedAt),ms=now();
 const versions=snapshot?.versionMirrors;
 return Number.isSafeInteger(ms)&&Number.isFinite(t)&&t<=ms&&ms-t<=30000&&
   SHA.test(snapshot?.mainSha||'')&&snapshot.mainSha===snapshot.stableSha&&
   VERSION.test(versions?.package||'')&&versions.package===versions.baseline&&
   versions.package===versions.registry;
}
const KINDS=new Set(['independent-review','external-research','weather-science','bounded-code-review']);
function safePlan(args,snap){
 if(!plain(args)||Object.keys(args).sort().join(',')!==
   'expectedStableSha,expectedVersion,kind,prompt,requestId'||
   !REQ.test(args.requestId||'')||!SHA.test(args.expectedStableSha||'')||
   !VERSION.test(args.expectedVersion||'')||!KINDS.has(args.kind)||
   typeof args.prompt!=='string'||!args.prompt.trim()||args.prompt.length>2000||
   PROMPT_SECRET.test(args.prompt)||EMAIL.test(args.prompt))
   return trouble('INVALID_PUBLIC_TASK');
 if(args.expectedStableSha!==snap.stableSha||
    args.expectedVersion!==snap.versionMirrors.package)
   return trouble('SOURCE_DRIFT');
 // Do not echo the potentially sensitive prompt. No externally usable grant.
 return result({status:'PLAN_ONLY',requestId:args.requestId,
  expectedStableSha:snap.stableSha,version:args.expectedVersion,
  dataClass:'public-redacted',requiredExternalCalls:1,
  maxAdditionalCashUsd:0,dispatchAuthorized:false,
  externalCallsMade:0,signerConfigured:false,
  nextGate:'INDEPENDENT_ACCOUNT_PRICE_PRIVACY_AND_QUOTA_ATTESTATION_REQUIRED'});
}
/**
 * VerifiedAuth is injected ONLY by a token-validating trusted host, never a
 * user-controlled request field. Execute is injected by the protected server
 * which creates the existing signed/atomic one-shot executor.
 */
export function createMidAiMcpHttpHandler({verifiedAuth,readSource,execute,now=()=>Date.now(),
 allowedOrigins=[]}={}){
 if(typeof verifiedAuth!=='function'||typeof readSource!=='function'||
    typeof execute!=='function'||typeof now!=='function'||
    !Array.isArray(allowedOrigins)||allowedOrigins.some(x=>typeof x!=='string'))
  throw new Error('MID_MCP_TRUSTED_RUNTIME_REQUIRED');
 return async request=>{
  let auth;
  try{auth=await verifiedAuth(request)}catch{return json(401,{status:'UNAUTHORIZED'})}
  if(!validIdentity(auth))return json(401,{status:'UNAUTHORIZED'});
  const origin=request.headers.get('origin');
  if(origin!==null&&!allowedOrigins.includes(origin))
    return json(403,{status:'ORIGIN_FORBIDDEN'});
  if(request.method!=='POST')return new Response(null,{status:405,
   headers:{allow:'POST','cache-control':'no-store'}});
  const type=(request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(type!=='application/json')return json(415,{status:'UNSUPPORTED_MEDIA_TYPE'});
  let raw;
  try{raw=await request.arrayBuffer()}catch{return json(400,{status:'BODY_UNREADABLE'})}
  if(raw.byteLength>32768)return json(413,{status:'REQUEST_TOO_LARGE'});
  let payload;
  try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(raw))}
  catch{return fault(null,-32700,'Parse error',400)}
  if(!plain(payload)||payload.jsonrpc!=='2.0'||typeof payload.method!=='string'||
    !(typeof payload.id==='string'||Number.isSafeInteger(payload.id)||payload.id===undefined))
   return fault(null,-32600,'Invalid Request',400);
  if(payload.id===undefined){
   return payload.method==='notifications/initialized'?
     new Response(null,{status:202,headers:{'cache-control':'no-store'}}):
     fault(null,-32600,'Unsupported notification',400);
  }
  const id=payload.id;
  if(payload.method==='initialize')
   return rpc(id,{protocolVersion:'2025-06-18',
    capabilities:{tools:{listChanged:false}},
    serverInfo:{name:'mid-ai-router',version:'0.1.0'}});
  if(payload.method==='ping')return rpc(id,{});
  if(payload.method==='tools/list')return rpc(id,{tools:TOOLS});
  if(payload.method!=='tools/call')return fault(id,-32601,'Method not found');
  const p=payload.params;
  if(!plain(p)||typeof p.name!=='string'||!plain(p.arguments))
   return fault(id,-32602,'Invalid params');
  if(p.name==='list_models_status'){
   if(Object.keys(p.arguments).length)return fault(id,-32602,'Invalid params');
   return rpc(id,result({status:'RESEARCH_CANDIDATES_ONLY',
    models:CATALOG,accountVerified:false,privacyVerified:false,
    zeroCashVerified:false,dispatchAuthorized:false}));
  }
  if(p.name==='plan_request'){
   let snap;
   try{snap=await readSource()}catch{return rpc(id,trouble('SOURCE_READBACK_UNAVAILABLE'))}
   if(!validSource(snap,now))return rpc(id,trouble('SOURCE_READBACK_STALE_OR_INVALID'));
   return rpc(id,safePlan(p.arguments,snap));
  }
  if(p.name!=='execute_public_review')return fault(id,-32602,'Unknown tool');
  if(!hasScope(auth,'mid-ai:infer-public'))
   return rpc(id,trouble('OAUTH_EXECUTION_SCOPE_REQUIRED'));
  if(Object.keys(p.arguments).length!==1||!plain(p.arguments.task))
   return rpc(id,trouble('SIGNED_TASK_REQUIRED'));
  // Source, signatures, billing, atomic quota and post-dispatch checks are
  // enforced again by the protected executor, not by client-side flags.
  try{
   const response=await execute(p.arguments.task,auth);
   if(!plain(response)||response.status!=='UNTRUSTED_REVIEW_ONLY'||
      !REQ.test(response.requestId||'')||!SHA.test(response.stableSha||'')||
      !CATALOG.some(x=>x.provider===response.provider&&x.model===response.model)||
      response.actualModel!==response.model||
      typeof response.text!=='string'||response.text.length>16000||
      response.additionalCashAuthorizedUsd!==0||
      response.automaticRetry!==false||
      response.costStatus!=='NOT_VERIFIED'||response.cashSpendStatus!=='NOT_VERIFIED')
     return rpc(id,trouble('EXECUTOR_RESULT_INVALID'));
   return rpc(id,result({
    status:'UNTRUSTED_REVIEW_ONLY',requestId:response.requestId,
    provider:response.provider,model:response.model,stableSha:response.stableSha,
    text:response.text,usageStatus:response.usageStatus,
    costStatus:'NOT_VERIFIED',sourceVerification:'REQUIRES_INDEPENDENT_ORIGINALS',
    extraModelCallsTriggered:0,automaticRetry:false
   }));
  }catch(e){
   const code=typeof e?.reason==='string'&&/^[A-Z0-9_]{3,80}$/.test(e.reason)?
     e.reason:'EXECUTION_BLOCKED';
   return rpc(id,trouble(code));
  }
 };
}
