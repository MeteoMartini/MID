import {useEffect,useId,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,type CompositeProductTimes,type ProductTime,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import './CurrentSurroundings.css';

type Props={lat:number;lon:number;name:string;timezone:string;temperature:number;temperatureTime:string;onOpen:(time?:number)=>void};
const rvLayer='dwd:Radar_rv_product_1x1km_ger';

function validTimes(values:ProductTime[]|undefined){
 return [...new Set((values??[]).map(value=>typeof value==='number'?value*(value<1e12?1000:1):Date.parse(value)).filter(Number.isFinite))].sort((a,b)=>a-b);
}

function imageUrl(provider:WmsProvider,layer:string,time:number,bounds:string){
 const proxy=compositeWmsProxy(provider);
 if(!proxy)return '';
 const url=new URL(proxy,window.location.href);
 const parameters={service:'WMS',request:'GetMap',version:'1.1.1',srs:'EPSG:4326',layers:layer,format:'image/png',transparent:'true',bbox:bounds,width:'512',height:'256',time:new Date(time).toISOString()};
 for(const [key,value] of Object.entries(parameters))url.searchParams.set(key,value);
 return url.href;
}

export default function CurrentSurroundings(props:Props){
 const {lat,lon,name,timezone,temperature,temperatureTime,onOpen}=props;
 const heading=useId();
 const [catalog,setCatalog]=useState<CompositeProductTimes>();
 const [failed,setFailed]=useState(false);
 const [selection,setSelection]=useState<number>();
 const [loaded,setLoaded]=useState<{url:string;time:number}>();
 const [imageError,setImageError]=useState('');
 useEffect(()=>{
  const controller=new AbortController();
  loadCompositeTimes(lat,lon,controller.signal).then(data=>{if(!controller.signal.aborted)setCatalog(data)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});
  return ()=>controller.abort();
 },[lat,lon]);
 const now=Date.parse(catalog?.serverTime??'');
 const observed=validTimes(catalog?.dwdRadar).filter(time=>time>=now-45*60000&&time<=now+90000).at(-1);
 const future=validTimes(catalog?.dwdRadarNowcast).filter(time=>time>now+90000&&time<=now+120*60000);
 const target=selection??observed;
 const bounds=[Math.max(-180,lon-1.4),Math.max(-90,lat-.65),Math.min(180,lon+1.4),Math.min(90,lat+.65)].join(',');
 const radar=target===undefined?'':imageUrl('dwd',rvLayer,target,bounds);
 const satellite=catalog?.satelliteRgbProduct??catalog?.satelliteIrProduct;
 const satelliteTime=validTimes(satellite?.times).filter(time=>time>=now-75*60000&&time<=now+90000).at(-1);
 const clouds=satellite&&satelliteTime!==undefined?imageUrl(satellite.provider,satellite.layer,satelliteTime,bounds):'';
 const clock=(time:number)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 useEffect(()=>{
  if(!radar||target===undefined)return;
  const img=new Image();
  img.onload=()=>setLoaded({url:radar,time:target});
  img.onerror=()=>setImageError(radar);
  img.src=radar;
  return ()=>{img.onload=null;img.onerror=null};
 },[radar,target]);
 return <section className="card current-surroundings" aria-labelledby={heading}>
  <header><h2 id={heading}>Wetter im Umfeld</h2><button type="button" onClick={()=>onOpen(loaded?.time)}>Karte öffnen</button></header>
  <div className="current-surroundings-controls">
   <button type="button" aria-pressed={selection===undefined} onClick={()=>setSelection(undefined)}>Jetzt</button>
   <label>Nächste 2 h <select aria-label="Radar-Nowcast-Termin" value={selection??''} disabled={!future.length} onChange={event=>setSelection(event.target.value?Number(event.target.value):undefined)}>
    <option value="">Termin wählen</option>
    {future.map(time=><option key={time} value={time}>{clock(time)}</option>)}
   </select></label>
  </div>
  <div className="current-surroundings-map" aria-label={`Wetterbild um ${name}`}>
   {clouds&&<img src={clouds} alt="" onError={event=>{event.currentTarget.hidden=true}}/>}
   {loaded&&<img src={loaded.url} alt="" />}
   <span className="current-surroundings-site">{name}{Number.isFinite(temperature)&&<> · {formatWeatherValue(temperature,'temperature','overview')} °C</>}</span>
  </div>
  <p role="status">{loaded?<>DWD-Radar · {loaded.time>now+90000?'Nowcast':'Beobachtung'} {clock(loaded.time)} Uhr{loaded.url!==radar?(imageError===radar?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</p>
  {clouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Beobachtung {clock(satelliteTime)} Uhr</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  <p>Niederschlagsart und Radarlegende in der Detailkarte.</p>
 </section>;
}
