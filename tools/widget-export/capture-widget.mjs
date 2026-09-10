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

const edgeCandidates=process.platform==='win32'?[
 path.join(process.env['PROGRAMFILES(X86)']||'', 'Microsoft','Edge','Application','msedge.exe'),
 path.join(process.env.PROGRAMFILES||'', 'Microsoft','Edge','Application','msedge.exe'),
 path.join(process.env.LOCALAPPDATA||'', 'Microsoft','Edge','Application','msedge.exe')
]:['/usr/bin/microsoft-edge','/usr/bin/microsoft-edge-stable','/usr/bin/google-chrome','/usr/bin/chromium'];
const edge=edgeCandidates.find(candidate=>candidate&&existsSync(candidate));
if(!edge)throw new Error('Microsoft Edge wurde nicht gefunden.');

const profile=path.join(os.tmpdir(),`mid-widget-edge-${process.pid}-${Date.now()}`),activePort=path.join(profile,'DevToolsActivePort');
await mkdir(profile,{recursive:true});
const browser=spawn(edge,[
 '--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run',
 '--disable-features=msEdgeFirstRunExperience','--hide-scrollbars',`--window-size=${width},${height}`,url.toString()
],{stdio:'ignore',windowsHide:true});

const sleep=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
async function waitFor(test,description){const deadline=Date.now()+timeoutMs;let lastError;while(Date.now()<deadline){try{const result=await test();if(result)return result}catch(error){lastError=error}await sleep(250)}throw new Error(`${description} (${lastError?.message||'Zeitüberschreitung'})`)}

class Cdp{
 constructor(socket){this.socket=socket;this.sequence=0;this.pending=new Map();socket.addEventListener('message',event=>{let message;try{message=JSON.parse(String(event.data))}catch{return}const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);message.error?pending.reject(new Error(message.error.message)):pending.resolve(message.result)});socket.addEventListener('close',()=>{for(const pending of this.pending.values())pending.reject(new Error('Edge-Debuggingverbindung wurde geschlossen.'));this.pending.clear()})}
 static async connect(address){const socket=new WebSocket(address);await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',()=>reject(new Error('Edge-Debuggingverbindung fehlgeschlagen.')),{once:true})});return new Cdp(socket)}
 call(method,params={}){const id=++this.sequence;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.socket.send(JSON.stringify({id,method,params}))})}
 close(){this.socket.close()}
}

let cdp;
try{
 const port=await waitFor(async()=>{if(!existsSync(activePort))return 0;const value=Number(String(await readFile(activePort,'utf8')).split(/\r?\n/)[0]);return Number.isFinite(value)&&value>0?value:0},'Edge-Debuggingport wurde nicht bereitgestellt');
 const target=await waitFor(async()=>{const response=await fetch(`http://127.0.0.1:${port}/json/list`),targets=await response.json();return targets.find(item=>item.type==='page'&&String(item.url).includes('widget='))},'MID-Widgetseite wurde in Edge nicht geöffnet');
 cdp=await Cdp.connect(target.webSocketDebuggerUrl);
 await cdp.call('Runtime.enable');await cdp.call('Page.enable');
 const ready=await waitFor(async()=>{const result=await cdp.call('Runtime.evaluate',{expression:`(()=>({ready:document.documentElement.dataset.midWidgetReady==='ready',error:document.querySelector('.error')?.textContent||'',text:document.body.innerText.slice(0,240)}))()`,returnByValue:true});const value=result.result?.value;if(value?.error)throw new Error(value.error);return value?.ready?value:null},'MID meldet das Widget nicht als vollständig gerendert');
 const measured=await cdp.call('Runtime.evaluate',{expression:`(()=>{const node=document.querySelector('.weatherwidget');if(!node)return null;const box=node.getBoundingClientRect();return{x:Math.max(0,box.x),y:Math.max(0,box.y),width:Math.ceil(Math.max(box.width,node.scrollWidth)),height:Math.ceil(Math.max(box.height,node.scrollHeight))}})()`,returnByValue:true});
 const box=measured.result?.value;if(!box||box.width<100||box.height<100)throw new Error(`Widget-Abmessungen sind unplausibel: ${JSON.stringify(box)}; ${ready.text||''}`);
 const screenshot=await cdp.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:true,clip:{x:box.x,y:box.y,width:box.width,height:box.height,scale:1}}),bytes=Buffer.from(screenshot.data,'base64');
 if(bytes.length<20000||bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw new Error(`Ungültiger oder leerer Screenshot (${bytes.length} Byte).`);
 await mkdir(path.dirname(output),{recursive:true});const temporary=`${output}.part.png`;await writeFile(temporary,bytes);await rm(output,{force:true});await rename(temporary,output);const result=await stat(output);console.log(`Aktualisiert: ${output} (${result.size} Byte, ${box.width}×${box.height}px, ECMWF-Farben)`);
}finally{
 try{await cdp?.call('Browser.close')}catch{}try{cdp?.close()}catch{}browser.kill();await rm(profile,{recursive:true,force:true}).catch(()=>undefined);
}
