import {storageFallbackEntries} from './storageSafety';
export type PortableUserState={values:Record<string,string>};

const ROOT_KEYS=new Set(['theme','windUnit']);
const TRANSIENT_PREFIXES=[
 'mid:analysis-cache:',
 'mid:ensemble:v9:',
 'mid:climatology:',
 'mid:travel-climate:',
 'mid:travel-snow-depth:',
 'mid:forecast-fusion:',
 'mid:synoptic-snapshot:',
 'mid:icao-location-cache:',
 'mid:eea-station-cache:',
 'mid:thunder-place-cache:',
 'mid:worker:lastGood',
 'mid:update-reload-attempt',
 'mid:runtime',
 'mid:state-restored',
 'mid:twin-background',
 'mid:icloud-backup:last',
 'mid:web-analytics-status'
];
const DEVICE_LOCAL_PREFIXES=[
 'mid:device-sync:',
 'mid:connected-station:',
 'mid:push-subscription',
 'mid:web-push'
];
const DEVICE_LOCAL_KEYS=new Set(['mid:pwaInstallHintDismissed','mid:last-dashboard-section:v1','mid:forecastCockpit:activeHorizon']);

export const PORTABLE_USER_DATA_EXAMPLES=['mid:ensemble:advanced','mid:ensemble:chart-open:temperature','mid:layoutMode','mid:favorites','mid:weather-twin:settings:v1'] as const;
export const PORTABLE_USER_DATA_INCLUDED=[
 'Favoriten, Gruppen, Profile und Standardort',
 'Darstellung, Einheiten, Standard-/Erweitert-Modus und Theme',
 'Diagramm-, Legenden- und Detailansicht-Einstellungen; Hauptmodul-Offenzustand bleibt gerätelokal',
 'Radar-, Meteogramm-, Event-/Reiseplaner- und Benachrichtigungsregeln',
 'Wetterzwilling-Einstellungen, Standortprofile und Langzeitarchiv'
] as const;
export const PORTABLE_USER_DATA_EXCLUDED=[
 'Push-Abonnements des jeweiligen Geräts',
 'Stationspasswörter, Bearer-Token und externe Zugangsschlüssel',
 'temporäre Wetter-, Karten-, Modell- und Diagnostik-Caches',
 'Hauptmodul-Offenzustände (`mid:module:<id>:open`) des jeweiligen Geräts'
] as const;

export function isPortableUserDataKey(key:string){
 if(ROOT_KEYS.has(key))return true;
 if(!key.startsWith('mid:'))return false;
 if(DEVICE_LOCAL_KEYS.has(key))return false;
 if(/^mid:module:[^:]+:open$/.test(key))return false;
 if(TRANSIENT_PREFIXES.some(prefix=>key.startsWith(prefix)))return false;
 if(DEVICE_LOCAL_PREFIXES.some(prefix=>key.startsWith(prefix)))return false;
 return true;
}

export function collectPortableUserData(storage:Storage=localStorage):PortableUserState{
 const values:Record<string,string>={};
 for(let index=0;index<storage.length;index++){
  const key=storage.key(index);
  if(!key||!isPortableUserDataKey(key))continue;
  const value=storage.getItem(key);
  if(value!==null)values[key]=value;
 }
 if(storage===localStorage)for(const[key,value]of storageFallbackEntries())if(isPortableUserDataKey(key))values[key]=value;
 return{values};
}

export function replacePortableUserData(values:Record<string,string>,storage:Storage=localStorage,removeMissing=true){
 let changed=false;
 if(removeMissing){
  const remove=new Set<string>();
  for(let index=0;index<storage.length;index++){
   const key=storage.key(index);
   if(key&&isPortableUserDataKey(key)&&!(key in values))remove.add(key);
  }
  if(storage===localStorage)for(const key of storageFallbackEntries().keys())if(isPortableUserDataKey(key)&&!(key in values))remove.add(key);
  for(const key of remove){storage.removeItem(key);changed=true}
 }
 for(const[key,value]of Object.entries(values)){
  if(!isPortableUserDataKey(key)||typeof value!=='string')continue;
  if(storage.getItem(key)===value)continue;
  storage.setItem(key,value);changed=true;
 }
 return changed;
}
