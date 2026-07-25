import {buildWorkerUrl,workerBaseCandidates} from './workerClient';

export type PushTargetType='favorite'|'tracked-location';
export type PushRuleFavorite={
 id:string;
 name:string;
 latitude:number;
 longitude:number;
 country?:string;
 targetType?:PushTargetType;
 rules:{precipitationStart:boolean;thunderstormApproach:boolean};
};
export type PushStatus={supported:boolean;permission:NotificationPermission|'unsupported';configured:boolean;subscribed:boolean;workerUrl:string;message:string};

type PushConfig={enabled?:boolean;publicKey?:string;version?:string;error?:string};
type WorkerReply={ok?:boolean;error?:string;favorites?:number;version?:string};

function supportsPush(){return typeof window!=='undefined'&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function base64UrlToBytes(value:string){const normalized=value.replace(/-/g,'+').replace(/_/g,'/'),padded=normalized+'='.repeat((4-normalized.length%4)%4),raw=atob(padded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}
async function readJson<T>(response:Response){const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{throw new Error(`Worker-Antwort ist kein gültiges JSON (HTTP ${response.status}).`)}if(!response.ok||data?.error)throw new Error(data?.error||`Worker meldet HTTP ${response.status}.`);return data as T}
async function workerGet<T>(mode:string){const candidates=workerBaseCandidates('general');if(!candidates.length)throw new Error('Cloudflare Worker ist nicht konfiguriert.');const errors:string[]=[];for(const base of candidates)try{return{data:await readJson<T>(await fetch(buildWorkerUrl(base,mode),{cache:'no-store',headers:{Accept:'application/json'}})),base}}catch(error){errors.push(error instanceof Error?error.message:String(error))}throw new Error(errors.at(-1)||'Worker ist nicht erreichbar.')}
async function workerPost<T>(mode:string,body:unknown){const candidates=workerBaseCandidates('general');if(!candidates.length)throw new Error('Cloudflare Worker ist nicht konfiguriert.');const errors:string[]=[];for(const base of candidates)try{return{data:await readJson<T>(await fetch(buildWorkerUrl(base,mode),{method:'POST',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify(body)})),base}}catch(error){errors.push(error instanceof Error?error.message:String(error))}throw new Error(errors.at(-1)||'Worker ist nicht erreichbar.')}
function serialiseSubscription(subscription:PushSubscription){const json=subscription.toJSON();return{endpoint:subscription.endpoint,expirationTime:subscription.expirationTime,keys:{p256dh:String(json.keys?.p256dh||''),auth:String(json.keys?.auth||'')}}}
async function readyRegistration(){const registration=await navigator.serviceWorker.ready;if(!registration.active)throw new Error('Der MID-Service-Worker ist noch nicht aktiv. App bitte neu öffnen.');return registration}
function activeFavorites(favorites:PushRuleFavorite[]){return favorites.filter(item=>item.rules.precipitationStart||item.rules.thunderstormApproach).map(item=>({id:item.id,name:item.name,latitude:item.latitude,longitude:item.longitude,country:item.country||'',targetType:item.targetType==='tracked-location'?'tracked-location':'favorite',rules:item.rules}))}
async function saveSubscription(subscription:PushSubscription,favorites:PushRuleFavorite[]){return workerPost<WorkerReply>('push-subscribe',{subscription:serialiseSubscription(subscription),favorites:activeFavorites(favorites),appUrl:new URL('./',document.baseURI).toString(),userAgent:navigator.userAgent})}

export async function getPushStatus():Promise<PushStatus>{
 if(!supportsPush())return{supported:false,permission:'unsupported',configured:false,subscribed:false,workerUrl:'',message:'Web Push wird von diesem Browser oder dieser Installationsart nicht unterstützt.'};
 let configured=false,workerUrl='',configError='';try{const result=await workerGet<PushConfig>('push-config');configured=Boolean(result.data.enabled&&result.data.publicKey);workerUrl=result.base;if(!configured)configError='Der Cloudflare Worker ist für Push noch nicht vollständig eingerichtet.'}catch(error){configError=error instanceof Error?error.message:String(error)}
 let subscribed=false;try{subscribed=Boolean((await readyRegistration()).pushManager&&await (await readyRegistration()).pushManager.getSubscription())}catch{}
 const permission=Notification.permission;
 const message=permission==='denied'?'Benachrichtigungen sind im Betriebssystem oder Browser blockiert.':subscribed?'Push-Benachrichtigungen sind auf diesem Gerät aktiv.':configured?'Push ist bereit und kann auf diesem Gerät aktiviert werden.':configError||'Push ist noch nicht eingerichtet.';
 return{supported:true,permission,configured,subscribed,workerUrl,message};
}

export async function enablePushNotifications(favorites:PushRuleFavorite[]){
 if(!supportsPush())throw new Error('Web Push wird von diesem Browser nicht unterstützt.');
 const configResult=await workerGet<PushConfig>('push-config'),config=configResult.data;if(!config.enabled||!config.publicKey)throw new Error('Der Cloudflare Worker ist für Push noch nicht vollständig eingerichtet.');
 const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(permission!=='granted')throw new Error(permission==='denied'?'Benachrichtigungen wurden blockiert.':'Benachrichtigungen wurden nicht freigegeben.');
 const registration=await readyRegistration();let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToBytes(config.publicKey)});
 await saveSubscription(subscription,favorites);return{workerUrl:configResult.base,subscription};
}

export async function syncPushNotifications(favorites:PushRuleFavorite[]){
 if(!supportsPush()||Notification.permission!=='granted')return false;
 const registration=await readyRegistration(),subscription=await registration.pushManager.getSubscription();if(!subscription)return false;await saveSubscription(subscription,favorites);return true;
}

export async function disablePushNotifications(){
 if(!supportsPush())return;
 const registration=await readyRegistration(),subscription=await registration.pushManager.getSubscription();if(!subscription)return;
 await workerPost<WorkerReply>('push-unsubscribe',{endpoint:subscription.endpoint}).catch(()=>undefined);await subscription.unsubscribe();
}
