import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {verifiedBrandGroups} from './brand-shell-groups.mjs';
const oldVersion='0.9.85.425',version=JSON.parse(readFileSync('package.json')).version,badVersion=version+'.bad';
const oldWorker=execFileSync('git',['show','7e998730daaa4a409cd3e15d4f4cf0f70efaaeda:public/service-worker.js'],{encoding:'utf8'}),worker=readFileSync('public/service-worker.js','utf8');
const cli=execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:15000}).trim(),{chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));
let current=oldVersion;const transfers=[];
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;res.setHeader('cache-control','no-store');let body;
 if(path==='/service-worker.js'){res.setHeader('content-type','text/javascript');body=current===oldVersion?oldWorker:current===badVersion?worker.replace('mid-shell-v'+version,'mid-shell-v'+badVersion):worker}
 else if(path==='/'||path==='/index.html'){res.setHeader('content-type','text/html');body=`<!doctype html><html><head><meta name="mid-version" content="${current}"></head><body><img id="logo" alt="MID"><b id="shell">${current}</b></body></html>`}
 else if(path==='/version.json'){res.setHeader('content-type','application/json');body=JSON.stringify({version:current})}
 else{try{body=readFileSync('public'+path);if(path.endsWith('.png')){res.setHeader('content-type','image/png');if(current===badVersion&&path==='/mid-icon-512.png')body=Buffer.from('corrupt canonical download');transfers.push({version:current,path,bytes:body.length})}}catch{res.statusCode=404;body='missing'}}res.end(body);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext(),page=await context.newPage();page.setDefaultTimeout(15000);
