/**
 * Full built MID Chromium first-map pointer LAB probe (single exact build).
 * No hard-coded weather responses, no privacy telemetry, no release verdict.
 * Usage: node scripts/measure-mid-full-app-browser-design16.mjs <dist> <full-sha> <fixture.json>
 */
import assert from 'node:assert/strict';
import {readFile,readdir,mkdtemp,rm,access,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve,extname} from 'node:path';
import {createServer} from 'node:http';
import {gzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {verifyStartupBuildIdentity} from './lib/verifyStartupBuildIdentity.mjs';
import {validateFullAppFixture,assembleFullAppEvidence} from './lib/design16FullAppProbePolicy.mjs';

assert.equal(process.argv.length,5,'Usage: node scripts/measure-mid-full-app-browser-design16.mjs <dist> <full-sha> <fixture.json>');
const root=resolve(process.argv[2]),sourceGitSha=process.argv[3];
assert.match(sourceGitSha,/^[a-f0-9]{40}$/,'Full SHA required');
const fixture=validateFullAppFixture(JSON.parse(await readFile(resolve(process.argv[4]),'utf8')));
const identity=JSON.parse(await readFile(join(root,'mid-build-identity.json'),'utf8'));
assert.equal(identity.sourceGitSha,sourceGitSha,'Dist does not match expected commit');
await verifyStartupBuildIdentity(root,identity);
assert.equal(JSON.parse(await readFile(join(root,'version.json'),'utf8')).version,identity.version,'Version mirror drift');

const allowed=new Set();
async function inventory(dir='',base=root){
 for(const entry of await readdir(join(base,dir),{withFileTypes:true})){
  const relative=[dir,entry.name].filter(Boolean).join('/');
  if(entry.isDirectory())await inventory(relative,base);
  else if(entry.isFile())allowed.add(relative);
  else throw Error('Unsupported file/symlink in verified dist: '+relative);
 }
}
await inventory();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg',
 '.jpeg':'image/jpeg','.woff2':'font/woff2','.wasm':'application/wasm'};
