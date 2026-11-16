/** SHA-bound, read-only Chromium probe for real built MID map-module import costs.
 * Not a whole-app/network A/B, GPU or iOS memory test; excludes Service Worker.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,readdir,mkdtemp,mkdir,rm,writeFile,access} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';
import {readDevToolsPort,browserStartDiagnostics} from './lib/browser-start-diagnostics.mjs';

const root=resolve(process.argv[2]??'dist');
const identity=JSON.parse(await readFile(join(root,'mid-build-identity.json'),'utf8'));
const expected=process.env.MID_EXPECTED_SOURCE_SHA;
assert.match(expected??'',/^[a-f0-9]{40}$/,'Full expected build source SHA required');
assert.equal(identity.sourceGitSha,expected,'Production build does not match exact PR head');
await verifyStartupBuildIdentity(root,identity);
const names=await readdir(join(root,'assets'));
const modules=['MapWorkspacePanel','RadarPanel','UnifiedWeatherMap','MapLibreCore'];
const chunks=Object.fromEntries(modules.map(name=>{
 const found=names.filter(f=>f.startsWith(name+'-')&&f.endsWith('.js'));
 assert.equal(found.length,1,'Missing or ambiguous Vite JS chunk '+name);
 return [name,found[0]];
}));
const jsFiles=new Set(names.filter(f=>/^[A-Za-z0-9._-]+\.js$/.test(f)));
const profile=await mkdtemp(join(tmpdir(),'mid-map-module-probe-'));
let server,chrome,socket,sessionId,seq=0,startup;
const pending=new Map(),requests=new Map(),exceptions=[];
const delay=ms=>new Promise(done=>setTimeout(done,ms));
function cdp(method,params={},session=sessionId,timeout=12000){
 return new Promise((resolveCall,reject)=>{
  if(!socket||socket.readyState!==WebSocket.OPEN)return reject(Error('CDP disconnected: '+method));
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},timeout);
  pending.set(id,{resolveCall,reject,timer});
  socket.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}));
 });
}
async function evaluate(expression,timeout=12000){
 const out=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},sessionId,timeout);
 if(out.result.exceptionDetails)throw Error('Chromium evaluate exception '+JSON.stringify(out.result.exceptionDetails).slice(0,550));
 return out.result.result?.value;
}
async function poll(fn,description,timeout=30000){
 const until=Date.now()+timeout;
 while(Date.now()<until){startup?.assertRunning();if(await fn())return;await delay(100)}
 throw Error('Timed out: '+description);
}
try{
 const preload=modules.slice(0,3).map(name=>"import('/assets/"+chunks[name]+"')").join(',');
 const html='<!doctype html><meta charset="utf-8"><title>MID module-only QA</title>'+
  '<script>window.__midImport=()=>Promise.all(['+preload+']).then(()=> "fulfilled")</script>';
 server=createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1/');
   if(url.pathname==='/probe'){
    res.writeHead(200,{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store'});res.end(html);return;
   }
   const found=/^\/assets\/([A-Za-z0-9._-]+\.js)$/.exec(url.pathname);
   if(!found||!jsFiles.has(found[1])){res.writeHead(404);res.end();return}
   const data=await readFile(join(root,'assets',found[1])),gzip=gzipSync(data,{level:9});
   res.writeHead(200,{'Content-Type':'text/javascript','Content-Encoding':'gzip',
    'Content-Length':String(gzip.length),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   res.end(gzip);
  }catch(error){res.writeHead(500);res.end(String(error?.message??error))}
 });
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const port=server.address().port;
 let executable=null;
 for(const candidate of [process.env.CHROMIUM_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean)){
  try{await access(candidate);executable=candidate;break}catch{}
 }
 if(!executable)throw Error('Chromium missing: cannot claim browser/network PASS');
 chrome=spawn(executable,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
  {stdio:['ignore','ignore','pipe']});
 startup=browserStartDiagnostics(chrome);
 let portDev,info;
 await poll(async()=>{
  portDev=await readDevToolsPort(join(profile,'DevToolsActivePort'));if(!portDev)return false;
  try{
   const response=await fetch('http://127.0.0.1:'+portDev+'/json/version',{signal:AbortSignal.timeout(1500)});
   if(!response.ok)return false;info=await response.json();return Boolean(info.webSocketDebuggerUrl);
  }catch{return false}
 },'Chrome DevTools startup');
 socket=new WebSocket(info.webSocketDebuggerUrl);
 socket.addEventListener('message',event=>{
  let entry;try{entry=JSON.parse(String(event.data))}catch{return}
  if(entry.id){
   const p=pending.get(entry.id);if(!p)return;
   pending.delete(entry.id);clearTimeout(p.timer);
   entry.error?p.reject(Error(String(entry.error.message))):p.resolveCall(entry);
   return;
  }
  if(entry.sessionId!==sessionId)return;
  const method=entry.method,params=entry.params||{};
  if(method==='Runtime.exceptionThrown')exceptions.push(params.exceptionDetails);
  if(method==='Network.requestWillBeSent'){
   requests.set(params.requestId,{url:params.request.url,status:null,cached:false,finished:false,wireBytes:null});
  }
  const row=requests.get(params.requestId);
  if(!row)return;
  if(method==='Network.responseReceived'){row.status=params.response.status;row.cached||=Boolean(params.response.fromDiskCache);}
  if(method==='Network.requestServedFromCache')row.cached=true;
  if(method==='Network.loadingFinished'){row.finished=true;row.wireBytes=params.encodedDataLength;}
  if(method==='Network.loadingFailed'){row.finished=true;row.failed=params.errorText;}
 });
 await new Promise((done,fail)=>{socket.addEventListener('open',done,{once:true});socket.addEventListener('error',fail,{once:true})});
 const target=(await cdp('Target.createTarget',{url:'about:blank'},null)).result.targetId;
 sessionId=(await cdp('Target.attachToTarget',{targetId:target,flatten:true},null)).result.sessionId;
 await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Network.enable');
 await cdp('Network.setCacheDisabled',{cacheDisabled:true});
 await cdp('HeapProfiler.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cdp('Page.navigate',{url:'http://127.0.0.1:'+port+'/probe'});
 await poll(async()=>await evaluate("typeof window.__midImport==='function'").catch(()=>false),'module-only probe document');
 await cdp('HeapProfiler.collectGarbage');
 const before=(await cdp('Runtime.getHeapUsage')).result;
 await delay(2800);
 const loaded=()=>[...requests.values()].filter(x=>x.url.includes('/assets/')&&x.url.endsWith('.js'));
 assert.equal(loaded().length,0,'Unexpected real map JS module request before warmup');
 const started=performance.now();
 assert.equal(await evaluate('window.__midImport()',90000),'fulfilled','Real built modules failed to import');
 const duration=Math.round(performance.now()-started);
 await cdp('HeapProfiler.collectGarbage');
 const after=(await cdp('Runtime.getHeapUsage')).result;
 assert.deepEqual(exceptions,[],'Uncaught errors during real module loading');
 const rows=loaded();
 assert(rows.length>=4,'Expected multiple real Vite JS chunks after warmup');
 for(const name of modules)assert(rows.some(row=>row.url.endsWith('/'+chunks[name])),'Missing real map chunk: '+name);
 assert(rows.every(x=>x.status===200&&x.finished&&!x.failed&&!x.cached),
  'Missing, cached, failing or pending requests invalidate cold-browser evidence');
 const files=await Promise.all(rows.map(async x=>{
  const name=new URL(x.url).pathname.split('/').at(-1);
  const content=await readFile(join(root,'assets',name));
  return {name,rawBytes:content.length,gzipBodyBytes:gzipSync(content,{level:9}).length,
   cdpEncodedDataLength:x.wireBytes};
 }));
 const result={schema:'mid.prefetch.chrome-module-evidence.v1',
  identity:{version:identity.version,sourceGitSha:identity.sourceGitSha,assetsSha256:identity.assetsSha256},
  method:'Chromium isolated localhost module import, gzip-9, HTTP cache disabled, no Service Worker; GC before and after',
  caveat:'NOT entire MID app, Safari/iOS/GPU/total RAM, first-map-tap UX, field network or a long-run leak verdict',
  noImport:{waitMs:2800,productionMapJsRequests:0},
  warmImport:{requestCount:files.length,rawJsBytes:files.reduce((a,b)=>a+b.rawBytes,0),
   gzipBodyBytes:files.reduce((a,b)=>a+b.gzipBodyBytes,0),
   cdpEncodedDataLength:files.reduce((a,b)=>a+(b.cdpEncodedDataLength??0),0),
   importElapsedMs:duration,postGcHeapBefore:before.usedSize,postGcHeapAfter:after.usedSize,
   postGcHeapDelta:after.usedSize-before.usedSize,files}
 };
 await mkdir('artifacts',{recursive:true});
 await writeFile('artifacts/map-prefetch-import-evidence-0985489.json',JSON.stringify(result,null,2)+'\n');
 console.log('MID_MAP_MODULE_IMPORT_EVIDENCE '+JSON.stringify({sha:identity.sourceGitSha,
  js:files.length,gzipBytes:result.warmImport.gzipBodyBytes,
  gcHeapDelta:result.warmImport.postGcHeapDelta,importElapsedMs:duration,
  scope:'module-only, not full-app A/B or native memory'}));
}finally{
 if(socket){try{socket.close()}catch{}}
 for(const p of pending.values())clearTimeout(p.timer);
 pending.clear();
 if(chrome?.pid&&chrome.exitCode===null&&chrome.signalCode===null){
  const closing=once(chrome,'close');chrome.kill('SIGTERM');
  await Promise.race([closing,delay(2000)]);
  if(chrome.exitCode===null&&chrome.signalCode===null){chrome.kill('SIGKILL');await Promise.race([closing,delay(1000)])}
 }
 if(server)await new Promise(done=>server.close(done));
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
