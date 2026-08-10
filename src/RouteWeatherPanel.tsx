import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertTriangle,CloudRain,MapPinned,Navigation,Route as RouteIcon,Search,Wind} from 'lucide-react';
import {GeoJsonLayers,HtmlMarker,MapFitBounds,MidMapLibre,RasterTileLayer} from './MapLibreCore';
import {searchLocations,type Location} from './weather';
import {formatDecimal} from './format';
import {formatLocalIso,formatRouteWind,loadRouteWeather,routeLevelClass,routeLevelColor,type RouteCheckpoint,type RouteMapMode,type RouteProfile,type RouteWeatherResult} from './routeWeather';
import {WeatherPictogram} from './WeatherPictogram';

function formatDateTime(value:string){
 return new Date(value).toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function formatDuration(minutes:number){
 const hours=Math.floor(minutes/60),mins=minutes%60;
 return hours?`${hours} h ${String(mins).padStart(2,'0')} min`:`${mins} min`;
}
function displayDestination(loc:Location){
 return [loc.icao?`${loc.icao} · ${loc.name}`:loc.name,loc.admin1||loc.country].filter(Boolean).join(' · ');
}
function defaultDepartureInput(){
 const date=new Date();
 date.setMinutes(0,0,0);
 date.setHours(date.getHours()+1);
 return formatLocalIso(date.toISOString());
}

function htmlEscape(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]||char))}
function RouteMap({result,mode}:{result:RouteWeatherResult;mode:RouteMapMode}){
 const points=result.checkpoints.map(point=>[point.latitude,point.longitude] as [number,number]),lats=points.map(point=>point[0]),lons=points.map(point=>point[1]),south=Math.min(...lats),north=Math.max(...lats),west=Math.min(...lons),east=Math.max(...lons),dy=Math.max(.08,(north-south)*.25),dx=Math.max(.08,(east-west)*.25),lineFeatures:any[]=[];
 if(mode==='line')lineFeatures.push({type:'Feature',properties:{color:'#1e78ff',width:5,opacity:.92},geometry:{type:'LineString',coordinates:points.map(([lat,lon])=>[lon,lat])}});
 result.checkpoints.slice(1).forEach((point,index)=>{const previous=result.checkpoints[index],coordinates=[[previous.longitude,previous.latitude],[point.longitude,point.latitude]],color=routeLevelColor(point.restriction.level);if(mode==='segments')lineFeatures.push({type:'Feature',properties:{color,width:4,opacity:.94},geometry:{type:'LineString',coordinates}});if(mode==='corridor'){lineFeatures.push({type:'Feature',properties:{color,width:18,opacity:.18},geometry:{type:'LineString',coordinates}});lineFeatures.push({type:'Feature',properties:{color,width:5,opacity:.94},geometry:{type:'LineString',coordinates}})}});
 const pointFeatures=result.checkpoints.map(point=>({type:'Feature',properties:{color:routeLevelColor(point.restriction.level),popup:`<div class="route-map-tooltip"><strong>${htmlEscape(point.name)}</strong><span>${htmlEscape(formatDateTime(point.etaIso))}</span><span>${htmlEscape(point.weather.label)}</span><span>${Math.round(point.weather.temperature)} °C · ${Math.round(point.weather.precipitationProbability)} %</span><span>${htmlEscape(formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust))}</span></div>`},geometry:{type:'Point',coordinates:[point.longitude,point.latitude]}}));
 return <div className="route-weather-map"><MidMapLibre center={points[0]} zoom={7} className="route-maplibre" scrollZoom={false}><MapFitBounds south={south-dy} north={north+dy} west={west-dx} east={east+dx} padding={24}/><RasterTileLayer id="route-osm" attribution="© OpenStreetMap-Mitwirkende" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"/><GeoJsonLayers id={`route-lines-${mode}`} data={{type:'FeatureCollection',features:lineFeatures}} layers={[{id:'segments',type:'line',paint:{'line-color':['get','color'],'line-width':['get','width'],'line-opacity':['get','opacity'],'line-cap':'round','line-join':'round'}}]}/><GeoJsonLayers id="route-checkpoints" data={{type:'FeatureCollection',features:pointFeatures}} layers={[{id:'points',type:'circle',paint:{'circle-radius':8,'circle-color':['get','color'],'circle-opacity':.94,'circle-stroke-color':'#ffffff','circle-stroke-width':2}}]} hoverProperty="popup"/>{result.checkpoints.map(point=><HtmlMarker key={`wind-${point.id}`} latitude={point.latitude} longitude={point.longitude} html={`<span class="route-wind-glyph" style="color:${routeLevelColor(point.restriction.level)};transform:rotate(${point.weather.direction}deg)">↑</span>`} className="route-wind-marker" anchor="center" popupHtml={htmlEscape(formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust))}/>)}</MidMapLibre></div>;
}

