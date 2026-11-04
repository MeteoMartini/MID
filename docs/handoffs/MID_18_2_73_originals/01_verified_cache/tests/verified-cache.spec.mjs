import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createHash,webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const ts=new URL('../src/verifiedMapFrameCache.ts',import.meta.url);
const dir=mkdtempSync(join(tmpdir(),'mid-cache-'));
execFileSync('tsc',['--target','ES2022','--module','ES2022','--lib','ES2022,DOM','--skipLibCheck','--outDir',dir,ts.pathname],{stdio:'pipe'});
const mod=await import(pathToFileURL(join(dir,'verifiedMapFrameCache.js')).href);
globalThis.location=new URL('https://www.midwx.app/');
const data=Buffer.from('{"run":"2026-11-04T10:00Z","values":[0,null,12]}');
const hash=createHash('sha256').update(data).digest('hex');
let calls=0;
const originalFetch=globalThis.fetch;
globalThis.fetch=async url=>{calls++;return new Response(data,{status:200,headers:{'content-length':String(data.length)}})};
const req='/ruc/runs/2026110410/model-fields/pressure-001.json';
test('cold fetch then in-memory warm resume, preserving zero vs null',async()=>{
 const a=await mod.fetchVerifiedMapFrameBytes(req,hash,data.length);
 assert.deepEqual(JSON.parse(Buffer.from(a).toString()).values,[0,null,12]);
 const b=await mod.fetchVerifiedMapFrameBytes(req,hash,data.length);
 assert.deepEqual(Buffer.from(a),Buffer.from(b));assert.equal(calls,1);
});
test('strict path origin and request-size guard',async()=>{
 for(const bad of ['https://evil.example/ruc/runs/a/model-fields/x.json','/api/private','/ruc/latest.json','/ruc/runs/a/model-fields/../../index.json'])await assert.rejects(mod.fetchVerifiedMapFrameBytes(bad,hash,data.length));
 await assert.rejects(mod.fetchVerifiedMapFrameBytes(req,'not-a-sha',data.length));
 await assert.rejects(mod.fetchVerifiedMapFrameBytes(req,hash,99_999_999));
});
test('mutated response cannot poison next cache read',async()=>{
 const a=await mod.fetchVerifiedMapFrameBytes(req,hash,data.length);new Uint8Array(a)[0]=0;
 const b=await mod.fetchVerifiedMapFrameBytes(req,hash,data.length);assert.equal(new Uint8Array(b)[0],123)
});
test('refuses SHA mismatch and does not mark bad frame cached',async()=>{
 const bad=hash.replace(/^./,hash[0]==='a'?'b':'a');
 await assert.rejects(mod.fetchVerifiedMapFrameBytes(req,bad,data.length),/SHA mismatch/);
 await assert.rejects(mod.fetchVerifiedMapFrameBytes(req,bad,data.length),/SHA mismatch/);
 assert.equal(calls,3);
});
test('timeout/AbortSignal is not a stale-data success',async()=>{
 const c=new AbortController();c.abort(new Error('cancelled'));await assert.rejects(mod.fetchVerifiedMapFrameBytes(req,hash,data.length,c.signal));
});
process.on('exit',()=>{globalThis.fetch=originalFetch});
test('persistent CacheStorage survives fresh application module and detects poisoned bytes',async()=>{
 const entries=new Map();
 globalThis.caches={
  async open(){return{
   async match(req){const r=entries.get(String(req));return r?.clone()},
   async put(req,resp){entries.set(String(req),resp.clone())},
   async delete(req){return entries.delete(String(req))},
   async keys(){return [...entries.keys()].map(url=>new Request(url))}
  }},
  async delete(){entries.clear();return true}
 };
 const route='/ruc/runs/2026110410/model-fields/temperature-001.json';
 const before=calls;
 await mod.fetchVerifiedMapFrameBytes(route,hash,data.length);
 assert.equal(calls,before+1);
 const fresh=await import(pathToFileURL(join(dir,'verifiedMapFrameCache.js')).href+'?reload=true');
 const v=await fresh.fetchVerifiedMapFrameBytes(route,hash,data.length);
 assert.deepEqual(Buffer.from(v),data);
 assert.equal(calls,before+1,'second app instance must not refetch immutable verified bytes');
 const key=[...entries.keys()][0];assert.ok(key);
 entries.set(key,new Response('malicious bytes',{status:200,headers:{'content-length':String(data.length),'x-mid-verified-cached-at':String(Date.now())}}));
 const cold=await import(pathToFileURL(join(dir,'verifiedMapFrameCache.js')).href+'?cold=true');
 const recovered=await cold.fetchVerifiedMapFrameBytes(route,hash,data.length);
 assert.deepEqual(Buffer.from(recovered),data);
 assert.equal(calls,before+2,'cache poisoning must cause safe refetch');
});
