import {useMemo,useState} from 'react';
import {AlertTriangle,Cloud,Clock3,Eye,MapPin,Plane,RefreshCw,Route as RouteIcon,Snowflake,Wind,Zap} from 'lucide-react';
import {fetchWorkerJson} from './workerClient';
import {displayInputFromUtc,displayTimeLabel,formatDisplayDateTime,utcInputFromDisplay} from './timeDisplay';
import {compass,hazardRuns,hazardTransitionWindow,interpolateLevel,nearestRegion,officialSignals,routeOverview,runWhere,verticalHazardDetail,verticalHazardRuns,type CrossSectionData,type HazardRun,type VerticalHazardRun} from './flightRouteBriefing';

const ROUTE_KEY='mid:flightCrossSection:route';
const MODEL_KEY='mid:flightCrossSection:model';
const FL_KEY='mid:flightCrossSection:flightLevel';
const SAMPLES_KEY='mid:flightCrossSection:samples';
const START_KEY='mid:flightCrossSection:start';
const END_KEY='mid:flightCrossSection:end';
const CORRIDOR_KEY='mid:flightCrossSection:corridorKm';

type ModelOption={id:string;label:string;detail:string};
const MODELS:ModelOption[]=[
 {id:'best_match',label:'Best Match',detail:'ortsabhängig optimierte Modellwahl'},
 {id:'dwd_icon_eu',label:'DWD ICON-EU',detail:'Europa · hohe räumliche Auflösung'},
 {id:'ecmwf_ifs',label:'ECMWF IFS',detail:'global · robuste synoptische Entwicklung'},
 {id:'ncep_gfs025',label:'NOAA GFS 0,25°',detail:'global · lange Vorhersage'},
 {id:'dwd_icon',label:'DWD ICON Global',detail:'global · DWD-Modell'}
];

