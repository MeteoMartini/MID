import assert from 'node:assert/strict';import{createServer}from'node:http';import{readFileSync,writeFileSync}from'node:fs';import{execFileSync}from'node:child_process';import{createRequire}from'node:module';import{dirname,join}from'node:path';import{createHash}from'node:crypto';import{verifiedBrandGroups}from'./brand-shell-groups.mjs';
const baseline=execFileSync('git',['show','7e998730daaa4a409cd3e15d4f4cf0f70efaaeda:public/service-worker.js'],{encoding:'utf8'}),candidate=readFileSync('public/service-worker.js','utf8'),version=JSON.parse(readFileSync('package.json')).version;
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:15000}).trim(),{chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
let mode='baseline',corrupt=false;const transfers=[];
const server=createServer((req,res)=>{const path=new URL(req.url,'http://localhost').pathname;res.setHeader('Cache-Control','no-store');let body;
 if(path==='/service-worker.js'){res.setHeader('Content-Type','text/javascript');body=mode==='baseline'?baseline:mode==='corrupt'?candidate.replaceAll('mid-shell-v'+version,'mid-shell-v0.9.85.428'):candidate}
 else if(path==='/'||path==='/index.html'){res.setHeader('Content-Type','text/html');body=`<!doctype html><html><head><meta name="mid-version" content="${mode==='baseline'?'0.9.85.425':mode==='corrupt'?'0.9.85.428':version}"></head><body><img id="logo" alt="MID"></body></html>`}
 else if(path==='/version.json'){res.setHeader('Content-Type','application/json');body=JSON.stringify({version:mode==='baseline'?'0.9.85.425':mode==='corrupt'?'0.9.85.428':version})}
 else{try{body=readFileSync('public'+path);if(path.endsWith('.png')){res.setHeader('Content-Type','image/png');if(corrupt&&path==='/mid-icon-512.png')body=Buffer.from('corrupt');transfers.push({path,bytes:body.length})}}catch{res.statusCode=404;body='missing'}}res.end(body)});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`;const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const install=async page=>{await page.goto(url);await page.evaluate(async()=>{await navigator.serviceWorker.register('/service-worker.js');await Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(Error('install timeout')),15000))])});await page.reload()};
const message=async(page,command)=>page.evaluate(command=>new Promise((resolve,reject)=>{const channel=new MessageChannel(),timer=setTimeout(()=>reject(Error('message timeout')),10000);channel.port1.onmessage=e=>{clearTimeout(timer);resolve(e.data)};navigator.serviceWorker.controller.postMessage({type:command},[channel.port2])}),command);
const verifyOffline=async(context,page,cacheVersion)=>{
 const expected=Object.fromEntries(verifiedBrandGroups().flatMap(g=>g.urls.map(name=>[name,g.sha256]))),count=transfers.length;
 await context.setOffline(true);
 await page.evaluate(async({expected,cacheVersion})=>{const cache=await caches.open('mid-shell-v'+cacheVersion);for(const [name,sha]of Object.entries(expected)){const response=await cache.match(new URL(name,location.href));if(!response)throw Error('missing cache URL '+name);const bytes=await response.arrayBuffer(),actual=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(actual!==sha)throw Error('changed bytes '+name);const img=document.getElementById('logo');img.src=name;await img.decode()}for(const name of ['mid-logo-light.png','mid-logo-dark.png']){const image=document.getElementById('logo');image.src=name;await image.decode();if(image.naturalWidth<=0)throw Error('theme decode failed')}},{expected,cacheVersion});
 assert.equal(transfers.length,count,'Offline/logo switches may not transfer PNG bytes');await context.setOffline(false);
};
try{
 const oldContext=await browser.newContext(),oldPage=await oldContext.newPage();transfers.length=0;await install(oldPage);const before=[...transfers];await verifyOffline(oldContext,oldPage,'0.9.85.425');await oldContext.close();
 mode='candidate';const context=await browser.newContext(),page=await context.newPage();transfers.length=0;await install(page);const after=[...transfers];await verifyOffline(context,page,version);
 assert.equal(before.length-after.length,6);assert.ok(before.reduce((s,r)=>s+r.bytes,0)>after.reduce((s,r)=>s+r.bytes,0));
 // Controlled prior-cache fixture: exercise actual update/rollback message handlers
 // without claiming a browser registration lifecycle measurement.
 await page.evaluate(async version=>{
  const current=await caches.open('mid-shell-v'+version),prior=await caches.open('mid-shell-v0.9.85.425');
  for(const request of await current.keys()){
   const response=await current.match(request),path=new URL(request.url).pathname;
   if(path==='/'||path==='/index.html')await prior.put(request,new Response((await response.text()).replaceAll(version,'0.9.85.425'),{headers:{'content-type':'text/html'}}));
   else if(path==='/version.json'||path==='/__mid_shell_valid__.json')await prior.put(request,new Response(JSON.stringify({...await response.json(),version:'0.9.85.425'}),{headers:{'content-type':'application/json'}}));
   else await prior.put(request,response.clone());
  }
  const meta=await caches.open('mid-system-meta-v1');await meta.put(new URL('__mid_system_meta__.json',location.href),new Response(JSON.stringify({activeCache:'mid-shell-v0.9.85.425',healthyVersion:'0.9.85.425'})));
 },version);
 assert.equal((await message(page,'MID_USE_CURRENT')).ok,true);
 assert.equal((await message(page,'MID_GET_STATUS')).status.activeVersion,version);
 assert.equal((await message(page,'MID_ROLLBACK')).ok,true);await verifyOffline(context,page,'0.9.85.425');
 assert.equal((await message(page,'MID_USE_CURRENT')).ok,true);assert.equal((await message(page,'MID_RUNTIME_HEALTHY')).ok,true);
 corrupt=true;assert.equal((await message(page,'MID_REPAIR_CACHE')).ok,false);
 assert.equal(await page.evaluate(version=>caches.has('mid-shell-v'+version),version),false);
 assert.equal(await page.evaluate(()=>caches.has('mid-shell-v0.9.85.425')),true);
 assert.equal((await message(page,'MID_ROLLBACK')).ok,true);await verifyOffline(context,page,'0.9.85.425');
 const report={kind:'real Chromium ServiceWorker over local HTTP; PNG response-body bytes, not protocol headers or timing',baseline:{requests:before.length,bytes:before.reduce((s,r)=>s+r.bytes,0),transfers:before},candidate:{requests:after.length,bytes:after.reduce((s,r)=>s+r.bytes,0),transfers:after},savedRequests:before.length-after.length,savedBytes:before.reduce((s,r)=>s+r.bytes,0)-after.reduce((s,r)=>s+r.bytes,0),checks:['cold install','all alias URLs offline SHA256-identical','light/dark decode','update/cache activation and rollback handlers with seeded prior-cache fixture','corrupt canonical rejection and prior cache retained']};
 console.log(JSON.stringify(report,null,2));if(process.env.MID_BRAND_REPORT)writeFileSync(process.env.MID_BRAND_REPORT,JSON.stringify(report,null,2)+'\n');
}finally{await browser.close();await new Promise(r=>server.close(r))}
