/**
 * MID AI Router OAuth 2.1 issuer – QA candidate, NOT DEPLOYED.
 * Per-client consent first, GitHub S256 PKCE identity second; actual
 * access tokens issued by @cloudflare/workers-oauth-provider v1.2.4.
 * No GitHub repository scope or persisted upstream access token.
 */
import {WorkerEntrypoint} from 'cloudflare:workers';
import {OAuthAuthorizationServer} from '@cloudflare/workers-oauth-provider';
const deny=reason=>{throw new Error('MID_OAUTH_'+reason)};
const exact=x=>typeof x==='string'&&/^https:\/\/[a-z0-9.-]+(?:\/[a-z0-9/_-]*)?$/.test(x)&&!x.includes('..');
function configured(env){
 if(!exact(env?.MID_AI_AUTH_ISSUER)||!exact(env?.MID_AI_RESOURCE_URL)||
    new URL(env.MID_AI_RESOURCE_URL).pathname!=='/mcp'||
    !env?.OAUTH_KV||!/^[0-9]{1,20}$/.test(env.MID_AI_ALLOWED_GITHUB_USER_ID||'')||
    !/^[a-zA-Z0-9]{10,150}$/.test(env.MID_AI_GITHUB_CLIENT_ID||'')||
    typeof env.MID_AI_GITHUB_CLIENT_SECRET!=='string'||
    env.MID_AI_GITHUB_CLIENT_SECRET.length<20)
  deny('CONFIG_REQUIRED');
}
const service=env=>new OAuthAuthorizationServer({
 issuer:env.MID_AI_AUTH_ISSUER,resources:[env.MID_AI_RESOURCE_URL],
 scopesSupported:['mid-ai:read','mid-ai:infer-public'],
 clientIdMetadataDocumentEnabled:true
});
const esc=x=>String(x).replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
function consentPage(label,handle){
 return '<!doctype html><html lang="de"><head><meta charset="utf-8">'+
  '<meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<title>MID AI Router OAuth</title></head><body><main><h1>MID AI Router</h1>'+
  '<p>Client: '+esc(label)+'</p><p>Nur öffentliche, anonymisierte Anfragen. '+
  'Externe Modellkosten benötigen eine zusätzliche signierte Freigabe.</p>'+
  '<form method="POST" action="/authorize">'+
  '<input type="hidden" name="handle" value="'+esc(handle)+'">'+
  '<label><input type="checkbox" name="scope" value="mid-ai:read" checked required>'+
  ' Modelle und Pläne lesen</label><p><label>'+
  '<input type="checkbox" name="scope" value="mid-ai:infer-public">'+
  ' Öffentliche Free-Modellanfragen nach Einzelfreigabe ausführen</label></p>'+
  '<button type="submit" name="decision" value="approve">Freigeben</button> '+
  '<button type="submit" name="decision" value="deny" formnovalidate>Ablehnen</button>'+
  '</form></main></body></html>';
}
const base64=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes)))
 .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
