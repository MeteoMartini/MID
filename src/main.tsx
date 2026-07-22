import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';
import {registerMidServiceWorker} from './pwa';

async function start(){
 try{await restorePersistentState()}catch{}
 try{startPersistenceBridge()}catch{}
 const root=document.getElementById('root');
 if(!root)throw new Error('MID-Startbereich fehlt.');
 ReactDOM.createRoot(root).render(<React.StrictMode><App/></React.StrictMode>);
 window.requestAnimationFrame(()=>{
  (window as unknown as {__MID_MARK_READY__?:()=>void}).__MID_MARK_READY__?.();
  void registerMidServiceWorker();
 });
}
void start().catch(error=>{
 console.error('MID-Start fehlgeschlagen',error);
 (window as unknown as {__MID_SHOW_RECOVERY__?:(message?:string)=>void}).__MID_SHOW_RECOVERY__?.('MID konnte nicht vollständig gestartet werden.');
});
