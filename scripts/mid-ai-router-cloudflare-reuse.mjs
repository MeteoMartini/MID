/* Read-only existing MID Cloudflare account proof. No writes or inference. */
const ACCOUNT=/^[a-f0-9]{32}$/;
const error=reason=>{const e=new Error(reason);e.reason=reason;throw e;};
async function getJson(fetchImpl,url,token){
 let response;
 try{response=await fetchImpl(url,{method:'GET',redirect:'error',cache:'no-store',
  credentials:'omit',headers:{authorization:'Bearer '+token,accept:'application/json'},
  signal:AbortSignal.timeout(8000)})}
 catch{error('CLOUDFLARE_NETWORK_UNAVAILABLE')}
 if(response?.ok!==true||response.redirected===true)error('CLOUDFLARE_READ_DENIED');
 const size=response.headers?.get?.('content-length');
 if(size!==null&&size!==undefined&&(!/^[0-9]+$/.test(size)||Number(size)>262144))
  error('CLOUDFLARE_EXCESSIVE_RESPONSE');
 if(!response.body?.getReader)error('CLOUDFLARE_STREAM_REQUIRED');
 const reader=response.body.getReader();let chunks=[],total=0;
 try{
  while(true){
   const x=await reader.read();
   if(x.done)break;
   if(!(x.value instanceof Uint8Array))error('CLOUDFLARE_CHUNK_INVALID');
   total+=x.value.byteLength;
   if(total>262144)error('CLOUDFLARE_EXCESSIVE_RESPONSE');
   chunks.push(x.value);
  }
 }finally{try{await reader.cancel()}catch{}reader.releaseLock()}
 const bytes=new Uint8Array(total);let offset=0;
 for(const x of chunks){bytes.set(x,offset);offset+=x.length}
 let json;try{json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}
 catch{error('CLOUDFLARE_INVALID_JSON')}
 if(json?.success!==true||!Array.isArray(json.result))
  error('CLOUDFLARE_SCHEMA_INVALID');
 return json.result;
}
export async function inspectMidCloudflareReuse({
 accountId,token,fetchImpl=globalThis.fetch,now=()=>Date.now()
}={}){
 if(!ACCOUNT.test(accountId||'')||typeof token!=='string'||token.length<20||
    token.length>256||/\s/.test(token)||typeof fetchImpl!=='function'||
    !Number.isSafeInteger(now())||now()<0)error('PROTECTED_CLOUDFLARE_CONTEXT_REQUIRED');
 const base='https://api.cloudflare.com/client/v4/accounts/'+accountId+'/workers';
 const scripts=await getJson(fetchImpl,base+'/scripts',token);
 if(scripts.length>1000||!scripts.some(x=>x?.id==='mid-data-proxy'))
  error('EXISTING_MID_WORKER_NOT_CONFIRMED');
 const namespaces=await getJson(fetchImpl,base+'/durable_objects/namespaces',token);
 if(namespaces.length>1000||namespaces.some(x=>typeof x?.name!=='string'))
  error('DURABLE_OBJECT_READBACK_INVALID');
 return Object.freeze({
  status:'EXISTING_MID_CLOUDFLARE_ACCOUNT_READBACK_OK',
  existingWeatherWorkerConfirmed:true,
  isolatedMcpWorkerObserved:scripts.some(x=>x?.id==='mid-ai-router-mcp'),
  isolatedAuthWorkerObserved:scripts.some(x=>x?.id==='mid-ai-router-auth'),
  sqliteRouterNamespaceObserved:namespaces.some(x=>x.name==='MidAiLedger'&&
    x.script==='mid-ai-router-mcp'&&x.use_sqlite===true),
  cloudflareReadOnlyCalls:2,deployments:0,createdResources:0,modelCalls:0,
  extraCashVerified:false,freePlanVerified:false,
  newWorkerDeploymentPermissionVerified:false,oauthVerified:false,
  independentSignerVerified:false,dispatchAuthorized:false
 });
}
