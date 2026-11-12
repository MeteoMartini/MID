import {useEffect,useState} from 'react';
import {fetchWorkerJson} from './workerClient';

type Forecast={
 available:boolean;
 error?:string;
 run?:string;
 forecast?:{validAt:string;amountMm:number|null}[];
};

export default function GeoSphereIncaNowcast({lat,lon,timezone}:{lat:number;lon:number;timezone:string}){
 const [open,setOpen]=useState(false);
 const [result,setResult]=useState<{key:string;forecast:Forecast}>();
 const key=`${lat},${lon}`;
 const inRegion=lat>=46&&lat<=49.2&&lon>=9&&lon<=17.3;
 useEffect(()=>{
  if(!open||!inRegion)return;
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>;
  const load=async()=>{
   try{
    const forecast=await fetchWorkerJson<Forecast>('geosphere-inca-point',{lat,lon},
     {purpose:'radar',signal:controller.signal,timeoutMs:9000});
    if(!controller.signal.aborted)setResult({key,forecast});
   }catch{
    if(!controller.signal.aborted)setResult({key,forecast:{available:false}});
   }finally{
    if(!controller.signal.aborted)timer=setTimeout(load,300_000);
   }
  };
  void load();
  return()=>{controller.abort();clearTimeout(timer)};
 },[open,inRegion,key,lat,lon]);
 if(!inRegion)return null;
 const forecast=result?.key===key?result.forecast:undefined;
 const rows=forecast?.available?forecast.forecast?.filter(row=>Date.parse(row.validAt)>Date.now()):undefined;
 const formatter=new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone});
 const amount=new Intl.NumberFormat('de-DE',{maximumFractionDigits:2});
 return <details onToggle={event=>setOpen(event.currentTarget.open)}>
  <summary>INCA-Kurzfristprognose am Ort</summary>
  {open&&(!forecast?<p role="status">Kurzfristprognose wird geladen …</p>:rows?.length&&forecast.run?<div>
   <p>GeoSphere Austria · Modelllauf {formatter.format(new Date(forecast.run))} · 1-km-Raster · 15-Minuten-Takt</p>
   <table aria-label="INCA-Niederschlagsprognose">
    <thead><tr><th scope="col">Gültig um</th><th scope="col">Niederschlag</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.validAt}><th scope="row">{formatter.format(new Date(row.validAt))}</th>
     <td>{row.amountMm===null?'Keine Daten':`${amount.format(row.amountMm)} mm`}</td></tr>)}</tbody>
   </table>
  </div>:<p role="status">Für diesen Ort liegt derzeit keine INCA-Kurzfristprognose vor.</p>)}
  {open&&<p><a href="https://data.hub.geosphere.at/en/dataset/nowcast-v1-15min-1km">GeoSphere Austria · INCA</a> · <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>}
 </details>;
}
