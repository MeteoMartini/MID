import {readDevToolsPort,browserStartDiagnostics} from './browser-start-diagnostics.mjs';
import {callCdpFunction} from './cdp-call-function.mjs';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {access,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {localCdpEndpoint} from '../local-cdp-endpoint.mjs';
let chromePath;for(const p of [process.env.CHROMIUM_PATH,'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser','/repl/tools/bin/chromium'].filter(Boolean)){try{await access(p);chromePath=p;break}catch{}}
// The existing Draft preflight intentionally sets CI/GITHUB_ACTIONS=false but retains
// the actual GitHub run identity. Never allow a missing browser in a runner.
const browserRequired=process.env.GITHUB_ACTIONS==='true'||Boolean(process.env.GITHUB_RUN_ID)||Boolean(process.env.CI&&process.env.CI!=='false')||process.env.MID_BROWSER_QA==='1';
export const browserQaExecuted=Boolean(chromePath);
if(!chromePath){
 if(browserRequired)throw new Error('MID dialog regression requires Chromium in CI; no browser evidence without it');
 console.log('SKIP MID dialog browser QA: local Chromium missing; no browser evidence');
}else{
const temp=await mkdtemp(join(tmpdir(),'mid-dialog-ui-')),pending=new Map(),errors=[];let server,chrome,socket,sessionId,seq=0;
let startup;
const wait=async(check,label)=>{const end=Date.now()+12000;while(Date.now()<end){startup?.assertRunning();if(await check())return;await new Promise(r=>setTimeout(r,80))}throw new Error('Timeout: '+label+(label==='Chromium'?' · '+startup?.describe():''))};
const cdp=(method,params={},session=sessionId)=>new Promise((resolve,reject)=>{const id=++seq,timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method))},12000);pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}))});
const evaluate=async expression=>{const p=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(p.result.exceptionDetails)throw new Error(JSON.stringify(p.result.exceptionDetails));return p.result.result?.value};
const call=(declaration,...values)=>callCdpFunction(cdp,declaration,values);

