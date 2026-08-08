const STORAGE_DB='mid-durable-storage-v1';
const STORAGE_STORE='values';
const RESERVE_KEY='mid:runtime:storage-reserve:v1';
const RESERVE_SIZE=64*1024;

const TRANSIENT_PREFIXES=[
 'mid:analysis-cache:',
 'mid:ensemble:v9:',
 'mid:climatology:',
 'mid:travel-climate:',
 'mid:travel-snow-depth:',
 'mid:forecast-fusion:',
 'mid:icao-location-cache:',
 'mid:eea-station-cache:',
 'mid:thunder-place-cache:',
 'mid:worker:lastGood',
 'mid:update-reload-attempt',
 'mid:runtime:',
 'mid:state-restored',
 'mid:twin-background',
 'mid:icloud-backup:last',
 'mid:web-analytics-status',
 'mid:synoptic-snapshot:'
] as const;

const ROOT_DURABLE_KEYS=new Set(['theme','windUnit']);

type DurableRecord={value:string;updatedAt:number;nativeCommitted:boolean};
type NativeStorage={
 storage:Storage;
 get:(key:string)=>string|null;
 set:(key:string,value:string)=>void;
 remove:(key:string)=>void;
 key:(index:number)=>string|null;
};

let native:NativeStorage|null=null;
let installed=false;
let reserveTimer=0;
const fallback=new Map<string,string>();
const mirrorQueue=new Map<string,Promise<void>>();

export function isQuotaExceededError(error:unknown){
 if(error instanceof DOMException&&['QuotaExceededError','NS_ERROR_DOM_QUOTA_REACHED'].includes(error.name))return true;
 const value=error as {name?:string;code?:number;message?:string}|null;
 return Boolean(value&&(value.code===22||value.code===1014||/quota|storage.*full|exceeded/i.test(String(value.message||''))));
}

