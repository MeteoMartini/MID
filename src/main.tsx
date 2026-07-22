import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import './v078';
import App from './App';
import {restorePersistentState,startPersistenceBridge} from './persistence';

async function start(){
 await restorePersistentState();
 startPersistenceBridge();
 if('serviceWorker'in navigator){window.addEventListener('load',()=>{void navigator.serviceWorker.register(new URL('./sw.js',document.baseURI),{scope:'./'}).then(registration=>registration.update()).catch(()=>{})},{once:true})}
 ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
}
void start();
