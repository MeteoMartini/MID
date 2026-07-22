const DB_NAME='mid-persistent-state';
const STORE='snapshots';
const SNAPSHOT_KEY='current';
const CACHE_NAME='mid-state-backup-v1';
const CACHE_URL='./__mid_state_backup__.json';
const INCLUDED_KEYS=(key:string)=>key.startsWith('mid:')||['theme','windUnit'].includes(key);

type Snapshot={schema:'mid-state';version:1;savedAt:string;values:Record<string,string>};

function openDb():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
function collect():Snapshot{const values:Record<string,string>={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key&&INCLUDED_KEYS(key)){const value=localStorage.getItem(key);if(value!==null)values[key]=value}}return{schema:'mid-state',version:1,savedAt:new Date().toISOString(),values}}
async function writeDb(snapshot:Snapshot){const db=await openDb();await new Promise<void>((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(snapshot,SNAPSHOT_KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)});db.close()}
async function readDb():Promise<Snapshot|null>{const db=await openDb();const result=await new Promise<Snapshot|null>((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const request=tx.objectStore(STORE).get(SNAPSHOT_KEY);request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error)});db.close();return result}
async function writeCache(snapshot:Snapshot){if(!('caches'in window))return;const cache=await caches.open(CACHE_NAME);await cache.put(new URL(CACHE_URL,document.baseURI).toString(),new Response(JSON.stringify(snapshot),{headers:{'content-type':'application/json','cache-control':'no-store'}}))}
async function readCache():Promise<Snapshot|null>{if(!('caches'in window))return null;const response=await caches.match(new URL(CACHE_URL,document.baseURI).toString());if(!response)return null;try{return await response.json() as Snapshot}catch{return null}}
function valid(snapshot:Snapshot|null):snapshot is Snapshot{return Boolean(snapshot&&snapshot.schema==='mid-state'&&snapshot.version===1&&snapshot.values&&typeof snapshot.values==='object')}
function apply(snapshot:Snapshot){for(const[key,value]of Object.entries(snapshot.values))if(INCLUDED_KEYS(key)&&localStorage.getItem(key)===null)localStorage.setItem(key,value)}
export async function restorePersistentState(){try{if(localStorage.getItem('mid:favorites'))return false;const candidates=await Promise.allSettled([readDb(),readCache()]);const snapshots=candidates.filter((x):x is PromiseFulfilledResult<Snapshot|null>=>x.status==='fulfilled').map(x=>x.value).filter(valid).sort((a,b)=>Date.parse(b.savedAt)-Date.parse(a.savedAt));if(!snapshots.length)return false;apply(snapshots[0]);sessionStorage.setItem('mid:state-restored','1');return true}catch{return false}}
let timer:number|undefined;
export async function persistStateNow(){try{const snapshot=collect();await Promise.allSettled([writeDb(snapshot),writeCache(snapshot)])}catch{}}
export function startPersistenceBridge(){const schedule=()=>{window.clearTimeout(timer);timer=window.setTimeout(()=>void persistStateNow(),350)};const originalSet=localStorage.setItem.bind(localStorage),originalRemove=localStorage.removeItem.bind(localStorage);try{localStorage.setItem=((key:string,value:string)=>{originalSet(key,value);if(INCLUDED_KEYS(key))schedule()}) as typeof localStorage.setItem;localStorage.removeItem=((key:string)=>{originalRemove(key);if(INCLUDED_KEYS(key))schedule()}) as typeof localStorage.removeItem}catch{}window.addEventListener('pagehide',()=>void persistStateNow());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void persistStateNow()});schedule()}
