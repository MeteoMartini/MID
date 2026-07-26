import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,push,panel,worker,sw,legacySw]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'src','pushNotifications.ts'),'utf8'),readFile(path.join(root,'src','PushSettingsPanel.tsx'),'utf8'),readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),readFile(path.join(root,'public','service-worker.js'),'utf8'),readFile(path.join(root,'public','sw.js'),'utf8')
]);
const failures=[];
for(const token of ['Benachrichtigungen','Niederschlagsbeginn','Gewitterzelle nähert sich','tracked-location','TRACKED_PUSH_RULES_KEY','syncPushNotifications'])if(!app.includes(token))failures.push(`Push-App fehlt: ${token}`);
for(const token of ['push-config','push-subscribe','push-unsubscribe','syncPushNotifications','forecastMaterialChange:boolean'])if(!push.includes(token))failures.push(`Push-Client fehlt: ${token}`);
for(const token of ['PushSettingsPanel','Benachrichtigungen aktivieren','Aktueller Standort'])if(!panel.includes(token))failures.push(`Push-Panel fehlt: ${token}`);
for(const token of ['pushConfigured','pushSubscribe','pushUnsubscribe','runPushSchedule','async scheduled','MID_PUSH_SUBSCRIPTIONS','VAPID_PUBLIC_KEY'])if(!worker.includes(token))failures.push(`Push-Worker fehlt: ${token}`);
for(const [name,text] of [['Service Worker',sw],['Legacy Service Worker',legacySw]])for(const token of ["addEventListener('push'","addEventListener('notificationclick'",'showNotification'])if(!text.includes(token))failures.push(`${name}: ${token}`);
if(failures.length){console.error('Push-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
const module=await import('../worker/metar-proxy.js?push-test='+Date.now());
const response=await module.default.fetch(new Request('https://mid.test/?mode=push-config'),{}),data=await response.json();
if(!response.ok||data.enabled!==false||!data.requires?.includes('MID_PUSH_SUBSCRIPTIONS')){console.error('Push-Konfigurationsdiagnose ist nicht fehlertolerant.');process.exit(1)}
console.log('Push-Benachrichtigungen geprüft: App, Panel, Client, Service Worker, Worker-Routen und Konfigurationsdiagnose sind vorhanden.');
