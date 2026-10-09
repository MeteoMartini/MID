#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {mkdir,readFile,rename,rm,stat,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function argument(name,fallback=''){const index=process.argv.indexOf(`--${name}`);return index>=0?String(process.argv[index+1]??''):fallback}
const rawUrl=argument('url'),output=path.resolve(argument('output')),
 width=Math.max(700,Number(argument('width','1500'))||1500),height=Math.max(700,Number(argument('height','1200'))||1200),
 timeoutMs=Math.max(30000,(Number(argument('timeout','180'))||180)*1000);
if(!rawUrl||!output)throw new Error('Aufruf: node capture-widget.mjs --url <MID-Widget-URL> --output <PNG-Datei>');
const url=new URL(rawUrl);url.hostname='www.midwx.app';url.searchParams.set('farben','ecmwf');url.searchParams.set('_mid_widget_refresh',String(Date.now()));

const requestedBrowser=argument('browser',process.env.MID_WIDGET_BROWSER||'').trim();
const platformCandidates=process.platform==='win32'?[
 path.join(process.env['PROGRAMFILES(X86)']||'', 'Microsoft','Edge','Application','msedge.exe'),
 path.join(process.env.PROGRAMFILES||'', 'Microsoft','Edge','Application','msedge.exe'),
 path.join(process.env.LOCALAPPDATA||'', 'Microsoft','Edge','Application','msedge.exe'),
 path.join(process.env.PROGRAMFILES||'', 'Google','Chrome','Application','chrome.exe'),
 path.join(process.env['PROGRAMFILES(X86)']||'', 'Google','Chrome','Application','chrome.exe')
]:process.platform==='darwin'?[
 '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
 '/Applications/Chromium.app/Contents/MacOS/Chromium'
]:[
 '/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',
 '/usr/bin/microsoft-edge-stable','/usr/bin/microsoft-edge'
];
const browserCandidates=[requestedBrowser,...platformCandidates].filter((candidate,index,all)=>candidate&&all.indexOf(candidate)===index);
const browserExecutable=browserCandidates.find(candidate=>existsSync(candidate));
if(!browserExecutable)throw new Error(`Kein Chromium-kompatibler Browser gefunden. Geprüft: ${browserCandidates.join(', ')}`);

const profile=path.join(os.tmpdir(),`mid-widget-browser-${process.pid}-${Date.now()}`),activePort=path.join(profile,'DevToolsActivePort');
await mkdir(profile,{recursive:true});
const browserArgs=[
 '--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run',
 '--disable-features=msEdgeFirstRunExperience','--hide-scrollbars',`--window-size=${width},${height}`
];
if(process.platform==='linux')browserArgs.push('--no-sandbox','--disable-dev-shm-usage');
browserArgs.push(url.toString());
let browserFailure=null,browserStderr='',closing=false;
const browser=spawn(browserExecutable,browserArgs,{stdio:['ignore','ignore','pipe'],windowsHide:true});
browser.stderr?.on('data',chunk=>{browserStderr=(browserStderr+String(chunk)).slice(-8000)});
browser.once('error',error=>{if(!closing)browserFailure=new Error(`Browser konnte nicht gestartet werden: ${error.message}`)});
browser.once('exit',(code,signal)=>{if(!closing)browserFailure=new Error(`Browser wurde vorzeitig beendet (Code ${code??'null'}, Signal ${signal??'none'}).${browserStderr?'\n'+browserStderr:''}`)});

const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function waitFor(test,description){const deadline=Date.now()+timeoutMs;let lastError;while(Date.now()<deadline){if(browserFailure)throw browserFailure;try{const result=await test();if(result)return result}catch(error){lastError=error}await sleep(250)}if(browserFailure)throw browserFailure;throw new Error(`${description} (${lastError?.message||'Zeitüberschreitung'})`)}

class Cdp{
 constructor(socket){this.socket=socket;this.sequence=0;this.pending=new Map();socket.addEventListener('message',event=>{let message;try{message=JSON.parse(String(event.data))}catch{return}const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result)});socket.addEventListener('close',()=>{for(const pending of this.pending.values())pending.reject(new Error('Browser-Debuggingverbindung wurde geschlossen.'));this.pending.clear()})}
 static async connect(address){const socket=new WebSocket(address);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',()=>reject(new Error('Browser-Debuggingverbindung fehlgeschlagen.')),{once:true})});return new Cdp(socket)}
 call(method,params={}){const id=++this.sequence;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}))})}
 close(){this.socket.close()}
}

