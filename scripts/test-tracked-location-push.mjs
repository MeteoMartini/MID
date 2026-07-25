import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const panel=await readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8');
const push=await readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8');
const worker=await readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const required=[
 [app,"TRACKED_PUSH_LOCATION_KEY='mid:trackedPushLocation'"],
 [app,"id:'tracked-location'"],
 [app,"targetType:'tracked-location'"],
 [app,'trackedPushRules'],
 [panel,'Aktueller Standort'],
 [panel,'onRefreshTrackedLocation'],
 [panel,'zuletzt erfolgreich übermittelte Position'],
 [push,"PushTargetType='favorite'|'tracked-location'"],
 [worker,"targetType:item?.targetType==='tracked-location'?'tracked-location':'favorite'"],
 [worker,"tracked=favorite.targetType==='tracked-location'"],
 [worker,'stored.targetKey===targetKey'],
 [worker,'next={...old,targetKey}'],
 [styles,'.push-tracked-location']
];
for(const[source,needle]of required)if(!source.includes(needle))throw new Error(`Fehlender Standort-Push-Baustein: ${needle}`);
console.log('Standortverfolgungs-Push ist vollständig verdrahtet.');
