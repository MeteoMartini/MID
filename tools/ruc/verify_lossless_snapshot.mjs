/** Read-only validation of a materialized RUC snapshot. No network or publisher writes.
 * Node timings/RSS are host diagnostics, never Cloudflare CPU or browser/iOS evidence.
 * Usage: node tools/ruc/verify_lossless_snapshot.mjs SNAPSHOT_ROOT [ITERATIONS]
 */
import {readFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
import {loadRucDualReadChunk} from './lossless_dual_read.mjs';

const root=await realpath(resolve(process.argv[2]||'.'));
const iterations=Number(process.argv[3]??20);
if(!Number.isSafeInteger(iterations)||iterations<1||iterations>100)throw Error('iterations must be 1..100');
const read=async key=>{
 if(typeof key!=='string'||isAbsolute(key)||key.split(/[\\/]/).includes('..'))throw Error('unsafe snapshot path');
 const path=await realpath(resolve(root,key)),rel=relative(root,path);
 if(rel==='..'||rel.startsWith('../')||isAbsolute(rel))throw Error('snapshot path escapes root');
 return new Uint8Array(await readFile(path));
};
const metadata=JSON.parse(new TextDecoder().decode(await read('latest.json')));
const page=metadata.deterministic?.pages,envelope=page?.losslessV1;
if(envelope?.schema!=='mid.ruc.dual-read.v1'||envelope.active!==true||Object.keys(envelope.chunks||{}).length!==1)throw Error('active bounded pilot required');
const rows=[];
for(const [indexText,entry] of Object.entries(envelope.chunks)){
 const index=Number(indexText),raw=await read(entry.rawKey),wire=await read(entry.key);
 const object=metadata.pages?.objects?.find(row=>row.key===entry.rawKey);
 const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
 if(!object||raw.length!==object.bytes||sha(raw)!==object.sha256)throw Error('legacy raw object SHA mismatch');
 const wall=[],cpu=[];
 for(let i=0;i<iterations;i++){
  const before=process.cpuUsage(),start=performance.now();
  const decoded=await decodeRucLosslessCandidate(entry.manifest,wire);
  wall.push(performance.now()-start);const used=process.cpuUsage(before);cpu.push((used.user+used.system)/1000);
  if(decoded.length!==raw.length||decoded.some((v,j)=>v!==raw[j]))throw Error('decoded bytes differ from legacy');
 }
 let rawCalls=0,wireCalls=0;
 const base=new URL('https://snapshot.invalid/ruc/');
 const first=await loadRucDualReadChunk(base,page,index,entry.rawKey,async()=>{rawCalls++;return raw},async()=>{wireCalls++;return wire});
 const offline=await loadRucDualReadChunk(base,page,index,entry.rawKey,async()=>{throw Error('offline raw')},async()=>{throw Error('offline codec')});
 if(first.transport!=='byteplanes-gzip'||offline.transport!=='byteplanes-gzip'||sha(offline.bytes)!==sha(raw)||wireCalls!==1||rawCalls!==0)throw Error('warm decoded cache mismatch');
 const cold=await loadRucDualReadChunk(new URL('https://cold.invalid/ruc/'),page,index,entry.rawKey,async()=>raw,async()=>{throw Error('codec unavailable')});
 if(cold.transport!=='raw-fallback'||sha(cold.bytes)!==sha(raw))throw Error('cold raw fallback mismatch');
 const disabled=await loadRucDualReadChunk(base,page,index,entry.rawKey,async()=>raw,async()=>{throw Error('disabled codec requested')},false);
 if(disabled.transport!=='raw'||sha(disabled.bytes)!==sha(raw))throw Error('kill-switch mismatch');
 const p95=values=>values.sort((a,b)=>a-b)[Math.ceil(values.length*.95)-1];
 rows.push({index,rawBytes:raw.length,encodedBytes:wire.length,rawSha256:sha(raw),iterations,nodeWallP95Ms:p95(wall),nodeProcessCpuP95Ms:p95(cpu),warmOfflineCache:true,coldRawFallback:true,killSwitch:true,legacyRawUnchanged:true});
}
console.log(JSON.stringify({schema:'mid.ruc.snapshot-proof.v1',run:metadata.run??null,environment:'Node host; not Worker/browser/iOS performance evidence',node:process.version,nodeMaxRssKiB:process.resourceUsage().maxRSS,rawRetained:metadata.pages.losslessTransport?.rawRetained===true,rows},null,2));
