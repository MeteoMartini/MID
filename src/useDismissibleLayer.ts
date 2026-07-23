import {useEffect,useRef,type RefObject} from 'react';

type ElementRef<T extends HTMLElement> = Pick<RefObject<T>, 'current'>;

export function useDismissibleLayer<T extends HTMLElement>(ref:ElementRef<T>,open:boolean,onDismiss:()=>void){
 const dismissRef=useRef(onDismiss);
 useEffect(()=>{dismissRef.current=onDismiss},[onDismiss]);
 useEffect(()=>{
  if(!open)return;
  const onPointerDown=(event:PointerEvent)=>{if(!ref.current?.contains(event.target as Node))dismissRef.current()};
  const onKeyDown=(event:KeyboardEvent)=>{if(event.key==='Escape')dismissRef.current()};
  document.addEventListener('pointerdown',onPointerDown,true);
  document.addEventListener('keydown',onKeyDown);
  return()=>{
   document.removeEventListener('pointerdown',onPointerDown,true);
   document.removeEventListener('keydown',onKeyDown);
  };
 },[open,ref]);
}
