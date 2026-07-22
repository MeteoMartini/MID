const CACHE='mid-shell-v0.7.77.1';
const VERSION=CACHE.replace('mid-shell-v','');
const CACHE_PREFIX='mid-shell-v';
const META_CACHE='mid-system-meta-v1';
const META_URL=new URL('./__mid_system_meta__.json',self.registration.scope).toString();
const CORE=['./','./index.html','./manifest.webmanifest','./version.json','./mid-logo.png','./mid-icon-180.png','./mid-icon-192.png','./mid-icon-512.png'];
let activeCacheMemo='';

function versionFromCache(name){return name.startsWith(CACHE_PREFIX)?name.slice(CACHE_PREFIX.length):''}
function versionParts(value){return String(value||'').split('.').map(part=>Number.parseInt(part,10)||0)}
function compareVersions(a,b){const aa=versionParts(a),bb=versionParts(b),n=Math.max(aa.length,bb.length);for(let i=0;i<n;i++){if((aa[i]||0)!==(bb[i]||0))return(aa[i]||0)-(bb[i]||0)}return 0}
async function shellCaches(){return(await caches.keys()).filter(name=>name.startsWith(CACHE_PREFIX)).sort((a,b)=>compareVersions(versionFromCache(b),versionFromCache(a)))}
async function readMeta(){try{const cache=await caches.open(META_CACHE),response=await cache.match(META_URL);return response?await response.json():{}}catch{return{}}}
async function writeMeta(meta){const cache=await caches.open(META_CACHE);await cache.put(META_URL,new Response(JSON.stringify(meta),{headers:{'content-type':'application/json','cache-control':'no-store'}}));activeCacheMemo=String(meta.activeCache||'')}
function reply(event,data){const port=event.ports?.[0];if(port)port.postMessage(data);else event.source?.postMessage?.(data)}
function sameScopeAsset(value){try{const url=new URL(value,self.registration.scope),scope=new URL(self.registration.scope);return url.origin===scope.origin&&url.pathname.startsWith(scope.pathname)?url.toString():null}catch{return null}}
async function fetchAsset(url){const response=await fetch(url,{cache:'no-store',redirect:'follow'});if(!response.ok)throw new Error(`${new URL(url).pathname}: HTTP ${response.status}`);const destination=new URL(url).pathname;if(/\.(?:js|mjs|css)$/i.test(destination)){const type=response.headers.get('content-type')||'';if(type.includes('text/html'))throw new Error(`${destination}: unerwartete HTML-Antwort`)}return response}
async function cacheShell(cacheName=CACHE){
 const cache=await caches.open(cacheName);
 try{
  const indexUrl=new URL('./index.html',self.registration.scope).toString(),indexResponse=await fetchAsset(indexUrl),html=await indexResponse.clone().text(),assets=new Set(CORE.map(path=>new URL(path,self.registration.scope).toString()));
  for(const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)){const asset=sameScopeAsset(match[1]);if(asset)assets.add(asset)}
  await cache.put(indexUrl,indexResponse.clone());await cache.put(new URL('./',self.registration.scope).toString(),indexResponse.clone());
  for(const url of assets){if(url===indexUrl||url===new URL('./',self.registration.scope).toString())continue;const response=await fetchAsset(url);await cache.put(url,response)}
  await cache.put(new URL('./__mid_shell_valid__.json',self.registration.scope).toString(),new Response(JSON.stringify({version:VERSION,validatedAt:new Date().toISOString(),assetCount:assets.size}),{headers:{'content-type':'application/json'}}));
  return{version:VERSION,assetCount:assets.size};
 }catch(error){await caches.delete(cacheName);throw error}
}
async function activeCacheName(){if(activeCacheMemo&&await caches.has(activeCacheMemo))return activeCacheMemo;const meta=await readMeta(),names=await shellCaches(),candidate=String(meta.activeCache||'');activeCacheMemo=candidate&&names.includes(candidate)?candidate:(names.includes(CACHE)?CACHE:names[0]||CACHE);return activeCacheMemo}
async function cleanupShellCaches(meta){const names=await shellCaches(),keep=new Set([CACHE,String(meta.activeCache||''),String(meta.previousCache||''),...names.slice(0,2)].filter(Boolean));await Promise.all(names.filter(name=>!keep.has(name)).map(name=>caches.delete(name)))}
async function prepareUpdate(){const meta=await readMeta(),names=await shellCaches(),currentActive=String(meta.activeCache||'');const previous=names.includes(currentActive)&&currentActive!==CACHE?currentActive:names.find(name=>name!==CACHE)||'';const next={...meta,workerVersion:VERSION,activeCache:CACHE,previousCache:previous||meta.previousCache||'',mode:'updating',pending:{targetVersion:VERSION,previousCache:previous||meta.previousCache||'',startedAt:Date.now()}};await writeMeta(next);return next}
async function setHealthy(version){const meta=await readMeta();if(version&&version!==VERSION)return meta;const next={...meta,workerVersion:VERSION,activeCache:CACHE,mode:'normal',pending:null,healthyVersion:VERSION,healthyAt:Date.now()};await writeMeta(next);await cleanupShellCaches(next);return next}
async function rollback(pendingOnly=false){const meta=await readMeta(),names=await shellCaches();if(pendingOnly&&meta.pending?.targetVersion!==VERSION)return{ok:false,error:'Kein ausstehendes Update.'};const target=String(meta.pending?.previousCache||meta.previousCache||names.find(name=>name!==String(meta.activeCache||CACHE))||'');if(!target||!names.includes(target))return{ok:false,error:'Keine vorherige geprüfte Version verfügbar.'};const next={...meta,workerVersion:VERSION,activeCache:target,previousCache:CACHE,mode:'rollback',pending:null,rolledBackFrom:VERSION,rolledBackAt:Date.now()};await writeMeta(next);return{ok:true,version:versionFromCache(target),meta:next}}
async function status(){const meta=await readMeta(),names=await shellCaches(),active=await activeCacheName(),previous=String(meta.previousCache||'');return{appVersion:'',workerVersion:VERSION,activeVersion:versionFromCache(active),previousVersion:names.includes(previous)?versionFromCache(previous):undefined,availableVersions:names.map(versionFromCache),pendingVersion:meta.pending?.targetVersion,rollbackAvailable:names.some(name=>name!==active),controlled:true}}
async function rollbackDocument(response,active){try{const html=await response.text(),version=versionFromCache(active),banner=`<aside id="mid-rollback-banner" style="position:fixed;z-index:99999;left:8px;right:8px;bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;background:#102338;color:#eef6ff;box-shadow:0 12px 36px rgba(0,0,0,.4);font:12px system-ui,sans-serif"><span><b>MID-Rückfallversion v${version}</b><br><small style="opacity:.78">Die vorherige geprüfte Version ist aktiv.</small></span><button style="min-height:36px;padding:7px 11px;border:0;border-radius:9px;background:#248dff;color:white;font-weight:700" onclick="(async()=>{const r=await navigator.serviceWorker.ready,w=navigator.serviceWorker.controller||r.active,c=new MessageChannel();c.port1.onmessage=e=>{if(e.data&&e.data.ok)location.reload()};w.postMessage({type:'MID_USE_CURRENT'},[c.port2])})()">Aktuelle Version erneut testen</button></aside>`;return new Response(html.replace('</body>',banner+'</body>'),{status:response.status,statusText:response.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}})}catch{return response}}

