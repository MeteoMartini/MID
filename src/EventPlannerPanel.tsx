import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react'
import {BellRing,CalendarRange,CloudRain,MapPin,RefreshCw,Search,ShieldCheck,ShieldAlert,Star,Sun,Thermometer,Trash2,Wind} from 'lucide-react'
import {WeatherPictogram} from './WeatherPictogram'
import {bestMatchModelInfo,forecast,label,localIsoEpoch,mapDays,mapHours,radarNowcast,searchLocations,thunderstormNowcast,type Hour,type Location} from './weather'
import {EVENT_CENTER_OPEN_EVENT,EVENT_CENTER_UPDATED_EVENT,buildEventCenterId,compareEventPlans,deleteEventCenterRecord,markEventCenterOpened,readEventCenterRecords,toggleEventCenterFavorite,upsertEventCenterRecord,type EventActivity,type EventAdvice,type EventCenterRecord,type EventEnvironment,type EventPlan,type EventStatus,type EventSummary,type EventTimelinePoint} from './eventCenter'
import {applyConvectiveNowcastHours,applyForecastFusionDays,applyForecastFusionHours,applyOperationalNowcastHours,forecastFusionLabel,loadForecastFusion,type ForecastFusionResult} from './forecastFusion'
import {precipitationParts} from './precipitation'

type Props={initialLocation:Location;advancedMode:boolean}
type ValueEvent={target:{value:string}}

const EVENT_LOCATION_KEY='mid:event-planner:location'
const EVENT_VALUES_KEY='mid:event-planner:values'
const AUTO_REFRESH_MS=30*60*1000

const ENVIRONMENT_OPTIONS:{id:EventEnvironment;label:string;detail:string}[]=[
 {id:'indoor',label:'Indoor',detail:'Wetter wirkt vor allem auf An- und Abreise'},
 {id:'outdoor',label:'Outdoor',detail:'Bedingungen am Veranstaltungsort stehen im Fokus'},
 {id:'covered',label:'Überdacht',detail:'Teilweise geschützt, Wind und Schlagregen relevant'}
]

const ACTIVITY_OPTIONS:{id:EventActivity;label:string;detail:string}[]=[
 {id:'general',label:'Allgemein',detail:'ohne besondere Schwerpunktsetzung'},
 {id:'running',label:'Laufen',detail:'Temperatur, Regen, Wind und Untergrund'},
 {id:'cycling',label:'Radfahren',detail:'Wind, Nässe und gefühlte Temperatur'},
 {id:'hiking',label:'Wandern',detail:'Regen, Sicht und Wind beachten'},
 {id:'skiing',label:'Skifahren',detail:'Kälte, Wind und winterliche Bedingungen'},
 {id:'climbing',label:'Klettern',detail:'Wind, Niederschlag und Felsfeuchte'},
 {id:'football',label:'Fußball',detail:'Nässe, Wind und Belastungssteuerung'},
 {id:'tennis',label:'Tennis',detail:'Wind und Regen besonders wichtig'},
 {id:'golf',label:'Golf',detail:'Wind, Gewitter und Platznässe'},
 {id:'gym',label:'Gym',detail:'Anreise und Hitze-/Kältekomfort'},
 {id:'yoga',label:'Yoga',detail:'ruhige, milde Bedingungen bevorzugt'},
 {id:'watersports',label:'Wassersport',detail:'Wind und Schauer im Fokus'},
 {id:'city',label:'Stadt / Event',detail:'Outfit, Schirme und Wegezeiten'},
 {id:'concert',label:'Konzert / Bühne',detail:'Publikums- und Aufenthaltskomfort'}
]

function storageGet(key:string){try{return localStorage.getItem(key)||''}catch{return''}}
function storageSet(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
function storedLocation(){try{const parsed=JSON.parse(storageGet(EVENT_LOCATION_KEY)) as Location;return Number.isFinite(parsed?.latitude)&&Number.isFinite(parsed?.longitude)?parsed:null}catch{return null}}
function localToday(){try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()),get=(type:string)=>parts.find(part=>part.type===type)?.value;return`${get('year')}-${get('month')}-${get('day')}`}catch{return new Date().toISOString().slice(0,10)}}
function addDays(value:string,days:number){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)return value;const date=new Date(Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),12));date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10)}
function formatNumber(value:number|null|undefined,digits=0){if(!Number.isFinite(Number(value)))return'–';return new Intl.NumberFormat('de-DE',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number(value))}
function formatDate(value:string){const date=new Date(`${value}T12:00:00Z`);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'}).format(date):value}
function formatClock(value:string){return value.slice(0,5)}
function destinationLabel(location:Location){return[location.icao?`${location.icao} · ${location.name}`:location.name,location.admin1,location.country].filter(Boolean).join(', ')}
function modelStamp(value?:string){if(!value)return'–';const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date):value}
function parseMinuteStamp(value:string){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!match)return Number.NaN;return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))}
function parseStoredValues(){try{return JSON.parse(storageGet(EVENT_VALUES_KEY)||'{}') as Partial<{title:string;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity}>}catch{return{}}}
function unique<T>(values:(T|null|undefined)[]){return values.filter((value,index,array)=>value!=null&&array.indexOf(value)===index) as T[]}
function environmentLabel(value:EventEnvironment){return ENVIRONMENT_OPTIONS.find(item=>item.id===value)?.label??value}
function activityLabel(value:EventActivity){return ACTIVITY_OPTIONS.find(item=>item.id===value)?.label??value}
function majorWeatherCode(codes:(number|null)[]){const ranked=unique(codes).sort((a,b)=>weatherSeverity(b)-weatherSeverity(a));return ranked[0]??null}
function weatherSeverity(code:number|null){if(code==null)return 0;if([95,96,99].includes(code))return 6;if([71,73,75,77,85,86].includes(code))return 5;if([65,67,82].includes(code))return 4;if([63,66,81].includes(code))return 3;if([61,80,51,53,55,56,57].includes(code))return 2;if([45,48].includes(code))return 1;return 0}
function mean(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);if(!usable.length)return null;return usable.reduce((sum,value)=>sum+value,0)/usable.length}
function max(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);return usable.length?Math.max(...usable):null}
function min(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);return usable.length?Math.min(...usable):null}

