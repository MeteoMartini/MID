import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
const rucDualVerified = new Map(), rucDualRejected = new Map();
const RUC_DUAL_SCHEMA = 'mid.ruc.dual-read.v1';
async function rucDualSha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')}
function rucDualEntry(page,index,rawKey){
 const envelope=page.losslessV1;
 if(envelope?.schema!==RUC_DUAL_SCHEMA||envelope.active!==true||!envelope.chunks||Array.isArray(envelope.chunks)||Object.keys(envelope.chunks).length!==1||!Object.hasOwn(envelope.chunks,String(index)))throw Error('descriptor-invalid');
 const entry=envelope.chunks[String(index)],m=entry?.manifest,root=page.prefix.split('/').slice(0,2).join('/');
 const records=page.records,remaining=records-index*page.chunkRecords;
 if(!entry||Object.keys(entry).sort().join(',')!=='key,manifest,rawKey'||!m||Object.keys(m).sort().join(',')!=='codec,decodedBytes,decodedSha256,encodedBytes,encodedSha256,schema'||m.schema!=='mid.ruc.lossless-candidate.v1'||!Number.isSafeInteger(m.encodedBytes)||m.encodedBytes<1||m.encodedBytes>2100000||!Number.isSafeInteger(m.decodedBytes)||m.decodedBytes<1||m.decodedBytes%2||![records,page.chunkRecords,page.recordBytes].every(x=>Number.isSafeInteger(x)&&x>0)||remaining<=0||entry.rawKey!==rawKey||m.codec!=='byteplanes-gzip'||m.decodedBytes!==Math.min(page.chunkRecords,remaining)*page.recordBytes||m.decodedBytes>524288||typeof m.encodedSha256!=='string'||typeof m.decodedSha256!=='string'||entry.key!==root+'/lossless-v1/'+m.encodedSha256+'.bin'||!/^[a-f0-9]{64}$/.test(m.encodedSha256)||!/^[a-f0-9]{64}$/.test(m.decodedSha256))throw Error('descriptor-invalid');
 return entry;
}
async function rucDualRaw(readRaw,entry){
 const bytes=await readRaw();
 if(entry&&bytes&&(bytes.length!==entry.manifest.decodedBytes||await rucDualSha(bytes)!==entry.manifest.decodedSha256))return null;
 return bytes;
}
/** Only explicit, same-run, SHA-bound pilot descriptors may select compressed data. */
export async function loadRucDualReadChunk(base,page,index,rawKey,readRaw,readWire,allowCodec=true){
 if(!allowCodec||!page.losslessV1||page.losslessV1.active===false||!Object.hasOwn(page.losslessV1.chunks||{},String(index)))return {bytes:await readRaw(),transport:'raw'};
 let entry;
 try{entry=rucDualEntry(page,index,rawKey)}catch{return {bytes:await readRaw(),transport:'raw-fallback',reason:'descriptor-invalid'}}
 const key=base.toString()+'|'+rawKey+'|'+JSON.stringify(entry.manifest);
 const cached=rucDualVerified.get(key);if(cached)return {bytes:cached,transport:'byteplanes-gzip'};
 let reason='codec-rejected';
 if(!rucDualRejected.has(key)||Date.now()-rucDualRejected.get(key)>30000){
  try{const wire=await readWire(entry.key,entry.manifest.encodedBytes),bytes=await decodeRucLosslessCandidate(entry.manifest,wire);rucDualVerified.set(key,bytes);if(rucDualVerified.size>2)rucDualVerified.delete(rucDualVerified.keys().next().value);rucDualRejected.delete(key);return {bytes,transport:'byteplanes-gzip'}}
  catch{rucDualRejected.set(key,Date.now());if(rucDualRejected.size>4)rucDualRejected.delete(rucDualRejected.keys().next().value)}
 }else reason='codec-retry-backoff';
 return {bytes:await rucDualRaw(readRaw,entry),transport:'raw-fallback',reason};
}
