import {persistStateNow} from './persistence';
import {flushStorageSafetyMirror} from './storageSafety';
import type {MidNativeAppState} from './runtimePlatform';

export const MID_RUNTIME_RESUME_EVENT='mid:runtime-resume';
export const MID_RUNTIME_SUSPEND_EVENT='mid:runtime-suspend';
export const MID_RUNTIME_CONNECTIVITY_EVENT='mid:runtime-connectivity';

export type MidRuntimeResumeReason='native-active'|'pageshow'|'visibility-visible'|'online';
export type MidRuntimeSuspendReason='native-inactive'|'pagehide'|'visibility-hidden';
export type MidRuntimeResumeDetail={
 reason:MidRuntimeResumeReason;
 at:number;
 elapsedMs:number;
 online:boolean;
 native:boolean;
};
export type MidRuntimeSuspendDetail={
 reason:MidRuntimeSuspendReason;
 at:number;
 online:boolean;
 native:boolean;
};
export type MidRuntimeConnectivityDetail={online:boolean;at:number};

type NativeStateEvent=CustomEvent<MidNativeAppState>;

let started=false;
let backgroundAt=0;
let lastSuspendAt=0;
let lastResumeAt=0;
let checkpointPromise:Promise<void>|null=null;

function isOnline(){return typeof navigator==='undefined'||navigator.onLine!==false}
function nativeReason(reason:MidRuntimeResumeReason|MidRuntimeSuspendReason){return reason.startsWith('native-')}

/**
 * Flushes the durable local snapshot and quota-safety mirror as soon as the
 * runtime is backgrounded. localStorage itself remains the synchronous primary
 * store; this checkpoint only strengthens the independent IndexedDB/cache
 * recovery copies and never deletes or rewrites user data.
 */
export function checkpointMidRuntimeState(reason:MidRuntimeSuspendReason){
 const now=Date.now();
 if(now-lastSuspendAt<250&&checkpointPromise)return checkpointPromise;
 lastSuspendAt=now;
 backgroundAt=backgroundAt||now;
 const detail:MidRuntimeSuspendDetail={reason,at:now,online:isOnline(),native:nativeReason(reason)};
 window.dispatchEvent(new CustomEvent<MidRuntimeSuspendDetail>(MID_RUNTIME_SUSPEND_EVENT,{detail}));
 checkpointPromise=Promise.allSettled([persistStateNow(),flushStorageSafetyMirror(1400)]).then(()=>undefined).finally(()=>{checkpointPromise=null});
 return checkpointPromise;
}

function publishConnectivity(online:boolean){
 const detail:MidRuntimeConnectivityDetail={online,at:Date.now()};
 window.dispatchEvent(new CustomEvent<MidRuntimeConnectivityDetail>(MID_RUNTIME_CONNECTIVITY_EVENT,{detail}));
}

function publishResume(reason:MidRuntimeResumeReason){
 const now=Date.now();
 if(now-lastResumeAt<300&&reason!=='online')return;
 const elapsedMs=backgroundAt?Math.max(0,now-backgroundAt):0;
 backgroundAt=0;
 lastResumeAt=now;
 const detail:MidRuntimeResumeDetail={reason,at:now,elapsedMs,online:isOnline(),native:nativeReason(reason)};
 window.dispatchEvent(new CustomEvent<MidRuntimeResumeDetail>(MID_RUNTIME_RESUME_EVENT,{detail}));
 // Capacitor appStateChange is the authoritative native lifecycle signal. Some
 // WKWebView versions do not emit a DOM visibilitychange on every resume, so a
 // visible-only compatibility pulse reuses the existing shared web refresh
 // handlers without introducing an iOS-only weather/data path.
 if(detail.native&&typeof document!=='undefined'&&document.visibilityState!=='hidden'){
  document.dispatchEvent(new Event('visibilitychange'));
 }
}

/** Installs one shared Browser/PWA/Capacitor lifecycle bridge for the app lifetime. */
export function startRuntimeLifecycleBridge(){
 if(started||typeof window==='undefined')return;
 started=true;
 const nativeState=(event:Event)=>{
  const detail=(event as NativeStateEvent).detail;
  if(detail?.isActive)publishResume('native-active');
  else void checkpointMidRuntimeState('native-inactive');
 };
 const pagehide=()=>void checkpointMidRuntimeState('pagehide');
 const pageshow=()=>publishResume('pageshow');
 const visibility=()=>{
  if(document.visibilityState==='hidden')void checkpointMidRuntimeState('visibility-hidden');
  else publishResume('visibility-visible');
 };
 const offline=()=>publishConnectivity(false);
 const online=()=>{publishConnectivity(true);publishResume('online')};
 window.addEventListener('mid:native-app-state',nativeState as EventListener);
 window.addEventListener('pagehide',pagehide);
 window.addEventListener('pageshow',pageshow);
 document.addEventListener('visibilitychange',visibility);
 window.addEventListener('offline',offline);
 window.addEventListener('online',online);
}
