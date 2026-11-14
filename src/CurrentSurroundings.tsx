import {useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,loadOperaRaster,openFreeMapVectorTileProxy,openFreeMapGlyphProxy,type CompositeProductTimes,type ProductTime,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import {ecmwfTemperatureColor} from "./temperatureTone";
import {useSurroundingsCloudImage} from "./currentSurroundingsCloudImage";
import {PRECIPITATION_TYPE_COLORS,radarDbzColor} from './radarColorTables';
import {loadModelMapGeography,type ModelMapGeography} from './modelMapGeography';
import {browserExternalWeatherFallbackAllowed} from './workerClient';
import {MidMapLibre,ImageQuadLayer,HtmlMarker,MapFitBounds,useMidMap} from './MapLibreCore';
import {VectorReferenceLayer} from './MapLibreLegacyCompat';
import UnifiedVectorBasemap from './UnifiedVectorBasemap';
import {compositeReferenceLayers} from './mapReferenceLayers';
import {chooseSurroundingsCities,citiesFromMapFeatures,type SurroundingsCityCandidate} from './surroundingsCitySelection';
import {loadSurroundingsTemperatures,type SurroundingsTemperatureSnapshot} from './currentSurroundingsTemperature';
import './CurrentSurroundings.css';

export type SurroundingsBounds={west:number;south:number;east:number;north:number};

type Props={lat:number;lon:number;name:string;timezone:string;temperature:number;temperatureTime:string;onOpen:(time:number|undefined,bounds:SurroundingsBounds)=>void};
const rvLayer='dwd:Radar_rv_product_1x1km_ger';
// Mirror UnifiedVectorBasemap's proxied, consent-gated vector source policy.
const DIRECT_VECTOR_TILES='https://tiles.openfreemap.org/planet/latest/{z}/{x}/{y}.pbf';
const DIRECT_VECTOR_GLYPHS='https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
const surroundingReference={countries:true,regions:true,cities:true,water:true,roads:true};
function mapSafe(value:string){return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]||c))}
function useDarkMapTheme(){
 const [dark,setDark]=useState(()=>document.documentElement.dataset.theme==='dark'||document.documentElement.classList.contains('dark'));
 useEffect(()=>{const root=document.documentElement,update=()=>setDark(root.dataset.theme==='dark'||root.classList.contains('dark'));const observer=new MutationObserver(update);observer.observe(root,{attributes:true,attributeFilter:['data-theme','class']});return()=>observer.disconnect()},[]);
 return dark;
}
function MapCityInventory({onChange}:{onChange:(values:SurroundingsCityCandidate[])=>void}){
 const map=useMidMap();
 useEffect(()=>{if(!map)return;
  const collect=()=>{try{if(!map.getSource('unified-vector-base-source'))return;const cities=citiesFromMapFeatures(map.querySourceFeatures('unified-vector-base-source',{sourceLayer:'place'}));if(cities.length)onChange(cities)}catch{/* Never fabricate geographic inventory. */}};
  // Re-evaluate once tiles settle; sourcedata fires per tile and would trigger redundant model requests.
  map.on('idle',collect);collect();
  return()=>{map.off('idle',collect)};
 },[map,onChange]);
 return null;
}

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
 return <CurrentSurroundings key={`${lat}:${lon}`} lat={lat} lon={lon} name={name} timezone={timezone}
  temperature={typeof current.temperature_2m==='number'?current.temperature_2m:NaN}
  temperatureTime={String(current.time??'')} onOpen={(time,bounds)=>onOpen({lat,lon,time,bounds,id:Date.now()})}/>;
}

