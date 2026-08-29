import {isDurableStorageKey,isMainModuleViewStateKey,isTransientStorageKey} from './storageContracts';
export {isDurableStorageKey,isMainModuleViewStateKey,isTransientStorageKey} from './storageContracts';

const STORAGE_DB='mid-durable-storage-v1';
const STORAGE_STORE='values';
const RESERVE_KEY='mid:runtime:storage-reserve:v1';
const RESERVE_SIZE=64*1024;

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

export function storageFallbackEntries(){return new Map(fallback)}

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB nicht verfügbar'));return}const request=indexedDB.open(STORAGE_DB,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORAGE_STORE))request.result.createObjectStore(STORAGE_STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function readRecords(){const records=new Map<string,DurableRecord>();try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readonly'),request=tx.objectStore(STORAGE_STORE).openCursor();request.onsuccess=()=>{const cursor=request.result;if(!cursor){resolve();return}const value=cursor.value as DurableRecord;if(value&&typeof value.value==='string')records.set(String(cursor.key),value);cursor.continue()};request.onerror=()=>reject(request.error);tx.onerror=()=>reject(tx.error)});db.close()}catch{}return records}
async function putRecord(key:string,record:DurableRecord){try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readwrite');tx.objectStore(STORAGE_STORE).put(record,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
async function deleteRecord(key:string){try{const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORAGE_STORE,'readwrite');tx.objectStore(STORAGE_STORE).delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}catch{}}
function queueRecord(key:string,record:DurableRecord){const previous=mirrorQueue.get(key)??Promise.resolve(),next=previous.catch(()=>undefined).then(()=>putRecord(key,record));mirrorQueue.set(key,next);void next.finally(()=>{if(mirrorQueue.get(key)===next)mirrorQueue.delete(key)})}
function queueDelete(key:string){const previous=mirrorQueue.get(key)??Promise.resolve(),next=previous.catch(()=>undefined).then(()=>deleteRecord(key));mirrorQueue.set(key,next);void next.finally(()=>{if(mirrorQueue.get(key)===next)mirrorQueue.delete(key)})}

/** Waits briefly for already queued durable mirror writes without blocking the UI indefinitely. */
export async function flushStorageSafetyMirror(maxWaitMs=1400){const deadline=Date.now()+Math.max(0,maxWaitMs);for(;;){const pending=[...mirrorQueue.values()];if(!pending.length)return true;const remaining=deadline-Date.now();if(remaining<=0)return false;await Promise.race([Promise.allSettled(pending).then(()=>undefined),new Promise<void>(resolve=>globalThis.setTimeout(resolve,Math.min(remaining,120)))])}}

function entryTimestamp(raw:string){try{const parsed=JSON.parse(raw) as Record<string,unknown>;for(const key of['savedAt','updatedAt','createdAt','created','time','at']){const value=parsed?.[key],numeric=typeof value==='number'?value:Date.parse(String(value||''));if(Number.isFinite(numeric)&&numeric>0)return numeric}}catch{}return 0}
function transientEntries(){if(!native)return[] as {key:string;raw:string;bytes:number;time:number}[];const rows:{key:string;raw:string;bytes:number;time:number}[]=[];for(let index=native.storage.length-1;index>=0;index--){const key=native.key(index);if(!key||(!isTransientStorageKey(key)&&key!==RESERVE_KEY)||key===RESERVE_KEY)continue;const raw=native.get(key);if(raw===null)continue;rows.push({key,raw,bytes:(key.length+raw.length)*2,time:entryTimestamp(raw)})}return rows}

/** Keeps reconstructible caches bounded without touching favorites, settings, archives or other user data. */
export function trimReconstructibleStorage(aggressive=false){if(!native)return 0;const entries=transientEntries();if(!entries.length)return 0;let removed=0;if(aggressive){for(const entry of entries){native.remove(entry.key);removed++}return removed}const MAX_BYTES=720*1024,MAX_ENTRIES=52,totalBytes=entries.reduce((sum,row)=>sum+row.bytes,0);if(entries.length<=MAX_ENTRIES&&totalBytes<=MAX_BYTES)return 0;const ordered=[...entries].sort((a,b)=>(a.time||0)-(b.time||0)||b.bytes-a.bytes);let bytes=totalBytes,count=entries.length;for(const entry of ordered){if(count<=MAX_ENTRIES&&bytes<=MAX_BYTES)break;native.remove(entry.key);bytes-=entry.bytes;count--;removed++}return removed}

