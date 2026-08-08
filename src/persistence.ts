import {storageFallbackEntries} from './storageSafety';
const DB_NAME='mid-persistent-state';
const STORE='snapshots';
const SNAPSHOT_KEY='current';
const CACHE_NAME='mid-state-backup-v1';
const CACHE_URL='./__mid_state_backup__.json';
const TRANSIENT_PREFIXES=['mid:analysis-cache:','mid:ensemble:','mid:climatology:','mid:travel-climate:','mid:travel-snow-depth:','mid:forecast-fusion:','mid:icao-location-cache:','mid:eea-station-cache:','mid:thunder-place-cache:','mid:synoptic-snapshot:','mid:worker:lastGood','mid:update','mid:runtime','mid:state-restored','mid:twin-background','mid:web-analytics-status'];
const INCLUDED_KEYS=(key:string)=>(key.startsWith('mid:')||['theme','windUnit'].includes(key))&&!TRANSIENT_PREFIXES.some(prefix=>key.startsWith(prefix));

type Snapshot={schema:'mid-state';version:1;savedAt:string;values:Record<string,string>};
type IdleWindow=Window&{requestIdleCallback?:(callback:()=>void,options?:{timeout:number})=>number;cancelIdleCallback?:(handle:number)=>void};

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function collect():Snapshot{const values:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&INCLUDED_KEYS(key)){const value=localStorage.getItem(key);if(value!==null)values[key]=value}}for(const[key,value]of storageFallbackEntries())if(INCLUDED_KEYS(key))values[key]=value;return{schema:'mid-state',version:1,savedAt:new Date().toISOString(),values}}
async function writeDb(snapshot:Snapshot){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot,SNAPSHOT_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}
async function readDb():Promise<Snapshot|null>{const db=await openDb();const result=await new Promise<Snapshot|null>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const request=tx.objectStore(STORE).get(SNAPSHOT_KEY);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error)});db.close();return result}
async function writeCache(snapshot:Snapshot){if(!('caches'in window))return;const cache=await caches.open(CACHE_NAME);await cache.put(new URL(CACHE_URL,document.baseURI).toString(),new Response(JSON.stringify(snapshot),{headers:{'content-type':'application/json','cache-control':'no-store'}}))}
async function readCache():Promise<Snapshot|null>{if(!('caches'in window))return null;const response=await caches.match(new URL(CACHE_URL,document.baseURI).toString());if(!response)return null;try{return await response.json() as Snapshot}catch{return null}}
function valid(snapshot:Snapshot|null):snapshot is Snapshot{return Boolean(snapshot&&snapshot.schema==='mid-state'&&snapshot.version===1&&snapshot.values&&typeof snapshot.values==='object')}
function apply(snapshot:Snapshot){for(const[key,value]of Object.entries(snapshot.values))if(INCLUDED_KEYS(key)&&localStorage.getItem(key)===null)localStorage.setItem(key,value)}
export async function restorePersistentState(){try{const candidates=await Promise.allSettled([readDb(),readCache()]);const snapshots=candidates.filter((x):x is PromiseFulfilledResult<Snapshot|null>=>x.status==='fulfilled').map(x=>x.value).filter(valid).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt));if(!snapshots.length)return false;apply(snapshots[0]);sessionStorage.setItem('mid:state-restored','1');return true}catch{return false}}

let timer:number|undefined,idleHandle:number|undefined,persistPromise:Promise<void>|null=null,persistAgain=false;
export function persistStateNow(){if(persistPromise){persistAgain=true;return persistPromise}persistPromise=(async()=>{do{persistAgain=false;const snapshot=collect();await Promise.allSettled([writeDb(snapshot),writeCache(snapshot)])}while(persistAgain)})().catch(()=>undefined).finally(()=>{persistPromise=null});return persistPromise}
function cancelScheduled(){if(timer!==undefined){window.clearTimeout(timer);timer=undefined}if(idleHandle!==undefined){(window as IdleWindow).cancelIdleCallback?.(idleHandle);idleHandle=undefined}}
function schedulePersist(){cancelScheduled();timer=window.setTimeout(()=>{timer=undefined;const idleWindow=window as IdleWindow;if(idleWindow.requestIdleCallback)idleHandle=idleWindow.requestIdleCallback(()=>{idleHandle=undefined;void persistStateNow()},{timeout:1200});else void persistStateNow()},350)}
function flushPersist(){cancelScheduled();void persistStateNow()}
export function startPersistenceBridge(){const originalSet=localStorage.setItem.bind(localStorage),originalRemove=localStorage.removeItem.bind(localStorage);try{localStorage.setItem=((key:string,value:string)=>{if(localStorage.getItem(key)===value)return;originalSet(key,value);if(INCLUDED_KEYS(key))schedulePersist()}) as typeof localStorage.setItem;localStorage.removeItem=((key:string)=>{if(localStorage.getItem(key)===null)return;originalRemove(key);if(INCLUDED_KEYS(key))schedulePersist()}) as typeof localStorage.removeItem}catch{}const pagehide=()=>flushPersist(),visibility=()=>{if(document.visibilityState==='hidden')flushPersist()};window.addEventListener('pagehide',pagehide);document.addEventListener('visibilitychange',visibility);schedulePersist()}
