/** Offline candidate/rollback validation using prepared reader and actual
 * meteorological record decoder. Never deploys; not provider CPU/RAM evidence. */
import assert from 'node:assert/strict';
import {readFile,realpath,open} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {createRucCompressedRecordReader} from './compressed_record_reader.mjs';
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
const source=await realpath(process.argv[2]),candidate=await realpath(process.argv[3]);
const sha=b=>createHash('sha256').update(b).digest('hex');
async function file(root,key){
 if(typeof key!=='string'||key.includes('\\')||isAbsolute(key)||key.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('unsafe candidate path');
 const path=await realpath(resolve(root,key)),rel=relative(root,path);
 if(isAbsolute(rel)||rel==='..'||rel.startsWith('../'))throw Error('candidate path escape');return path;
}
const oldBytes=await readFile(await file(source,'latest.json')),newBytes=await readFile(await file(candidate,'latest.json'));
const old=JSON.parse(oldBytes),next=JSON.parse(newBytes);
assert.equal(old.storageProfile,'pages-free-v1');assert.equal(next.schema,old.schema);
assert.equal(next.storageProfile,'pages-lossless-candidate-v1');assert.equal(next.migration.productionEnabled,false);
assert.equal(next.migration.sourceManifestSha256,sha(oldBytes));
async function inventory(root,meta){
 const seen=new Set();let total=0;
 for(const row of meta.pages.objects){
  assert.ok(!seen.has(row.key)&&row.key.startsWith('runs/')&&Number.isSafeInteger(row.bytes)&&row.bytes>0);seen.add(row.key);
  const hash=createHash('sha256');let count=0;
  for await(const block of createReadStream(await file(root,row.key))){count+=block.length;hash.update(block);}
  assert.equal(count,row.bytes);assert.equal(hash.digest('hex'),row.sha256);total+=count;
 }
 assert.equal(total,meta.pages.publishedBytes);return {objects:seen.size,bytes:total};
}
const oldInventory=await inventory(source,old),newInventory=await inventory(candidate,next);
assert.equal(next.pages.budgetBytes,900000000);assert.ok(newInventory.bytes+newBytes.length<next.pages.budgetBytes);
const specs=m=>[['deterministic',m.deterministic],['epsSummary',m.epsSummary],...Object.entries(m.rapid??{}).map(([k,v])=>['rapid/'+k,v])];
const targets=new Map(specs(next));
const scientific=m=>{const result=structuredClone(m);delete result.pages;delete result.compressedPages;return result;};
for(const [key,value] of Object.entries(old))if(!['objects','pages','storageProfile','deterministic','epsSummary','rapid','migration'].includes(key))assert.deepEqual(next[key],value,'Root scientific metadata '+key);
const worker=await readFile(new URL('../../worker-src/00-core-observations.js',import.meta.url),'utf8');
const decoder=worker.match(/^function dwdRucDecodeI16Record[^\n]+/m)?.[0];assert.ok(decoder);
const context=vm.createContext({DataView});vm.runInContext(decoder+'\nthis.decode=dwdRucDecodeI16Record;',context);
const reader=createRucCompressedRecordReader();let comparisons=0,wireReads=0,products=0,fullDecodedParts=0;
const wire=async(key,limit,signal)=>{
 if(signal.aborted)throw Error('aborted');const value=new Uint8Array(await readFile(await file(candidate,key)));assert.ok(value.length<=limit);wireReads++;return value;
};
for(const [name,before] of specs(old)){
 const after=targets.get(name);assert.deepEqual(scientific(after),scientific(before),'Product metadata '+name);
 if(before.dtype!=='int16-le'){assert.deepEqual(after,before);continue;}
 assert.equal(after.pages,undefined);products++;
 for(const part of after.compressedPages.parts){
  const page=before.pages,chunk=Math.floor(part.firstRecord/page.chunkRecords),key=page.chunkKeys?.[chunk]??`${page.prefix}/${String(chunk).padStart(4,'0')}.bin`;
  assert.ok((part.firstRecord%page.chunkRecords)+part.recordCount<=page.chunkRecords,'Prepared builder parts respect original physical chunk boundaries');
  const decodedPart=await decodeRucLosslessCandidate(part.manifest,new Uint8Array(await readFile(await file(candidate,part.key))));
  const originalPart=Buffer.alloc(part.recordCount*page.recordBytes),original=await open(await file(source,key));let read=0;
  try{while(read<originalPart.length){const r=await original.read(originalPart,read,originalPart.length-read,(part.firstRecord%page.chunkRecords)*page.recordBytes+read);assert.ok(r.bytesRead);read+=r.bytesRead;}}finally{await original.close();}
  assert.deepEqual(Buffer.from(decodedPart),originalPart,'Every byte of every candidate part '+name+'/'+part.firstRecord);fullDecodedParts++;
  const picks=[...new Set([part.firstRecord,part.firstRecord+Math.floor(part.recordCount/2),part.firstRecord+part.recordCount-1])];
  for(const index of picks){
   const decoded=await reader.readRecord('https://offline-candidate.test/ruc/',after,index,wire,{enabled:true});assert.ok(decoded.bytes,decoded.reason);
   const page=before.pages,chunk=Math.floor(index/page.chunkRecords),key=page.chunkKeys?.[chunk]??`${page.prefix}/${String(chunk).padStart(4,'0')}.bin`;
   const handle=await open(await file(source,key));const raw=Buffer.alloc(page.recordBytes);let done=0;
   try{while(done<raw.length){const result=await handle.read(raw,done,raw.length-done,(index%page.chunkRecords)*page.recordBytes+done);assert.ok(result.bytesRead);done+=result.bytesRead;}}finally{await handle.close();}
   assert.deepEqual(Buffer.from(decoded.bytes),raw,'Record '+name+'/'+index);
   const reference=context.decode(new Uint8Array(raw),before,old.times??[]),actual=context.decode(decoded.bytes,after,next.times??[]);
   assert.equal(JSON.stringify(actual),JSON.stringify(reference),'Actual meteorological record decoder '+name+'/'+index);comparisons++;
  }
 }
}
console.log(JSON.stringify({schema:'mid.ruc.migration-record-proof.v1',run:old.run,candidateProfile:next.storageProfile,sourceManifestSha256:sha(oldBytes),candidateManifestSha256:sha(newBytes),sourceObjectsVerified:oldInventory.objects,candidateObjectsVerified:newInventory.objects,physicalCandidateBytes:newInventory.bytes+newBytes.length,products,fullDecodedParts,recordComparisons:comparisons,wireReads,originalRollbackSnapshotIntact:true,productionEnabled:false,environment:'Node host; full byte equality plus actual record decoder parity, not deployed endpoint/CPU/RAM/physical-device acceptance'},null,2));
