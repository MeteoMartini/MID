import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertTriangle,CloudRain,MapPinned,Navigation,Route as RouteIcon,Search,Wind} from 'lucide-react';
import L from 'leaflet';
import {CircleMarker,MapContainer,Marker,Polyline,TileLayer,Tooltip,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {searchLocations,type Location} from './weather';
import {formatDecimal} from './format';
import {formatLocalIso,formatRouteWind,loadRouteWeather,routeLevelClass,routeLevelColor,type RouteCheckpoint,type RouteMapMode,type RouteWeatherResult} from './routeWeather';

function formatDateTime(value:string){
 return new Date(value).toLocaleString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
}
function formatDuration(minutes:number){
 const hours=Math.floor(minutes/60),mins=minutes%60;
 return hours?`${hours} h ${String(mins).padStart(2,'0')} min`:`${mins} min`;
}
function displayDestination(loc:Location){
 return [loc.name,loc.admin1||loc.country].filter(Boolean).join(' · ');
}
function defaultDepartureInput(){
 const date=new Date();
 date.setMinutes(0,0,0);
 date.setHours(date.getHours()+1);
 return formatLocalIso(date.toISOString());
}

function RouteBounds({points}:{points:[number,number][]}){
 const map=useMap();
 useEffect(()=>{
  if(!points.length)return;
  const bounds=L.latLngBounds(points.map(point=>L.latLng(point[0],point[1])));
  map.fitBounds(bounds.pad(0.25),{padding:[24,24]});
 },[map,JSON.stringify(points)]);
 return null;
}

function windIcon(direction:number,color:string){
 return L.divIcon({
  className:'route-wind-marker',
  html:`<span class="route-wind-glyph" style="color:${color};transform:rotate(${direction}deg)">↑</span>`,
  iconSize:[18,18],
  iconAnchor:[9,9]
 });
}

function RouteMap({result,mode}:{result:RouteWeatherResult;mode:RouteMapMode}){
 const points=result.checkpoints.map(point=>[point.latitude,point.longitude] as [number,number]);
 const segmentWeight=mode==='corridor'?5:4;
 return <div className="route-weather-map"><MapContainer center={points[0]} zoom={7} className="leafletmap" scrollWheelZoom={false} fadeAnimation={false} zoomAnimation={false}><RouteBounds points={points}/><TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" keepBuffer={1}/>{mode==='line'&&<Polyline positions={points} pathOptions={{color:'#1e78ff',weight:5,opacity:.92}}/>}{result.checkpoints.slice(1).map((point,index)=>{const previous=result.checkpoints[index],positions:[[number,number],[number,number]]=[[previous.latitude,previous.longitude],[point.latitude,point.longitude]],color=routeLevelColor(point.restriction.level);if(mode==='segments')return <Polyline key={`segment-${point.id}`} positions={positions} pathOptions={{color,weight:segmentWeight,opacity:.94}}/>;if(mode==='corridor')return [<Polyline key={`corridor-wide-${point.id}`} positions={positions} pathOptions={{color,weight:18,opacity:.18,lineCap:'round'}}/>,<Polyline key={`corridor-line-${point.id}`} positions={positions} pathOptions={{color,weight:segmentWeight,opacity:.94}}/>];return null})}{result.checkpoints.map(point=>{const color=routeLevelColor(point.restriction.level);return <CircleMarker key={`point-${point.id}`} center={[point.latitude,point.longitude]} radius={8} pathOptions={{color:'#ffffff',weight:2,fillColor:color,fillOpacity:.94}}><Tooltip direction="top" offset={[0,-6]}><div className="route-map-tooltip"><strong>{point.name}</strong><span>{formatDateTime(point.etaIso)}</span><span>{point.weather.icon} {point.weather.label}</span><span>{Math.round(point.weather.temperature)} °C · {Math.round(point.weather.precipitationProbability)} %</span><span>{formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust)}</span></div></Tooltip></CircleMarker>})}{result.checkpoints.map(point=>{const color=routeLevelColor(point.restriction.level);return <Marker key={`wind-${point.id}`} position={[point.latitude,point.longitude]} icon={windIcon(point.weather.direction,color)}><Tooltip direction="bottom" offset={[0,10]}>{formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust)}</Tooltip></Marker>})}</MapContainer></div>;
}

export default function RouteWeatherPanel({start}:{start:Location}){
 const[destinationQuery,setDestinationQuery]=useState('');
 const[destination,setDestination]=useState<Location|null>(null);
 const[suggestions,setSuggestions]=useState<Location[]>([]);
 const[searchLoading,setSearchLoading]=useState(false);
 const[departureInput,setDepartureInput]=useState(defaultDepartureInput);
 const[speedKmh,setSpeedKmh]=useState(90);
 const[mode,setMode]=useState<RouteMapMode>('line');
 const[result,setResult]=useState<RouteWeatherResult|null>(null);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState('');
 const searchSeq=useRef(0),loadController=useRef<AbortController|null>(null);

 useEffect(()=>{setResult(null);setError('');setSuggestions([]);setDestination(null);setDestinationQuery('')},[start.id,start.latitude,start.longitude]);
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
   const route=await loadRouteWeather(start,destination,departureInfo,speedKmh,controller.signal);
   if(!controller.signal.aborted)setResult(route);
  }catch(reason){
   if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Routenwetter konnte nicht geladen werden.');
  }finally{
   if(loadController.current===controller)loadController.current=null;
   if(!controller.signal.aborted)setLoading(false);
  }
 };

 const routeCoordinates=useMemo(()=>result?.checkpoints.map(point=>[point.latitude,point.longitude] as [number,number])??[],[result]);

 return <section className="card route-weather-card"><div className="charthead"><div><h3>Routenwetter</h3><p className="route-weather-headline">Schematische Route mit MID-Plausibilisierung für Regen/Sprühregen sowie Schnee/Schneegriesel, Windpfeilen und Einschränkungsbewertung.</p></div><div className="route-weather-disclaimer"><MapPinned size={16}/><span>Luftlinien-Schema zwischen Start und Ziel – keine Navigationsroute.</span></div></div><div className="route-weather-controls"><label><span>Start</span><input value={displayDestination(start)} readOnly/></label><label className="route-weather-destination"><span>Ziel</span><div className="route-destination-field"><input value={destinationQuery} onChange={event=>{setDestinationQuery(event.target.value);setDestination(null);}} placeholder="Ort oder PLZ suchen" aria-label="Ziel für das Routenwetter"/><button type="button" onClick={analyse} disabled={loading||!destination}><RouteIcon size={15}/><span>{loading?'Lädt …':'Route analysieren'}</span></button></div>{(searchLoading||suggestions.length>0)&&<div className="route-search-results">{searchLoading&&<span className="route-search-hint"><Search size={14}/>Suche läuft …</span>}{suggestions.map(item=><button key={`${item.id}:${item.latitude}:${item.longitude}`} type="button" onClick={()=>{setDestination(item);setDestinationQuery(displayDestination(item));setSuggestions([]);setError('');}}><strong>{item.name}</strong><small>{[item.admin1,item.country].filter(Boolean).join(' · ')} · {formatDecimal(item.latitude,2,2)}° / {formatDecimal(item.longitude,2,2)}°</small></button>)}{!searchLoading&&!suggestions.length&&destinationQuery.trim().length>=2&&<span className="route-search-hint"><AlertTriangle size={14}/>Kein passender Zielvorschlag gefunden.</span>}</div>}</label><label><span>Abfahrt</span><input type="datetime-local" value={departureInput} onChange={event=>setDepartureInput(event.target.value)}/></label><label><span>Ø Reisegeschwindigkeit</span><div className="route-speed-input"><input type="range" min={50} max={130} step={5} value={speedKmh} onChange={event=>setSpeedKmh(Number(event.target.value))}/><b>{speedKmh} km/h</b></div></label></div><div className="route-weather-note"><CloudRain size={15}/><span>Die Route nutzt dieselbe Niederschlagslogik wie die übrigen MID-Vorhersagen. Ein unplausibler Sprühregen-Code erscheint dadurch auch hier als Regen; Schneesignale und Schneegriesel bleiben konsistent aus WMO-Code und Niederschlagsfeldern abgeleitet.</span></div>{error&&<div className="error">{error}</div>}{result&&<><div className="route-weather-summary"><div className="route-summary-main"><span className={`route-assessment-chip ${routeLevelClass(result.assessment.level)}`}>{result.assessment.headline}</span><strong>{start.name} → {destination?.name||result.destination.name}</strong><small>{result.assessment.summary}</small></div><div className="route-summary-metrics"><div><small>Distanz</small><b>{new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(result.distanceKm)} km</b></div><div><small>Dauer</small><b>{formatDuration(result.durationMinutes)}</b></div><div><small>Abfahrt</small><b>{formatDateTime(result.departureIso)}</b></div><div><small>Ankunft</small><b>{formatDateTime(result.arrivalIso)}</b></div></div></div><div className="route-mode-toggle" role="tablist" aria-label="Kartenmodus Routenwetter"><button type="button" className={mode==='line'?'active':''} onClick={()=>setMode('line')} aria-pressed={mode==='line'}>Linie</button><button type="button" className={mode==='segments'?'active':''} onClick={()=>setMode('segments')} aria-pressed={mode==='segments'}>Segmente</button><button type="button" className={mode==='corridor'?'active':''} onClick={()=>setMode('corridor')} aria-pressed={mode==='corridor'}>Korridor</button></div><RouteMap result={result} mode={mode}/><div className="route-weather-grid"><article className="route-evaluation-card"><h4><Navigation size={16}/>Einschränkungsbewertung</h4><ul>{result.assessment.impacts.map(item=><li key={item}>{item}</li>)}</ul></article><article className="route-evaluation-card"><h4><AlertTriangle size={16}/>Fachliche Grenzen</h4><ul>{result.assessment.limitations.map(item=><li key={item}>{item}</li>)}</ul></article></div><div className="route-checkpoints"><div className="route-checkpoints-head"><strong>Abschnitte entlang der Route</strong><small>{routeCoordinates.length} Stichprobenpunkte</small></div><div className="route-checkpoint-list">{result.checkpoints.map((point:RouteCheckpoint)=><article key={point.id} className={`route-checkpoint ${routeLevelClass(point.restriction.level)}`}><div className="route-checkpoint-top"><span className="route-checkpoint-name">{point.name}</span><span className="route-checkpoint-time">{formatDateTime(point.etaIso)}</span></div><div className="route-checkpoint-weather"><strong>{point.weather.icon} {point.weather.label}</strong><span>{Math.round(point.weather.temperature)} °C (gefühlt {Math.round(point.weather.apparent)} °C)</span><span>{point.weather.precipLabel} · {Math.round(point.weather.precipitationProbability)} %</span><span><Wind size={14}/>{formatRouteWind(point.weather.direction,point.weather.wind,point.weather.gust)}</span><span>Sicht {point.weather.visibility>=1000?`${Math.round(point.weather.visibility/100)/10} km`:`${Math.round(point.weather.visibility)} m`}</span></div><p>{point.restriction.reasons.join(' · ')}</p><small>{new Intl.NumberFormat('de-DE',{maximumFractionDigits:1}).format(point.distanceKm)} km ab Start · {formatDuration(point.elapsedMinutes)}</small></article>)}</div></div></>}</section>;
}
