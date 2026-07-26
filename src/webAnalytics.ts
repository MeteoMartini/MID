export type WebAnalyticsState='disabled-dev'|'missing-token'|'missing-snippet'|'loading'|'loaded'|'blocked';
export type WebAnalyticsStatus={state:WebAnalyticsState;message:string;tokenConfigured:boolean;scriptPresent:boolean;updatedAt:string};

const BEACON_SRC='https://static.cloudflareinsights.com/beacon.min.js';
const TOKEN=String(import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN||'').trim();
let status:WebAnalyticsStatus={state:import.meta.env.PROD?'loading':'disabled-dev',message:import.meta.env.PROD?'Cloudflare Web Analytics wird geprüft.':'In der Entwicklungsumgebung deaktiviert.',tokenConfigured:Boolean(TOKEN),scriptPresent:false,updatedAt:new Date().toISOString()};

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
 if(!import.meta.env.PROD){publish(nextStatus('disabled-dev','In der Entwicklungsumgebung deaktiviert.',false));return status}
 if(!TOKEN){publish(nextStatus('missing-token','GitHub-Buildvariable VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN fehlt.',false));return status}
 const script=ensureBeacon();
 if(!script){publish(nextStatus('missing-snippet','Der Analytics-Beacon konnte trotz Token nicht erzeugt werden.',false));return status}
 publish(nextStatus('loading','Cloudflare-Web-Analytics-Beacon wird geladen.',true));
 const loaded=()=>publish(nextStatus('loaded','Cloudflare-Web-Analytics-Beacon ist geladen.',true));
 const blocked=()=>publish(nextStatus('blocked','Analytics-Beacon wurde durch Netzwerk, DNS oder Inhaltsblocker verhindert.',true));
 script.addEventListener('load',loaded,{once:true});
 script.addEventListener('error',blocked,{once:true});
 window.setTimeout(()=>{
  if(status.state!=='loading')return;
  const resource=performance.getEntriesByName(BEACON_SRC).length>0;
  publish(nextStatus(resource?'loaded':'blocked',resource?'Cloudflare-Web-Analytics-Beacon ist geladen.':'Analytics-Beacon wurde nicht geladen; Inhaltsblocker oder Netzwerkfilter möglich.',true));
 },7000);
 return status;
}
