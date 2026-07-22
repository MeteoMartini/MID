const UPDATE_TIMEOUT_MS=12000;
let registrationPromise:Promise<ServiceWorkerRegistration|null>|null=null;

function delay(ms:number){return new Promise<void>(resolve=>window.setTimeout(resolve,ms))}
function timeout<T>(promise:Promise<T>,ms=UPDATE_TIMEOUT_MS,message='Zeitüberschreitung beim Aktualisieren.'):Promise<T>{
 return Promise.race([promise,new Promise<T>((_,reject)=>window.setTimeout(()=>reject(new Error(message)),ms))]);
}

async function fetchReleaseAsset(url:URL){
 const response=await fetch(url.toString(),{cache:'no-store',credentials:'same-origin',headers:{'cache-control':'no-cache','pragma':'no-cache'}});
 if(!response.ok)throw new Error(`Update-Datei nicht erreichbar (${response.status}): ${url.pathname.split('/').at(-1)||url.pathname}`);
 return response;
}

async function preflightRelease(version:string){
 const indexUrl=new URL('./index.html',document.baseURI);
 indexUrl.searchParams.set('mid-preflight',`${version}-${Date.now()}`);
 const response=await fetchReleaseAsset(indexUrl);
 const html=await response.text();
 if(!html.includes('id="root"')&&!html.includes("id='root'"))throw new Error('Die neue MID-Startseite ist noch nicht vollständig bereitgestellt.');
 const documentCopy=new DOMParser().parseFromString(html,'text/html');
 const references=[
  ...Array.from(documentCopy.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')).map(element=>element.getAttribute('src')||''),
  ...Array.from(documentCopy.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')).map(element=>element.getAttribute('href')||'')
 ].filter(Boolean);
 const unique=[...new Set(references.map(reference=>new URL(reference,response.url)))];
 await timeout(Promise.all(unique.map(asset=>fetchReleaseAsset(asset).then(()=>undefined))).then(()=>undefined),UPDATE_TIMEOUT_MS,'Die Dateien der neuen MID-Version wurden nicht rechtzeitig vollständig geladen.');
 const descriptorUrl=new URL('./version.json',document.baseURI);descriptorUrl.searchParams.set('mid-preflight',String(Date.now()));
 const descriptor=await fetchReleaseAsset(descriptorUrl).then(item=>item.json()).catch(()=>null) as {version?:string}|null;
 if(String(descriptor?.version||'').trim()!==version)throw new Error('Die Veröffentlichung ist noch nicht konsistent. Bitte in wenigen Sekunden erneut versuchen.');
}

function waitForInstalled(registration:ServiceWorkerRegistration){
 if(registration.waiting)return Promise.resolve(registration.waiting);
 const worker=registration.installing;
 if(!worker)return Promise.resolve<ServiceWorker|null>(null);
 return new Promise<ServiceWorker|null>(resolve=>{
  const finish=()=>{if(worker.state==='installed')resolve(registration.waiting||worker);else if(worker.state==='activated'||worker.state==='redundant')resolve(registration.waiting)};
  worker.addEventListener('statechange',finish);finish();
 });
}

function waitForControllerChange(previous:ServiceWorker|null){
 if(navigator.serviceWorker.controller&&navigator.serviceWorker.controller!==previous)return Promise.resolve(true);
 return new Promise<boolean>(resolve=>{
  let settled=false;const finish=(changed:boolean)=>{if(settled)return;settled=true;navigator.serviceWorker.removeEventListener('controllerchange',onChange);window.clearTimeout(timer);resolve(changed)},onChange=()=>finish(true),timer=window.setTimeout(()=>finish(false),8000);
  navigator.serviceWorker.addEventListener('controllerchange',onChange,{once:true});
 });
}

export async function registerMidServiceWorker(){
 if(!('serviceWorker'in navigator)||!import.meta.env.PROD)return null;
 if(registrationPromise)return registrationPromise;
 registrationPromise=(async()=>{
  try{
   const registration=await navigator.serviceWorker.register(new URL('./service-worker.js',document.baseURI),{scope:'./',updateViaCache:'none'});
   await registration.update().catch(()=>undefined);
   window.setInterval(()=>void registration.update().catch(()=>undefined),15*60*1000);
   document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void registration.update().catch(()=>undefined)});
   registration.active?.postMessage({type:'MID_CLIENT_READY'});
   return registration;
  }catch{registrationPromise=null;return null}
 })();
 return registrationPromise;
}

export async function activateMidUpdate(version:string){
 await preflightRelease(version);
 const registration=await registerMidServiceWorker();
 if(registration){
  const previous=navigator.serviceWorker.controller;
  await registration.update();
  const waiting=await timeout(waitForInstalled(registration),UPDATE_TIMEOUT_MS,'Der neue Service Worker wurde nicht rechtzeitig installiert.');
  if(waiting){
   const changed=previous?waitForControllerChange(previous):Promise.resolve(true);
   waiting.postMessage({type:'SKIP_WAITING'});
   if(!(await changed))throw new Error('Der neue Service Worker konnte nicht kontrolliert aktiviert werden.');
  }
 }
 await delay(80);
 const url=new URL(location.href);
 url.searchParams.set('mid-update',version);
 url.searchParams.set('mid-refresh',String(Date.now()));
 location.replace(url.toString());
}