function eventWeatherPart(point:EventTimelinePoint){return precipitationParts({time:point.time,precipitation:point.precipitation??0,rain:point.rain??0,showers:point.showers??0,snowfall:point.snowfall??0,probability:point.precipitationProbability??0,code:point.weatherCode??0,temperature:point.temperature??undefined,humidity:point.humidity??undefined,cloud:point.cloud??undefined,lowCloud:point.lowCloud??undefined,cape:point.cape??undefined,liftedIndex:point.liftedIndex??undefined,convectiveInhibition:point.convectiveInhibition??undefined,sunshineDuration:point.sunshineDuration??undefined,isDay:point.isDay})}
function summarizeTimeline(timeline:EventTimelinePoint[],fusion:ForecastFusionResult|null):EventSummary{
 const temperatures=timeline.map(point=>point.temperature),apparents=timeline.map(point=>point.apparent),precipitationProbabilities=timeline.map(point=>point.precipitationProbability),winds=timeline.map(point=>point.wind),gusts=timeline.map(point=>point.gust),uvValues=timeline.map(point=>point.uv),visibilities=timeline.map(point=>point.visibility),parts=timeline.map(point=>({point,part:eventWeatherPart(point)})),wet=parts.filter(row=>row.part.type!=='none'),representative=(wet.length?wet:parts).sort((a,b)=>weatherSeverity(b.part.displayCode)-weatherSeverity(a.part.displayCode)||((b.point.precipitationProbability??0)+(b.point.precipitation??0)*8)-((a.point.precipitationProbability??0)+(a.point.precipitation??0)*8))[0],groups=new Set((fusion?.sources??[]).filter(source=>source.successful&&source.consensusRole!=='postprocessing').map(source=>source.independenceGroup||source.family));
 return{hours:timeline.length,temperatureAvg:mean(temperatures),temperatureMin:min(temperatures),temperatureMax:max(temperatures),apparentAvg:mean(apparents),precipitationProbabilityMax:max(precipitationProbabilities),precipitationTotal:timeline.reduce((sum,point)=>sum+(point.precipitation??0),0),windMax:max(winds),gustMax:max(gusts),uvMax:max(uvValues),visibilityMin:min(visibilities),weatherCode:representative?.part.displayCode??majorWeatherCode(timeline.map(point=>point.weatherCode)),weatherLabel:representative?.part.type==='none'?label(representative.part.displayCode):representative?.part.weatherLabel,weatherSourceLabel:representative?.point.weatherSourceLabel,isDay:representative?.point.isDay,modelFamilyCount:groups.size||undefined,rapidCycleUsed:Boolean(fusion?.sources?.some(source=>source.successful&&source.rapidUpdate))}
}

