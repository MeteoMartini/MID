import {lazy,Suspense,useCallback,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {CloudSun,Droplets,Layers3,LocateFixed,Pause,Play,RadioTower,Satellite,SkipBack,SkipForward,Zap} from 'lucide-react';
import {CircleMarker,MapContainer,Popup,TileLayer,WMSTileLayer,useMap} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {RadarNowcast} from './weather';
import {loadPx250Metadata,type Px250Meta} from './Px250Source';
import {
 compositeWmsProxy,
 loadCompositeTimes,
 loadLightningPoints,
 loadOperaGrid,
 type CompositeProduct,
 type CompositeProductTimes,
 type CompositeSource,
 type LightningPoint,
 type LightningPointResponse,
 type OperaGridFrame,
 type OperaGridPoint,
 type ProductTime,
 type WmsProvider
} from './CompositeData';

const LazyPx250Overlay=lazy(()=>import('./Px250Overlay'));
type RadarFrame={time:number;path?:string;future?:boolean};
type RadarResponse={host:string;radar:{past:RadarFrame[];nowcast?:RadarFrame[]}};
type PxStatus='idle'|'loading'|'ready'|'error';
type BasemapId='osm'|'positron'|'dark';
type CompositeSettings={basemap:BasemapId;showRadar:boolean;highResolution:boolean;showSatellite:boolean;showLightning:boolean;radarOpacity:number;satelliteOpacity:number;lightningOpacity:number};
const SETTINGS_KEY='mid:composite-settings:v2';
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
const LIGHTNING_AGES=[{label:'0–20 min',color:'#ffffff'},{label:'20–40',color:'#fff36b'},{label:'40–60',color:'#ffad16'},{label:'60–80',color:'#ef432d'},{label:'80–100',color:'#b71c1c'},{label:'100–120',color:'#650b0d'}];
const EMPTY_PRODUCT_TIMES:CompositeProductTimes={satelliteDay:[],satelliteIr:[],mtgLightning:[],dwdLightning:[],dwdRadar:[]};

function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
function epochMs(value:ProductTime|undefined|null){
 if(typeof value==='number')return Number.isFinite(value)?(Math.abs(value)<1e12?value*1000:value):NaN;
 const text=String(value??'').trim();
 if(!text)return NaN;
 if(/^-?\d+(?:\.\d+)?$/.test(text)){const number=Number(text);return Number.isFinite(number)?(Math.abs(number)<1e12?number*1000:number):NaN}
 return Date.parse(text);
}
function normalisedIsoTimes(values:ProductTime[]|undefined,referenceMs=Date.now(),historyMinutes=65,futureMinutes=125){
 const minimum=referenceMs-historyMinutes*60000,maximum=referenceMs+futureMinutes*60000;
 return[...new Set((values??[]).map(epochMs).filter(value=>Number.isFinite(value)&&value>=minimum&&value<=maximum).map(value=>new Date(value).toISOString()))].sort((a,b)=>Date.parse(a)-Date.parse(b));
}
function toFrames(values:ProductTime[]|undefined,referenceSeconds:number):RadarFrame[]{
 return normalisedIsoTimes(values,referenceSeconds*1000).map(value=>{const time=Math.floor(Date.parse(value)/1000);return{time,future:time>referenceSeconds+90}});
}
function storedSettings():CompositeSettings{
 const defaults:CompositeSettings={basemap:'positron',showRadar:true,highResolution:false,showSatellite:false,showLightning:false,radarOpacity:76,satelliteOpacity:58,lightningOpacity:92};
 try{
  const raw=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}') as Partial<CompositeSettings>,basemap=raw.basemap&&BASEMAPS[raw.basemap]?raw.basemap:defaults.basemap,showRadar=typeof raw.showRadar==='boolean'?raw.showRadar:defaults.showRadar,highResolution=showRadar&&raw.highResolution===true;
  return{basemap,showRadar,highResolution,showSatellite:typeof raw.showSatellite==='boolean'?raw.showSatellite:defaults.showSatellite,showLightning:typeof raw.showLightning==='boolean'?raw.showLightning:defaults.showLightning,radarOpacity:clamp(Number(raw.radarOpacity)||defaults.radarOpacity,15,100),satelliteOpacity:clamp(Number(raw.satelliteOpacity)||defaults.satelliteOpacity,15,100),lightningOpacity:clamp(Number(raw.lightningOpacity)||defaults.lightningOpacity,20,100)};
 }catch{return defaults}
}
function formatInZone(value:number,timeZone:string|undefined,options:Intl.DateTimeFormatOptions){try{return new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(new Date(value))}catch{return new Intl.DateTimeFormat('de-DE',options).format(new Date(value))}}
function relativeLabel(targetSeconds:number,referenceSeconds:number){const minutes=Math.round((targetSeconds-referenceSeconds)/60);if(Math.abs(minutes)<3)return'Jetzt';const sign=minutes<0?'−':'+';const absolute=Math.abs(minutes),hours=Math.floor(absolute/60),rest=absolute%60;if(hours&&rest)return`${sign}${hours} h ${rest} min`;if(hours)return`${sign}${hours} h`;return`${sign}${absolute} min`}
function sourceForLocation(analysis:RadarNowcast|null|undefined,lat:number,lon:number):CompositeSource{if(analysis?.source&&analysis.source!=='model'&&analysis.coverage!==false)return analysis.source;const expected=String(analysis?.expectedSource||'').toLowerCase();if(expected.includes('dwd')||(lat>=46.5&&lat<=56&&lon>=4.5&&lon<=16.5))return'dwd';if(expected.includes('opera')||(lat>=31.5&&lat<=72.5&&lon>=-30.5&&lon<=50.5))return'opera';return'rainviewer'}
function Title({eye,title}:{eye:string;title:string}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div></header>}
function MoveMap({lat,lon,locateRequest}:{lat:number;lon:number;locateRequest:number}){const map=useMap();useEffect(()=>{map.setView([lat,lon],7,{animate:true})},[lat,lon,map]);useEffect(()=>{if(locateRequest>0)map.flyTo([lat,lon],map.getZoom(),{animate:true,duration:.65})},[locateRequest,lat,lon,map]);return null}
function LayerSwitch({active,disabled=false,title,onClick,icon,label,detail}:{active:boolean;disabled?:boolean;title:string;onClick:()=>void;icon:ReactNode;label:string;detail?:string}){return <button type="button" className={`composite-switch${active?' active':''}`} disabled={disabled} aria-pressed={active} title={title} onClick={onClick}>{icon}<span><b>{label}</b>{detail&&<small>{detail}</small>}</span></button>}
function rateColour(rate:number){if(rate>=50)return'#b83fc8';if(rate>=20)return'#e34b4b';if(rate>=10)return'#f59b3d';if(rate>=5)return'#f0d447';if(rate>=2.5)return'#43c879';if(rate>=1)return'#2f91e3';if(rate>=.5)return'#72c9ff';return'#d9f3ff'}
function nearestFrame<T extends {time:number}>(frames:T[],targetSeconds:number,maxDifferenceSeconds=12*60){let best:T|undefined,bestDelta=Infinity;for(const frame of frames){const delta=Math.abs(frame.time-targetSeconds);if(delta<bestDelta){best=frame;bestDelta=delta}}return bestDelta<=maxDifferenceSeconds?best:undefined}
function nearestProductIso(times:string[],targetMs:number,maxDifferenceMs=18*60000){let best='',delta=Infinity;for(const value of times){const stamp=Date.parse(value),difference=Math.abs(stamp-targetMs);if(Number.isFinite(stamp)&&difference<delta){best=value;delta=difference}}return delta<=maxDifferenceMs?best:''}
function compactFrames(frames:RadarFrame[],referenceSeconds:number){
 const min=referenceSeconds-60*60,max=referenceSeconds+120*60;
 const usable=[...new Map(frames.filter(frame=>Number.isFinite(frame.time)&&frame.time>=min&&frame.time<=max).sort((a,b)=>a.time-b.time).map(frame=>[frame.time,frame])).values()];
 if(usable.length<=28)return usable;
 const observed=usable.filter(frame=>frame.time<=referenceSeconds+90).slice(-13),allFuture=usable.filter(frame=>frame.time>referenceSeconds+90),future=allFuture.filter((_,index)=>index===0||index%2===1||index===allFuture.length-1);
 return[...new Map([...observed,...future].map(frame=>[frame.time,frame])).values()].sort((a,b)=>a.time-b.time);
}
function lightningStyle(point:LightningPoint,target:number,fallbackTime?:string){const stamp=Date.parse(point.observedAt||fallbackTime||''),age=Number.isFinite(stamp)?Math.max(0,(target-stamp)/60000):0,color=age<=20?'#ffffff':age<=40?'#fff36b':age<=60?'#ffad16':age<=80?'#ef432d':age<=100?'#b71c1c':'#650b0d',ageOpacity=clamp(1-age/150,.18,1),strength=clamp(Math.abs(Number(point.intensity))||Number(point.count)||1,1,80),radius=3.8+Math.log2(strength+1)*.82,weight=clamp(1.65+Math.log10(strength+1)*.5,1.7,2.8);return{age,color,opacity:ageOpacity,radius,weight,newest:age<=2}}
function formatAge(age:number){return age<1?'gerade eben':`${Math.round(age)} min alt`}
function RadarScale({source,highResolution}:{source:CompositeSource;highResolution:boolean}){if((source==='opera'||source==='dwd')&&!highResolution)return <div className="compact-scale rate"><span>0,1</span><i>{DWD_RATE_LEGEND.map(item=><b key={item.value} style={{background:item.color}}/>)}</i><span>50＋ mm/h</span></div>;return <div className="compact-scale dbz"><span>10</span><i>{RAINVIEWER_LEGEND.map(item=><b key={item.dbz} style={{background:item.color}}/>)}</i><span>60＋ dBZ</span></div>}
function CompositeLegend({source,showRadar,highResolution,showSatellite,satelliteName,showLightning,lightningProvider,vectorLightning,relative,pxSite}:{source:CompositeSource;showRadar:boolean;highResolution:boolean;showSatellite:boolean;satelliteName:string;showLightning:boolean;lightningProvider:string;vectorLightning:boolean;relative:string;pxSite?:string}){const provider=highResolution?(pxSite?.includes('HX')?'DWD HX':'DWD 250 m'):source==='dwd'?'DWD-RV':source==='opera'?'EUMETNET OPERA':source==='rainviewer'?'RainViewer':'kein Radar';return <div className="radarlegend compact"><div className="radarlegend-head"><strong>{relative}</strong><span>{showRadar?provider:'Komposit'}</span></div><div className="legend-active-chips">{showRadar&&<em>Niederschlag{pxSite?` · ${pxSite}`:''}</em>}{showSatellite&&<em>{satelliteName}</em>}{showLightning&&<em>{lightningProvider}</em>}{!showRadar&&!showSatellite&&!showLightning&&<em>nur Kartenbasis</em>}</div>{showRadar&&(highResolution||source!=='model')&&<RadarScale source={source} highResolution={highResolution}/>} {showLightning&&vectorLightning&&<div className="lightning-age-legend ring-legend">{LIGHTNING_AGES.map(item=><span key={item.label}><i style={{borderColor:item.color}}/>{item.label}</span>)}</div>}</div>}
function wmsUrl(provider:WmsProvider){return compositeWmsProxy(provider)||(provider==='dwd'?'https://maps.dwd.de/geoserver/wms':'https://view.eumetsat.int/geoserver/wms')}