function storageGet(key:string,fallback:string){try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function storageSet(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
function utcInput(date:Date){return date.toISOString().slice(0,16)}
function initialStart(){const saved=storageGet(START_KEY,'');if(saved)return saved;const date=new Date();date.setUTCMinutes(0,0,0);date.setUTCHours(date.getUTCHours()+1);return utcInput(date)}
function initialEnd(start:string){const saved=storageGet(END_KEY,'');if(saved)return saved;const date=new Date(`${start}:00Z`);date.setUTCHours(date.getUTCHours()+2);return utcInput(date)}
function parseUtcInput(value:string){const parsed=Date.parse(`${value}:00Z`);return Number.isFinite(parsed)?new Date(parsed).toISOString():''}
function routeCodes(value:string){return value.toUpperCase().split(/[^A-Z0-9]+/).map(item=>item.trim()).filter(Boolean)}
function timeLabel(value:string){return formatDisplayDateTime(value,undefined,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}
function dateTimeLabel(value:string){return formatDisplayDateTime(value,undefined,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}
function hazardIcon(kind:HazardRun['kind']){if(kind==='icing')return <Snowflake size={17}/>;if(kind==='turbulence'||kind==='wind')return <Wind size={17}/>;if(kind==='convection')return <Zap size={17}/>;if(kind==='visibility')return <Eye size={17}/>;if(kind==='ceiling')return <Cloud size={17}/>;return <Cloud size={17}/>}
function hazardTimeWindow(data:CrossSectionData,run:Pick<HazardRun,'startIndex'|'endIndex'>){const timing=hazardTransitionWindow(data,run),entry=timing.fromRouteStart?'ab Start':`${timeLabel(timing.entryFrom)}–${timeLabel(timing.entryTo)} Uhr`,exit=timing.toRouteEnd?'bis Landung':`${timeLabel(timing.exitFrom)}–${timeLabel(timing.exitTo)} Uhr`;return`Eintritt ${entry} · Austritt ${exit}`}
function verticalHazardIcon(kind:VerticalHazardRun['kind']){if(kind==='icing')return <Snowflake size={17}/>;if(kind==='turbulence'||kind==='wind')return <Wind size={17}/>;if(kind==='convection')return <Zap size={17}/>;return <Cloud size={17}/>}

export default function CrossSectionPanel(){
 const[start,setStart]=useState(initialStart),[end,setEnd]=useState(()=>initialEnd(initialStart())),[route,setRoute]=useState(()=>storageGet(ROUTE_KEY,'EDDG_EDDF')),[flightLevel,setFlightLevel]=useState(()=>Math.max(0,Math.min(550,Number(storageGet(FL_KEY,'100'))||100))),[model,setModel]=useState(()=>storageGet(MODEL_KEY,'best_match')),[samples,setSamples]=useState(()=>Math.max(17,Math.min(49,Number(storageGet(SAMPLES_KEY,'25'))||25))),[corridorKm,setCorridorKm]=useState(()=>Math.max(20,Math.min(120,Number(storageGet(CORRIDOR_KEY,'40'))||40))),[loading,setLoading]=useState(false),[error,setError]=useState(''),[data,setData]=useState<CrossSectionData|null>(null);
 const codes=routeCodes(route),validRoute=codes.length>=2&&codes.length<=8&&codes.every(code=>/^[A-Z]{4}$/.test(code)),modelOption=MODELS.find(item=>item.id===model)??MODELS[0],runs=useMemo(()=>data?hazardRuns(data):[],[data]),verticalRuns=useMemo(()=>data?verticalHazardRuns(data):[],[data]),official=useMemo(()=>data?officialSignals(data):[],[data]),overview=useMemo(()=>data?routeOverview(data,runs):null,[data,runs]);
 async function generate(){
  const startIso=parseUtcInput(start),endIso=parseUtcInput(end);if(!validRoute){setError('Bitte 2 bis 8 gültige ICAO-Kennungen mit Leerzeichen, Bindestrich oder Unterstrich eingeben.');return}if(!startIso||!endIso||Date.parse(endIso)<Date.parse(startIso)){setError('Start- und Landezeit müssen gültig sein; die Landung darf nicht vor dem Start liegen.');return}
  setLoading(true);setError('');storageSet(ROUTE_KEY,codes.join('_'));storageSet(MODEL_KEY,model);storageSet(FL_KEY,String(flightLevel));storageSet(SAMPLES_KEY,String(samples));storageSet(CORRIDOR_KEY,String(corridorKm));storageSet(START_KEY,start);storageSet(END_KEY,end);
  try{const response=await fetchWorkerJson<CrossSectionData>('flight-cross-section',{route:codes.join('_'),start:startIso,end:endIso,flight_level:Math.round(flightLevel),model,samples,corridor_km:Math.round(corridorKm)},{purpose:'meteogram',timeoutMs:62000});setData(response)}catch(reason){setError(reason instanceof Error?reason.message:String(reason))}finally{setLoading(false)}
 }
 return <section className="flight-cross-section flight-route-briefing">
  <header className="flight-section-head"><div><span>Flugmeteorologie</span><h3>Cross Section · Streckenbriefing</h3><p>Gefahren entlang der Route, am gewählten Flugniveau und passend zu Start- und Landezeit.</p></div><span className="flight-source-badge">Modellprofil + ICAO</span></header>
  <form className="flight-cross-form" onSubmit={event=>{event.preventDefault();void generate()}}>
   <label className="flight-route-input"><span>Route · ICAO-Kennungen</span><div><RouteIcon size={16}/><input value={route} onChange={event=>setRoute(event.target.value.toUpperCase())} placeholder="EDDG EDDL EDDF" autoCapitalize="characters" spellCheck={false}/></div><small>2–8 Orte in Flugrichtung; Zwischenpunkte sind möglich.</small></label>
   <label><span>Start · {displayTimeLabel()}</span><input type="datetime-local" value={displayInputFromUtc(start)} onChange={event=>setStart(utcInputFromDisplay(event.target.value))} step="300"/></label>
   <label><span>Landung · {displayTimeLabel()}</span><input type="datetime-local" value={displayInputFromUtc(end)} onChange={event=>setEnd(utcInputFromDisplay(event.target.value))} step="300"/></label>
   <label><span>Flughöhe</span><div className="flight-number-field"><b>FL</b><input type="number" min="0" max="550" step="10" value={flightLevel} onChange={event=>setFlightLevel(Math.max(0,Math.min(550,Number(event.target.value)||0)))}/></div><small>Einheit: Flight Level / 100 ft.</small></label>
   <label><span>Modell</span><select value={model} onChange={event=>setModel(event.target.value)}>{MODELS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{modelOption.detail}</small></label>
   <label><span>Streckendichte</span><select value={samples} onChange={event=>setSamples(Number(event.target.value))}><option value="17">17 · schnell</option><option value="25">25 · ausgewogen</option><option value="33">33 · detailliert</option><option value="41">41 · hoch</option><option value="49">49 · maximal</option></select><small>Mehr Punkte erhöhen Orts- und Zeitauflösung.</small></label>
   <label><span>Analysekorridor</span><select value={corridorKm} onChange={event=>setCorridorKm(Number(event.target.value))}><option value="20">20 km · ±10 km</option><option value="40">40 km · ±20 km</option><option value="60">60 km · ±30 km</option><option value="80">80 km · ±40 km</option><option value="120">120 km · ±60 km</option></select><small>Breiter Korridor reduziert falsche Ortsgenauigkeit und erfasst Hazards neben der Ideallinie.</small></label>
   <button type="submit" className="primary flight-generate" disabled={loading||!validRoute}>{loading?<RefreshCw className="spin" size={16}/>:<Plane size={16}/>} {loading?'Strecke wird analysiert …':'Streckenbriefing erstellen'}</button>
  </form>
  <div className="flight-guide"><AlertTriangle size={15}/><span>Automatisiertes Screening aus Druckniveaumodellen plus verfügbaren ICAO-Flugwetterprodukten. Kein Ersatz für ein vorgeschriebenes amtliches Flugwetterbriefing.</span></div>
  {error&&<div className="error">{error}</div>}
  {data&&overview&&<div className="flight-briefing-result">
   <div className="flight-result-toolbar"><div><b>{data.route.replaceAll('_',' → ')}</b><small>{Math.round(data.totalDistanceKm)} km · FL{String(data.flightLevel).padStart(3,'0')} · {dateTimeLabel(data.startTime)} → {dateTimeLabel(data.endTime)} · {data.modelLabel}</small></div><span className={`flight-briefing-status ${overview.danger?'caution':overview.watch?'watch':'ok'}`}>{overview.danger?`${overview.danger} kritisch`:overview.watch?`${overview.watch} beachten`:'keine markante Modellgefahr'}</span></div>
   <div className="flight-briefing-overview">
    <article><AlertTriangle size={17}/><span><small>Streckenlage</small><strong>{overview.danger} kritisch · {overview.watch} beachten</strong></span></article>
    <article><Wind size={17}/><span><small>Höhenwind</small><strong>max. {Math.round(overview.maxWind)} kt</strong></span></article>
    <article><Cloud size={17}/><span><small>Bewölkung am FL</small><strong>Ø {Math.round(overview.meanCloud)} %</strong></span></article>
    <article><Snowflake size={17}/><span><small>Nullgradniveau</small><strong>{overview.freezingMin===null?'–':`FL${Math.round(overview.freezingMin)}–${Math.round(overview.freezingMax??overview.freezingMin)}`}</strong></span></article>
   </div>
   <section className="flight-route-hazards"><header><div><AlertTriangle size={18}/><span><small>MODELLDIAGNOSTIK AM GEWÄHLTEN FL</small><strong>Wann und in welchem größeren Raum ist etwas zu erwarten?</strong></span></div></header>{runs.length?<div className="flight-route-hazard-list">{runs.map((run,index)=><article key={`${run.kind}-${run.startIndex}-${index}`} className={run.severity}><div className="flight-route-hazard-icon">{hazardIcon(run.kind)}</div><div><header><strong>{run.label}</strong><span>{run.severity==='caution'?'kritisch':'beachten'}</span></header><p>{run.detail}</p><footer><span><MapPin size={13}/>{runWhere(data,run)}</span><span><Clock3 size={13}/>{hazardTimeWindow(data,run)}</span></footer></div></article>)}</div>:<div className="flight-route-clear"><Plane size={19}/><span><strong>Keine markante Modellgefahr am gewählten Flugprofil.</strong><small>Amtliche Meldungen und lokale Start-/Landebedingungen trotzdem separat prüfen.</small></span></div>}</section>
   <section className="flight-route-hazards flight-route-vertical"><header><div><Cloud size={18}/><span><small>VERTIKALPROFIL · TEXTBRIEFING</small><strong>Bewölkung, Vereisung, Turbulenz, Konvektion und Wind über die Höhe</strong></span></div></header>{verticalRuns.length?<div className="flight-route-hazard-list vertical">{verticalRuns.map((run,index)=><article key={`vertical-${run.kind}-${run.startIndex}-${index}`} className={run.severity}><div className="flight-route-hazard-icon">{verticalHazardIcon(run.kind)}</div><div><header><strong>{run.label}</strong><span>{run.severity==='caution'?'kritisch':'beachten'}</span></header><p>{verticalHazardDetail(run,data.corridorKm??corridorKm)}</p><footer><span><MapPin size={13}/>{runWhere(data,run)}</span><span><Clock3 size={13}/>{hazardTimeWindow(data,run)}</span></footer></div></article>)}</div>:<div className="flight-route-clear"><Plane size={19}/><span><strong>Keine markante vertikale Modellschicht im Streckenkorridor.</strong><small>Dünne oder modellseitig nicht aufgelöste Schichten bleiben möglich; amtliches Briefing prüfen.</small></span></div>}</section>
   <section className="flight-route-official"><header><div><Plane size={18}/><span><small>AMTLICHE / OPERATIVE SIGNALE</small><strong>Route, Start und Ziel</strong></span></div></header>{official.length?<div className="flight-route-hazard-list official">{official.map(({checkpoint,signal},index)=>{const region=nearestRegion(data,checkpoint.fraction),place=region?.label?`Raum ${region.label} · ${checkpoint.label}`:checkpoint.label;return <article key={`${checkpoint.id}-${signal.kind}-${index}`} className={signal.level==='caution'?'caution':'watch'}><div className="flight-route-hazard-icon"><AlertTriangle size={17}/></div><div><header><strong>{signal.label}</strong><span>{signal.level==='caution'?'kritisch':'beachten'}</span></header><p>{signal.detail}</p><footer><span><MapPin size={13}/>{place} · etwa km {Math.round(checkpoint.distanceKm/10)*10}</span><span><Clock3 size={13}/>{timeLabel(checkpoint.validTime)} Uhr</span>{signal.source&&<span>{signal.source}</span>}</footer></div></article>})}</div>:<div className="flight-route-clear"><Plane size={19}/><span><strong>Keine markanten amtlichen Signale an den geprüften Streckenpunkten.</strong><small>Verfügbare Quellen wurden für Start, En-route und Ziel geprüft; Zugänge können regional unterschiedlich sein.</small></span></div>}</section>
   <div className="flight-point-cards">{data.waypoints.map((waypoint,index)=>{const point=data.points.reduce((best,row)=>Math.abs(row.fraction-waypoint.fraction)<Math.abs(best.fraction-waypoint.fraction)?row:best,data.points[0]),speed=interpolateLevel(point.levels,data.flightLevel,'windSpeed'),direction=interpolateLevel(point.levels,data.flightLevel,'windDirection');return <article key={`${waypoint.id}-${index}`}><header><b>{waypoint.id}</b><span>{Math.round(waypoint.distanceKm)} km</span></header><strong>{waypoint.name||'Flugplatz'}</strong><small>{timeLabel(point.validTime)} Uhr · FL{String(data.flightLevel).padStart(3,'0')} · {compass(direction)} / {speed===null?'–':`${Math.round(speed)} kt`}</small></article>})}</div>
   <small className="flight-data-note">Quelle: {data.source}. Hazards werden bewusst räumlich zusammengefasst: größere Städte/Gebiete und ein {Math.round(data.corridorKm??corridorKm)} km breiter Korridor statt punktgenauer Scheingenauigkeit. Die frühere Cross-Section-Grafik bleibt durch das handlungsorientierte Streckenbriefing ersetzt.</small>
  </div>}
  {!data&&!loading&&!error&&<div className="flight-empty"><Plane size={28}/><strong>Route, Zeit und Flughöhe festlegen</strong><span>MID untersucht anschließend die Strecke in Flugrichtung und nennt relevante Gefahren mit Ort und erwartetem Zeitfenster.</span></div>}
 </section>;
}