function profileSpeed(profile:RouteProfile){return profile==='bike'?20:profile==='foot'?5:90}

export default function RouteWeatherPanel({start,defaultProfile='car',sampleMinutes=20}:{start:Location;defaultProfile?:RouteProfile;sampleMinutes?:number}){
 const[destinationQuery,setDestinationQuery]=useState('');
 const[destination,setDestination]=useState<Location|null>(null);
 const[suggestions,setSuggestions]=useState<Location[]>([]);
 const[searchLoading,setSearchLoading]=useState(false);
 const[departureInput,setDepartureInput]=useState(defaultDepartureInput);
 const[speedKmh,setSpeedKmh]=useState(()=>profileSpeed(defaultProfile));
 const[mode,setMode]=useState<RouteMapMode>('line');
 const[result,setResult]=useState<RouteWeatherResult|null>(null);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');
 const searchSeq=useRef(0),loadController=useRef<AbortController|null>(null);

 useEffect(()=>{setResult(null);setError('');setSuggestions([]);setDestination(null);setDestinationQuery('')},[start.id,start.latitude,start.longitude]);
 useEffect(()=>{setSpeedKmh(profileSpeed(defaultProfile));setResult(null)},[defaultProfile]);
 useEffect(()=>{
  const query=destinationQuery.trim();
  if(destination&&query===displayDestination(destination))return;
  if(query.length<2){setSuggestions([]);setSearchLoading(false);return;}
  const id=++searchSeq.current,controller=new AbortController(),timer=window.setTimeout(()=>{
   setSearchLoading(true);
   searchLocations(query,controller.signal).then(items=>{
    if(id!==searchSeq.current)return;
    setSuggestions(items.filter(item=>Math.abs(item.latitude-start.latitude)>.001||Math.abs(item.longitude-start.longitude)>.001).slice(0,7));
   }).catch(()=>{if(id===searchSeq.current)setSuggestions([])}).finally(()=>{if(id===searchSeq.current)setSearchLoading(false)});
  },220);
  return()=>{controller.abort();window.clearTimeout(timer);};
 },[destinationQuery,start.latitude,start.longitude,destination]);

 const departureInfo=useMemo(()=>{
  const parsed=new Date(departureInput);
  return Number.isFinite(parsed.getTime())?parsed.toISOString():new Date().toISOString();
 },[departureInput]);

 const analyse=async()=>{
  if(!destination){setError('Bitte zuerst ein Ziel aus der Suche auswählen.');return;}
  loadController.current?.abort();
  const controller=new AbortController();
  loadController.current=controller;
  setLoading(true);setError('');
  try{
   const route=await loadRouteWeather(start,destination,departureInfo,speedKmh,sampleMinutes,controller.signal);
   if(!controller.signal.aborted)setResult(route);
  }catch(reason){
   if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Routenwetter konnte nicht geladen werden.');
  }finally{
   if(loadController.current===controller)loadController.current=null;
   if(!controller.signal.aborted)setLoading(false);
  }
 };

 const routeCoordinates=useMemo(()=>result?.checkpoints.map(point=>[point.latitude,point.longitude] as [number,number])??[],[result]);

 return <section className="card route-weather-card"><div className="charthead"><div><h3>Routenwetter</h3><p className="route-weather-headline">Schematische Route mit MID-Plausibilisierung für Regen/Sprühregen sowie Schnee/Schneegriesel, Windpfeilen und Einschränkungsbewertung.</p></div><div className="route-weather-disclaimer"><MapPinned size={16}/><span>Luftlinien-Schema zwischen Start und Ziel – keine Navigationsroute.</span></div></div><div className="route-weather-controls"><label><span>Start</span><input value={displayDestination(start)} readOnly/></label><label className="route-weather-destination"><span>Ziel</span><div className="route-destination-field"><input value={destinationQuery} onChange={event=>{setDestinationQuery(event.target.value);setDestination(null);}} placeholder="Ort, PLZ oder ICAO suchen" aria-label="Zielort, PLZ oder ICAO-Kennung für das Routenwetter"/><button type="button" onClick={analyse} disabled={loading||!destination}><RouteIcon size={15}/><span>{loading?'Lädt …':'Route analysieren'}</span></button></div>{(searchLoading||suggestions.length>0)&&<div className="route-search-results">{searchLoading&&<span className="route-search-hint"><Search size={14}/>Suche läuft …</span>}{suggestions.map(item=><button key={`${item.id}:${item.latitude}:${item.longitude}`} type="button" onClick={()=>{setDestination(item);setDestinationQuery(displayDestination(item));setSuggestions([]);setError('');}}><strong>{item.icao?`${item.icao} · ${item.name}`:item.name}</strong><small>{[item.poiCategory,item.admin1,item.country].filter(Boolean).join(' · ')||'ICAO-Flugplatz'} · {formatDecimal(item.latitude,2,2)}° / {formatDecimal(item.longitude,2,2)}°</small></button>)}{!searchLoading&&!suggestions.length&&destinationQuery.trim().length>=2&&<span className="route-search-hint"><AlertTriangle size={14}/>Kein passender Zielvorschlag gefunden.</span>}</div>}</label><label><span>Abfahrt</span><input type="datetime-local" value={departureInput} onChange={event=>setDepartureInput(event.target.value)}/></label><label><span>Ø Reisegeschwindigkeit</span><div className="route-speed-input"><input type="range" min={5} max={130} step={5} value={speedKmh} onChange={event=>setSpeedKmh(Number(event.target.value))}/><b>{speedKmh} km/h</b></div></label></div><div className="route-weather-note"><CloudRain size={15}/><span>Die Route nutzt dieselbe Niederschlagslogik wie die übrigen MID-Vorhersagen. Die Plausibilitätsprüfung verallgemeinert nur seltene Unterarten: Sprühregen wird bei fehlender Stratuslage zu Regen, Schneegriesel entsprechend zu Schnee. Die feste oder flüssige Phase des WMO-Codes bleibt unverändert.</span></div>{error&&<div className="error">{error}</div>}{result&&<><div className="route-weather-summary"><div className="route-summary-main"><span className={`route-assessment-chip ${routeLevelClass(result.assessment.level)}`}>{result.assessment.headline}</span><strong>{start.name} → {destination?.name||result.destination.name}</strong><small>{result.assessment.summary}</small></div><div className="route-summary-metrics"><div><small>Distanz</small><b>{new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(result.distanceKm)} km</b></div><div><small>Dauer</small><b>{formatDuration(result.durationMinutes)}</b></div><div><small>Abfahrt</small><b>{formatDateTime(result.departureIso)}</b></div><div><small>Ankunft</small><b>{formatDateTime(result.arrivalIso)}</b></div></div></div><div className="route-mode-toggle" role="tablist" aria-label="Kartenmodus Routenwetter"><button type="button" className={mode==='line'?'active':''} onClick={()=>setMode('line')} aria-pressed={mode==='line'}>Linie</button><button type="button" className={mode==='segments'?'active':''} onClick={()=>setMode('segments')} aria-pressed={mode==='segments'}>Segmente</button><button type="button" className={mode==='corridor'?'active':''} onClick={()=>setMode('corridor')} aria-pressed={mode==='corridor'}>Korridor</button></div><RouteMap result={result} mode={mode}/><div className="route-weather-grid"><article className="route-evaluation-card"><h4><Navigation size={16}/>Einschränkungsbewertung</h4><ul>{result.assessment.impacts.map(item=><li key={item}>{item}</li>)}</ul></article><article className="route-evaluation-card"><h4><AlertTriangle size={16}/>Fachliche Grenzen</h4><ul>{result.assessment.limitations.map(item=><li key={item}>{item}</li>)}</ul></article></div><div className="route-checkpoints"><div className="route-checkpoints-head"><strong>Abschnitte entlang der Route</strong><small>{routeCoordinates.length} Stichprobenpunkte</small></div><div className="route-checkpoint-list">{result.checkpoints.map((point:RouteCheckpoint)=><article key={point.id} className={`route-checkpoint ${routeLevelClass(point.restriction.level)}`}><div className="route-checkpoint-top"><span className="route-checkpoint-name">{point.name}</span><span className="route-checkpoint-time">{formatDateTime(point.etaIso)}</span></div><div className="route-checkpoint-weather"><strong><WeatherPictogram code={point.weather.displayCode} day={point.weather.isDay} title={point.weather.label}/> {point.weather.label}</strong><span>{Math.round(point.weather.temperature)} °C (gefühlt {Math.round(point.weather.apparent)} °C)</span><span>{point.weather.precipLabel} · {Math.round(point.weather.precipitationProbability)} %</span><span><Wind size={14}/>{formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust)}</span><span>Sicht {point.weather.visibility>=1000?`${Math.round(point.weather.visibility/100)/10} km`:`${Math.round(point.weather.visibility)} m`}</span></div><p>{point.restriction.reasons.join(' · ')}</p><small>{new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(point.distanceKm)} km ab Start · {formatDuration(point.elapsedMinutes)}</small></article>)}</div></div></>}</section>;
}
