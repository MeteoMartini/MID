import {useEffect,useMemo,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {BadgeCheck,Download,MoreVertical,Share2,Smartphone,X} from 'lucide-react';

type BeforeInstallPromptEvent=Event&{
 prompt:()=>Promise<void>;
 userChoice:Promise<{outcome:'accepted'|'dismissed';platform:string}>;
};

type NavigatorWithStandalone=Navigator&{standalone?:boolean};

function runsStandalone(){
 return window.matchMedia?.('(display-mode: standalone)').matches===true||(navigator as NavigatorWithStandalone).standalone===true;
}

function isIosDevice(){return /iphone|ipad|ipod/i.test(navigator.userAgent)}
function isAndroidDevice(){return /android/i.test(navigator.userAgent)}

export function PwaInstallButton(){
 const[open,setOpen]=useState(false),[installPrompt,setInstallPrompt]=useState<BeforeInstallPromptEvent|null>(null),[installed,setInstalled]=useState(runsStandalone),[message,setMessage]=useState('');
 const ios=useMemo(isIosDevice,[]),android=useMemo(isAndroidDevice,[]);

 useEffect(()=>{
  const media=window.matchMedia?.('(display-mode: standalone)');
  const updateInstalled=()=>setInstalled(runsStandalone());
  const capture=(event:Event)=>{event.preventDefault();setInstallPrompt(event as BeforeInstallPromptEvent)};
  const markInstalled=()=>{setInstalled(true);setInstallPrompt(null);setMessage('MID wurde erfolgreich als App installiert.')};
  window.addEventListener('beforeinstallprompt',capture);
  window.addEventListener('appinstalled',markInstalled);
  media?.addEventListener?.('change',updateInstalled);
  return()=>{
   window.removeEventListener('beforeinstallprompt',capture);
   window.removeEventListener('appinstalled',markInstalled);
   media?.removeEventListener?.('change',updateInstalled);
  };
 },[]);

 useEffect(()=>{
  if(!open)return;
  const previous=document.body.style.overflow;
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
  document.body.style.overflow='hidden';
  document.addEventListener('keydown',escape);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',escape)};
 },[open]);

 const install=async()=>{
  if(!installPrompt)return;
  setMessage('');
  try{
   await installPrompt.prompt();
   const choice=await installPrompt.userChoice;
   setInstallPrompt(null);
   setMessage(choice.outcome==='accepted'?'Installation wurde bestätigt.':'Installation wurde abgebrochen. Du kannst sie später erneut über den Browser starten.');
  }catch{
   setInstallPrompt(null);
   setMessage('Der Installationsdialog konnte nicht geöffnet werden. Nutze bitte das Browsermenü.');
  }
 };

 return <>
  <button type="button" className="footer-install-button" onClick={()=>{setMessage('');setOpen(true)}} aria-haspopup="dialog" aria-expanded={open}>
   <Smartphone size={14}/><span>{installed?'MID-App installiert':'MID als App nutzen'}</span>
  </button>
  {open&&<div className="pwa-install-backdrop" role="presentation" onPointerDown={(event:ReactPointerEvent<HTMLDivElement>)=>event.target===event.currentTarget&&setOpen(false)}>
   <section className="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title">
    <header><div><span>Web-App installieren</span><h2 id="pwa-install-title">MID als App nutzen</h2></div><button type="button" onClick={()=>setOpen(false)} aria-label="Installationshinweis schließen"><X size={19}/></button></header>
    <div className="pwa-install-content">
     <div className="pwa-install-hero"><span><Smartphone size={30}/></span><div><strong>Direkter Start vom Home-Bildschirm</strong><p>MID öffnet sich im eigenen App-Fenster ohne normale Browserleiste und bleibt über das MID-Symbol schnell erreichbar.</p></div></div>
     <div className="pwa-install-benefits"><span><BadgeCheck size={17}/>Eigenes MID-App-Symbol</span><span><BadgeCheck size={17}/>Vollbildnahe Darstellung</span><span><BadgeCheck size={17}/>Schneller Wiederaufruf</span></div>
     {installed?<div className="pwa-install-status success"><BadgeCheck size={20}/><div><strong>MID ist bereits als App installiert.</strong><span>Du verwendest die installierte Web-App beziehungsweise hast sie bereits zum Home-Bildschirm hinzugefügt.</span></div></div>:installPrompt?<div className="pwa-install-direct"><p>Dein Browser unterstützt die direkte Installation.</p><button type="button" className="primary" onClick={()=>void install()}><Download size={18}/>MID jetzt installieren</button></div>:ios?<div className="pwa-install-guide"><strong>Installation auf iPhone oder iPad</strong><ol><li>Diese Seite in <b>Safari</b> öffnen.</li><li>Auf <Share2 size={16}/> <b>Teilen</b> tippen.</li><li><b>Zum Home-Bildschirm</b> beziehungsweise <b>Zu Home-Bildschirm hinzufügen</b> wählen.</li><li><b>Als Web-App öffnen</b> aktivieren und auf <b>Hinzufügen</b> tippen.</li></ol></div>:<div className="pwa-install-guide"><strong>{android?'Installation auf Android':'Installation über den Browser'}</strong><ol><li>Das Browsermenü <MoreVertical size={16}/> öffnen.</li><li><b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b> wählen.</li><li>Die Installation bestätigen.</li></ol><small>Die genaue Bezeichnung hängt vom verwendeten Browser ab.</small></div>}
     {message&&<p className="pwa-install-message" role="status">{message}</p>}
     <small className="pwa-install-note">Die Installation erfolgt ausschließlich über den Browser. Es wird kein App-Store benötigt und es werden keine zusätzlichen Berechtigungen vergeben.</small>
    </div>
   </section>
  </div>}
 </>;
}