self.addEventListener('install',event=>{event.waitUntil(cacheShell(CACHE))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const meta=await readMeta(),names=await shellCaches();let next;if(meta.mode==='rollback'&&names.includes(String(meta.activeCache||''))){next={...meta,workerVersion:VERSION}}else if(meta.pending?.targetVersion===VERSION){next={...meta,workerVersion:VERSION,activeCache:CACHE,mode:'updating'}}else{const prior=names.find(name=>name!==CACHE)||String(meta.activeCache||'');next={...meta,workerVersion:VERSION,activeCache:CACHE,previousCache:prior&&prior!==CACHE?prior:meta.previousCache||'',mode:'normal'}}await writeMeta(next);await cleanupShellCaches(next);await self.clients.claim()})())});

self.addEventListener('message',event=>{event.waitUntil((async()=>{try{switch(event.data?.type){
 case'SKIP_WAITING':case'MID_ACTIVATE_UPDATE':await prepareUpdate();reply(event,{ok:true,version:VERSION});await self.skipWaiting();break;
 case'MID_RUNTIME_HEALTHY':await setHealthy(String(event.data?.version||''));reply(event,{ok:true,status:await status()});break;
 case'MID_ROLLBACK_IF_PENDING':{const result=await rollback(true);reply(event,result);break}
 case'MID_ROLLBACK':{const result=await rollback(false);reply(event,result);break}
 case'MID_USE_CURRENT':{await prepareUpdate();reply(event,{ok:true,version:VERSION});break}
 case'MID_REPAIR_CACHE':{const old=await activeCacheName();const result=await cacheShell(CACHE);const meta=await readMeta(),next={...meta,workerVersion:VERSION,activeCache:CACHE,previousCache:old!==CACHE?old:meta.previousCache||'',mode:'normal',pending:null,repairedAt:Date.now()};await writeMeta(next);await cleanupShellCaches(next);reply(event,{ok:true,...result,status:await status()});break}
 case'MID_GET_STATUS':reply(event,{ok:true,status:await status()});break;
 default:reply(event,{ok:false,error:'Unbekannte Service-Worker-Anfrage.'});
 }}catch(error){reply(event,{ok:false,error:error instanceof Error?error.message:String(error)})}})())});

self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url),scope=new URL(self.registration.scope);if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
 event.respondWith((async()=>{
  const active=await activeCacheName(),rollbackMode=active!==CACHE,cache=await caches.open(active);
  if(rollbackMode){if(request.mode==='navigate'){const page=(await cache.match(new URL('./index.html',self.registration.scope).toString()))||await cache.match(new URL('./',self.registration.scope).toString());return page?rollbackDocument(page,active):Response.error()}const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;return fetch(request).catch(()=>new Response('MID-Ressource ist in der Rückfallversion nicht verfügbar.',{status:503}))}
  if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/manifest.webmanifest'))return fetch(request,{cache:'no-store'}).then(response=>{if(response.ok)event.waitUntil(cache.put(request,response.clone()));return response}).catch(()=>cache.match(request,{ignoreSearch:true}).then(response=>response||Response.error()));
  if(request.mode==='navigate')return fetch(request,{cache:'no-store'}).then(response=>{if(response.ok)event.waitUntil(cache.put(new URL('./index.html',self.registration.scope).toString(),response.clone()));return response}).catch(()=>cache.match(new URL('./index.html',self.registration.scope).toString()).then(response=>response||cache.match(new URL('./',self.registration.scope).toString())).then(response=>response||Response.error()));
  const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;
  return fetch(request).then(response=>{if(response.ok&&['script','style','image','font'].includes(request.destination))event.waitUntil(cache.put(request,response.clone()));return response});
 })())
});