function evaluateEvent(summary:EventSummary,environment:EventEnvironment,activity:EventActivity):EventAdvice{
 const tips:string[]=[]
 const behavior:string[]=[]
 let severity=0
 const thunder=[95,96,99].includes(summary.weatherCode??-1)
 if(thunder){severity+=5;tips.push('Gewitter oder konvektiv geprägte Schauer sind möglich.');behavior.push('Outdoor- oder Wasseraktivitäten nur mit klarer Ausweichoption planen.')}
 if((summary.precipitationProbabilityMax??0)>=75||(summary.precipitationTotal??0)>=5){severity+=environment==='indoor'?1:3;tips.push('Hohe Niederschlagswahrscheinlichkeit im gewählten Zeitraum.');behavior.push(environment==='indoor'?'Zusätzliche Wegezeit und Regenschutz für An- und Abreise einplanen.':'Regenfeste Kleidung und möglichst geschützte Aufenthaltsbereiche vorsehen.')}
 else if((summary.precipitationProbabilityMax??0)>=40||(summary.precipitationTotal??0)>=1.5){severity+=environment==='indoor'?0:2;tips.push(summary.weatherLabel?.includes('Sprühregen')?'Zeitweise Sprühregen ist möglich.':'Zeitweise Schauer oder Niederschlag sind möglich.');behavior.push('Leichte Regenjacke oder Schirm bereithalten.')}
 if((summary.windMax??0)>=22||(summary.gustMax??0)>=34){severity+=environment==='indoor'?1:3;tips.push('Frischer bis starker Wind kann die Aktivität beeinflussen.');behavior.push(activity==='watersports'?'Lokale Sicherheitsvorgaben und Materialwahl wegen Wind kritisch prüfen.':'Windempfindliche Ausrüstung sichern und exponierte Bereiche meiden.')}
 else if((summary.windMax??0)>=14||(summary.gustMax??0)>=24){severity+=1;tips.push('Mäßiger Wind spürbar.');behavior.push('Windchill und Böen bei Kleidung beziehungsweise Streckenwahl mitdenken.')}
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29){severity+=2;tips.push('Warme bis heiße Bedingungen.');behavior.push('Viel trinken, Schatten nutzen und Belastung in der Mittagszeit reduzieren.')}
 if((summary.temperatureMin??summary.temperatureAvg??99)<=3){severity+=2;tips.push('Kühle bis kalte Bedingungen.');behavior.push('Mehrlagige Kleidung, Kopfschutz und ausreichend Aufwärmzeit einplanen.')}
 if((summary.uvMax??0)>=6&&environment!=='indoor'){severity+=1;tips.push('Erhöhte UV-Belastung möglich.');behavior.push('Sonnenschutz, Kopfbedeckung und regelmäßiges Trinken berücksichtigen.')}
 if((summary.visibilityMin??99999)<1000){severity+=2;tips.push('Sicht kann eingeschränkt sein.');behavior.push('Anfahrt, Wegführung und Sicherheitspunkte besonders sorgfältig planen.')}
 if(activity==='cycling'||activity==='running'||activity==='hiking')behavior.push('Schuhwerk beziehungsweise Untergrund auf Nässe und Rutschgefahr abstimmen.')
 if(activity==='skiing')behavior.push('Zusätzlich Bergwetter, Wind in der Höhe und Schneefallgrenze im Bergmodul prüfen.')
 if(activity==='golf'||activity==='tennis'||activity==='football')behavior.push('Bei Böen und Schauerstaffeln kurze Unterbrechungen oder flexible Startzeit erwägen.')
 if(activity==='concert'||activity==='city')behavior.push('Outfit, Schirm und Aufenthaltsdauer im Freien an die Bedingungen anpassen.')
 if(activity==='gym'||activity==='yoga'||environment==='indoor')behavior.push('Der Fokus liegt auf Komfort sowie einer planbaren An- und Abreise.')
 if(activity==='watersports')behavior.push('Zusätzlich lokale Wassertemperatur, Gewässerstatus und behördliche Hinweise prüfen.')
 const status:EventStatus=severity>=6?'caution':severity>=3?'watch':'good'
 if(!tips.length)tips.push('Für den gewählten Zeitraum zeigen sich insgesamt recht stabile Bedingungen.')
 if(!behavior.length)behavior.push('Normale Vorbereitung ist voraussichtlich ausreichend.')
 return{
  status,
  headline:status==='good'?'Günstige Bedingungen':'watch'===status?'Mit Blick auf Details planen':'Wetterkritisch – Alternativen bereithalten',
  summary:status==='good'?'Die Modelle sprechen aktuell für einen gut planbaren Termin.':'watch'===status?'Die Aktivität ist grundsätzlich möglich, einzelne Wetterfaktoren sollten aber aktiv eingeplant werden.':'Mehrere Wetterfaktoren können den Ablauf spürbar beeinträchtigen oder eine Alternative erforderlich machen.',
  tips:tips.slice(0,3),
  behavior:unique(behavior).slice(0,4)
 }
}

function timelineForWindow(hours:Hour[],date:string,startTime:string,endTime:string){
 const startStamp=parseMinuteStamp(`${date}T${startTime}`)
 let endStamp=parseMinuteStamp(`${date}T${endTime}`)
 if(!Number.isFinite(startStamp)||!Number.isFinite(endStamp))return[] as EventTimelinePoint[]
 if(endStamp<startStamp)endStamp=startStamp+60*60000
 const rows=hours.map(hour=>({hour,stamp:parseMinuteStamp(hour.time)})).filter(row=>Number.isFinite(row.stamp)&&row.stamp>=startStamp-30*60000&&row.stamp<=endStamp+30*60000)
 return rows.map(({hour})=>{const part=precipitationParts({time:hour.time,epoch:hour.epoch,timezone:hour.timezone,precipitation:hour.precipitation,rain:hour.rain,showers:hour.showers,snowfall:hour.snowfall,probability:hour.probability,code:hour.code,temperature:hour.temperature,dewPoint:hour.dewPoint,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:hour.sunshineDuration,isDay:hour.isDay});return{time:hour.time.slice(11,16),temperature:hour.temperature,apparent:hour.apparent,precipitationProbability:hour.probability,precipitation:hour.precipitation,rain:hour.rain,showers:hour.showers,snowfall:hour.snowfall,weatherCode:part.displayCode,weatherLabel:part.type==='none'?label(part.displayCode):part.weatherLabel,wind:hour.wind,gust:hour.gust,uv:hour.uvIndex,visibility:hour.visibility,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:hour.sunshineDuration,isDay:hour.isDay,weatherSourceId:hour.weatherSourceId,weatherSourceLabel:hour.weatherSourceLabel} satisfies EventTimelinePoint})
}

function statusLabel(value:EventStatus){return value==='good'?'passt':'watch'===value?'beobachten':'achtung'}
function buildOutfitHint(summary:EventSummary,environment:EventEnvironment){
 const layers:string[]=[]
 if((summary.temperatureMax??summary.temperatureAvg??0)>=27)layers.push('leichte, luftige Kleidung')
 else if((summary.temperatureMin??summary.temperatureAvg??99)<=4)layers.push('warme, winddichte Schichten')
 else layers.push('wetterangepasste Übergangskleidung')
 if((summary.precipitationProbabilityMax??0)>=40||(summary.precipitationTotal??0)>=1)layers.push('Regenschutz')
 if((summary.uvMax??0)>=6&&environment!=='indoor')layers.push('Sonnen- und Hitzeschutz')
 if((summary.windMax??0)>=16||(summary.gustMax??0)>=24)layers.push('etwas Windschutz')
 return layers.join(' · ')
}
function buildTimingHint(summary:EventSummary){
 if((summary.precipitationProbabilityMax??0)>=75)return'Puffer für Schauer einplanen'
 if((summary.windMax??0)>=18||(summary.gustMax??0)>=28)return'exponierte Phasen möglichst kurz halten'
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29)return'Pausen und Wasserstellen einplanen'
 return'gute Planbarkeit im gewählten Zeitfenster'
}
function eventCompactRange(record:EventCenterRecord){return`${formatDate(record.date)} · ${formatClock(record.startTime)}–${formatClock(record.endTime)}`}
function eventMetricLine(plan:EventPlan|null){if(!plan)return'Noch keine Analyse gespeichert.';return`${formatNumber(plan.summary.temperatureAvg)} °C · Niederschlag ${formatNumber(plan.summary.precipitationProbabilityMax)} % · Wind ${formatNumber(plan.summary.windMax)} kt`}

