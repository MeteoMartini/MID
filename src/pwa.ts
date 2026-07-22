import {MID_VERSION} from './version';

let updateTimer:number|undefined;
let visibilityHandler:(()=>void)|undefined;
let focusHandler:(()=>void)|undefined;

export type MidUpdateStatus={
 appVersion:string;
 workerVersion?:string;
 activeVersion?:string;
 previousVersion?:string;
 availableVersions:string[];
 pendingVersion?:string;
 rollbackAvailable:boolean;
 controlled:boolean;
};

type SwReply={ok?:boolean;status?:MidUpdateStatus;version?:string;error?:string};

function requestWorker(message:Record<string,unknown>,timeoutMs=10000):Promise<SwReply>{
 return new Promise(resolve=>{
  const worker=navigator.serviceWorker?.controller;
  if(!worker){resolve({ok:false,error:'Kein aktiver Service Worker.'});return}
  const channel=new MessageChannel();
  let settled=false;
  const finish=(reply:SwReply)=>{if(settled)return;settled=true;window.clearTimeout(timer);channel.port1.close();resolve(reply)};
  const timer=window.setTimeout(()=>finish({ok:false,error:'Service-Worker-Antwort wurde nicht rechtzeitig empfangen.'}),timeoutMs);
  channel.port1.onmessage=event=>finish((event.data??{}) as SwReply);
  worker.postMessage(message,[channel.port2]);
 });
}

export async function getMidUpdateStatus():Promise<MidUpdateStatus>{
 const fallback:MidUpdateStatus={appVersion:MID_VERSION,availableVersions:[],rollbackAvailable:false,controlled:Boolean(navigator.serviceWorker?.controller)};
 if(!('serviceWorker'in navigator))return fallback;
 const reply=await requestWorker({type:'MID_GET_STATUS'}).catch(():SwReply=>({ok:false}));
 return reply.status?{...reply.status,appVersion:MID_VERSION}:fallback;
}

export async function repairMidCache(){
 const reply=await requestWorker({type:'MID_REPAIR_CACHE'},30000);
 if(!reply.ok)throw new Error(reply.error||'MID-Cache konnte nicht repariert werden.');
 return reply;
}

export async function rollbackMidVersion(){
 const reply=await requestWorker({type:'MID_ROLLBACK'});
 if(!reply.ok)throw new Error(reply.error||'Keine vorherige Version verfügbar.');
 return reply;
}

export async function resetMidServiceWorker(){
 if(!('serviceWorker'in navigator))return;
 const registrations=await navigator.serviceWorker.getRegistrations();
 await Promise.all(registrations.map(registration=>registration.unregister().catch(()=>false)));
 if('caches'in window){
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('mid-shell-v')||name==='mid-system-meta-v1').map(name=>caches.delete(name)));
 }
}

export async function markMidRuntimeHealthy(){
 if(!navigator.serviceWorker?.controller)return;
 await requestWorker({type:'MID_RUNTIME_HEALTHY',version:MID_VERSION},5000).catch(()=>undefined);
}

export async function registerMidServiceWorker(){
 if(!('serviceWorker'in navigator)||!import.meta.env.PROD)return null;
 try{
  const scriptUrl=new URL('./service-worker.js',document.baseURI);
  const registration=await navigator.serviceWorker.register(scriptUrl,{scope:'./',updateViaCache:'none'});
  await registration.update().catch(()=>undefined);
  if(updateTimer)window.clearInterval(updateTimer);
  if(visibilityHandler)document.removeEventListener('visibilitychange',visibilityHandler);
  if(focusHandler)window.removeEventListener('focus',focusHandler);
  const update=()=>void registration.update().catch(()=>undefined);
  updateTimer=window.setInterval(update,15*60*1000);
  visibilityHandler=()=>{if(document.visibilityState==='visible')update()};
  focusHandler=update;
  document.addEventListener('visibilitychange',visibilityHandler);
  window.addEventListener('focus',focusHandler);
  return registration;
 }catch{return null}
}
