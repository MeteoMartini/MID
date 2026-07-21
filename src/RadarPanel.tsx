import {lazy,Suspense,useCallback,useEffect,useMemo,useState,type ReactNode} from 'react';
import {CloudSun,Droplets,Layers3,Pause,Play,RadioTower,Satellite,SkipBack,SkipForward,Zap} from 'lucide-react';
import {CircleMarker,MapContainer,Popup,TileLayer,WMSTileLayer,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {RadarNowcast} from './weather';
import {loadPx250Metadata,type Px250Meta} from './Px250Source';
import {loadLightningPoints,loadOperaGrid,type CompositeSource,type LightningPoint,type OperaGridPoint} from './CompositeData';

const LazyPx250Overlay=lazy(()=>import('./Px250Overlay'));
type RadarFrame={time:number;path?:string;future?:boolean};
type RadarResponse={host:string;radar:{past:RadarFrame[];nowcast?:RadarFrame[]}};
type PxStatus='idle'|'loading'|'ready'|'error';
type BasemapId='osm'|'positron'|'dark';
const BASEMAPS:Record<BasemapId,{label:string;detail:string;url:string;attribution:string}>={
 osm:{label:'OpenStreetMap',detail:'Standard',url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',attribution:'&copy; OpenStreetMap-Mitwirkende'},
 positron:{label:'Schlicht hell',detail:'CARTO Positron',url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',attribution:'&copy; OpenStreetMap-Mitwirkende &copy; CARTO'},
 dark:{label:'Schlicht dunkel',detail:'CARTO Dark Matter',url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',attribution:'&copy; OpenStreetMap-Mitwirkende &copy; CARTO'}
};
const DWD_RATE_LEGEND=[
 {value:'0,1',color:'#d9f3ff'},{value:'0,5',color:'#72c9ff'},{value:'1',color:'#2f91e3'},{value:'2,5',color:'#43c879'},
 {value:'5',color:'#f0d447'},{value:'10',color:'#f59b3d'},{value:'20',color:'#e34b4b'},{value:'50＋',color:'#b83fc8'}
];
const RAINVIEWER_LEGEND=[{dbz:10,color:'#d2c48b'},{dbz:20,color:'#00a3e0'},{dbz:30,color:'#005588'},{dbz:40,color:'#ffaa00'},{dbz:50,color:'#c10000'},{dbz:60,color:'#ff62ff'}];
const LIGHTNING_AGES=[{label:'0–5 min',color:'#ff3b76'},{label:'5–15',color:'#ff8a20'},{label:'15–30',color:'#ffd24a'},{label:'30–60',color:'#9eb8dc'}];

function formatInZone(value:number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(new Date(value))}catch{return new Intl.DateTimeFormat('de-DE',options).format(new Date(value))}}
function Title({eye,title}:{eye:string;title:string}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div></header>}
function MoveMap({lat,lon}:{lat:number;lon:number}){const map=useMap();useEffect(()=>{map.setView([lat,lon],7,{animate:true})},[lat,lon,map]);return null}
function LayerSwitch({active,disabled=false,title,onClick,icon,label,detail}:{active:boolean;disabled?:boolean;title:string;onClick:()=>void;icon:ReactNode;label:string;detail?:string}){return <button type="button" className={`composite-switch${active?' active':''}`} disabled={disabled} aria-pressed={active} title={title} onClick={onClick}>{icon}<span><b>{label}</b>{detail&&<small>{detail}</small>}</span></button>}
function rateColour(rate:number){if(rate>=50)return'#b83fc8';if(rate>=20)return'#e34b4b';if(rate>=10)return'#f59b3d';if(rate>=5)return'#f0d447';if(rate>=2.5)return'#43c879';if(rate>=1)return'#2f91e3';if(rate>=.5)return'#72c9ff';return'#d9f3ff'}
function lightningStyle(point:LightningPoint,fallbackTime?:string){const stamp=Date.parse(point.observedAt||fallbackTime||''),age=Number.isFinite(stamp)?Math.max(0,(Date.now()-stamp)/60000):0,color=age<=5?'#ff3b76':age<=15?'#ff8a20':age<=30?'#ffd24a':'#9eb8dc',opacity=Math.max(.2,Math.min(.96,1-age/78)),strength=Math.max(1,Math.min(8,Number(point.count)||Math.abs(Number(point.intensity))||1));return{age,color,opacity,radius:4+Math.sqrt(strength)*1.45}}
function formatAge(age:number){return age<1?'gerade eben':`${Math.round(age)} min alt`}
function RadarScale({source,highResolution}:{source:CompositeSource;highResolution:boolean}){
 if(source==='opera'&&!highResolution)return <div className="compact-scale rate"><span>0,1</span><i>{DWD_RATE_LEGEND.map(item=><b key={item.value} style={{background:item.color}}/>)}</i><span>50＋ mm/h</span></div>;
 if(source==='dwd'&&!highResolution)return <div className="compact-scale rate"><span>0,1</span><i>{DWD_RATE_LEGEND.map(item=><b key={item.value} style={{background:item.color}}/>)}</i><span>50＋ mm/h</span></div>;
 return <div className="compact-scale dbz"><span>10</span><i>{RAINVIEWER_LEGEND.map(item=><b key={item.dbz} style={{background:item.color}}/>)}</i><span>60＋ dBZ</span></div>;
}
function CompositeLegend({source,showRadar,highResolution,showSatellite,satelliteName,showLightning,vectorLightning,future,minutesAhead,pxSite}:{source:CompositeSource;showRadar:boolean;highResolution:boolean;showSatellite:boolean;satelliteName:string;showLightning:boolean;vectorLightning:boolean;future:boolean;minutesAhead:number;pxSite?:string}){
 const provider=highResolution?'DWD PX250':source==='dwd'?'DWD-RV':source==='opera'?'EUMETNET OPERA':source==='rainviewer'?'RainViewer':'kein Radar';
 return <div className="radarlegend compact"><div className="radarlegend-head"><strong>{highResolution?'Radar 250 m':future?`Nowcast +${minutesAhead} min`:'Aktive Layer'}</strong><span>{provider}</span></div>
  <div className="legend-active-chips">{showRadar&&<em>Niederschlag{pxSite?` · ${pxSite}`:''}</em>}{showSatellite&&<em>Satellit {satelliteName}</em>}{showLightning&&<em>Blitze</em>}{!showRadar&&!showSatellite&&!showLightning&&<em>nur Kartenbasis</em>}</div>
  {showRadar&&(highResolution||source!=='model')&&<RadarScale source={source} highResolution={highResolution}/>} 
  {showLightning&&vectorLightning&&<div className="lightning-age-legend">{LIGHTNING_AGES.map(item=><span key={item.label}><i style={{background:item.color}}/>{item.label}</span>)}</div>}
 </div>
}

export default function RadarPanel({lat,lon,timezone,analysis,isDay=true}:{lat:number;lon:number;timezone?:string;analysis?:RadarNowcast|null;isDay?:boolean}){
 const source:CompositeSource=analysis?.coverage===false?'model':analysis?.source??'model';
 const[frames,setFrames]=useState<RadarFrame[]>([]),[host,setHost]=useState(''),[index,setIndex]=useState(0),[opacity,setOpacity]=useState(82),[latestObserved,setLatestObserved]=useState(0),[playing,setPlaying]=useState(false);
 const[showRadar,setShowRadar]=useState(true),[highResolution,setHighResolution]=useState(false),[showSatellite,setShowSatellite]=useState(false),[showLightning,setShowLightning]=useState(false),[satelliteFallback,setSatelliteFallback]=useState(false);
 const[basemap,setBasemap]=useState<BasemapId>(()=>(localStorage.getItem('mid:composite-basemap') as BasemapId)||'positron');
 const[pxMeta,setPxMeta]=useState<Px250Meta|null>(null),[pxLoading,setPxLoading]=useState(false),[pxStatus,setPxStatus]=useState<PxStatus>('idle'),[pxMessage,setPxMessage]=useState('');
 const[operaPoints,setOperaPoints]=useState<OperaGridPoint[]>([]),[operaError,setOperaError]=useState(''),[lightningPoints,setLightningPoints]=useState<LightningPoint[]>([]),[lightningObserved,setLightningObserved]=useState(''),[lightningError,setLightningError]=useState('');
 const dwdLightning=lat>=47&&lat<=55.5&&lon>=5&&lon<=16;

 useEffect(()=>{localStorage.setItem('mid:composite-basemap',basemap)},[basemap]);
 useEffect(()=>{let alive=true;setPlaying(false);setHost('');
  if(source==='dwd'||source==='opera'){
   const supplied=(Array.isArray(analysis?.timeline)?analysis?.timeline:[]).map(value=>Math.floor(new Date(value).getTime()/1000)).filter(Number.isFinite).sort((a,b)=>a-b),observedAt=analysis?.observedAt?Math.floor(new Date(analysis.observedAt).getTime()/1000):0,anchor=observedAt||Math.floor(Date.now()/300000)*300;
   const timeline=source==='dwd'?(supplied.length>1?supplied:Array.from({length:37},(_,i)=>anchor+(i-12)*300)):[anchor],items=[...new Set(timeline)].sort((a,b)=>a-b).map(time=>({time,future:source==='dwd'&&time>anchor}));
   setFrames(items);setIndex(Math.max(0,items.reduce((best,item,i)=>item.time<=anchor?i:best,0)));setLatestObserved(anchor);return()=>{alive=false}
  }
  if(source==='rainviewer'){
   fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error(`RainViewer HTTP ${response.status}`);return response.json()}).then((data:RadarResponse)=>{if(!alive)return;const past=(data.radar?.past??[]).slice(-12),last=past.at(-1)?.time??0,nowcast=(data.radar?.nowcast??[]).filter(item=>item.time<=last+3600).map(item=>({...item,future:true})),items=[...past,...nowcast];setHost(data.host);setFrames(items);setLatestObserved(last);setIndex(Math.max(0,past.length-1))}).catch(()=>{if(alive){setFrames([]);setHost('')}});return()=>{alive=false}
  }
  setFrames([]);setIndex(0);setLatestObserved(0);return()=>{alive=false}
 },[lat,lon,source,analysis?.observedAt,analysis?.timeline?.join('|')]);
 useEffect(()=>{if(source!=='opera'){setOperaPoints([]);setOperaError('');return}const controller=new AbortController(),load=()=>loadOperaGrid(lat,lon,controller.signal).then(data=>{setOperaPoints(data.points??[]);setOperaError('')}).catch(error=>{if(!controller.signal.aborted){setOperaPoints([]);setOperaError(error instanceof Error?error.message:String(error))}});void load();const timer=window.setInterval(load,300000);return()=>{controller.abort();window.clearInterval(timer)}},[lat,lon,source]);
 useEffect(()=>{if(!showLightning||!dwdLightning){setLightningPoints([]);setLightningObserved('');setLightningError('');return}const controller=new AbortController(),load=()=>loadLightningPoints(lat,lon,controller.signal).then(data=>{setLightningPoints(data.points??[]);setLightningObserved(data.observedAt??'');setLightningError('')}).catch(error=>{if(!controller.signal.aborted){setLightningPoints([]);setLightningError(error instanceof Error?error.message:String(error))}});void load();const timer=window.setInterval(load,120000);return()=>{controller.abort();window.clearInterval(timer)}},[lat,lon,showLightning,dwdLightning]);
 useEffect(()=>{let alive=true;setHighResolution(false);setPxStatus('idle');setPxMessage('');const load=()=>{setPxLoading(true);loadPx250Metadata(lat,lon).then(data=>{if(alive)setPxMeta(data)}).catch(error=>{if(alive)setPxMeta({available:false,nativeResolutionM:250,reason:error instanceof Error?error.message:String(error)})}).finally(()=>{if(alive)setPxLoading(false)})};void load();const timer=window.setInterval(load,300000);return()=>{alive=false;window.clearInterval(timer)}},[lat,lon]);
 useEffect(()=>{setSatelliteFallback(false)},[isDay,lat,lon]);
 useEffect(()=>{if(!playing||frames.length<2||highResolution||!showRadar||source!=='dwd'&&source!=='rainviewer')return;const timer=window.setInterval(()=>setIndex(current=>current>=frames.length-1?0:current+1),850);return()=>window.clearInterval(timer)},[playing,frames.length,highResolution,showRadar,source]);

 const onPxStatus=useCallback((status:PxStatus,message='')=>{setPxStatus(status);setPxMessage(message)},[]),frame=frames[index],future=!!frame&&frame.time>latestObserved,minutesAhead=future?Math.max(0,Math.round((frame.time-latestObserved)/60)):0,dwdLayer=analysis?.source==='dwd'&&analysis.radarLayer?analysis.radarLayer:'dwd:Niederschlagsradar';
 const rainViewerUrl=frame?.path&&host?`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`:'',dwdTime=frame?new Date(frame.time*1000).toISOString():'',hasFuture=frames.some(item=>item.time>latestObserved),canAnimate=showRadar&&!highResolution&&frames.length>1&&(source==='dwd'||source==='rainviewer');
 const satelliteDay=isDay&&!satelliteFallback,satelliteLayer=satelliteDay?'mtg_fd:vis06_hrfi':'mtg_fd:ir105_hrfi',satelliteName=satelliteDay?'HRV/HRFI VIS 0,6':'IR 10,5',vectorLightning=dwdLightning&&lightningPoints.length>0,lightningName=vectorLightning?'DWD-Blitzpunkte':dwdLightning?'DWD-Blitzdichte 1 km':'MTG-LI AFA 2 km';
 const displayTimestamp=highResolution&&pxMeta?.observedAt?new Date(pxMeta.observedAt).getTime():source==='opera'&&analysis?.observedAt?new Date(analysis.observedAt).getTime():frame?frame.time*1000:0,currentBasemap=BASEMAPS[basemap]??BASEMAPS.positron;
 const step=(amount:number)=>{setPlaying(false);setIndex(current=>Math.max(0,Math.min(frames.length-1,current+amount)))},togglePlay=()=>{if(!canAnimate)return;if(!playing&&index>=frames.length-1)setIndex(0);setPlaying(value=>!value)},toggleRadar=()=>{setShowRadar(value=>{if(value){setHighResolution(false);setPlaying(false)}return!value})},toggleHighRes=()=>{if(!pxMeta?.available)return;setShowRadar(true);setPlaying(false);setHighResolution(value=>!value)};
 const pxDetail=pxLoading?'Prüfung …':pxMeta?.available?`${pxMeta.siteName??pxMeta.site?.toUpperCase()} · ${pxMeta.distanceKm?.toFixed(0)} km`:'nicht verfügbar',radarDetail=source==='dwd'?'DWD-RV':source==='opera'?'EUMETNET OPERA':source==='rainviewer'?'RainViewer':'nicht verfügbar';
 const sourceText=useMemo(()=>showRadar?(highResolution?'DWD-PX250 über den MID-Worker; native Rasterweite 250 m, aktueller Einzelstand':source==='dwd'?'DWD-RV-Beobachtung und 0–2-h-Nowcast':source==='opera'?'EUMETNET OPERA/ORD RATE als europäischer Erst-Fallback; Kartenansicht als 5×5-Punktraster':source==='rainviewer'?'RainViewer erst nach nicht verfügbarem DWD- und OPERA-Abruf':'keine verwertbare Radarkarte'):'Radar ausgeblendet',[showRadar,highResolution,source]);

 return <section className="card composite-card"><Title eye="Radar · Satellit · Blitze" title="Kompositbild"/>
  <div className="composite-layer-switches" aria-label="Komposit-Layer">
   <LayerSwitch active={showRadar&&!highResolution} title="Standard-Niederschlagsradar ein- oder ausblenden" onClick={toggleRadar} icon={<Droplets size={18}/>} label="Niederschlag" detail={radarDetail}/>
   <LayerSwitch active={highResolution} disabled={pxLoading||!pxMeta?.available} title={pxMeta?.reason||'DWD-PX250-Reflektivität mit 250 m Rasterweite über den MID-Worker'} onClick={toggleHighRes} icon={<RadioTower size={18}/>} label="Radar 250 m" detail={pxDetail}/>
   <LayerSwitch active={showSatellite} title={`${isDay?'Hochaufgelöster sichtbarer MTG-FCI-Kanal':'Hochaufgelöster infraroter MTG-FCI-Kanal'} ein- oder ausblenden`} onClick={()=>setShowSatellite(value=>!value)} icon={isDay?<CloudSun size={18}/>:<Satellite size={18}/>} label={`Satellit ${isDay?'HRV':'IR'}`} detail={satelliteFallback?'IR-Fallback':satelliteName}/>
   <LayerSwitch active={showLightning} title="Echtzeit-Blitzaktivität ein- oder ausblenden" onClick={()=>setShowLightning(value=>!value)} icon={<Zap size={18}/>} label="Echtzeitblitze" detail={vectorLightning?'Kreise · zeitcodiert':dwdLightning?'DWD-Raster-Fallback':'MTG-LI · 2 km'}/>
  </div>
  <div className="radarmap">
   <div className="composite-basemap-control"><Layers3 size={14}/><label><span>Kartenbasis</span><select value={basemap} onChange={event=>setBasemap(event.target.value as BasemapId)}>{(Object.entries(BASEMAPS) as [BasemapId,(typeof BASEMAPS)[BasemapId]][]).map(([id,item])=><option key={id} value={id}>{item.label} · {item.detail}</option>)}</select></label></div>
   <MapContainer center={[lat,lon]} zoom={7} className="leafletmap" scrollWheelZoom={false}><MoveMap lat={lat} lon={lon}/><TileLayer key={basemap} attribution={currentBasemap.attribution} url={currentBasemap.url} zIndex={100}/>
    {showSatellite&&<WMSTileLayer key={`${satelliteLayer}:${lat.toFixed(2)}:${lon.toFixed(2)}`} url="https://view.eumetsat.int/geoserver/wms" opacity={0.84} zIndex={220} eventHandlers={{tileerror:()=>{if(satelliteDay)setSatelliteFallback(true)}}} params={({layers:satelliteLayer,styles:'',format:'image/png',transparent:false,version:'1.3.0'} as any)} attribution="Satellit &copy; EUMETSAT"/>}
    {showRadar&&!highResolution&&source==='dwd'&&frame&&<WMSTileLayer key={`${dwdLayer}:${dwdTime}`} url="https://maps.dwd.de/geoserver/wms" opacity={opacity/100} zIndex={360} params={({layers:dwdLayer,styles:'',format:'image/png',transparent:true,version:'1.3.0',time:dwdTime} as any)} attribution="Radar und Nowcast &copy; DWD"/>}
    {showRadar&&!highResolution&&source==='opera'&&operaPoints.map((point,pointIndex)=><CircleMarker key={`${point.lat}:${point.lon}:${point.observedAt??pointIndex}`} center={[point.lat,point.lon]} radius={Math.max(5,Math.min(17,5+Math.sqrt(Math.max(0,point.rate))*2.2))} pathOptions={{color:rateColour(point.rate),weight:1,fillColor:rateColour(point.rate),fillOpacity:Math.max(.2,opacity/115)}}><Popup><strong>EUMETNET OPERA</strong><br/>{point.rate.toLocaleString('de-DE',{maximumFractionDigits:1})} mm/h{point.observedAt&&<><br/>{formatInZone(Date.parse(point.observedAt),timezone,{hour:'2-digit',minute:'2-digit'})}</>}</Popup></CircleMarker>)}
    {showRadar&&!highResolution&&source==='rainviewer'&&rainViewerUrl&&<TileLayer attribution="Radar &copy; RainViewer" url={rainViewerUrl} opacity={opacity/100} zIndex={360}/>} 
    {showRadar&&highResolution&&pxMeta?.available&&<Suspense fallback={null}><LazyPx250Overlay meta={pxMeta} opacity={opacity/100} onStatus={onPxStatus}/></Suspense>}
    {showLightning&&vectorLightning&&lightningPoints.map(point=>{const style=lightningStyle(point,lightningObserved);return <CircleMarker key={point.id} center={[point.lat,point.lon]} radius={style.radius} pathOptions={{color:style.color,weight:1.2,opacity:style.opacity,fillColor:style.color,fillOpacity:style.opacity*.72}}><Popup><strong>DWD-Blitzaktivität</strong><br/>{formatAge(style.age)}{point.observedAt&&<><br/>{formatInZone(Date.parse(point.observedAt),timezone,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</>}</Popup></CircleMarker>})}
    {showLightning&&dwdLightning&&!vectorLightning&&<WMSTileLayer url="https://maps.dwd.de/geoserver/wms" opacity={0.98} zIndex={470} params={({layers:'dwd:Blitzdichte',styles:'',format:'image/png',transparent:true,version:'1.3.0'} as any)} attribution="Blitzdichte &copy; DWD"/>}
    {showLightning&&!dwdLightning&&<WMSTileLayer url="https://view.eumetsat.int/geoserver/wms" opacity={0.96} zIndex={470} params={({layers:'mtg_fd:li_afa',styles:'',format:'image/png',transparent:true,version:'1.3.0'} as any)} attribution="Lightning Imager &copy; EUMETSAT"/>}
    <CircleMarker center={[lat,lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#1f8cff',fillOpacity:0.95}}><Popup>Gewählter Standort</Popup></CircleMarker>
   </MapContainer>
   <CompositeLegend source={source} showRadar={showRadar} highResolution={highResolution} showSatellite={showSatellite} satelliteName={satelliteName} showLightning={showLightning} vectorLightning={vectorLightning} future={future} minutesAhead={minutesAhead} pxSite={highResolution?pxMeta?.siteName:undefined}/>
  </div>
  <div className="radarcontrols">
   <div className="radar-playback-buttons"><button className="secondary" disabled={!canAnimate||index<=0} onClick={()=>step(-1)} title="Vorheriger Radarzeitschritt" aria-label="Vorheriger Radarzeitschritt"><SkipBack size={17}/></button><button className="secondary play" disabled={!canAnimate} onClick={togglePlay} title={playing?'Animation pausieren':'Radarfilm abspielen'} aria-label={playing?'Animation pausieren':'Radarfilm abspielen'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="secondary" disabled={!canAnimate||index>=frames.length-1} onClick={()=>step(1)} title="Nächster Radarzeitschritt" aria-label="Nächster Radarzeitschritt"><SkipForward size={17}/></button></div>
   <div className="range timeline"><small>{highResolution?'PX250 ist ein aktueller Einzelstand':source==='opera'?'OPERA-Kartenraster: aktueller Einzelstand':`Zeitschritt ${frames.length?`${index+1}/${frames.length}`:''}${future?` · +${minutesAhead} min`:''}`}</small><input type="range" min={0} max={Math.max(0,frames.length-1)} value={index} disabled={!canAnimate} onChange={event=>{setPlaying(false);setIndex(Number(event.target.value))}}/></div>
   <time className={future&&!highResolution?'future':''}>{displayTimestamp?formatInZone(displayTimestamp,timezone,{hour:'2-digit',minute:'2-digit'}):'–:–'}{future&&!highResolution?' Prognose':''}</time>
   <div className="range opacity"><small>Niederschlags-Deckkraft</small><input type="range" min={25} max={100} value={opacity} disabled={!showRadar} onChange={event=>setOpacity(Number(event.target.value))}/></div>
  </div>
  {highResolution&&pxStatus==='loading'&&<small className="source composite-source-note"><RadioTower size={12}/>DWD-PX250-HDF5-Daten werden über den Worker geladen und lokal gerendert …</small>}
  {highResolution&&pxStatus==='error'&&<small className="source warning">PX250 konnte nicht dargestellt werden: {pxMessage}</small>}
  {showRadar&&source==='opera'&&operaError&&<small className="source warning">OPERA-Kartenraster konnte nicht geladen werden: {operaError}</small>}
  {showLightning&&dwdLightning&&lightningError&&<small className="source warning">Zeitcodierte Blitzpunkte sind vorübergehend nicht abrufbar; das DWD-Blitzdichte-Raster wird verwendet.</small>}
  {!highResolution&&!canAnimate&&showRadar&&source==='dwd'&&<small className="source warning">Aktuell ist nur ein Radarzeitschritt abrufbar; die Animation startet automatisch, sobald weitere Frames verfügbar sind.</small>}
  {!highResolution&&!hasFuture&&source==='rainviewer'&&showRadar&&<small className="source warning">RainViewer stellt keine öffentlichen Zukunftsframes bereit; die Standortprognose ist eine gekennzeichnete Bewegungsnäherung aus der Radarhistorie.</small>}
  <small className="source">Kompositquellen: {sourceText}{showSatellite?` · EUMETSAT MTG-FCI ${satelliteName}`:''}{showLightning?` · ${lightningName}`:''}. Kartenbasis: {currentBasemap.label}. Blitz- und OPERA-Punktraster dienen der Lageübersicht und sind keine metergenaue Einschlags- beziehungsweise Zellgrenzenkarte. Keine amtliche Warnung.</small>
 </section>
}