export default function RadarPanel({lat,lon,timezone,analysis,isDay=true}:{lat:number;lon:number;timezone?:string;analysis?:RadarNowcast|null;isDay?:boolean}){
 const initial=useMemo(storedSettings,[]),source=sourceForLocation(analysis,lat,lon);
 const[nowMs,setNowMs]=useState(Date.now()),[clockOffsetMs,setClockOffsetMs]=useState(0),[radarFrames,setRadarFrames]=useState<RadarFrame[]>([]),[host,setHost]=useState(''),[index,setIndex]=useState(0),[playing,setPlaying]=useState(false),[locateRequest,setLocateRequest]=useState(0);
 const[showRadar,setShowRadar]=useState(initial.showRadar),[highResolution,setHighResolution]=useState(initial.highResolution),[showSatellite,setShowSatellite]=useState(initial.showSatellite),[showLightning,setShowLightning]=useState(initial.showLightning),[satelliteFallback,setSatelliteFallback]=useState(false);
 const[radarOpacity,setRadarOpacity]=useState(initial.radarOpacity),[satelliteOpacity,setSatelliteOpacity]=useState(initial.satelliteOpacity),[lightningOpacity,setLightningOpacity]=useState(initial.lightningOpacity),[basemap,setBasemap]=useState<BasemapId>(initial.basemap);
 const[pxMeta,setPxMeta]=useState<Px250Meta|null>(null),[pxLoading,setPxLoading]=useState(false),[pxStatus,setPxStatus]=useState<PxStatus>('idle'),[pxMessage,setPxMessage]=useState('');
 const[operaFrames,setOperaFrames]=useState<OperaGridFrame[]>([]),[operaError,setOperaError]=useState(''),[lightningData,setLightningData]=useState<LightningPointResponse>({points:[]}),[lightningError,setLightningError]=useState(''),[compositeError,setCompositeError]=useState(''),[productTimes,setProductTimes]=useState<CompositeProductTimes>(EMPTY_PRODUCT_TIMES);
 const[radarTileError,setRadarTileError]=useState(''),[satelliteTileError,setSatelliteTileError]=useState('');
 const previousTimeline=useRef<number>(0),dwdLightning=lat>=47&&lat<=55.5&&lon>=5&&lon<=16,mtgLightning=lat>=-60&&lat<=72&&lon>=-75&&lon<=80;
 const referenceMs=nowMs+clockOffsetMs,referenceSeconds=Math.floor(referenceMs/1000);

 useEffect(()=>{const timer=window.setInterval(()=>setNowMs(Date.now()),30000);return()=>window.clearInterval(timer)},[]);
 useEffect(()=>{try{localStorage.setItem(SETTINGS_KEY,JSON.stringify({basemap,showRadar,highResolution,showSatellite,showLightning,radarOpacity,satelliteOpacity,lightningOpacity} satisfies CompositeSettings))}catch{}},[basemap,showRadar,highResolution,showSatellite,showLightning,radarOpacity,satelliteOpacity,lightningOpacity]);
 useEffect(()=>{
  let alive=true;setPlaying(false);setHost('');setRadarTileError('');
  if(source==='dwd'){
   const supplied=(Array.isArray(analysis?.timeline)?analysis.timeline:[]).map(epochMs).filter(Number.isFinite).map(value=>Math.floor(value/1000)).sort((a,b)=>a-b),observed=epochMs(analysis?.observedAt),single=Number.isFinite(observed)?[Math.floor(observed/1000)]:[];
   setRadarFrames((supplied.length?supplied:single).map(time=>({time,future:time>Math.floor(Date.now()/1000)+90})));
   return()=>{alive=false};
  }
  if(source==='rainviewer'){
   fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error(`RainViewer HTTP ${response.status}`);return response.json()}).then((data:RadarResponse)=>{if(!alive)return;const past=data.radar?.past??[],nowcast=(data.radar?.nowcast??[]).map(item=>({...item,future:true}));setHost(data.host);setRadarFrames([...past,...nowcast])}).catch(()=>{if(alive){setRadarFrames([]);setHost('')}});
   return()=>{alive=false};
  }
  setRadarFrames([]);return()=>{alive=false};
 },[lat,lon,source,analysis?.observedAt,analysis?.timeline?.join('|')]);
 useEffect(()=>{if(source!=='opera'){setOperaFrames([]);setOperaError('');return}const controller=new AbortController(),load=()=>loadOperaGrid(lat,lon,controller.signal).then(data=>{setOperaFrames(data.frames?.length?data.frames:[{time:data.observedAt||new Date().toISOString(),points:data.points??[]}]);setOperaError('')}).catch(error=>{if(!controller.signal.aborted){setOperaFrames([]);setOperaError(error instanceof Error?error.message:String(error))}});void load();const timer=window.setInterval(load,300000);return()=>{controller.abort();window.clearInterval(timer)}},[lat,lon,source]);
 useEffect(()=>{if(!showLightning){setLightningData({points:[]});setLightningError('');return}const controller=new AbortController(),load=()=>loadLightningPoints(lat,lon,controller.signal).then(data=>{setLightningData(data);setLightningError('')}).catch(error=>{if(!controller.signal.aborted){setLightningData({points:[],fallback:mtgLightning?'mtg-li':'none'});setLightningError(error instanceof Error?error.message:String(error))}});void load();const timer=window.setInterval(load,120000);return()=>{controller.abort();window.clearInterval(timer)}},[lat,lon,showLightning,mtgLightning]);
 useEffect(()=>{
  const needed=showSatellite||showLightning||(showRadar&&!highResolution&&source==='dwd');
  if(!needed){setProductTimes(EMPTY_PRODUCT_TIMES);setCompositeError('');return}
  const controller=new AbortController(),load=()=>loadCompositeTimes(lat,lon,controller.signal).then(data=>{setProductTimes(data);const server=epochMs(data.serverTime);setClockOffsetMs(Number.isFinite(server)&&Math.abs(server-Date.now())<=10*60000?server-Date.now():0);setCompositeError(data.errors?.join(' | ')||'')}).catch(error=>{if(!controller.signal.aborted){setProductTimes(EMPTY_PRODUCT_TIMES);setCompositeError(error instanceof Error?error.message:String(error))}});void load();const timer=window.setInterval(load,300000);return()=>{controller.abort();window.clearInterval(timer)};
 },[lat,lon,showSatellite,showLightning,showRadar,highResolution,source]);
 useEffect(()=>{let alive=true;setPxStatus('idle');setPxMessage('');const load=()=>{setPxLoading(true);loadPx250Metadata(lat,lon).then(data=>{if(!alive)return;const observed=epochMs(data.observedAt),fresh=data.available&&Number.isFinite(observed)&&observed>=Date.now()-40*60000&&observed<=Date.now()+10*60000,normalised=fresh?data:data.available?{...data,available:false,stale:true,reason:`Der gemeldete PX250-Stand ist nicht aktuell (${data.observedAt||'Zeit unbekannt'}) und wird nicht als Livebild verwendet.`}:data;setPxMeta(normalised);if(!normalised.available)setHighResolution(false)}).catch(error=>{if(alive){setPxMeta({available:false,nativeResolutionM:250,reason:error instanceof Error?error.message:String(error)});setHighResolution(false)}}).finally(()=>{if(alive)setPxLoading(false)})};void load();const timer=window.setInterval(load,180000);return()=>{alive=false;window.clearInterval(timer)}},[lat,lon]);
 useEffect(()=>{setSatelliteFallback(false);setSatelliteTileError('')},[isDay,lat,lon]);

 const dayTimes=normalisedIsoTimes(productTimes.satelliteDay,referenceMs),irTimes=normalisedIsoTimes(productTimes.satelliteIr,referenceMs);
 const legacyDay:CompositeProduct|undefined=dayTimes.length?{provider:'eumetsat',layer:'mtg_fd:vis06_hrfi',label:'MTG FCI VIS 0,6 HRFI',resolutionKm:.5,times:dayTimes}:undefined;
 const legacyIr:CompositeProduct|undefined=irTimes.length?{provider:'eumetsat',layer:'mtg_fd:ir105_hrfi',label:'MTG FCI IR 10,5 HRFI',resolutionKm:1,times:irTimes}:undefined;
 const satelliteProduct:CompositeProduct|undefined=isDay&&!satelliteFallback?(productTimes.satelliteDayProduct||legacyDay):(productTimes.satelliteIrProduct||legacyIr);
 const satelliteAvailableTimes=normalisedIsoTimes(satelliteProduct?.times,referenceMs),satelliteLayer=satelliteProduct?.layer||'',satelliteProvider=satelliteProduct?.provider||'eumetsat',satelliteName=satelliteProduct?.label||(isDay&&!satelliteFallback?'Satellit Tag':'Satellit IR'),satelliteResolution=satelliteProduct?.resolutionKm?`${satelliteProduct.resolutionKm.toLocaleString('de-DE')} km`:'';
 const dwdProductTimeline=useMemo(()=>toFrames(productTimes.dwdRadar,referenceSeconds),[productTimes.dwdRadar,referenceSeconds]);
 const dwdTimeline=useMemo<RadarFrame[]>(()=>[...new Map<number,RadarFrame>([...radarFrames,...dwdProductTimeline].sort((a,b)=>a.time-b.time).map(frame=>[frame.time,frame])).values()],[radarFrames,dwdProductTimeline]);
 const operaTimeline=useMemo(()=>compactFrames(operaFrames.map(frame=>({time:Math.floor(Date.parse(frame.time)/1000),future:false})).filter(frame=>Number.isFinite(frame.time)),referenceSeconds),[operaFrames,referenceSeconds]);
 const satelliteTimeline=useMemo(()=>satelliteAvailableTimes.map(value=>{const time=Math.floor(Date.parse(value)/1000);return{time,future:time>referenceSeconds+90}}),[satelliteAvailableTimes.join('|'),referenceSeconds]);
 const lightningAvailableTimes=normalisedIsoTimes(dwdLightning?productTimes.dwdLightning:productTimes.mtgLightning,referenceMs);
 const pxObservedMs=pxMeta?.observedAt?epochMs(pxMeta.observedAt):NaN,pxFresh=Boolean(pxMeta?.available)&&Number.isFinite(pxObservedMs)&&pxObservedMs>=referenceMs-40*60000&&pxObservedMs<=referenceMs+10*60000;
 useEffect(()=>{if(highResolution&&!pxFresh){setHighResolution(false);setShowRadar(true)}},[highResolution,pxFresh]);
 const lightningTimeline=useMemo(()=>{const pointBins=(lightningData.points??[]).map(point=>Date.parse(point.observedAt||lightningData.observedAt||'')).filter(Number.isFinite).map(stamp=>Math.floor(stamp/300000)*300),raster=lightningAvailableTimes.map(value=>Math.floor(Date.parse(value)/1000)),values=[...new Set([...raster,...pointBins])].filter(Number.isFinite).sort((a,b)=>a-b);return values.map(time=>({time,future:false}))},[lightningAvailableTimes.join('|'),lightningData.points,lightningData.observedAt]);
 const frames=useMemo(()=>{
  let candidates:RadarFrame[]=[];
  // Ein animierbares Standardradar bestimmt die Zeitachse. PX250 ist dagegen
  // ein aktueller Einzelstand und darf insbesondere keine alte Satellitenachse
  // oder einen alten Archivzeitpunkt in den Kompositfilm hineinziehen.
  if(showRadar&&!highResolution){if(source==='dwd')candidates=dwdTimeline;else if(source==='rainviewer')candidates=radarFrames;else if(source==='opera')candidates=operaTimeline}
  const auxiliary=[...(showSatellite?satelliteTimeline:[]),...(showLightning?lightningTimeline:[])];
  if((!showRadar||highResolution)&&auxiliary.length)candidates=[...new Map(auxiliary.sort((a,b)=>a.time-b.time).map(frame=>[frame.time,frame])).values()];
  if(!candidates.length&&showRadar&&highResolution&&pxFresh)candidates=[{time:Math.floor(pxObservedMs/1000),future:false}];
  if(!candidates.length&&showSatellite&&satelliteProduct?.latestOnly)candidates=[{time:referenceSeconds,future:false}];
  return compactFrames(candidates,referenceSeconds);
 },[showRadar,highResolution,source,dwdTimeline,radarFrames,operaTimeline,showSatellite,showLightning,satelliteTimeline,lightningTimeline,referenceSeconds,pxFresh,pxObservedMs,satelliteProduct?.latestOnly]);
 useEffect(()=>{if(!frames.length){setIndex(0);return}const target=previousTimeline.current||referenceSeconds,indexForTarget=frames.reduce((best,frame,i)=>Math.abs(frame.time-target)<Math.abs(frames[best].time-target)?i:best,0);setIndex(clamp(indexForTarget,0,frames.length-1))},[frames.map(frame=>frame.time).join('|')]);
 const canAnimate=frames.length>1&&(showSatellite||showLightning||showRadar&&!highResolution);
 useEffect(()=>{if(!playing||!canAnimate)return;const timer=window.setInterval(()=>setIndex(current=>current>=frames.length-1?0:current+1),1050);return()=>window.clearInterval(timer)},[playing,canAnimate,frames.length]);

 const frame=frames[index],frameTime=frame?.time,validFrame=typeof frameTime==='number'&&Number.isFinite(frameTime)&&frameTime>=referenceSeconds-65*60&&frameTime<=referenceSeconds+125*60,targetSeconds=validFrame?frameTime:referenceSeconds,targetMs=targetSeconds*1000;previousTimeline.current=targetSeconds;
 const activeRadarFrames=source==='dwd'?dwdTimeline:radarFrames,radarFrame=nearestFrame(activeRadarFrames,targetSeconds,source==='rainviewer'?7*60:6*60),operaFrame=operaFrames.reduce<OperaGridFrame|undefined>((best,item)=>!best||Math.abs(Date.parse(item.time)-targetMs)<Math.abs(Date.parse(best.time)-targetMs)?item:best,undefined),operaPoints:OperaGridPoint[]=operaFrame&&Math.abs(Date.parse(operaFrame.time)-targetMs)<=9*60000?operaFrame.points:[];
 const future=targetSeconds>referenceSeconds+90,relative=relativeLabel(targetSeconds,referenceSeconds),dwdLayer=productTimes.dwdRadarLayer||analysis?.radarLayer||'dwd:Radar_rv_product_1x1km_ger',rainViewerUrl=radarFrame?.path&&host?`${host}${radarFrame.path}/256/{z}/{x}/{y}/2/1_1.png`:'',radarTimeIso=radarFrame?new Date(radarFrame.time*1000).toISOString():'';
 const satelliteTimeIso=satelliteAvailableTimes.length?nearestProductIso(satelliteAvailableTimes,targetMs):'',satelliteLatestOnly=Boolean(satelliteProduct?.latestOnly),showSatelliteAtTime=Boolean(satelliteProduct)&&(Boolean(satelliteTimeIso)||(satelliteLatestOnly&&Math.abs(targetSeconds-referenceSeconds)<=4*60)),satelliteLegendName=`${satelliteName}${showSatelliteAtTime?` · ${satelliteTimeIso?formatInZone(Date.parse(satelliteTimeIso),timezone,{hour:'2-digit',minute:'2-digit'}):'aktuell'}`:''}`,lightningTimeIso=lightningAvailableTimes.length?nearestProductIso(lightningAvailableTimes,targetMs):'',pointProvider=Boolean(lightningData.points?.length),licensedGlobal=Boolean(lightningData.commercial&&lightningData.provider),lightningProvider=lightningData.provider||(!dwdLightning&&mtgLightning?'EUMETSAT MTG-LI':'keine freie Punktquelle'),lightningResolution=lightningData.nativeResolutionKm?`${lightningData.nativeResolutionKm} km`:pointProvider?'Punktortung':dwdLightning?'1 km':mtgLightning?'2 km':'optional',lightningName=pointProvider?`${lightningProvider} · ${lightningResolution}`:licensedGlobal?`${lightningProvider} · keine Aktivität im aktuellen Zeitfenster`:dwdLightning?'DWD Blitzdichte 1 km':mtgLightning?'EUMETSAT MTG-LI AFA 2 km':'keine frei nutzbare Echtzeitquelle';
 const visibleLightning=(lightningData.points??[]).filter(point=>{const stamp=Date.parse(point.observedAt||lightningData.observedAt||'');if(!Number.isFinite(stamp))return Math.abs(targetMs-referenceMs)<8*60000;const age=(targetMs-stamp)/60000;return age>=-1&&age<=120}),vectorLightning=visibleLightning.length>0,showPxAtTime=showRadar&&highResolution&&pxFresh&&(!frames.length||Math.abs(targetMs-pxObservedMs)<=10*60000),currentBasemap=BASEMAPS[basemap]??BASEMAPS.positron;
 const timelineStart=frames.length?relativeLabel(frames[0].time,referenceSeconds):'Jetzt',timelineEnd=frames.length?relativeLabel(frames.at(-1)!.time,referenceSeconds):'Jetzt',timelineSpan=`${timelineStart} bis ${timelineEnd}`;
 const onPxStatus=useCallback((status:PxStatus,message='')=>{setPxStatus(status);setPxMessage(message)},[]),step=(amount:number)=>{setPlaying(false);setIndex(current=>clamp(current+amount,0,Math.max(0,frames.length-1)))},togglePlay=()=>{if(!canAnimate)return;if(!playing&&index>=frames.length-1)setIndex(0);setPlaying(value=>!value)},selectPrecipitation=(mode:'off'|'standard'|'px250')=>{setPlaying(false);setShowRadar(mode!=='off');setHighResolution(mode==='px250')},toggleRadar=()=>selectPrecipitation(showRadar&&!highResolution?'off':'standard'),toggleHighRes=()=>{if(!pxFresh)return;selectPrecipitation(showRadar&&highResolution?'off':'px250')};
 const pxDetail=pxLoading?'Prüfung …':pxFresh?`${pxMeta?.product==='hx'?'DWD HX · Deutschland':pxMeta?.siteName??pxMeta?.site?.toUpperCase()} · 250 m · ${formatInZone(pxObservedMs,timezone,{hour:'2-digit',minute:'2-digit'})}`:pxMeta?.stale?'Quelle veraltet':'nicht verfügbar',radarDetail=source==='dwd'?(dwdTimeline.length?'DWD · 1 km · −1/+2 h':'DWD · Zeiten werden geprüft'):source==='opera'?'OPERA · 2 km':source==='rainviewer'?'RainViewer · regional':'nicht verfügbar',satelliteDetail=satelliteProduct?`${satelliteResolution}${satelliteProduct.fallback?' · Fallback':''}`:'Quelle nicht verfügbar';
 const sourceText=useMemo(()=>showRadar?(highResolution?(pxMeta?.product==='hx'?'DWD HX über MID-Worker; nationales 250-m-Deutschlandkomposit, aktueller Einzelstand':'DWD PX250 über MID-Worker; 250-m-Standortradar, aktueller Einzelstand'):source==='dwd'?'DWD-RV; 1-km-Komposit mit Beobachtungen bis −1 h und Nowcast bis +2 h':source==='opera'?'EUMETNET OPERA/ORD; europäisches 2-km-Komposit, soweit verfügbar historisch':source==='rainviewer'?'RainViewer als weltweiter Radar-Fallback nach verfügbarer Kachelhistorie':'keine verwertbare Radarkarte'):'Radar ausgeblendet',[showRadar,highResolution,source,pxMeta?.product]);
 const dwdProxy=wmsUrl('dwd'),eumetProxy=wmsUrl('eumetsat'),satelliteProxy=satelliteProvider==='dwd'?dwdProxy:eumetProxy;

 return <section className="card composite-card"><Title eye="Radar · Satellit · Blitze" title="Kompositbild"/>
  <div className="composite-layer-switches" aria-label="Komposit-Layer">
   <LayerSwitch active={showRadar&&!highResolution} title="Standard-Niederschlagsradar ein- oder ausblenden" onClick={toggleRadar} icon={<Droplets size={18}/>} label="Niederschlag · 1 km" detail={radarDetail}/>
   <LayerSwitch active={showRadar&&highResolution} disabled={pxLoading||!pxFresh} title={pxMeta?.reason||'Bestes verfügbares DWD-Radarprodukt mit 250 m Rasterweite: nationales HX-Komposit, ersatzweise aktuelles PX250-Standortradar'} onClick={toggleHighRes} icon={<RadioTower size={18}/>} label="Niederschlag · 250 m" detail={pxDetail}/>
   <LayerSwitch active={showSatellite} title="Bestes aktuell verfügbares Satellitenprodukt für Tag beziehungsweise Nacht ein- oder ausblenden" onClick={()=>setShowSatellite(value=>!value)} icon={isDay?<CloudSun size={18}/>:<Satellite size={18}/>} label={`Satellit ${isDay?'Tag':'IR'}`} detail={satelliteDetail}/>
   <LayerSwitch active={showLightning} title="Zeitcodierte Blitzaktivität ein- oder ausblenden; außerhalb der freien Abdeckung wird ein konfigurierter globaler Provider geprüft" onClick={()=>setShowLightning(value=>!value)} icon={<Zap size={18}/>} label="Echtzeitblitze" detail={pointProvider?`${lightningResolution} · Ringe`:licensedGlobal?`${lightningResolution} · aktuell ruhig`:dwdLightning?'DWD · 1 km':mtgLightning?'MTG-LI · 2 km':'global optional'}/>
  </div>
  <div className="radarmap">
   <div className="composite-basemap-control"><Layers3 size={14}/><label><span>Kartenbasis</span><select value={basemap} onChange={event=>setBasemap(event.target.value as BasemapId)}>{(Object.entries(BASEMAPS) as [BasemapId,(typeof BASEMAPS)[BasemapId]][]).map(([id,item])=><option key={id} value={id}>{item.label} · {item.detail}</option>)}</select></label></div>
   <button type="button" className="composite-locate-button" onClick={()=>setLocateRequest(value=>value+1)} title="Karte wieder auf den gewählten Standort zentrieren" aria-label="Karte auf Standort zentrieren"><LocateFixed size={16}/></button>
   <MapContainer center={[lat,lon]} zoom={7} className="leafletmap" scrollWheelZoom={false} fadeAnimation zoomAnimation><MoveMap lat={lat} lon={lon} locateRequest={locateRequest}/><TileLayer key={basemap} attribution={currentBasemap.attribution} url={currentBasemap.url} zIndex={100}/>
    {showSatellite&&showSatelliteAtTime&&<WMSTileLayer key={`${satelliteProvider}:${satelliteLayer}:${satelliteTimeIso||'latest'}`} url={satelliteProxy} opacity={satelliteOpacity/100} zIndex={220} eventHandlers={{load:()=>setSatelliteTileError(''),tileerror:()=>{setSatelliteTileError(`${satelliteName} lieferte ${satelliteTimeIso?`für ${satelliteTimeIso}`:'als aktuellsten Quellenstand'} keine Kartenkachel.`);if(isDay&&!satelliteFallback&&(productTimes.satelliteIrProduct||legacyIr))setSatelliteFallback(true)}}} params={({layers:satelliteLayer,styles:'',format:'image/png',transparent:true,version:satelliteProvider==='eumetsat'?'1.3.0':'1.1.1',...(satelliteTimeIso?{time:satelliteTimeIso}:{}),tiled:true} as any)} attribution={satelliteProvider==='dwd'?'Satellit &copy; DWD':'Satellit &copy; EUMETSAT'}/>} 
    {showRadar&&!highResolution&&source==='dwd'&&radarFrame&&Boolean(radarTimeIso)&&<WMSTileLayer key={`dwd-radar:${dwdLayer}:${radarTimeIso}`} url={dwdProxy} opacity={radarOpacity/100} zIndex={360} eventHandlers={{load:()=>setRadarTileError(''),tileerror:()=>setRadarTileError(`DWD-Radar lieferte für ${radarTimeIso} keine Kartenkachel.`)}} params={({layers:dwdLayer,styles:'',format:'image/png',transparent:true,version:'1.1.1',time:radarTimeIso,tiled:true} as any)} attribution="Radar und Nowcast &copy; DWD"/>}
    {showRadar&&!highResolution&&source==='opera'&&operaPoints.map((point,pointIndex)=><CircleMarker key={`${point.lat}:${point.lon}:${point.observedAt??pointIndex}`} center={[point.lat,point.lon]} radius={Math.max(4,Math.min(15,4+Math.sqrt(Math.max(0,point.rate))*2))} pathOptions={{color:rateColour(point.rate),weight:1,fillColor:rateColour(point.rate),fillOpacity:Math.max(.12,radarOpacity/120)}}><Popup><strong>EUMETNET OPERA</strong><br/>{point.rate.toLocaleString('de-DE',{maximumFractionDigits:1})} mm/h{point.observedAt&&<><br/>{formatInZone(Date.parse(point.observedAt),timezone,{hour:'2-digit',minute:'2-digit'})}</>}</Popup></CircleMarker>)}
    {showRadar&&!highResolution&&source==='rainviewer'&&rainViewerUrl&&<TileLayer key={rainViewerUrl} attribution="Radar &copy; RainViewer" url={rainViewerUrl} opacity={radarOpacity/100} zIndex={360}/>} 
    {showPxAtTime&&pxMeta?.available&&<Suspense fallback={null}><LazyPx250Overlay meta={pxMeta} opacity={radarOpacity/100} onStatus={onPxStatus}/></Suspense>}
    {showLightning&&vectorLightning&&visibleLightning.map(point=>{const style=lightningStyle(point,targetMs,lightningData.observedAt);return <CircleMarker key={point.id} center={[point.lat,point.lon]} radius={style.radius} pathOptions={{color:style.color,weight:style.weight,opacity:style.opacity*lightningOpacity/100,fillOpacity:0,className:`mid-lightning-ring${style.newest?' newest':''}`}}><Popup><strong>{lightningProvider}</strong><br/>{formatAge(style.age)}{point.pulseType&&<><br/>{point.pulseType.toUpperCase()}</>}{point.observedAt&&<><br/>{formatInZone(Date.parse(point.observedAt),timezone,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</>}</Popup></CircleMarker>})}
    {showLightning&&!pointProvider&&dwdLightning&&Boolean(lightningTimeIso)&&<WMSTileLayer key={`dwd-lightning:${lightningTimeIso}`} url={dwdProxy} opacity={lightningOpacity/100} zIndex={470} params={({layers:'dwd:Blitzdichte',styles:'',format:'image/png',transparent:true,version:'1.1.1',time:lightningTimeIso,tiled:true} as any)} attribution="Blitzdichte &copy; DWD"/>}
    {showLightning&&!pointProvider&&!dwdLightning&&mtgLightning&&Boolean(lightningTimeIso)&&<WMSTileLayer key={`mtg-li:${lightningTimeIso}`} url={eumetProxy} opacity={lightningOpacity/100} zIndex={470} params={({layers:'mtg_fd:li_afa',styles:'',format:'image/png',transparent:true,version:'1.1.1',time:lightningTimeIso,tiled:true} as any)} attribution="Lightning Imager &copy; EUMETSAT"/>}
    <CircleMarker center={[lat,lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#1f8cff',fillOpacity:0.95}}><Popup>Gewählter Standort</Popup></CircleMarker>
   </MapContainer>
   <CompositeLegend source={source} showRadar={showRadar} highResolution={highResolution} showSatellite={showSatellite&&showSatelliteAtTime} satelliteName={satelliteLegendName} showLightning={showLightning} lightningProvider={lightningProvider} vectorLightning={vectorLightning} relative={relative} pxSite={highResolution?(pxMeta?.product==='hx'?'Deutschlandkomposit HX':pxMeta?.siteName):undefined}/>
  </div>
  <div className="radarcontrols composite-controls">
   <div className="radar-playback-buttons"><button className="secondary" disabled={!canAnimate||index<=0} onClick={()=>step(-1)} title="Vorheriger Kompositzeitschritt" aria-label="Vorheriger Kompositzeitschritt"><SkipBack size={17}/></button><button className="secondary play" disabled={!canAnimate} onClick={togglePlay} title={playing?'Animation pausieren':'Kompositfilm abspielen'} aria-label={playing?'Animation pausieren':'Kompositfilm abspielen'}>{playing?<Pause size={18}/>:<Play size={18}/>}</button><button className="secondary" disabled={!canAnimate||index>=frames.length-1} onClick={()=>step(1)} title="Nächster Kompositzeitschritt" aria-label="Nächster Kompositzeitschritt"><SkipForward size={17}/></button></div>
   <div className="range timeline"><small>{canAnimate?`Kompositfilm ${frames.length} Schritte · ${timelineSpan}`:'Aktiver Layer stellt nur einen aktuellen Einzelstand bereit'}</small><input type="range" min={0} max={Math.max(0,frames.length-1)} value={index} disabled={!canAnimate} onChange={event=>{setPlaying(false);setIndex(Number(event.target.value))}}/></div>
   <time className={future?'future':''}><span>{relative}</span><small>{targetMs?formatInZone(targetMs,timezone,{hour:'2-digit',minute:'2-digit'}):'–:–'}{future?' · Prognose':''}</small></time>
   <div className="layer-opacity-controls" aria-label="Deckkraft je Layer">{showRadar&&<label><span>Niederschlag</span><b>{radarOpacity}%</b><input type="range" min={15} max={100} value={radarOpacity} onChange={event=>setRadarOpacity(Number(event.target.value))}/></label>}{showSatellite&&<label><span>Satellit</span><b>{satelliteOpacity}%</b><input type="range" min={15} max={100} value={satelliteOpacity} onChange={event=>setSatelliteOpacity(Number(event.target.value))}/></label>}{showLightning&&<label><span>Blitze</span><b>{lightningOpacity}%</b><input type="range" min={20} max={100} value={lightningOpacity} onChange={event=>setLightningOpacity(Number(event.target.value))}/></label>}</div>
  </div>
  {highResolution&&pxStatus==='loading'&&<small className="source composite-source-note"><RadioTower size={12}/>DWD-250-m-HDF5-Daten werden über den Worker geladen und lokal gerendert …</small>}
  {highResolution&&pxStatus==='error'&&<small className="source warning">Das 250-m-Radar konnte nicht dargestellt werden: {pxMessage}</small>}
  {highResolution&&!showPxAtTime&&canAnimate&&<small className="source warning">Das 250-m-Radar ist nur am aktuellen Produktzeitpunkt sichtbar; beim zeitlichen Blättern bleibt der Layer außerhalb eines ±10-Minuten-Fensters ausgeblendet.</small>}
  {showRadar&&source==='dwd'&&!highResolution&&!dwdTimeline.length&&<small className="source warning">Der Worker meldet derzeit keine gültigen DWD-Radarzeitpunkte. Es werden keine künstlichen Zeitstempel mehr erzeugt.</small>}
  {showRadar&&source==='dwd'&&radarTileError&&<small className="source warning">{radarTileError}</small>}
  {showRadar&&source==='opera'&&operaError&&<small className="source warning">OPERA-Kartenraster konnte nicht geladen werden: {operaError}</small>}
  {showSatellite&&!satelliteProduct&&<small className="source warning">Der Worker meldet derzeit kein verfügbares Satellitenprodukt.</small>}{showSatellite&&satelliteProduct?.latestOnly&&<small className="source warning">Für dieses Satellitenprodukt ist aktuell keine verlässliche Zeitdimension verfügbar. MID zeigt nur den vom Dienst gelieferten neuesten Stand und ordnet ihm keine erfundene Uhrzeit zu.</small>}
  {showSatellite&&satelliteTileError&&<small className="source warning">{satelliteTileError}{isDay&&!satelliteFallback?' MID wechselt automatisch auf das IR-Produkt.':''}</small>}
  {(showSatellite||showLightning||showRadar&&source==='dwd')&&compositeError&&<small className="source warning">Produktzeiten konnten teilweise nicht geprüft werden: {compositeError}</small>}
  {showLightning&&lightningError&&<small className="source warning">Blitzpunkte konnten nicht geladen werden; sofern der Ort abgedeckt ist, wird das DWD- beziehungsweise MTG-LI-Raster verwendet.</small>}
  {showLightning&&!dwdLightning&&!mtgLightning&&!pointProvider&&!licensedGlobal&&<small className="source warning">Für diesen Ort ist ohne lizenzierte Xweather-/GLD360-Zugangsdaten keine frei nutzbare Echtzeit-Blitzquelle verfügbar.</small>}
  <small className="source">Kompositquellen: {sourceText}{showSatellite&&satelliteProduct?` · ${satelliteName}${satelliteResolution?` ${satelliteResolution}`:''}`:''}{showLightning?` · ${lightningName}`:''}. DWD- und EUMETSAT-Karten laufen CORS-sicher über den MID-Worker. Blitzringe verwenden eine von Blitzortung.org inspirierte Altersfarbskala von Weiß über Gelb und Orange bis Dunkelrot in 20-Minuten-Stufen bis zwei Stunden, soweit die jeweilige Quelle diese Historie liefert, jedoch keine Blitzortung-Rohdaten. Die relative Zeit bezieht sich auf die Worker-synchronisierte aktuelle Uhrzeit; angezeigt werden höchstens −1 h bis +2 h und nur tatsächlich gemeldete Produktzeiten. Kartenbasis: {currentBasemap.label}. Keine amtliche Warnung.</small>
 </section>;
}
