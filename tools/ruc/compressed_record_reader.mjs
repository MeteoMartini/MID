/** Prepared record reader. Not imported by the production Worker/publisher.
 * Explicit opt-in per call; no raw fallback exists in a replacement profile.
 * Transport must obey the supplied size limit and AbortSignal.
 */
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
const RUC_FULL_PAGE_SCHEMA='mid.ruc.compressed-pages.v1';
const RUC_FULL_HASH=/^[a-f0-9]{64}$/;
const RUC_FULL_MAX=524288,RUC_FULL_MAX_WIRE=524800;
function rucFullPositive(n){return Number.isSafeInteger(n)&&n>0;}
function rucFullSelectedPart(spec,index){
 const page=spec?.compressedPages;
 if(spec?.dtype!=='int16-le'||page?.schema!==RUC_FULL_PAGE_SCHEMA||Object.keys(page).sort().join(',')!=='parts,prefix,recordBytes,records,schema'||typeof page.prefix!=='string'||!rucFullPositive(page.records)||page.records>10000000||!rucFullPositive(page.recordBytes)||page.recordBytes>RUC_FULL_MAX||page.recordBytes%2||page.recordBytes!==spec.recordBytes||!/^runs\/[A-Za-z0-9_-]+$/.test(page.prefix)||!Array.isArray(page.parts)||!page.parts.length||page.parts.length>8192||!Number.isSafeInteger(index)||index<0||index>=page.records)throw Error('descriptor-invalid');
 let next=0,found;
 for(const part of page.parts){
  const m=part?.manifest;
  if(!part||Object.keys(part).sort().join(',')!=='firstRecord,key,manifest,recordCount'||part.firstRecord!==next||!rucFullPositive(part.recordCount)||part.recordCount>Math.floor(RUC_FULL_MAX/page.recordBytes)||!m||Object.keys(m).sort().join(',')!=='codec,decodedBytes,decodedSha256,encodedBytes,encodedSha256,schema'||m.schema!=='mid.ruc.lossless-candidate.v1'||m.codec!=='byteplanes-gzip'||m.decodedBytes!==part.recordCount*page.recordBytes||!rucFullPositive(m.encodedBytes)||m.encodedBytes>RUC_FULL_MAX_WIRE||!RUC_FULL_HASH.test(m.encodedSha256)||!RUC_FULL_HASH.test(m.decodedSha256)||part.key!==page.prefix+'/lossless-v2/'+m.encodedSha256+'.bin')throw Error('descriptor-invalid');
  next+=part.recordCount;if(next>page.records)throw Error('descriptor-invalid');
  if(index>=part.firstRecord&&index<next)found=part;
 }
 if(next!==page.records||!found)throw Error('descriptor-invalid');
 return {page,part:found};
}

export function createRucCompressedRecordReader({deadlineMs=3000}={}){
 if(!rucFullPositive(deadlineMs)||deadlineMs>3000)throw Error('deadline must be 1..3000 ms');
 const verified=new Map(),rejected=new Map(),pending=new Map(),queue=[];
 let active=0;
 function rememberFailure(key){rejected.set(key,Date.now());if(rejected.size>4)rejected.delete(rejected.keys().next().value);}
 function settle(item,result){if(!item.settled){item.settled=true;clearTimeout(item.timer);item.resolve(result);}}
 async function run(item){
  active++;item.started=true;
  try{
   const wire=await item.readWire(item.part.key,item.part.manifest.encodedBytes,item.controller.signal);
   if(item.expired)return;
   const bytes=await decodeRucLosslessCandidate(item.part.manifest,wire);
   if(item.expired)return;
   verified.delete(item.key);verified.set(item.key,bytes);if(verified.size>2)verified.delete(verified.keys().next().value);
   rejected.delete(item.key);settle(item,{bytes,transport:'byteplanes-gzip'});
  }catch{
   rememberFailure(item.key);settle(item,{bytes:null,reason:item.expired?'deadline':'codec-rejected'});
  }finally{
   active--;clearTimeout(item.timer);if(pending.get(item.key)===item)pending.delete(item.key);drain();
  }
 }
 function drain(){while(active<2&&queue.length){const item=queue.shift();if(!item.expired)void run(item);}}
 function load(base,part,readWire){
  const m=part.manifest;
  const key=[base,part.key,m.schema,m.codec,m.decodedBytes,m.encodedBytes,m.decodedSha256,m.encodedSha256].join('|');
  if(verified.has(key)){const bytes=verified.get(key);verified.delete(key);verified.set(key,bytes);return Promise.resolve({bytes,transport:'byteplanes-gzip'});}
  const old=pending.get(key);if(old)return old.promise;
  if(rejected.has(key)&&Date.now()-rejected.get(key)<30000)return Promise.resolve({bytes:null,reason:'codec-retry-backoff'});
  if(active>=2&&queue.length>=32)return Promise.resolve({bytes:null,reason:'queue-full'});
  const item={key,part,readWire,controller:new AbortController(),started:false,expired:false,settled:false};
  item.promise=new Promise(resolve=>item.resolve=resolve);
  item.timer=setTimeout(()=>{
   item.expired=true;item.controller.abort();
   if(!item.started){const i=queue.indexOf(item);if(i>=0)queue.splice(i,1);if(pending.get(key)===item)pending.delete(key);}
   else rememberFailure(key);
   settle(item,{bytes:null,reason:item.started?'deadline':'queue-deadline'});
   // An uncooperative transport keeps its active slot until it finishes: do
   // not start unlimited background I/O after caller timeouts.
  },deadlineMs);
  pending.set(key,item);queue.push(item);drain();return item.promise;
 }
 return {
  async readRecord(base,spec,index,readWire,{enabled=false}={}){
   if(!enabled)return {bytes:null,reason:'profile-disabled'};
   let page,part,url;
   try{({page,part}=rucFullSelectedPart(spec,index));url=new URL(base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||typeof readWire!=='function')throw Error();}
   catch{return {bytes:null,reason:'descriptor-invalid'};}
   const loaded=await load(url.toString(),part,readWire);
   if(!loaded.bytes)return loaded;
   const offset=(index-part.firstRecord)*page.recordBytes;
   return {bytes:loaded.bytes.slice(offset,offset+page.recordBytes),transport:loaded.transport};
  },
 };
}

// Future runtime integration must reuse this singleton per isolate.
export const preparedRucCompressedRecordReader=createRucCompressedRecordReader();
