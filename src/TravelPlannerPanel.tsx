import {useEffect,useMemo,useRef,useState,type FormEvent,type ReactNode} from 'react';
import {AlertTriangle,CalendarRange,CheckCircle2,CloudRain,Droplets,MapPin,RefreshCw,Search,Snowflake,Sparkles,Sun,Thermometer,Wind} from 'lucide-react';
import {label,searchLocations,wind,type Location,type WindUnit} from './weather';
import {WeatherPictogram} from './WeatherPictogram';
import {addDays,bestTravelWindows,dateRange,daysBetween,fetchTravelClimatology,fetchTravelWaterClimatology,summarizeTravelPeriod,travelNarrative,travelPeriod,type TravelConstraints,type TravelPreference,type TravelWaterClimatology,type TravelWindowResult} from './travelPlanner';

type Props={initialLocation:Location;advancedMode:boolean;unit:WindUnit};
type PlannerMode='fixed'|'flexible';
type AnalysisState={windows:TravelWindowResult[];snowDepthIncluded:boolean;snowDepthWarning?:string;referencePeriod:string;source:string};
type ValueEvent={target:{value:string}};
type TravelWaterInfo=TravelWaterClimatology;

const LOCATION_KEY='mid:travel-planner:location';
const MODE_KEY='mid:travel-planner:mode';
const PREFERENCE_KEY='mid:travel-planner:preference';
const START_KEY='mid:travel-planner:start';
const END_KEY='mid:travel-planner:end';
const TRIP_DAYS_KEY='mid:travel-planner:trip-days';
const SNOW_DETAIL_KEY='mid:travel-planner:detailed-snow';

const PREFERENCES:{id:TravelPreference;label:string;detail:string}[]=[
 {id:'balanced',label:'Ausgewogen',detail:'mild, trocken, sonnig und nicht zu windig'},
 {id:'dry',label:'Möglichst trocken',detail:'wenig Niederschlag und wenige Regentage'},
 {id:'warm',label:'Möglichst warm',detail:'hohe klimatologische Tageshöchstwerte'},
 {id:'cold',label:'Möglichst kalt',detail:'niedrige klimatologische Tageshöchstwerte'},
 {id:'sunny',label:'Möglichst sonnig',detail:'viele Sonnenstunden und wenig Bewölkung'},
 {id:'snow',label:'Hohe Schneelage',detail:'historische Schneehöhe und Schneefall'},
 {id:'calm',label:'Möglichst windarm',detail:'geringe tägliche Windmaxima'}
];

