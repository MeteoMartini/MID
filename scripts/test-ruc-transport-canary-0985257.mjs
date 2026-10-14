import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {runRucTransportCanary} from '../tools/ruc/lossless_transport_canary.mjs';
import {CANARY_MANIFEST} from '../tools/ruc/lossless_canary_manifest.generated.mjs';
const root='public/diagnostics/ruc-codec-v1/',originalFetch=globalThis.fetch;
let fault='',seen=[];
async function fetchFixture(input){const url=new URL(input);seen.push(url.href);let bytes=readFileSync(root+url.pathname.split('/').at(-1));if(fault==='index'&&url.pathname.endsWith('index.json'))bytes=Buffer.from('{}');if(fault==='raw'&&url.pathname.endsWith('.raw.bin'))bytes=Buffer.alloc(bytes.length);if(fault==='wire'&&url.pathname.includes('byteplanes-gzip'))bytes=bytes.subarray(1);if(fault==='http')return new Response('',{status:404});if(fault==='oversize'&&url.pathname.endsWith('index.json'))bytes=Buffer.alloc(8193);return new Response(bytes,{headers:{etag:'"canary-sha"','cache-control':'public, max-age=0, must-revalidate'}})}
try{
 globalThis.fetch=fetchFixture;const report=await runRucTransportCanary();assert.equal(report.int16Patterns,65536);assert.equal(report.productionEnabled,false);assert.equal(report.missingSentinelPreserved,true);assert.equal(report.candidates.length,3);assert.ok(report.candidates.every(r=>r.verified));assert.ok(seen.every(url=>url.startsWith('https://midwx.app/diagnostics/ruc-codec-v1/')));
 for(fault of ['index','raw','wire','http','oversize'])await assert.rejects(()=>runRucTransportCanary(),/RUC canary|RUC codec/);fault='';
 const raw=readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
 const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,crypto,setTimeout,clearTimeout,fetch:fetchFixture,Uint8Array,DataView,ReadableStream,DecompressionStream,performance});vm.runInContext(raw,context,{timeout:5000});
 const response=await vm.runInContext("__workerDefault.fetch(new Request('https://worker.invalid/?mode=ruc-codec-canary'),{})",context);assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const worker=await response.json();assert.equal(worker.int16Patterns,65536);assert.ok(worker.candidates.every(r=>r.verified));
 fault='wire';const rejected=await vm.runInContext("__workerDefault.fetch(new Request('https://worker.invalid/?mode=ruc-codec-canary'),{})",context);assert.equal(rejected.status,503);assert.equal((await rejected.json()).verified,false);fault='';
 for(const name of ['lossless_candidate_decoder.mjs','lossless_transport_canary.mjs','lossless_canary_manifest.generated.mjs'])assert.deepEqual(readFileSync(root+name),readFileSync('tools/ruc/'+name),'Static/Worker canary must retain canonical source');
 for(const {key,manifest} of CANARY_MANIFEST.candidates)assert.equal(createHash('sha256').update(readFileSync(root+key)).digest('hex'),manifest.encodedSha256);
 console.log('RUC synthetic HTTP canary: shared browser/Worker verifier, 65536 patterns, fixed origin, raw legacy read, cache headers, bounds and fail-closed errors passed.');
}finally{globalThis.fetch=originalFetch}
if(process.env.GITHUB_ACTIONS==='true'){
 const {execFileSync}=await import('node:child_process');execFileSync(process.execPath,['scripts/verify-ruc-transport-canary-browser-0985257.mjs'],{stdio:'inherit',timeout:300000});
}
