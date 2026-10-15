import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {loadRucDualReadChunk} from '../tools/ruc/lossless_dual_read.mjs';
const dir=mkdtempSync(join(tmpdir(),'mid-ruc-dual-'));
try{
 execFileSync('python3',['tools/ruc/test_lossless_dual_read.py',dir],{stdio:'inherit',timeout:30000});
 const meta=JSON.parse(readFileSync(join(dir,'latest.json'))),page=meta.deterministic.pages,entry=page.losslessV1.chunks['3'];
 const raw=new Uint8Array(readFileSync(join(dir,entry.rawKey))),wire=new Uint8Array(readFileSync(join(dir,entry.key)));
 let calls=0,rawCalls=0;
 const positive=()=>loadRucDualReadChunk(new URL('https://positive.test/ruc/'),page,3,entry.rawKey,async()=>{rawCalls++;return raw},async()=>{calls++;return wire});
 assert.deepEqual((await positive()).bytes,raw);assert.equal((await positive()).transport,'byteplanes-gzip');assert.equal(calls,1);assert.equal(rawCalls,0,'Verified decoded cache does not fetch raw');
 const disabled=await loadRucDualReadChunk(new URL('https://positive.test/ruc/'),page,3,entry.rawKey,async()=>raw,async()=>{throw Error('must not fetch')},false);assert.equal(disabled.transport,'raw');
 for(const failure of ['corrupt','404','both-bad']){
  const result=await loadRucDualReadChunk(new URL('https://'+failure+'.test/ruc/'),page,3,entry.rawKey,async()=>failure==='both-bad'?raw.subarray(1):raw,async()=>{if(failure==='404')throw Error('404');return wire.subarray(1)});
  assert.equal(result.transport,'raw-fallback');assert.ok(result.reason);assert.deepEqual(result.bytes,failure==='both-bad'?null:raw);
 }
 for(const patch of [{key:'runs/other/lossless-v1/'+entry.manifest.encodedSha256+'.bin'},{rawKey:'runs/other/raw.bin'},{manifest:{...entry.manifest,encodedBytes:999999999}},{manifest:{...entry.manifest,decodedBytes:524290}},{manifest:{...entry.manifest,codec:'unknown'}},{manifest:{...entry.manifest,extra:1}}]){
  const bad=structuredClone(page);Object.assign(bad.losslessV1.chunks['3'],patch);let fetched=false;
  const result=await loadRucDualReadChunk(new URL('https://invalid.test/ruc/'),bad,3,entry.rawKey,async()=>raw,async()=>{fetched=true;return wire});assert.equal(result.transport,'raw-fallback');assert.equal(result.reason,'descriptor-invalid');assert.equal(fetched,false,'Invalid descriptor must reject before network allocation');assert.deepEqual(result.bytes,raw);
 }
 const inactive=structuredClone(page);inactive.losslessV1.active=false;assert.equal((await loadRucDualReadChunk(new URL('https://inactive.test/'),inactive,3,entry.rawKey,async()=>raw,async()=>{throw Error('disabled')})).transport,'raw');
 let badCalls=0;const backoff=()=>loadRucDualReadChunk(new URL('https://backoff.test/'),page,3,entry.rawKey,async()=>raw,async()=>{badCalls++;throw Error('offline')});await backoff();assert.equal((await backoff()).reason,'codec-retry-backoff');assert.equal(badCalls,1,'Broken codec is not re-fetched on every favorite');
 let newOriginFetches=0;await loadRucDualReadChunk(new URL('https://other-origin.test/'),page,3,entry.rawKey,async()=>raw,async()=>{newOriginFetches++;return wire});assert.equal(newOriginFetches,1,'Decoded cache cannot cross origins');
 const wrongSha=structuredClone(page);wrongSha.losslessV1.chunks['3'].manifest.decodedSha256='0'.repeat(64);assert.equal((await loadRucDualReadChunk(new URL('https://wrong-sha.test/'),wrongSha,3,entry.rawKey,async()=>raw,async()=>wire)).bytes,null,'Both codec and fallback must agree with declared original SHA');
 const legacy=vm.createContext({Uint8Array,URL,dwdRucStaticObject:async()=>raw});vm.runInContext(readFileSync('scripts/fixtures/ruc-legacy-reader-0257.js','utf8'),legacy);legacy.spec=meta.deterministic;
 const old=await vm.runInContext("dwdRucStaticRecord(new URL('https://legacy.test/ruc/'),spec,769)",legacy);assert.deepEqual(Array.from(old),Array.from(raw.subarray(8,16)),'Unchanged .257 consumer ignores codec descriptor and reads same raw record');
 const current={...meta,run:new Date().toISOString(),generatedAt:new Date().toISOString(),storageProfile:'pages-free-v1',pointCount:1000,times:['2026-10-15T00:00','2026-10-15T01:00','2026-10-15T02:00','2026-10-15T03:00'],grid:{latMin:50,lonMin:7,dx:.1,dy:.1,nx:1,ny:1},lookup:{dtype:'uint32-le',pages:{chunkRecords:1,chunkCount:1,recordBytes:4,prefix:'runs/dual_read_test/lookup'}}};current.deterministic.fields=[{name:'temperature_2m',scale:.1,offset:0}];
 const source=readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
 const fetchFixture=async input=>{const url=new URL(input);if(url.pathname.endsWith('latest.json'))return Response.json(current);if(url.pathname.endsWith('/lookup/0000.bin'))return new Response(new Uint8Array([1,3,0,0]));return new Response(readFileSync(join(dir,url.pathname.replace(/^\/ruc\//,''))))};
 const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,ReadableStream,DecompressionStream,performance,fetch:fetchFixture});vm.runInContext(source,context,{timeout:5000});context.meta=current;
 const point=await vm.runInContext('dwdRucStaticPointPayload(50,7,{})',context);assert.equal(point.mid_ruc.transport,'byteplanes-gzip');assert.deepEqual(JSON.parse(JSON.stringify(point.hourly.temperature_2m)),[10,null,-2.5,0],'Actual Worker point adapter preserves temperature, Missing and zero');
 const fallback=await vm.runInContext("dwdRucStaticPointPayload(50,7,{MID_DWD_RUC_LOSSLESS_READ:'disabled'})",context);assert.equal(fallback.mid_ruc.transport,'raw');assert.deepEqual(JSON.parse(JSON.stringify(fallback.hourly)),JSON.parse(JSON.stringify(point.hourly)),'Rollback changes transport only, not meteorology');
 const health=await vm.runInContext("dwdRucDualReadHealth(new URL('https://midwx.app/ruc/'),meta,{})",context);assert.equal(health.verified,true);assert.equal(health.rawRetained,true);
 // Headers arrive immediately; the body stalls. The codec deadline must stay
 // armed through body consumption and let the verified raw fallback complete.
 let bodyAborted=false;
 const stalledFetch=async(_input,init)=>new Response(new ReadableStream({start(controller){init.signal.addEventListener('abort',()=>{bodyAborted=true;controller.error(init.signal.reason)},{once:true})}}));
 const stalled=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,ReadableStream,DecompressionStream,performance,fetch:stalledFetch,setTimeout:(callback,ms)=>setTimeout(callback,ms===3000?20:ms),clearTimeout});vm.runInContext(source,stalled,{timeout:5000});stalled.spec=meta.deterministic;stalled.raw=raw;
 const deadline=await vm.runInContext("loadRucDualReadChunk(new URL('https://stalled.test/ruc/'),dwdRucStaticPageInfo(spec),3,spec.pages.losslessV1.chunks['3'].rawKey,async()=>raw,(key,limit)=>dwdRucStaticCodecObject(new URL('https://stalled.test/ruc/'),key,limit))",stalled);
 assert.equal(bodyAborted,true,'Codec deadline aborts a stalled body after successful headers');assert.equal(deadline.transport,'raw-fallback');assert.deepEqual(Array.from(deadline.bytes),Array.from(raw),'Body timeout preserves verified raw fallback');
 console.log('RUC dual-read: Python publisher, old .257 reader, actual Worker point adapter, Missing/zero, raw rollback, SHA fallback, bounds and cache isolation passed');
}finally{rmSync(dir,{recursive:true,force:true})}
