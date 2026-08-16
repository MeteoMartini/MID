import {readFile} from 'node:fs/promises';

const [app,panel,client,worker,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 "const PUSH_NOTIFICATION_INTERVAL_KEY='mid:pushNotificationIntervalMinutes';",
 'useState<PushNotificationInterval>(storedPushNotificationInterval)',
 'syncPushNotifications(pushFavorites,pushNotificationInterval,ventilation)',
 'notificationIntervalMinutes={pushNotificationInterval}',
 'onNotificationIntervalChange={setPushNotificationInterval}'
])if(!app.includes(token))failures.push(`App-Persistenz/Sync fehlt: ${token}`);
for(const token of [
 'Mindestabstand zwischen Mitteilungen',
 'Benachrichtigungsintervall',
 '15 Minuten · häufig',
 '30 Minuten · ausgewogen',
 '60 Minuten · ruhig',
 '2 Stunden',
 '3 Stunden',
 'onNotificationIntervalChange'
])if(!panel.includes(token))failures.push(`Benachrichtigungs-UI fehlt: ${token}`);
for(const token of [
 'export type PushNotificationInterval=15|30|60|120|180;',
 'notificationIntervalMinutes:PushNotificationInterval',
 'notificationIntervalMinutes,ventilation,appUrl',
 'saveSubscription(subscription,favorites,notificationIntervalMinutes,ventilation)'
])if(!client.includes(token))failures.push(`Push-Client-Übertragung fehlt: ${token}`);
for(const token of [
 'const PUSH_NOTIFICATION_INTERVALS=[15,30,60,120,180];',
 'function pushNotificationReady(',
 'notificationIntervalMinutes=validPushNotificationInterval(body?.notificationIntervalMinutes)',
 'lastNotificationAt:existing?.lastNotificationAt',
 'const canNotify=()=>pushNotificationReady(lastNotificationAt,notificationIntervalMinutes)',
 'if(trigger&&canNotify())',
 'lastNotificationAt,state,checkedAt'
])if(!worker.includes(token))failures.push(`Worker-Cooldown fehlt: ${token}`);
for(const token of ['.push-frequency-group','.push-interval-setting','.push-interval-setting select'])if(!styles.includes(token))failures.push(`Intervall-Styling fehlt: ${token}`);

try{
 const start=worker.indexOf('const PUSH_NOTIFICATION_INTERVALS=');
 const end=worker.indexOf('\nfunction validPushSubscription',start);
 if(start<0||end<0)throw new Error('Hilfsfunktionen nicht extrahierbar');
 const helpers=Function(`${worker.slice(start,end)};return{validPushNotificationInterval,pushNotificationReady}`)();
 if(helpers.validPushNotificationInterval(30)!==30)failures.push('30 Minuten werden nicht akzeptiert.');
 if(helpers.validPushNotificationInterval(5)!==60)failures.push('Ungültige 5 Minuten müssen auf den sicheren Worker-Standard 60 Minuten fallen.');
 const now=Date.parse('2026-07-26T12:00:00Z');
 if(helpers.pushNotificationReady('2026-07-26T11:40:00Z',30,now))failures.push('20 Minuten Abstand dürfen bei 30-Minuten-Auswahl noch keine neue Mitteilung erlauben.');
 if(!helpers.pushNotificationReady('2026-07-26T11:29:00Z',30,now))failures.push('31 Minuten Abstand müssen bei 30-Minuten-Auswahl eine neue Mitteilung erlauben.');
}catch(error){failures.push(`Funktionaler Cooldown-Test fehlgeschlagen: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Benachrichtigungsintervall-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Benachrichtigungsintervall geprüft: Auswahl, Persistenz, Client-Sync und serverseitiger geräteweiter Cooldown sind aktiv.');
