import {isMidNativeRuntime} from './runtimePlatform';
import {MID_VERSION} from './version';

// Web/PWA only. No SDK autocapture, cookies, persistent identity, URLs or location payloads.
export const MID_POSTHOG_CONSENT_KEY='mid:posthog-diagnostics-consent:v1';
const TOKEN=String(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN||'').trim();
const HOST=String(import.meta.env.VITE_POSTHOG_HOST||'').trim().replace(/\/+$/,'');
const ALLOWED_HOST='https://eu.i.posthog.com';
const ALLOWED_SECTIONS=new Set(['current','today','forecast','composite','more']);
const MAX_EVENTS_PER_PAGE=30;
type MidEvent='mid_runtime_ready'|'mid_navigation_attempt'|'mid_client_error';
type SafeProperties=Record<string,string|number|boolean>;
let installed=false,distinctId='',emitted=0;
const pending=new Set<AbortController>();

export function isMidPosthogConfigured(){
 return Boolean(import.meta.env.PROD&&TOKEN&&HOST===ALLOWED_HOST&&!isMidNativeRuntime());
}
export function isMidPosthogConsentGranted(){
 if(typeof localStorage==='undefined')return false;
 try{return localStorage.getItem(MID_POSTHOG_CONSENT_KEY)==='1'}catch{return false}
}
function canCapture(){
 return isMidPosthogConfigured()&&isMidPosthogConsentGranted()&&Boolean(distinctId)&&emitted<MAX_EVENTS_PER_PAGE;
}
function safeMillis(value:number){
 return Number.isFinite(value)&&value>=0&&value<120_000?Math.round(value):undefined;
}
function send(event:MidEvent,properties:SafeProperties={}){
 if(!canCapture())return;
 emitted++;
 const controller=new AbortController();
 pending.add(controller);
 // The browser supplies no current_url, referrer, coordinates or persistent person ID.
 const payload={
  api_key:TOKEN,
  distinct_id:distinctId,
  event,
  properties:{$process_person_profile:false,mid_version:MID_VERSION,mid_runtime:'web',...properties},
 };
 void fetch(`${ALLOWED_HOST}/i/v0/e/`,{
  method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',
  headers:{'Content-Type':'application/json'},
  cache:'no-store',keepalive:true,signal:controller.signal,body:JSON.stringify(payload),
 }).catch(()=>undefined).finally(()=>pending.delete(controller));
}
function onNavigationClick(event:MouseEvent){
 if(!(event.target instanceof Element))return;
 const el=event.target.closest<HTMLElement>('button[data-mid-telemetry-section]');
 const section=el?.dataset.midTelemetrySection;
 if(!section||!ALLOWED_SECTIONS.has(section)||el?.hasAttribute('disabled'))return;
 send('mid_navigation_attempt',{section});
}
function onClientError(event:ErrorEvent){
 // Never transmit error.message, stack, URL, filenames, form input or arbitrary text.
 const name=event.error instanceof Error?event.error.name:'Error';
 const category=['TypeError','ReferenceError','RangeError','SyntaxError'].includes(name)?name:'Error';
 send('mid_client_error',{category,source:'window'});
}
function onUnhandledRejection(){
 send('mid_client_error',{category:'PromiseRejection',source:'window'});
}
function onRuntimeHealthy(){
 const props:SafeProperties={};
 const startup=safeMillis(performance.now());
 if(startup!==undefined)props.startup_ms=startup;
 const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming|undefined;
 if(nav){
  const dom=safeMillis(nav.domContentLoadedEventEnd);
  if(dom!==undefined)props.dom_content_loaded_ms=dom;
  const load=safeMillis(nav.loadEventEnd);
  if(load!==undefined)props.load_event_ms=load;
 }
 send('mid_runtime_ready',props);
}
export function startMidPosthogTelemetry(){
 if(installed||typeof window==='undefined'||!isMidPosthogConfigured()||!isMidPosthogConsentGranted())return;
 installed=true;
 distinctId=crypto.randomUUID();
 document.addEventListener('click',onNavigationClick,{passive:true});
 window.addEventListener('error',onClientError);
 window.addEventListener('unhandledrejection',onUnhandledRejection);
 window.addEventListener('mid:runtime-healthy',onRuntimeHealthy,{once:true});
}
export function setMidPosthogConsent(granted:boolean){
 try{
  if(granted)localStorage.setItem(MID_POSTHOG_CONSENT_KEY,'1');
  else localStorage.removeItem(MID_POSTHOG_CONSENT_KEY);
 }catch{return false}
 if(!granted){
  for(const controller of pending)controller.abort();
  pending.clear();distinctId='';
 }else{
  if(installed&&!distinctId)distinctId=crypto.randomUUID();
  startMidPosthogTelemetry();
 }
 window.dispatchEvent(new CustomEvent('mid:posthog-consent-changed',{detail:granted}));
 return true;
}
