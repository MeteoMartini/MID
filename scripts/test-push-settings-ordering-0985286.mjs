import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const dir=mkdtempSync(join(tmpdir(),'mid-push-order-'));
const originals=new Map(['window','navigator','Notification','localStorage','document','fetch'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve}};
try{
 await build({entryPoints:['src/pushNotifications.ts'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'client.mjs'),logLevel:'silent',plugins:[{name:'fixture-boundaries',setup(b){
  b.onResolve({filter:/^\.\/(workerClient|ventilationAssistant)$/},args=>({path:args.path,namespace:'fixture'}));
  b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.endsWith('workerClient')?"export const workerBaseCandidates=()=>['https://push.test'];export const buildWorkerUrl=(base,mode)=>base+'/?mode='+mode;":"export const ventilationPushConfig=()=>null;",loader:'js'}));
 }}]});
 const store=new Map(),first=deferred(),entered=deferred(),posts=[];let active=0,maxActive=0,failNext=false,available=true,serverMode='relative';
 const subscription={endpoint:'https://push.example/device',expirationTime:null,toJSON:()=>({keys:{p256dh:'key',auth:'auth'}}),unsubscribe:async()=>true};
 const registration={active:{},pushManager:{getSubscription:async()=>available?subscription:null}};
 const install=(key,value)=>Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 install('window',{PushManager:class{},Notification:{}});install('Notification',{permission:'granted'});
 install('navigator',{serviceWorker:{ready:Promise.resolve(registration)},userAgent:'MID deterministic fixture'});
 install('document',{baseURI:'https://midwx.app/'});
 install('localStorage',{getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value))});
 install('fetch',async(url,options)=>{
  const mode=new URL(url).searchParams.get('mode');
  if(mode==='push-config')return Response.json({enabled:true,publicKey:'AA'});
  if(mode==='push-status')return Response.json({registered:true,schedulerHealthy:true,timeDisplayMode:serverMode,deviceTimeZone:'Europe/Berlin'});
  assert.equal(mode,'push-subscribe');const body=JSON.parse(options.body);posts.push(body);active++;maxActive=Math.max(maxActive,active);
  try{if(posts.length===1){entered.resolve();await first.promise}if(failNext){failNext=false;return Response.json({error:'fixture'}, {status:503})}serverMode=body.timeDisplayMode;return Response.json({ok:true,timeDisplayMode:serverMode});}finally{active--}
 });
 const client=await import(pathToFileURL(join(dir,'client.mjs')));
 const favorites=[{id:'one',name:'Bonn',latitude:50.7,longitude:7.1,rules:{precipitationStart:true,thunderstormApproach:false,forecastMaterialChange:false}}];
 assert.equal(client.writePushTimeDisplayMode('relative'),true);const old=client.syncPushNotifications(favorites,30);await entered.promise;
 client.writePushTimeDisplayMode('absolute');const newer=client.syncPushNotifications(favorites,30);
 await new Promise(resolve=>setTimeout(resolve,20));assert.equal(posts.length,1,'later registration must wait behind the delayed older POST');
 first.resolve();assert.equal(await old,true);assert.equal(await newer,true);assert.equal(maxActive,1);assert.deepEqual(posts.map(p=>p.timeDisplayMode),['relative','absolute']);assert.equal(serverMode,'absolute');
 const status=await client.getPushStatus();assert.equal(status.timeDisplayMode,'absolute');assert.equal(status.deviceTimeZone,'Europe/Berlin');
 failNext=true;await assert.rejects(client.syncPushNotifications(favorites,30));assert.equal(await client.syncPushNotifications(favorites,30),true,'a failed registration must not poison the queue');
 available=false;assert.equal(await client.syncPushNotifications(favorites,30),false,'no subscription is not a server confirmation');
 // A server that cannot confirm the selected mode may not yield a success message.
 available=true;install('fetch',async()=>Response.json({ok:true}));await assert.rejects(client.syncPushNotifications(favorites,30),/nicht bestätigt/);
 install('localStorage',{getItem:()=>null,setItem:()=>{throw new Error('storage denied')}});assert.equal(client.writePushTimeDisplayMode('absolute'),false,'failed local persistence must not claim saved preferences');
}finally{
 for(const[key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}
 rmSync(dir,{recursive:true,force:true});
}

const worker=readFileSync('worker-src/30-push-events.js','utf8');
const slice=(from,to)=>{const start=worker.indexOf(from),end=worker.indexOf(to,start);assert(start>=0&&end>start);return worker.slice(start,end)};
const source=slice('function pushRegistrationSignature','async function pushSubscribe');
let current,writes=[];
const env={MID_PUSH_SUBSCRIPTIONS:{get:async()=>structuredClone(current)}};
const signatureHelpers={validPushSubscription:v=>v,validPushFavorites:v=>v,validVentilationPushConfig:v=>v,validPushNotificationInterval:v=>v,validPushPrecipitationAlert:v=>v,validPushTimeDisplayMode:v=>v,validPushTimeZone:v=>v,putPushEntry:async(e,k,value)=>{writes.push(structuredClone(value));current=structuredClone(value)},pushScheduleIndexUpsert:async()=>{}};
const helpers=Function(...Object.keys(signatureHelpers),source+';return{savePushRuntime,pushRegistrationStillCurrent,pushRegistrationSignature};')(...Object.values(signatureHelpers));
const old={subscription:{endpoint:'https://push.example/device'},timeDisplayMode:'relative',deviceTimeZone:'UTC',favorites:[{id:'old'}],state:{old:{rainEventKey:'old'}},lastNotificationAt:'2026-10-17T10:00:00Z'};
current={...structuredClone(old),timeDisplayMode:'absolute',deviceTimeZone:'Europe/Berlin',favorites:[{id:'new'}],state:{new:{rainEventKey:'new'}},lastNotificationAt:'2026-10-17T12:00:00Z'};
assert.equal(await helpers.pushRegistrationStillCurrent(env,'sub:x',helpers.pushRegistrationSignature(old)),false);
await helpers.savePushRuntime(env,'sub:x',old,{state:{old:{rainEventKey:'stale'}},lastNotificationAt:'2026-10-17T11:00:00Z'});
assert.equal(current.timeDisplayMode,'absolute');assert.equal(current.deviceTimeZone,'Europe/Berlin');assert.equal(current.favorites[0].id,'new');assert.deepEqual(current.state,{new:{rainEventKey:'new'}});assert.equal(current.lastNotificationAt,'2026-10-17T12:00:00Z');
const fresh=structuredClone(current);await helpers.savePushRuntime(env,'sub:x',fresh,{lastTestNotificationAt:'2026-10-17T13:00:00Z'});assert.deepEqual(current.state,fresh.state,'a test notification may not erase scheduler state');
current=null;const count=writes.length;assert.equal(await helpers.savePushRuntime(env,'sub:x',old,{state:{}}),false);assert.equal(writes.length,count,'scheduler must not resurrect an unsubscribed device');
// Suspend the real scheduler evaluation while settings change, then resume it.
const weatherEntered=deferred(),weatherReady=deferred();let sent=0;
const scheduled={...structuredClone(old),notificationIntervalMinutes:30,precipitationAlert:{leadMinutes:60,minimumAmountMm:.1,minimumDurationMinutes:0},favorites:[{id:'one',name:'Bonn',latitude:50.7,longitude:7.1,country:'DE',rules:{precipitationStart:true,thunderstormApproach:false,forecastMaterialChange:false}}]};
current=structuredClone(scheduled);
const evaluationDependencies={...signatureHelpers,...helpers,validVentilationPushConfig:()=>null,pushNotificationReady:()=>true,pushWeatherState:()=>{weatherEntered.resolve();return weatherReady.promise},pushLocationPhrases:f=>({name:f.name,at:f.name}),pushPrecipitationTiming:()=>({title:'in 30 Minuten',body:'in 30 Minuten'}),pushPrecipitationDurationText:()=>'',sendWebPush:async()=>{sent++;return{ok:true}},pushFavoriteUrl:()=>'',pushLocationPayload:()=>({}),deletePushEntry:async()=>assert.fail('new registration must not be deleted')};
const evaluate=Function(...Object.keys(evaluationDependencies),slice('async function evaluatePushEntry','function deviceSyncConfigured')+';return evaluatePushEntry;')(...Object.values(evaluationDependencies));
const pending=evaluate('sub:x',structuredClone(scheduled),env,new Map(),new Map(),new Map(),new Map(),new Map());await weatherEntered.promise;
current={...structuredClone(scheduled),timeDisplayMode:'absolute',deviceTimeZone:'Europe/Berlin',favorites:[]};
weatherReady.resolve({active:false,upcomingMinutes:30,upcomingKey:'fixture',kind:'Regen',expectedAmountMm:1});await pending;
assert.equal(sent,0,'a delayed evaluation of old rules must not send after the readable registration changed');assert.equal(current.timeDisplayMode,'absolute');assert.deepEqual(current.favorites,[]);
const panel=readFileSync('src/PushSettingsPanel.tsx','utf8');for(const token of ['sequence!==timeDisplaySequence.current','serverseitig bestätigt','Übertragung ausstehend','Benachrichtigungen sind auf diesem Gerät noch nicht aktiviert','status.timeDisplayMode===timeDisplayMode'])assert(panel.includes(token),token);
assert(worker.includes('timeDisplayMode:entry.timeDisplayMode')&&worker.includes('timeDisplayMode:entry?validPushTimeDisplayMode(entry.timeDisplayMode)'),'write acknowledgement and status must expose the accepted mode');
assert.equal((worker.match(/if\(!await pushRegistrationStillCurrent\(env,key,registrationSignature\)\)return/g)||[]).length,4,'all notification triggers must recheck readable registration before sending');
console.log('MID .286: ordered client registration, accepted-mode acknowledgement, visible pending/no-subscription states, newest readable registration/runtime preservation, and no device resurrection. KV eventual consistency remains explicit.');
