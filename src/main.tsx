import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';
import {getMidUpdateStatus,markMidRuntimeHealthy,registerMidServiceWorker,rollbackPendingMidUpdate} from './pwa';
import {startWebAnalyticsDiagnostics} from './webAnalytics';
import {restoreDeviceSyncState,restoreWeatherTwinArchiveDeferred,startDeviceSyncBridge} from './deviceSync';
import {StartupGuard} from './StartupGuard';
import {initializeStorageSafety} from './storageSafety';
import {compactForecastVerificationLocalStorage} from './forecastVerification';
import {beginStartupDashboardPreload} from './startupPreload';
import {markMidNativeRuntimeReady,prepareMidRuntimeDocument,startMidNativeRuntimeBridge} from './runtimePlatform';
import {startRuntimeLifecycleBridge} from './runtimeLifecycle';

const BOOT_MARKER='mid:runtime:boot-marker:v1';
prepareMidRuntimeDocument();
function timeout<T>(promise:Promise<T>,ms:number){return new Promise<T>((resolve,reject)=>{const timer=window.setTimeout(()=>reject(new Error('Startschritt hat das Zeitlimit überschritten.')),ms);promise.then(value=>{window.clearTimeout(timer);resolve(value)},error=>{window.clearTimeout(timer);reject(error)})})}
function markBootStart(){try{sessionStorage.setItem(BOOT_MARKER,JSON.stringify({at:Date.now(),version:document.querySelector('meta[name="mid-version"]')?.getAttribute('content')||''}))}catch{}}
function setBootStage(message:string){const node=document.getElementById('mid-boot-stage');if(node)node.textContent=message}
function wait(ms:number){return new Promise<void>(resolve=>window.setTimeout(resolve,ms))}
function markBootHealthy(){try{sessionStorage.removeItem(BOOT_MARKER);localStorage.removeItem('mid:runtime:last-start-error')}catch{}}
function nativeFailure(error:unknown){void error;void markMidNativeRuntimeReady();const root=document.getElementById('root');if(!root)return;root.innerHTML=`<main class="mid-native-start-failure"><section><h1>MID konnte nicht starten</h1><p>Lokale Daten wurden nicht gelöscht. Bitte lade MID erneut oder repariere den App-Cache.</p><div><button id="mid-native-reload">Neu laden</button><button id="mid-native-repair">App-Cache reparieren</button></div></section></main>`;root.querySelector('#mid-native-reload')?.addEventListener('click',()=>location.reload());root.querySelector('#mid-native-repair')?.addEventListener('click',async()=>{try{const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(registrations.map(item=>item.unregister().catch(()=>false)));if('caches'in window){const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('mid-shell-v')||name==='mid-system-meta-v1').map(name=>caches.delete(name)))}}finally{location.reload()}})}
function appSurfaceReady(){return Boolean(document.querySelector('#root .app'))&&!document.querySelector('#root .mid-startup-recovery,#root .mid-native-start-failure')}
function waitForStableAppSurface(timeoutMs=8000,stableMs=1600){
 if(appSurfaceReady())return new Promise<boolean>(resolve=>window.setTimeout(()=>resolve(appSurfaceReady()),stableMs));
 return new Promise<boolean>(resolve=>{let settled=false,stableTimer=0;const observer=new MutationObserver(()=>{if(!appSurfaceReady()){window.clearTimeout(stableTimer);stableTimer=0;return}if(stableTimer)return;stableTimer=window.setTimeout(()=>finish(appSurfaceReady()),stableMs)}),finish=(ready:boolean)=>{if(settled)return;settled=true;window.clearTimeout(timer);window.clearTimeout(stableTimer);observer.disconnect();resolve(ready)},timer=window.setTimeout(()=>finish(appSurfaceReady()),timeoutMs);observer.observe(document.getElementById('root')??document.body,{childList:true,subtree:true});observer.takeRecords()})
}
function waitForCoreDataReady(timeoutMs=20_000){
 if(document.documentElement.dataset.midCoreDataReady)return Promise.resolve(true);
 return new Promise<boolean>(resolve=>{let settled=false;const finish=(ready:boolean)=>{if(settled)return;settled=true;window.clearTimeout(timer);window.removeEventListener('mid:core-data-ready',readyHandler);resolve(ready)},readyHandler=()=>finish(true),timer=window.setTimeout(()=>finish(Boolean(document.documentElement.dataset.midCoreDataReady)),timeoutMs);window.addEventListener('mid:core-data-ready',readyHandler,{once:true})});
}
async function signalHealthy(){
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 await markMidNativeRuntimeReady();
 // Ein Release ist technisch gesund, wenn die neue React-/App-Shell stabil gerendert
 // bleibt. Die Verfügbarkeit externer Wetterquellen ist ein eigener Betriebszustand:
 // ein temporäres API-/Netzproblem darf keine intakte Version zurückrollen.
 const surfaceReady=await waitForStableAppSurface(8000,1600);
 if(surfaceReady){window.dispatchEvent(new Event('mid:runtime-healthy'));await markMidRuntimeHealthy();markBootHealthy();void waitForCoreDataReady(20_000).then(coreReady=>{document.documentElement.dataset.midCoreDataHealth=coreReady?'ready':'degraded'});return}
 if(navigator.onLine===false){window.addEventListener('online',()=>{void signalHealthy().catch(()=>markBootHealthy())},{once:true});markBootHealthy();return}
 const status=await getMidUpdateStatus().catch(()=>null),pendingVersion=status?.pendingVersion,appVersion=status?.appVersion;
 if(pendingVersion!==undefined&&appVersion!==undefined&&pendingVersion===appVersion){const rolledBack=await rollbackPendingMidUpdate().catch(()=>({ok:false}));if(rolledBack?.ok){const url=new URL(location.href);url.searchParams.set('mid-rollback',String(Date.now()));url.searchParams.set('_mid_reload',String(Date.now()));location.replace(url.toString());return}}
 markBootHealthy();
}
async function start(){
 markBootStart();
 let startupPreload=beginStartupDashboardPreload();
 void startMidNativeRuntimeBridge().catch(()=>undefined);
 setBootStage('Startdaten werden bereits im Hintergrund geladen …');
 await timeout(initializeStorageSafety(),3500).catch(()=>false);
 setBootStage('Einstellungen und Favoriten werden wiederhergestellt …');
 await timeout(restorePersistentState(),4500).catch(()=>false);
 // StorageSafety/Persistenz dürfen einen gerätelokal jüngeren Ort wiederherstellen.
 // Gleicher Ort teilt den bestehenden Preload; ein abweichender Ort bricht den alten ab.
 startupPreload=beginStartupDashboardPreload()??startupPreload;
 setBootStage('Gerätestand wird abgeglichen …');
 await timeout(restoreDeviceSyncState(),6500).catch(()=>false);
 setBootStage('Prognose, Oberfläche und Zusatzdaten werden vorbereitet …');
 if(startupPreload){const splashReadiness:Promise<unknown>[]=[startupPreload.promise,startupPreload.interfacePromise];if(startupPreload.stationPromise)splashReadiness.push(startupPreload.stationPromise);if(startupPreload.ensemblePromise)splashReadiness.push(startupPreload.ensemblePromise);await Promise.race([Promise.allSettled(splashReadiness).then(()=>undefined),wait(900)]).catch(()=>undefined)};
 try{startPersistenceBridge()}catch{}
 try{startDeviceSyncBridge()}catch{}
 try{startRuntimeLifecycleBridge()}catch{}
 const root=document.getElementById('root');if(!root)throw new Error('MID-Startcontainer fehlt.');
 ReactDOM.createRoot(root).render(<React.StrictMode><StartupGuard><App/></StartupGuard></React.StrictMode>);
 const scheduleIdle=(task:()=>void)=>{const idle=(window as Window&{requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number}).requestIdleCallback;if(idle)idle(task,{timeout:3500});else window.setTimeout(task,650)};
 scheduleIdle(()=>{void compactForecastVerificationLocalStorage().catch(()=>0)});
 scheduleIdle(()=>{void restoreWeatherTwinArchiveDeferred().catch(()=>false)});
 try{startWebAnalyticsDiagnostics()}catch{}
 void signalHealthy().catch(()=>markBootHealthy());
 if(document.readyState==='complete')void registerMidServiceWorker();else window.addEventListener('load',()=>{void registerMidServiceWorker()},{once:true});
}
window.addEventListener('error',event=>{try{localStorage.setItem('mid:runtime:last-start-error',JSON.stringify({at:new Date().toISOString(),message:event.message}))}catch{}},{capture:true});
window.addEventListener('unhandledrejection',event=>{try{const reason=event.reason;localStorage.setItem('mid:runtime:last-start-error',JSON.stringify({at:new Date().toISOString(),message:reason instanceof Error?reason.message:String(reason)}))}catch{}});
void start().catch(nativeFailure);
