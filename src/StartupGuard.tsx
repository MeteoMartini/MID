import {Component,type ErrorInfo,type ReactNode,useState} from 'react';
import {AlertTriangle,CloudUpload,RefreshCw,ShieldCheck,Wrench} from 'lucide-react';
import {repairMidCache,resetMidServiceWorker} from './pwa';
import {saveICloudBackup} from './iCloudBackup';

type Props={children:ReactNode};
type State={error:Error|null};

function StartupRecovery({error}:{error:Error}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const run=async(action:()=>Promise<void>,success:string)=>{setBusy(true);setMessage('Wiederherstellung läuft …');try{await action();setMessage(success);window.setTimeout(()=>location.reload(),650)}catch(value){setMessage(value instanceof Error?value.message:'Wiederherstellung fehlgeschlagen.')}finally{setBusy(false)}};
 return <main className="mid-startup-recovery"><section><AlertTriangle size={34}/><h1>MID konnte nicht vollständig starten</h1><p>Deine Favoriten, Einstellungen und Wetterzwillingsdaten werden nicht gelöscht. Du kannst den App-Cache reparieren oder zuerst eine Sicherung erstellen.</p><div><button type="button" disabled={busy} onClick={()=>location.reload()}><RefreshCw size={17}/>Neu laden</button><button type="button" disabled={busy} onClick={()=>void run(async()=>{await repairMidCache()},'Cache repariert. MID wird neu geladen …')}><Wrench size={17}/>App-Cache reparieren</button><button type="button" disabled={busy} onClick={()=>void run(async()=>{await resetMidServiceWorker()},'Service Worker zurückgesetzt. MID wird neu geladen …')}><ShieldCheck size={17}/>Abgesichert neu starten</button><button type="button" disabled={busy} onClick={()=>void run(async()=>{await saveICloudBackup()},'Sicherung wurde geöffnet beziehungsweise gespeichert.')}><CloudUpload size={17}/>Daten sichern</button></div>{message&&<p className="mid-startup-recovery-message" role="status">{message}</p>}<details><summary>Technische Information</summary><code>{error.message}</code></details></section></main>
}

export class StartupGuard extends Component<Props,State>{
 state:State={error:null};
 static getDerivedStateFromError(error:Error){return{error}}
 componentDidCatch(error:Error,info:ErrorInfo){try{localStorage.setItem('mid:runtime:last-start-error',JSON.stringify({at:new Date().toISOString(),message:error.message,stack:error.stack,componentStack:info.componentStack}))}catch{}}
 render(){return this.state.error?<StartupRecovery error={this.state.error}/>:this.props.children}
}