let server,chrome,ws,sessionId,seq=0,profile;
const pending=new Map(),requests=new Map();let exceptionCount=0,serverOrigin='',browserVersion='';
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function poll(callback,label,ms=45000){
 const end=Date.now()+ms;
 while(Date.now()<end){if(chrome?.exitCode!==null||chrome?.signalCode!==null)throw Error('Chromium exited before '+label);
  if(await callback())return;await sleep(130)}throw Error('Timeout waiting for '+label);
}
function cdp(method,params={},session=sessionId,timeout=15000){
 return new Promise((yes,no)=>{
  if(!ws||ws.readyState!==WebSocket.OPEN)return no(Error('CDP disconnected: '+method));
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);no(Error('CDP timeout '+method))},timeout);
  pending.set(id,{yes,no,timer});
  ws.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}));
 });
}
async function js(expression,timeout=15000){
 const response=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId,timeout);
 if(response.result.exceptionDetails)throw Error('App browser evaluate error '+JSON.stringify(response.result.exceptionDetails).slice(0,600));
 return response.result.result?.value;
}
function records(){
 const a=[...requests.values()].filter(x=>x.local&&x.extension==='.js'&&x.finished&&!x.failed);
 const b=[...requests.values()].filter(x=>x.local&&x.extension==='.css'&&x.finished&&!x.failed);
 const stat=rows=>({count:rows.length,bytes:rows.reduce((n,v)=>n+v.encodedBytes,0),cached:rows.filter(v=>v.cached).length});
 return {js:stat(a),css:stat(b),external:[...requests.values()].filter(x=>!x.local).length};
}
function readyBytes(){return [...requests.values()].filter(x=>x.local&&['.js','.css'].includes(x.extension)).every(x=>x.finished&&!x.failed)}
async function sample(cacheMode){
 requests.clear();exceptionCount=0;
 await cdp('Network.setCacheDisabled',{cacheDisabled:cacheMode==='cold'});
 const url=serverOrigin+'/index.html';
 const navigation=await cdp('Page.navigate',{url});
 if(navigation.result.errorText)throw Error('MID browser navigation blocked or failed: '+navigation.result.errorText);
 // Validating real MID navigation prevents a mock/blank page from producing a false pass.
 await poll(()=>js(`Boolean(document.querySelector('#root')&&document.querySelector('nav[aria-label="Hauptnavigation"]'))`).catch(()=>false),
  'real MID navigation');
 await sleep(2750); // Fixed *post-navigation* observation window for optional preloads.
 const initial=records();
 await cdp('HeapProfiler.collectGarbage');
 const pre=(await cdp('Runtime.getHeapUsage')).result;
 const tap=await js(`(()=>{const nav=document.querySelector('nav[aria-label="Hauptnavigation"]');
  const buttons=[...nav.querySelectorAll('button')].filter(b=>b.getClientRects().length&&
   /(^|\\s)Karten($|\\s)/u.test((b.innerText||b.textContent||'').trim()));
  if(buttons.length!==1)return {error:'Expected one visible Karten navigation button',found:buttons.length};
  const r=buttons[0].getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
 if(tap?.error||!Number.isFinite(tap?.x)||!Number.isFinite(tap?.y))
  throw Error('Full-app first map touch unavailable: '+JSON.stringify(tap));
 // Input.dispatchTouchEvent exercises Chromium's actual pointer event pipeline,
 // not a scripted DOM .click(). Browser flags permit mobile touch emulation.
 await cdp('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tap.x,y:tap.y}]});
 await cdp('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await poll(()=>js(`(()=>{const canvas=[...document.querySelectorAll('.maplibregl-map canvas')].find(c=>{
   const r=c.getBoundingClientRect(),style=getComputedStyle(c);return r.width>140&&r.height>140&&style.display!=='none'&&style.visibility!=='hidden'});
   if(!canvas||!Number.isFinite(window.__midQaMapPointerAt))return false;
   window.__midQaMapVisibleAt=performance.now();return true;})()`).catch(()=>false),
   'real MapLibre canvas after actual pointer event',45000);
 await poll(async()=>readyBytes(),'all locally requested JS/CSS completed',12000);
 const timing=await js(`(()=>{const p=performance.getEntriesByType('paint');
  return {fcp:p.find(x=>x.name==='first-contentful-paint')?.startTime??null,
   pointerAt:window.__midQaMapPointerAt??null,mapAt:window.__midQaMapVisibleAt??null}})()`);
 if(!Number.isFinite(timing?.fcp)||!Number.isFinite(timing?.pointerAt)||!Number.isFinite(timing?.mapAt)||timing.mapAt<timing.pointerAt)
  throw Error('Actual FCP or first map pointer-to-visible time missing: no valid full app measurement');
 await cdp('HeapProfiler.collectGarbage');
 const post=(await cdp('Runtime.getHeapUsage')).result;
 const full=records();
 return {cacheMode,mapReady:true,realPointerEvent:true,
  fcpMs:Math.round(timing.fcp),firstMapPointerToVisibleMs:Math.round(timing.mapAt-timing.pointerAt),
  postGcHeapBeforeBytes:pre.usedSize,postGcHeapAfterBytes:post.usedSize,
  initialJsRequests:initial.js.count,initialCssRequests:initial.css.count,
  totalJsRequests:full.js.count,totalCssRequests:full.css.count,
  initialJsEncodedBytes:initial.js.bytes,initialCssEncodedBytes:initial.css.bytes,
  totalJsEncodedBytes:full.js.bytes,totalCssEncodedBytes:full.css.bytes,
  cachedJsRequests:full.js.cached,cachedCssRequests:full.css.cached,
  externalRequestsObserved:full.external,runtimeExceptionsObserved:exceptionCount};
}
try{
 server=createServer(async(req,res)=>{
  try{
   const raw=new URL(req.url,'http://127.0.0.1');
   let pathname=decodeURIComponent(raw.pathname);
   if(pathname==='/'||pathname==='/index.html')pathname='index.html';else pathname=pathname.replace(/^\//,'');
   if(!allowed.has(pathname)){res.writeHead(404,{'Cache-Control':'no-store'});res.end();return}
   const data=await readFile(join(root,pathname)),extension=extname(pathname).toLowerCase();
   const pack=extension==='.js'||extension==='.css',wire=pack?gzipSync(data,{level:9}):data;
   res.writeHead(200,{'Content-Type':mime[extension]??'application/octet-stream',
    ...(pack?{'Content-Encoding':'gzip'}:{}),'Content-Length':String(wire.length),
    'Cache-Control':pathname==='index.html'||extension==='.json'?'no-store':'public, max-age=3600',
    'X-Content-Type-Options':'nosniff'});res.end(wire);
  }catch{res.writeHead(500);res.end()}
 });
 await new Promise(yes=>server.listen(0,'127.0.0.1',yes));
 serverOrigin='http://127.0.0.1:'+server.address().port;
 let binary;
 for(const candidate of [process.env.CHROMIUM_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean)){
  try{await access(candidate);binary=candidate;break}catch{}
 }
 if(!binary)throw Error('Chromium executable missing: cannot claim browser QA');
 profile=await mkdtemp(join(tmpdir(),'mid-design16-real-page-'));
 chrome=spawn(binary,['--headless=new','--disable-dev-shm-usage',
  '--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],
  {stdio:['ignore','ignore','pipe']});
 let version;
 await poll(async()=>{
  try{
   const data=await readFile(join(profile,'DevToolsActivePort'),'utf8');
   const port=Number(data.split(/\r?\n/)[0]);if(!Number.isSafeInteger(port)||port<1)return false;
   const response=await fetch('http://127.0.0.1:'+port+'/json/version',{signal:AbortSignal.timeout(1500)});
   if(!response.ok)return false;version=await response.json();return !!version.webSocketDebuggerUrl;
  }catch{return false}
 },'Chrome DevTools startup',20000);
 browserVersion=String(version.Browser||'');
 ws=new WebSocket(version.webSocketDebuggerUrl);
 ws.addEventListener('message',e=>{
  let data;try{data=JSON.parse(String(e.data))}catch{return}
  if(data.id){const p=pending.get(data.id);if(!p)return;pending.delete(data.id);clearTimeout(p.timer);
   if(data.error)p.no(Error(String(data.error.message)));else p.yes(data);return;}
  if(data.sessionId!==sessionId)return;
  const m=data.method,p=data.params||{};
  if(m==='Runtime.exceptionThrown'){exceptionCount++;return}
  if(m==='Network.requestWillBeSent'){
   let url;try{url=new URL(p.request.url)}catch{return}
   const local=url.origin===serverOrigin,extension=extname(url.pathname).toLowerCase();
   requests.set(p.requestId,{local,extension,finished:false,failed:false,cached:false,encodedBytes:0});return;
  }
  const row=requests.get(p.requestId);if(!row)return;
  if(m==='Network.responseReceived'){row.cached||=Boolean(p.response.fromDiskCache||p.response.fromServiceWorker)}
  if(m==='Network.requestServedFromCache')row.cached=true;
  if(m==='Network.loadingFinished'){row.finished=true;row.encodedBytes=p.encodedDataLength}
  if(m==='Network.loadingFailed'){row.failed=true;row.finished=true}
 });
 await new Promise((ok,bad)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',bad,{once:true})});
 const target=(await cdp('Target.createTarget',{url:'about:blank'},null)).result.targetId;
 sessionId=(await cdp('Target.attachToTarget',{targetId:target,flatten:true},null)).result.sessionId;
 for(const domain of ['Page','Runtime','Network','HeapProfiler'])await cdp(domain+'.enable');
 await cdp('Network.setBypassServiceWorker',{bypass:true});
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 // No secrets or raw location coordinates are written to the resulting report.
 const script='(()=>{try{const fixture='+JSON.stringify({location:fixture.location,theme:fixture.theme,priorMapIntent:fixture.priorMapIntent})+';'+
  'localStorage.setItem("mid:lastLocation",JSON.stringify(fixture.location));'+
  'localStorage.setItem("theme",fixture.theme);'+
  'localStorage.setItem("mid:last-dashboard-section:v1",fixture.priorMapIntent?"composite":"current");'+
  '}catch(e){window.__midQaSetupError=true}'+
  'document.addEventListener("pointerdown",e=>{const el=e.target?.closest?.("button");'+
  'if(el?.closest?.("nav[aria-label=\\"Hauptnavigation\\"]")&&'+
  '/(^|\\s)Karten($|\\s)/u.test((el.innerText||el.textContent||"").trim()))window.__midQaMapPointerAt=performance.now()},{capture:true});'+
  '})()';
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:script});
 const samples=[await sample('cold'),await sample('warm')];
 const report=assembleFullAppEvidence({identity,browserVersion,fixtureSha256:fixture.fixtureSha256,samples});
 await mkdir('artifacts',{recursive:true});
 await writeFile('artifacts/mid-design16-full-app-chromium-lab.json',JSON.stringify(report,null,2)+'\n');
 console.log('MID_DESIGN16_REAL_APP_LAB '+JSON.stringify({sha:identity.sourceGitSha,status:report.status,
  cold:report.samples[0].firstMapPointerToVisibleMs,warm:report.samples[1].firstMapPointerToVisibleMs,
  releaseAuthorized:false,fullAppAbProven:false}));
}finally{
 if(ws){try{ws.close()}catch{}}
 for(const p of pending.values())clearTimeout(p.timer);pending.clear();
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const closing=once(chrome,'close');chrome.kill('SIGTERM');
  await Promise.race([closing,sleep(2000)]);
  if(chrome.exitCode===null&&chrome.signalCode===null){chrome.kill('SIGKILL');await Promise.race([closing,sleep(1000)])}
 }
 if(server)await new Promise(ok=>server.close(ok));
 if(profile)await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
