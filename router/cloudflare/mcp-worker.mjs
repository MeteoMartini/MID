/**
 * MID AI Router — Cloudflare OAuth-protected MCP resource worker. QA candidate.
 * OAuth is validated over AUTH_SERVER service binding, never from request JSON.
 * No public/anonymous inference, debug provider endpoint, auto fallback or retry.
 */
import {OAuthResourceServer} from '@cloudflare/workers-oauth-provider';
import {DurableObject} from 'cloudflare:workers';
import {createMidAiMcpHttpHandler} from '../../scripts/mid-ai-router-mcp-http.mjs';
import {createMidAiOneShotExecutor} from '../../scripts/mid-ai-router-executor.mjs';
import {createMidAiGlobalAdmission} from '../../scripts/mid-ai-router-durable-admission.mjs';
import {createMidAiSignedQuotaVerifier} from '../../scripts/mid-ai-router-signed-quota.mjs';
import {readMidGithubSourceSnapshot} from '../../scripts/mid-ai-router-github-readback.mjs';
const fail=reason=>{const error=new Error(reason);error.reason=reason;throw error;};
const sourceReadback=()=>readMidGithubSourceSnapshot({fetchImpl:fetch});
const validHttps=x=>typeof x==='string'&&/^https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/_-]*)?$/.test(x)&&!x.includes('..');
const hex=bytes=>Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
async function principalDigest(id,pepper){
 if(!/^github:[0-9]{1,20}$/.test(id||'')||
    typeof pepper!=='string'||pepper.length<32)
  fail('PROTECTED_OAUTH_PRINCIPAL_UNAVAILABLE');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pepper),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 return hex(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(id)));
}
export class MidAiLedger extends DurableObject{
 constructor(ctx,env){super(ctx,env);}
 async reserve(request){
  if(!this.env?.MID_AI_SIGNER_PUBLIC_KEY||!this.env?.MID_AI_SIGNER_KEY_ID)
   fail('INDEPENDENT_SIGNER_NOT_CONFIGURED');
  const verifier=await createMidAiSignedQuotaVerifier({
   pinnedPublicKeyBase64url:this.env.MID_AI_SIGNER_PUBLIC_KEY,
   pinnedKeyId:this.env.MID_AI_SIGNER_KEY_ID,
   trustedSourceReadback:sourceReadback
  });
  return createMidAiGlobalAdmission({
   storage:this.ctx.storage,verifyIndependentGrant:verifier
  }).reserve(request);
 }
}
function credentialFor(env,provider){
 if(env.MID_AI_LIVE_DISPATCH_ARMED!=='true')fail('EXTERNAL_INFERENCE_NOT_ARMED');
 const value=provider==='groq'?env.MID_GROQ_FREE_API_KEY:
  provider==='openrouter'?env.MID_OPENROUTER_FREE_API_KEY:
  provider==='gemini'?env.MID_GEMINI_FREE_API_KEY:null;
 if(typeof value!=='string'||value.length<12)
  fail('PROVIDER_CREDENTIAL_NOT_CONFIGURED');
 return value;
}
const scopes=auth=>Array.isArray(auth?.scope)?auth.scope:
 typeof auth?.scope==='string'?auth.scope.split(/\s+/).filter(Boolean):[];
function guardConfig(env){
 if(!validHttps(env?.MID_AI_AUTH_ISSUER)||!validHttps(env?.MID_AI_RESOURCE_URL)||
    new URL(env.MID_AI_RESOURCE_URL).pathname!=='/mcp'||!env?.AUTH_SERVER||
    !env?.MID_AI_LEDGER||typeof env?.MID_AI_SUBJECT_PEPPER!=='string'||
    env.MID_AI_SUBJECT_PEPPER.length<32)fail('OAUTH_RESOURCE_RUNTIME_NOT_CONFIGURED');
}
export default {
 async fetch(request,env,ctx){
  try{guardConfig(env)}
  catch{return new Response('Unavailable',{status:503,headers:{'cache-control':'no-store'}})}
  const oauth=new OAuthResourceServer({
   resourceMetadata:{resource:env.MID_AI_RESOURCE_URL,
    authorization_servers:[env.MID_AI_AUTH_ISSUER]},
   requiredScopes:['mid-ai:read'],
   validateToken:binding=>binding.AUTH_SERVER.validateToken,
   handler:{
    async fetch(verifiedRequest,binding,tokenContext){
     const auth=tokenContext?.auth,userId=tokenContext?.props?.userId;
     const granted=scopes(auth);
     const verifiedAuth=async()=>(
      /^github:[0-9]{1,20}$/.test(userId||'')&&granted.includes('mid-ai:read')?
      {verified:true,audience:'mid-ai-router',
       principalSha256:await principalDigest(userId,binding.MID_AI_SUBJECT_PEPPER),
       scopes:granted}:null
     );
     const execute=async(task,identity)=>{
      if(binding.MID_AI_LIVE_DISPATCH_ARMED!=='true')
       fail('EXTERNAL_INFERENCE_NOT_ARMED');
      if(!identity?.scopes?.includes('mid-ai:infer-public'))
       fail('OAUTH_EXECUTION_SCOPE_REQUIRED');
      const id=binding.MID_AI_LEDGER.idFromName('global-free-quota-v1');
      const ledger=binding.MID_AI_LEDGER.get(id);
      return createMidAiOneShotExecutor({
       authenticate:async()=>({authenticated:true,audience:'mid-ai-router',
        principalSha256:identity.principalSha256,scopes:identity.scopes}),
       admission:{reserve:request=>ledger.reserve(request)},
       readback:sourceReadback,
       credentialFor:provider=>credentialFor(binding,provider),
       fetchImpl:fetch
      }).execute(task);
     };
     return createMidAiMcpHttpHandler({
      verifiedAuth,readSource:sourceReadback,execute,allowedOrigins:[]
     })(verifiedRequest);
    }
   }
  });
  return oauth.fetch(request,env,ctx);
 }
};