function storageGet(key:string){try{return localStorage.getItem(key)||''}catch{return''}}
function storageSet(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
function storedLocation(){try{const parsed=JSON.parse(storageGet(LOCATION_KEY)) as Location;return Number.isFinite(parsed?.latitude)&&Number.isFinite(parsed?.longitude)?parsed:null}catch{return null}}
function localToday(){try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return new Date().toISOString().slice(0,10)}}
function validStoredDate(key:string,fallback:string){const value=storageGet(key);return /^\d{4}-\d{2}-\d{2}$/.test(value)?value:fallback}
function validStoredTripDays(fallback:number){const value=Number(storageGet(TRIP_DAYS_KEY));return Number.isFinite(value)?Math.max(2,Math.min(42,Math.round(value))):fallback}
function dateValue(value:string){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12)):new Date(Number.NaN)}
function formatDate(value:string,withYear=false){const date=dateValue(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',weekday:'short',day:'2-digit',month:'2-digit',year:withYear?'numeric':undefined}).format(date):value}
function formatPeriod(start:string,end:string){const startYear=start.slice(0,4),endYear=end.slice(0,4);return`${formatDate(start,startYear!==endYear)} – ${formatDate(end,true)}`}
function number(value:number,digits=1){return new Intl.NumberFormat('de-DE',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value)}
function optionalNumber(value:string){if(!value.trim())return undefined;const parsed=Number(value.replace(',','.'));return Number.isFinite(parsed)?parsed:undefined}
function destinationLabel(location:Location){return[location.icao?`${location.icao} · ${location.name}`:location.name,location.admin1,location.country].filter(Boolean).join(', ')}
function preferenceLabel(value:TravelPreference){return PREFERENCES.find(item=>item.id===value)?.label??value}
function windUnitLabel(unit:WindUnit){return unit==='kn'?'kt':unit==='kmh'?'km/h':unit==='ms'?'m/s':'mph'}
function windInputToKnots(value:number|undefined,unit:WindUnit){if(!Number.isFinite(value))return undefined;const numeric=Number(value);if(unit==='kmh')return numeric/1.852;if(unit==='ms')return numeric/0.514444;if(unit==='mph')return numeric/1.15078;return numeric}
function Metric({iconNode,labelText,value,detail}:{iconNode:ReactNode;labelText:string;value:string;detail:string}){return <article>{iconNode}<small>{labelText}</small><strong>{value}</strong><span>{detail}</span></article>}

export default function TravelPlannerPanel({initialLocation,advancedMode,unit}:Props){
 const initialStart=addDays(localToday(),30),initialEnd=addDays(initialStart,13),storedStart=validStoredDate(START_KEY,initialStart),storedEndRaw=validStoredDate(END_KEY,initialEnd),storedEnd=daysBetween(storedStart,storedEndRaw)>=0?storedEndRaw:storedStart,[destination,setDestination]=useState<Location>(()=>storedLocation()??initialLocation),[query,setQuery]=useState(''),[searching,setSearching]=useState(false),[searchError,setSearchError]=useState(''),[searchResults,setSearchResults]=useState<Location[]>([]),[mode,setMode]=useState<PlannerMode>(()=>storageGet(MODE_KEY)==='flexible'?'flexible':'fixed'),[start,setStart]=useState(storedStart),[end,setEnd]=useState(storedEnd),[tripDays,setTripDays]=useState(()=>validStoredTripDays(14)),[preference,setPreference]=useState<TravelPreference>(()=>PREFERENCES.some(item=>item.id===storageGet(PREFERENCE_KEY))?storageGet(PREFERENCE_KEY) as TravelPreference:'balanced'),[detailedSnow,setDetailedSnow]=useState(()=>storageGet(SNOW_DETAIL_KEY)==='1'),[minAvgMax,setMinAvgMax]=useState(''),[maxAvgMax,setMaxAvgMax]=useState(''),[maxWetDays,setMaxWetDays]=useState(''),[minSunHours,setMinSunHours]=useState(''),[maxWind,setMaxWind]=useState(''),[minSnowDepth,setMinSnowDepth]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[analysis,setAnalysis]=useState<AnalysisState|null>(null),[activeIndex,setActiveIndex]=useState(0),[waterInfo,setWaterInfo]=useState<TravelWaterInfo|null>(null),[waterError,setWaterError]=useState(''),searchController=useRef<AbortController|null>(null),analysisController=useRef<AbortController|null>(null);
 useEffect(()=>()=>{searchController.current?.abort();analysisController.current?.abort()},[]);
 const preferenceInfo=PREFERENCES.find(item=>item.id===preference)??PREFERENCES[0],constraints=useMemo<TravelConstraints>(()=>{const windLimit=optionalNumber(maxWind);return{minAvgMax:optionalNumber(minAvgMax),maxAvgMax:optionalNumber(maxAvgMax),maxWetDays:optionalNumber(maxWetDays),minSunHoursPerDay:optionalNumber(minSunHours),maxWindKt:windInputToKnots(windLimit,unit),maxWindLabel:Number.isFinite(windLimit)?`${number(Number(windLimit))} ${windUnitLabel(unit)}`:undefined,minSnowDepthCm:optionalNumber(minSnowDepth)}},[minAvgMax,maxAvgMax,maxWetDays,minSunHours,maxWind,minSnowDepth,unit]),active=analysis?.windows[activeIndex]??analysis?.windows[0],span=dateRange(start,end).length;
 useEffect(()=>{storageSet(START_KEY,start)},[start]);
 useEffect(()=>{storageSet(END_KEY,end)},[end]);
 useEffect(()=>{storageSet(TRIP_DAYS_KEY,String(tripDays))},[tripDays]);
 useEffect(()=>{if(daysBetween(start,end)<0)setEnd(start)},[start,end]);
 function updateStart(next:string){setStart(next);if(daysBetween(next,end)<0)setEnd(next)}
 function updateEnd(next:string){setEnd(daysBetween(start,next)<0?start:next)}
 useEffect(()=>{
  if(!analysis||!active){setWaterInfo(null);setWaterError('');return}
  const controller=new AbortController();let cancelled=false;setWaterError('');
  fetchTravelWaterClimatology(destination,active.start,active.end,controller.signal).then(info=>{if(cancelled||controller.signal.aborted)return;setWaterInfo(info);setWaterError('')}).catch(reason=>{if(cancelled||controller.signal.aborted)return;setWaterInfo(null);setWaterError(reason instanceof Error?reason.message:'Historische Wassertemperatur ist vorübergehend nicht verfügbar.')});
  return()=>{cancelled=true;controller.abort()}
 },[analysis,active?.start,active?.end,destination.latitude,destination.longitude,destination.id]);

 async function runSearch(event:FormEvent){event.preventDefault();const value=query.trim();if(value.length<2){setSearchError('Bitte mindestens zwei Zeichen eingeben.');return}searchController.current?.abort();const controller=new AbortController();searchController.current=controller;setSearching(true);setSearchError('');try{const results=await searchLocations(value,controller.signal);setSearchResults(results);if(!results.length)setSearchError('Kein passender Ort gefunden.')}catch(reason){if(!controller.signal.aborted)setSearchError(reason instanceof Error?reason.message:'Ortssuche fehlgeschlagen.')}finally{if(searchController.current===controller&&!controller.signal.aborted)setSearching(false)}}
 function chooseLocation(location:Location){setDestination(location);setSearchResults([]);setQuery('');setSearchError('');storageSet(LOCATION_KEY,JSON.stringify(location))}
 function changeMode(next:PlannerMode){setMode(next);storageSet(MODE_KEY,next);setAnalysis(null);setError('')}
 async function analyse(event:FormEvent){
  event.preventDefault();setError('');setAnalysis(null);setWaterInfo(null);setWaterError('');setActiveIndex(0);
  if(!destination){setError('Bitte zuerst einen Zielort auswählen.');return}
  if(!span||span<1){setError('Der gewählte Zeitraum ist ungültig.');return}
  if(span>120){setError('Der auswertbare Zeitraum ist auf 120 Tage begrenzt.');return}
  if(mode==='flexible'&&(tripDays<2||tripDays>42||tripDays>span)){setError('Die Reisedauer muss zwischen 2 und 42 Tagen liegen und in den Suchzeitraum passen.');return}
  const includeSnowDepth=mode==='flexible'&&(detailedSnow||Number.isFinite(constraints.minSnowDepthCm));setLoading(true);storageSet(PREFERENCE_KEY,preference);storageSet(SNOW_DETAIL_KEY,detailedSnow?'1':'0');
  analysisController.current?.abort();const controller=new AbortController();analysisController.current=controller;
  try{
   const dataset=await fetchTravelClimatology(destination,includeSnowDepth,controller.signal);let windows:TravelWindowResult[];
   if(mode==='fixed'){
    const points=travelPeriod(dataset,start,end);if(points.length!==span)throw new Error('Für den gewählten Zeitraum fehlen klimatologische Tageswerte.');const summary=summarizeTravelPeriod(points);windows=[{start,end,points,summary,score:0,meetsAll:true,unmet:[]}];
   }else windows=bestTravelWindows(dataset,start,end,tripDays,preference,constraints,3);
   if(!windows.length)throw new Error('Innerhalb des Suchzeitraums konnte kein vollständiges Reisezeitfenster gebildet werden.');let initialWater:TravelWaterInfo|null=null;try{initialWater=await fetchTravelWaterClimatology(destination,windows[0].start,windows[0].end,controller.signal);setWaterError('')}catch(reason){if(controller.signal.aborted)throw reason;setWaterError(reason instanceof Error?reason.message:'Historische Wassertemperatur ist vorübergehend nicht verfügbar.')}setWaterInfo(initialWater);setAnalysis({windows,snowDepthIncluded:dataset.snowDepthIncluded,snowDepthWarning:dataset.snowDepthWarning,referencePeriod:dataset.referencePeriod,source:dataset.source});
  }catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Klimatologische Auswertung fehlgeschlagen.')}finally{if(analysisController.current===controller&&!controller.signal.aborted)setLoading(false)}
 }
 return <section className="travel-planner">
  <header className="travel-head"><div><span>KLIMATOLOGISCHE REISEPLANUNG</span><h3>Reisewetter & Reiseplaner</h3><p>Erwartbare Bedingungen für einen festen Zeitraum oder das klimatologisch passendste Reisefenster.</p></div><span className="travel-climate-badge">ERA5-Seamless · 1991–2020</span></header>

  <div className="travel-destination-card">
   <div className="travel-selected-destination"><MapPin size={18}/><span><small>Ausgewähltes Reiseziel</small><strong>{destinationLabel(destination)}</strong><em>{number(destination.latitude,2)}°, {number(destination.longitude,2)}°{Number.isFinite(destination.elevation)?` · ${Math.round(Number(destination.elevation))} m ü. NHN`:''}</em></span><button type="button" className="secondary" onClick={()=>chooseLocation(initialLocation)}>Aktueller MID-Ort</button></div>
   <form className="travel-location-search" onSubmit={runSearch}><label><span>Anderes Reiseziel suchen</span><div><Search size={16}/><input value={query} onChange={(event:ValueEvent)=>setQuery(event.target.value)} placeholder="Ort, Region, Reiseziel oder ICAO"/></div></label><button type="submit" className="secondary" disabled={searching}>{searching?<RefreshCw className="spin" size={16}/>:<Search size={16}/>} Suchen</button></form>
   {searchError&&<small className="travel-search-error">{searchError}</small>}
   {searchResults.length>0&&<div className="travel-search-results" role="listbox" aria-label="Reiseziele">{searchResults.slice(0,8).map(location=><button type="button" key={`${location.id}:${location.latitude}:${location.longitude}`} onClick={()=>chooseLocation(location)}><MapPin size={15}/><span><strong>{location.icao?`${location.icao} · ${location.name}`:location.name}</strong><small>{[location.poiCategory,location.admin1,location.country].filter(Boolean).join(' · ')||`${number(location.latitude,2)}°, ${number(location.longitude,2)}°`}</small></span></button>)}</div>}
  </div>

  <div className="travel-mode-switch" role="tablist" aria-label="Planungsart"><button type="button" className={mode==='fixed'?'active':''} onClick={()=>changeMode('fixed')} aria-selected={mode==='fixed'}><CalendarRange size={16}/><span><strong>Fester Zeitraum</strong><small>Erwartbares Klima anzeigen</small></span></button><button type="button" className={mode==='flexible'?'active':''} onClick={()=>changeMode('flexible')} aria-selected={mode==='flexible'}><Sparkles size={16}/><span><strong>Bestes Zeitfenster</strong><small>Kürzere Reise im Suchraum finden</small></span></button></div>

  <form className="travel-plan-form" onSubmit={analyse}>
   <div className="travel-period-fields"><label><span>{mode==='fixed'?'Reisebeginn':'Suchzeitraum von'}</span><input type="date" value={start} onChange={(event:ValueEvent)=>updateStart(event.target.value)}/></label><label><span>{mode==='fixed'?'Reiseende':'Suchzeitraum bis'}</span><input type="date" value={end} min={start} onChange={(event:ValueEvent)=>updateEnd(event.target.value)}/></label>{mode==='flexible'&&<label><span>Gewünschte Reisedauer</span><div className="travel-duration"><input type="number" min="2" max="42" value={tripDays} onChange={(event:ValueEvent)=>setTripDays(Math.max(2,Math.min(42,Number(event.target.value)||2)))}/><b>Tage</b></div></label>}</div>
   {mode==='flexible'&&<div className="travel-preference"><label><span>Optimieren für</span><select value={preference} onChange={(event:ValueEvent)=>setPreference(event.target.value as TravelPreference)}>{PREFERENCES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{preferenceInfo.detail}</small></label>{preference==='snow'&&<label className="travel-snow-detail"><input type="checkbox" checked={detailedSnow} onChange={event=>setDetailedSnow(event.target.checked)}/><span><strong>Detaillierte Schneehöhe laden</strong><small>Optionaler zusätzlicher Abruf; ohne Auswahl nutzt MID den bereits enthaltenen Schneefall.</small></span></label>}</div>}
   {mode==='flexible'&&<details className="travel-constraints"><summary>Eigene Bedingungen <small>optional</small></summary><div><label><span>Mind. Ø Tageshöchstwert</span><input inputMode="decimal" value={minAvgMax} onChange={(event:ValueEvent)=>setMinAvgMax(event.target.value)} placeholder="z. B. 24"/><b>°C</b></label><label><span>Max. Ø Tageshöchstwert</span><input inputMode="decimal" value={maxAvgMax} onChange={(event:ValueEvent)=>setMaxAvgMax(event.target.value)} placeholder="z. B. 5"/><b>°C</b></label><label><span>Max. erwartete Regentage</span><input inputMode="decimal" value={maxWetDays} onChange={(event:ValueEvent)=>setMaxWetDays(event.target.value)} placeholder="z. B. 3"/><b>Tage</b></label><label><span>Mind. Sonne pro Tag</span><input inputMode="decimal" value={minSunHours} onChange={(event:ValueEvent)=>setMinSunHours(event.target.value)} placeholder="z. B. 6"/><b>h</b></label><label><span>Max. Ø Windmaximum</span><input inputMode="decimal" value={maxWind} onChange={(event:ValueEvent)=>setMaxWind(event.target.value)} placeholder={unit==='kn'?'z. B. 15':unit==='kmh'?'z. B. 25':unit==='ms'?'z. B. 7':'z. B. 16'}/><b>{windUnitLabel(unit)}</b></label><label><span>Mind. mittlere Schneehöhe</span><input inputMode="decimal" value={minSnowDepth} onChange={(event:ValueEvent)=>setMinSnowDepth(event.target.value)} placeholder="z. B. 30"/><b>cm</b></label></div><p>Leere Felder werden nicht berücksichtigt. Schneehöhe lädt nur nach ausdrücklicher Auswahl oder bei einer Mindestschneehöhe zusätzliche historische Stundendaten.</p></details>}
   <button type="submit" className="primary travel-analyse" disabled={loading}>{loading?<RefreshCw className="spin" size={17}/>:mode==='flexible'?<Sparkles size={17}/>:<CalendarRange size={17}/>} {loading?'Klimatologie wird ausgewertet …':mode==='flexible'?'Bestes Reisezeitfenster finden':'Reisewetter auswerten'}</button>
  </form>

  <div className="travel-method-note"><AlertTriangle size={15}/><span>Das Ergebnis ist eine klimatologische Erwartung aus vergangenen Jahren und keine Wettervorhersage für den konkreten Reisetermin. Küstennahe Wassertemperaturen werden – falls verfügbar – ebenfalls klimatologisch für den geplanten Zeitraum aus ERA5-Ocean gemittelt und nicht als aktuelle Einzelmessung dargestellt. Pro gerastertem Klimapunkt erfolgt höchstens ein direkter Basisabruf für die atmosphärische Klimatologie; ERA5-Seamless kombiniert die feinere ERA5-Land-Temperatur mit ERA5 für Niederschlag, Sonne und Wind. Für Küstenorte prüft MID zusätzlich die historische ERA5-Ocean-SST über die Open-Meteo Marine API. Die Wassertemperatur wird ausschließlich aus den Kalendertagen des geplanten Reisezeitraums über gleichmäßig in 1991–2020 verteilte Referenzjahre klimatologisch gemittelt; aktuelle Marinewerte werden nicht verwendet. Das Ergebnis wird lokal gespeichert. Die Schneehöhe ist ein optionaler Zusatzabruf. Der MID-Worker wird dafür nicht verwendet.</span></div>
  {error&&<div className="error">{error}</div>}
  {loading&&<div className="travel-loading"><RefreshCw className="spin" size={20}/><div><strong>Langjährige Klimadaten werden ausgewertet</strong><span>{mode==='flexible'&&(detailedSnow||Number.isFinite(constraints.minSnowDepthCm))?'Für die ausdrücklich aktivierte Schneehöhe wird einmalig ein zusätzlicher Datensatz verarbeitet.':'Es wird höchstens ein kompakter Basisdatensatz geladen; Wiederholungen nutzen den lokalen Klimacache.'}</span></div></div>}

  {analysis&&active&&<section className="travel-result">
   <header><div><span>{mode==='flexible'?'EMPFOHLENES REISEFENSTER':'ERWARTBARES REISEWETTER'}</span><h4>{formatPeriod(active.start,active.end)}</h4><p>{destinationLabel(destination)} · {active.summary.days} Tage{mode==='flexible'?` · ${preferenceLabel(preference)}`:''}</p></div>{mode==='flexible'&&(active.meetsAll?<span className="travel-match good"><CheckCircle2 size={15}/> Bedingungen erfüllt</span>:<span className="travel-match partial"><AlertTriangle size={15}/> Beste Annäherung</span>)}</header>
   {mode==='flexible'&&analysis.windows.length>1&&<div className="travel-alternatives" aria-label="Alternative Reisezeiträume">{analysis.windows.map((window,index)=><button type="button" className={index===activeIndex?'active':''} key={window.start} onClick={()=>setActiveIndex(index)}><small>{index===0?'Beste Wahl':`Alternative ${index}`}</small><strong>{formatPeriod(window.start,window.end)}</strong></button>)}</div>}
   <div className="travel-summary-text"><Sparkles size={18}/><p>{travelNarrative(active.summary,preference,analysis.snowDepthIncluded)}</p></div>
   {!active.meetsAll&&active.unmet.length>0&&<div className="travel-unmet"><strong>Nicht vollständig erfüllt:</strong><span>{active.unmet.join(' · ')}</span></div>}
   {analysis.snowDepthWarning&&<div className="travel-snow-warning"><Snowflake size={15}/><span>{analysis.snowDepthWarning} Die Bewertung nutzt ersatzweise den langjährigen Schneefall.</span></div>}
   {waterError&&<div className="travel-snow-warning"><Droplets size={15}/><span>{waterError} Die übrige Reiseklimatologie bleibt davon unberührt; MID versucht die SST beim nächsten Abruf erneut.</span></div>}
   <div className="travel-metrics">
    <Metric iconNode={<Thermometer/>} labelText="Temperatur" value={`${number(active.summary.avgMax)} / ${number(active.summary.avgMin)} °C`} detail={`Ø Höchst / Tiefst · häufig ${number(active.summary.avgMaxP25)}–${number(active.summary.avgMaxP75)} °C`}/>
    <Metric iconNode={<CloudRain/>} labelText="Niederschlag" value={`${number(active.summary.precipitationTotal)} mm`} detail={`rund ${Math.round(active.summary.wetDaysExpected)} Tage mit ≥ 1 mm`}/>
    <Metric iconNode={<Sun/>} labelText="Sonnenschein" value={`${number(active.summary.sunshinePerDay)} h/Tag`} detail={`${number(active.summary.sunshineTotal)} h im Zeitraum`}/>
    <Metric iconNode={<Wind/>} labelText="Wind" value={wind(active.summary.windMaxMean,unit)} detail="Ø tägliches Windmaximum"/>
    <Metric iconNode={<Snowflake/>} labelText={analysis.snowDepthIncluded?'Schneehöhe':'Schneefall'} value={analysis.snowDepthIncluded&&Number.isFinite(active.summary.snowDepthMean)?`${number(Number(active.summary.snowDepthMean),0)} cm`:`${number(active.summary.snowfallTotal)} cm`} detail={analysis.snowDepthIncluded&&Number.isFinite(active.summary.snowCoverDaysExpected)?`Schneedecke an etwa ${number(Number(active.summary.snowCoverDaysExpected))} Tagen`:'langjähriger Schneefall im Zeitraum'}/>
    {waterInfo&&<Metric iconNode={<Droplets/>} labelText="Wassertemperatur" value={`${number(waterInfo.temperature)} °C`} detail={`klimatologisches Mittel für den Reisezeitraum · ${waterInfo.referencePeriod} · nächstes Meeresgitter ${number(waterInfo.gridDistanceKm,0)} km`}/>}
   </div>
   <div className="travel-daily-climate"><header><div><span>KLIMAVERLAUF</span><h5>Typische Bedingungen im Zeitraum</h5></div><small>horizontal wischen</small></header><div className="travel-day-strip">{active.points.map(point=><article key={point.date}><time>{formatDate(point.date)}</time><span className="travel-day-icon"><WeatherPictogram code={point.weatherCode} day title={label(point.weatherCode)}/></span><strong>{number(point.maxMean,0)}°</strong><small>{number(point.minMean,0)}°</small><span className="travel-day-rain"><CloudRain size={12}/>{number(point.wetProbability,0)} %</span><span className="travel-day-sun"><Sun size={12}/>{number(point.sunshineMeanHours)} h</span>{analysis.snowDepthIncluded&&Number.isFinite(point.snowDepthMean)&&<span className="travel-day-snow"><Snowflake size={12}/>{number(Number(point.snowDepthMean),0)} cm</span>}</article>)}</div></div>
   <footer><span>Quelle: {analysis.source} · Referenzperiode {analysis.referencePeriod}</span><small>{advancedMode?'Tageswerte sind Mittel beziehungsweise Eintrittswahrscheinlichkeiten aus ERA5-Seamless (ERA5-Land für Landtemperatur, ERA5 für Niederschlag, Solarstrahlung und Wind); lokale Effekte, einzelne Extremjahre und künftige Klimaänderungen bleiben unsicher.':'Klimamittel beschreiben typische Bedingungen, nicht das Wetter eines einzelnen Jahres.'}</small></footer>
  </section>}

 </section>;
}