const msg=async(type)=>page.evaluate(type=>new Promise((resolve,reject)=>{const c=new MessageChannel(),t=setTimeout(()=>reject(Error('message deadline '+type)),10000);c.port1.onmessage=e=>{clearTimeout(t);resolve(e.data)};navigator.serviceWorker.controller.postMessage({type},[c.port2])}),type);
try{
 await page.goto(origin);
 const install=await page.evaluate(async()=>{
  const events=[];let changed;const controller=new Promise(r=>changed=r);navigator.serviceWorker.addEventListener('controllerchange',()=>{events.push('controllerchange');changed()},{once:true});
  const reg=await navigator.serviceWorker.register('/service-worker.js',{updateViaCache:'none'});
  const observe=worker=>{if(!worker)return;events.push(worker.state);worker.addEventListener('statechange',()=>events.push(worker.state))};observe(reg.installing);reg.addEventListener('updatefound',()=>observe(reg.installing));
  await Promise.race([Promise.all([navigator.serviceWorker.ready,controller]),new Promise((_,reject)=>setTimeout(()=>reject(Error('initial install deadline')),15000))]);
  if(reg.active.state!=='activated')await new Promise(resolve=>reg.active.addEventListener('statechange',()=>{if(reg.active.state==='activated')resolve()}));
  return {events,active:reg.active.state,waiting:Boolean(reg.waiting)};
 });
 assert.equal(install.active,'activated');assert.equal(install.waiting,false);assert.equal((await msg('MID_RUNTIME_HEALTHY')).ok,true);
 console.log('PASS real .425 install/controller',JSON.stringify(install));
 current=version;
 // Attach before registration.update; keep the actual installing object. No polling,
 // no waitForFunction(async), and no copied/seeded CacheStorage entries.
 const update=await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.getRegistration(),events=[];
  const installed=new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('update install deadline '+JSON.stringify(events))),20000);
   reg.addEventListener('updatefound',()=>{const worker=reg.installing;events.push('updatefound:'+worker.state);worker.addEventListener('statechange',()=>{events.push(worker.state);if(worker.state==='installed'){clearTimeout(timer);window.actualWaiting=worker;resolve()}if(worker.state==='redundant'){clearTimeout(timer);reject(Error('unexpected failed update'))}})},{once:true});
  });
  await reg.update();await installed;
  return {events,workerState:window.actualWaiting.state,waiting:reg.waiting?.state,oldCache:await caches.has('mid-shell-v0.9.85.425')};
 });
 assert.equal(update.workerState,'installed');assert.equal(update.waiting,'installed');assert.equal(update.oldCache,true);assert.equal((await msg('MID_GET_STATUS')).status.activeVersion,oldVersion);
 await page.reload();assert.equal(await page.locator('#shell').innerText(),oldVersion,'Waiting update cannot replace the active shell');
 console.log('PASS real waiting update, old cache/shell retained',JSON.stringify(update));
 const activation=[];let sawController;const controllerSeen=new Promise(r=>sawController=r);await page.exposeFunction('midLifecycle',event=>{activation.push(event);if(event==='controllerchange')sawController()});
 const controllerChange=page.waitForEvent('framenavigated',{predicate:f=>f===page.mainFrame(),timeout:15000});
 await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.getRegistration(),worker=reg.waiting;if(!worker)throw Error('waiting worker missing');
  navigator.serviceWorker.addEventListener('controllerchange',()=>window.midLifecycle('controllerchange'),{once:true});
  worker.addEventListener('statechange',()=>window.midLifecycle(worker.state));
  worker.postMessage({type:'MID_ACTIVATE_UPDATE'});
 });
 await Promise.race([controllerSeen,new Promise((_,reject)=>setTimeout(()=>reject(Error('controllerchange deadline '+JSON.stringify(activation))),10000))]);
 console.log('Observed after controllerchange',JSON.stringify({activation,status:await msg('MID_GET_STATUS')}));
 try{await controllerChange}catch(error){console.log('Navigation failure state',JSON.stringify(await page.evaluate(async()=>({url:location.href,meta:await(await(await caches.open('mid-system-meta-v1')).match(new URL('__mid_system_meta__.json',location.href))).json(),active:(await navigator.serviceWorker.getRegistration()).active?.state,waiting:(await navigator.serviceWorker.getRegistration()).waiting?.state}))),JSON.stringify(activation));throw error}
 await page.waitForLoadState('load');
 const activeState=await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration(),w=r.active;if(w.state!=='activated')await new Promise(resolve=>w.addEventListener('statechange',()=>{if(w.state==='activated')resolve()}));return w.state});
 activation.push(activeState);assert.ok(activation.includes('activating'));assert.ok(activation.includes('controllerchange'));
 assert.equal(await page.locator('#shell').innerText(),version);assert.equal((await msg('MID_RUNTIME_HEALTHY')).status.activeVersion,version);
 console.log('PASS real activate/controllerchange/healthy shell',JSON.stringify(activation));

 const offline=async expectedVersion=>{
  const count=transfers.length;await context.setOffline(true);
  const groups=Object.fromEntries(verifiedBrandGroups().flatMap(g=>g.urls.map(name=>[name,g.sha256])));
  await page.evaluate(async({groups,expectedVersion})=>{const cache=await caches.open('mid-shell-v'+expectedVersion);for(const [name,sha]of Object.entries(groups)){const response=await cache.match(new URL(name,location.href));if(!response)throw Error('cache URL missing '+name);const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await response.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('');if(digest!==sha)throw Error('image changed '+name);const image=document.getElementById('logo');image.src=name;await image.decode()}},{groups,expectedVersion});
  assert.equal(transfers.length,count);await context.setOffline(false);
 };
 await offline(version);assert.equal((await msg('MID_ROLLBACK')).ok,true);await page.reload();assert.equal(await page.locator('#shell').innerText(),oldVersion);await offline(oldVersion);
 console.log('PASS actual previous-cache rollback and all alias/theme URLs offline');
 current=badVersion;
 const damaged=await page.evaluate(async()=>{
  const reg=await navigator.serviceWorker.getRegistration(),events=[];
  const failed=new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(Error('corrupt update deadline')),20000);reg.addEventListener('updatefound',()=>{const worker=reg.installing;events.push('updatefound');worker.addEventListener('statechange',()=>{events.push(worker.state);if(worker.state==='redundant'){clearTimeout(t);resolve()}})},{once:true})});
  await reg.update();await failed;return {events,waiting:Boolean(reg.waiting),oldCache:await caches.has('mid-shell-v0.9.85.425')};
 });
 assert.equal(damaged.waiting,false);assert.equal(damaged.oldCache,true);assert.equal(await page.evaluate(v=>caches.has('mid-shell-v'+v),badVersion),false);assert.equal((await msg('MID_GET_STATUS')).status.activeVersion,oldVersion);await offline(oldVersion);
 const report={oldVersion,version,install,update,activation,damaged,transfers,checks:'real registration/updatefound/installing/installed/waiting/activating/activated/controllerchange; healthy shell; offline themes/aliases; rollback; corrupt registration update rejected; no seeded caches'};
 if(process.env.MID_BRAND_UPDATE_REPORT)writeFileSync(process.env.MID_BRAND_UPDATE_REPORT,JSON.stringify(report,null,2)+'\n');console.log('PASS full real registration lifecycle',JSON.stringify({install,update,activation,damaged}));
}finally{await browser.close();await new Promise(r=>server.close(r))}
