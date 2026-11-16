import {useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {compositeWmsProxy,loadCompositeTimes,loadOperaRaster,openFreeMapVectorTileProxy,openFreeMapGlyphProxy,type CompositeProductTimes,type WmsProvider} from './CompositeData';
import {formatWeatherValue} from "./weatherValueFormat";
import {ecmwfTemperatureColor} from "./temperatureTone";
import {useSurroundingsCloudImage} from "./currentSurroundingsCloudImage";
import {surroundingsQuarterHourTarget} from "./surroundingsQuarterHour";
import {radarOriginalForStep,nearestVerifiedOriginal,surroundingsRadarTarget,selectVerifiedSurroundingsRadarFrame,selectVerifiedSurroundingsOperaFrame,SURROUNDINGS_RADAR_MIN_STEP,SURROUNDINGS_RADAR_MAX_STEP} from './surroundingsRadarTimeline';
import {useDisplayPreference,displayChoice} from './useDisplayPreference';
import {PRECIPITATION_TYPE_COLORS,radarDbzColor} from './radarColorTables';
import {loadModelMapGeography,type ModelMapGeography} from './modelMapGeography';
import {browserExternalWeatherFallbackAllowed} from './workerClient';
import {MidMapLibre,ImageQuadLayer,HtmlMarker,MapFitBounds,useMidMap} from './MapLibreCore';
import SurroundingsViewportCapture from './SurroundingsViewportCapture';
import type {SurroundingsRasterPlan} from './surroundingsViewportRaster';
import {VectorReferenceLayer} from './MapLibreLegacyCompat';
import UnifiedVectorBasemap from './UnifiedVectorBasemap';
import {compositeReferenceLayers} from './mapReferenceLayers';
import {chooseSurroundingsCities,citiesFromMapFeatures,type SurroundingsCityCandidate} from './surroundingsCitySelection';
import {loadSurroundingsTemperatures} from './currentSurroundingsTemperature';
import {currentSurroundingsTemperature,type SurroundingsTemperatureRequest} from './surroundingsTemperatureDisplay';
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

function imageUrl(provider:WmsProvider,layer:string,time:number,plan:SurroundingsRasterPlan|undefined){
 const proxy=compositeWmsProxy(provider);
 if(!proxy||!plan)return '';
 const url=new URL(proxy,window.location.href);
 const parameters={service:'WMS',request:'GetMap',version:'1.1.1',srs:'EPSG:4326',layers:layer,format:'image/png',transparent:'true',bbox:plan.bbox,width:String(plan.width),height:String(plan.height),time:new Date(time).toISOString()};
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
 const [mode,setMode]=useDisplayPreference('CurrentSurroundings.mode','cloud',displayChoice('cloud','radar'));
 const [radarStep,setRadarStep]=useState(0);
 const [cloudStep,setCloudStep]=useState(0); // Step 0 = last UTC quarter-hour; step 9 guarantees >=+120 min
 const [catalog,setCatalog]=useState<CompositeProductTimes>();
 const [failed,setFailed]=useState(false);
 const [loaded,setLoaded]=useState<{url:string;time:number;kind:'Beobachtung'|'Nowcast'}>();
 const [now,setNow]=useState(Date.now);
 const cloudTarget=surroundingsQuarterHourTarget(now,cloudStep);
 const cloudRelativeMinutes=Math.max(0,Math.ceil((cloudTarget-now)/60000));
 const cloudForecast=useSurroundingsCloudImage(mode==='cloud',lat,lon,cloudTarget);
 const [opera,setOpera]=useState<{url:string;time:number;requestKey:string}>();
 const [operaFinished,setOperaFinished]=useState(false);
 const [imageError,setImageError]=useState('');
 const [cloudError,setCloudError]=useState('');
 const [showPhase,setShowPhase]=useState(false);
 const [phaseImage,setPhaseImage]=useState<{url?:string;time:number;requestKey:string}>();
 const [phaseLoading,setPhaseLoading]=useState(false);
 const [mapCities,setMapCities]=useState<SurroundingsCityCandidate[]>([]);
 const [mapViewport,setMapViewport]=useState<{width:number;height:number}|null>(null);
 // Bind camera geometry to the requested location. Even if the parent changes
 // coordinates without remounting, an old image plan must not survive that switch.
 const [rasterState,setRasterState]=useState<{lat:number;lon:number;plan:SurroundingsRasterPlan|undefined}>();
 const rasterPlan=rasterState?.lat===lat&&rasterState.lon===lon?rasterState.plan:undefined;
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
 // Same admission bounds as the DWD RV point service. An empty WMS image
 // inside these bounds still needs the independent OPERA check.
 const dwdArea=lat>=47&&lat<=55.3&&lon>=5.4&&lon<=15.7;
 const radarTarget=surroundingsRadarTarget(now,radarStep);
 const radarOriginal=radarOriginalForStep(catalog,now,radarStep,dwdArea);
 const target=radarOriginal?.time;
 const radarAtNow=radarStep===0;
 const west=Math.max(-180,Math.min(177.2,lon-1.4)),south=Math.max(-85,Math.min(83.7,lat-.65));
 const east=west+2.8,north=south+1.3;
 // Keep these static bounds solely for initial map focus and 'Karte öffnen'.
 // Never use them as the dynamic WMS/OPERA image footprint.
 const bounds=rasterPlan?.bbox??'';
 // Request identity is tied to the exact location, camera bounds AND image dimensions.
 const operaRequestKey=JSON.stringify([lat,lon,bounds,rasterPlan?.width,rasterPlan?.height]);
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
 const mapBounds=useMemo(()=>rasterPlan?[[rasterPlan.bounds.south,rasterPlan.bounds.west],[rasterPlan.bounds.north,rasterPlan.bounds.east]] as [[number,number],[number,number]]:undefined,[rasterPlan]);
 const mapReferences=useMemo(()=>compositeReferenceLayers(.93,surroundingReference),[darkMap]);
 const directVectorAllowed=browserExternalWeatherFallbackAllowed();
 const referenceTileUrl=openFreeMapVectorTileProxy()||(directVectorAllowed?DIRECT_VECTOR_TILES:'');
 const referenceGlyphsUrl=openFreeMapGlyphProxy()||(directVectorAllowed?DIRECT_VECTOR_GLYPHS:'');
 const updateMapCities=useCallback((next:SurroundingsCityCandidate[])=>setMapCities(previous=>{
  const signature=(places:SurroundingsCityCandidate[])=>places.map(p=>`${p.name}:${p.lat.toFixed(3)}:${p.lon.toFixed(3)}`).sort().join('|');
  return signature(previous)===signature(next)?previous:next;
 }),[]);
 const radar=mode!=='radar'||target===undefined?'':imageUrl('dwd',rvLayer,target,rasterPlan);
 const satellite=catalog?.satelliteRgbProduct??catalog?.satelliteIrProduct;
 const satelliteTime=radarStep>0?undefined:nearestVerifiedOriginal(satellite?.times,radarTarget,now);
 const clouds=mode==='radar'&&satellite&&satelliteTime!==undefined?imageUrl(satellite.provider,satellite.layer,satelliteTime,rasterPlan):'';
 const clock=(time:number)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 const datedClock=(time:number)=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:timezone}).format(time);
 useEffect(()=>{
  if(mode!=='radar'||!radar||target===undefined)return;
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
      setLoaded({url:radar,time:target,kind:radarOriginal!.kind});
      return;
     }
    }
   }catch{/* A frame with unreadable pixels cannot establish coverage. */}
   setImageError(radar);
  };
  img.onerror=()=>setImageError(radar);
  img.src=radar;
  return ()=>{img.onload=null;img.onerror=null};
 },[radar,target,mode,radarOriginal?.kind]);
 const needsOpera=mode==='radar'&&radarAtNow&&Boolean(rasterPlan)&&Boolean(showPhase||(catalog&&!radar)||failed||(radar&&imageError===radar));
 // biome-ignore lint/correctness/useExhaustiveDependencies: A refreshed composite catalog intentionally revalidates OPERA availability even when location/radar mode remain unchanged.
 useEffect(()=>{
  if(!needsOpera||!rasterPlan)return;
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
   // Keep the previous OPERA 256×128 maximum while matching the requested WMS geometry.
   canvas.width=Math.max(16,Math.ceil(rasterPlan.width/2));
   canvas.height=Math.max(16,Math.ceil(rasterPlan.height/2));
   const context=canvas.getContext('2d');
   if(!context)return;
   const {west,south,east,north}=rasterPlan.bounds;
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
   setOpera({url:canvas.toDataURL(),time,requestKey:operaRequestKey});
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
   setPhaseImage({url:phase.colors.size?canvas.toDataURL():undefined,time,requestKey:operaRequestKey});
  }
  void load().catch(()=>{}).finally(()=>{if(!controller.signal.aborted){setOperaFinished(true);setPhaseLoading(false)}});
  return ()=>controller.abort();
 },[needsOpera,showPhase,lat,lon,bounds,rasterPlan,operaRequestKey,catalog?.checkedAt]);
 const displayedOpera=needsOpera?selectVerifiedSurroundingsOperaFrame(opera,operaRequestKey,now):undefined;
 const displayedRadar=mode==='radar'?selectVerifiedSurroundingsRadarFrame(loaded,radar,radarOriginal):undefined;
 const displayedPhase=showPhase&&displayedOpera&&phaseImage?.requestKey===operaRequestKey&&phaseImage?.time===displayedOpera.time?phaseImage:undefined;
 const displayTime=displayedOpera?.time??displayedRadar?.time;
 const temperatureTarget=mode==='cloud'?cloudTarget:radarTarget;
 const siteId=`site:${lat.toFixed(5)}:${lon.toFixed(5)}`;
 const temperaturePlaces=useMemo(()=>[...nearbyCities,{id:siteId,lat,lon}], [nearbyCities,siteId,lat,lon]);
 const temperaturePlacesKey=useMemo(
  ()=>temperaturePlaces.map(place=>`${place.id}:${place.lat.toFixed(5)}:${place.lon.toFixed(5)}`).join('|'),
  [temperaturePlaces]
 );
 const temperatureInterpolate=mode==='cloud'&&cloudStep>0;
 const [temperatureRequest,setTemperatureRequest]=useState<SurroundingsTemperatureRequest>();
 useEffect(()=>{
  if((mode==='radar'&&!radarAtNow)||!nearbyCities.length){setTemperatureRequest(undefined);return;}
  const controller=new AbortController();
  // One bounded forecast request for up to four real places; entirely independent of radar.
  // Bind the response to its requested time/places/method: the provider's validTime
  // may be the same for multiple quarter-hour selections and cannot act as a request key.
  const requested={targetTime:temperatureTarget,placesKey:temperaturePlacesKey,interpolate:temperatureInterpolate};
  void loadSurroundingsTemperatures(temperaturePlaces,temperatureTarget,controller.signal,temperatureInterpolate)
   .then(result=>{if(!controller.signal.aborted)setTemperatureRequest({...requested,snapshot:result})})
   .catch(()=>{if(!controller.signal.aborted)setTemperatureRequest({...requested,snapshot:undefined})});
  return ()=>controller.abort();
 },[radarAtNow,mode,temperatureTarget,temperaturePlaces,temperaturePlacesKey,temperatureInterpolate,nearbyCities.length]);
 const temperatureGrid=mode==='radar'&&!radarAtNow?undefined
  :currentSurroundingsTemperature(temperatureRequest,temperatureTarget,temperaturePlacesKey,temperatureInterpolate);
 const temperatures=temperatureGrid?.values;
 const forecastSiteTemperature=mode==='cloud'&&cloudStep>0?temperatures?.[siteId]:undefined;
 const displaySiteTemperature=mode==='cloud'&&cloudStep>0?forecastSiteTemperature:(mode==='cloud'||radarAtNow)&&Number.isFinite(temperature)?temperature:undefined;
 const visibleClouds=Boolean(clouds&&cloudError!==clouds);
 return <section className="card current-surroundings" aria-labelledby={heading}>
  <header><h2 id={heading}>Wetter im Umfeld</h2><button type="button" onClick={()=>onOpen(mode==='cloud'?cloudTarget:mode==='radar'?displayTime:undefined,{west,south,east,north})}>Karte öffnen</button></header>
  <div className="current-surroundings-display-modes" role="group" aria-label="Kartendarstellung wählen">
   <button type="button" aria-pressed={mode==='cloud'} onClick={()=>setMode('cloud')}>Wolken + Wetter</button>
   <button type="button" aria-pressed={mode==='radar'} onClick={()=>setMode('radar')}>Radar / Satellit</button>
  </div>
  {mode==='cloud'&&<div className="current-surroundings-cloud-timeline" role="group" aria-label="Wolken und SigWx: Prognosezeit in 15-Minuten-Schritten über mindestens zwei Stunden">
   <button type="button" aria-label="Wolkenprognose 15 Minuten zurück" disabled={cloudStep===0} onClick={()=>setCloudStep(v=>Math.max(0,v-1))}>−15 min</button>
   <input type="range" min={0} max={9} step={1} value={cloudStep}
    aria-label={`Wolkenprognose: ${cloudStep===0?'letzter Viertelstundentermin':`in ${cloudRelativeMinutes} Minuten`} · Ziel ${datedClock(cloudTarget)} Uhr`}
    aria-valuetext={`${cloudStep===0?'Letzter Viertelstundentermin':`in ${cloudRelativeMinutes} Minuten`} · ${datedClock(cloudTarget)} Uhr`}
    onChange={event=>setCloudStep(Math.max(0,Math.min(9,Number(event.target.value))))}/>
   <button type="button" aria-label="Wolkenprognose 15 Minuten vor" disabled={cloudStep===9} onClick={()=>setCloudStep(v=>Math.min(9,v+1))}>+15 min</button>
   <output aria-live="polite" className="current-surroundings-time-readout">{cloudStep===0?'Letzter 15-min-Termin':`in ${cloudRelativeMinutes} min`} · {datedClock(cloudTarget)} Uhr</output>
  </div>}
  {mode==='radar'&&<>
   <div className="current-surroundings-cloud-timeline" role="group" aria-label="Radar und Satellit: Originaltermine in 15-Minuten-Schritten">
    <button type="button" aria-label="Radar und Satellit 15 Minuten zurück" disabled={radarStep===SURROUNDINGS_RADAR_MIN_STEP} onClick={()=>setRadarStep(v=>Math.max(SURROUNDINGS_RADAR_MIN_STEP,v-1))}>−15 min</button>
    <input type="range" min={SURROUNDINGS_RADAR_MIN_STEP} max={SURROUNDINGS_RADAR_MAX_STEP} step={1} value={radarStep}
     aria-label={`Radar/Satellit: ${radarStep===0?'Jetzt':radarStep>0?`in ${radarStep*15} Minuten`:`vor ${-radarStep*15} Minuten`} · Ziel ${datedClock(radarTarget)} Uhr`}
     aria-valuetext={`${datedClock(radarTarget)} Uhr · ${radarOriginal?`${radarOriginal.kind} ${datedClock(radarOriginal.time)} Uhr`:'kein belegtes Radaroriginal'}`}
     onChange={event=>setRadarStep(Math.max(SURROUNDINGS_RADAR_MIN_STEP,Math.min(SURROUNDINGS_RADAR_MAX_STEP,Number(event.target.value))))}/>
    <button type="button" aria-label="Radar und Satellit 15 Minuten vor" disabled={radarStep===SURROUNDINGS_RADAR_MAX_STEP} onClick={()=>setRadarStep(v=>Math.min(SURROUNDINGS_RADAR_MAX_STEP,v+1))}>+15 min</button>
    <output aria-live="polite" className="current-surroundings-time-readout">{radarStep===0?'Jetzt':radarStep>0?`in ${radarStep*15} min`:`vor ${-radarStep*15} min`} · {datedClock(radarTarget)} Uhr</output>
   </div>
   <div className="current-surroundings-controls">
    <button type="button" aria-pressed={radarAtNow} onClick={()=>setRadarStep(0)}>Jetzt</button>
    <button type="button" aria-pressed={showPhase} disabled={!radarAtNow} onClick={()=>setShowPhase(value=>!value)}>Niederschlagsart</button>
   </div>
  </>}
  <figure ref={mapFigureRef} className="current-surroundings-map" aria-label={`Wetterbild um ${name}: MID-Kartenbasis und Temperaturen an benannten Orten`}>
   <MidMapLibre center={[lat,lon]} zoom={7} scrollZoom={false} interactive={false} navigationControl={false} className="current-surroundings-maplibre">
    <MapFitBounds south={south} west={west} north={north} east={east} padding={8} maxZoom={7}/>
    <SurroundingsViewportCapture onChange={plan=>setRasterState({lat,lon,plan})}/>
    <UnifiedVectorBasemap dark={darkMap}/>
    {mode==='cloud'&&cloudForecast.image&&<ImageQuadLayer id="surroundings-model-cloud-weather" url={cloudForecast.image.url}
     bounds={cloudForecast.image.bounds} resampling="nearest" zIndex={270} frameKey={`${cloudForecast.image.run}:${cloudForecast.image.validTime}:pseudo`}/>}
    {mode==='radar'&&visibleClouds&&mapBounds&&<ImageQuadLayer id="surroundings-clouds" url={clouds} bounds={mapBounds} zIndex={220} onError={()=>setCloudError(clouds)}/>}
    {mode==='radar'&&mapBounds&&(displayedOpera??displayedRadar)&&<ImageQuadLayer id="surroundings-radar" url={displayedPhase?.url??(displayedOpera??displayedRadar)!.url} bounds={mapBounds} zIndex={360}/>}
    <VectorReferenceLayer url={referenceTileUrl} glyphsUrl={referenceGlyphsUrl} layers={mapReferences} zIndex={790}/>
    <MapCityInventory onChange={updateMapCities}/>
    {nearbyCities.map((place,index)=>{
     const value=temperatures?.[place.id];if(value===undefined)return null;
     const degrees=formatWeatherValue(value,'temperature','overview');
     return <HtmlMarker key={place.id} latitude={place.lat} longitude={place.lon} anchor="bottom" zIndex={850+index}
      className={`current-surroundings-city-marker priority-${index}`}
      html={`<span class="current-surroundings-city-value" role="img" aria-label="${mapSafe(place.name)}: ${degrees} Grad Celsius, Open-Meteo Best Match"><strong style="color:${ecmwfTemperatureColor(value)}">${degrees}°</strong></span>`}/>;
    })}
    <HtmlMarker latitude={lat} longitude={lon} anchor="center" className="current-surroundings-center-marker" zIndex={920}
     html={`<span class="current-surroundings-center-dot" role="img" aria-label="Gewählter Ort: ${mapSafe(name)}${displaySiteTemperature!==undefined?`, ${formatWeatherValue(displaySiteTemperature!,'temperature','overview')} Grad Celsius`:''}">${displaySiteTemperature!==undefined?`<strong style="color:${ecmwfTemperatureColor(displaySiteTemperature!)}">${formatWeatherValue(displaySiteTemperature!,'temperature','overview')}°</strong>`:''}</span>`}/>
   </MidMapLibre>
   <figcaption className="current-surroundings-map-caption">Standort: {name}</figcaption>
  </figure>
  <div role="status" aria-live="polite" className="current-surroundings-data-status">{mode==='cloud'
   ?cloudForecast.image?<><strong>Modellprognose · {cloudForecast.image.model} · PseudoSat + SigWx</strong>
     <span>Gültig {datedClock(Date.parse(cloudForecast.image.validTime))} Uhr · INIT {datedClock(Date.parse(cloudForecast.image.run))} Uhr · keine Beobachtung</span>
     {Math.abs(Date.parse(cloudForecast.image.validTime)-cloudTarget)>90*1000&&
      <small>Gewählt: {datedClock(cloudTarget)} Uhr · hierfür nur anderer belegter Modelltermin verfügbar</small>}
     {cloudForecast.loading&&<small>Neuer Modellstand wird geprüft.</small>}
     {cloudForecast.unavailable&&<small>Aktualisierung nicht erreichbar; letzter gültiger Bildstand.</small>}
    </>
    :<span>{cloudForecast.loading?'Verifiziertes PseudoSat-/SigWx-Modellbild wird geladen …':'Kein gültiges Wolken-/SigWx-Modellbild für Ort und Termin; keine Satellitenbeobachtung oder Entwarnung.'}</span>
   :<span>{displayedOpera?<>EUMETNET OPERA · Beobachtung {clock(displayedOpera.time)} Uhr</>:needsOpera&&!operaFinished&&!displayedRadar?'Europäisches Radar wird geladen …':displayedRadar?<>DWD-Radar · {displayedRadar.kind} {clock(displayedRadar.time)} Uhr{displayedRadar.url!==radar?((!radar||imageError===radar)?' · neuer Termin nicht verfügbar':' · neuer Termin lädt'):''}</>:radarStep!==0&&(!radar||target===undefined)?'Kein originales Radar-/Nowcast-Bild für diesen 15-Minuten-Termin':failed||catalog&&!radar||imageError&&imageError===radar?'Radarbild nicht verfügbar':'Wetterbild wird geladen …'}</span>}</div>
  <details className="current-surroundings-sources">
   <summary>Quellen und Datenstand</summary>
   <p>Kartengrundlage · MID-Kartenbereich, OpenFreeMap / OpenStreetMap; Orte Natural Earth und Kartenkacheln</p>
   {mode==='cloud'&&cloudForecast.image&&<p>Wolken + SigWx · dieselbe schematische PseudoSat-Rasterdarstellung wie im MID-Kartenbereich; Modell {cloudForecast.image.model}, INIT {datedClock(Date.parse(cloudForecast.image.run))} Uhr, Bild gültig {datedClock(Date.parse(cloudForecast.image.validTime))} Uhr.
    Original-Modelltermin ohne zeitliche Interpolation; fehlt der 15-Minuten-Originaltermin, bleibt der Zieltermin NoData.
    {Math.abs(Date.parse(cloudForecast.image.validTime)-cloudTarget)>90*1000&&<> Gewählter Zieltermin {datedClock(cloudTarget)} Uhr wird von diesem Bild nicht exakt repräsentiert.</>}
    {' '}Kein Satellitenbild und keine amtliche Warnung; Datenlücken bleiben NoData.</p>}
  {mode==='radar'&&visibleClouds&&satelliteTime!==undefined&&<p>Bewölkung · {satellite?.provider==='dwd'?'DWD':'EUMETSAT'} · Originalbeobachtung {datedClock(satelliteTime)} Uhr · Radar-/Satellitentermine getrennt</p>}
  {Number.isFinite(temperature)&&temperatureTime&&<p>Temperatur am gewählten Ort · {temperatureTime.slice(11,16)} Uhr</p>}
  {(mode==='cloud'||radarAtNow)&&(temperatureGrid&&temperatures&&Object.keys(temperatures).length
   ?<p>Umfeldtemperaturen · {temperatureGrid.source} {temperatureGrid.modelLabel} · {temperatureGrid.temporalMethod==='linear'&&temperatureGrid.sourceTimes
     ?<>aus Stundenoriginalen {clock(temperatureGrid.sourceTimes[0])}/{clock(temperatureGrid.sourceTimes[1])} Uhr interpoliert · Ziel {datedClock(temperatureGrid.validTime)}</>
     :<>Originaltermin {datedClock(temperatureGrid.validTime)}</>} · {temperatureGrid.available}/{temperatureGrid.requested} Orte · einzelner Modelllauf nicht ausgewiesen</p>
   :<p>Umfeldtemperaturen · Kein zeitlich und räumlich belegtes Temperaturfeld verfügbar</p>)}
  </details>
  {mode==='radar'&&radarAtNow&&showPhase&&(displayedPhase?.url
   ?<p>Radar + Modellphase · {([
    ['rain','Regen'],['mixed','Schneeregen'],['snow','Schnee'],['freezing','Gefrierend'],
    ['graupel','Graupel'],['hail','Hagel / Graupel'],['uncertain','Phase offen']
   ] as const).map(([type,label])=><span key={type} className="current-surroundings-phase"><span aria-hidden="true" style={{color:PRECIPITATION_TYPE_COLORS[type]}}>● </span>{label}</span>)}</p>
   :<p role="status">{phaseLoading?'Niederschlagsart wird geprüft …':'Niederschlagsart für diesen Ausschnitt nicht belegt.'}</p>)}
 </section>;
}
