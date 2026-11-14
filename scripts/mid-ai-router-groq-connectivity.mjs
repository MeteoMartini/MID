/**
 * MID AI Router: read-only Groq Free connectivity preflight.
 * This code NEVER invokes model inference or authenticates account billing.
 */
const SHA=/^[a-f0-9]{40}$/;
const KEY=/^gsk_[A-Za-z0-9_-]{12,230}$/;
const URL='https://api.groq.com/openai/v1/models';
const TARGETS=Object.freeze(['openai/gpt-oss-20b','openai/gpt-oss-120b']);
const fail=reason=>{const e=new Error('MID Groq connectivity blocked');
  e.name='MidGroqConnectivityBlocked';e.reason=reason;throw e};
async function boundedJson(response){
 if(response?.status===401)fail('GROQ_KEY_UNAUTHORIZED');
 if(response?.status===403)fail('GROQ_MODEL_ACCESS_DENIED');
 if(response?.status===429)fail('GROQ_CATALOG_RATE_LIMITED');
 if(!response?.ok)fail('GROQ_CATALOG_HTTP_FAILED');
 const length=response.headers?.get?.('content-length');
 if(length!==null&&length!==undefined&&length!==''){
  const n=Number(length);
  if(!Number.isSafeInteger(n)||n<0||n>131072)fail('GROQ_CATALOG_TOO_LARGE');
 }
 if(!response.body?.getReader)fail('GROQ_CATALOG_STREAM_REQUIRED');
 const reader=response.body.getReader(),dec=new TextDecoder('utf-8',{fatal:true});
 let buf='',total=0;
 try{
  for(;;){
   const part=await reader.read();if(part.done)break;
   if(!(part.value instanceof Uint8Array))fail('GROQ_CATALOG_BAD_CHUNK');
   total+=part.value.byteLength;
   if(total>131072)fail('GROQ_CATALOG_TOO_LARGE');
   buf+=dec.decode(part.value,{stream:true});
  }buf+=dec.decode();
 }catch(e){
  try{await reader.cancel()}catch{}
  if(e?.name==='MidGroqConnectivityBlocked')throw e;
  fail('GROQ_CATALOG_BODY_FAILED');
 }finally{reader.releaseLock()}
 try{return JSON.parse(buf)}catch{fail('GROQ_CATALOG_INVALID_JSON')}
}
function verifySource(s,expectedSha){
 if(s?.mainSha!==expectedSha||s?.stableSha!==expectedSha||
    !/^0\.\d+\.\d+\.\d+$/.test(s?.version||''))fail('MID_SOURCE_NOT_STABLE');
}
export async function checkMidGroqModelConnectivity({
 apiKey,expectedStableSha,fetchImpl,sourceReadback
}={}){
 if(!SHA.test(expectedStableSha||'')||typeof fetchImpl!=='function'||
    typeof sourceReadback!=='function')fail('PREFLIGHT_RUNTIME_NOT_CONFIGURED');
 if(!KEY.test(apiKey||''))fail('GROQ_KEY_MISSING_OR_INVALID_FORMAT');
 let first;try{first=await sourceReadback()}catch{fail('MID_SOURCE_UNAVAILABLE')}
 verifySource(first,expectedStableSha);
 let response;
 try{
  response=await fetchImpl(URL,{method:'GET',redirect:'error',
   cache:'no-store',credentials:'omit',
   headers:{accept:'application/json',authorization:'Bearer '+apiKey},
   signal:AbortSignal.timeout(8000)});
 }catch{fail('GROQ_CATALOG_CONNECTION_FAILED')}
 const catalog=await boundedJson(response);
 if(!Array.isArray(catalog?.data)||catalog.data.length>1000)
   fail('GROQ_CATALOG_INVALID_SCHEMA');
 const models=TARGETS.map(id=>{
  // Groq's Models API lists available active models; its documented Model
  // schema does not require an 'active' field on every returned item.
  // An explicit false, malformed object or duplicate ID still fails closed.
  const hits=catalog.data.filter(x=>x?.id===id);
  if(hits.length>1)fail('GROQ_CATALOG_DUPLICATE_MODEL');
  const item=hits[0];
  const listed=!!item;
  const active=listed&&item.object==='model'&&
    (item.active===true||!Object.hasOwn(item,'active'));
  return Object.freeze({id,listed,active});
 });
 let last;try{last=await sourceReadback()}catch{fail('MID_SOURCE_UNAVAILABLE')}
 verifySource(last,expectedStableSha);
 if(last.version!==first.version)fail('MID_SOURCE_VERSION_CHANGED');
 return Object.freeze({
  stage:'CATALOG_READ_ONLY',status:models.every(x=>x.active)?
   'MODEL_CATALOG_CONFIRMED':'MODEL_CATALOG_PARTIAL',
  provider:'groq',stableSha:expectedStableSha,version:first.version,
  models:Object.freeze(models),apiKeyAcceptedForCatalog:true,
  freeTierVerified:false,zdrVerifiedByApi:false,zeroCashVerified:false,
  providerInferenceCalls:0,additionalCashAuthorizedUsd:0,
  credentialExposed:false
 });
}
