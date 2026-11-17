/** Deterministic actual MapLibre/React instances for both MID map sizes.
 * Synthetic blank MapLibre maps; no actual DWD/EUMETSAT tile data.
 */
import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Map as MapLibreMap} from 'maplibre-gl';
import {MidMapLibre,useMidMap} from '../../src/MapLibreCore';

declare global{
 interface Window{
  __midResizeMaps?:Record<string,MapLibreMap>;
  __midResizeCalls?:Record<string,number>;
 }
}
const originalResize=MapLibreMap.prototype.resize;
MapLibreMap.prototype.resize=function(...args:Parameters<typeof originalResize>){
 let id='unknown';try{id=String(this.getContainer()?.closest('[data-mid-resize-map]')?.getAttribute('data-mid-resize-map')||'unknown')}catch{}
 const counts=window.__midResizeCalls??={};
 counts[id]=(counts[id]??0)+1;
 return originalResize.apply(this,args);
};

function RecordMap({name}:{name:string}){
 const map=useMidMap();
 useEffect(()=>{
  if(!map)return;
  const registry=window.__midResizeMaps??={};
  registry[name]=map;
  return()=>{if(registry[name]===map)delete registry[name]};
 },[map,name]);
 return null;
}

function Probe(){
 const [mounted,setMounted]=useState(true);
 return <main className="qa-responsive-app">
  <header><h1>MapLibre MID responsive maps — synthetic fixture</h1>
   <button type="button" onClick={()=>setMounted(state=>!state)}>Karten umschalten</button></header>
  {mounted&&<section className="qa-two-maps">
   <article data-mid-resize-map="surroundings" className="qa-surroundings">
    <h2>Wetter im Umfeld</h2>
    <MidMapLibre center={[50.82,7.14]} zoom={8} navigationControl={false}
     scrollZoom={false} className="qa-map-canvas qa-map-compact">
     <RecordMap name="surroundings"/>
    </MidMapLibre>
   </article>
   <article data-mid-resize-map="composite" className="qa-composite">
    <h2>Kartenbereich</h2>
    <MidMapLibre center={[50.82,7.14]} zoom={7} navigationControl={false}
     scrollZoom={false} className="qa-map-canvas qa-map-large">
     <RecordMap name="composite"/>
    </MidMapLibre>
   </article>
  </section>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<Probe/>);
