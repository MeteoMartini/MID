import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';
import {markMidRuntimeHealthy,registerMidServiceWorker} from './pwa';
import {startWebAnalyticsDiagnostics} from './webAnalytics';

async function signalHealthy(){
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
 window.dispatchEvent(new Event('mid:runtime-healthy'));
 await markMidRuntimeHealthy();
}

async function start(){
 await restorePersistentState();
 startPersistenceBridge();
 ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
 startWebAnalyticsDiagnostics();
 void signalHealthy();
 if(document.readyState==='complete')void registerMidServiceWorker();
 else window.addEventListener('load',()=>{void registerMidServiceWorker()},{once:true});
}
void start();