async function githubIdentity(code,verifier,env){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{8,250}$/.test(code))
  deny('INVALID_UPSTREAM_CODE');
 const token=await fetch('https://github.com/login/oauth/access_token',{
  method:'POST',redirect:'error',headers:{accept:'application/json',
   'content-type':'application/json'},
  body:JSON.stringify({client_id:env.MID_AI_GITHUB_CLIENT_ID,
   client_secret:env.MID_AI_GITHUB_CLIENT_SECRET,
   code,code_verifier:verifier,
   redirect_uri:env.MID_AI_AUTH_ISSUER+'/callback'})
 });
 if(!token.ok)deny('UPSTREAM_EXCHANGE');
 const body=await token.json();
 if(typeof body?.access_token!=='string'||body.access_token.length<12)
  deny('UPSTREAM_TOKEN');
 const user=await fetch('https://api.github.com/user',{
  method:'GET',redirect:'error',headers:{accept:'application/vnd.github+json',
   authorization:'Bearer '+body.access_token,
   'user-agent':'MID-AI-Router-OAuth-Identity'}});
 if(!user.ok)deny('UPSTREAM_IDENTITY');
 const profile=await user.json();
 if(!Number.isSafeInteger(profile?.id)||profile.id<1||
    String(profile.id)!==env.MID_AI_ALLOWED_GITHUB_USER_ID)
  deny('OPERATOR_NOT_ALLOWED');
 // Discard GitHub token. Save only opaque numeric identity in OAuth props.
 return 'github:'+String(profile.id);
}
export default class MidAiAuthServer extends WorkerEntrypoint{
 async fetch(request){
  try{
   configured(this.env);
   const server=service(this.env),path=new URL(request.url).pathname;
   const oauth=server.getOAuthApi(this.env);
   if(path==='/authorize'&&request.method==='GET'){
    const original=await oauth.parseAuthRequest(request);
    const info=await oauth.describeConsent(original);
    const consent=await oauth.beginConsent(original);
    consent.headers.set('content-type','text/html; charset=utf-8');
    consent.headers.set('cache-control','no-store');
    return new Response(consentPage(info?.client?.clientName||original.clientId,
     consent.handle),{headers:consent.headers});
   }
   if(path==='/authorize'&&request.method==='POST'){
    const form=await request.formData();
    const handle=String(form.get('handle')||'');
    if(form.get('decision')!=='approve'){
     const rejected=await oauth.denyConsent(request,handle);
     return new Response(null,{status:302,headers:rejected.headers});
    }
    const selected=[...new Set(form.getAll('scope').map(String))];
    if(!selected.includes('mid-ai:read')||
       selected.some(s=>s!=='mid-ai:read'&&s!=='mid-ai:infer-public'))
     deny('INVALID_SCOPES');
    const approved=await oauth.approveConsent(request,handle,{scope:selected});
    const verifier=base64(crypto.getRandomValues(new Uint8Array(32)));
    const upstream=await oauth.beginUpstream(approved.request,{
     data:{verifier,selected},headers:approved.headers
    });
    const codeChallenge=base64(await crypto.subtle.digest('SHA-256',
     new TextEncoder().encode(verifier)));
    const url=new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id',this.env.MID_AI_GITHUB_CLIENT_ID);
    url.searchParams.set('redirect_uri',this.env.MID_AI_AUTH_ISSUER+'/callback');
    url.searchParams.set('scope','read:user');
    url.searchParams.set('state',upstream.state);
    url.searchParams.set('code_challenge',codeChallenge);
    url.searchParams.set('code_challenge_method','S256');
    url.searchParams.set('allow_signup','false');
    upstream.headers.set('location',url.href);
    return new Response(null,{status:302,headers:upstream.headers});
   }
   if(path==='/callback'&&request.method==='GET'){
    const resumed=await oauth.finishUpstream(request);
    if(new URL(request.url).searchParams.has('error'))
     deny('GITHUB_CONSENT_DENIED');
    if(typeof resumed.data?.verifier!=='string'||
       !Array.isArray(resumed.data?.selected)||
       !resumed.data.selected.includes('mid-ai:read'))
     deny('MISSING_UPSTREAM_BINDING');
    const userId=await githubIdentity(
      new URL(request.url).searchParams.get('code'),resumed.data.verifier,this.env);
    const complete=await oauth.completeAuthorization({
     request:resumed.request,userId,metadata:{},
     scope:resumed.data.selected,props:{userId}
    });
    resumed.headers.set('location',complete.redirectTo);
    return new Response(null,{status:302,headers:resumed.headers});
   }
   return server.fetch(request,this.env,this.ctx);
  }catch{
   return new Response('Authorization unavailable',{status:403,headers:{
    'cache-control':'no-store','content-security-policy':"default-src 'none'",
    'x-content-type-options':'nosniff'}});
  }
 }
 validateToken(resource,token){
  configured(this.env);
  return service(this.env).validateToken(resource,token,this.env);
 }
}
