const MID_VERSION='0.7.59';
const CACHE_PREFIX='mid-shell-v';
const CACHE=`${CACHE_PREFIX}${MID_VERSION}`;
const SHELL=['./','./index.html','./manifest.webmanifest','./mid-logo.png','./mid-icon-180.png','./mid-icon-192.png','./mid-icon-512.png'];
const scopeUrl=path=>new URL(path,self.registration.scope).toString();

function versionParts(name){return name.slice(CACHE_PREFIX.length).split(/[.-]/).map(value=>Number.parseInt(value,10)||0)}
function compareCaches(a,b){const av=versionParts(a),bv=versionParts(b),length=Math.max(av.length,bv.length);for(let i=0;i<length;i++){if((av[i]||0)!==(bv[i]||0))return(av[i]||0)-(bv[i]||0)}return 0}
async function midCaches(){return(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)).sort(compareCaches).reverse()}
async function keepRecent(limit){const names=await midCaches();await Promise.all(names.slice(limit).map(name=>caches.delete(name)))}
async function matchAcrossCaches(request){for(const name of await midCaches()){const hit=await caches.open(name).then(cache=>cache.match(request,{ignoreSearch:false}));if(hit)return hit}return undefined}

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);let indexReady=false;
  for(const path of SHELL){
   try{
    const url=scopeUrl(path),response=await fetch(new Request(url,{cache:'reload',credentials:'same-origin'}));
    if(response.ok){await cache.put(url,response.clone());if(path==='./index.html'||path==='./'){indexReady=true;await cache.put(scopeUrl('./index.html'),response.clone())}}
   }catch{}
  }
  if(!indexReady)throw new Error('MID-Startseite konnte nicht für das Update vorgeladen werden.');
 })());
});

self.addEventListener('activate',event=>event.waitUntil((async()=>{await keepRecent(3);await self.clients.claim()})()));

self.addEventListener('message',event=>{
 if(event.data?.type==='SKIP_WAITING')void self.skipWaiting();
 if(event.data?.type==='MID_CLIENT_READY')event.waitUntil?.(keepRecent(2));
});

async function networkFirst(request,fallback){
 try{
  const response=await fetch(request,{cache:'no-store'});
  if(!response||!response.ok)throw new Error(`HTTP ${response?.status||0}`);
  const cache=await caches.open(CACHE);await cache.put(fallback||request,response.clone());
  return response;
 }catch{
  return(await matchAcrossCaches(fallback||request))||Response.error();
 }
}
async function cacheFirst(request){
 const cached=await matchAcrossCaches(request);if(cached)return cached;
 const response=await fetch(request);if(response&&response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}return response;
}

self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==self.location.origin)return;
 if(/\/(?:version\.json|service-worker\.js|sw\.js)$/.test(url.pathname)){event.respondWith(fetch(request,{cache:'no-store'}));return}
 if(request.mode==='navigate'){event.respondWith(networkFirst(request,scopeUrl('./index.html')));return}
 if(request.destination==='script'||request.destination==='style'||request.destination==='worker'){event.respondWith(networkFirst(request));return}
 if(request.destination==='image'||request.destination==='font'||url.pathname.endsWith('.webmanifest')){event.respondWith(cacheFirst(request));return}
});