export default function CurrentSurroundings(props:Props){
 const {lat,lon,name,timezone,temperature,temperatureTime,onOpen}=props;
 const heading=useId();
 const [mode,setMode]=useState<'cloud'|'radar'>('cloud');
 const [catalog,setCatalog]=useState<CompositeProductTimes>();
 const [failed,setFailed]=useState(false);
 const [selection,setSelection]=useState<number>();
 const [loaded,setLoaded]=useState<{url:string;time:number;kind:'Beobachtung'|'Nowcast'}>();
 const [now,setNow]=useState(Date.now);
 const cloudForecast=useSurroundingsCloudImage(mode==='cloud',lat,lon,now);
 const [opera,setOpera]=useState<{url:string;time:number}>();
 const [operaFinished,setOperaFinished]=useState(false);
 const [imageError,setImageError]=useState('');
 const [cloudError,setCloudError]=useState('');
 const [showPhase,setShowPhase]=useState(false);
 const [phaseImage,setPhaseImage]=useState<{url?:string;time:number}>();
 const [phaseLoading,setPhaseLoading]=useState(false);
 const [mapCities,setMapCities]=useState<SurroundingsCityCandidate[]>([]);
 const [mapViewport,setMapViewport]=useState<{width:number;height:number}|null>(null);
 const mapFigureRef=useRef<HTMLElement|null>(null);
 const darkMap=useDarkMapTheme();
 useEffect(()=>{
  const element=mapFigureRef.current;
  if(!element)return;
  const update=()=>{
   const width=Math.round(element.clientWidth),height=Math.round(element.clientHeight);
   if(width<1||height<1)return;
   setMapViewport(previous=>previous&&Math.abs(previous.width-width)<3&&Math.abs(previous.height-height)<3?previous:{width,height});
  };
  update();
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(update):null;
  observer?.observe(element);
  window.addEventListener('resize',update);
  return()=>{observer?.disconnect();window.removeEventListener('resize',update)};
 },[]);
 useEffect(()=>{
  if(mode!=='radar')return;
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
 },[lat,lon,mode]);
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
 // Coordinates come from actual named settlements, not screen-grid reference points.
 const nearbyCities=useMemo(()=>mapViewport?chooseSurroundingsCities([
  ...mapCities,...(geography?.places??[]).map(place=>({name:place.name,lat:place.lat,lon:place.lon,population:place.population,rank:place.minZoom,origin:'natural-earth' as const}))
 ],{lat,lon},{west,south,east,north},4,mapViewport):[],[mapCities,geography,lat,lon,west,south,east,north,mapViewport]);
 const mapBounds=useMemo(()=>[[south,west],[north,east]] as [[number,number],[number,number]],[south,west,north,east]);
 const mapReferences=useMemo(()=>compositeReferenceLayers(.93,surroundingReference),[darkMap]);
 const directVectorAllowed=browserExternalWeatherFallbackAllowed();
 const referenceTileUrl=openFreeMapVectorTileProxy()||(directVectorAllowed?DIRECT_VECTOR_TILES:'');
 const referenceGlyphsUrl=openFreeMapGlyphProxy()||(directVectorAllowed?DIRECT_VECTOR_GLYPHS:'');
 const updateMapCities=useCallback((next:SurroundingsCityCandidate[])=>setMapCities(previous=>{
  const signature=(places:SurroundingsCityCandidate[])=>places.map(p=>`${p.name}:${p.lat.toFixed(3)}:${p.lon.toFixed(3)}`).sort().join('|');
  return signature(previous)===signature(next)?previous:next;
 }),[]);
 const radar=mode!=='radar'||target===undefined?'':imageUrl('dwd',rvLayer,target,bounds);
 const satellite=catalog?.satelliteRgbProduct??catalog?.satelliteIrProduct;
 const satelliteTime=validTimes(satellite?.times).filter(time=>time>=now-75*60000&&time<=now+90000).at(-1);
 const clouds=mode==='radar'&&satellite&&satelliteTime!==undefined?imageUrl(satellite.provider,satellite.layer,satelliteTime,bounds):'';
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
 const needsOpera=mode==='radar'&&selection===undefined&&Boolean(showPhase||(catalog&&!radar)||failed||(radar&&imageError===radar));
 // biome-ignore lint/correctness/useExhaustiveDependencies: A refreshed composite catalog intentionally revalidates OPERA availability even when location/selection remain unchanged.
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
  if(selection!==undefined||!nearbyCities.length){setTemperatureGrid(undefined);return;}
  const controller=new AbortController();
  // One bounded forecast request for up to four real places; entirely independent of radar.
  void loadSurroundingsTemperatures(nearbyCities,temperatureTarget,controller.signal)
   .then(result=>{if(!controller.signal.aborted)setTemperatureGrid(result)})
   .catch(()=>{if(!controller.signal.aborted)setTemperatureGrid(undefined)});
  return ()=>controller.abort();
 },[selection,temperatureTarget,nearbyCities]);
 const temperatures=selection===undefined?temperatureGrid?.values:undefined;
 const visibleClouds=Boolean(clouds&&cloudError!==clouds);
 return <section className="card current-surroundings" aria-labelledby={heading}>
  <header><h2 id={heading}>Wetter im Umfeld</h2><button type="button" onClick={()=>onOpen(mode==='radar'?displayTime:undefined,{west,south,east,north})}>Karte öffnen</button></header>
  <div className="current-surroundings-display-modes" role="group" aria-label="Kartendarstellung wählen">
   <button type="button" aria-pressed={mode==='cloud'} onClick={()=>{setMode('cloud');setSelection(undefined)}}>Wolken + Wetter</button>
   <button type="button" aria-pressed={mode==='radar'} onClick={()=>setMode('radar')}>Radar / Satellit</button>
  </div>
  {mode==='radar'&&<div className="current-surroundings-controls">
   <button type="button" aria-pressed={selection===undefined} onClick={()=>setSelection(undefined)}>Jetzt</button>
   <button type="button" aria-pressed={showPhase} disabled={selection!==undefined} onClick={()=>setShowPhase(value=>!value)}>Niederschlagsart</button>
   <label>Nächste 2 h <select aria-label="Radar-Nowcast-Termin" value={selection??''} disabled={!future.length} onChange={event=>setSelection(event.target.value?Number(event.target.value):undefined)}>
    <option value="">Termin wählen</option>
    {future.map(time=><option key={time} value={time}>{clock(time)}</option>)}
   </select></label>
  </div>}
  <figure ref={mapFigureRef} className="current-surroundings-map" aria-label={`Wetterbild um ${name}: MID-Kartenbasis und Temperaturen an benannten Orten`}>
   <MidMapLibre center={[lat,lon]} zoom={7} scrollZoom={false} interactive={false} navigationControl={false} className="current-surroundings-maplibre">
    <MapFitBounds south={south} west={west} north={north} east={east} padding={8} maxZoom={7}/>
    <UnifiedVectorBasemap dark={darkMap}/>
    {mode==='cloud'&&cloudForecast.image&&<ImageQuadLayer id="surroundings-model-cloud-weather" url={cloudForecast.image.url}
     bounds={cloudForecast.image.bounds} zIndex={270} frameKey={`${cloudForecast.image.run}:${cloudForecast.image.validTime}`}/>}
    {mode==='radar'&&visibleClouds&&<ImageQuadLayer id="surroundings-clouds" url={clouds} bounds={mapBounds} zIndex={220} onError={()=>setCloudError(clouds)}/>}
    {mode==='radar'&&(displayedOpera??displayedRadar)&&<ImageQuadLayer id="surroundings-radar" url={displayedPhase?.url??(displayedOpera??displayedRadar)!.url} bounds={mapBounds} zIndex={360}/>}
    <VectorReferenceLayer url={referenceTileUrl} glyphsUrl={referenceGlyphsUrl} layers={mapReferences} zIndex={790}/>
    <MapCityInventory onChange={updateMapCities}/>
    {nearbyCities.map((place,index)=>{
     const value=temperatures?.[place.id];if(value===undefined)return null;
     const degrees=formatWeatherValue(value,'temperature','overview');
     return <HtmlMarker key={place.id} latitude={place.lat} longitude={place.lon} anchor="center" zIndex={850+index}
      className={`current-surroundings-city-marker priority-${index}`}
      html={`<span class="current-surroundings-city-value" role="img" aria-label="${mapSafe(place.name)}: ${degrees} Grad Celsius, Open-Meteo Best Match"><b>${mapSafe(place.name)}</b><strong style="color:${ecmwfTemperatureColor(value)}">${degrees}°</strong></span>`}/>;
    })}
    <HtmlMarker latitude={lat} longitude={lon} anchor="center" className="current-surroundings-center-marker" zIndex={920}
     html={`<span class="current-surroundings-center-dot" role="img" aria-label="Gewählter Ort: ${mapSafe(name)}"></span>`}/>
   </MidMapLibre>
   <figcaption className="current-surroundings-map-caption">Standort: {name}{selection===undefined&&Number.isFinite(temperature)?` · ${formatWeatherValue(temperature,'temperature','overview')}°`:''}</figcaption>
  </figure>
  <p role="status" className="current-surroundings-data-status">{mode==='cloud'
   ?cloudForecast.image?<>Modellbild · {cloudForecast.image.model} · gültig {datedClock(Date.parse(cloudForecast.image.validTime))} · INIT {datedClock(Date.parse(cloudForecast.image.run))} · schematische Wolken + SigWx, keine Beobachtung</>
    :cloudForecast.loading?'Verifiziertes Modell-Wolkenbild wird geladen …':'Kein gültiges Wolken-/SigWx-Modellbild für Ort und Termin; keine Satellitenbeobachtung oder Entwarnung.'
   :displayedOpera?<>EUMETNET OPERA · Beobachtung {clock(displayedOpera.time)} Uhr</>:needsOpera&&!operaFinished&&!displayedRadar?'Europäisches Radar wird geladen …':displayedRadar?<>DWD-Radar · {displayedRadar.kind} {clock(displayedRadar.time)} Uhr{displayedRadar.url!==radar?((!radar||imageError===radar)?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</p>
  <details className="current-surroundings-sources">
   <summary>Quellen und Datenstand</summary>
   <p>Kartengrundlage · MID-Kartenbereich, OpenFreeMap / OpenStreetMap; Orte Natural Earth und Kartenkacheln</p>
  {mode==='radar'&&visibleClouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Beobachtung {clock(satelliteTime)} Uhr</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  {selection===undefined&&(temperatureGrid&&temperatures&&Object.keys(temperatures).length
   ?<p>Umfeldtemperaturen · {temperatureGrid.source} {temperatureGrid.modelLabel} · gültig {datedClock(temperatureGrid.validTime)} · {temperatureGrid.available}/{temperatureGrid.requested} Orte · einzelner Modelllauf nicht ausgewiesen</p>
   :<p>Umfeldtemperaturen · Kein zeitlich und räumlich belegtes Temperaturfeld verfügbar</p>)}
  </details>
  {mode==='radar'&&selection===undefined&&showPhase&&(displayedPhase?.url
   ?<p>Radar + Modellphase · {([
    ['rain','Regen'],['mixed','Schneeregen'],['snow','Schnee'],['freezing','Gefrierend'],
    ['graupel','Graupel'],['hail','Hagel / Graupel'],['uncertain','Phase offen']
   ] as const).map(([type,label])=><span key={type} className="current-surroundings-phase"><span aria-hidden="true" style={{color:PRECIPITATION_TYPE_COLORS[type]}}>● </span>{label}</span>)}</p>
   :<p role="status">{phaseLoading?'Niederschlagsart wird geprüft …':'Niederschlagsart für diesen Ausschnitt nicht belegt.'}</p>)}
 </section>;
}
