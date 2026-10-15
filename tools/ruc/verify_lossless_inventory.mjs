/** Independent full Python -> actual JS decoder proof; no network or publisher. */
import {readFile,realpath,open} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';

const source=await realpath(process.argv[2]),proof=await realpath(process.argv[3]);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
async function file(root,key){
 if(typeof key!=='string'||key.includes('\\')||isAbsolute(key)||key.split('/').some(x=>!x||x==='.'||x==='..'))throw Error('Unsafe proof key');
 const path=await realpath(resolve(root,key)),rel=relative(root,path);
 if(isAbsolute(rel)||rel==='..'||rel.startsWith('../'))throw Error('Proof path escapes root');
 return path;
}
const manifestBytes=await readFile(await file(proof,'source-manifest.json'));
if(sha(await readFile(await file(source,'latest.json')))!==sha(manifestBytes))throw Error('Source manifest changed');
const meta=JSON.parse(manifestBytes),plan=JSON.parse(await readFile(await file(proof,'plan.json')));
if(plan.schema!=='mid.ruc.offline-inventory-plan.v1'||plan.productionEnabled!==false||plan.run!==meta.run||plan.sourceManifestSha256!==sha(manifestBytes)||plan.maxDecodedPartBytes!==524288)throw Error('Invalid offline plan');
const rows=new Map();let sourceBytes=0;
for(const row of meta.pages.objects){
 if(rows.has(row.key)||!Number.isSafeInteger(row.bytes)||row.bytes<=0||!/^runs\//.test(row.key))throw Error('Invalid source row');
 const hash=createHash('sha256');let bytes=0;
 for await(const block of createReadStream(await file(source,row.key))){bytes+=block.length;hash.update(block);}
 if(bytes!==row.bytes||hash.digest('hex')!==row.sha256)throw Error('Source inventory hash mismatch: '+row.key);
 rows.set(row.key,row);sourceBytes+=bytes;
}
if(sourceBytes!==meta.pages.publishedBytes)throw Error('Source total mismatch');
let count=0,converted=0;const seen=new Set(),times=[];
for(const entry of plan.entries){
 const row=rows.get(entry.rawKey),record=entry.recordBytes;
 if(seen.has(entry.rawKey)||!row||row.bytes!==entry.rawBytes||row.sha256!==entry.rawSha256||!Number.isSafeInteger(record)||record<=0||record%2||record>524288||!entry.parts.length)throw Error('Invalid plan entry');
 seen.add(entry.rawKey);let offset=0;const rebuilt=createHash('sha256');
 const handle=await open(await file(source,entry.rawKey));
 try{
  for(const part of entry.parts){
   const size=part.manifest.decodedBytes;
   if(part.offset!==offset||!Number.isSafeInteger(size)||size<=0||size>524288||size%record||offset+size>row.bytes||part.manifest.codec!=='byteplanes-gzip'||part.key!=='wire/'+part.manifest.encodedSha256+'.bin')throw Error('Part geometry/identity mismatch');
   const wire=new Uint8Array(await readFile(await file(proof,part.key)));
   const start=performance.now(),decoded=await decodeRucLosslessCandidate(part.manifest,wire);times.push(performance.now()-start);
   const raw=Buffer.alloc(size);let done=0;
   while(done<size){const {bytesRead}=await handle.read(raw,done,size-done,offset+done);if(!bytesRead)throw Error('Truncated original');done+=bytesRead;}
   if(!raw.equals(decoded))throw Error('JS decoded bytes differ from original');
   rebuilt.update(decoded);offset+=size;count++;
  }
 }finally{await handle.close();}
 if(offset!==row.bytes||rebuilt.digest('hex')!==row.sha256)throw Error('Incomplete original reconstruction');
 converted+=offset;
}
times.sort((a,b)=>a-b);
console.log(JSON.stringify({schema:'mid.ruc.offline-inventory-js-proof.v1',run:meta.run,sourceManifestSha256:sha(manifestBytes),verifiedObjects:rows.size,sourceBytes,convertedObjects:seen.size,convertedOriginalBytes:converted,decodedParts:count,maxDecodedPartBytes:524288,node:process.version,nodeDecodeP95Ms:times[Math.ceil(times.length*.95)-1]??null,nodeWholeProcessMaxRssKiB:process.resourceUsage().maxRSS,environment:'Node host diagnostics; not provider CPU/RAM or physical device evidence',productionEnabled:false},null,2));
