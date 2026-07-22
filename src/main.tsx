import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';
import {registerMidServiceWorker} from './pwa';

async function start(){
 await restorePersistentState();
 startPersistenceBridge();
 ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
 window.addEventListener('load',()=>{void registerMidServiceWorker()},{once:true});
}
void start();
