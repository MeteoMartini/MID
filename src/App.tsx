import {useEffect,useMemo,useRef,useState} from 'react';
import {AlertTriangle,BadgeCheck,Cloud,Download,Droplets,Gauge,LocateFixed,Moon,Navigation,RefreshCw,Search,Settings2,Sun,ThermometerSun,Umbrella,Wind,X} from 'lucide-react';
import {Area,AreaChart,Bar,CartesianGrid,ComposedChart,Legend,Line,ResponsiveContainer,Tooltip,XAxis,YAxis} from 'recharts';
import {CircleMarker,MapContainer,Popup,TileLayer,WMSTileLayer,useMap} from 'react-leaflet';
import {toPng} from 'html-to-image';
import {airQuality,climatology,cloudOktas,countryCodeFromLocation,cloudOktasText,currentIndex,dayEffectiveUvMax,dayWeatherCharacter,ensembles,forecast,hazards,icon,label,mapDays,mapHours,mapMinutely15,officialWarnings,searchLocations,reverseLocation,station,wind,type ClimateDay,type Day,type EnsembleDay,type Hour,type Location,type Minute15,type OfficialAlert,type Station,type Weather,type WindUnit} from './weather';

const VERSION='0.7.1';
const LOGO_PATH='./mid-logo.png';
const LOCATION_STORAGE_KEY='mid:lastLocation';
function normalizeLocation(loc:Location):Location{const country_code=countryCodeFromLocation(loc.country_code)||countryCodeFromLocation(loc.country)||undefined;return{...loc,country_code}}
function storedLocation():Location|null{try{const raw=localStorage.getItem(LOCATION_STORAGE_KEY);if(!raw)return null;const loc=JSON.parse(raw) as Location;if(!Number.isFinite(loc.latitude)||!Number.isFinite(loc.longitude))return null;const normalized=normalizeLocation(loc);localStorage.setItem(LOCATION_STORAGE_KEY,JSON.stringify(normalized));return normalized}catch{return null}}

type RadarFrame={time:number;path?:string;future?:boolean};
type Radar={host:string;radar:{past:RadarFrame[];nowcast?:RadarFrame[]}};

