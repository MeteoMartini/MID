import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';
import {markMidRuntimeHealthy,registerMidServiceWorker} from './pwa';
import {startWebAnalyticsDiagnostics} from './webAnalytics';
import {restoreDeviceSyncState,startDeviceSyncBridge} from './deviceSync';
import {StartupGuard} from './StartupGuard';
import {initializeStorageSafety} from './storageSafety';
import {compactForecastVerificationLocalStorage} from './forecastVerification';

const BOOT_MARKER='mid:runtime:boot-marker:v1';
function timeout<T>(promise:Promise<T>,ms:number){return Promise.race([promise,new Promise<T>((_,reject)=>window.setTimeout(()=>reject(new Error('Startschritt hat das Zeitlimit überschritten.')),ms))])}
function markBootStart(){try{sessionStorage.setItem(BOOT_MARKER,JSON.stringify({at:Date.now(),version:document.querySelector('meta[name="mid-version"]')?.getAttribute('content')||''}))}catch{}}
function markBootHealthy(){try{sessionStorage.removeItem(BOOT_MARKER);localStorage.removeItem('mid:runtime:last-start-error')}catch{}}
function nativeFailure(error:unknown){const root=document.getElementById('root');if(!root)return;const message=error instanceof Error?error.message:String(error||'Unbekannter Startfehler');root.innerHTML=`<main class="mid-native-start-failure"><section><h1>MID konnte nicht starten</h1><p>Lokale Daten wurden nicht gelöscht. Bitte lade MID erneut oder repariere den App-Cache.</p><div><button id="mid-native-reload">Neu laden</button><button id="mid-native-repair">App-Cache reparieren</button></div><details><summary>Technische Information</summary><code></code></details></section></main>`;const code=root.querySelector('code');if(code)code.textContent=message;root.querySelector('#mid-native-reload')?.addEventListener('click',()=>location.reload());root.querySelector('#mid-native-repair')?.addEventListener('click',async()=>{try{const registrations=await navigator.serviceWorker?.getRegistrations?.()||[];await Promise.all(registrations.map(item=>item.unregister().catch(()=>false)));if('caches'in window){const names=await caches.keys();await Promise.all(names.filter(name=>name.startsWith('mid-shell-v')||name==='mid-system-meta-v1').map(name=>caches.delete(name)))}}finally{location.reload()}})}
async function signalHealthy(){await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));window.dispatchEvent(new Event('mid:runtime-healthy'));await markMidRuntimeHealthy();markBootHealthy()}
async function start(){
 markBootStart();
 await timeout(initializeStorageSafety(),3500).catch(()=>false);
 await timeout(compactForecastVerificationLocalStorage(),5000).catch(()=>false);
 await timeout(restorePersistentState(),4500).catch(()=>false);
 await timeout(restoreDeviceSyncState(),6500).catch(()=>false);
 try{startPersistenceBridge()}catch{}
 try{startDeviceSyncBridge()}catch{}
 const root=document.getElementById('root');if(!root)throw new Error('MID-Startcontainer fehlt.');
 ReactDOM.createRoot(root).render(<React.StrictMode><StartupGuard><App/></StartupGuard></React.StrictMode>);
 try{startWebAnalyticsDiagnostics()}catch{}
 void signalHealthy().catch(()=>markBootHealthy());
 if(document.readyState==='complete')void registerMidServiceWorker();else window.addEventListener('load',()=>{void registerMidServiceWorker()},{once:true});
}
window.addEventListener('error',event=>{try{localStorage.setItem('mid:runtime:last-start-error',JSON.stringify({at:new Date().toISOString(),message:event.message}))}catch{}},{capture:true});
window.addEventListener('unhandledrejection',event=>{try{const reason=event.reason;localStorage.setItem('mid:runtime:last-start-error',JSON.stringify({at:new Date().toISOString(),message:reason instanceof Error?reason.message:String(reason)}))}catch{}});
void start().catch(nativeFailure);