let cdp;
const startedAt=Date.now();
const failures=[];
try{
 console.log(`Widget-Renderer: ${browserExecutable}`);
 const port=await waitFor(async()=>{if(!existsSync(activePort))return 0;const value=Number(String(await readFile(activePort,'utf8')).split(/\r?\n/)[0]);return Number.isFinite(value)&&value>0?value:0},'Browser-Debuggingport wurde nicht bereitgestellt');
 const target=await waitFor(async()=>{const response=await fetch(`http://127.0.0.1:${port}/json/list`),targets=await response.json();return targets.find(item=>item.type==='page'&&String(item.url).includes('widget='))},'MID-Widgetseite wurde im Browser nicht geöffnet');
 cdp=await Cdp.connect(target.webSocketDebuggerUrl);
 await cdp.call('Runtime.enable');await cdp.call('Page.enable');
 cdp.socket.addEventListener('message',event=>{try{const message=JSON.parse(String(event.data));if(message.method==='Network.loadingFailed'&&failures.length<40)failures.push({type:message.params?.type,error:message.params?.errorText,canceled:message.params?.canceled})}catch{}});
 await cdp.call('Network.enable');
 const ready=await waitFor(async()=>{const result=await cdp.call('Runtime.evaluate',{expression:`(()=>({ready:document.documentElement.dataset.midWidgetReady==='ready',error:document.documentElement.dataset.midWidgetError||document.querySelector('.error')?.textContent||'',text:document.body.innerText.slice(0,240)}))()`,returnByValue:true});const value=result.result?.value;if(value?.error)return value;return value?.ready?value:null},'MID meldet das Widget nicht als vollständig gerendert');
 if(ready.error)throw new Error(ready.error);
 const measured=await cdp.call('Runtime.evaluate',{expression:`(()=>{const node=document.querySelector('.weatherwidget');if(!node)return null;const box=node.getBoundingClientRect();return{x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.ceil(Math.max(box.width,node.scrollWidth)),height:Math.ceil(Math.max(box.height,node.scrollHeight))}})()`,returnByValue:true});
 const box=measured.result?.value;if(!box||box.width<100||box.height<100)throw new Error(`Widget-Abmessungen sind unplausibel: ${JSON.stringify(box)}; ${ready.text||''}`);
 const screenshot=await cdp.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x:box.x,y:box.y,width:box.width,height:box.height,scale:1}}),bytes=Buffer.from(screenshot.data,'base64');
 if(bytes.length<20000||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw new Error(`Ungültiger oder leerer Screenshot (${bytes.length} Byte).`);
 await mkdir(path.dirname(output),{recursive:true});const temporary=`${output}.part.png`;await writeFile(temporary,bytes);await rm(output,{force:true});await rename(temporary,output);const result=await stat(output);console.log(`Aktualisiert: ${output} (${result.size} Byte, ${box.width}×${box.height}px, ECMWF-Farben)`);
}catch(error){
 // Keep the FIRST failure across retries; never capture cookies, headers or URL queries.
 const diagnosticBase=path.join(path.dirname(output),'diagnostics',path.basename(output)),report=`${diagnosticBase}.first-failure.json`,image=`${diagnosticBase}.first-failure.png`;
 if(!existsSync(report)){
  await mkdir(path.dirname(report),{recursive:true});
  let state=null,screenshotError=null;
  if(cdp){
   try{const result=await cdp.call('Runtime.evaluate',{expression:`(()=>({status:document.documentElement.dataset.midWidgetReady||'absent',version:document.querySelector('meta[name="mid-version"]')?.content||null,dataFrom:document.documentElement.dataset.midWidgetDataFrom||null,dataThrough:document.documentElement.dataset.midWidgetDataThrough||null,widgetCount:document.querySelectorAll('.weatherwidget').length,imageCount:document.querySelector('.weatherwidget')?.querySelectorAll('img').length||0}))()`,returnByValue:true});state=result.result?.value??null}catch{}
   try{const shot=await cdp.call('Page.captureScreenshot',{format:'png',fromSurface:true});await writeFile(image,Buffer.from(shot.data,'base64'))}catch{screenshotError='Screenshot nicht verfügbar';}
  }
  await writeFile(report,JSON.stringify({schema:1,checkedAt:new Date().toISOString(),elapsedMs:Date.now()-startedAt,stableSha:process.env.MID_STABLE_SHA||null,expectedVersion:process.env.MID_PUBLIC_VERSION||null,state,networkFailures:failures,screenshotAvailable:existsSync(image),screenshotError,errorClass:error?.name||'Error'},null,2)+'\n');
 }
 throw error;
}finally{
 closing=true;try{await cdp?.call('Browser.close')}catch{}try{cdp?.close()}catch{}browser.kill();await rm(profile,{recursive:true,force:true}).catch(()=>undefined);
}
