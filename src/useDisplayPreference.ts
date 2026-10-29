import {useCallback,useRef,useState,type Dispatch,type SetStateAction} from 'react';
import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety';

const prefix='mid:display-preference:v1:';
export function readDisplayPreference<T>(id:string,fallback:T,valid:(value:unknown)=>value is T):T{
 try{const raw=readDurableStorageValue(prefix+id);if(raw!==null){const value:unknown=JSON.parse(raw);if(valid(value))return value}}catch{}
 return fallback;
}
export function writeDisplayPreference<T>(id:string,value:T){
 writeDurableStorageValue(prefix+id,JSON.stringify(value));
 if(typeof window!=='undefined')window.dispatchEvent(new Event('mid:display-preference-changed'));
}
/** User choices commit synchronously before rendering, including rapid functional toggles. */
export function useDisplayPreference<T>(id:string,fallback:T,valid:(value:unknown)=>value is T):[T,Dispatch<SetStateAction<T>>]{
 const [value,setValue]=useState(()=>readDisplayPreference(id,fallback,valid)),current=useRef(value);
 const set=useCallback<Dispatch<SetStateAction<T>>>(action=>{
  const next=typeof action==='function'?(action as (previous:T)=>T)(current.current):action;
  if(!valid(next))return;
  writeDisplayPreference(id,next);current.current=next;setValue(next);
 },[id,valid]);
 return [value,set];
}
export const displayBoolean=(value:unknown):value is boolean=>typeof value==='boolean';
export const displayChoice=<T extends string|number>(...choices:T[])=>(value:unknown):value is T=>choices.includes(value as T);
