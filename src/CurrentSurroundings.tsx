import {useEffect,useId,useMemo,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,loadOperaRaster,type CompositeProductTimes,type ProductTime,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import {PRECIPITATION_TYPE_COLORS,radarDbzColor} from './radarColorTables';
import {loadModelMapGeography,type ModelMapGeography} from './modelMapGeography';
import {loadSurroundingsTemperatures,type SurroundingsTemperatureSnapshot} from './currentSurroundingsTemperature';
import './CurrentSurroundings.css';

export type SurroundingsBounds={west:number;south:number;east:number;north:number};

type Props={lat:number;lon:number;name:string;timezone:string;temperature:number;temperatureTime:string;onOpen:(time:number|undefined,bounds:SurroundingsBounds)=>void};
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

export function CurrentSurroundingsEntry({location,current,timezone,onOpen}:{
 location:{latitude:number;longitude:number;name:string};
 current:{temperature_2m?:unknown;time?:unknown};
 timezone:string;
 onOpen:(request:{lat:number;lon:number;time?:number;bounds:SurroundingsBounds;id:number})=>void;
}){
 const {latitude:lat,longitude:lon,name}=location;
 return <CurrentSurroundings key={lat+':'+lon} lat={lat} lon={lon} name={name} timezone={timezone}
  temperature={typeof current.temperature_2m==='number'?current.temperature_2m:NaN}
  temperatureTime={String(current.time??'')} onOpen={(time,bounds)=>onOpen({lat,lon,time,bounds,id:Date.now()})}/>;
}

export default function CurrentSurroundings(props:Props){
 const {lat,lon,name,timezone,temperature,temperatureTime,onOpen}=props;
 const heading=useId();
 const [catalog,setCatalog]=useState<CompositeProductTimes>();
 const [failed,setFailed]=useState(false);
 const [selection,setSelection]=useState<number>();
 const [loaded,setLoaded]=useState<{url:string;time:number;kind:'Beobachtung'|'Nowcast'}>();
 const [now,setNow]=useState(Date.now);
 const [opera,setOpera]=useState<{url:string;time:number}>();
 const [operaFinished,setOperaFinished]=useState(false);
 const [imageError,setImageError]=useState('');
 const [cloudError,setCloudError]=useState('');
 const [showPhase,setShowPhase]=useState(false);
 const [phaseImage,setPhaseImage]=useState<{url?:string;time:number}>();
 const [phaseLoading,setPhaseLoading]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  let loading=false;
  const refresh=()=>{
   if(loading||document.visibilityState==='hidden')return;
   loading=true;
   void loadCompositeTimes(lat,lon,controller.signal).then(data=>{
    if(!controller.signal.aborted){setCatalog(data);setFailed(false)}
   }).catch(()=>{if(!controller.signal.aborted)setFailed(true)}).finally(()=>{loading=false});
  };
  refresh();
  const timer=window.setInterval(refresh,5*60000);
  document.addEventListener('visibilitychange',refresh);
  return ()=>{
   controller.abort();
   window.clearInterval(timer);
   document.removeEventListener('visibilitychange',refresh);
  };
 },[lat,lon]);
 useEffect(()=>{
  const timer=window.setInterval(()=>setNow(Date.now()),30000);
  return ()=>window.clearInterval(timer);
 },[]);
 useEffect(()=>{
  if(selection!==undefined&&selection<=now+90000)setSelection(undefined);
 },[selection,now]);
 // Same admission bounds as the DWD RV point service. An empty WMS image
 // inside these bounds still needs the independent OPERA check.
 const dwdArea=lat>=47&&lat<=55.3&&lon>=5.4&&lon<=15.7;
 const observed=dwdArea?validTimes(catalog?.dwdRadar).filter(time=>time>=now-45*60000&&time<=now+90000).at(-1):undefined;
 const future=dwdArea?validTimes(catalog?.dwdRadarNowcast).filter(time=>time>now+90000&&time<=now+120*60000):[];
 const target=selection===undefined?observed:future.includes(selection)?selection:undefined;
 const west=Math.max(-180,Math.min(177.2,lon-1.4)),south=Math.max(-85,Math.min(83.7,lat-.65));
 const east=west+2.8,north=south+1.3;
 const bounds=[west,south,east,north].join(',');
 const [geography,setGeography]=useState<ModelMapGeography>();
 useEffect(()=>{
  let active=true;
  void loadModelMapGeography().then(value=>{if(active)setGeography(value)}).catch(()=>{});
  return ()=>{active=false};
 },[]);
 const orientation=useMemo(()=>{
  const project=(lng:number,latitude:number)=>[(lng-west)/(east-west)*512,(north-latitude)/(north-south)*256];
  const rings=[...(geography?.countries??[]),...(geography?.states.flatMap(state=>state.rings)??[])];
  const paths=rings.filter(ring=>ring.some(([lng,latitude])=>lng>=west-3&&lng<=east+3&&latitude>=south-2&&latitude<=north+2))
   .map(ring=>ring.map(([lng,latitude],index)=>(index?'L':'M')+project(lng,latitude).map(value=>value.toFixed(1)).join(' ')).join('')).join('');
  const places:{id:string;name:string;x:number;y:number;lat:number;lon:number}[]=[];
  for(const place of geography?.places??[]){
   const [x,y]=project(place.lon,place.lat);
   if(x<55||x>457||y<25||y>231||(Math.abs(x-256)<145&&Math.abs(y-128)<32))continue;
   if(places.some(other=>Math.abs(other.x-x)<125&&Math.abs(other.y-y)<32))continue;
   places.push({id:place.name+':'+place.lat.toFixed(5)+':'+place.lon.toFixed(5),name:place.name,x,y,lat:place.lat,lon:place.lon});
   if(places.length===4)break;
  }
  // Four real georeferenced forecast points, independent of city-label density.
  const temperaturePoints=[{x:.22,y:.25},{x:.78,y:.25},{x:.22,y:.75},{x:.78,y:.75}]
   .map(({x,y},index)=>({id:'surroundings-point-'+index,x:x*512,y:y*256,
    lat:north-y*(north-south),lon:west+x*(east-west)}));
  return {paths,places,temperaturePoints,center:project(lon,lat)};
 },[geography,west,south,east,north,lat,lon]);
 const radar=target===undefined?'':imageUrl('dwd',rvLayer,target,bounds);
 const satellite=catalog?.satelliteRgbProduct??catalog?.satelliteIrProduct;
 const satelliteTime=validTimes(satellite?.times).filter(time=>time>=now-75*60000&&time<=now+90000).at(-1);
 const clouds=satellite&&satelliteTime!==undefined?imageUrl(satellite.provider,satellite.layer,satelliteTime,bounds):'';
 const clock=(time:number)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 const datedClock=(time:number)=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 useEffect(()=>{
  if(!radar||target===undefined)return;
  const img=new Image();
  img.crossOrigin='anonymous';
  img.onload=()=>{
   const canvas=document.createElement('canvas');
   canvas.width=img.naturalWidth;
   canvas.height=img.naturalHeight;
   const context=canvas.getContext('2d',{willReadFrequently:true});
   try{
    if(context&&canvas.width&&canvas.height){
     context.drawImage(img,0,0);
     if(context.getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0)){
      setLoaded({url:radar,time:target,kind:selection===undefined?'Beobachtung':'Nowcast'});
      return;
     }
    }
   }catch{/* A frame with unreadable pixels cannot establish coverage. */}
   setImageError(radar);
  };
  img.onerror=()=>setImageError(radar);
  img.src=radar;
  return ()=>{img.onload=null;img.onerror=null};
 },[radar,target,selection]);
 const needsOpera=selection===undefined&&Boolean(showPhase||(catalog&&!radar)||failed||(radar&&imageError===radar));
 useEffect(()=>{
  if(!needsOpera)return;
  const controller=new AbortController();
  setOperaFinished(false);
  setPhaseImage(undefined);
  setPhaseLoading(showPhase);
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
   const time=Date.parse(frame.time);
   setOpera({url:canvas.toDataURL(),time});
   if(!showPhase)return;
   const [{loadWeatherPhaseGrid},{buildPhaseDisplay,paintPhaseRaster}]=await Promise.all([
    import('./WeatherMapsData'),import('./RadarModelPrecipTypeOverlay')
   ]);
   const grid=await loadWeatherPhaseGrid(lat,lon,frame.time,controller.signal);
   const modelTime=Date.parse(grid.frame?.time??'');
   if(controller.signal.aborted||grid.error||grid.stale||!Number.isFinite(modelTime)||Math.abs(modelTime-time)>20*60000||(grid.modelAgeHours??0)>16)return;
   const phase=buildPhaseDisplay(grid,raster);
   if(phase.colors.size)paintPhaseRaster(context,raster,grid,phase,(x,y)=>({
    lat:north-y*(north-south)/canvas.height,
    lng:west+x*(east-west)/canvas.width
   }));
   setPhaseImage({url:phase.colors.size?canvas.toDataURL():undefined,time});
  }
  void load().catch(()=>{}).finally(()=>{if(!controller.signal.aborted){setOperaFinished(true);setPhaseLoading(false)}});
  return ()=>controller.abort();
 },[needsOpera,showPhase,lat,lon,bounds,catalog?.checkedAt]);
 const displayedOpera=needsOpera&&opera&&opera.time>=now-45*60000?opera:undefined;
 const displayedRadar=loaded&&loaded.time>=now-45*60000?loaded:undefined;
 const displayedPhase=showPhase&&displayedOpera&&phaseImage?.time===displayedOpera.time?phaseImage:undefined;
 const displayTime=displayedOpera?.time??displayedRadar?.time;
 const temperatureTarget=Math.floor(now/(10*60000))*10*60000;
 const [temperatureGrid,setTemperatureGrid]=useState<SurroundingsTemperatureSnapshot>();
 useEffect(()=>{
  if(selection!==undefined||!orientation.temperaturePoints.length){setTemperatureGrid(undefined);return;}
  const controller=new AbortController();
  // One bounded forecast request for up to four real places; entirely independent of radar.
  void loadSurroundingsTemperatures(orientation.temperaturePoints,temperatureTarget,controller.signal)
   .then(result=>{if(!controller.signal.aborted)setTemperatureGrid(result)})
   .catch(()=>{if(!controller.signal.aborted)setTemperatureGrid(undefined)});
  return ()=>controller.abort();
 },[selection,temperatureTarget,orientation.temperaturePoints]);
 const temperatures=selection===undefined?temperatureGrid?.values:undefined;
 const visibleClouds=Boolean(clouds&&cloudError!==clouds);
 return <section className="card current-surroundings" aria-labelledby={heading}>
  <header><h2 id={heading}>Wetter im Umfeld</h2><button type="button" onClick={()=>onOpen(displayTime,{west,south,east,north})}>Karte öffnen</button></header>
  <div className="current-surroundings-controls">
   <button type="button" aria-pressed={selection===undefined} onClick={()=>setSelection(undefined)}>Jetzt</button>
   <button type="button" aria-pressed={showPhase} disabled={selection!==undefined} onClick={()=>setShowPhase(value=>!value)}>Niederschlagsart</button>
   <label>Nächste 2 h <select aria-label="Radar-Nowcast-Termin" value={selection??''} disabled={!future.length} onChange={event=>setSelection(event.target.value?Number(event.target.value):undefined)}>
    <option value="">Termin wählen</option>
    {future.map(time=><option key={time} value={time}>{clock(time)}</option>)}
   </select></label>
  </div>
  <div className="current-surroundings-map" aria-label={`Wetterbild um ${name}`}>
   {visibleClouds&&<img src={clouds} alt="" onError={()=>setCloudError(clouds)}/>}
   {(displayedOpera??displayedRadar)&&<img src={displayedPhase?.url??(displayedOpera??displayedRadar)?.url} alt="" />}
   <svg className="current-surroundings-orientation" viewBox="0 0 512 256" preserveAspectRatio="none" aria-hidden="true"><path d={orientation.paths}/></svg>
   {orientation.places.map(place=><span key={place.id} className="current-surroundings-place" style={{left:place.x/5.12+'%',top:place.y/2.56+'%'}}>
    {place.name}{temperatures?.[place.id]!==undefined&&<strong>{formatWeatherValue(temperatures[place.id],'temperature','overview')}°</strong>}
   </span>)}
   {orientation.temperaturePoints.map(point=>temperatures?.[point.id]===undefined?null:
    <span key={point.id} className="current-surroundings-temperature"
     style={{left:point.x/5.12+'%',top:point.y/2.56+'%'}}
     aria-label={`Modelltemperatur am Kartenpunkt ${formatWeatherValue(temperatures[point.id],'temperature','overview')} Grad Celsius`}>
     {formatWeatherValue(temperatures[point.id],'temperature','overview')}°
    </span>)}
   <span className="current-surroundings-site" style={{left:orientation.center[0]/5.12+'%',top:orientation.center[1]/2.56+'%'}}>{name}{selection===undefined&&Number.isFinite(temperature)&&<strong>{formatWeatherValue(temperature,'temperature','overview')}°</strong>}</span>
  </div>
  <p role="status">{displayedOpera?<>EUMETNET OPERA · Beobachtung {clock(displayedOpera.time)} Uhr</>:needsOpera&&!operaFinished&&!displayedRadar?'Europäisches Radar wird geladen …':displayedRadar?<>DWD-Radar · {displayedRadar.kind} {clock(displayedRadar.time)} Uhr{displayedRadar.url!==radar?((!radar||imageError===radar)?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</p>
  <details className="current-surroundings-sources">
   <summary>Quellen und Datenstand</summary>
   {geography&&<p>Kartengrundlage · Natural Earth</p>}
  {visibleClouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Beobachtung {clock(satelliteTime)} Uhr</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  {selection===undefined&&(temperatureGrid&&temperatures&&Object.keys(temperatures).length
   ?<p>Umfeldtemperaturen · {temperatureGrid.source} {temperatureGrid.modelLabel} · gültig {datedClock(temperatureGrid.validTime)} · {temperatureGrid.available}/{temperatureGrid.requested} Orte · einzelner Modelllauf nicht ausgewiesen</p>
   :<p>Umfeldtemperaturen · Kein zeitlich und räumlich belegtes Temperaturfeld verfügbar</p>)}
  </details>
  {selection===undefined&&showPhase&&(displayedPhase?.url
   ?<p>Radar + Modellphase · {([
    ['rain','Regen'],['mixed','Schneeregen'],['snow','Schnee'],['freezing','Gefrierend'],
    ['graupel','Graupel'],['hail','Hagel / Graupel'],['uncertain','Phase offen']
   ] as const).map(([type,label])=><span key={type} className="current-surroundings-phase"><span aria-hidden="true" style={{color:PRECIPITATION_TYPE_COLORS[type]}}>● </span>{label}</span>)}</p>
   :<p role="status">{phaseLoading?'Niederschlagsart wird geprüft …':'Niederschlagsart für diesen Ausschnitt nicht belegt.'}</p>)}
 </section>;
}
