const CLOUDFLARE_BEACON_URL='https://static.cloudflareinsights.com/beacon.min.js';
const INTERNAL_DEVICE_KEY='mid.analytics.internal-device';
const CONTROL_PARAMETER='mid-analytics';
const CONFIG_FILE='analytics-config.json';

type AnalyticsStatus={
 enabled:boolean;
 reason:'loaded'|'already-loaded'|'internal-device'|'development'|'missing-token'|'unsupported'|'config-error';
};

function validToken(value:unknown){
 const token=String(value||'').trim();
 return /^[A-Za-z0-9_-]{20,128}$/.test(token)?token:'';
}

function removeControlParameter(url:URL){
 url.searchParams.delete(CONTROL_PARAMETER);
 const next=`${url.pathname}${url.search}${url.hash}`;
 window.history.replaceState(window.history.state,'',next);
}

function isInternalDevice(){
 const url=new URL(window.location.href);
 const command=(url.searchParams.get(CONTROL_PARAMETER)||'').trim().toLowerCase();
 let internal=false;
 try{
  if(command==='internal'||command==='exclude'){
   localStorage.setItem(INTERNAL_DEVICE_KEY,'1');
   internal=true;
  }else if(command==='external'||command==='include'||command==='reset'){
   localStorage.removeItem(INTERNAL_DEVICE_KEY);
  }else{
   internal=localStorage.getItem(INTERNAL_DEVICE_KEY)==='1';
  }
 }catch{
  internal=command==='internal'||command==='exclude';
 }
 if(command)removeControlParameter(url);
 return internal;
}

async function analyticsToken(){
 const buildToken=validToken(import.meta.env.VITE_CLOUDFLARE_ANALYTICS_TOKEN);
 if(buildToken)return buildToken;
 const configUrl=new URL(CONFIG_FILE,document.baseURI);
 const response=await fetch(configUrl,{cache:'no-store',credentials:'same-origin'});
 if(!response.ok)return'';
 const config=await response.json() as {token?:unknown};
 return validToken(config.token);
}

export async function initPrivateWebAnalytics():Promise<AnalyticsStatus>{
 if(typeof window==='undefined'||typeof document==='undefined')return{enabled:false,reason:'unsupported'};
 if(isInternalDevice())return{enabled:false,reason:'internal-device'};
 if(!import.meta.env.PROD)return{enabled:false,reason:'development'};
 let token='';
 try{token=await analyticsToken()}catch{return{enabled:false,reason:'config-error'}}
 if(!token)return{enabled:false,reason:'missing-token'};
 const existing=document.querySelector<HTMLScriptElement>(`script[src^="${CLOUDFLARE_BEACON_URL}"]`);
 if(existing)return{enabled:true,reason:'already-loaded'};
 const script=document.createElement('script');
 script.type='module';
 script.src=CLOUDFLARE_BEACON_URL;
 script.setAttribute('data-cf-beacon',JSON.stringify({token,spa:true}));
 script.setAttribute('data-mid-analytics','cloudflare');
 document.head.appendChild(script);
 return{enabled:true,reason:'loaded'};
}