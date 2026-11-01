import {useEffect,useRef,useState} from 'react';
import {useMidMap} from './MapLibreCore';
import type {WeatherMapProduct} from './WeatherMapsData';
import {downloadOriginalWmsPng,planOriginalWmsExport} from './wmsOriginalMapExport';
import './wmsOriginalExport.css';

type Props={product:WeatherMapProduct;style:string;validTime:string;runTime:string;level?:number;ready:boolean};

/** Shared source-bound WMS exporter for UnifiedWeatherMap and WeatherMapsPanel. */
export default function WmsOriginalExportControl({product,style,validTime,runTime,level,ready}:Props){
 const map=useMidMap(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef<AbortController|null>(null);
 useEffect(()=>{setError('');setBusy(false);return()=>{pending.current?.abort();pending.current=null}},[product.id,style,validTime,runTime,level,ready]);
 if(!ready||!validTime||!runTime)return null;
 const exportPng=async()=>{
  if(!map||busy)return;
  const controller=new AbortController();pending.current=controller;setBusy(true);setError('');
  try{
   const bounds=map.getBounds(),canvas=map.getCanvas();
   const plan=planOriginalWmsExport({
    product,style,validTime,runTime,level,
    bounds:{west:bounds.getWest(),south:bounds.getSouth(),east:bounds.getEast(),north:bounds.getNorth()},
    viewportWidth:canvas.clientWidth,viewportHeight:canvas.clientHeight
   });
   await downloadOriginalWmsPng(plan,controller.signal);
  }catch(cause){
   if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:'Der WMS-Export ist nicht verfügbar.');
  }finally{
   if(pending.current===controller){pending.current=null;setBusy(false)}
  }
 };
 return <div className="mid-wms-original-export" aria-busy={busy}>
  <button type="button" onClick={()=>void exportPng()} disabled={busy||!map}
   aria-label="Original-WMS-Wetterfläche und Anbieterlegende als PNG herunterladen">
   {busy?'Anbieterbilder laden …':'WMS-Wetterfläche + Legende · PNG'}
  </button>
  {error&&<p role="alert">{error}</p>}
  <small>Nur bestätigter Modelltermin · ohne Basiskarte, Radar oder Satellit</small>
 </div>;
}
