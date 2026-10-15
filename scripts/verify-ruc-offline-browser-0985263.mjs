import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,rmSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
const dir=mkdtempSync(join(tmpdir(),'mid-ruc-offline-'));
if(!process.argv[2])execFileSync('python3',['-S','tools/ruc/test_lossless_dual_read.py',dir]);
const root=process.argv[2]||dir,meta=JSON.parse(readFileSync(join(root,'latest.json'))),page=meta.deterministic.pages,index=Number(Object.keys(page.losslessV1.chunks)[0]),entry=page.losslessV1.chunks[String(index)],raw=readFileSync(join(root,entry.rawKey)),wire=readFileSync(join(root,entry.key)),rawSha=createHash('sha256').update(raw).digest('hex');
assert.equal(rawSha,entry.manifest.decodedSha256);
const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8'}).trim());
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,[cli,'install','chromium'],{stdio:'inherit',timeout:240000});
const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
let version='0.9.85.257',sw=readFileSync('scripts/fixtures/ruc-service-worker-0257.js');
const harness=`import{loadRucDualReadChunk}from'/tools/ruc/lossless_dual_read.mjs';const page=${JSON.stringify(page)},entry=${JSON.stringify(entry)},base=new URL('/ruc/',location.href);window.rucReadRaw=async()=>{try{const r=await fetch(new URL(entry.rawKey,base),{cache:'no-store'});return r.ok?new Uint8Array(await r.arrayBuffer()):null}catch{return null}};${readFileSync('scripts/fixtures/ruc-legacy-reader-0257.js','utf8')}async function dwdRucStaticObject(){return window.rucReadRaw()}window.legacy=()=>dwdRucStaticRecord(base,{pages:page},${index*page.chunkRecords+1});window.modern=()=>loadRucDualReadChunk(base,page,${index},entry.rawKey,window.rucReadRaw,async key=>{const r=await fetch(new URL(key,base),{cache:'no-store'});if(!r.ok)throw Error('wire HTTP');return new Uint8Array(await r.arrayBuffer())});window.rucReady=true;`;
const server=createServer((req,res)=>{const url=new URL(req.url,'http://localhost');res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/service-worker.js'){res.setHeader('Content-Type','application/javascript');return res.end(sw)}
 if(url.pathname==='/'||url.pathname==='/index.html'){res.setHeader('Content-Type','text/html');return res.end(`<meta name="mid-version" content="${version}"><script type="module" src="/harness.js"></script>`)}
 if(url.pathname==='/version.json'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({version}))}
 if(url.pathname==='/harness.js'){res.setHeader('Content-Type','application/javascript');return res.end(harness)}
 if(['/tools/ruc/lossless_dual_read.mjs','/tools/ruc/lossless_candidate_decoder.mjs'].includes(url.pathname)){res.setHeader('Content-Type','application/javascript');return res.end(readFileSync('.'+url.pathname))}
 if(url.pathname==='/ruc/'+entry.rawKey)return res.end(raw);
 if(url.pathname==='/ruc/'+entry.key)return res.end(wire);
 if(url.pathname==='/api/mid-worker'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify({hourly:{temperature_2m:[10,null,-2.5,0]}}))}
 if(url.pathname.endsWith('.png')){res.setHeader('Content-Type','image/png');return res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'))}
 res.setHeader('Content-Type','application/json');res.end('{}');
});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{for(const profile of ['legacy-257','current']){
 if(profile==='current'){sw=readFileSync('public/service-worker.js');version=sw.toString().match(/mid-shell-v([^']+)/)[1]}
 const context=await browser.newContext(),tab=await context.newPage();await tab.goto(origin);await tab.waitForFunction(()=>window.rucReady);await tab.evaluate(async()=>{await navigator.serviceWorker.register('/service-worker.js');await navigator.serviceWorker.ready;await new Promise(resolve=>{if(navigator.serviceWorker.controller)return resolve();navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true})})});
 // Prime actual module fetches under SW control, as a returning installed app.
 await tab.reload();await tab.waitForFunction(()=>window.rucReady);
 const old=await tab.evaluate(async()=>Array.from(await window.legacy()));assert.deepEqual(old,Array.from(raw.subarray(page.recordBytes,page.recordBytes*2)));
 const modern=await tab.evaluate(async()=>{const r=await window.modern();return {transport:r.transport,sha:Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',r.bytes)),b=>b.toString(16).padStart(2,'0')).join('')}});assert.equal(modern.transport,'byteplanes-gzip');assert.equal(modern.sha,rawSha);
 // Deliberately poison the real shell cache: dynamic JSON and raw binaries must
 // still come from the network and must never become stale fallback weather.
 await tab.evaluate(async({version,rawKey,wireKey})=>{const c=await caches.open('mid-shell-v'+version);for(const key of ['/ruc/'+rawKey,'/ruc/'+wireKey,'/api/mid-worker?mode=dwd-ruc'])await c.put(key,new Response('poison',{headers:{'Content-Type':'application/octet-stream'}}));},{version,rawKey:entry.rawKey,wireKey:entry.key});
 assert.deepEqual(await tab.evaluate(async()=>Array.from(await window.legacy())),old,'Legacy reader ignores poisoned shell binary');
 assert.deepEqual(await tab.evaluate(async()=> (await (await fetch('/api/mid-worker?mode=dwd-ruc')).json()).hourly.temperature_2m),[10,null,-2.5,0]);
 await new Promise(resolve=>server.close(resolve));await context.setOffline(true);
 assert.equal(await tab.evaluate(async()=>{try{await fetch('/api/mid-worker?mode=dwd-ruc');return false}catch{return true}}),true,'Real SW never returns poisoned weather offline');
 assert.equal(await tab.evaluate(async()=> (await window.modern()).transport),'byteplanes-gzip','Verified memory cache survives network loss');
 await tab.reload();await tab.waitForFunction(()=>window.rucReady);
 assert.equal(await tab.evaluate(async()=>await window.legacy()),null,'Cold legacy offline request is NoData');
 const cold=await tab.evaluate(async()=>{const r=await window.modern();return {bytes:r.bytes,transport:r.transport}});assert.equal(cold.bytes,null,'Cold codec offline request is NoData, not poison/zero');assert.equal(cold.transport,'raw-fallback');
 await new Promise(resolve=>server.listen(Number(new URL(origin).port),'127.0.0.1',resolve));await context.setOffline(false);await tab.reload();await tab.waitForFunction(()=>window.rucReady);assert.equal(await tab.evaluate(async()=> (await window.modern()).transport),'byteplanes-gzip','New realm recovers online');
 await context.close();console.log(`RUC ${profile}: actual SW, old .257 reader, codec, poisoned persistent cache, warm offline/cold reload NoData and recovery passed`);
}}finally{await browser.close();await new Promise(r=>server.close(r));rmSync(dir,{recursive:true,force:true})}
