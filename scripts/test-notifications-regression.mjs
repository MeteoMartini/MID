import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,push,panel,styles,worker,serviceWorker,serviceWorkerAlias,workerReadme,vapid]=await Promise.all([
  read('src/App.tsx'),read('src/pushNotifications.ts'),read('src/PushSettingsPanel.tsx'),read('src/styles.css'),read('worker/metar-proxy.js'),read('public/service-worker.js'),read('public/sw.js'),read('worker/README.md'),read('worker/generate-vapid.mjs')
]);
const failures=[];
const requireTokens=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};

requireTokens('App-Integration',app,[
  "import {syncPushNotifications,type PushRuleFavorite} from './pushNotifications';",
  "import {PushSettingsPanel} from './PushSettingsPanel';",
  "type SettingsSection='view'|'appearance'|'units'|'notifications'|'favorites'|'system';",
  "const TRACKED_LOCATION_KEY='mid:lastTrackedLocation';",
  "const TRACKED_PUSH_RULES_KEY='mid:trackedPushRules';",
  "id:'tracked-location'",
  'if(locationTracking&&trackedLocation)pushFavorites.unshift',
  'void syncPushNotifications(pushFavorites).catch(()=>undefined)',
  "['notifications','Benachrichtigungen',<Bell size={18}/>,'Push-Regeln je Favorit und Standort']",
  "trackedLocation={trackedLocation}",
  "trackedPushRules={trackedPushRules}",
  "setTrackedPushRules={setTrackedPushRules}",
  '<b>Niederschlagsbeginn</b>',
  '<b>Gewitterzelle nähert sich</b>'
]);
requireTokens('Push-Client',push,[
  "workerGet<PushConfig>('push-config')",
  "workerPost<WorkerReply>('push-subscribe'",
  "workerPost<WorkerReply>('push-unsubscribe'",
  'registration.pushManager.subscribe',
  'export async function syncPushNotifications',
  'export async function disablePushNotifications'
]);
requireTokens('Push-Einstellungen',panel,[
  'export function PushSettingsPanel',
  'Aktueller Standort',
  "id:'tracked-location'",
  'locationTracking&&trackedLocation',
  'Benachrichtigungen aktivieren',
  'Auf diesem Gerät deaktivieren',
  'Niederschlagsbeginn',
  'Gewitterzelle nähert sich'
]);
requireTokens('Push-Stile',styles,['.favorite-push-rules{','.push-settings-panel{','.push-status-card{','.push-favorite-list{']);
requireTokens('Cloudflare-Worker',worker,[
  "'access-control-allow-methods':'GET,POST,OPTIONS'",
  'function pushConfigured(env)',
  'async function pushSubscribe(request,env)',
  'async function pushUnsubscribe(request,env)',
  'async function runPushSchedule(env)',
  "if(mode==='push-config')",
  "if(mode==='push-subscribe')",
  "if(mode==='push-unsubscribe')",
  'WebPush:pushConfigured(env)',
  'async scheduled(_controller,env,ctx){ctx.waitUntil(runPushSchedule(env))}'
]);
requireTokens('Service Worker',serviceWorker,["self.addEventListener('push'",'self.registration.showNotification',"self.addEventListener('notificationclick'",'self.clients.openWindow']);
requireTokens('Worker-Anleitung',workerReadme,['MID_PUSH_SUBSCRIPTIONS','VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','*/5 * * * *']);
requireTokens('VAPID-Generator',vapid,["createECDH('prime256v1')",'VAPID_PUBLIC_KEY=','VAPID_PRIVATE_KEY=']);
if(serviceWorker!==serviceWorkerAlias)failures.push('public/service-worker.js und public/sw.js sind nicht identisch.');
if(failures.length){console.error('Benachrichtigungsregression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Benachrichtigungen geprüft: Favoriten und verfolgter Standort, Push-Client, Service Worker, KV/VAPID-Worker und Cron-Auswertung sind vollständig vorhanden.');
