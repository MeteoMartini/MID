import {lazy,Suspense,useCallback,useEffect,useState,type ReactNode} from 'react';
import {CloudSun,Droplets,Pause,Play,RadioTower,Satellite,SkipBack,SkipForward,Zap} from 'lucide-react';
import {CircleMarker,MapContainer,Popup,TileLayer,WMSTileLayer,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {RadarNowcast} from './weather';
import {loadPx250Metadata,type Px250Meta} from './Px250Source';

const LazyPx250Overlay=lazy(()=>import('./Px250Overlay'));
type RadarFrame={time:number;path?:string;future?:boolean};
type RadarResponse={host:string;radar:{past:RadarFrame[];nowcast?:RadarFrame[]}};
type PxStatus='idle'|'loading'|'ready'|'error';
function formatInZone(value:number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(new Date(value))}catch{return new Intl.DateTimeFormat('de-DE',options).format(new Date(value))}}
function Title({eye,title}:{eye:string;title:string}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div></header>}
function MoveMap({lat,lon}:{lat:number;lon:number}){const map=useMap();useEffect(()=>{map.setView([lat,lon],7,{animate:true})},[lat,lon,map]);return null}
const DWD_RATE_LEGEND=[
 {value:'0,1',color:'#d9f3ff'},{value:'0,5',color:'#72c9ff'},{value:'1',color:'#2f91e3'},{value:'2,5',color:'#43c879'},
 {value:'5',color:'#f0d447'},{value:'10',color:'#f59b3d'},{value:'20',color:'#e34b4b'},{value:'50＋',color:'#b83fc8'}
];
const RAINVIEWER_LEGEND=[{dbz:10,color:'#d2c48b'},{dbz:20,color:'#00a3e0'},{dbz:30,color:'#005588'},{dbz:40,color:'#ffaa00'},{dbz:50,color:'#c10000'},{dbz:60,color:'#ff62ff'}];
function RadarColourLegend({source,highResolution=false}:{source:'dwd'|'rainviewer';highResolution?:boolean}){
 return source==='dwd'&&!highResolution?<div className="radar-colour-legend dwd">
  <div className="radar-legend-head"><span><Droplets size={11}/>Niederschlagsrate</span><b>mm/h</b></div>
  <div className="dwd-rate-scale" aria-hidden="true">{DWD_RATE_LEGEND.map(item=><i key={item.value} style={{background:item.color}}/>)}</div>
  <div className="dwd-rate-ticks">{DWD_RATE_LEGEND.map(item=><span key={item.value}>{item.value}</span>)}</div>
  <div className="dwd-rate-classes"><span>leicht</span><span>mäßig</span><span>stark</span><span>sehr stark</span></div>
  <small>DWD-RV · vereinfachte MID-Leseskala</small>
 </div>:<div className="radar-colour-legend rainviewer">
  <div>{RAINVIEWER_LEGEND.map(item=><i key={item.dbz} style={{background:item.color}} title={`${item.dbz} dBZ`}/>)}</div>
  <p>{RAINVIEWER_LEGEND.map(item=><span key={item.dbz}>{item.dbz}{item.dbz===60?'＋':''}</span>)}</p>
  <small>{highResolution?'DWD-PX250 · Reflektivität in dBZ':'RainViewer Universal Blue · dBZ'}</small>
 </div>
}
function LayerSwitch({active,disabled=false,title,onClick,icon,label,detail}:{active:boolean;disabled?:boolean;title:string;onClick:()=>void;icon:ReactNode;label:string;detail?:string}){return <button type="button" className={`composite-switch${active?' active':''}`} disabled={disabled} aria-pressed={active} title={title} onClick={onClick}>{icon}<span><b>{label}</b>{detail&&<small>{detail}</small>}</span></button>}
export default function RadarPanel({lat,lon,timezone,analysis,isDay=true}:{lat:number;lon:number;timezone?:string;analysis?:RadarNowcast|null;isDay?:boolean}){
 const useDwdLayer=analysis?.source==='dwd'&&analysis.coverage!==false;
 const[frames,setFrames]=useState<RadarFrame[]>([]),[host,setHost]=useState(''),[index,setIndex]=useState(0),[opacity,setOpacity]=useState(82),[latestObserved,setLatestObserved]=useState(0),[source,setSource]=useState<'dwd'|'rainviewer'>('rainviewer'),[playing,setPlaying]=useState(false);
 const[showRadar,setShowRadar]=useState(true),[highResolution,setHighResolution]=useState(false),[showSatellite,setShowSatellite]=useState(false),[showLightning,setShowLightning]=useState(false),[satelliteFallback,setSatelliteFallback]=useState(false);
 const[pxMeta,setPxMeta]=useState<Px250Meta|null>(null),[pxLoading,setPxLoading]=useState(false),[pxStatus,setPxStatus]=useState<PxStatus>('idle'),[pxMessage,setPxMessage]=useState('');
 useEffect(()=>{let alive=true;setPlaying(false);if(useDwdLayer){
  const supplied=(analysis?.source==='dwd'&&Array.isArray(analysis.timeline)?analysis.timeline:[]).map(value=>Math.floor(new Date(value).getTime()/1000)).filter(Number.isFinite).sort((a,b)=>a-b);
  const observedAt=analysis?.source==='dwd'&&analysis.observedAt?Math.floor(new Date(analysis.observedAt).getTime()/1000):0,anchor=observedAt||Math.floor(Date.now()/300000)*300;
  const fallback=Array.from({length:37},(_,i)=>anchor+(i-12)*300),timeline=supplied.length>1?supplied:fallback;
  const items=[...new Set(timeline)].sort((a,b)=>a-b).map(time=>({time,future:time>anchor}));
  const currentIndex=Math.max(0,items.reduce((best,x,i)=>x.time<=anchor?i:best,0));setFrames(items);setIndex(currentIndex);setLatestObserved(anchor);setSource('dwd');return()=>{alive=false}
 }
 fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(r=>r.json()).then((d:RadarResponse)=>{if(!alive)return;const past=(d.radar?.past??[]).slice(-12),last=past.at(-1)?.time??0,nowcast=(d.radar?.nowcast??[]).filter(x=>x.time<=last+3600).map(x=>({...x,future:true})),items=[...past,...nowcast];setHost(d.host);setFrames(items);setLatestObserved(last);setIndex(Math.max(0,past.length-1));setSource('rainviewer')}).catch(()=>{setFrames([]);setHost('')});return()=>{alive=false}
 },[lat,lon,useDwdLayer,analysis?.source,analysis?.observedAt,analysis?.timeline?.join('|')]);
 useEffect(()=>{let alive=true;setHighResolution(false);setPxStatus('idle');setPxMessage('');const load=()=>{setPxLoading(true);loadPx250Metadata(lat,lon).then(data=>{if(alive)setPxMeta(data)}).catch(error=>{if(alive)setPxMeta({available:false,nativeResolutionM:250,reason:error instanceof Error?error.message:String(error)})}).finally(()=>{if(alive)setPxLoading(false)})};load();const timer=window.setInterval(load,300000);return()=>{alive=false;window.clearInterval(timer)}},[lat,lon]);
 useEffect(()=>{setSatelliteFallback(false)},[isDay,lat,lon]);
 useEffect(()=>{if(!playing||frames.length<2||highResolution||!showRadar)return;const timer=window.setInterval(()=>setIndex(current=>current>=frames.length-1?0:current+1),850);return()=>window.clearInterval(timer)},[playing,frames.length,highResolution,showRadar]);
 const onPxStatus=useCallback((status:PxStatus,message='')=>{setPxStatus(status);setPxMessage(message)},[]);
 const frame=frames[index],future=!!frame&&frame.time>latestObserved,minutesAhead=future?Math.max(0,Math.round((frame.time-latestObserved)/60)):0,dwdLayer=analysis?.source==='dwd'&&analysis.radarLayer?analysis.radarLayer:'dwd:Niederschlagsradar';
 const rainViewerUrl=frame?.path&&host?`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`:'';
 const dwdTime=frame?new Date(frame.time*1000).toISOString():'';
 const hasFuture=frames.some(x=>x.time>latestObserved),canAnimate=showRadar&&!highResolution&&frames.length>1;
 const satelliteDay=isDay&&!satelliteFallback,satelliteLayer=satelliteDay?'mtg_fd:vis06_hrfi':'mtg_fd:ir105_hrfi',satelliteName=satelliteDay?'HRV/HRFI VIS 0,6':'IR 10,5',dwdLightning=lat>=47&&lat<=55.5&&lon>=5&&lon<=16,lightningName=dwdLightning?'DWD-Blitzdichte 1 km':'MTG-LI AFA 2 km';
 const displayTimestamp=highResolution&&pxMeta?.observedAt?new Date(pxMeta.observedAt).getTime():frame?frame.time*1000:0;
 const step=(amount:number)=>{setPlaying(false);setIndex(current=>Math.max(0,Math.min(frames.length-1,current+amount)))};
 const togglePlay=()=>{if(!canAnimate)return;if(!playing&&index>=frames.length-1)setIndex(0);setPlaying(value=>!value)};
 const toggleRadar=()=>{setShowRadar(value=>{if(value){setHighResolution(false);setPlaying(false)}return!value})};
 const toggleHighRes=()=>{if(!pxMeta?.available)return;setShowRadar(true);setPlaying(false);setHighResolution(value=>!value)};
 const pxDetail=pxLoading?'Prüfung …':pxMeta?.available?`${pxMeta.siteName??pxMeta.site?.toUpperCase()} · ${pxMeta.distanceKm?.toFixed(0)} km`:'nicht verfügbar';
 const activeLabels=[showRadar&&(highResolution?'DWD PX250':'Niederschlag'),showSatellite&&`Satellit ${satelliteName}`,showLightning&&`Echtzeitblitze ${lightningName}`].filter(Boolean) as string[];
 return <section className="card composite-card"><Title eye="Radar · Satellit · Blitze" title="Kompositbild"/>
  <div className="composite-layer-switches" aria-label="Komposit-Layer">
   <LayerSwitch active={showRadar&&!highResolution} title="Standard-Niederschlagsradar ein- oder ausblenden" onClick={toggleRadar} icon={<Droplets size={18}/>} label="Niederschlag" detail={source==='dwd'?'DWD-RV':'Fallback'}/>
   <LayerSwitch active={highResolution} disabled={pxLoading||!pxMeta?.available} title={pxMeta?.reason||'Native DWD-PX250-Reflektivität mit 250 m Rasterweite'} onClick={toggleHighRes} icon={<RadioTower size={18}/>} label="Radar 250 m" detail={pxDetail}/>
   <LayerSwitch active={showSatellite} title={`${isDay?'Hochaufgelöster sichtbarer MTG-FCI-Kanal':'Hochaufgelöster infraroter MTG-FCI-Kanal'} ein- oder ausblenden`} onClick={()=>setShowSatellite(value=>!value)} icon={isDay?<CloudSun size={18}/>:<Satellite size={18}/>} label={`Satellit ${isDay?'HRV':'IR'}`} detail={satelliteFallback?'IR-Fallback':satelliteName}/>
   <LayerSwitch active={showLightning} title="Hochaufgelöste Echtzeit-Blitzaktivität ein- oder ausblenden" onClick={()=>setShowLightning(value=>!value)} icon={<Zap size={18}/>} label="Echtzeitblitze" detail={dwdLightning?'DWD · 1 km / 5 min':'MTG-LI · 2 km / 5 min'}/>
  </div>
  <div className="radarmap"><MapContainer center={[lat,lon]} zoom={7} className="leafletmap" scrollWheelZoom={false}><MoveMap lat={lat} lon={lon}/><TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" zIndex={100}/>
   {showSatellite&&<WMSTileLayer key={`${satelliteLayer}:${lat.toFixed(2)}:${lon.toFixed(2)}`} url="https://view.eumetsat.int/geoserver/wms" opacity={0.84} zIndex={220} eventHandlers={{tileerror:()=>{if(satelliteDay)setSatelliteFallback(true)}}} params={({layers:satelliteLayer,styles:'',format:'image/png',transparent:false,version:'1.3.0'} as any)} attribution='Satellit &copy; EUMETSAT'/>}
   {showRadar&&!highResolution&&source==='dwd'&&frame&&<WMSTileLayer key={`${dwdLayer}:${dwdTime}`} url="https://maps.dwd.de/geoserver/wms" opacity={opacity/100} zIndex={360} params={({layers:dwdLayer,styles:'',format:'image/png',transparent:true,version:'1.3.0',time:dwdTime} as any)} attribution='Radar und Nowcast &copy; DWD'/>}
   {showRadar&&!highResolution&&source==='rainviewer'&&rainViewerUrl&&<TileLayer attribution='Radar &copy; RainViewer' url={rainViewerUrl} opacity={opacity/100} zIndex={360}/>} 
   {showRadar&&highResolution&&pxMeta?.available&&<Suspense fallback={null}><LazyPx250Overlay meta={pxMeta} opacity={opacity/100} onStatus={onPxStatus}/></Suspense>}
   {showLightning&&dwdLightning&&<WMSTileLayer url="https://maps.dwd.de/geoserver/wms" opacity={0.98} zIndex={470} params={({layers:'dwd:Blitzdichte',styles:'',format:'image/png',transparent:true,version:'1.3.0'} as any)} attribution='Blitzdichte &copy; DWD'/>}{showLightning&&!dwdLightning&&<WMSTileLayer url="https://view.eumetsat.int/geoserver/wms" opacity={0.96} zIndex={470} params={({layers:'mtg_fd:li_afa',styles:'',format:'image/png',transparent:true,version:'1.3.0'} as any)} attribution='Lightning Imager &copy; EUMETSAT'/>}
   <CircleMarker center={[lat,lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#1f8cff',fillOpacity:0.95}}><Popup>Gewählter Standort</Popup></CircleMarker></MapContainer>
   <div className="radarlegend"><div className="radarlegend-head"><strong>{highResolution?'Radarreflektivität 250 m':future?`Nowcast +${minutesAhead} min`:'Komposit-Layer'}</strong><span>{highResolution?'PX250':source==='dwd'?'DWD-RV':'Fallback'}</span></div><small>{activeLabels.length?activeLabels.join(' · '):'Nur Kartenbasis'}{highResolution&&pxMeta?.siteName?` · ${pxMeta.siteName}`:''}</small>{showRadar&&<RadarColourLegend source={source} highResolution={highResolution}/>}</div>
  </div>
  <div className="radarcontrols">
   <div className="radar-playback-buttons"><button className="secondary" disabled={!canAnimate||index<=0} onClick={()=>step(-1)} title="Vorheriger Radarzeitschritt" aria-label="Vorheriger Radarzeitschritt"><SkipBack size={17}/></button><button className="secondary play" disabled={!canAnimate} onClick={togglePlay} title={playing?'Animation pausieren':'Radarfilm abspielen'} aria-label={playing?'Animation pausieren':'Radarfilm abspielen'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="secondary" disabled={!canAnimate||index>=frames.length-1} onClick={()=>step(1)} title="Nächster Radarzeitschritt" aria-label="Nächster Radarzeitschritt"><SkipForward size={17}/></button></div>
   <div className="range timeline"><small>{highResolution?'PX250 ist ein aktueller Einzelstand':`Zeitschritt ${frames.length?`${index+1}/${frames.length}`:''}${future?` · +${minutesAhead} min`:''}`}</small><input type="range" min={0} max={Math.max(0,frames.length-1)} value={index} disabled={!canAnimate} onChange={e=>{setPlaying(false);setIndex(Number(e.target.value))}}/></div>
   <time className={future&&!highResolution?'future':''}>{displayTimestamp?formatInZone(displayTimestamp,timezone,{hour:'2-digit',minute:'2-digit'}):'–:–'}{future&&!highResolution?' Prognose':''}</time>
   <div className="range opacity"><small>Niederschlags-Deckkraft</small><input type="range" min={25} max={100} value={opacity} disabled={!showRadar} onChange={e=>setOpacity(Number(e.target.value))}/></div>
  </div>
  {highResolution&&pxStatus==='loading'&&<small className="source composite-source-note"><RadioTower size={12}/>Native DWD-PX250-HDF5-Daten werden lokal gerendert …</small>}
  {highResolution&&pxStatus==='error'&&<small className="source warning">PX250 konnte nicht dargestellt werden: {pxMessage}</small>}
  {!highResolution&&!canAnimate&&showRadar&&<small className="source warning">Aktuell ist nur ein Radarzeitschritt abrufbar; die Animation startet automatisch, sobald weitere Frames verfügbar sind.</small>}
  {!highResolution&&!hasFuture&&source==='rainviewer'&&showRadar&&<small className="source warning">RainViewer stellt keine öffentlichen Zukunftsframes bereit; die Standortprognose ist eine gekennzeichnete Bewegungsnäherung aus der Radarhistorie.</small>}
  <small className="source">Kompositquellen: {showRadar?(highResolution?'DWD-PX250, native Rasterweite 250 m; aktuelles lokales Reflektivitätsbild ohne Nowcast':source==='dwd'?'DWD-RV-Beobachtung und 0–2-h-Nowcast':'RainViewer-Fallback'):'Radar ausgeblendet'}{showSatellite?` · EUMETSAT MTG-FCI ${satelliteName}`:''}{showLightning?(dwdLightning?' · DWD NowCastMIX-Blitzdichte, 5-Minuten-Aktualisierung auf 1-km-Raster':' · EUMETSAT MTG-LI AFA, NRT-5-Minuten-Akkumulation auf 2-km-Raster'):''}. MTG-LI zeigt elektrische Aktivität in Wolkenregionen; die Blitzdarstellung ist keine metergenaue Bodeneinschlagskarte. Kartenbasis: OpenStreetMap. Keine amtliche Warnung.</small>
 </section>
}
