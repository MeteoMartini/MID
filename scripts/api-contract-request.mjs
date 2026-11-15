export function isTransientApiStatus(status){
 const value=Number(status);
 return value===408||value===425||value===429||(value>=500&&value<=599);
}


/** The HTTP/JSON contract is a separate verdict from a failed transport.
 * Only disclose bounded error classes; never URLs, query strings or raw causes.
 * A classification never turns a required health check into a success.
 */
export function classifyApiTransportError(error){
 const pending=[error],seen=new Set();
 for(let index=0;index<8&&pending.length;index++){
  const current=pending.shift();
  if(!current||typeof current!=='object'||seen.has(current))continue;
  seen.add(current);
  const code=String(current.code||'').toUpperCase(),name=String(current.name||'');
  if(code==='ENOTFOUND'||code==='EAI_AGAIN')return 'DNS';
  if(code.startsWith('CERT_')||code.startsWith('ERR_TLS_')||code==='UNABLE_TO_VERIFY_LEAF_SIGNATURE'||code==='DEPTH_ZERO_SELF_SIGNED_CERT')return 'TLS';
  if(code==='ETIMEDOUT'||code.includes('TIMEOUT')||name==='TimeoutError')return 'TIMEOUT';
  if(name==='AbortError')return 'ABORTED';
  if(['ECONNRESET','ECONNREFUSED','EHOSTUNREACH','ENETUNREACH','EPIPE'].includes(code))return 'CONNECTIVITY';
  if(current.cause)pending.push(current.cause);
  if(Array.isArray(current.errors))pending.push(...current.errors.slice(0,3));
 }
 return 'UNCLASSIFIED_TRANSPORT';
}

function retryAfterMs(response){
 const raw=response?.headers?.get?.('retry-after');
 if(!raw)return 0;
 const seconds=Number(raw);
 if(Number.isFinite(seconds)&&seconds>=0)return Math.min(10000,seconds*1000);
 const epoch=Date.parse(raw);
 return Number.isFinite(epoch)?Math.min(10000,Math.max(0,epoch-Date.now())):0;
}

export async function fetchJsonWithRetry(url,{attempts=3,timeoutMs=12000,baseDelayMs=750,fetchImpl=globalThis.fetch,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms))}={}){
 if(typeof fetchImpl!=='function')throw new Error('fetch ist nicht verfügbar');
 const total=Math.max(1,Math.floor(attempts));
 let lastError;
 for(let attempt=1;attempt<=total;attempt++){
  try{
   const signal=typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function'?AbortSignal.timeout(timeoutMs):undefined;
   const response=await fetchImpl(url,{headers:{Accept:'application/json'},signal});
   const payload=await response.json().catch(()=>null);
   if(response.ok||!isTransientApiStatus(response.status)||attempt===total)return{response,payload,attemptsUsed:attempt};
   const delay=Math.max(retryAfterMs(response),baseDelayMs*2**(attempt-1));
   await sleep(delay);
  }catch(error){
   lastError=error;
   if(attempt===total)throw error;
   await sleep(baseDelayMs*2**(attempt-1));
  }
 }
 throw lastError??new Error('API-Abruf fehlgeschlagen');
}
