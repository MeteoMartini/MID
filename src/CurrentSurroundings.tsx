import {useEffect,useId,useMemo,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,loadOperaRaster,type CompositeProductTimes,type ProductTime,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import {PRECIPITATION_TYPE_COLORS,radarDbzColor} from './radarColorTables';
import {loadModelMapGeography,type ModelMapGeography} from './modelMapGeography';
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
 const [cloudError,setCloudError]=useState('');
 const [showPhase,setShowPhase]=useState(false);
 const [phaseImage,setPhaseImage]=useState<{url?:string;time:number}>();
 const [phaseLoading,setPhaseLoading]=useState(false);
 useEffect(()=>{
  const controller=new AbortController();
  loadCompositeTimes(lat,lon,controller.signal).then(data=>{if(!controller.signal.aborted)setCatalog(data)}).catch(()=>{if(!controller.signal.aborted)setFailed(true)});
  return ()=>controller.abort();
 },[lat,lon]);
 const now=catalog?Date.now():NaN;
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
  const places:{name:string;x:number;y:number}[]=[];
  for(const place of geography?.places??[]){
   const [x,y]=project(place.lon,place.lat);
   if(x<55||x>457||y<25||y>231||(Math.abs(x-256)<145&&Math.abs(y-128)<32))continue;
   if(places.some(other=>Math.abs(other.x-x)<125&&Math.abs(other.y-y)<32))continue;
   places.push({name:place.name,x,y});
   if(places.length===4)break;
  }
  return {paths,places,center:project(lon,lat)};
 },[geography,west,south,east,north,lat,lon]);
 const radar=target===undefined?'':imageUrl('dwd',rvLayer,target,bounds);
 const satellite=catalog?.satelliteRgbProduct??catalog?.satelliteIrProduct;
 const satelliteTime=validTimes(satellite?.times).filter(time=>time>=now-75*60000&&time<=now+90000).at(-1);
 const clouds=satellite&&satelliteTime!==undefined?imageUrl(satellite.provider,satellite.layer,satelliteTime,bounds):'';
 const clock=(time:number)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 useEffect(()=>{
  if(!radar||target===undefined)return;
  const img=new Image();
  img.onload=()=>{
   const canvas=document.createElement('canvas');
   canvas.width=img.naturalWidth;
   canvas.height=img.naturalHeight;
   const context=canvas.getContext('2d',{willReadFrequently:true});
   try{
    if(context&&canvas.width&&canvas.height){
     context.drawImage(img,0,0);
     if(context.getImageData(0,0,canvas.width,canvas.height).data.some((value,index)=>index%4===3&&value>0)){
      setLoaded({url:radar,time:target});
      return;
     }
    }
   }catch{/* A frame with unreadable pixels cannot establish coverage. */}
   setImageError(radar);
  };
  img.onerror=()=>setImageError(radar);
  img.src=radar;
  return ()=>{img.onload=null;img.onerror=null};
 },[radar,target]);
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
 },[needsOpera,showPhase,lat,lon,bounds]);
 const displayedOpera=needsOpera?opera:undefined;
 const displayedPhase=showPhase&&displayedOpera&&phaseImage?.time===displayedOpera.time?phaseImage:undefined;
 const displayTime=displayedOpera?.time??loaded?.time;
 const [temperatureGrid,setTemperatureGrid]=useState<{time:number;values:{x:number;y:number;value:number}[]}>();
 useEffect(()=>{
  if(selection!==undefined||displayTime===undefined||displayTime>Date.now()+90000)return;
  const controller=new AbortController();
  const time=displayTime;
  void import('./WeatherMapsData').then(({loadWeatherPhaseGrid})=>loadWeatherPhaseGrid(lat,lon,new Date(time).toISOString(),controller.signal)).then(grid=>{
   if(controller.signal.aborted||grid.error||grid.stale||(grid.modelAgeHours??0)>16)return;
   const latStep=Math.abs(grid.lats[1]-grid.lats[0]),lonStep=Math.abs(grid.lons[1]-grid.lons[0]);
   const values=[];
   for(const [x,y] of [[.23,.27],[.77,.27],[.23,.73],[.77,.73]]){
    const row=grid.lats.findIndex(value=>Math.abs(value-(north-y*(north-south)))<=latStep/2);
    const col=grid.lons.findIndex(value=>Math.abs(value-(west+x*(east-west)))<=lonStep/2);
    if(row<0||col<0)continue;
    const index=row*grid.lons.length+col;
    const value=grid.frame.temperature2m[index],valid=Date.parse(grid.phaseValidTimeByCell?.[index]??'');
    if(grid.phaseSourceByCell?.[index]&&Number.isFinite(value)&&Math.abs(valid-time)<=20*60000)values.push({x,y,value});
   }
   setTemperatureGrid({time,values});
  }).catch(()=>{});
  return ()=>controller.abort();
 },[selection,displayTime,lat,lon,west,south,east,north]);
 const temperatures=selection===undefined&&temperatureGrid?.time===displayTime?temperatureGrid?.values:undefined;
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
   {(displayedOpera??loaded)&&<img src={displayedPhase?.url??(displayedOpera??loaded)?.url} alt="" />}
   <svg className="current-surroundings-orientation" viewBox="0 0 512 256" preserveAspectRatio="none" aria-hidden="true"><path d={orientation.paths}/></svg>
   {orientation.places.filter(place=>!temperatures?.some(({x,y})=>Math.abs(place.x-x*512)<85&&Math.abs(place.y-y*256)<30)).map(place=><span key={place.name} className="current-surroundings-place" style={{left:place.x/5.12+'%',top:place.y/2.56+'%'}}>{place.name}</span>)}
   <span className="current-surroundings-site" style={{left:orientation.center[0]/5.12+'%',top:orientation.center[1]/2.56+'%'}}>{name}{Number.isFinite(temperature)&&<> · {formatWeatherValue(temperature,'temperature','overview')} °C</>}</span>
   {temperatures?.map(({x,y,value})=><span key={x+':'+y} className="current-surroundings-temperature" style={{left:x*100+'%',top:y*100+'%'}} aria-label={`Modelltemperatur ${formatWeatherValue(value,'temperature','overview')} Grad Celsius`}>{formatWeatherValue(value,'temperature','overview')}°</span>)}
  </div>
  {geography&&<p>Kartengrundlage · Natural Earth</p>}
  <p role="status">{displayedOpera?<>EUMETNET OPERA · Beobachtung {clock(displayedOpera.time)} Uhr</>:needsOpera&&!operaFinished&&!loaded?'Europäisches Radar wird geladen …':loaded?<>DWD-Radar · {loaded.time>now+90000?'Nowcast':'Beobachtung'} {clock(loaded.time)} Uhr{loaded.url!==radar?(imageError===radar?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</p>
  {visibleClouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Beobachtung {clock(satelliteTime)} Uhr</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  {Boolean(temperatures?.length)&&<p>Umfeldtemperaturen · Modellwerte zum Radarstand</p>}
  {selection===undefined&&showPhase&&(displayedPhase?.url
   ?<p>Radar + Modellphase · {([
    ['rain','Regen'],['mixed','Schneeregen'],['snow','Schnee'],['freezing','Gefrierend'],
    ['graupel','Graupel'],['hail','Hagel / Graupel'],['uncertain','Phase offen']
   ] as const).map(([type,label])=><span key={type} className="current-surroundings-phase"><span aria-hidden="true" style={{color:PRECIPITATION_TYPE_COLORS[type]}}>● </span>{label}</span>)}</p>
   :<p role="status">{phaseLoading?'Niederschlagsart wird geprüft …':'Niederschlagsart für diesen Ausschnitt nicht belegt.'}</p>)}
 </section>;
}
