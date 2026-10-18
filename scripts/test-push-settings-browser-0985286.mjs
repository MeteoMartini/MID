import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {access,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {createServer as createPortServer} from 'node:net';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {localCdpEndpoint} from './local-cdp-endpoint.mjs';
let chromePath;for(const p of [process.env.CHROMIUM_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/repl/tools/bin/chromium'].filter(Boolean)){try{await access(p);chromePath=p;break}catch{}}
if(!chromePath){if(process.env.GITHUB_ACTIONS==='true')throw new Error('Push browser regression requires Chromium in CI');console.log('SKIP Push-Browsermatrix: lokales Chromium fehlt; keine Browserabnahme behaupten.');process.exit(0)}
const temp=await mkdtemp(join(tmpdir(),'mid-push-ui-')),pending=new Map(),errors=[];let server,chrome,socket,sessionId,seq=0;
const wait=async(check,label)=>{const end=Date.now()+12000;while(Date.now()<end){if(await check())return;await new Promise(r=>setTimeout(r,80))}throw new Error('Timeout: '+label)};
const cdp=(method,params={},session=sessionId)=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method))},12000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}))});
const evaluate=async expression=>{const p=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(p.result.exceptionDetails)throw new Error(JSON.stringify(p.result.exceptionDetails));return p.result.result?.value};
const port=()=>new Promise((resolve,reject)=>{const s=createPortServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(e=>e?reject(e):resolve(p))})});
const mock=`let mode='relative',serverMode='relative';window.__pushPending=[];window.__pushDenied=false;
export const readPushTimeDisplayMode=()=>mode;
export const writePushTimeDisplayMode=m=>{if(window.__pushDenied)return false;mode=m;return true};
export const getPushStatus=async()=>({supported:true,permission:'granted',configured:true,subscribed:true,serverRegistered:true,schedulerHealthy:true,activeFavorites:1,activeRules:1,operational:true,workerUrl:'fixture',message:'Fixture: bereit',timeDisplayMode:window.__pushStatusLag?'relative':serverMode});
export const syncPushNotifications=()=>{const captured=mode;return new Promise(resolve=>window.__pushPending.push(value=>{if(value)serverMode=captured;resolve(value)}))};
export const enablePushNotifications=async()=>{},disablePushNotifications=async()=>{},sendPushTestNotification=async()=>true;`;
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{PushSettingsPanel}from'./src/PushSettingsPanel';const noop=()=>{};createRoot(document.getElementById('root')).render(<div className="settings-dialog" data-settings-mode="standard"><div className="settings-content"><PushSettingsPanel favorites={[]} onRuleChange={noop} locationTracking={false} trackedLocation={null} trackedRules={{precipitationStart:false,thunderstormApproach:false}} onTrackedRuleChange={noop} modelChangeLocation={null} modelChangeAvailable={false} modelChangeNotificationEnabled={false} onModelChangeNotificationChange={noop} notificationIntervalMinutes={30} onNotificationIntervalChange={noop} precipitationAlert={{leadMinutes:60,minimumAmountMm:.1,minimumDurationMinutes:0}} onPrecipitationAlertChange={noop} advancedMode={false}/></div></div>);`;
try{
 await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'browser',format:'esm',outfile:join(temp,'fixture.js'),jsx:'automatic',logLevel:'silent',plugins:[{name:'mock-push-boundary',setup(b){b.onResolve({filter:/^\.\/pushNotifications$/},()=>({path:'mock',namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:mock,loader:'js'}))}}]});
 const js=await readFile(join(temp,'fixture.js')),css=await readFile('src/midPresentation.css');
 server=createServer((req,res)=>{if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(js)}else if(req.url==='/presentation.css'){res.setHeader('Content-Type','text/css');res.end(css)}else if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/presentation.css"><div id="root"></div><script type="module" src="/fixture.js"></script>')}else{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 const debugPort=await port();chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port='+debugPort,'--user-data-dir='+join(temp,'profile'),'about:blank'],{stdio:'ignore'});
 let info;await wait(async()=>{try{const r=await fetch('http://127.0.0.1:'+debugPort+'/json/version');if(r.ok){info=await r.json();return true}}catch{}return false},'Chromium');
 socket=new WebSocket(localCdpEndpoint(info.webSocketDebuggerUrl,debugPort));socket.addEventListener('message',event=>{const p=JSON.parse(String(event.data));if(p.id){const q=pending.get(p.id);if(!q)return;clearTimeout(q.timer);pending.delete(p.id);p.error?q.reject(new Error(p.error.message)):q.resolve(p)}else if(p.method==='Runtime.exceptionThrown')errors.push(p.params.exceptionDetails)});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 const target=await cdp('Target.createTarget',{url:'about:blank'},null),attached=await cdp('Target.attachToTarget',{targetId:target.result.targetId,flatten:true},null);sessionId=attached.result.sessionId;await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const selector='select[aria-label="Zeitanzeige der Niederschlagsbenachrichtigungen"]';
 for(const[width,height]of[[320,740],[390,844],[844,390],[768,1024],[1024,768],[1440,1000]])for(const theme of ['light','dark']){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1025});await cdp('Page.navigate',{url});await wait(()=>evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`),'Push settings');
  await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center'});true`);
  const geometry=await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)}),r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return{page:document.documentElement.scrollWidth,viewport:innerWidth,left:r.left,right:r.right,width:r.width,height:r.height,hit:hit===e||e.contains(hit)}})()`);
  assert(geometry.page<=width+1,`horizontal overflow ${width} ${theme}: ${JSON.stringify(geometry)}`);assert(geometry.width>=44&&geometry.height>=44,`touch target ${width}: ${JSON.stringify(geometry)}`);assert(geometry.left>=-1&&geometry.right<=width+1&&geometry.hit,`unreachable select ${width} ${theme}`);
  const choose=mode=>evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});e.value=${JSON.stringify(mode)};e.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  await choose('absolute');await wait(()=>evaluate('window.__pushPending.length===1'),'first preference');await choose('relative');await wait(()=>evaluate('window.__pushPending.length===2'),'second preference');
  await evaluate('window.__pushPending[1](true);true');await wait(()=>evaluate(`document.querySelector('.push-message')?.textContent.includes('serverseitig bestätigt')`),'newest confirmation');await evaluate('window.__pushPending[0](false);true');
  assert.match(await evaluate("document.querySelector('.push-message').textContent"),/serverseitig bestätigt/,'older completion must not overwrite newest UI confirmation');
  await evaluate('window.__pushStatusLag=true;true');await choose('absolute');await wait(()=>evaluate('window.__pushPending.length===3'),'propagation delay');await evaluate('window.__pushPending[2](true);true');await wait(()=>evaluate("document.querySelector('.push-message')?.textContent.includes('Statusbestätigung ausstehend')"),'acknowledged but stale status stays pending');await evaluate('window.__pushStatusLag=false;true');
  await choose('relative');await wait(()=>evaluate('window.__pushPending.length===4'),'inactive subscription');await evaluate('window.__pushPending[3](false);true');await wait(()=>evaluate("document.querySelector('.push-message')?.textContent.includes('noch nicht aktiviert')"),'explicit no-subscription state');
  await evaluate('window.__pushDenied=true;true');await choose('absolute');await wait(()=>evaluate("document.querySelector('.push-message')?.textContent.includes('nicht gespeichert')"),'storage error');assert.equal(await evaluate(`document.querySelector(${JSON.stringify(selector)}).value`),'relative');
  if(width===390){const shot=await cdp('Page.captureScreenshot',{format:'png'});await writeFile(join(temp,theme+'-push.png'),Buffer.from(shot.result.data,'base64'))}
  console.log(`Push-Browsermatrix ${width}×${height} ${theme}: no overflow, 44px touch/select hit, newest-choice confirmation, no-abo and storage-failure states.`);
 }
 assert.deepEqual(errors,[],'browser exceptions');
}finally{
 if(socket)socket.close();for(const q of pending.values())clearTimeout(q.timer);
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const closed=once(chrome,'close');chrome.kill('SIGTERM');
  const deadline=setTimeout(()=>chrome.kill('SIGKILL'),5000);deadline.unref();
  try{await closed}finally{clearTimeout(deadline)}
 }
 if(server)await new Promise(r=>server.close(r));
 await rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
