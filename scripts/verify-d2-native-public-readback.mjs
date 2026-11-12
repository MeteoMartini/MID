/**
 * Post-promotion acceptance of the immutable public ICON-D2 site.
 * Run: node --experimental-strip-types scripts/verify-d2-native-public-readback.mjs
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {
 D2_FULL_DOMAIN_KINDS, validateD2FullDomainField, validateD2FullDomainIndex,
} from '../src/nativeD2FullDomain.ts';

const origin='https://www.midwx.app';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

async function read(path, maxBytes){
 const response=await fetch(new URL(path,origin),{
  cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30_000),
 });
 assert.equal(response.status,200,path);
 const reader=response.body.getReader(),chunks=[];
 let total=0;
 try{
  while(true){
   const {done,value}=await reader.read();
   if(done)break;
   total+=value.byteLength;
   assert.ok(total<=maxBytes,`Response too large: ${path}`);
   chunks.push(value);
  }
 }finally{await reader.cancel()}
 return Buffer.concat(chunks,total);
}

function verifyBytes(bytes,expected,label){
 assert.equal(bytes.length,expected.bytes,`${label}: byte length`);
 assert.equal(sha(bytes),expected.sha256,`${label}: SHA256`);
}

const manifest=JSON.parse(await read('/ruc/latest.json',8_000_000));
const pointer=manifest.modelFieldsNative;
assert.equal(pointer?.productionApproved,true,'Public pointer missing or not approved');
assert.equal(pointer.nativePoints,542040);
assert.equal(pointer.frameCount,72);
assert.match(pointer.key,/^runs\/[a-zA-Z0-9_-]+\/model-fields-native\/index\.json$/);
assert.ok(Array.isArray(manifest.pages?.objects),'Pages physical inventory missing');
const folder=pointer.key.slice(0,-'index.json'.length);
const rows=manifest.pages.objects.filter(row=>row.key.startsWith(folder));
const inventory=new Map(rows.map(row=>[row.key,row]));
assert.equal(rows.length,73);
assert.equal(inventory.size,73,'Duplicate physical native object');

const indexBytes=await read('/ruc/'+pointer.key,3_000_000);
verifyBytes(indexBytes,{bytes:pointer.indexBytes,sha256:pointer.indexSha256},pointer.key);
verifyBytes(indexBytes,inventory.get(pointer.key),pointer.key);
const index=validateD2FullDomainIndex(JSON.parse(indexBytes));
assert.equal(index.sourceInventorySha256,pointer.sourceInventorySha256);
assert.equal(index.run,pointer.run);

let checked=0;
for(const kind of D2_FULL_DOMAIN_KINDS){
 for(const frame of index.products[kind].frames){
  const key=folder+frame.file;
  const bytes=await read('/ruc/'+key,frame.bytes);
  verifyBytes(bytes,frame,key);
  verifyBytes(bytes,inventory.get(key),key);
  const decoded=gunzipSync(bytes,{maxOutputLength:frame.decodedBytes});
  assert.equal(decoded.length,frame.decodedBytes,key);
  validateD2FullDomainField(JSON.parse(decoded),index,frame,kind);
  checked++;
 }
}
assert.equal(checked,72);
const current=JSON.parse(await read('/ruc/latest.json',8_000_000)).modelFieldsNative;
assert.equal(current?.indexSha256,pointer.indexSha256,'Public pointer moved during acceptance');
console.log(JSON.stringify({run:index.run,nativePoints:pointer.nativePoints,frames:checked,indexSha256:pointer.indexSha256}));
