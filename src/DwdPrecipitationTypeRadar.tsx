import {lazy,Suspense,useCallback,useEffect,useState} from 'react';
import {ExternalLink,Info,MapPin,RefreshCw} from 'lucide-react';
import {fetchWorkerJson} from './workerClient';
import {loadCompositeTimes,type CompositeProduct} from './CompositeData';
import {HYMEC_NG_CLASSES,loadHymecNgMetadata,sampleHymecNg,type HymecNgMeta,type HymecNgSample} from './HymecNgSource';
import type {HymecNgOverlayStatus} from './HymecNgOverlay';
import type {Location} from './weather';

const LazyDwdPrecipitationMap=lazy(()=>import('./DwdPrecipitationMap'));
const DWD_PRODUCT_PAGE='https://www.dwd.de/DE/leistungen/wolken_niederschlagsart/wolken_niederschlagsart.html';
const COVERAGE={west:5.45,east:15.55,south:47.0,north:55.2};
const PRECIPITATION_TYPE_LEGEND=[...HYMEC_NG_CLASSES,{code:0,label:'kein Niederschlag',color:'#c9c9c9'}] as const;

type RadarMeta={error?:string;observedAt?:string;publishedAt?:string;radarAt?:string;satelliteAt?:string;componentTimeNote?:string;checkedAt?:string};
type PointInspection={loading:boolean;error?:string;sample?:HymecNgSample};
type LayerStatus={status:'idle'|'loading'|'ready'|'error';message?:string};

function countryCode(location:Location){return String(location.country_code||location.country||'').trim().toUpperCase()}
export function dwdPrecipitationTypeCoverage(location:Location){const latitude=Number(location.latitude),longitude=Number(location.longitude),code=countryCode(location),within=Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=COVERAGE.south&&latitude<=COVERAGE.north&&longitude>=COVERAGE.west&&longitude<=COVERAGE.east;if(code&&code!=='DE'&&code!=='DEU'&&code!=='GERMANY'&&code!=='DEUTSCHLAND')return false;return within}
function formatDwdSourceTimestamp(value:string|undefined){if(!value)return'–';const stamp=Date.parse(value);if(!Number.isFinite(stamp))return value;const date=new Date(stamp),hour=String(date.getUTCHours()).padStart(2,'0'),minute=String(date.getUTCMinutes()).padStart(2,'0');return`${hour}:${minute} UTC`}
function coordinateLabel(latitude:number,longitude:number){return `${Math.abs(latitude).toFixed(5)}° ${latitude>=0?'N':'S'} · ${Math.abs(longitude).toFixed(6)}° ${longitude>=0?'E':'W'}`}
function satelliteProductDistance(product:CompositeProduct|undefined,target?:string){if(!product)return Infinity;const targetMs=Date.parse(target||'');if(!Number.isFinite(targetMs))return 0;const values=[...(product.times||[]),product.latestTime].map(value=>typeof value==='number'?value:Date.parse(String(value||''))).filter(Number.isFinite) as number[];return values.length?Math.min(...values.map(value=>Math.abs(value-targetMs))):product.latestOnly?0:Infinity}
function bestSatelliteProduct(day:CompositeProduct|undefined,ir:CompositeProduct|undefined,target?:string){const options=[day,ir].filter((value):value is CompositeProduct=>Boolean(value));if(!options.length)return null;return options.sort((a,b)=>satelliteProductDistance(a,target)-satelliteProductDistance(b,target))[0]}

