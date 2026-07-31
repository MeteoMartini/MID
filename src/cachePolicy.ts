export type TimedCacheEntry<T>={time:number;value:T};

type Timestamped={createdAt?:number;time?:number};

function finiteTime(value:unknown){const time=Number(value);return Number.isFinite(time)?time:0}

/** Reads a cache entry, removes expired values and refreshes its LRU position. */
export function readFreshMapEntry<K,V>(cache:Map<K,TimedCacheEntry<V>>,key:K,maxAgeMs:number,now=Date.now()):V|undefined{
 const entry=cache.get(key);if(!entry)return undefined;
 if(now-finiteTime(entry.time)>maxAgeMs){cache.delete(key);return undefined}
 cache.delete(key);cache.set(key,entry);return entry.value;
}

/** Stores an entry and removes the least recently used items above the limit. */
export function writeBoundedMapEntry<K,V>(cache:Map<K,V>,key:K,value:V,maxEntries:number){
 cache.delete(key);cache.set(key,value);
 const limit=Math.max(1,Math.floor(maxEntries));
 while(cache.size>limit){const oldest=cache.keys().next().value as K|undefined;if(oldest===undefined)break;cache.delete(oldest)}
}

export function touchMapEntry<K,V>(cache:Map<K,V>,key:K):V|undefined{
 const value=cache.get(key);if(value===undefined)return undefined;cache.delete(key);cache.set(key,value);return value;
}

function storageEntryTime(raw:string){try{const parsed=JSON.parse(raw) as Timestamped;return Math.max(finiteTime(parsed.createdAt),finiteTime(parsed.time))}catch{return 0}}

/** Removes malformed, expired and least-recent entries for selected storage prefixes. */
export function pruneStorageEntries(storage:Storage,prefixes:string[],maxEntries:number,maxAgeMs:number,now=Date.now()){
 const entries:{key:string;time:number}[]=[];
 for(let index=storage.length-1;index>=0;index--){const key=storage.key(index);if(!key||!prefixes.some(prefix=>key.startsWith(prefix)))continue;const raw=storage.getItem(key);if(!raw){storage.removeItem(key);continue}const time=storageEntryTime(raw);if(!time||now-time>maxAgeMs){storage.removeItem(key);continue}entries.push({key,time})}
 entries.sort((a,b)=>b.time-a.time);
 for(const entry of entries.slice(Math.max(1,Math.floor(maxEntries))))storage.removeItem(entry.key);
 return Math.min(entries.length,Math.max(1,Math.floor(maxEntries)));
}

/** Writes with one cleanup-and-retry pass for quota-constrained mobile browsers. */
export function writeBoundedStorage(storage:Storage,key:string,value:unknown,prefixes:string[],maxEntries:number,maxAgeMs:number){
 pruneStorageEntries(storage,prefixes,Math.max(1,maxEntries-1),maxAgeMs);
 const serialized=JSON.stringify(value);
 try{storage.setItem(key,serialized);return true}catch{}
 pruneStorageEntries(storage,prefixes,Math.max(1,Math.floor(maxEntries/2)),maxAgeMs);
 try{storage.setItem(key,serialized);return true}catch{return false}
}
