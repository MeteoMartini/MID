import {useCallback,useMemo,useSyncExternalStore,type Dispatch,type SetStateAction} from 'react';
import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';

const prefix='mid:display-preference:v1:';
const snapshots=new Map<string,{raw:string;value:unknown}>();
export function readDisplayPreference<T>(id:string,fallback:T,valid:(value:unknown)=>value is T):T{
 try{const raw=readDurableStorageValue(prefix+id);if(raw!==null){const cached=snapshots.get(id);if(cached?.raw===raw&&valid(cached.value))return cached.value;const value:unknown=JSON.parse(raw);if(valid(value)){snapshots.set(id,{raw,value});return value}}}catch{}
 return fallback;
}
export function writeDisplayPreference<T>(id:string,value:T){
 writeDurableStorageValue(prefix+id,JSON.stringify(value));
 if(typeof window!=='undefined')window.dispatchEvent(new Event('mid:display-preference-changed'));
}
function subscribe(callback:()=>void){
 if(typeof window==='undefined')return()=>{};
 window.addEventListener('mid:display-preference-changed',callback);window.addEventListener('storage',callback);
 return()=>{window.removeEventListener('mid:display-preference-changed',callback);window.removeEventListener('storage',callback)};
}
/** Stable snapshots and latest-value updates also cover parallel panels and changing view keys. */
export function useDisplayPreference<T>(id:string,fallback:T,valid:(value:unknown)=>value is T):[T,Dispatch<SetStateAction<T>>]{
 // Like a state initializer: preserve the default for this key, including object defaults.
 const initial=useMemo(()=>fallback,[id]);
 const getSnapshot=useCallback(()=>readDisplayPreference(id,initial,valid),[id,initial,valid]);
 const value=useSyncExternalStore(subscribe,getSnapshot,()=>initial);
 const set=useCallback<Dispatch<SetStateAction<T>>>(action=>{
  const previous=getSnapshot(),next=typeof action==='function'?(action as (previous:T)=>T)(previous):action;
  if(valid(next))writeDisplayPreference(id,next);
 },[id,getSnapshot,valid]);
 return [value,set];
}
/**
 * Observe an existing durable, unversioned preference without migrating or overwriting its
 * original key. Primitive snapshots remain stable for React 19. Updates are written before
 * React renders, and every mounted panel reads the latest value on every action.
 * Returning null from parse means "missing/invalid", not the valid value false or 0.
 */
export function readRawDisplayPreference<T extends string|number|boolean>(key:string,fallback:T,parse:(raw:string|null)=>T|null):T{
 try{const value=parse(readDurableStorageValue(key));return value===null?fallback:value}catch{return fallback}
}
export function useRawDisplayPreference<T extends string|number|boolean>(key:string,fallback:T,parse:(raw:string|null)=>T|null,serialize:(value:T)=>string):[T,Dispatch<SetStateAction<T>>]{
 const initial=useMemo(()=>fallback,[key]);
 const getSnapshot=useCallback(()=>readRawDisplayPreference(key,initial,parse),[key,initial,parse]);
 const value=useSyncExternalStore(subscribe,getSnapshot,()=>initial);
 const set=useCallback<Dispatch<SetStateAction<T>>>(action=>{
  const previous=getSnapshot(),next=typeof action==='function'?(action as (previous:T)=>T)(previous):action;
  try{
   const raw=serialize(next);
   if(!Object.is(parse(raw),next))return;
   writeDurableStorageValue(key,raw);
   if(typeof window!=='undefined')window.dispatchEvent(new Event('mid:display-preference-changed'));
  }catch{}
 },[key,getSnapshot,parse,serialize]);
 return[value,set];
}

export const displayBoolean=(value:unknown):value is boolean=>typeof value==='boolean';
export const displayChoice=<T extends string|number>(...choices:T[])=>(value:unknown):value is T=>choices.includes(value as T);
