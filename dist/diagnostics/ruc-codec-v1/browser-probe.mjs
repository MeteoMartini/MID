import {runRucTransportCanary} from './lossless_transport_canary.mjs';
import {CANARY_MANIFEST} from './lossless_canary_manifest.generated.mjs';
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
const button=document.querySelector('#run'),output=document.querySelector('#result');
button.addEventListener('click',async()=>{
 button.disabled=true;const cacheName='mid-ruc-codec-canary-'+crypto.randomUUID();
 try{
  const result=await runRucTransportCanary(new URL('./',import.meta.url));
  const cache=await caches.open(cacheName);const rows=[];
  for(const {key,manifest} of CANARY_MANIFEST.candidates){const url=new URL(key,import.meta.url),response=await fetch(url,{cache:'no-store'});await cache.put(url,response.clone());const stored=await cache.match(url);if(!stored)throw Error('Canary cache miss');await decodeRucLosslessCandidate(manifest,new Uint8Array(await stored.arrayBuffer()));rows.push({codec:manifest.codec,verified:true})}
  result.isolatedCacheRoundTrip=rows;window.__MID_RUC_CANARY_RESULT__=result;output.textContent=JSON.stringify(result,null,2);
 }catch(error){window.__MID_RUC_CANARY_ERROR__=String(error);output.textContent='Fehler: '+String(error)}finally{await caches.delete(cacheName);button.disabled=false}
});
