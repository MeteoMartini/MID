import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const weather=await readFile(new URL('../src/weather.ts',import.meta.url),'utf8');
const astronomy=await readFile(new URL('../src/astronomy.ts',import.meta.url),'utf8');
const push=await readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8');
const panel=await readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8');
const sw=await readFile(new URL('../public/service-worker.js',import.meta.url),'utf8');
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const docs=await readFile(new URL('../docs/push-notifications.md',import.meta.url),'utf8');
const required=[
 [app,"label:'Sonne / Mond'"],[app,'pressureTendency(mappedHours)'],[app,"advancedMode&&pressureChange"],
 [weather,"'pressure_msl','precipitation_probability'"],[weather,"past_hours:'6'"],
 [astronomy,'moonIllumination'],[astronomy,'moonTimesForDate'],[astronomy,'dayLengthChangeSeconds'],
 [push,"'push-subscribe'"],[push,"'push-unsubscribe'"],[panel,'Niederschlagsbeginn'],[panel,'Gewitterzelle nähert sich'],
 [sw,"addEventListener('push'"],[sw,"addEventListener('notificationclick'"],
 [worker,"WORKER_VERSION='0.7.92'"],[worker,"mode==='push-config'"],[worker,'async scheduled('],[docs,'https://mid-data-proxy.martinmolkentin.workers.dev'],[docs,'MID_PUSH_SUBSCRIPTIONS'],[docs,'VAPID_PRIVATE_KEY'],[docs,'*/5 * * * *']
];
for(const[source,needle]of required)if(!source.includes(needle))throw new Error(`Fehlender v0.7.92-Baustein: ${needle}`);
const cardLabels=[...app.matchAll(/label:'([^']+)'/g)].map(match=>match[1]);
if(!cardLabels.includes('Sonne / Mond'))throw new Error('Sonne-/Mondkarte fehlt.');
console.log('Astronomie-, Luftdruck- und Push-Regressionstest erfolgreich.');
