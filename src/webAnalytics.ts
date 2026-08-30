export type WebAnalyticsState='disabled-dev'|'missing-token'|'missing-snippet'|'loading'|'loaded'|'blocked';
export type WebAnalyticsStatus={state:WebAnalyticsState;message:string;tokenConfigured:boolean;scriptPresent:boolean;updatedAt:string};

const BEACON_SRC='https://static.cloudflareinsights.com/beacon.min.js';
const TOKEN=String(import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN||'').trim();
let status:WebAnalyticsStatus={state:import.meta.env.PROD?'loading':'disabled-dev',message:import.meta.env.PROD?'Nutzungsstatistik wird geprüft.':'In diesem App-Modus nicht aktiv.',tokenConfigured:Boolean(TOKEN),scriptPresent:false,updatedAt:new Date().toISOString()};

function publish(next:WebAnalyticsStatus){status=next;window.dispatchEvent(new CustomEvent<WebAnalyticsStatus>('mid:web-analytics-status',{detail:next}))}
function nextStatus(state:WebAnalyticsState,message:string,scriptPresent:boolean):WebAnalyticsStatus{return{state,message,tokenConfigured:Boolean(TOKEN),scriptPresent,updatedAt:new Date().toISOString()}}
function ensureBeacon(){
 const existing=document.querySelector<HTMLScriptElement>(`script[src^="${BEACON_SRC}"][data-cf-beacon]`);
 if(existing)return existing;
 const script=document.createElement('script');
 script.defer=true;
 script.src=BEACON_SRC;
 script.dataset.cfBeacon=JSON.stringify({token:TOKEN});
 script.setAttribute('data-mid-analytics','cloudflare');
 document.head.appendChild(script);
 return script;
}

export function getWebAnalyticsStatus(){return status}

export function startWebAnalyticsDiagnostics(){
 if(typeof window==='undefined'||typeof document==='undefined')return status;
 if(!import.meta.env.PROD){publish(nextStatus('disabled-dev','In diesem App-Modus nicht aktiv.',false));return status}
 if(!TOKEN){publish(nextStatus('missing-token','Nutzungsstatistik ist derzeit nicht verfügbar.',false));return status}
 const script=ensureBeacon();
 if(!script){publish(nextStatus('missing-snippet','Nutzungsstatistik konnte nicht initialisiert werden.',false));return status}
 publish(nextStatus('loading','Nutzungsstatistik wird initialisiert.',true));
 const loaded=()=>publish(nextStatus('loaded','Nutzungsstatistik ist aktiv.',true));
 const blocked=()=>publish(nextStatus('blocked','Nutzungsstatistik wurde durch Netzwerk oder Inhaltsfilter verhindert.',true));
 script.addEventListener('load',loaded,{once:true});
 script.addEventListener('error',blocked,{once:true});
 window.setTimeout(()=>{
  if(status.state!=='loading')return;
  const resource=performance.getEntriesByName(BEACON_SRC).length>0;
  publish(nextStatus(resource?'loaded':'blocked',resource?'Nutzungsstatistik ist aktiv.':'Nutzungsstatistik konnte nicht geladen werden; Netzwerk oder Inhaltsfilter prüfen.',true));
 },7000);
 return status;
}
