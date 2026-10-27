/** Re-admit unchanged prepared bytes with the shipped JS codec and record decoder. */
import assert from 'node:assert/strict';
import {readFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {decodeRucLosslessCandidate} from './lossless_candidate_decoder.mjs';
import {createRucCompressedRecordReader} from './compressed_record_reader.mjs';
const root=await realpath(process.argv[2]);
async function file(key){
 assert.ok(typeof key==='string'&&key.startsWith('runs/')&&!key.includes('\\')&&!key.split('/').some(p=>!p||p==='.'||p==='..'));
 const path=await realpath(resolve(root,key)),rel=relative(root,path);assert.ok(!isAbsolute(rel)&&rel!=='..'&&!rel.startsWith('../'));return path;
}
const bytes=await readFile(resolve(root,'latest.json')),meta=JSON.parse(bytes),receipt=JSON.parse(await readFile(resolve(root,'prepared-snapshot-proof.json')));
assert.equal(createHash('sha256').update(bytes).digest('hex'),receipt.snapshot.manifestSha256);
assert.equal(meta.storageProfile,'pages-lossless-v1');assert.equal(meta.migration.productionEnabled,true);
const source=await readFile(new URL('../../worker-src/00-core-observations.js',import.meta.url),'utf8');
const decoder=source.match(/^function dwdRucDecodeI16Record[^\n]+/m)?.[0];assert.ok(decoder);
const context=vm.createContext({DataView});vm.runInContext(decoder+'\nthis.decode=dwdRucDecodeI16Record;',context);
const reader=createRucCompressedRecordReader();let parts=0,records=0;
const wire=async(key,limit,signal)=>{assert.equal(signal.aborted,false);const value=new Uint8Array(await readFile(await file(key)));assert.ok(value.byteLength<=limit);return value;};
for(const spec of [meta.deterministic,meta.epsSummary,...Object.values(meta.rapid??{})]){
 assert.equal(spec.dtype,'int16-le');let cursor=0;
 for(const part of spec.compressedPages.parts){
  assert.equal(part.firstRecord,cursor);
  await decodeRucLosslessCandidate(part.manifest,new Uint8Array(await readFile(await file(part.key))));
  for(const index of new Set([part.firstRecord,part.firstRecord+Math.floor(part.recordCount/2),part.firstRecord+part.recordCount-1])){
   const result=await reader.readRecord('https://offline-prepared.test/ruc/',spec,index,wire,{enabled:true});
   assert.ok(result.bytes,result.reason);assert.equal(result.bytes.byteLength,spec.recordBytes);
   assert.ok(context.decode(result.bytes,spec,meta.times??[]));records++;
  }
  cursor+=part.recordCount;parts++;
 }
 assert.equal(cursor,spec.compressedPages.records);
}
assert.equal(parts,receipt.snapshot.decodedParts);assert.equal(parts,meta.migration.proof.fullyDecodedParts);
console.log(JSON.stringify({schema:'mid.ruc.prepared-js-proof.v1',manifestSha256:receipt.snapshot.manifestSha256,parts,recordDecoderChecks:records,recalculated:false}));
