import {useEffect,useState} from 'react';
/** Content selection survives; a temporary menu never survives app suspension. */
export function useTransientNavigationDrawer(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{const close=()=>setOpen(false),hidden=()=>{if(document.visibilityState==='hidden')close()};window.addEventListener('pagehide',close);window.addEventListener('pageshow',close);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('pagehide',close);window.removeEventListener('pageshow',close);document.removeEventListener('visibilitychange',hidden)}},[]);
 return [open,setOpen] as const;
}
