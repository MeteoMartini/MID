import {useEffect,useId,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,loadOperaRaster,type CompositeProductTimes,type ProductTime,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import {radarDbzColor} from './radarColorTables';
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
 const [opera,setOpera]=useState<{url:string;time:number}>();
 const [operaFinished,setOperaFinished]=useState(false);
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
 const needsOpera=selection===undefined&&Boolean((catalog&&!radar)||failed||(radar&&imageError===radar));
 useEffect(()=>{
  if(!needsOpera)return;
  const controller=new AbortController();
  async function load(){
   const metadata=await loadOperaRaster(lat,lon,controller.signal);
   const reference=Date.now();
   const frame=metadata.frames.filter(item=>{
    const time=Date.parse(item.time);
    return time>=reference-45*60000&&time<=reference+90000;
   }).sort((a,b)=>Date.parse(b.time)-Date.parse(a.time))[0];
   if(!frame)return;
   const {loadOperaRasterData,operaRasterPoint}=await import('./OperaRasterSource');
   const raster=await loadOperaRasterData(frame.fileUrl,controller.signal);
   if(controller.signal.aborted)return;
   const canvas=document.createElement('canvas');
   canvas.width=256;canvas.height=128;
   const context=canvas.getContext('2d');
   if(!context)return;
   const [west,south,east,north]=bounds.split(',').map(Number);
   const image=context.createImageData(canvas.width,canvas.height);
   let covered=false;
   for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const point=operaRasterPoint(raster,north-(y+.5)*(north-south)/canvas.height,west+(x+.5)*(east-west)/canvas.width);
    covered ||= point.covered;
    if(point.dbz!==undefined)image.data.set(radarDbzColor(point.dbz),(y*canvas.width+x)*4);
   }
   if(!covered)return;
   context.putImageData(image,0,0);
   setOpera({url:canvas.toDataURL(),time:Date.parse(frame.time)});
  }
  void load().catch(()=>{}).finally(()=>{if(!controller.signal.aborted)setOperaFinished(true)});
  return ()=>controller.abort();
 },[needsOpera,lat,lon,bounds]);
 const displayedOpera=needsOpera?opera:undefined;
 return <section className="card current-surroundings" aria-labelledby={heading}>
  <header><h2 id={heading}>Wetter im Umfeld</h2><button type="button" onClick={()=>onOpen(displayedOpera?.time??loaded?.time)}>Karte öffnen</button></header>
  <div className="current-surroundings-controls">
   <button type="button" aria-pressed={selection===undefined} onClick={()=>setSelection(undefined)}>Jetzt</button>
   <label>Nächste 2 h <select aria-label="Radar-Nowcast-Termin" value={selection??''} disabled={!future.length} onChange={event=>setSelection(event.target.value?Number(event.target.value):undefined)}>
    <option value="">Termin wählen</option>
    {future.map(time=><option key={time} value={time}>{clock(time)}</option>)}
   </select></label>
  </div>
  <div className="current-surroundings-map" aria-label={`Wetterbild um ${name}`}>
   {clouds&&<img src={clouds} alt="" onError={event=>{event.currentTarget.hidden=true}}/>}
   {(displayedOpera??loaded)&&<img src={(displayedOpera??loaded)?.url} alt="" />}
   <span className="current-surroundings-site">{name}{Number.isFinite(temperature)&&<> · {formatWeatherValue(temperature,'temperature','overview')} °C</>}</span>
  </div>
  <p role="status">{displayedOpera?<>EUMETNET OPERA · Beobachtung {clock(displayedOpera.time)} Uhr</>:needsOpera&&!operaFinished&&!loaded?'Europäisches Radar wird geladen …':loaded?<>DWD-Radar · {loaded.time>now+90000?'Nowcast':'Beobachtung'} {clock(loaded.time)} Uhr{loaded.url!==radar?(imageError===radar?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</p>
  {clouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Beobachtung {clock(satelliteTime)} Uhr</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  <p>Niederschlagsart und Radarlegende in der Detailkarte.</p>
 </section>;
}