/** Production React portal integration fixture; no remote weather requests or physical-device claim. */
const entry=`import React,{useState,useRef} from 'react';import{createRoot}from'react-dom/client';import{flushSync}from'react-dom';import{AppPortalPopover,AppPortalFullscreen}from'./src/AppPortalPopover';import{appLayerFocusEligibleElement}from'./src/appLayerFocusEligibility';
window.focusPolicy=id=>appLayerFocusEligibleElement(document.getElementById(id));
function Fixture(){const [open,setOpen]=useState(false),[inner,setInner]=useState(false),[which,setWhich]=useState('a');const a=useRef(null),b=useRef(null);const close=()=>{setInner(false);setOpen(false)};window.switchDialog=()=>{flushSync(close);b.current.focus();flushSync(()=>{setWhich('b');setOpen(true)})};return <><button id="trigger-a" ref={a} onClick={()=>{setWhich('a');setOpen(true)}}>A</button><button id="trigger-b" ref={b} onClick={()=>{setWhich('b');setOpen(true)}}>B</button><button id="outside">Outside</button><AppPortalPopover anchorRef={which==='a'?a:b} open={open} onClose={close} role="dialog" id="outer" ariaLabel="MID QA dialog"><div data-mid-autofocus>not focusable</div><h2 id="start" tabIndex={-1} data-mid-autofocus>Dialog</h2><button id="first">First</button><button id="disabled" disabled>Disabled</button><fieldset disabled><button id="fieldset-disabled">Disabled descendant</button></fieldset><div aria-hidden="true"><button id="hidden">Hidden</button></div><button id="nested" onClick={()=>setInner(true)}>Nested</button><button id="last">Last</button><AppPortalFullscreen open={inner} onClose={()=>setInner(false)} className="qa-sheet"><div id="inner-scroll" style={{height:150,overflow:'auto'}}><button id="inner-first" data-mid-autofocus>Inner first</button><div style={{height:500}}/><button id="inner-last">Inner last</button></div></AppPortalFullscreen></AppPortalPopover></>}
createRoot(document.getElementById('root')).render(<Fixture/>);`;
try{
 await build({stdin:{contents:entry,loader:'tsx',resolveDir:process.cwd()},bundle:true,platform:'browser',format:'esm',outfile:join(temp,'fixture.js'),jsx:'automatic',logLevel:'silent'});
 const js=await readFile(join(temp,'fixture.js')),css=await readFile('src/midPresentation.css');
 server=createServer((req,res)=>{if(req.url==='/fixture.js'){res.setHeader('Content-Type','text/javascript');res.end(js)}else if(req.url==='/presentation.css'){res.setHeader('Content-Type','text/css');res.end(css)}else if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/presentation.css"><style>.qa-sheet{position:fixed;inset:0;z-index:100000;background:Canvas;padding:12px}#outer{box-sizing:border-box;max-height:var(--mid-popover-viewport-max-height);overflow:auto}button{min-height:44px}</style><div id="root"></div><script type="module" src="/fixture.js"></script>')}else{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 let debugPort,info;const chromeStartupFailures=[];
 for(let attempt=1;attempt<=2;attempt++){
  const profile=join(temp,`profile-${attempt}`);
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
  startup=browserStartDiagnostics(chrome);
  try{
   await wait(async()=>{try{debugPort=await readDevToolsPort(join(profile,'DevToolsActivePort'));if(!debugPort)return false;const r=await fetch('http://127.0.0.1:'+debugPort+'/json/version',{signal:AbortSignal.timeout(1000)});if(r.ok){info=await r.json();return true}}catch{}return false},'Chromium');
   break;
  }catch(error){
   chromeStartupFailures.push(`Versuch ${attempt}: ${error.message}`);
   if(chrome?.pid&&chrome.exitCode===null&&chrome.signalCode===null){
    const closed=once(chrome,'close');chrome.kill('SIGTERM');
    const deadline=setTimeout(()=>chrome.kill('SIGKILL'),2000);deadline.unref();
    try{await closed}finally{clearTimeout(deadline)}
   }
   await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
   if(attempt===2)throw new Error(`Isolierter Chromium-Start zweimal fehlgeschlagen (jeweils 12s, keine UI-Assertion übersprungen): ${chromeStartupFailures.join(' | ')}`);
  }
 }
 socket=new WebSocket(localCdpEndpoint(info.webSocketDebuggerUrl,debugPort));socket.addEventListener('message',event=>{const p=JSON.parse(String(event.data));if(p.id){const q=pending.get(p.id);if(!q)return;clearTimeout(q.timer);pending.delete(p.id);p.error?q.reject(new Error(p.error.message)):q.resolve(p)}else if(p.method==='Runtime.exceptionThrown')errors.push(p.params.exceptionDetails)});await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 const target=await cdp('Target.createTarget',{url:'about:blank'},null),attached=await cdp('Target.attachToTarget',{targetId:target.result.targetId,flatten:true},null);sessionId=attached.result.sessionId;await cdp('Page.enable');await cdp('Runtime.enable');await cdp('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});

 const focus=async id=>{await wait(()=>evaluate('document.activeElement?.id==='+JSON.stringify(id)),'focus '+id)};
 const click=async id=>{await call("function(id){const e=document.getElementById(id);e.focus();e.click();return true}",id)};
 const key=async (key,shift=false)=>{const code=key==='Tab'?9:27;for(const type of ['keyDown','keyUp'])await cdp('Input.dispatchKeyEvent',{type,key,code:key,windowsVirtualKeyCode:code,nativeVirtualKeyCode:code,modifiers:shift?8:0})};
 for(const [width,height] of [[320,740],[390,844],[844,390],[768,1024],[1024,768],[1440,1000]])for(const theme of ['light','dark']){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<1025});
  await cdp('Page.navigate',{url});await wait(()=>evaluate("Boolean(document.getElementById('trigger-a'))"),'React mount');
  await call("function(theme){document.documentElement.dataset.theme=theme;return true}",theme);
  await click('trigger-a');await focus('start');
  assert.deepEqual(await evaluate("['first','disabled','fieldset-disabled'].map(id=>[document.getElementById(id).matches(':disabled'),window.focusPolicy(id)])"),[[false,true],[true,false],[true,false]],'Native disabled and disabled-fieldset DOM policy');
  await key('Tab');await focus('first');await key('Tab');await focus('nested');await key('Tab');await focus('last');await key('Tab');await focus('first');await key('Tab',true);await focus('last');
  const bounds=await evaluate("(()=>{const r=document.getElementById('outer').getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight}})()");
  assert(bounds.left>=-1&&bounds.right<=bounds.w+1&&bounds.top>=-1&&bounds.bottom<=bounds.h+1,'Popover outside viewport '+JSON.stringify(bounds));
  await click('nested');await focus('inner-first');await key('Tab');await focus('inner-last');await key('Tab');await focus('inner-first');
  await evaluate("document.getElementById('inner-scroll').scrollTop=120;new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>r(true))))");
  assert(await evaluate("Boolean(document.getElementById('inner-first'))"),'internal scroll closed nested layer');
  await key('Escape');await focus('nested');assert(await evaluate("Boolean(document.getElementById('outer'))&&!document.getElementById('inner-first')"),'Escape must close only top layer');
  await key('Escape');await focus('trigger-a');assert(await evaluate("!document.getElementById('outer')"),'outer remained open');
  await click('trigger-a');await focus('start');await evaluate('window.switchDialog();true');await focus('start');await key('Escape');await focus('trigger-b');
  console.log('MID actual React portal component QA '+width+'x'+height+' '+theme+': autofocus, Tab/Shift+Tab, nested Escape/restore, internal scroll, viewport, native-disabled policy and rapid reopen PASS');
 }
 assert.deepEqual(errors,[],'browser exceptions');
}finally{
 if(socket)socket.close();for(const q of pending.values())clearTimeout(q.timer);
 if(chrome?.pid&&chrome.exitCode===null&&chrome.signalCode===null){
  const closed=once(chrome,'close');chrome.kill('SIGTERM');
  const deadline=setTimeout(()=>chrome.kill('SIGKILL'),5000);deadline.unref();
  try{await closed}finally{clearTimeout(deadline)}
 }
 if(server)await new Promise(r=>server.close(r));
 await rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
}
