import {isMidNativeRuntime} from './runtimePlatform';

export type MidExternalNavigationMode='native-browser'|'external-browser'|'same-window';
export type MidNetatmoOAuthCallback={result:'netatmo-connected'|'netatmo-denied'|'netatmo-error';detail:string;stage:string;connectionId:string};

const MID_OAUTH_SCHEME='midwx:';
const MID_OAUTH_HOST='oauth';
const NETATMO_CALLBACK_PATH='/netatmo';
const NETATMO_CALLBACK_KEY='mid:netatmo:callback';
const NETATMO_RESULTS=new Set<MidNetatmoOAuthCallback['result']>(['netatmo-connected','netatmo-denied','netatmo-error']);

function safeText(value:string,max:number){return String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max)}
function isNativeNetatmoCallback(url:URL){return url.protocol===MID_OAUTH_SCHEME&&url.hostname===MID_OAUTH_HOST&&url.pathname===NETATMO_CALLBACK_PATH&&!url.username&&!url.password&&!url.port}

export function midExternalOAuthReturnUrl(provider:'netatmo'){
 if(isMidNativeRuntime())return `${MID_OAUTH_SCHEME}//${MID_OAUTH_HOST}/${provider}`;
 return `${location.origin}${location.pathname}`;
}

export async function openMidExternalAuthorization(target:string):Promise<MidExternalNavigationMode>{
 const url=new URL(target);
 if(url.protocol!=='https:')throw new Error('Externe Anmeldungen benötigen eine sichere HTTPS-Adresse.');
 if(isMidNativeRuntime()){
  const{Browser}=await import('@capacitor/browser');
  await Browser.open({url:url.toString(),presentationStyle:'fullscreen',toolbarColor:'#087eea'});
  return'native-browser';
 }
 const standalone=Boolean(window.matchMedia?.('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone);
 if(standalone){const opened=window.open(url.toString(),'_blank');if(opened)return'external-browser'}
 window.location.assign(url.toString());
 return'same-window';
}

export function parseMidNetatmoOAuthCallback(rawUrl:string):MidNetatmoOAuthCallback|null{
 try{
  const url=new URL(rawUrl,location.href),native=isNativeNetatmoCallback(url);
  if(!native&&url.origin!==location.origin)return null;
  const result=url.searchParams.get('mid_station') as MidNetatmoOAuthCallback['result']|null;
  if(!result||!NETATMO_RESULTS.has(result))return null;
  const connectionId=safeText(url.searchParams.get('mid_station_connection')||'',128);
  if(connectionId&&!/^[A-Za-z0-9_-]{16,128}$/.test(connectionId))return null;
  return{result,detail:safeText(url.searchParams.get('mid_station_detail')||'',400),stage:safeText(url.searchParams.get('mid_station_stage')||'',32),connectionId};
 }catch{return null}
}

export function captureMidExternalOAuthReturn(rawUrl:string){
 const callback=parseMidNetatmoOAuthCallback(rawUrl);
 if(!callback)return null;
 const payload=JSON.stringify(callback);
 try{sessionStorage.setItem(NETATMO_CALLBACK_KEY,payload)}catch{}
 try{localStorage.setItem(NETATMO_CALLBACK_KEY,payload)}catch{}
 window.dispatchEvent(new CustomEvent<MidNetatmoOAuthCallback>('mid:external-oauth-return',{detail:callback}));
 return callback;
}

export async function finishMidExternalOAuthReturn(){
 if(!isMidNativeRuntime())return;
 const{Browser}=await import('@capacitor/browser');
 await Browser.close().catch(()=>undefined);
}
