import {buildWorkerUrl,workerBaseCandidates} from './workerClient';
import {ventilationPushConfig,type VentilationPushConfig} from './ventilationAssistant';

export type PushRuleFavorite={
 id:string;
 name:string;
 latitude:number;
 longitude:number;
 country?:string;
 rules:{precipitationStart:boolean;thunderstormApproach:boolean;forecastMaterialChange:boolean};
};
export type PushNotificationInterval=15|30|60|120|180;
export type PushStatus={supported:boolean;permission:NotificationPermission|'unsupported';configured:boolean;subscribed:boolean;serverRegistered:boolean;schedulerHealthy:boolean;schedulerLastRunAt?:string;workerCheckedAt?:string;activeFavorites:number;activeRules:number;operational:boolean;workerUrl:string;message:string};

type PushConfig={enabled?:boolean;publicKey?:string;version?:string;error?:string};
type WorkerReply={ok?:boolean;error?:string;favorites?:number;version?:string;registered?:boolean;schedulerHealthy?:boolean;schedulerLastRunAt?:string;checkedAt?:string;activeFavorites?:number;activeRules?:number;lastNotificationAt?:string;lastError?:string};

function supportsPush(){return typeof window!=='undefined'&&'serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window}
function base64UrlToBytes(value:string){const normalized=value.replace(/-/g,'+').replace(/_/g,'/'),padded=normalized+'='.repeat((4-normalized.length%4)%4),raw=atob(padded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes}
async function readJson<T>(response:Response){const text=await response.text();let data:any={};try{data=text?JSON.parse(text):{}}catch{throw new Error(`Worker-Antwort ist kein gültiges JSON (HTTP ${response.status}).`)}if(!response.ok||data?.error)throw new Error(data?.error||`Worker meldet HTTP ${response.status}.`);return data as T}
async function workerGet<T>(mode:string){const candidates=workerBaseCandidates('general');if(!candidates.length)throw new Error('Cloudflare Worker ist nicht konfiguriert.');const errors:string[]=[];for(const base of candidates)try{return{data:await readJson<T>(await fetch(buildWorkerUrl(base,mode),{cache:'no-store',headers:{Accept:'application/json','Cache-Control':'no-cache'}})),base}}catch(error){errors.push(error instanceof Error?error.message:String(error))}throw new Error(errors.at(-1)||'Worker ist nicht erreichbar.')}
async function workerPost<T>(mode:string,body:unknown){const candidates=workerBaseCandidates('general');if(!candidates.length)throw new Error('Cloudflare Worker ist nicht konfiguriert.');const errors:string[]=[];for(const base of candidates)try{return{data:await readJson<T>(await fetch(buildWorkerUrl(base,mode),{method:'POST',cache:'no-store',headers:{Accept:'application/json','Content-Type':'application/json','Cache-Control':'no-cache'},body:JSON.stringify(body)})),base}}catch(error){errors.push(error instanceof Error?error.message:String(error))}throw new Error(errors.at(-1)||'Worker ist nicht erreichbar.')}
function serialiseSubscription(subscription:PushSubscription){const json=subscription.toJSON();return{endpoint:subscription.endpoint,expirationTime:subscription.expirationTime,keys:{p256dh:String(json.keys?.p256dh||''),auth:String(json.keys?.auth||'')}}}
async function readyRegistration(){const registration=await navigator.serviceWorker.ready;if(!registration.active)throw new Error('Der MID-Service-Worker ist noch nicht aktiv. App bitte neu öffnen.');return registration}
function activeFavorites(favorites:PushRuleFavorite[]){return favorites.filter(item=>item.rules.precipitationStart||item.rules.thunderstormApproach||item.rules.forecastMaterialChange).map(item=>({id:item.id,name:item.name,latitude:item.latitude,longitude:item.longitude,country:item.country||'',rules:item.rules}))}
async function saveSubscription(subscription:PushSubscription,favorites:PushRuleFavorite[],notificationIntervalMinutes:PushNotificationInterval,ventilation:VentilationPushConfig|null=ventilationPushConfig()){return workerPost<WorkerReply>('push-subscribe',{subscription:serialiseSubscription(subscription),favorites:activeFavorites(favorites),notificationIntervalMinutes,ventilation,appUrl:new URL('./',document.baseURI).toString(),userAgent:navigator.userAgent})}

export async function getPushStatus():Promise<PushStatus>{
 if(!supportsPush())return{supported:false,permission:'unsupported',configured:false,subscribed:false,serverRegistered:false,schedulerHealthy:false,activeFavorites:0,activeRules:0,operational:false,workerUrl:'',message:'Web Push wird von diesem Browser oder dieser Installationsart nicht unterstützt.'};
 let configured=false,workerUrl='',configError='';try{const result=await workerGet<PushConfig>('push-config');configured=Boolean(result.data.enabled&&result.data.publicKey);workerUrl=result.base;if(!configured)configError='Der Cloudflare Worker ist für Push noch nicht vollständig eingerichtet.'}catch(error){configError=error instanceof Error?error.message:String(error)}
 let subscription:PushSubscription|null=null;try{const registration=await readyRegistration();subscription=await registration.pushManager.getSubscription()}catch{}
 const subscribed=Boolean(subscription),permission=Notification.permission;let serverRegistered=false,schedulerHealthy=false,schedulerLastRunAt:string|undefined,workerCheckedAt:string|undefined,activeFavorites=0,activeRules=0,statusError='';
 if(configured&&subscription)try{const result=await workerPost<WorkerReply>('push-status',{endpoint:subscription.endpoint});workerUrl=result.base;serverRegistered=Boolean(result.data.registered);schedulerHealthy=Boolean(result.data.schedulerHealthy);schedulerLastRunAt=result.data.schedulerLastRunAt;workerCheckedAt=result.data.checkedAt;activeFavorites=Number(result.data.activeFavorites)||0;activeRules=Number(result.data.activeRules)||0;if(result.data.lastError)statusError=result.data.lastError}catch(error){statusError=error instanceof Error?error.message:String(error)}
 const operational=Boolean(subscribed&&serverRegistered&&schedulerHealthy),message=permission==='denied'?'Benachrichtigungen sind im Betriebssystem oder Browser blockiert.':subscribed&&!serverRegistered?`Browser-Push ist vorhanden, aber im MID-Worker nicht registriert.${statusError?` ${statusError}`:' Bitte erneut aktivieren.'}`:subscribed&&serverRegistered&&!schedulerHealthy?`Push ist im Worker registriert, aber der regelmäßige Prüfzeitplan ist noch nicht bestätigt.${schedulerLastRunAt?` Letzter Worker-Lauf: ${new Date(schedulerLastRunAt).toLocaleString('de-DE')}.`:' Cloudflare-Cron prüfen.'}`:operational?`Push ist vollständig betriebsbereit${activeRules?` · ${activeRules} aktive Regel${activeRules===1?'':'n'}`:''}.`:configured?'Push ist bereit und kann auf diesem Gerät aktiviert werden.':configError||'Push ist noch nicht eingerichtet.';
 return{supported:true,permission,configured,subscribed,serverRegistered,schedulerHealthy,schedulerLastRunAt,workerCheckedAt,activeFavorites,activeRules,operational,workerUrl,message};
}

export async function preparePushNotifications(){
 if(!supportsPush())throw new Error('Web Push wird von diesem Browser nicht unterstützt.');
 const permission=Notification.permission==='granted'?'granted':await Notification.requestPermission();if(permission!=='granted')throw new Error(permission==='denied'?'Benachrichtigungen wurden blockiert.':'Benachrichtigungen wurden nicht freigegeben.');
 const configResult=await workerGet<PushConfig>('push-config'),config=configResult.data;if(!config.enabled||!config.publicKey)throw new Error('Der Cloudflare Worker ist für Push noch nicht vollständig eingerichtet.');
 const registration=await readyRegistration();let subscription=await registration.pushManager.getSubscription();if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:base64UrlToBytes(config.publicKey)});
 return{workerUrl:configResult.base,subscription};
}

