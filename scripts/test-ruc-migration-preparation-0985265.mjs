import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRucCompressedRecordReader} from '../tools/ruc/compressed_record_reader.mjs';
execFileSync('python3',['-m','unittest','test_prepare_lossless_snapshot'],{cwd:'tools/ruc',stdio:'inherit',timeout:60000});
const root=mkdtempSync(join(tmpdir(),'mid-full-prep-'));
try{
 execFileSync('python3',['tools/ruc/test_prepare_lossless_snapshot.py',root],{stdio:'inherit',timeout:60000});
 const candidate=JSON.parse(readFileSync(join(root,'candidate/latest.json'))),spec=candidate.deterministic;
 let calls=0;const wire=async key=>{calls++;return new Uint8Array(readFileSync(join(root,'candidate',key)));};
 const reader=createRucCompressedRecordReader();const enabled={enabled:true};const base='https://prepared.test/ruc/';
 assert.equal((await reader.readRecord(base,spec,0,wire)).reason,'profile-disabled');assert.equal(calls,0);
 const first=await reader.readRecord(base,spec,0,wire,enabled);assert.equal(first.bytes.length,6);assert.equal(calls,1);
 first.bytes.fill(255);assert.deepEqual(Array.from((await reader.readRecord(base,spec,0,wire,enabled)).bytes),[0,0,1,0,2,0],'Record copies cannot poison verified decode cache');
 for(const index of [87380,87381,174761,174762,199999,200000,399999]){
  const result=await reader.readRecord(base,spec,index,wire,enabled);
  const raw=readFileSync(join(root,'source/runs/test/deterministic/0000.bin'));
  assert.deepEqual(Buffer.from(result.bytes),raw.subarray((index%200000)*6,(index%200000+1)*6));
 }
 const malformed=structuredClone(spec);malformed.compressedPages.parts[1].firstRecord++;
 const before=calls;assert.equal((await reader.readRecord(base,malformed,0,wire,enabled)).reason,'descriptor-invalid');assert.equal(calls,before);
 // 64 identical cold callers share one attempt; two distinct active keys,
 // 32 queued keys, then explicit NoData on overload (no invented raw fallback).
 let release;const gate=new Promise(r=>release=r);let fetches=0,active=0,peak=0;
 const delayed=async key=>{fetches++;active++;peak=Math.max(peak,active);await gate;active--;return new Uint8Array(readFileSync(join(root,'candidate',key)));};
 const concurrent=createRucCompressedRecordReader();
 const same=Array.from({length:64},()=>concurrent.readRecord('https://same.test/',spec,0,delayed,enabled));
 assert.equal(fetches,1);release();for(const result of await Promise.all(same))assert.equal(result.bytes.length,6);
 let unblock;const slots=new Promise(r=>unblock=r);active=0;peak=0;fetches=0;
 const held=async key=>{fetches++;active++;peak=Math.max(peak,active);await slots;active--;return new Uint8Array(readFileSync(join(root,'candidate',key)));};
 const loads=Array.from({length:34},(_,i)=>concurrent.readRecord('https://slot-'+i+'.test/',spec,0,held,enabled));
 assert.equal(fetches,2);assert.equal((await concurrent.readRecord('https://overflow.test/',spec,0,held,enabled)).reason,'queue-full');unblock();
 for(const result of await Promise.all(loads))assert.equal(result.bytes.length,6);assert.equal(peak,2);assert.equal(fetches,34);
 const broken=createRucCompressedRecordReader();const unavailable=async()=>{throw Error('offline');};
 assert.equal((await broken.readRecord(base,spec,0,unavailable,enabled)).bytes,null);
 assert.equal((await broken.readRecord(base,spec,0,wire,enabled)).reason,'codec-retry-backoff');
 const corrupt=createRucCompressedRecordReader();
 assert.equal((await corrupt.readRecord(base,spec,0,async key=>{const value=await wire(key);value[0]^=1;return value;},enabled)).reason,'codec-rejected');
 const timeout=createRucCompressedRecordReader({deadlineMs:20});let finishLate;
 const late=new Promise(r=>finishLate=r);let cancelled=0;
 const ignoresAbort=async(key,limit,signal)=>{signal.addEventListener('abort',()=>cancelled++);await late;return new Uint8Array(readFileSync(join(root,'candidate',key)));};
 const waiting=Array.from({length:3},(_,i)=>timeout.readRecord('https://timeout-'+i+'.test/',spec,0,ignoresAbort,enabled));
 const expired=await Promise.all(waiting);assert.deepEqual(expired.map(x=>x.reason),['deadline','deadline','queue-deadline']);assert.equal(cancelled,2);finishLate();
 assert.equal((await reader.readRecord(base,spec,-1,wire,enabled)).bytes,null);
 assert.equal((await reader.readRecord(base,spec,400000,wire,enabled)).bytes,null);
 const proof=JSON.parse(execFileSync(process.execPath,['tools/ruc/verify_lossless_migration.mjs',join(root,'source'),join(root,'candidate')],{encoding:'utf8',timeout:60000}));
 assert.equal(proof.candidateProfile,'pages-lossless-candidate-v1');assert.equal(proof.productionEnabled,false);assert.ok(proof.recordComparisons>10);
 assert.ok(!readFileSync('tools/ruc/prepare_ruc_pages.py','utf8').includes('prepare_lossless_snapshot'),'Hourly publisher cannot activate candidate builder');
 assert.ok(readFileSync('scripts/build-maintenance-aggregates.mjs','utf8').includes("'tools/ruc/compressed_record_reader.mjs'"),'Full replacement reader must be explicitly included in the generated Worker');
 const workerSource=readFileSync('worker/metar-proxy.js','utf8');
 assert.ok(workerSource.includes('preparedRucCompressedRecordReader.readRecord'),'Worker must contain prepared full profile path');
 assert.ok(workerSource.includes('meta.migration?.productionEnabled===true'),'Candidate must never enable production implicitly');
 const vmSource=workerSource.replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
 const fetchFixture=async input=>{
  const url=new URL(input),key=url.pathname.replace(/^\/ruc\//,'');
  return new Response(new Uint8Array(readFileSync(join(root,'candidate',key))),{headers:{'content-type':'application/octet-stream'}});
 };
 const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,ReadableStream,DecompressionStream,performance,fetch:fetchFixture});
 vm.runInContext(vmSource,context,{timeout:5000});
 context.spec=candidate.deterministic;context.candidate=candidate;
 const actual=await vm.runInContext("dwdRucStaticRecord(new URL('https://prepared.test/ruc/'),spec,0,true)",context);
 assert.deepEqual(Array.from(actual),[0,0,1,0,2,0],'Actual generated Worker must read the exact Python candidate record');
 assert.equal(actual.midRucTransport,'byteplanes-gzip');
 assert.equal(vm.runInContext('dwdRucSupportedStaticProfile(candidate)',context),false,'Prepared candidate is never a production manifest');
 context.activated=structuredClone(candidate);
 context.activated.storageProfile='pages-lossless-v1';context.activated.pages.profile='pages-lossless-v1';
 context.activated.pages.losslessTransport.mode='replacement';context.activated.migration.productionEnabled=true;
 assert.equal(vm.runInContext('dwdRucSupportedStaticProfile(activated)',context),true,'Explicitly activated, structurally verified replacement profile can be recognized');
 assert.ok(!readFileSync('tools/ruc/prepare_ruc_pages.py','utf8').includes('prepare_lossless_snapshot'),'Publisher still produces raw data until separately approved activation');
 console.log('RUC265: complete candidate, unchanged rollback, actual record parity, opt-in, bounded queue, deduplication, timeout/backoff and no production activation passed.');
}finally{rmSync(root,{recursive:true,force:true});}
