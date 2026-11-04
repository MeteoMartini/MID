import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {gzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const temporary=mkdtempSync(join(tmpdir(),'mid-cache-regression-'));
let cache;
try{
 const output=join(temporary,'cache.mjs');
 await build({entryPoints:['src/verifiedMapFrameCache.ts'],outfile:output,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 cache=await import(pathToFileURL(output).href);
}finally{rmSync(temporary,{recursive:true,force:true})}
globalThis.location=new URL('https://www.midwx.app/');
const realFetch=globalThis.fetch;
const body=Buffer.from('{"values":[0,null,-12,99]}');
const sha=b=>createHash('sha256').update(b).digest('hex');
const path='/ruc/runs/2026110406/model-fields/a.json';
const tick=()=>new Promise(r=>setImmediate(r));
let passed=0,failed=0;
async function run(name,fn){await cache.clearVerifiedMapFrameCache();try{await fn();passed++;console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e.message)}finally{globalThis.fetch=realFetch}}
function pendingFetch(){
 const jobs=[];
 globalThis.fetch=(url,{signal})=>new Promise((resolve,reject)=>jobs.push({signal,resolve:()=>resolve(new Response(body)),reject}));
 return jobs;
}
await run('last abort invalidates pending; new reader fetches anew',async()=>{
 const jobs=pendingFetch(),a=new AbortController();
 const first=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length,a.signal);
 const caught=assert.rejects(first);await tick();a.abort();await caught;
 const second=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length);await tick();
 assert.equal(jobs.length,2);assert.equal(jobs[0].signal.aborted,true);assert.equal(jobs[1].signal.aborted,false);
 jobs[1].resolve();await second;jobs[0].reject(new Error('old aborted'));await tick();
});
await run('active co-consumer survives independent cancellation',async()=>{
 const jobs=pendingFetch(),a=new AbortController();
 const first=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length,a.signal),caught=assert.rejects(first);
 const second=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length);await tick();a.abort();await caught;
 assert.equal(jobs.length,1);assert.equal(jobs[0].signal.aborted,false);jobs[0].resolve();assert.deepEqual(Buffer.from(await second),body);
});
await run('delayed old cleanup cannot delete replacement task',async()=>{
 const jobs=pendingFetch(),a=new AbortController();
 const first=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length,a.signal),caught=assert.rejects(first);await tick();a.abort();await caught;
 const second=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length);const safeSecond=second.catch(e=>{throw e});await tick();
 assert.equal(jobs.length,2);jobs[0].reject(new Error('late rejection'));await tick();
 const third=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length);await tick();assert.equal(jobs.length,2);
 jobs[1].resolve();await Promise.all([safeSecond,third]);
});
await run('all consumers abort; replacement has live controller',async()=>{
 const jobs=pendingFetch(),a=new AbortController(),b=new AbortController();
 const one=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length,a.signal),two=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length,b.signal);
 const rejects=Promise.all([assert.rejects(one),assert.rejects(two)]);await tick();a.abort();assert.equal(jobs[0].signal.aborted,false);b.abort();await rejects;
 const next=cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length);await tick();assert.equal(jobs.length,2);assert.equal(jobs[1].signal.aborted,false);jobs[1].resolve();await next;jobs[0].reject(new Error('old'));await tick();
});
for(const [name,payload,headers,ok] of [
 ['plain',body,{'content-length':String(body.length)},true],
 ['no length',body,{},true],
 ['HTTP decoded gzip body',body,{'content-encoding':'gzip','content-length':String(gzipSync(body).length)},true],
 ['application gzip',gzipSync(body),{'content-length':String(gzipSync(body).length)},true],
 ['corrupt',Buffer.alloc(body.length),{},false],
 ['truncated',body.subarray(0,-1),{},false],
 ['oversized',Buffer.concat([body,Buffer.from('x')]),{},false]
])await run(name,async()=>{const expected=name==='application gzip'?gzipSync(body):body;globalThis.fetch=async()=>new Response(payload,{headers});const result=cache.fetchVerifiedMapFrameBytes(path,sha(expected),expected.length);if(ok)assert.deepEqual(Buffer.from(await result),expected);else await assert.rejects(result)});
await run('real HTTP gzip auto decoding',async()=>{
 const zipped=gzipSync(body),server=createServer((req,res)=>{res.writeHead(200,{'content-encoding':'gzip','content-length':zipped.length});res.end(zipped)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));globalThis.location=new URL('http://127.0.0.1:'+server.address().port+'/');
 try{assert.deepEqual(Buffer.from(await cache.fetchVerifiedMapFrameBytes(path,sha(body),body.length)),body)}finally{globalThis.location=new URL('https://www.midwx.app/');server.closeAllConnections();await new Promise(r=>server.close(r))}
});
await run('field maximum and URL allowlist unchanged',async()=>{
 await assert.rejects(cache.fetchVerifiedMapFrameBytes(path,sha(body),12*1024*1024+1));
 await assert.rejects(cache.fetchVerifiedMapFrameBytes('https://evil.test'+path,sha(body),body.length));
});
console.log(JSON.stringify({passed,failed,node:process.version}));if(failed)process.exitCode=1;