export default function EventPlannerPanel({initialLocation,advancedMode}:Props){
 const stored=useMemo(()=>parseStoredValues(),[])
 const [destination,setDestination]=useState<Location>(()=>storedLocation()??initialLocation)
 const [query,setQuery]=useState('')
 const [searching,setSearching]=useState(false)
 const [searchError,setSearchError]=useState('')
 const [searchResults,setSearchResults]=useState<Location[]>([])
 const [title,setTitle]=useState(stored.title||'')
 const [date,setDate]=useState(stored.date||localToday())
 const [startTime,setStartTime]=useState(stored.startTime||'10:00')
 const [endTime,setEndTime]=useState(stored.endTime||'13:00')
 const [environment,setEnvironment]=useState<EventEnvironment>(ENVIRONMENT_OPTIONS.some(item=>item.id===stored.environment)?stored.environment as EventEnvironment:'outdoor')
 const [activity,setActivity]=useState<EventActivity>(ACTIVITY_OPTIONS.some(item=>item.id===stored.activity)?stored.activity as EventActivity:'general')
 const [loading,setLoading]=useState(false)
 const [error,setError]=useState('')
 const [plan,setPlan]=useState<EventPlan|null>(null)
 const [savedEvents,setSavedEvents]=useState<EventCenterRecord[]>(()=>readEventCenterRecords())
 const [selectedRecordId,setSelectedRecordId]=useState('')
 const [refreshingIds,setRefreshingIds]=useState<string[]>([])
 const [bulkRefreshing,setBulkRefreshing]=useState(false)
 const searchController=useRef<AbortController|null>(null)
 const analysisController=useRef<AbortController|null>(null)
 const forecastWindowHint=`Vorhersage aktuell bis ${formatDate(addDays(localToday(),13))}`
 const currentEventId=buildEventCenterId(destination,date,startTime,title.trim()||destination.name)
 const currentSavedRecord=savedEvents.find(item=>item.id===selectedRecordId)||savedEvents.find(item=>item.id===currentEventId)||null

 useEffect(()=>()=>{searchController.current?.abort();analysisController.current?.abort()},[])
 useEffect(()=>{storageSet(EVENT_VALUES_KEY,JSON.stringify({title,date,startTime,endTime,environment,activity}))},[title,date,startTime,endTime,environment,activity])
 useEffect(()=>{if(plan||storedLocation())return;setDestination(initialLocation)},[initialLocation,plan])
 useEffect(()=>{
  if(!plan)return
  const timer=window.setInterval(()=>{void analyseEvent(undefined,true)},AUTO_REFRESH_MS)
  return()=>window.clearInterval(timer)
 },[plan,destination,date,startTime,endTime,environment,activity,title])
 useEffect(()=>{
  const sync=()=>setSavedEvents(readEventCenterRecords())
  const openSaved=(event:Event)=>{const detail=(event as CustomEvent<{id?:string}>).detail,id=String(detail?.id||'');if(!id)return;const record=readEventCenterRecords().find(item=>item.id===id);if(record)loadRecord(record)}
  window.addEventListener(EVENT_CENTER_UPDATED_EVENT,sync)
  window.addEventListener(EVENT_CENTER_OPEN_EVENT,openSaved as EventListener)
  window.addEventListener('storage',sync)
  return()=>{window.removeEventListener(EVENT_CENTER_UPDATED_EVENT,sync);window.removeEventListener(EVENT_CENTER_OPEN_EVENT,openSaved as EventListener);window.removeEventListener('storage',sync)}
 },[])
 useEffect(()=>{
  if(!savedEvents.some(item=>item.isFavorite))return
  const timer=window.setInterval(()=>{void refreshStoredEvents(true)},AUTO_REFRESH_MS)
  return()=>window.clearInterval(timer)
 },[savedEvents])

 async function runSearch(event:FormEvent){
  event.preventDefault()
  const value=query.trim()
  if(value.length<2){setSearchError('Bitte mindestens zwei Zeichen eingeben.');return}
  searchController.current?.abort()
  const controller=new AbortController()
  searchController.current=controller
  setSearching(true)
  setSearchError('')
  try{
   const results=await searchLocations(value,controller.signal)
   setSearchResults(results)
   if(!results.length)setSearchError('Kein passender Ort gefunden.')
  }catch(reason){if(!controller.signal.aborted)setSearchError(reason instanceof Error?reason.message:'Ortssuche fehlgeschlagen.')}
  finally{if(searchController.current===controller&&!controller.signal.aborted)setSearching(false)}
 }
 function chooseLocation(location:Location){setDestination(location);setSearchResults([]);setQuery('');setSearchError('');storageSet(EVENT_LOCATION_KEY,JSON.stringify(location))}
 async function buildPlan(location:Location,eventDate:string,eventStartTime:string,eventEndTime:string,eventEnvironment:EventEnvironment,eventActivity:EventActivity,eventTitle:string,signal:AbortSignal){
  const country=location.country_code||location.country,[weather,modelInfo,fusion]=await Promise.all([forecast(location.latitude,location.longitude,signal),bestMatchModelInfo(location.latitude,location.longitude,country,signal).catch(()=>null),loadForecastFusion(location.latitude,location.longitude,country,location.elevation,signal).catch(()=>null)])
  const baseHours=mapHours(weather),baseDays=mapDays(weather),fusedDays=applyForecastFusionDays(baseDays,fusion);let finalHours=applyForecastFusionHours(baseHours,baseDays,fusedDays,fusion),now=Date.now(),startEpoch=localIsoEpoch(`${eventDate}T${eventStartTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0),endEpoch=localIsoEpoch(`${eventDate}T${eventEndTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0);if(Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch<startEpoch)endEpoch=startEpoch+3600000
  const nearNow=Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch>=now-30*60000&&startEpoch<=now+4*3600000;let nowcastApplied=false,thunderApplied=false
  if(nearNow){
   const [radarResult,thunderResult]=await Promise.allSettled([radarNowcast(location.latitude,location.longitude,country,signal,true),thunderstormNowcast(location.latitude,location.longitude,country,signal)]),radar=radarResult.status==='fulfilled'?radarResult.value:null,thunder=thunderResult.status==='fulfilled'?thunderResult.value:null,before=finalHours
   finalHours=applyOperationalNowcastHours(finalHours,radar);nowcastApplied=finalHours!==before
   const beforeThunder=finalHours;finalHours=applyConvectiveNowcastHours(finalHours,thunder);thunderApplied=finalHours!==beforeThunder
  }
  const timeline=timelineForWindow(finalHours,eventDate,eventStartTime,eventEndTime)
  if(!timeline.length)throw new Error('Für den gewählten Zeitraum sind noch keine Stundendaten verfügbar. Bitte Datum oder Uhrzeit anpassen.')
  const summary=summarizeTimeline(timeline,fusion),advice=evaluateEvent(summary,eventEnvironment,eventActivity),fusionState=forecastFusionLabel(fusion),source=[fusionState||'Open-Meteo Best Match · gemeinsame MID-Plausibilisierung',nowcastApplied?'Radar-Nowcast':'' ,thunderApplied?'Konvektiv-/Gewitter-Nowcast':''].filter(Boolean).join(' · ')
  return{location,title:eventTitle.trim(),date:eventDate,startTime:eventStartTime,endTime:eventEndTime,environment:eventEnvironment,activity:eventActivity,timeline,summary,advice,modelInfo,refreshedAt:Date.now(),source} satisfies EventPlan
 }
 function validateInputs(location:Location|null,eventDate:string,eventStartTime:string,eventEndTime:string){
  if(!location){setError('Bitte zuerst einen Ort auswählen.');return false}
  if(!eventDate||!eventStartTime||!eventEndTime){setError('Bitte Datum sowie Start- und Endzeit angeben.');return false}
  if(eventDate>addDays(localToday(),13)){setError('Der Event-Planer wertet die nächsten 14 Tage aus. Für spätere Termine bitte näher am Termin erneut prüfen.');return false}
  return true
 }
 function savePlanRecord(nextPlan:EventPlan,forceFavorite?:boolean){
  const id=currentSavedRecord?.id||buildEventCenterId(nextPlan.location,nextPlan.date,nextPlan.startTime,nextPlan.title||nextPlan.location.name)
  const previous=savedEvents.find(item=>item.id===id)||null
  const change=compareEventPlans(previous?.plan,nextPlan)
  const record:EventCenterRecord={
   id,
   title:nextPlan.title.trim()||nextPlan.location.name,
   location:nextPlan.location,
   date:nextPlan.date,
   startTime:nextPlan.startTime,
   endTime:nextPlan.endTime,
   environment:nextPlan.environment,
   activity:nextPlan.activity,
   isFavorite:forceFavorite??previous?.isFavorite??Boolean(currentSavedRecord?.isFavorite),
   createdAt:previous?.createdAt??Date.now(),
   updatedAt:Date.now(),
   lastOpenedAt:Date.now(),
   plan:nextPlan,
   change
  }
  upsertEventCenterRecord(record)
  setSelectedRecordId(record.id)
  return record
 }
 async function analyseEvent(event?:FormEvent,silent=false){
  event?.preventDefault()
  setError('')
  if(!silent)setPlan(null)
  if(!validateInputs(destination,date,startTime,endTime))return
  analysisController.current?.abort()
  const controller=new AbortController()
  analysisController.current=controller
  setLoading(true)
  try{
   const nextPlan=await buildPlan(destination,date,startTime,endTime,environment,activity,title,controller.signal)
   setPlan(nextPlan)
   if(currentSavedRecord)savePlanRecord(nextPlan)
  }catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Event-Auswertung fehlgeschlagen.')}
  finally{if(analysisController.current===controller&&!controller.signal.aborted)setLoading(false)}
 }
 async function refreshStoredEvent(record:EventCenterRecord,markAsFavoritePass=false){
  setRefreshingIds(current=>current.includes(record.id)?current:[...current,record.id])
  const controller=new AbortController()
  try{
   const nextPlan=await buildPlan(record.location,record.date,record.startTime,record.endTime,record.environment,record.activity,record.title,controller.signal)
   const change=compareEventPlans(record.plan,nextPlan)
   const updated:EventCenterRecord={...record,location:record.location,title:record.title,date:record.date,startTime:record.startTime,endTime:record.endTime,environment:record.environment,activity:record.activity,isFavorite:markAsFavoritePass?true:record.isFavorite,updatedAt:Date.now(),plan:nextPlan,change}
   upsertEventCenterRecord(updated)
   if(selectedRecordId===record.id||currentEventId===record.id){setPlan(nextPlan);setSelectedRecordId(record.id)}
  }catch(reason){setError(reason instanceof Error?reason.message:'Gespeichertes Event konnte nicht aktualisiert werden.')}
  finally{setRefreshingIds(current=>current.filter(id=>id!==record.id))}
 }
 async function refreshStoredEvents(favoritesOnly=false){
  const targets=savedEvents.filter(item=>!favoritesOnly||item.isFavorite).slice(0,favoritesOnly?6:8)
  if(!targets.length)return
  setBulkRefreshing(true)
  try{for(const item of targets)await refreshStoredEvent(item,favoritesOnly)}finally{setBulkRefreshing(false)}
 }
 function loadRecord(record:EventCenterRecord){
  chooseLocation(record.location)
  setTitle(record.title)
  setDate(record.date)
  setStartTime(record.startTime)
  setEndTime(record.endTime)
  setEnvironment(record.environment)
  setActivity(record.activity)
  setPlan(record.plan)
  setSelectedRecordId(record.id)
  markEventCenterOpened(record.id)
 }
 function saveCurrentPlan(asFavorite=false){
  if(!plan){setError('Bitte zuerst eine Event-Auswertung erzeugen.');return}
  const saved=savePlanRecord(plan,asFavorite?true:undefined)
  setSavedEvents(readEventCenterRecords())
  setSelectedRecordId(saved.id)
 }
 function removeRecord(record:EventCenterRecord){
  deleteEventCenterRecord(record.id)
  if(selectedRecordId===record.id)setSelectedRecordId('')
  if(currentSavedRecord?.id===record.id)setPlan(null)
  setSavedEvents(readEventCenterRecords())
 }
 function toggleFavorite(record:EventCenterRecord){toggleEventCenterFavorite(record.id);setSavedEvents(readEventCenterRecords())}

 const selectedEnvironment=ENVIRONMENT_OPTIONS.find(item=>item.id===environment)??ENVIRONMENT_OPTIONS[0]
 const selectedActivity=ACTIVITY_OPTIONS.find(item=>item.id===activity)??ACTIVITY_OPTIONS[0]
 const latestRuns=plan?.modelInfo?.runs?.slice(0,4)??[]
 const currentTitle=plan?.title?.trim()||title.trim()||'Geplantes Event'
 const outfitHint=plan?buildOutfitHint(plan.summary,plan.environment):''
 const timingHint=plan?buildTimingHint(plan.summary):''
 const lastUpdateText=plan?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(plan.refreshedAt)):''
 const favoriteEvents=savedEvents.filter(item=>item.isFavorite)

 return <section className="event-planner">
  <header className="event-planner-head"><div><span>EVENT-WETTERPLANER</span><h4>Events & Aktivitäten</h4><p>Ort, Termin und Aktivität hinterlegen und eine laufend aktualisierte Einschätzung auf Basis der aktuellen Modellläufe erhalten.</p></div><span className="travel-climate-badge">{forecastWindowHint}</span></header>

  <section className="event-center-shelf">
   <header><div><span>EVENT-CENTER</span><h5>Gespeicherte Events</h5><p>Mehrere Termine parallel verfolgen, als Favorit markieren und bei neuen Modellläufen kompakt überwachen.</p></div><div className="event-center-actions"><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(true)} disabled={bulkRefreshing||!favoriteEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<BellRing size={15}/>} Favoriten aktualisieren</button><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(false)} disabled={bulkRefreshing||!savedEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>} Alle prüfen</button></div></header>
   {savedEvents.length?<div className="event-center-grid">{savedEvents.map(record=>{const active=record.id===selectedRecordId||record.id===currentSavedRecord?.id,recordPlan=record.plan,refreshing=refreshingIds.includes(record.id);return <article key={record.id} className={`event-center-card${active?' active':''}`}>
    <div className="event-center-card-top"><div className="event-center-card-tags"><span className="event-center-card-pill fill">{environmentLabel(record.environment)}</span><span className="event-center-card-pill">{activityLabel(record.activity)}</span>{record.change&&record.change.level!=='none'&&<span className={`event-center-card-pill signal-${record.change.level}`}>{record.change.badge}</span>}</div><button type="button" className={`event-center-favorite${record.isFavorite?' active':''}`} onClick={()=>toggleFavorite(record)} aria-label={record.isFavorite?'Event-Favorit entfernen':'Event favorisieren'}><Star size={15} fill={record.isFavorite?'currentColor':'none'}/></button></div>
    <strong>{record.title||record.location.name}</strong>
    <p>{destinationLabel(record.location)}</p>
    <small>{eventCompactRange(record)}</small>
    <div className="event-center-card-weather"><WeatherPictogram code={recordPlan?.summary.weatherCode??0} day title={label(recordPlan?.summary.weatherCode??0)}/><div><b>{recordPlan?.advice.headline||'Noch keine Analyse gespeichert'}</b><span>{eventMetricLine(recordPlan)}</span></div></div>
    <div className={`event-center-change ${record.change?.level||'none'}`}><BellRing size={14}/><span>{record.change?.summary||'Noch kein Vergleich zum vorherigen Modelllauf vorhanden.'}</span></div>
    <footer><button type="button" className="secondary" onClick={()=>loadRecord(record)}>Öffnen</button><button type="button" className="secondary" onClick={()=>void refreshStoredEvent(record)} disabled={refreshing}>{refreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>} Update</button><button type="button" className="secondary danger-lite" onClick={()=>removeRecord(record)}><Trash2 size={15}/> Löschen</button></footer>
   </article>})}</div>:<div className="event-center-empty"><CalendarRange size={18}/><span>Noch keine gespeicherten Events. Erstelle unten eine Event-Auswertung und übernimm sie anschließend ins Event-Center.</span></div>}
  </section>

  <div className="event-planner-card">
   <div className="event-selected-destination"><MapPin size={18}/><span><small>Aktueller Event-Ort</small><strong>{destinationLabel(destination)}</strong><em>{selectedEnvironment.label} · {selectedActivity.label}</em></span><button type="button" className="secondary" onClick={()=>chooseLocation(initialLocation)}>MID-Ort übernehmen</button></div>
   <form className="travel-location-search" onSubmit={runSearch}><label><span>Anderen Event-Ort suchen</span><div><Search size={16}/><input value={query} onChange={(event:ValueEvent)=>setQuery(event.target.value)} placeholder="Ort, Region, Venue oder ICAO"/></div></label><button type="submit" className="secondary" disabled={searching}>{searching?<RefreshCw className="spin" size={16}/>:<Search size={16}/>} Suchen</button></form>
   {searchError&&<small className="travel-search-error">{searchError}</small>}
   {searchResults.length>0&&<div className="travel-search-results" role="listbox" aria-label="Event-Orte">{searchResults.slice(0,8).map(location=><button type="button" key={`${location.id}:${location.latitude}:${location.longitude}`} onClick={()=>chooseLocation(location)}><MapPin size={15}/><span><strong>{location.icao?`${location.icao} · ${location.name}`:location.name}</strong><small>{[location.poiCategory,location.admin1,location.country].filter(Boolean).join(' · ')||`${formatNumber(location.latitude,2)}°, ${formatNumber(location.longitude,2)}°`}</small></span></button>)}</div>}
  </div>

  <form className="event-plan-form" onSubmit={analyseEvent}>
   <div className="event-form-grid">
    <label className="event-title-field"><span>Event / Anlass</span><input value={title} onChange={(event:ValueEvent)=>setTitle(event.target.value)} placeholder="z. B. Vereinslauf, Konzert, Golfturnier"/></label>
    <label><span>Datum</span><input type="date" min={localToday()} max={addDays(localToday(),13)} value={date} onChange={(event:ValueEvent)=>setDate(event.target.value)}/></label>
    <label><span>Beginn</span><input type="time" step="900" value={startTime} onChange={(event:ValueEvent)=>setStartTime(event.target.value)}/></label>
    <label><span>Ende</span><input type="time" step="900" value={endTime} onChange={(event:ValueEvent)=>setEndTime(event.target.value)}/></label>
   </div>
   <div className="event-choice-block"><span>Rahmen</span><div className="event-chip-row">{ENVIRONMENT_OPTIONS.map(option=><button type="button" key={option.id} className={environment===option.id?'active':''} onClick={()=>setEnvironment(option.id)}><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div></div>
   <div className="event-choice-block"><span>Aktivität</span><div className="event-chip-grid">{ACTIVITY_OPTIONS.map(option=><button type="button" key={option.id} className={activity===option.id?'active':''} onClick={()=>setActivity(option.id)}><strong>{option.label}</strong><small>{option.detail}</small></button>)}</div></div>
   <div className="event-plan-actions"><div className="event-plan-note"><BellRing size={15}/><span>Nach dem ersten Abruf aktualisiert MID die Einschätzung des geöffneten Events automatisch etwa alle 30 Minuten. Favorisierte gespeicherte Events lassen sich zusätzlich gesammelt nach neuen Modellläufen prüfen.</span></div><button type="submit" className="primary travel-analyse" disabled={loading}>{loading?<RefreshCw className="spin" size={17}/>:<CalendarRange size={17}/>} {loading?'Event wird ausgewertet …':'Event-Wetter prüfen'}</button></div>
  </form>

  {error&&<div className="error">{error}</div>}
  {loading&&<div className="travel-loading"><RefreshCw className="spin" size={20}/><div><strong>Event-Bedingungen werden berechnet</strong><span>Stundenwerte, Belastungsfaktoren und verfügbare Modellläufe werden ausgewertet.</span></div></div>}

  {plan&&<section className={`event-plan-result status-${plan.advice.status}`}>
   <div className="event-guide-hero">
    <div className="event-guide-topbar">
     <div className="event-guide-tags">
      <span className="event-guide-pill fill">{environmentLabel(plan.environment)}</span>
      <span className="event-guide-pill">{activityLabel(plan.activity)}</span>
      <span className="event-guide-pill">{formatDate(plan.date)} · {formatClock(plan.startTime)}–{formatClock(plan.endTime)}</span>
     </div>
     <div className="event-guide-status-wrap"><div className={`event-status-badge ${plan.advice.status}`}>{plan.advice.status==='good'?<ShieldCheck size={16}/>:<ShieldAlert size={16}/>}<strong>{statusLabel(plan.advice.status)}</strong></div>{currentSavedRecord?.change&&<small className={`event-inline-update ${currentSavedRecord.change.level}`}>{currentSavedRecord.change.badge}: {currentSavedRecord.change.summary}</small>}</div>
    </div>

    <div className="event-guide-main">
     <div className="event-guide-copy">
      <span>EVENT-CHECK</span>
      <h5>{currentTitle}</h5>
      <p>{destinationLabel(plan.location)}</p>
      <strong>{plan.advice.headline}</strong>
      <p>{plan.advice.summary}</p>
      <div className="event-guide-inline-notes">
       <article><MapPin size={15}/><span>{timingHint}</span></article>
       <article><BellRing size={15}/><span>Letzte Aktualisierung {lastUpdateText}</span></article>
      </div>
      <div className="event-result-toolbar"><button type="button" className="secondary" onClick={()=>saveCurrentPlan(false)}><Star size={15} fill={currentSavedRecord?'currentColor':'none'}/>{currentSavedRecord?'Gespeichertes Event aktualisieren':'Im Event-Center speichern'}</button>{currentSavedRecord?<button type="button" className="secondary" onClick={()=>toggleFavorite(currentSavedRecord)}><Star size={15} fill={currentSavedRecord.isFavorite?'currentColor':'none'}/>{currentSavedRecord.isFavorite?'Favorit entfernen':'Als Favorit markieren'}</button>:<button type="button" className="secondary" onClick={()=>saveCurrentPlan(true)}><BellRing size={15}/>Als Favorit speichern</button>}</div>
     </div>

     <aside className="event-guide-weatherpanel">
      <small>Leitwetter</small>
      <div className="event-guide-weatherrow">
       <WeatherPictogram code={plan.summary.weatherCode??0} day={plan.summary.isDay!==false} title={plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}/>
       <div>
        <strong>{formatNumber(plan.summary.temperatureAvg)}°</strong>
        <span>{plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}</span>
       </div>
      </div>
      <p>{outfitHint}</p>
      <div className="event-guide-quickstats">
       <span><CloudRain size={14}/>{formatNumber(plan.summary.precipitationProbabilityMax)} %</span>
       <span><Wind size={14}/>{formatNumber(plan.summary.windMax)} kt</span>
       <span><Sun size={14}/>{formatNumber(plan.summary.uvMax,1)} UV</span>
      </div>
     </aside>
    </div>

    <div className="event-highlight-row">
     <article className="event-highlight-copy"><small>Aktuelle Einschätzung</small><strong>{plan.advice.headline}</strong><p>{plan.advice.summary}</p></article>
     <article className="event-highlight-weather"><small>Vorbereitung</small><div><span>{outfitHint}</span></div><p>{timingHint}</p></article>
    </div>
   </div>

   <div className="event-metrics-grid">
    <article><Thermometer size={17}/><small>Temperatur</small><strong>{formatNumber(plan.summary.temperatureAvg)} °C</strong><span>{formatNumber(plan.summary.temperatureMin)}–{formatNumber(plan.summary.temperatureMax)} °C · gefühlt Ø {formatNumber(plan.summary.apparentAvg)} °C</span></article>
    <article><CloudRain size={17}/><small>Niederschlag</small><strong>{formatNumber(plan.summary.precipitationProbabilityMax)} %</strong><span>{formatNumber(plan.summary.precipitationTotal,1)} mm im Zeitraum</span></article>
    <article><Wind size={17}/><small>Wind</small><strong>{formatNumber(plan.summary.windMax)} kt</strong><span>Böen bis {formatNumber(plan.summary.gustMax)} kt</span></article>
    <article><Sun size={17}/><small>UV / Sicht</small><strong>{formatNumber(plan.summary.uvMax,1)}</strong><span>Sicht min. {plan.summary.visibilityMin!=null?`${formatNumber(plan.summary.visibilityMin/1000,1)} km`:'–'}</span></article>
   </div>

   <div className="event-guidance-grid">
    <article><strong>Worauf achten?</strong><ul>{plan.advice.tips.map(item=><li key={item}>{item}</li>)}</ul></article>
    <article><strong>Konkrete Empfehlungen</strong><ul>{plan.advice.behavior.map(item=><li key={item}>{item}</li>)}</ul></article>
   </div>

   <div className="event-timeline-card"><header><div><span>ZEITFENSTER</span><h6>Stündlicher Verlauf</h6></div><small>{advancedMode?'Gemeinsamer MID-Pfad: Best Match, unabhängige Modellfamilien, Plausibilisierung und bei Nahterminen Nowcast.':'Dieselbe plausibilisierte Stundenprognose wie in den übrigen MID-Bereichen.'}</small></header><div className="event-timeline">{plan.timeline.map(point=><article key={point.time}><time>{point.time}</time><WeatherPictogram code={point.weatherCode??0} day={point.isDay!==false} title={point.weatherLabel||label(point.weatherCode??0)}/><strong>{formatNumber(point.temperature)}°</strong><small>{point.weatherLabel||label(point.weatherCode??0)} · {formatNumber(point.precipitationProbability)} %</small><small>Wind {formatNumber(point.wind)} kt</small></article>)}</div></div>

   <div className="event-model-updates">
    <header><div><span>MODELL-UPDATES</span><h6>Aktuelle Laufstände</h6></div><small>Zuletzt aktualisiert {lastUpdateText}</small></header>
    <div className="event-model-update-lead"><BellRing size={16}/><span>{plan.modelInfo?.summary||'Die Best-Match-Kette nutzt das am Standort verfügbare Modellsetup. MID aktualisiert diese Einschätzung bei geöffnetem Panel regelmäßig.'}{plan.summary.modelFamilyCount?` · ${plan.summary.modelFamilyCount} unabhängige Modellgruppen numerisch geprüft.`:''}{plan.summary.rapidCycleUsed?' · Rapid-Cycle-Läufe wurden dort einbezogen, wo sie für den Vorhersagehorizont gültig sind.':''}</span></div>
    {latestRuns.length>0&&<div className="event-run-grid">{latestRuns.map(run=><article key={`${run.id}:${run.initialisationTime}`}><strong>{run.label}</strong><small>Init {modelStamp(run.initialisationTime)}</small><small>Verfügbar {modelStamp(run.availabilityTime||run.initialisationTime)}</small>{run.updateIntervalSeconds&&<span>Updateintervall ca. {Math.round(run.updateIntervalSeconds/3600*10)/10} h</span>}</article>)}</div>}
    <footer><span>Quelle: {plan.source}</span><small>{advancedMode?'Die Modellübersicht dient der Transparenz. In kombinierte Aussagen geht pro Unabhängigkeitsgruppe nur eine volle Stimme ein; Varianten derselben Familie werden nicht mehrfach gewichtet.':'Die Modellkette kann je Zeitraum und Variable wechseln; Varianten derselben Familie werden nicht doppelt gewichtet.'}</small></footer>
   </div>
  </section>}
 </section>
}