export function isTransientStorageKey(key:string){return key===RESERVE_KEY||TRANSIENT_PREFIXES.some(prefix=>key.startsWith(prefix))}
export function isDurableStorageKey(key:string){return ROOT_DURABLE_KEYS.has(key)||(key.startsWith('mid:')&&!isTransientStorageKey(key))}
export function storageFallbackEntries(){return new Map(fallback)}

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB nicht verfügbar'));return}const request=indexedDB.open(STORAGE_DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORAGE_STORE))request.result.createObjectStore(STORAGE_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function readRecords(){const records=new Map<string,DurableRecord>();try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readonly'),request=tx.objectStore(STORAGE_STORE).openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return}const value=cursor.value as DurableRecord;if(value&&typeof value.value==='string')records.set(String(cursor.key),value);cursor.continue()};request.onerror=()=>reject(request.error);tx.onerror=()=>reject(tx.error)});db.close()}catch{}return records}
async function putRecord(key:string,record:DurableRecord){try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readwrite');tx.objectStore(STORAGE_STORE).put(record,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
async function deleteRecord(key:string){try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readwrite');tx.objectStore(STORAGE_STORE).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
function queueRecord(key:string,record:DurableRecord){const previous=mirrorQueue.get(key)??Promise.resolve(),next=previous.catch(()=>undefined).then(()=>putRecord(key,record));mirrorQueue.set(key,next);void next.finally(()=>{if(mirrorQueue.get(key)===next)mirrorQueue.delete(key)})}
function queueDelete(key:string){const previous=mirrorQueue.get(key)??Promise.resolve(),next=previous.catch(()=>undefined).then(()=>deleteRecord(key));mirrorQueue.set(key,next);void next.finally(()=>{if(mirrorQueue.get(key)===next)mirrorQueue.delete(key)})}

function entryTimestamp(raw:string){try{const parsed=JSON.parse(raw) as Record<string,unknown>;for(const key of['savedAt','updatedAt','createdAt','created','time','at']){const value=parsed?.[key],numeric=typeof value==='number'?value:Date.parse(String(value||''));if(Number.isFinite(numeric)&&numeric>0)return numeric}}catch{}return 0}
function transientEntries(){if(!native)return[] as {key:string;raw:string;bytes:number;time:number}[];const rows:{key:string;raw:string;bytes:number;time:number}[]=[];for(let index=native.storage.length-1;index>=0;index--){const key=native.key(index);if(!key||!isTransientStorageKey(key)||key===RESERVE_KEY)continue;const raw=native.get(key);if(raw===null)continue;rows.push({key,raw,bytes:(key.length+raw.length)*2,time:entryTimestamp(raw)})}return rows}

/** Keeps reconstructible caches bounded without touching favorites, settings, archives or other user data. */
export function trimReconstructibleStorage(aggressive=false){if(!native)return 0;const entries=transientEntries();if(!entries.length)return 0;let removed=0;if(aggressive){for(const entry of entries){native.remove(entry.key);removed++}return removed}const MAX_BYTES=720*1024,MAX_ENTRIES=52,totalBytes=entries.reduce((sum,row)=>sum+row.bytes,0);if(entries.length<=MAX_ENTRIES&&totalBytes<=MAX_BYTES)return 0;const ordered=[...entries].sort((a,b)=>(a.time||0)-(b.time||0)||b.bytes-a.bytes);let bytes=totalBytes,count=entries.length;for(const entry of ordered){if(count<=MAX_ENTRIES&&bytes<=MAX_BYTES)break;native.remove(entry.key);bytes-=entry.bytes;count--;removed++}return removed}

function dropReserve(){if(!native)return;try{native.remove(RESERVE_KEY)}catch{}}
function scheduleReserve(){if(!native||reserveTimer)return;reserveTimer=window.setTimeout(()=>{reserveTimer=0;try{if(native?.get(RESERVE_KEY)===null)native?.set(RESERVE_KEY,'0'.repeat(RESERVE_SIZE))}catch{}},1200)}
function nativeSetWithRecovery(key:string,value:string){if(!native)return false;try{native.set(key,value);return true}catch(error){if(!isQuotaExceededError(error))throw error}dropReserve();trimReconstructibleStorage(true);try{native.set(key,value);scheduleReserve();return true}catch(error){if(!isQuotaExceededError(error))throw error;return false}}

function replaceStorageMethod<K extends 'getItem'|'setItem'|'removeItem'>(storage:Storage,name:K,value:Storage[K]){try{(storage as Storage&Record<K,Storage[K]>)[name]=value;if(storage[name]===value)return}catch{}try{Object.defineProperty(storage,name,{configurable:true,writable:true,value})}catch{}}
function installBridge(){if(installed||!native)return;installed=true;const storage=native.storage,getItem=((key:string)=>native?.get(key)??fallback.get(key)??null) as typeof storage.getItem,setItem=((key:string,value:string)=>{const text=String(value),durable=isDurableStorageKey(key),committed=nativeSetWithRecovery(key,text);if(durable){fallback.set(key,text);queueRecord(key,{value:text,updatedAt:Date.now(),nativeCommitted:committed})}if(!committed&&!durable)return}) as typeof storage.setItem,removeItem=((key:string)=>{try{native?.remove(key)}catch{}if(isDurableStorageKey(key)){fallback.delete(key);queueDelete(key)}}) as typeof storage.removeItem;replaceStorageMethod(storage,'getItem',getItem);replaceStorageMethod(storage,'setItem',setItem);replaceStorageMethod(storage,'removeItem',removeItem)}

/** Initializes quota recovery before React and the persistence/device-sync bridges start. */
export async function initializeStorageSafety(){if(typeof window==='undefined'||typeof localStorage==='undefined')return false;if(!native){const storage=window.localStorage;native={storage,get:Storage.prototype.getItem.bind(storage),set:Storage.prototype.setItem.bind(storage),remove:Storage.prototype.removeItem.bind(storage),key:Storage.prototype.key.bind(storage)}}trimReconstructibleStorage(false);dropReserve();const records=await readRecords();for(const[key,record]of records){if(!isDurableStorageKey(key))continue;const local=native.get(key);if(local===null||record.nativeCommitted===false){fallback.set(key,record.value);const committed=nativeSetWithRecovery(key,record.value);if(committed)queueRecord(key,{...record,nativeCommitted:true,updatedAt:Date.now()})}else fallback.set(key,local)}for(let index=0;index<native.storage.length;index++){const key=native.key(index);if(!key||!isDurableStorageKey(key))continue;const value=native.get(key);if(value===null)continue;fallback.set(key,value);if(!records.has(key))queueRecord(key,{value,updatedAt:Date.now(),nativeCommitted:true})}installBridge();scheduleReserve();return true}