export async function enablePushNotifications(favorites:PushRuleFavorite[],notificationIntervalMinutes:PushNotificationInterval,ventilation:VentilationPushConfig|null=ventilationPushConfig()){
 const prepared=await preparePushNotifications();await saveSubscription(prepared.subscription,favorites,notificationIntervalMinutes,ventilation);return prepared;
}

export async function syncPushNotifications(favorites:PushRuleFavorite[],notificationIntervalMinutes:PushNotificationInterval,ventilation:VentilationPushConfig|null=ventilationPushConfig()){
 if(!supportsPush()||Notification.permission!=='granted')return false;
 const registration=await readyRegistration(),subscription=await registration.pushManager.getSubscription();if(!subscription)return false;await saveSubscription(subscription,favorites,notificationIntervalMinutes,ventilation);return true;
}


export async function sendPushTestNotification(){
 if(!supportsPush())throw new Error('Web Push wird von diesem Browser nicht unterstützt.');
 const registration=await readyRegistration(),subscription=await registration.pushManager.getSubscription();if(!subscription)throw new Error('Auf diesem Gerät ist kein Push-Abonnement vorhanden.');
 const result=await workerPost<WorkerReply>('push-test',{endpoint:subscription.endpoint});if(!result.data.ok)throw new Error(result.data.error||'Testmitteilung konnte nicht gesendet werden.');return true;
}

export async function disablePushNotifications(){
 if(!supportsPush())return;
 const registration=await readyRegistration(),subscription=await registration.pushManager.getSubscription();if(!subscription)return;
 await workerPost<WorkerReply>('push-unsubscribe',{endpoint:subscription.endpoint}).catch(()=>undefined);await subscription.unsubscribe();
}
