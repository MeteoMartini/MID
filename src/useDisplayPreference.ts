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
export const displayBoolean=(value:unknown):value is boolean=>typeof value==='boolean';
export const displayChoice=<T extends string|number>(...choices:T[])=>(value:unknown):value is T=>choices.includes(value as T);