export function DwdPrecipitationTypeRadar({location,enabled=true}:{location:Location;enabled?:boolean}){
 const covered=dwdPrecipitationTypeCoverage(location),latitude=Number(location.latitude),longitude=Number(location.longitude),[refreshSlot,setRefreshSlot]=useState(()=>Math.floor(Date.now()/300000)),[meta,setMeta]=useState<RadarMeta|null>(null),[hymecMeta,setHymecMeta]=useState<HymecNgMeta|null>(null),[satelliteProduct,setSatelliteProduct]=useState<CompositeProduct|null>(null),[loading,setLoading]=useState(false),[markerVisible,setMarkerVisible]=useState(true),[pointInfo,setPointInfo]=useState<PointInspection|null>(null),[hymecStatus,setHymecStatus]=useState<{status:HymecNgOverlayStatus;message?:string}>({status:'idle'}),[satelliteStatus,setSatelliteStatus]=useState<LayerStatus>({status:'idle'});
 useEffect(()=>{const timer=window.setInterval(()=>setRefreshSlot(Math.floor(Date.now()/300000)),60000);return()=>window.clearInterval(timer)},[]);
 const handleHymecStatus=useCallback((status:HymecNgOverlayStatus,message?:string)=>setHymecStatus({status,message}),[]);
 const handleSatelliteStatus=useCallback((status:LayerStatus['status'],message?:string)=>setSatelliteStatus({status,message}),[]);
 useEffect(()=>{
  if(!enabled||!covered){setMeta(null);setHymecMeta(null);setSatelliteProduct(null);setLoading(false);return}
  let cancelled=false;setLoading(true);setPointInfo(null);setSatelliteStatus({status:'loading'});
  void Promise.allSettled([
   fetchWorkerJson<RadarMeta>('dwd-precipitation-type-meta',{}, {purpose:'radar',timeoutMs:16000,maxAgeMs:4*60000,staleIfErrorMs:20*60000,cacheKey:`dwd-precip-type-meta:${refreshSlot}`}),
   loadCompositeTimes(latitude,longitude)
  ]).then(async results=>{
   if(cancelled)return;
   const source=results[0].status==='fulfilled'?results[0].value:null,composite=results[1].status==='fulfilled'?results[1].value:null;
   setMeta(source);
   setSatelliteProduct(bestSatelliteProduct(composite?.satelliteDayProduct,composite?.satelliteIrProduct,source?.satelliteAt));
   if(!source?.radarAt){setHymecMeta({available:false,error:'Kein verbindlicher aktueller DWD-Zeitstand für die Niederschlagsart verfügbar.'});setLoading(false);return}
   const native=await loadHymecNgMetadata(source.radarAt);
   if(cancelled)return;
   const target=Date.parse(source.radarAt),observed=Date.parse(native.observedAt||''),offsetMinutes=Number.isFinite(target)&&Number.isFinite(observed)?Math.abs(target-observed)/60000:Infinity;
   setHymecMeta(native.available&&offsetMinutes<=15?native:{...native,available:false,error:native.error||`HymecNG-Datenstand passt nicht zum verbindlichen Radarzeitpunkt (${Number.isFinite(offsetMinutes)?Math.round(offsetMinutes):'?' } min Abweichung).`});
   setLoading(false)
  }).catch(error=>{if(cancelled)return;setMeta(null);setHymecMeta({available:false,error:error instanceof Error?error.message:String(error)});setSatelliteProduct(null);setLoading(false)});
  return()=>{cancelled=true}
 },[enabled,covered,refreshSlot,latitude,longitude]);
 if(!enabled||!covered)return null;
 const inspectPoint=async(pointLat:number,pointLon:number)=>{if(!hymecMeta?.available){setPointInfo({loading:false,error:hymecMeta?.error||'HymecNG-Punktanalyse derzeit nicht verfügbar.'});return}setPointInfo({loading:true});try{const sample=await sampleHymecNg(hymecMeta,pointLat,pointLon);setPointInfo({loading:false,sample})}catch(error){setPointInfo({loading:false,error:error instanceof Error?error.message:'Punktanalyse nicht verfügbar.'})}};
 const precipStatus=hymecStatus.status==='error'?hymecStatus.message:hymecMeta?.available?'Niederschlagsart · HymecNG 1 km':hymecMeta?.error||'Niederschlagsart aktuell nicht verfügbar';
 const satelliteStatusText=satelliteStatus.status==='ready'?'Satellitenbild aktiv':satelliteStatus.status==='error'?satelliteStatus.message||'Satellitenbild nicht verfügbar':'Satellitenbild wird geladen …';
 return <section className="dwd-precip-type-radar" aria-label="DWD Wolken und Niederschlagsart"><header><span><small>DWD · Satellit + Radar</small><strong>Wolken + Niederschlagsart</strong><em>Ausschnitt um {location.name||'den gewählten Ort'}</em></span><div className="dwd-precip-type-radar__actions"><button type="button" className={`dwd-precip-type-radar__marker-toggle${markerVisible?' active':''}`} onClick={()=>setMarkerVisible(value=>!value)} title={markerVisible?'Standortmarker ausblenden':'Standortmarker einblenden'} aria-pressed={markerVisible}><MapPin size={16}/></button><details className="dwd-precip-type-radar__info"><summary aria-label="Legende der Niederschlagsarten anzeigen" title="Legende"><Info size={16}/></summary><div className="dwd-precip-type-radar__legend" role="group" aria-label="DWD-Legende Niederschlagsarten"><strong>Niederschlagsart</strong>{PRECIPITATION_TYPE_LEGEND.map(item=><span key={item.label}><i style={{background:item.color}}/>{item.label}</span>)}</div></details><a href={DWD_PRODUCT_PAGE} target="_blank" rel="noreferrer" title="DWD-Originalprodukt öffnen"><ExternalLink size={16}/><span>DWD</span></a></div></header>
 <div className="dwd-precip-type-radar__timestamps"><span><b>Radar</b>{formatDwdSourceTimestamp(meta?.radarAt||hymecMeta?.observedAt)}</span><span><b>Sat</b>{formatDwdSourceTimestamp(meta?.satelliteAt)}</span>{pointInfo?<span className="dwd-precip-type-radar__point-strip"><b>Bildpunkt</b>{pointInfo.loading?'wird ausgewertet …':pointInfo.error?pointInfo.error:pointInfo.sample?`${pointInfo.sample.label} · ${coordinateLabel(pointInfo.sample.latitude,pointInfo.sample.longitude)}`:'–'}</span>:<span className="dwd-precip-type-radar__point-strip idle"><b>Bildpunkt</b>Antippen zur Auswertung</span>}<small title={meta?.componentTimeNote}>{satelliteStatusText} · {precipStatus}</small></div>
 <div className={`dwd-precip-type-radar__map-shell${loading?' loading':''}`}>
  {loading?<span className="dwd-precip-type-radar__status"><RefreshCw className="spin" size={18}/>Georeferenzierte DWD-Daten werden geladen …</span>:null}
  <Suspense fallback={<span className="dwd-precip-type-radar__status"><RefreshCw className="spin" size={18}/>Karte wird vorbereitet …</span>}><LazyDwdPrecipitationMap latitude={latitude} longitude={longitude} satelliteAt={meta?.satelliteAt} satelliteProduct={satelliteProduct} hymecMeta={hymecMeta} markerVisible={markerVisible} onPoint={inspectPoint} onHymecStatus={handleHymecStatus} onSatelliteStatus={handleSatelliteStatus}/></Suspense>
 </div><footer><span>Standortmarker direkt aus WGS84-Koordinaten; Antippen wertet HymecNG am gewählten Kartenpunkt aus.</span><small>Standort: {coordinateLabel(latitude,longitude)} · DWD HymecNG + Satellit</small></footer></section>;
}
