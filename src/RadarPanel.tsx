import {useEffect,useState} from 'react';
import {Droplets,Pause,Play,SkipBack,SkipForward} from 'lucide-react';
import {CircleMarker,MapContainer,Popup,TileLayer,WMSTileLayer,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {RadarNowcast} from './weather';

type RadarFrame={time:number;path?:string;future?:boolean};
type RadarResponse={host:string;radar:{past:RadarFrame[];nowcast?:RadarFrame[]}};
function formatInZone(value:number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(new Date(value))}catch{return new Intl.DateTimeFormat('de-DE',options).format(new Date(value))}}
function Title({eye,title}:{eye:string;title:string}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div></header>}
function MoveMap({lat,lon}:{lat:number;lon:number}){const map=useMap();useEffect(()=>{map.setView([lat,lon],7,{animate:true})},[lat,lon,map]);return null}
const DWD_RATE_LEGEND=[
 {value:'0,1',color:'#d9f3ff'},{value:'0,5',color:'#72c9ff'},{value:'1',color:'#2f91e3'},{value:'2,5',color:'#43c879'},
 {value:'5',color:'#f0d447'},{value:'10',color:'#f59b3d'},{value:'20',color:'#e34b4b'},{value:'50＋',color:'#b83fc8'}
];
const RAINVIEWER_LEGEND=[{dbz:10,color:'#d2c48b'},{dbz:20,color:'#00a3e0'},{dbz:30,color:'#005588'},{dbz:40,color:'#ffaa00'},{dbz:50,color:'#c10000'},{dbz:60,color:'#ff62ff'}];
function RadarColourLegend({source}:{source:'dwd'|'rainviewer'}){
 return source==='dwd'?<div className="radar-colour-legend dwd">
  <div className="radar-legend-head"><span><Droplets size={11}/>Niederschlagsrate</span><b>mm/h</b></div>
  <div className="dwd-rate-scale" aria-hidden="true">{DWD_RATE_LEGEND.map(item=><i key={item.value} style={{background:item.color}}/>)}</div>
  <div className="dwd-rate-ticks">{DWD_RATE_LEGEND.map(item=><span key={item.value}>{item.value}</span>)}</div>
  <div className="dwd-rate-classes"><span>leicht</span><span>mäßig</span><span>stark</span><span>sehr stark</span></div>
  <small>DWD-RV · vereinfachte MID-Leseskala</small>
 </div>:<div className="radar-colour-legend rainviewer">
  <div>{RAINVIEWER_LEGEND.map(item=><i key={item.dbz} style={{background:item.color}} title={`${item.dbz} dBZ`}/>)}</div>
  <p>{RAINVIEWER_LEGEND.map(item=><span key={item.dbz}>{item.dbz}{item.dbz===60?'＋':''}</span>)}</p>
  <small>RainViewer Universal Blue · dBZ</small>
 </div>
}
export default function RadarPanel({lat,lon,timezone,analysis}:{lat:number;lon:number;timezone?:string;analysis?:RadarNowcast|null}){
 const useDwdLayer=analysis?.source==='dwd'&&analysis.coverage!==false;
 const[frames,setFrames]=useState<RadarFrame[]>([]),[host,setHost]=useState(''),[index,setIndex]=useState(0),[opacity,setOpacity]=useState(82),[latestObserved,setLatestObserved]=useState(0),[source,setSource]=useState<'dwd'|'rainviewer'>('rainviewer'),[playing,setPlaying]=useState(false);
 useEffect(()=>{let alive=true;setPlaying(false);if(useDwdLayer){
  const supplied=(analysis?.source==='dwd'&&Array.isArray(analysis.timeline)?analysis.timeline:[]).map(value=>Math.floor(new Date(value).getTime()/1000)).filter(Number.isFinite).sort((a,b)=>a-b);
  const observedAt=analysis?.source==='dwd'&&analysis.observedAt?Math.floor(new Date(analysis.observedAt).getTime()/1000):0,anchor=observedAt||Math.floor(Date.now()/300000)*300;
  const fallback=Array.from({length:37},(_,i)=>anchor+(i-12)*300),timeline=supplied.length>1?supplied:fallback;
  const items=[...new Set(timeline)].sort((a,b)=>a-b).map(time=>({time,future:time>anchor}));
  const currentIndex=Math.max(0,items.reduce((best,x,i)=>x.time<=anchor?i:best,0));setFrames(items);setIndex(currentIndex);setLatestObserved(anchor);setSource('dwd');return()=>{alive=false}
 }
 fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(r=>r.json()).then((d:RadarResponse)=>{if(!alive)return;const past=(d.radar?.past??[]).slice(-12),last=past.at(-1)?.time??0,nowcast=(d.radar?.nowcast??[]).filter(x=>x.time<=last+3600).map(x=>({...x,future:true})),items=[...past,...nowcast];setHost(d.host);setFrames(items);setLatestObserved(last);setIndex(Math.max(0,past.length-1));setSource('rainviewer')}).catch(()=>{setFrames([]);setHost('')});return()=>{alive=false}
 },[lat,lon,useDwdLayer,analysis?.source,analysis?.observedAt,analysis?.timeline?.join('|')]);
 useEffect(()=>{if(!playing||frames.length<2)return;const timer=window.setInterval(()=>setIndex(current=>current>=frames.length-1?0:current+1),850);return()=>window.clearInterval(timer)},[playing,frames.length]);
 const frame=frames[index],future=!!frame&&frame.time>latestObserved,minutesAhead=future?Math.max(0,Math.round((frame.time-latestObserved)/60)):0,dwdLayer=analysis?.source==='dwd'&&analysis.radarLayer?analysis.radarLayer:'dwd:Niederschlagsradar';
 const rainViewerUrl=frame?.path&&host?`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`:'';
 const dwdTime=frame?new Date(frame.time*1000).toISOString():'';
 const hasFuture=frames.some(x=>x.time>latestObserved),canAnimate=frames.length>1;
 const step=(amount:number)=>{setPlaying(false);setIndex(current=>Math.max(0,Math.min(frames.length-1,current+amount)))};
 const togglePlay=()=>{if(!canAnimate)return;if(!playing&&index>=frames.length-1)setIndex(0);setPlaying(value=>!value)};
 return <section className="card"><Title eye="Open Source Radar" title="Niederschlagsradar"/><div className="radarmap"><MapContainer center={[lat,lon]} zoom={7} className="leafletmap" scrollWheelZoom={false}><MoveMap lat={lat} lon={lon}/><TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{source==='dwd'&&frame&&<WMSTileLayer key={`${dwdLayer}:${dwdTime}`} url="https://maps.dwd.de/geoserver/wms" opacity={opacity/100} params={({layers:dwdLayer,styles:'',format:'image/png',transparent:true,version:'1.3.0',time:dwdTime} as any)} attribution='Radar und Nowcast &copy; DWD'/>}{source==='rainviewer'&&rainViewerUrl&&<TileLayer attribution='Radar &copy; RainViewer' url={rainViewerUrl} opacity={opacity/100}/>}<CircleMarker center={[lat,lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#1f8cff',fillOpacity:0.95}}><Popup>Gewählter Standort</Popup></CircleMarker></MapContainer><div className="radarlegend"><div className="radarlegend-head"><strong>{future?`Nowcast +${minutesAhead} min`:'Radarintensität'}</strong><span>{source==='dwd'?'DWD-RV':'RainViewer'}</span></div><small>{source==='dwd'?'Beobachtung und offene 0–2-h-Vorhersage':'Radarhistorie; Standort-Nowcast separat'}{analysis&&analysis.source!=='model'?` · ${analysis.provider}`:''}</small><RadarColourLegend source={source}/></div></div>
  <div className="radarcontrols">
   <div className="radar-playback-buttons"><button className="secondary" disabled={!canAnimate||index<=0} onClick={()=>step(-1)} title="Vorheriger Radarzeitschritt" aria-label="Vorheriger Radarzeitschritt"><SkipBack size={17}/></button><button className="secondary play" disabled={!canAnimate} onClick={togglePlay} title={playing?'Animation pausieren':'Radarfilm abspielen'} aria-label={playing?'Animation pausieren':'Radarfilm abspielen'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="secondary" disabled={!canAnimate||index>=frames.length-1} onClick={()=>step(1)} title="Nächster Radarzeitschritt" aria-label="Nächster Radarzeitschritt"><SkipForward size={17}/></button></div>
   <div className="range timeline"><small>Zeitschritt {frames.length?`${index+1}/${frames.length}`:''}{future?` · +${minutesAhead} min`:''}</small><input type="range" min={0} max={Math.max(0,frames.length-1)} value={index} disabled={!canAnimate} onChange={e=>{setPlaying(false);setIndex(Number(e.target.value))}}/></div>
   <time className={future?'future':''}>{frame?formatInZone(frame.time*1000,timezone,{hour:'2-digit',minute:'2-digit'}):'–:–'}{future?' Prognose':''}</time>
   <div className="range opacity"><small>Radar-Deckkraft</small><input type="range" min={25} max={100} value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/></div>
  </div>
  {!canAnimate&&<small className="source warning">Aktuell ist nur ein Radarzeitschritt abrufbar; die Animation startet automatisch, sobald weitere Frames verfügbar sind.</small>}{!hasFuture&&source==='rainviewer'&&<small className="source warning">RainViewer stellt keine öffentlichen Zukunftsframes bereit; die Standortprognose ist eine gekennzeichnete Bewegungsnäherung aus der Radarhistorie.</small>}<small className="source">Kartenbasis: OpenStreetMap · Kartenebene: {source==='dwd'?'Deutscher Wetterdienst (DWD-RV-Produkt)':'RainViewer Universal Blue'}{analysis&&analysis.source!=='model'?` · Standortauswertung: ${analysis.provider}`:''} · Darstellung kann zeitverzögert oder unvollständig sein; keine amtliche Warnung.</small>
 </section>
}