function dropReserve(){if(!native)return;try{native.remove(RESERVE_KEY)}catch{}}
function scheduleReserve(){if(!native||reserveTimer)return;reserveTimer=window.setTimeout(()=>{reserveTimer=0;try{if(native?.get(RESERVE_KEY)===null)native?.set(RESERVE_KEY,'0'.repeat(RESERVE_SIZE))}catch{}},1200)}
function nativeSetWithRecovery(key:string,value:string){if(!native)return false;try{native.set(key,value);return true}catch(error){if(!isQuotaExceededError(error))throw error}dropReserve();trimReconstructibleStorage(true);try{native.set(key,value);scheduleReserve();return true}catch(error){if(!isQuotaExceededError(error))throw error;return false}}

function replaceStorageMethod<K extends 'getItem'|'setItem'|'removeItem'>(storage:Storage,name:K,value:Storage[K]){try{(storage as Storage&Record<K,Storage[K]>)[name]=value;if(storage[name]===value)return}catch{}try{Object.defineProperty(storage,name,{configurable:true,writable:true,value})}catch{}}
function ensureNativeStorage(){if(native)return native;if(typeof window==='undefined'||typeof localStorage==='undefined')return null;const storage=window.localStorage;native={storage,get:Storage.prototype.getItem.bind(storage),set:Storage.prototype.setItem.bind(storage),remove:Storage.prototype.removeItem.bind(storage),key:Storage.prototype.key.bind(storage)};return native}

/** Durable values use the mirrored fallback as authority. This is essential when a quota failure leaves an older native localStorage value behind. */
export function readDurableStorageValue(key:string){const store=ensureNativeStorage();if(isMainModuleViewStateKey(key)){try{return store?.get(key)??null}catch{return null}}if(isDurableStorageKey(key)&&fallback.has(key))return fallback.get(key)??null;try{return store?.get(key)??null}catch{return fallback.get(key)??null}}
export function writeDurableStorageValue(key:string,value:string){const text=String(value),store=ensureNativeStorage();if(!isDurableStorageKey(key)){try{store?.set(key,text);return true}catch{return false}}const committed=store?nativeSetWithRecovery(key,text):false;fallback.set(key,text);queueRecord(key,{value:text,updatedAt:Date.now(),nativeCommitted:committed});return true}
export function removeDurableStorageValue(key:string){const store=ensureNativeStorage();try{store?.remove(key)}catch{}if(isDurableStorageKey(key)){fallback.delete(key);queueDelete(key)}return true}

function installBridge(){if(installed||!native)return;installed=true;const storage=native.storage,getItem=((key:string)=>isMainModuleViewStateKey(key)?native?.get(key)??null:isDurableStorageKey(key)&&fallback.has(key)?fallback.get(key)??null:native?.get(key)??fallback.get(key)??null) as typeof storage.getItem,setItem=((key:string,value:string)=>{if(isDurableStorageKey(key)){writeDurableStorageValue(key,value);return}const text=String(value),committed=nativeSetWithRecovery(key,text);if(!committed)return}) as typeof storage.setItem,removeItem=((key:string)=>{if(isDurableStorageKey(key)){removeDurableStorageValue(key);return}try{native?.remove(key)}catch{}}) as typeof storage.removeItem;replaceStorageMethod(storage,'getItem',getItem);replaceStorageMethod(storage,'setItem',setItem);replaceStorageMethod(storage,'removeItem',removeItem);window.addEventListener('storage',event=>{const key=event.key;if(!key||!isDurableStorageKey(key))return;if(event.newValue===null){fallback.delete(key);queueDelete(key);return}fallback.set(key,event.newValue);queueRecord(key,{value:event.newValue,updatedAt:Date.now(),nativeCommitted:true})})}

/** Initializes quota recovery before React and the persistence/device-sync bridges start. */
export async function initializeStorageSafety(){const store=ensureNativeStorage();if(!store)return false;trimReconstructibleStorage(false);dropReserve();const records=await readRecords();for(const[key,record]of records){if(isMainModuleViewStateKey(key)){queueDelete(key);continue}if(!isDurableStorageKey(key))continue;const local=store.get(key),localRevision=local===null?0:entryTimestamp(local),mirrorRevision=Math.max(Number(record.updatedAt)||0,entryTimestamp(record.value));if(local!==null&&localRevision>mirrorRevision){fallback.set(key,local);queueRecord(key,{value:local,updatedAt:localRevision,nativeCommitted:true});continue}fallback.set(key,record.value);if(local!==record.value||record.nativeCommitted===false){const committed=nativeSetWithRecovery(key,record.value);if(committed)queueRecord(key,{...record,nativeCommitted:true,updatedAt:Date.now()})}}for(let index=0;index<store.storage.length;index++){const key=store.key(index);if(!key||!isDurableStorageKey(key)||records.has(key))continue;const value=store.get(key);if(value===null)continue;fallback.set(key,value);queueRecord(key,{value,updatedAt:Date.now(),nativeCommitted:true})}installBridge();scheduleReserve();return true}