export default function App(){
 const[loc,setLocState]=useState<Location|null>(()=>storedLocation()),[w,setW]=useState<Weather|null>(null),[air,setAir]=useState<any>(null),[ens,setEns]=useState<EnsembleDay[]>([]),[models,setModels]=useState<string[]>([]),[climate,setClimate]=useState<ClimateDay[]>([]),[climateLoading,setClimateLoading]=useState(false),[climateError,setClimateError]=useState(''),[ensLoading,setEnsLoading]=useState(false),[ensError,setEnsError]=useState(''),[st,setSt]=useState<Station|null>(null),[stationLoading,setStationLoading]=useState(false),[official,setOfficial]=useState<OfficialAlert[]>([]),[officialLoading,setOfficialLoading]=useState(false),[officialError,setOfficialError]=useState(''),[officialProvider,setOfficialProvider]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[dark,setDark]=useState(()=>localStorage.getItem('theme')!=='light'),[unit,setUnit]=useState<WindUnit>(()=>(localStorage.getItem('windUnit') as WindUnit)||'kn'),[selected,setSelected]=useState('');
 const seq=useRef(0);
 useEffect(()=>{document.documentElement.dataset.theme=dark?'dark':'light';localStorage.setItem('theme',dark?'dark':'light')},[dark]);
 useEffect(()=>localStorage.setItem('windUnit',unit),[unit]);
 useEffect(()=>{document.title='MID - Meteorological Information Dashboard'},[]);
 function setLoc(next:Location){const normalized=normalizeLocation(next);localStorage.setItem(LOCATION_STORAGE_KEY,JSON.stringify(normalized));setLocState(normalized);setW(null);setAir(null);setEns([]);setModels([]);setClimate([]);setClimateError('');setOfficial([]);setOfficialError('');setOfficialProvider('');setSelected('')}
 async function load(){if(!loc)return;const id=++seq.current,c=new AbortController();setLoading(true);setError('');setEnsLoading(true);setEnsError('');setEns([]);setModels([]);setClimate([]);setClimateError('');setClimateLoading(true);setSt(null);setStationLoading(true);setOfficial([]);setOfficialError('');setOfficialProvider('');setOfficialLoading(true);officialWarnings(loc.latitude,loc.longitude,loc.country_code||loc.country,loc.name,loc.admin1,loc.admin2,c.signal).then(x=>{if(id===seq.current){setOfficial(x.alerts);setOfficialProvider(x.provider||x.coverage||'CAP')}}).catch(e=>{if(id===seq.current)setOfficialError(e instanceof Error?e.message:'Amtliche Warnungen konnten nicht geladen werden.')} ).finally(()=>id===seq.current&&setOfficialLoading(false));try{const[fw,aq]=await Promise.all([forecast(loc.latitude,loc.longitude,c.signal),airQuality(loc.latitude,loc.longitude,c.signal).catch(()=>null)]);if(id!==seq.current)return;setW(fw);setAir(aq);setSelected(String(fw.daily.time[0]));setLoading(false);station(loc.latitude,loc.longitude,loc.country_code||loc.country,loc.elevation??fw.elevation,c.signal).then(x=>id===seq.current&&setSt(x)).finally(()=>id===seq.current&&setStationLoading(false));climatology(loc.latitude,loc.longitude,loc.elevation??fw.elevation,(fw.daily.time as string[]).slice(0,14),c.signal).then(x=>{if(id===seq.current)setClimate(x)}).catch(e=>{if(id===seq.current)setClimateError(e instanceof Error?e.message:'Klimatologisches Mittel konnte nicht geladen werden.')} ).finally(()=>id===seq.current&&setClimateLoading(false));ensembles(loc.latitude,loc.longitude,c.signal).then(x=>{if(id===seq.current){setEns(x.days);setModels(x.models);setEnsError(x.days.length?'':'Keine ausreichend vollständigen Ensemble-Daten erhalten.')}}).catch(e=>{if(id===seq.current){setEns([]);setModels([]);setEnsError(e instanceof Error?e.message:'Ensemble-Daten konnten nicht geladen werden.')}}).finally(()=>id===seq.current&&setEnsLoading(false))}catch(e){if(id===seq.current){setLoading(false);setEnsLoading(false);setClimateLoading(false);setStationLoading(false);setError(e instanceof Error?e.message:'Laden fehlgeschlagen')}}}
 useEffect(()=>{if(loc)void load()},[loc?.id,loc?.latitude,loc?.longitude]);
 function locate(){if(!navigator.geolocation){setError('Standortermittlung nicht unterstützt.');return}setLoading(true);setError('');navigator.geolocation.getCurrentPosition(async p=>{try{const resolved=await reverseLocation(p.coords.latitude,p.coords.longitude,p.coords.altitude??undefined);setLoc(resolved)}catch{setLoc({id:Date.now(),name:`${p.coords.latitude.toFixed(2)}°, ${p.coords.longitude.toFixed(2)}°`,latitude:p.coords.latitude,longitude:p.coords.longitude,elevation:p.coords.altitude??undefined,autolocated:true})}},()=>{setLoading(false);setError('Standort konnte nicht ermittelt werden.')},{enableHighAccuracy:true,timeout:15000,maximumAge:300000})}
 const hours=useMemo(()=>w?mapHours(w):[],[w]),minutes15=useMemo(()=>w?mapMinutely15(w):[],[w]),days=useMemo(()=>w?mapDays(w):[],[w]),hz=useMemo(()=>hazards(hours,hours[currentIndex(hours)]?.uvIndex),[hours]),precipNow=useMemo(()=>precipitationNowSummary(minutes15,hours),[minutes15,hours]),risk=precipNow.probability??hours[currentIndex(hours)]?.probability??0;
 return <div className="app"><Header setLoc={setLoc} locate={locate} loading={loading} dark={dark} setDark={setDark} unit={unit} setUnit={setUnit} reload={load} hasLocation={!!loc}/><main>{!loc?<section className="empty-start"><Search size={30}/><div><strong>Ort oder Standort auswählen</strong><span>Beim ersten Aufruf bleibt MID leer. Der zuletzt gewählte Ort wird anschließend lokal gespeichert und beim nächsten Besuch automatisch geladen.</span></div></section>:<><section className="place"><div><span>{loc.autolocated?'Automatisch lokalisiert · ':''}{loc.admin1??loc.country??'Standort'}</span><h1>{loc.name}</h1><p>{loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E · {Math.round(loc.elevation??w?.elevation??0)} m ü. NHN{loc.autolocated?' · Ortsname aus Geodatenbank':''}</p></div><aside className="precip-now"><small>Aktuelle Niederschlagswahrscheinlichkeit</small><strong>{Math.round(risk)} %</strong><span>{precipNow.summary}</span><em>{precipNow.source}</em></aside></section>{error&&<div className="error">{error}</div>}{loading&&!w?<div className="loading"><RefreshCw className="spin"/><strong>Wettermodelle werden geladen …</strong><span>Best Match, Luftqualität und Ensembles</span></div>:w&&<><Current loc={loc} w={w} air={air} st={st} stationLoading={stationLoading} unit={unit}/><Hazards data={hz}/><OfficialWarnings alerts={official} loading={officialLoading} error={officialError} provider={officialProvider}/><div className="split"><Forecast days={days} hours={hours} selected={selected} setSelected={setSelected} unit={unit}/><Radar lat={loc.latitude} lon={loc.longitude}/></div><Ensembles data={ens} models={models} days={days} climate={climate} climateLoading={climateLoading} climateError={climateError} loading={ensLoading} error={ensError}/><Widget loc={loc} days={days} hours={hours} unit={unit}/></>}</>}</main><footer><span>MID v{VERSION} · <a href="https://github.com/MeteoMartini/MID/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">Changelog</a></span><span>Aktualisiert: {new Date().toLocaleString('de-DE')}</span><small className="data-disclaimer">Datenquellen: Open-Meteo (Vorhersage, Luftqualität, Geocoding und ERA5-Land-Klimatologie 1991–2020), GeoSphere Austria/TAWES, Bright Sky/DWD-WMO, NOAA AviationWeather/METAR sowie optional qualitätsgeprüfte Messpunkte von Weather Underground, Netatmo Weathermap, Synoptic Data/MesoWest-MADIS und Xweather über jeweils autorisierte API-Zugänge. Hyperlokale Messwerte werden höhen-, entfernungs- und aktualitätsgewichtet sowie robust gegen Ausreißer gemittelt. Amtliche Warnungen: DWD-WFS auf Gemeindeebene mit DWD-CAP-Fallback für Deutschland, MeteoAlarm-Atom/CAP der nationalen europäischen Wetterdienste und NOAA/NWS für die USA. Radar/Nowcast: Deutscher Wetterdienst (DWD-RV) bzw. RainViewer; Kartenbasis: OpenStreetMap; Reverse-Geocoding: BigDataCloud. Automatische Hazards und Radardarstellungen sind keine amtlichen Warnungen.</small></footer></div>
}

function Header({setLoc,locate,loading,dark,setDark,unit,setUnit,reload,hasLocation}:{setLoc:(x:Location)=>void;locate:()=>void;loading:boolean;dark:boolean;setDark:(x:boolean)=>void;unit:WindUnit;setUnit:(x:WindUnit)=>void;reload:()=>void;hasLocation:boolean}){const[q,setQ]=useState(''),[results,setResults]=useState<Location[]>([]),[open,setOpen]=useState(false);useEffect(()=>{if(q.trim().length<2){setResults([]);setOpen(false);return}const c=new AbortController(),t=setTimeout(()=>searchLocations(q,c.signal).then(x=>{setResults(x);setOpen(true)}).catch(()=>{setResults([]);setOpen(false)}),250);return()=>{clearTimeout(t);c.abort()}},[q]);return <header className="top"><div className="brand"><img src={LOGO_PATH} alt="MID Logo" className="brand-logo"/><span><strong><small className="brand-version">v{VERSION}</small></strong><small>Meteorological Information Dashboard</small></span></div><div className="search"><div><Search size={18}/><input value={q} onFocus={()=>results.length&&setOpen(true)} onChange={e=>setQ(e.target.value)} placeholder="Ort/Standort suchen"/>{q&&<button onClick={()=>{setQ('');setOpen(false)}}><X size={16}/></button>}</div><button className="secondary locate" onClick={locate} title="Standort automatisch bestimmen" aria-label="Standort automatisch bestimmen"><LocateFixed size={17}/><span>Standort</span></button>{open&&results.length>0&&<section>{results.map(r=><button key={r.id} onClick={()=>{setLoc(r);setQ('');setOpen(false)}}><strong>{r.name}{r.postcodes?.[0]?` ${r.postcodes[0]}`:''}</strong><small>{[r.admin1,r.country].filter(Boolean).join(', ')}{Number.isFinite(r.elevation)?` · ${Math.round(r.elevation!)} m`:''}</small></button>)}</section>}</div><div className="actions"><label><Settings2 size={15}/><select value={unit} onChange={e=>setUnit(e.target.value as WindUnit)}><option value="kn">kt</option><option value="kmh">km/h</option><option value="ms">m/s</option><option value="mph">mph</option></select></label><button className="theme-toggle" title={dark?'Helles Layout':'Dunkles Layout'} aria-label={dark?'Helles Layout':'Dunkles Layout'} onClick={()=>setDark(!dark)}>{dark?<Sun size={19}/>:<Moon size={19}/>}<span>{dark?'Hell':'Dunkel'}</span></button><button className="reload-button" title="Wetterdaten neu laden" aria-label="Wetterdaten neu laden" onClick={reload} disabled={loading||!hasLocation}><RefreshCw size={19} className={loading?'spin':''}/></button></div></header>}

function Current({loc,w,air,st,stationLoading,unit}:{loc:Location;w:Weather;air:any;st:Station|null;stationLoading:boolean;unit:WindUnit}){
 const c=w.current,fresh=!!st&&(!st.timestamp||Date.now()-new Date(st.timestamp).getTime()<150*60000),providerSummary=st?.sourceProviders?.slice(0,3).map(x=>x.replace(/ \(.*?\)$/,'')).join(', '),stationInfo=fresh?(st!.blended?`${st!.stationCount??2} geeignete Messstationen · ${providerSummary||'mehrere Netze'} · mittlere Entfernung ${Number.isFinite(st!.distance)?`${(st!.distance!/1000).toFixed(1).replace('.',',')} km`:'unbekannt'}${Number.isFinite(st!.temperatureSpread)?` · Temperaturstreuung ${st!.temperatureSpread!.toFixed(1).replace('.',',')} °C`:''}`:`${st!.provider??'WMO/METAR'} · ${st!.name} · ${Number.isFinite(st!.height)?`${Math.round(st!.height!)} m`:'Höhe unbekannt'} · ${Number.isFinite(st!.distance)?`${(st!.distance!/1000).toFixed(1).replace('.',',')} km`:'Entfernung unbekannt'}`):'';
 const observed=(v:number|undefined,fallback:number)=>fresh&&Number.isFinite(v)?Number(v):fallback;
 const temp=observed(st?.temperature,Number(c.temperature_2m)),hum=observed(st?.humidity,Number(c.relative_humidity_2m)),dew=observed(st?.dewPoint,Number(c.dew_point_2m)),pressure=observed(st?.pressure,Number(c.pressure_msl)),windSpeed=observed(st?.windSpeed!=null?(st.windUnit==='kt'?st.windSpeed:st.windSpeed/1.852):undefined,Number(c.wind_speed_10m)),windGust=observed(st?.windGust!=null?(st.windUnit==='kt'?st.windGust:st.windGust/1.852):undefined,Number(c.wind_gusts_10m)),windDirection=observed(st?.windDirection,Number(c.wind_direction_10m)),cloud=observed(st?.cloudCover,Number(c.cloud_cover)),precip=observed(st?.precipitation,Number(c.precipitation));
 const mappedHours=mapHours(w);
 const forecastHour=mappedHours[currentIndex(mappedHours)]??null;
 const airCurrentUv=air?.current?Number(air.current.uv_index):Number.NaN;
 const actualCurrentUv=forecastHour&&Number.isFinite(forecastHour.uvIndex)?forecastHour.uvIndex:(Number.isFinite(airCurrentUv)?airCurrentUv:Number.NaN);
 const source=(available:boolean,defaultText:string)=>available&&fresh?(st!.blended?`robustes Mittel aus ${st!.stationCount??2} Stationen`:`${st!.provider??'Stationsmessung'} · ${st!.name}`):defaultText;
 const cards=[
  {icon:'💧',label:'Taupunkt',value:`${Math.round(dew)} °C`,detail:`Relative Feuchte ${Math.round(hum)} % · ${source(Number.isFinite(st?.dewPoint),'Best Match')}`,checked:fresh&&Number.isFinite(st?.dewPoint)},
  {icon:'🌬️',label:'Wind',value:`${dirArrow(windDirection)} ${wind(windSpeed,unit)}`,detail:`aus ${Math.round(windDirection)}° · Böen ${wind(windGust,unit)} · ${source(Number.isFinite(st?.windSpeed)||Number.isFinite(st?.windDirection),'Best Match')}`,checked:fresh&&(Number.isFinite(st?.windSpeed)||Number.isFinite(st?.windDirection))},
  {icon:'🌧️',label:'Niederschlag',value:`${precip.toFixed(1)} mm`,detail:source(Number.isFinite(st?.precipitation),'aktueller Modellzeitraum'),checked:fresh&&Number.isFinite(st?.precipitation)},
  {icon:'☁️',label:'Bewölkung',value:`${cloudOktas(cloud)}/8`,detail:`${cloudOktasText(cloud).split(' · ')[1]} · ${source(Number.isFinite(st?.cloudCover),'Best Match')}`,checked:fresh&&Number.isFinite(st?.cloudCover)},
  {icon:'⏱️',label:'Luftdruck',value:`${Math.round(pressure)} hPa`,detail:`auf Meereshöhe · ${source(Number.isFinite(st?.pressure),'Best Match')}`,checked:fresh&&Number.isFinite(st?.pressure)},
  {icon:'☀️',label:'UV-Index',value:Number.isFinite(actualCurrentUv)?actualCurrentUv.toFixed(1):'–',detail:'tatsächlich erwarteter, bewölkungsberücksichtigter UVI',checked:false},
  {icon:'🏭',label:'Luftqualität',value:air?.current?`${Math.round(Number(air.current.european_aqi))} AQI`:'–',detail:air?.current?`PM2,5 ${Number(air.current.pm2_5).toFixed(1)} µg/m³`:'Open-Meteo',checked:false},
  {icon:'🏔️',label:'Höhe',value:`${Math.round(loc.elevation??w.elevation)} m`,detail:'ü. NHN',checked:false}
 ];
 return <><section className="hero"><div>{icon(Number(c.weather_code),Number(c.is_day)===1)}</div><article><span>Aktuelles Wetter</span><strong>{Math.round(temp)}°</strong><b>{label(Number(c.weather_code))}</b><small>Gefühlt {Math.round(Number(c.apparent_temperature))} °C{fresh?(st?.blended?' · Temperatur robust lokal gemittelt':' · Temperatur stationsgeprüft'):''}</small></article><aside className={fresh?'ok':''}><i/><span><b>{fresh?(st?.blended?'Lokales Stationsmittel':'Nächstgeeignete Messstation'):stationLoading?'Prüfung läuft':'Best Match'}</b><small>{fresh?stationInfo:stationLoading?'Stationsdaten werden im Hintergrund geprüft.':'Keine ausreichend aktuelle amtliche oder hyperlokale Messstation verfügbar – Fallback auf Best Match'}</small></span></aside></section><section className="metrics">{cards.map(x=><article key={x.label}><header><span>{x.icon}</span><small>{x.label}</small>{x.checked&&<i title="Mit aktueller Stationsmessung abgeglichen"/>}</header><strong>{x.value}</strong><small>{x.detail}</small></article>)}</section></>
}
function Hazards({data}:{data:ReturnType<typeof hazards>}){if(!data.length)return <section className="hazard clear"><BadgeCheck/><div><strong>Keine markanten Gefahrenindikatoren</strong><span>Die automatische Auswertung der nächsten 24 Stunden zeigt keine auffälligen Signale.</span></div></section>;return <section className="hazards">{data.map(x=><article className={x.level} key={x.title}><AlertTriangle/><div><strong>{x.title}</strong><span>{x.text}</span></div></article>)}<small>Automatisch berechnete Indikatoren – Schwellen orientiert an DWD, Meteoalarm und NWS; keine amtlichen Warnungen.</small></section>}

function alertTime(value?:string){if(!value)return'';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleString('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):''}
function OfficialWarnings({alerts,loading,error,provider}:{alerts:OfficialAlert[];loading:boolean;error:string;provider:string}){
 const[open,setOpen]=useState<string>('');
 if(loading)return <section className="official-warnings compact"><header><AlertTriangle/><div><strong>Amtliche Wetterwarnungen</strong><small>CAP-Meldungen werden geladen …</small></div></header></section>;
 if(error)return <section className="official-warnings compact unavailable"><header><AlertTriangle/><div><strong>Amtliche Wetterwarnungen</strong><small>{error}</small></div></header></section>;
 if(!alerts.length)return <section className="official-warnings compact clear"><header><BadgeCheck/><div><strong>Keine amtlichen Wetterwarnungen</strong><small>{provider||'Für den gewählten Standort liegt derzeit keine aktive CAP-Warnung vor.'}</small></div></header></section>;
 return <section className="official-warnings"><header><AlertTriangle/><div><strong>Amtliche Wetterwarnungen</strong><small>{provider||'Common Alerting Protocol (CAP)'}</small></div></header><div className="official-list">{alerts.map(a=>{const expanded=open===a.id;return <article key={a.id} className={`official-alert ${a.level} ${expanded?'open':''}`}><button type="button" onClick={()=>setOpen(expanded?'':a.id)} aria-expanded={expanded}><i/><span>{a.headline}</span><b>{expanded?'−':'+'}</b></button>{expanded&&<div className="official-message"><p>{a.description}</p>{a.instruction&&<p className="instruction">{a.instruction}</p>}<small>{[a.source,a.area,a.onset?`ab ${alertTime(a.onset)}`:a.effective?`ab ${alertTime(a.effective)}`:'',a.expires?`bis ${alertTime(a.expires)}`:''].filter(Boolean).join(' · ')}</small></div>}</article>})}</div></section>
}

function MoveMap({lat,lon}:{lat:number;lon:number}){const map=useMap();useEffect(()=>{map.setView([lat,lon],7,{animate:true})},[lat,lon,map]);return null}
function Radar({lat,lon}:{lat:number;lon:number}){
 const inDwdCoverage=lon>=1.4&&lon<=18.8&&lat>=45.6&&lat<=56.5;
 const[frames,setFrames]=useState<RadarFrame[]>([]),[host,setHost]=useState(''),[index,setIndex]=useState(0),[opacity,setOpacity]=useState(82),[latestObserved,setLatestObserved]=useState(0),[source,setSource]=useState<'dwd'|'rainviewer'>(inDwdCoverage?'dwd':'rainviewer');
 useEffect(()=>{let alive=true;if(inDwdCoverage){const now=Math.floor(Date.now()/300000)*300,items=Array.from({length:37},(_,i)=>({time:now-7200+i*300,future:i>24}));setFrames(items);setIndex(24);setLatestObserved(now);setSource('dwd');return()=>{alive=false}}fetch('https://api.rainviewer.com/public/weather-maps.json',{cache:'no-store'}).then(r=>r.json()).then((d:Radar)=>{if(!alive)return;const past=(d.radar?.past??[]).slice(-12),last=past.at(-1)?.time??0,nowcast=(d.radar?.nowcast??[]).filter(x=>x.time<=last+3600).map(x=>({...x,future:true})),items=[...past,...nowcast];setHost(d.host);setFrames(items);setLatestObserved(last);setIndex(Math.max(0,past.length-1));setSource('rainviewer')}).catch(()=>{setFrames([]);setHost('')});return()=>{alive=false}},[lat,lon,inDwdCoverage]);
 const frame=frames[index],future=!!frame&&frame.time>latestObserved,minutesAhead=future?Math.max(0,Math.round((frame.time-latestObserved)/60)):0;
 const rainViewerUrl=frame?.path&&host?`${host}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`:'';
 const dwdTime=frame?new Date(frame.time*1000).toISOString():'';
 const hasFuture=frames.some(x=>x.time>latestObserved);
 return <section className="card"><Title eye="Open source Radar" title="Regenradar"/><div className="radarmap"><MapContainer center={[lat,lon]} zoom={7} className="leafletmap" scrollWheelZoom={false}><MoveMap lat={lat} lon={lon}/><TileLayer attribution='&copy; OpenStreetMap-Mitwirkende' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{source==='dwd'&&frame&&<WMSTileLayer key={dwdTime} url="https://maps.dwd.de/geoserver/wms" opacity={opacity/100} params={({layers:'dwd:Radar_rv_product_1x1km_ger',styles:'',format:'image/png',transparent:true,version:'1.3.0',time:dwdTime} as any)} attribution='Radar und Nowcast &copy; DWD'/>}{source==='rainviewer'&&rainViewerUrl&&<TileLayer attribution='Radar &copy; RainViewer' url={rainViewerUrl} opacity={opacity/100}/>}<CircleMarker center={[lat,lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#1f8cff',fillOpacity:0.95}}><Popup>Gewählter Standort</Popup></CircleMarker></MapContainer><div className="radarlegend"><strong>{future?`Niederschlags-Nowcast +${minutesAhead} min`:'Radarintensität'}</strong><small>{source==='dwd'?'DWD-RV-Radar mit offener 0–2-h-Vorhersage.':'OpenStreetMap als Basiskarte, RainViewer als Radar-Ebene.'}</small><span className="scale"/></div></div><div className="radarcontrols"><button className="secondary" disabled={!frames.length||index<=0} onClick={()=>setIndex(i=>Math.max(0,i-1))}>◀</button><div className="range"><small>Zeitschritt {future?`· +${minutesAhead} min`:''}</small><input type="range" min={0} max={Math.max(0,frames.length-1)} value={index} onChange={e=>setIndex(Number(e.target.value))}/></div><time className={future?'future':''}>{frame?new Date(frame.time*1000).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):'–:–'}{future?' Prognose':''}</time><button className="secondary" disabled={!frames.length||index>=frames.length-1} onClick={()=>setIndex(i=>Math.min(frames.length-1,i+1))}>▶</button><div className="range opacity"><small>Radar-Deckkraft</small><input type="range" min={25} max={100} value={opacity} onChange={e=>setOpacity(Number(e.target.value))}/></div></div>{!hasFuture&&source==='rainviewer'&&<small className="source warning">Die öffentliche RainViewer-Schnittstelle stellt derzeit keine Zukunftsframes bereit; außerhalb des DWD-Radarbereichs bleibt die Zeitleiste auf Beobachtungen begrenzt.</small>}<small className="source">Kartenbasis: OpenStreetMap · {source==='dwd'?'Radar/Nowcast: Deutscher Wetterdienst (DWD-RV-Produkt)':'Radar: RainViewer'} · Darstellung kann zeitverzögert oder unvollständig sein; keine amtliche Warnung.</small></section>
}


function severityRank(level:'yellow'|'orange'|'red'|'purple'){return({yellow:1,orange:2,red:3,purple:4} as const)[level]}
type HazardBadgeLevel='yellow'|'orange'|'red'|'purple';
type PrecipType='none'|'drizzle'|'freezingDrizzle'|'rain'|'freezingRain'|'showers'|'snow'|'snowGrains'|'snowShowers'|'sleet'|'sleetShowers'|'thunderstorm'|'thunderstormHail';
type PrecipSample={time?:string;precipitation:number;rain:number;showers:number;snowfall:number;probability:number;code:number};
const KMH_PER_KT=1.852;
const precipMeta:Record<Exclude<PrecipType,'none'>,{label:string;legendClass:string;fill:string}>={
 drizzle:{label:'Sprühregen',legendClass:'drizzle',fill:'url(#drizzleFill)'},
 freezingDrizzle:{label:'Gefrierender Sprühregen',legendClass:'freezing-drizzle',fill:'url(#freezingDrizzlePattern)'},
 rain:{label:'Regen',legendClass:'rain',fill:'url(#rainFill)'},
 freezingRain:{label:'Gefrierender Regen',legendClass:'freezing-rain',fill:'url(#freezingRainPattern)'},
 showers:{label:'Regenschauer',legendClass:'showers',fill:'url(#showersPattern)'},
 snow:{label:'Schneefall',legendClass:'snow',fill:'url(#snowPattern)'},
 snowGrains:{label:'Schneegriesel',legendClass:'snow-grains',fill:'url(#snowGrainsPattern)'},
 snowShowers:{label:'Schneeschauer',legendClass:'snow-showers',fill:'url(#snowShowersPattern)'},
 sleet:{label:'Schneeregen',legendClass:'sleet',fill:'url(#sleetPattern)'},
 sleetShowers:{label:'Schneeregenschauer',legendClass:'sleet-showers',fill:'url(#sleetShowersPattern)'},
 thunderstorm:{label:'Gewitterniederschlag',legendClass:'thunderstorm',fill:'url(#thunderstormPattern)'},
 thunderstormHail:{label:'Gewitter mit Hagel',legendClass:'thunderstorm-hail',fill:'url(#thunderstormHailPattern)'}
};
function gustLevelKt(v:number):HazardBadgeLevel|null{const kmh=v*KMH_PER_KT;if(kmh>=103)return'purple';if(kmh>=89)return'red';if(kmh>=75)return'orange';if(kmh>=50)return'yellow';return null}
function rainLevelMm(v:number):HazardBadgeLevel|null{if(v>=60)return'purple';if(v>=40)return'red';if(v>=25)return'orange';if(v>=15)return'yellow';return null}
function heatLevelC(v:number):HazardBadgeLevel|null{if(v>=46)return'purple';if(v>=41)return'red';if(v>=38)return'orange';if(v>=32)return'yellow';return null}
function uvLevel(v:number):HazardBadgeLevel|null{if(v>=11)return'red';if(v>=8)return'orange';if(v>=6)return'yellow';return null}
function snowLevelCm(v:number):HazardBadgeLevel|null{if(v>=20)return'purple';if(v>=10)return'red';if(v>=5)return'orange';if(v>=1)return'yellow';return null}
function dailyHazards(day:Day,hours:Hour[]){
 const items:{label:string;level:HazardBadgeLevel}[]=[];
 const apparent=hours.length?Math.max(...hours.map(x=>x.apparent).filter(Number.isFinite)):day.max;
 const heat=Math.max(day.max,apparent);
 const uvMax=dayEffectiveUvMax(day,hours);
 const snowSum=hours.reduce((s,x)=>s+Math.max(0,x.snowfall||0),0);
 const gust=day.gust;
 const gustLvl=gustLevelKt(gust); if(gustLvl)items.push({label:`Böen ${Math.round(gust)} kt`,level:gustLvl});
 const rainLvl=rainLevelMm(day.precipitation); if(rainLvl)items.push({label:`${day.precipitation.toFixed(1)} mm`,level:rainLvl});
 const snowLvl=snowLevelCm(snowSum); if(snowLvl)items.push({label:`Schnee ${Math.round(snowSum)} cm`,level:snowLvl});
 const heatLvl=heatLevelC(heat); if(heatLvl)items.push({label:`Gefühlt ${Math.round(heat)}°`,level:heatLvl});
 const uvLvl=uvLevel(uvMax); if(uvLvl)items.push({label:`UV ${Math.round(uvMax)}`,level:uvLvl});
 if([95,96,99].includes(day.code))items.push({label:'Gewitter',level:day.code===99?'red':day.code===96?'orange':'yellow'});
 return items.sort((a,b)=>severityRank(b.level)-severityRank(a.level)).slice(0,3);
}
function dirArrow(deg:number){const to=((deg+180)%360+360)%360;const arrows=['↑','↗','→','↘','↓','↙','←','↖'];return arrows[Math.round(to/45)%8]}
const WMO_PRECIP_TYPE:Partial<Record<number,PrecipType>>={
 51:'drizzle',53:'drizzle',55:'drizzle',
 56:'freezingDrizzle',57:'freezingDrizzle',
 61:'rain',63:'rain',65:'rain',
 66:'freezingRain',67:'freezingRain',
 68:'sleet',69:'sleet',
 71:'snow',73:'snow',75:'snow',77:'snowGrains',
 80:'showers',81:'showers',82:'showers',
 83:'sleetShowers',84:'sleetShowers',
 85:'snowShowers',86:'snowShowers',
 95:'thunderstorm',97:'thunderstorm',
 96:'thunderstormHail',99:'thunderstormHail'
};
function precipitationParts(h:PrecipSample){
 const total=Math.max(0,h.precipitation||0),rainValue=Math.max(0,h.rain||0),showerValue=Math.max(0,h.showers||0),snowCm=Math.max(0,h.snowfall||0),code=Math.round(h.code||0);
 const measurable=total>=.01||rainValue>=.01||showerValue>=.01||snowCm>=.01;
 if(!measurable)return{total,type:'none' as PrecipType,label:'kein Niederschlag',code};
 const baseType=WMO_PRECIP_TYPE[code];
 const hasRain=rainValue>=.05;
 const hasShowers=showerValue>=.05;
 const hasSnow=snowCm>=.05;
 let type:PrecipType;
 // Eindeutige WMO-Kategorien haben Vorrang. Gemischte Formen werden nur
 // bei gleichzeitig messbaren flüssigen und festen Anteilen abgeleitet.
 if(baseType==='thunderstormHail'||baseType==='thunderstorm'||baseType==='freezingDrizzle'||baseType==='freezingRain')type=baseType;
 else if(hasSnow&&(hasShowers||baseType==='showers'||baseType==='snowShowers'||baseType==='sleetShowers'))type='sleetShowers';
 else if(hasSnow&&(hasRain||baseType==='rain'||baseType==='drizzle'||baseType==='snow'||baseType==='sleet'))type='sleet';
 else if(baseType)type=baseType;
 else if(hasShowers)type='showers';
 else if(hasRain||total>=.01)type='rain';
 else if(hasSnow)type='snow';
 else type='none';
 if(type==='none')return{total,type,label:'kein Niederschlag',code};
 const meta=precipMeta[type];
 const amount=type==='snow'||type==='snowShowers'||type==='snowGrains'?`${snowCm.toFixed(1)} cm`:type==='sleet'||type==='sleetShowers'?`${total.toFixed(1)} mm · ${snowCm.toFixed(1)} cm`:`${total.toFixed(1)} mm`;
 return{total,type,label:`${meta.label} ${amount}`,code};
}
function presentPrecipTypes(series:{type:PrecipType}[]){const order:PrecipType[]=['drizzle','freezingDrizzle','rain','freezingRain','showers','sleet','sleetShowers','snow','snowGrains','snowShowers','thunderstorm','thunderstormHail'];return order.filter(t=>series.some(x=>x.type===t)) as Exclude<PrecipType,'none'>[]}
function localTimeLabel(value:number){return new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}
function precipitationNowSummary(minutes:Minute15[],hours:Hour[]){
 const now=Date.now();
 const source=minutes.length?'15-Minuten-Best-Match':'stündlicher Best Match';
 const samples:PrecipSample[]=minutes.length?minutes:hours.slice(currentIndex(hours),currentIndex(hours)+7);
 if(!samples.length)return{probability:0,summary:'Keine Kurzfristdaten verfügbar.',source};
 const timed=samples.map(x=>({...x,ts:new Date(String(x.time)).getTime()})).filter(x=>Number.isFinite(x.ts)).sort((a,b)=>a.ts-b.ts);
 const nearest=timed.reduce((best,x)=>Math.abs(x.ts-now)<Math.abs(best.ts-now)?x:best,timed[0]);
 const stepMs=minutes.length?15*60000:60*60000;
 const horizonEnd=now+6*3600000;
 const relevant=timed.filter(x=>x.ts>=now-stepMs&&x.ts<=horizonEnd);
 const wet=(x:typeof relevant[number])=>{const p=precipitationParts(x);return p.type!=='none'&&(p.total>=.01||x.snowfall>=.01)};
 const groups:{items:typeof relevant}[]=[];
 for(const item of relevant){if(!wet(item))continue;const last=groups.at(-1);if(last&&item.ts-last.items.at(-1)!.ts<=stepMs*1.6)last.items.push(item);else groups.push({items:[item]})}
 const active=groups.find(g=>g.items[0].ts-stepMs<=now&&g.items.at(-1)!.ts>=now);
 const event=active??groups.find(g=>g.items[0].ts>=now);
 if(!event){const maxProb=Math.max(...relevant.map(x=>Number(x.probability)||0),0);return{probability:Number(nearest.probability)||0,summary:maxProb>=30?`Bis zu ${Math.round(maxProb)} % Risiko in den nächsten 6 Stunden; noch kein messbarer Niederschlag im Best Match.`:'Kein messbarer Niederschlag in den nächsten 6 Stunden erwartet.',source}}
 const start=event.items[0].ts-stepMs,end=event.items.at(-1)!.ts;
 const types=[...new Set(event.items.map(x=>precipitationParts(x).type).filter(t=>t!=='none'))] as Exclude<PrecipType,'none'>[];
 const typeText=types.map(t=>precipMeta[t].label).join(' → ');
 const summary=active?`Aktuell ${typeText}; voraussichtlich bis ${localTimeLabel(end)} Uhr.`:`${typeText} voraussichtlich ab ${localTimeLabel(start)} bis ${localTimeLabel(end)} Uhr.`;
 return{probability:Number(nearest.probability)||0,summary,source};
}
function Forecast({days,hours,selected,setSelected,unit}:{days:Day[];hours:Hour[];selected:string;setSelected:(x:string)=>void;unit:WindUnit}){
 const [selectedHour,setSelectedHour]=useState(0);
 const boundaryHourRef=useRef<number|null>(null);
 const forecastDays=days.slice(0,7);
 const allMin=Math.min(...forecastDays.map(x=>x.min)),allMax=Math.max(...forecastDays.map(x=>x.max)),range=Math.max(1,allMax-allMin);
 const p=hours.filter(x=>x.time.startsWith(selected)).slice(0,24);
 useEffect(()=>{if(!p.length)return;if(boundaryHourRef.current!==null){const requested=boundaryHourRef.current;setSelectedHour(requested===23?p.length-1:Math.min(Math.max(0,requested),p.length-1));boundaryHourRef.current=null;return}const now=new Date();const isToday=selected===now.toISOString().slice(0,10);const middayIndex=p.findIndex(x=>x.time.slice(11,13)==='12');const fallback=middayIndex>=0?middayIndex:Math.min(6,Math.max(0,p.length-1));const idx=isToday?p.reduce((best,x,i)=>Math.abs(new Date(x.time).getTime()-now.getTime())<Math.abs(new Date(p[best].time).getTime()-now.getTime())?i:best,0):fallback;setSelectedHour(idx)},[selected,p.length]);
 function moveHour(delta:-1|1){
  const nextIndex=selectedHour+delta;
  if(nextIndex>=0&&nextIndex<p.length){setSelectedHour(nextIndex);return}
  const dayIndex=forecastDays.findIndex(x=>x.date===selected);
  const targetDay=forecastDays[dayIndex+delta];
  if(!targetDay||!hours.some(x=>x.time.startsWith(targetDay.date)))return;
  boundaryHourRef.current=delta>0?0:23;
  setSelected(targetDay.date);
 }
 if(!p.length)return null;
 const precipSeries=p.map(precipitationParts);
 const currentHour=p[Math.min(selectedHour,p.length-1)]??p[0],currentPrecip=precipSeries[Math.min(selectedHour,p.length-1)]??precipitationParts(currentHour);
 const precipLegendTypes=presentPrecipTypes(precipSeries);
 const tMin=Math.floor((Math.min(...p.map(x=>Math.min(x.temperature,x.apparent)))-2)/2)*2,tMax=Math.ceil((Math.max(...p.map(x=>Math.max(x.temperature,x.apparent)))+2)/2)*2,tempRange=Math.max(6,tMax-tMin);
 const rainMax=Math.max(1,...p.map(x=>x.precipitation));
 const W=240,H=148,left=18,right=18,plotW=W-left-right,tempTop=18,tempBottom=74,rainTop=90,rainBottom=124;
 const xAt=(i:number)=>left+(i/Math.max(1,p.length-1))*plotW;
 const yTemp=(v:number)=>tempBottom-((v-tMin)/tempRange)*(tempBottom-tempTop);
 const yRain=(v:number)=>rainBottom-(v/rainMax)*(rainBottom-rainTop);
 const yProb=(v:number)=>rainBottom-(Math.max(0,Math.min(100,v))/100)*(rainBottom-rainTop);
 const tempPath=p.map((x,i)=>`${i?'L':'M'} ${xAt(i)} ${yTemp(x.temperature)}`).join(' ');
 const apparentPath=p.map((x,i)=>`${i?'L':'M'} ${xAt(i)} ${yTemp(x.apparent)}`).join(' ');
 const probabilityPath=p.map((x,i)=>`${i?'L':'M'} ${xAt(i)} ${yProb(x.probability)}`).join(' ');
 const areaPath=`${tempPath} L ${xAt(p.length-1)} ${tempBottom} L ${xAt(0)} ${tempBottom} Z`;
 const iconStep=typeof window!=='undefined'&&window.innerWidth<640?3:2;
 const iconIndices=p.map((_,i)=>i).filter(i=>i===0||i===p.length-1||i%iconStep===0);
 const timeStep=typeof window!=='undefined'&&window.innerWidth<640?4:3;
 const timeIndices=p.map((_,i)=>i).filter(i=>i===0||i===p.length-1||i%timeStep===0);
 const maxIdx=p.reduce((b,x,i)=>x.temperature>p[b].temperature?i:b,0),minIdx=p.reduce((b,x,i)=>x.temperature<p[b].temperature?i:b,0);
 const totalRain=p.reduce((a,b)=>a+b.precipitation,0),maxProb=Math.max(...p.map(x=>x.probability)),gustMax=Math.max(...p.map(x=>x.gust)),windMax=Math.max(...p.map(x=>x.wind));
 const selectedDay=days.find(x=>x.date===selected)??days[0];
 const selectedCharacter=dayWeatherCharacter(selectedDay,p);
 return <section className="card"><Title eye="Best Match · seamless" title="7-Tage-Vorhersage"/>
   <div className="forecastrows">{forecastDays.map(d=>{const dt=new Date(`${d.date}T12:00:00`);const leftPct=((d.min-allMin)/range)*100;const widthPct=(Math.max(1,d.max-d.min)/range)*100;const dayHours=hours.filter(x=>x.time.startsWith(d.date)),character=dayWeatherCharacter(d,dayHours),hz=dailyHazards(d,dayHours);return <button className={`forecastrow ${selected===d.date?'active':''}`} key={d.date} onClick={()=>setSelected(d.date)}>
      <div className="forecast-date"><strong>{dt.toLocaleDateString('de-DE',{weekday:'short'})}</strong><small>{dt.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</small></div>
      <div className="forecast-icon"><span>{icon(character.code)}</span><small>{character.label}</small>{character.secondary&&<em>{character.secondary}</em>}</div>
      <div className="forecast-meta"><span>💧 {d.precipitation.toFixed(1)} mm · {Math.round(d.probability)} %</span><span>🌬️ {dirArrow(d.direction)} {wind(d.wind,unit)} · Böen {wind(d.gust,unit)}</span></div>
      <div className="forecast-barwrap"><b>{Math.round(d.min)}°</b><div className="forecast-barbg"><div className="forecast-bar" style={{left:`${leftPct}%`,width:`${Math.max(8,widthPct)}%`}}/></div><strong>{Math.round(d.max)}°</strong></div>
      <div className="forecast-hazards">{hz.length?hz.map((h,i)=><span key={i} className={h.level}>{h.label}</span>):<span className="none">keine markanten Hazards</span>}</div>
   </button>})}</div>
   <div className="hourdetail meteogram-day">
     <div className="detailhead"><strong>{new Date(`${selectedDay.date}T12:00:00`).toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'})} · Detailansicht</strong><small>Aktuelle Stunde ist vorausgewählt. Das Diagramm ist stündlich anklickbar. Die Detailanzeige bleibt geöffnet und aktualisiert sich direkt beim Wechsel der Stunde.</small></div>
     <div className="quickfacts"><span>{icon(selectedCharacter.code)} <b>{selectedCharacter.label}</b>{selectedCharacter.secondary&&<small>{selectedCharacter.secondary}</small>}</span><span>Σ Niederschlag <b>{totalRain.toFixed(1)} mm</b></span><span>max. Niederschlagswahrscheinlichkeit <b>{Math.round(maxProb)} %</b></span><span>max. Wind / Böen <b>{wind(windMax,unit)} · {wind(gustMax,unit)}</b></span></div>
     <div className="detaillegend"><span><i className="temp"/> Temperatur</span><span><i className="apparent"/> Gefühlt</span>{precipLegendTypes.map(type=><span key={type}><i className={precipMeta[type].legendClass}/>{precipMeta[type].label}</span>)}<span><i className="probability"/> Niederschlagswahrscheinlichkeit</span></div>
     <div className="meteogram-stage">
     <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="meteogramsvg">
       <defs>
        <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff9b55" stopOpacity="0.42"/><stop offset="100%" stopColor="#ff9b55" stopOpacity="0.04"/></linearGradient>
        <linearGradient id="rainFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4aa3ff" stopOpacity="0.96"/><stop offset="100%" stopColor="#235f9c" stopOpacity="0.72"/></linearGradient>
        <linearGradient id="drizzleFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#86c9ff" stopOpacity="0.92"/><stop offset="100%" stopColor="#4e8ec7" stopOpacity="0.55"/></linearGradient>
        <pattern id="freezingDrizzlePattern" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#75c9ff"/><path d="M0 5L5 0" stroke="#e9fbff" strokeWidth="1"/><circle cx="1.2" cy="1.2" r=".55" fill="#fff"/></pattern>
        <pattern id="freezingRainPattern" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#357fd1"/><path d="M0 5L5 0" stroke="#d9f5ff" strokeWidth="1.2"/><circle cx="3.8" cy="3.8" r=".65" fill="#fff"/></pattern>
        <pattern id="showersPattern" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="4" fill="#26c6f7"/><rect width="1.3" height="4" fill="#087ba6" opacity="0.85"/></pattern>
        <pattern id="snowPattern" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#c8dcff" opacity="0.88"/><circle cx="1.2" cy="1.2" r="0.65" fill="#ffffff"/><circle cx="3.8" cy="3.6" r="0.65" fill="#ffffff"/></pattern>
        <pattern id="snowGrainsPattern" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#dce9ff"/><rect x="1" y="1" width="1.2" height="1.2" rx=".2" fill="#fff"/><rect x="3.2" y="3.1" width="1.2" height="1.2" rx=".2" fill="#fff"/></pattern>
        <pattern id="snowShowersPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#d7e8ff"/><rect width="1.3" height="6" fill="#3bc6f3" opacity="0.72"/><circle cx="4.8" cy="1.6" r="0.7" fill="#ffffff"/><circle cx="2.4" cy="4.6" r="0.7" fill="#ffffff"/></pattern>
        <pattern id="sleetPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="6" height="6" fill="#7eb7ff" opacity="0.9"/><rect width="1.4" height="6" fill="#f4f7ff" opacity="0.95"/></pattern>
        <pattern id="sleetShowersPattern" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#90c4ff" opacity="0.9"/><rect width="1.3" height="6" fill="#2ec9f5" opacity="0.85"/><circle cx="4.8" cy="1.6" r="0.7" fill="#ffffff"/><circle cx="2.3" cy="4.3" r="0.7" fill="#ffffff"/></pattern>
        <pattern id="thunderstormPattern" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#5865d8"/><path d="M1 0L3 2H2L4 6" stroke="#ffe56b" strokeWidth="1" fill="none"/></pattern>
        <pattern id="thunderstormHailPattern" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#6147a8"/><path d="M1 0L3 2H2L4 6" stroke="#ffe56b" strokeWidth="1" fill="none"/><circle cx="5" cy="1.2" r=".7" fill="#fff"/></pattern>
       </defs>
       {[0,1,2,3,4].map(i=>{const y=tempTop+i*(tempBottom-tempTop)/4,val=(tMax-(tempRange/4)*i);return <g key={i}><line x1={left} x2={W-right} y1={y} y2={y} stroke="currentColor" opacity="0.12"/><text x="3.5" y={y+1.8} fontSize="4.0" fill="currentColor" opacity="0.82">{Math.round(val)}°C</text></g>})}
       {[0,1,2].map(i=>{const y=rainTop+i*(rainBottom-rainTop)/2,val=(rainMax/2)*(2-i),prob=(2-i)*50;return <g key={i}><line x1={left} x2={W-right} y1={y} y2={y} stroke="currentColor" opacity="0.09"/><text x="3.5" y={y+1.6} fontSize="3.6" fill="currentColor" opacity="0.68">{val===0?0:val.toFixed(1)} mm</text><text x={W-0.5} y={y+1.6} textAnchor="end" fontSize="3.6" fill="#56d7ff" opacity="0.82">{prob} %</text></g>})}
       {timeIndices.map(i=><line key={i} x1={xAt(i)} x2={xAt(i)} y1={tempTop} y2={rainBottom} stroke="currentColor" opacity="0.08" strokeDasharray="2 2"/>)}
       {p.map((x,i)=>{const x0=xAt(i),w=Math.max(2.8,plotW/24-1.2),parts=precipSeries[i],totalTop=yRain(parts.total),fill=parts.type!=='none'?precipMeta[parts.type].fill:'';return <g key={x.time}>{parts.total>.001&&parts.type!=='none'&&<rect x={Math.max(left,x0-w/2)} y={totalTop} width={w} height={Math.max(.45,rainBottom-totalTop)} rx="0.7" fill={fill}/>}</g>})}
       <path d={areaPath} fill="url(#tempFill)"/>
       <path d={apparentPath} fill="none" stroke="var(--apparent-line)" opacity="0.96" strokeDasharray="5 4" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/>
       <path d={tempPath} fill="none" stroke="#ff7a37" strokeWidth="1.8" vectorEffect="non-scaling-stroke"/><path d={probabilityPath} fill="none" stroke="#56d7ff" strokeWidth="1.5" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/>
       {iconIndices.map(i=><g key={i}><text x={xAt(i)} y="13" textAnchor="middle" fontSize="5.2">{icon(p[i].code,p[i].isDay)}</text></g>)}
       {timeIndices.map(i=><g key={i}><text x={xAt(i)} y="133" textAnchor="middle" fontSize="3.8" fill="currentColor" opacity="0.86">{p[i].time.slice(11,13)}:00</text></g>)}
       {[minIdx,maxIdx].map(i=><g key={i}><circle cx={xAt(i)} cy={yTemp(p[i].temperature)} r="1.7" fill="#fff" stroke="#ff7a37" strokeWidth="1"/><text x={xAt(i)} y={yTemp(p[i].temperature)-3.5} textAnchor="middle" fontSize="4.2" fill="#ffb37a">{Math.round(p[i].temperature)}°</text></g>)}
       {p.map((x,i)=>{const x0=i===0?left:(xAt(i-1)+xAt(i))/2,x1=i===p.length-1?W-right:(xAt(i)+xAt(i+1))/2;return <rect key={`hit${x.time}`} x={x0} y="0" width={Math.max(1,x1-x0)} height={H} fill="transparent" className="hour-hit" onClick={()=>setSelectedHour(i)}><title>{`${x.time.slice(11,16)} · ${Math.round(x.temperature)} °C · ${Math.round(x.probability)} % Niederschlagswahrscheinlichkeit · ${wind(x.wind,unit)}, Böen ${wind(x.gust,unit)}`}</title></rect>})}
       <line x1={xAt(selectedHour)} x2={xAt(selectedHour)} y1={tempTop} y2={rainBottom} stroke="#9ad0ff" opacity="0.85" strokeWidth="1.2"/>
       <circle cx={xAt(selectedHour)} cy={yTemp(currentHour.temperature)} r="2.1" fill="#fff" stroke="#9ad0ff" strokeWidth="1.1"/><circle cx={xAt(selectedHour)} cy={yProb(currentHour.probability)} r="1.7" fill="#56d7ff" stroke="#ffffff" strokeWidth="0.7"/>
     </svg>
     <div className="hour-chart-tooltip persistent" role="status" aria-live="polite" aria-label={`Details für ${currentHour.time.slice(11,16)} Uhr`}>
       <header><button type="button" onClick={()=>moveHour(-1)} aria-label="Vorherige Stunde">‹</button><div><small>{currentHour.time.slice(11,16)} Uhr</small><strong>{icon(currentHour.code,currentHour.isDay)} {label(currentHour.code)}</strong></div><button type="button" onClick={()=>moveHour(1)} aria-label="Nächste Stunde">›</button></header>
       <div className="hour-tooltip-grid compact"><span><small>Temperatur / gefühlt</small><b>{Math.round(currentHour.temperature)}° / {Math.round(currentHour.apparent)}°</b></span><span><small>Niederschlag</small><b>{currentHour.precipitation.toFixed(1)} mm · {Math.round(currentHour.probability)} %</b><em>{currentPrecip.label}</em></span><span><small>Wind / Böen</small><b>{dirArrow(currentHour.direction)} {wind(currentHour.wind,unit)} · {wind(currentHour.gust,unit)}</b></span><span><small>Feuchte / Taupunkt</small><b>{Math.round(currentHour.humidity)} % · {Math.round(currentHour.dewPoint)}°</b></span><span><small>Bewölkung</small><b>{cloudOktas(currentHour.cloud)}/8</b><em>{cloudOktasText(currentHour.cloud).split(' · ')[1]}</em></span><span><small>UV-Index</small><b>{currentHour.uvIndex.toFixed(1)}</b></span></div>
     </div>
     </div>
   </div>
 </section>}

function niceRainScale(maxValue:number){
 const raw=Math.max(1,maxValue),steps=[1,2,5,10,20,50],target=raw/4;
 const step=steps.find(x=>x>=target)??Math.ceil(target/10)*10;
 const max=Math.ceil(raw/step)*step;
 return{max,ticks:Array.from({length:max/step+1},(_,i)=>i*step)};
}
function clamp(v:number,min:number,max:number){return Math.min(max,Math.max(min,v))}
function confidenceColor(v:number){
 const value=Math.max(0,Math.min(100,v));
 const stops=[
  {v:0,c:[232,54,54]},
  {v:25,c:[244,125,48]},
  {v:50,c:[242,201,76]},
  {v:70,c:[199,214,54]},
  {v:85,c:[100,190,65]},
  {v:100,c:[45,193,90]}
 ];
 let a=stops[0],b=stops[stops.length-1];
 for(let i=0;i<stops.length-1;i++){if(value>=stops[i].v&&value<=stops[i+1].v){a=stops[i];b=stops[i+1];break}}
 const t=(value-a.v)/Math.max(1,b.v-a.v);
 const rgb=a.c.map((x,i)=>Math.round(x+(b.c[i]-x)*t));
 return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}
function TrendTooltip({active,payload,label,showEnsMean,showClimatology}:{active?:boolean;payload?:any[];label?:string;showEnsMean:boolean;showClimatology:boolean}){if(!active||!payload?.length)return null;const row=payload[0]?.payload;return <div className="charttooltip trend-tooltip"><strong>{label}</strong><div className="tooltip-group"><b>Best Match</b><span>Tmin: {row.bestMin?.toFixed(1)??'–'} °C</span><span>Tmax: {row.bestMax?.toFixed(1)??'–'} °C</span></div>{showEnsMean&&<div className="tooltip-group"><b>ENS-Mittel</b><span>Tmin: {row.minMean.toFixed(1)} °C</span><span>Tmax: {row.maxMean.toFixed(1)} °C</span></div>}{showClimatology&&Number.isFinite(row.climateMin)&&<div className="tooltip-group"><b>Klimatologisches Mittel 1991–2020</b><span>Tmin: {row.climateMin.toFixed(1)} °C</span><span>Tmax: {row.climateMax.toFixed(1)} °C</span></div>}<div className="tooltip-group"><b>P10–P90</b><span>Tmin: {row.minLow.toFixed(1)} bis {row.minHigh.toFixed(1)} °C</span><span>Tmax: {row.maxLow.toFixed(1)} bis {row.maxHigh.toFixed(1)} °C</span></div><div className="tooltip-group compact"><span><b>Prognosekonsistenz:</b> {Math.round(row.confidence)} % ({row.modelCount} Modelle{row.memberCount?` · ${row.memberCount} Mitglieder`:''})</span></div></div>}
function TemperatureLegend({showEnsMean,setShowEnsMean,showClimatology,setShowClimatology}:{showEnsMean:boolean;setShowEnsMean:(v:boolean)=>void;showClimatology:boolean;setShowClimatology:(v:boolean)=>void}){return <div className="trend-legend"><span><i className="area max"/>ENS-Spanne Tmax</span><span><i className="area min"/>ENS-Spanne Tmin</span><span><i className="line best-max"/>Best Match Tmax</span><span><i className="line best-min"/>Best Match Tmin</span><button type="button" className={showEnsMean?'':'inactive'} onClick={()=>setShowEnsMean(!showEnsMean)} aria-pressed={showEnsMean}><i className="line ens-max"/>ENS-Mittel</button><button type="button" className={showClimatology?'':'inactive'} onClick={()=>setShowClimatology(!showClimatology)} aria-pressed={showClimatology}><i className="line climate"/>Klimamittel Tmin/Tmax</button></div>}
function CombinedTrendChart({data,showEnsMean,setShowEnsMean,showClimatology,setShowClimatology}:{data:any[];showEnsMean:boolean;setShowEnsMean:(v:boolean)=>void;showClimatology:boolean;setShowClimatology:(v:boolean)=>void}){const vals=data.flatMap(r=>[r.maxLow,r.maxHigh,r.minLow,r.minHigh,r.bestMax,r.bestMin,showEnsMean?r.maxMean:NaN,showEnsMean?r.minMean:NaN,showClimatology?r.climateMax:NaN,showClimatology?r.climateMin:NaN]).filter((v:number)=>Number.isFinite(v));const minV=Math.floor((Math.min(...vals)-2)/2)*2,maxV=Math.ceil((Math.max(...vals)+2)/2)*2;const ticks=[] as number[];for(let v=minV;v<=maxV;v+=2)ticks.push(v);return <div className="chart trend-combined"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data} margin={{top:14,right:18,left:10,bottom:34}}><CartesianGrid strokeDasharray="3 3" opacity={.22}/><XAxis dataKey="label" tick={{fontSize:11}} interval={0} label={{value:'Vorhersagetag',position:'insideBottom',offset:-22}}/><YAxis yAxisId="t" domain={[minV,maxV]} ticks={ticks} tick={{fontSize:11}} width={66} tickFormatter={(v)=>`${v}°C`} label={{value:'Temperatur (°C)',angle:-90,position:'insideLeft',offset:4}}/><Tooltip content={<TrendTooltip showEnsMean={showEnsMean} showClimatology={showClimatology}/>}/><Legend verticalAlign="top" height={70} content={<TemperatureLegend showEnsMean={showEnsMean} setShowEnsMean={setShowEnsMean} showClimatology={showClimatology} setShowClimatology={setShowClimatology}/>}/><Area yAxisId="t" stackId="max" type="monotone" dataKey="maxLow" stroke="none" fill="transparent" legendType="none"/><Area yAxisId="t" stackId="max" type="monotone" dataKey="maxBand" stroke="none" fill="#ff845f" fillOpacity={0.22} legendType="none"/><Area yAxisId="t" stackId="min" type="monotone" dataKey="minLow" stroke="none" fill="transparent" legendType="none"/><Area yAxisId="t" stackId="min" type="monotone" dataKey="minBand" stroke="none" fill="#53a9ff" fillOpacity={0.22} legendType="none"/><Line yAxisId="t" hide={!showEnsMean} type="monotone" dataKey="maxMean" stroke="#ffb07b" strokeWidth={1.7} strokeDasharray="5 4" dot={false} legendType="none"/><Line yAxisId="t" hide={!showEnsMean} type="monotone" dataKey="minMean" stroke="#92cfff" strokeWidth={1.7} strokeDasharray="5 4" dot={false} legendType="none"/><Line yAxisId="t" hide={!showClimatology} type="monotone" dataKey="climateMax" stroke="#a86d16" strokeWidth={2.1} strokeDasharray="2 4" dot={false} connectNulls legendType="none"/><Line yAxisId="t" hide={!showClimatology} type="monotone" dataKey="climateMin" stroke="#6c61a8" strokeWidth={2.1} strokeDasharray="2 4" dot={false} connectNulls legendType="none"/><Line yAxisId="t" type="monotone" dataKey="bestMax" stroke="#ff6a37" strokeWidth={3.1} dot={{r:2.4}} connectNulls legendType="none"/><Line yAxisId="t" type="monotone" dataKey="bestMin" stroke="#248dff" strokeWidth={3.1} dot={{r:2.4}} connectNulls legendType="none"/></ComposedChart></ResponsiveContainer></div>}

function RainTooltip({active,payload,label}:{active?:boolean;payload?:any[];label?:string}){if(!active||!payload?.length)return null;const row=payload[0]?.payload;return <div className="charttooltip"><strong>{label}</strong><span>Best Match: {Number(row.bestPrecipitation).toFixed(1)} mm</span><span>P10–P90: {Number(row.precipitationLow).toFixed(1)} bis {Number(row.precipitationHigh).toFixed(1)} mm</span><span>Ensemble-Mittel: {Number(row.precipitationMean).toFixed(1)} mm</span><span>Niederschlagswahrscheinlichkeit: {Math.round(Number(row.precipitationProbability))} %</span></div>}
function RainLegend({showProbability,onToggle}:{showProbability:boolean;onToggle:()=>void}){return <div className="rain-legend"><span><i className="bar"/>Best Match</span><span><i className="line low"/>P10</span><span><i className="line high"/>P90</span><button type="button" className={showProbability?'':'inactive'} onClick={onToggle} aria-pressed={showProbability} title="Niederschlagswahrscheinlichkeit ein-/ausblenden"><i className="line probability"/>Niederschlagswahrscheinlichkeit</button></div>}
function Ensembles({data,models,days,climate,climateLoading,climateError,loading,error}:{data:EnsembleDay[];models:string[];days:Day[];climate:ClimateDay[];climateLoading:boolean;climateError:string;loading:boolean;error:string}){
 const[showRainProbability,setShowRainProbability]=useState(true),[showEnsMean,setShowEnsMean]=useState(true),[showClimatology,setShowClimatology]=useState(true);
 const climateMap=new Map(climate.map(x=>[x.date,x]));
 const best=new Map(days.map(x=>[x.date,x]));
 const maxModels=Math.max(1,models.length);
 const d=data.filter(x=>best.has(x.date)).slice(0,14).map((x,index)=>{
  const day=best.get(x.date)!;
  const bestMax=day.max,bestMin=day.min,bestPrecipitation=day.precipitation,maxLow=x.maxLow,maxHigh=x.maxHigh,minLow=x.minLow,minHigh=x.minHigh;
  const spread=Math.max(0,((maxHigh-maxLow)+(minHigh-minLow))/2);
  const scoreSpread=clamp(100-spread*7.5,25,97),scoreLead=clamp(100-index*3.7,45,100),scoreModels=clamp(55+(x.modelCount/maxModels)*45,55,100);
  const confidence=Math.round(clamp(scoreSpread*.48+scoreLead*.22+scoreModels*.30,25,97));
  const dt=new Date(`${x.date}T12:00:00`);
  const climateDay=climateMap.get(x.date);return{...x,climateMax:climateDay?.maxMean,climateMin:climateDay?.minMean,label:dt.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit'}),weekday:dt.toLocaleDateString('de-DE',{weekday:'short'}),dayLabel:dt.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'}),bestMax,bestMin,bestPrecipitation,code:day.code,maxBand:Math.max(.2,maxHigh-maxLow),minBand:Math.max(.2,minHigh-minLow),confidence}
 });
 const fallback=days.slice(0,14),fallbackMin=Math.min(...fallback.map(x=>x.min)),fallbackMax=Math.max(...fallback.map(x=>x.max)),fallbackRange=Math.max(1,fallbackMax-fallbackMin);
 if(!d.length)return <section className="card ensemble"><Title eye={loading?'ENS-Modelle werden geladen':'ENS-Datenstatus'} title="14-Tage-Ensemble-Trend"/><div className={`ensemble-status ${loading?'loading':''}`}><RefreshCw className={loading?'spin':''}/><div><strong>{loading?'Ensemble-Daten werden berechnet …':'Ensemble-Auswertung derzeit nicht vollständig verfügbar'}</strong><span>{loading?'Die 14-Tage-Übersicht wird automatisch ergänzt, sobald genügend Modellläufe vorliegen.':error||'Best Match bleibt als vorläufige Referenz sichtbar.'}</span></div></div><div className="charthead"><h3>14-Tage-Übersicht</h3><p>Vorläufige Best-Match-Spanne; Konsistenzpunkte erscheinen nach erfolgreicher Ensemble-Auswertung.</p></div><div className="ens-overview-grid fallback">{fallback.map(x=>{const dt=new Date(`${x.date}T12:00:00`),left=((x.min-fallbackMin)/fallbackRange)*100,width=((x.max-x.min)/fallbackRange)*100;return <article className="ens-card" key={x.date}><header><div><strong>{dt.toLocaleDateString('de-DE',{weekday:'short'})}</strong><small>{dt.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</small></div><span className="dot pending"/></header><div className="wx">{icon(x.code,true)}</div><div className="barzone"><div className="barbg"><div className="bestrange" style={{left:`${left}%`,width:`${Math.max(8,width)}%`}}/></div></div><div className="temps"><b>{Math.round(x.min)}°</b><strong>{Math.round(x.max)}°</strong></div><small>{label(x.code)}</small></article>})}</div></section>;
 const rainScale=niceRainScale(Math.max(...d.map(x=>Math.max(x.bestPrecipitation,x.precipitationHigh)),1));
 const overallMin=Math.floor((Math.min(...d.map(x=>Math.min(x.minLow,x.bestMin)))-2)/2)*2,overallMax=Math.ceil((Math.max(...d.map(x=>Math.max(x.maxHigh,x.bestMax)))+2)/2)*2,range=Math.max(1,overallMax-overallMin);
 const hasMembers=d.some(x=>x.memberCount>0),summaryMembers=Math.round(d.reduce((s,x)=>s+x.memberCount,0)/d.length);
 return <section className="card ensemble"><Title eye={`${models.length} verfügbare ENS-Modelle`} title="14-Tage-Ensemble-Trend"/>
  <div className="chips">{models.map(x=><span key={x}>{x}</span>)}</div>
  <div className="charthead"><h3>14-Tage-Ensemble-Übersicht</h3><p>Best Match, gewichtetes P10–P90-Intervall und farbiger Konsistenzpunkt pro Tag.</p></div>
  <div className="ens-summary">{hasMembers?<span><b>{summaryMembers}</b> Ensemble-Mitglieder pro Tag im Mittel</span>:<span><b>{models.length}</b> verfügbare Modellmittel</span>}<span><b>{models.length}</b> Modellfamilien aktiv</span></div>
  <div className="consistency-legend" aria-label="Legende der Prognosekonsistenz"><span>gering</span><i/><span>hoch</span><small>0&nbsp;%</small><small>25&nbsp;%</small><small>50&nbsp;%</small><small>75&nbsp;%</small><small>100&nbsp;%</small></div>
  <div className="ens-overview-grid">{d.map(x=>{const ensLeft=((x.minLow-overallMin)/range)*100,ensWidth=((x.maxHigh-x.minLow)/range)*100,bestLeft=((x.bestMin-overallMin)/range)*100,bestWidth=((x.bestMax-x.bestMin)/range)*100;return <article key={x.date} className="ens-card" title={`Prognosekonsistenz ${x.confidence} % · Niederschlagswahrscheinlichkeit ${Math.round(x.precipitationProbability)} % · ${x.modelCount} Modelle${x.memberCount?` · ${x.memberCount} Mitglieder`:''}`}><header><div><strong>{x.weekday}</strong><small>{x.dayLabel}</small></div><span className="dot" style={{background:confidenceColor(x.confidence),boxShadow:`0 0 0 4px color-mix(in srgb, ${confidenceColor(x.confidence)} 18%, transparent)`}} aria-label={`Prognosekonsistenz ${x.confidence} Prozent`}/></header><div className="wx">{icon(x.code,true)}</div><div className="barzone"><div className="barbg"><div className="ensspread" style={{left:`${Math.max(0,ensLeft)}%`,width:`${Math.max(6,ensWidth)}%`}}/><div className="bestrange" style={{left:`${Math.max(0,bestLeft)}%`,width:`${Math.max(8,bestWidth)}%`}}/></div></div><div className="temps"><b>{Math.round(x.bestMin)}°</b><strong>{Math.round(x.bestMax)}°</strong></div><small>{label(x.code)}</small><span className="ens-rainprob">💧 {Math.round(x.precipitationProbability)} %</span></article>})}</div>
  <div className="enslegend"><span><i className="swatch ensemble"/> P10–P90-Temperaturbereich</span><span><i className="swatch best"/> Best-Match Min–Max</span></div>
  <div className="charthead"><h3>Temperaturtrend und Prognoseunsicherheit</h3><p>Best Match, P10–P90, optionales ENS-Mittel und klimatologisches Tagesmittel 1991–2020.{climateLoading?' Klimadaten werden geladen …':climateError?' Klimamittel derzeit nicht verfügbar.':''}</p></div><CombinedTrendChart data={d} showEnsMean={showEnsMean} setShowEnsMean={setShowEnsMean} showClimatology={showClimatology&&climate.length>0} setShowClimatology={setShowClimatology}/>
  <div className="charthead"><h3>Niederschlag</h3><p>Täglicher Best-Match-Niederschlag für den Ort, ergänzt um gewichtetes P10–P90-Intervall und Niederschlagswahrscheinlichkeit.</p></div><div className="chart rain"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={d} margin={{top:16,right:18,left:12,bottom:36}}><CartesianGrid strokeDasharray="3 3" opacity={.22}/><XAxis dataKey="label" tick={{fontSize:11}} interval={0} label={{value:'Vorhersagetag',position:'insideBottom',offset:-24}}/><YAxis yAxisId="mm" domain={[0,rainScale.max]} ticks={rainScale.ticks} tick={{fontSize:11}} width={68} tickFormatter={(v)=>`${v} mm`} label={{value:'Niederschlag (mm)',angle:-90,position:'insideLeft',offset:4}}/><YAxis yAxisId="prob" orientation="right" hide={!showRainProbability} domain={[0,100]} ticks={[0,25,50,75,100]} tick={{fontSize:11}} width={showRainProbability?58:0} tickFormatter={(v)=>`${v} %`} label={{value:'Wahrscheinlichkeit',angle:90,position:'insideRight',offset:4}}/><Tooltip content={<RainTooltip/>}/><Legend verticalAlign="top" height={44} content={<RainLegend showProbability={showRainProbability} onToggle={()=>setShowRainProbability(v=>!v)}/>}/><Bar yAxisId="mm" dataKey="bestPrecipitation" name="bestPrecipitation" fill="#2688ff" radius={[5,5,0,0]}/><Line yAxisId="mm" type="monotone" dataKey="precipitationLow" name="precipitationLow" stroke="#7d8aa0" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/><Line yAxisId="mm" type="monotone" dataKey="precipitationHigh" name="precipitationHigh" stroke="#c4d0df" strokeWidth={2.2} dot={{r:2}}/><Line yAxisId="prob" hide={!showRainProbability} type="monotone" dataKey="precipitationProbability" name="precipitationProbability" stroke="#48d3ff" strokeWidth={2.4} dot={{r:2.4}}/></ComposedChart></ResponsiveContainer></div></section>
}


function Widget({loc,days,hours,unit}:{loc:Location;days:Day[];hours:Hour[];unit:WindUnit}){
 const[n,setN]=useState(4),[dark,setDark]=useState(true),[showWind,setShowWind]=useState(true),[showRain,setShowRain]=useState(true),[showHazards,setShowHazards]=useState(true),ref=useRef<HTMLDivElement>(null);
 const previewDays=days.slice(0,n).map(d=>{const dayHours=hours.filter(x=>x.time.startsWith(d.date));return{...d,hz:dailyHazards(d,dayHours),character:dayWeatherCharacter(d,dayHours)}});
 const widgetWidth=Math.max(360,112+n*82);
 async function png(){if(!ref.current)return;const u=await toPng(ref.current,{pixelRatio:2,cacheBust:true,backgroundColor:dark?'#07111f':'#f7fbff',width:ref.current.scrollWidth,height:ref.current.scrollHeight}),a=document.createElement('a');a.download=`wetter-widget-${loc.name.toLowerCase().replace(/[^a-z0-9]+/gi,'-')}-${n}tage.png`;a.href=u;a.click()}
 return <section className="card widget"><Title eye="Konfigurierbar und exportierbar" title="Widget- und PNG-Generator"/><div className="widgetlayout"><aside className="widget-controls"><label>Tage<select value={n} onChange={e=>setN(Number(e.target.value))}>{[3,4,5,6,7].map(x=><option key={x}>{x}</option>)}</select></label><label><input type="checkbox" checked={dark} onChange={e=>setDark(e.target.checked)}/>Dunkles Widget</label><label><input type="checkbox" checked={showWind} onChange={e=>setShowWind(e.target.checked)}/>Wind</label><label><input type="checkbox" checked={showRain} onChange={e=>setShowRain(e.target.checked)}/>Niederschlag</label><label><input type="checkbox" checked={showHazards} onChange={e=>setShowHazards(e.target.checked)}/>Hazards anzeigen</label><small>Die PNG-Größe passt sich automatisch an Anzahl und Inhalt an. Die Tage bleiben kompakt nebeneinander.</small><button className="primary" onClick={png}><Download size={17}/>PNG erstellen</button></aside><div className="preview widget-preview"><div ref={ref} style={{width:`${widgetWidth}px`}} className={`weatherwidget modern compact ${dark?'dark':'light'} ${showHazards?'hazards-on':'hazards-off'}`}><header><div><span>MID Widget</span><strong>{loc.name}</strong><small>{loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E · {Math.round(loc.elevation??0)} m ü. NHN</small></div><b>{n}-Tage-Ausblick</b></header><div className={`widgetgrid days-${n}`}>{previewDays.map(d=>{const dt=new Date(`${d.date}T12:00:00`);return <article key={d.date} className="widgetday"><div className="widgetday-head"><strong>{dt.toLocaleDateString('de-DE',{weekday:'short'})}</strong><small>{dt.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})}</small></div><div className="widgeticon">{icon(d.character.code)}</div><b className="widgetlabel">{d.character.label}</b><div className="widgettemps"><strong>{Math.round(d.max)}°</strong><em>{Math.round(d.min)}°</em></div><div className="widgetmeta">{showRain&&<span>💧 {d.precipitation.toFixed(1)} mm · {Math.round(d.probability)} %</span>}{showWind&&<span>🌬️ {dirArrow(d.direction)} {wind(d.wind,unit)} · Böen {wind(d.gust,unit)}</span>}</div>{showHazards&&<div className="widgethazards">{d.hz.length?d.hz.map((h,i)=><span key={i} className={h.level}>{h.label}</span>):<span className="ok">keine Hazards</span>}</div>}</article>})}</div><footer><span>Open-Meteo · MID v{VERSION}</span><span>{new Date().toLocaleDateString('de-DE')}</span></footer></div></div></div></section>
}
function Title({eye,title}:{eye:string;title:string}){return <header className="title"><div><span>{eye}</span><h2>{title}</h2></div></header>}
