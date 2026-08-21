/**
 * App-weiter Persistenzvertrag.
 *
 * Rekonstruierbare Netzwerk-/Analyse-Caches werden weder in den dauerhaften
 * Snapshot noch in den IndexedDB-Spiegel aufgenommen. Nutzerentscheidungen,
 * Favoriten und Modulkonfigurationen bleiben dagegen dauerhaft erhalten.
 */
export const TRANSIENT_STORAGE_PREFIXES=[
 'mid:analysis-cache:',
 'mid:ensemble:',
 'mid:climatology:',
 'mid:travel-climate:',
 'mid:travel-snow-depth:',
 'mid:forecast-fusion:',
 'mid:forecast-core:',
 'mid:icao-location-cache:',
 'mid:eea-station-cache:',
 'mid:thunder-place-cache:',
 'mid:synoptic-snapshot:',
 'mid:worker:lastGood',
 'mid:update',
 'mid:runtime:',
 'mid:state-restored',
 'mid:twin-background',
 'mid:icloud-backup:last',
 'mid:web-analytics-status'
] as const;

export const ROOT_DURABLE_STORAGE_KEYS=new Set(['theme','windUnit']);

export function isMainModuleViewStateKey(key:string){
 return /^mid:module:[^:]+:open$/.test(key)||key.startsWith('mid:module-open-contract:');
}

export function isTransientStorageKey(key:string){
 return TRANSIENT_STORAGE_PREFIXES.some(prefix=>key.startsWith(prefix));
}

export function isDurableStorageKey(key:string){
 return !isMainModuleViewStateKey(key)&&(ROOT_DURABLE_STORAGE_KEYS.has(key)||(key.startsWith('mid:')&&!isTransientStorageKey(key)));
}

export function isPersistentBackupKey(key:string){
 return (key.startsWith('mid:')||ROOT_DURABLE_STORAGE_KEYS.has(key))&&!isTransientStorageKey(key)&&!isMainModuleViewStateKey(key);
}
