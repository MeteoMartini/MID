import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react'
import {ArrowUpDown,BellRing,CalendarRange,ChevronDown,ChevronLeft,CloudLightning,CloudRain,Info,MapPin,Pencil,Plane,RefreshCw,Search,ShieldCheck,ShieldAlert,Snowflake,Star,Sun,Thermometer,Trash2,Wind} from 'lucide-react'
import {WeatherPictogram} from './WeatherPictogram'
import {label,searchLocations,wind,type Hour,type Location,type WindUnit} from './weather'
import {EVENT_CENTER_OPEN_EVENT,EVENT_CENTER_UPDATED_EVENT,buildEventCenterId,compareEventPlanFreshness,compareEventPlans,deleteEventCenterRecord,markEventCenterOpened,readEventCenterRecords,toggleEventCenterFavorite,upsertEventCenterRecord,type EventActivity,type EventCenterRecord,type EventEnvironment,type EventPlan,type EventStatus,type EventSummary,type EventTimelinePoint} from './eventCenter'
import type {ForecastFusionResult} from './forecastFusion'
import {precipitationParts} from './precipitation'
import {formatUvi} from './format'
import {AppInfoHint} from './AppInfoPopover'
import {buildEventPlan} from './eventWeatherEngine'
import {refreshAllEventWeather,refreshEventWeather,type EventWeatherRefreshReason} from './eventWeatherRefresh'

type Props={initialLocation:Location;advancedMode:boolean;unit:WindUnit;canonicalHours?:Hour[];canonicalFusion?:ForecastFusionResult|null;canonicalWeatherTwinApplied?:boolean;backgroundOnly?:boolean}
type ValueEvent={target:{value:string}}

const EVENT_LOCATION_KEY='mid:event-planner:location'
const EVENT_VALUES_KEY='mid:event-planner:values'
const EVENT_SORT_KEY='mid:event-center:sort'
type EventSortMode='chronological'|'favorites'|'updated'|'title'
type EventWorkspaceView='overview'|'editor'|'detail'

type EventRefreshMode='auto'|'manual'|'overview'|'detail'

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
 {id:'concert',label:'Konzert / Bühne',detail:'Publikums- und Aufenthaltskomfort'},
 {id:'flight',label:'Flug',detail:'Sicht, Wolkenuntergrenze, Wind, Gewitter, Vereisung und Turbulenz'}
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
function parseStoredValues(){try{return JSON.parse(storageGet(EVENT_VALUES_KEY)||'{}') as Partial<{title:string;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity}>}catch{return{}}}
function storedSortMode():EventSortMode{const value=storageGet(EVENT_SORT_KEY);return value==='favorites'||value==='updated'||value==='title'?value:'chronological'}
function eventStartStamp(record:EventCenterRecord){const stamp=Date.parse(`${record.date}T${record.startTime||'00:00'}:00`);return Number.isFinite(stamp)?stamp:Number.MAX_SAFE_INTEGER}
function sortEvents(records:EventCenterRecord[],mode:EventSortMode){const chronological=(a:EventCenterRecord,b:EventCenterRecord)=>eventStartStamp(a)-eventStartStamp(b)||(b.updatedAt||0)-(a.updatedAt||0);return [...records].sort((a,b)=>{if(mode==='favorites'&&a.isFavorite!==b.isFavorite)return a.isFavorite?-1:1;if(mode==='updated')return(b.updatedAt||0)-(a.updatedAt||0)||chronological(a,b);if(mode==='title')return(a.title||a.location.name).localeCompare(b.title||b.location.name,'de-DE',{sensitivity:'base'})||chronological(a,b);return chronological(a,b)})}
function environmentLabel(value:EventEnvironment){return ENVIRONMENT_OPTIONS.find(item=>item.id===value)?.label??value}
function activityLabel(value:EventActivity){return ACTIVITY_OPTIONS.find(item=>item.id===value)?.label??value}
function eventWeatherPart(point:EventTimelinePoint){return precipitationParts({time:point.time,precipitation:point.precipitation??0,rain:point.rain??0,showers:point.showers??0,snowfall:point.snowfall??0,probability:point.precipitationProbability??0,code:point.weatherCode??0,temperature:point.temperature??undefined,humidity:point.humidity??undefined,cloud:point.cloud??undefined,lowCloud:point.lowCloud??undefined,cape:point.cape??undefined,liftedIndex:point.liftedIndex??undefined,convectiveInhibition:point.convectiveInhibition??undefined,sunshineDuration:point.sunshineDuration??undefined,isDay:point.isDay})}
function EventTimelinePrecipitationProbability({point}:{point:EventTimelinePoint}){const type=eventWeatherPart(point).type,title=type==='snow'||type==='snowGrains'||type==='snowShowers'?'Schneewahrscheinlichkeit':type==='sleet'||type==='sleetShowers'?'Schnee-/Schneeregenwahrscheinlichkeit':type==='thunderstorm'||type==='thunderstormHail'?'Gewitter-/Niederschlagswahrscheinlichkeit':type==='freezingRain'||type==='freezingDrizzle'?'Wahrscheinlichkeit gefrierenden Niederschlags':'Niederschlagswahrscheinlichkeit',icon=type==='snow'||type==='snowGrains'||type==='snowShowers'||type==='sleet'||type==='sleetShowers'?<Snowflake size={12}/>:type==='thunderstorm'||type==='thunderstormHail'?<CloudLightning size={12}/>:<CloudRain size={12}/>;return <span className="event-timeline-pop" title={title} aria-label={`${title} ${formatNumber(point.precipitationProbability)} Prozent`}>{icon}<b>{formatNumber(point.precipitationProbability)} %</b></span>}
function eventPrecipProbability(summary:EventSummary){return summary.precipitationProbabilityRelevant??summary.precipitationProbabilityMax}
function eventPrecipLabel(summary:EventSummary){return summary.precipitationTypeLabel||'Niederschlag'}
function EventSummaryPrecipitationIcon({summary,size=14}:{summary:EventSummary;size?:number}){const text=`${summary.precipitationTypeLabel||''} ${summary.weatherLabel||''}`.toLocaleLowerCase('de-DE'),code=Number(summary.weatherCode);if(/schnee|graupel|schneeregen/.test(text)||[71,73,75,77,85,86].includes(code))return <Snowflake size={size}/>;if(/gewitter|hagel/.test(text)||[95,96,97,99].includes(code))return <CloudLightning size={size}/>;return <CloudRain size={size}/>}

function statusLabel(value:EventStatus){return value==='good'?'Günstig':'watch'===value?'Beobachten':'Achtung'}
function buildOutfitHint(summary:EventSummary,environment:EventEnvironment,activity:EventActivity){
 if(activity==='flight'){const active=summary.flightHazards?.items.filter(item=>item.level!=='none').map(item=>item.label)??[];return active.length?`Prüfschwerpunkte: ${active.slice(0,3).join(' · ')}`:'Keine markante Flugwetter-Einschränkung im Screening'}
 const layers:string[]=[]
 if((summary.temperatureMax??summary.temperatureAvg??0)>=27)layers.push('leichte, luftige Kleidung')
 else if((summary.temperatureMin??summary.temperatureAvg??99)<=4)layers.push('warme, winddichte Schichten')
 else layers.push('wetterangepasste Übergangskleidung')
 if((eventPrecipProbability(summary)??0)>=40||(summary.precipitationTotal??0)>=1)layers.push('Regenschutz')
 if((summary.uvMax??0)>=6&&environment!=='indoor')layers.push('Sonnen- und Hitzeschutz')
 if((summary.windMax??0)>=16||(summary.gustMax??0)>=24)layers.push('etwas Windschutz')
 return layers.join(' · ')
}
function buildTimingHint(summary:EventSummary,activity:EventActivity){
 if(activity==='flight')return summary.flightHazards?.overall==='caution'?'Flugwetterprodukte vor Durchführung zwingend neu prüfen':summary.flightHazards?.overall==='watch'?'Flugwetterlage vor Abflug gezielt verifizieren':'METAR/TAF vor Abflug aktualisieren'
 if((eventPrecipProbability(summary)??0)>=75)return'Zeitreserve und geeigneten Witterungsschutz vorsehen'
 if((summary.windMax??0)>=18||(summary.gustMax??0)>=28)return'Exponierte Bereiche und windempfindliche Aufbauten besonders berücksichtigen'
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29)return'Trinkwasserversorgung und regelmäßige Erholungspausen sicherstellen'
 return'nach aktuellem Stand keine markante wetterbedingte Einschränkung'
}
function eventCompactRange(record:EventCenterRecord){return`${formatDate(record.date)} · ${formatClock(record.startTime)}–${formatClock(record.endTime)}`}
function eventMetricLine(plan:EventPlan|null,unit:WindUnit){if(!plan)return'Noch keine Analyse.';return`${formatNumber(plan.summary.temperatureAvg)} °C · ${eventPrecipLabel(plan.summary)} ${formatNumber(eventPrecipProbability(plan.summary))} % · Wind ${wind(plan.summary.windMax??Number.NaN,unit)} · G ${wind(plan.summary.gustMax??Number.NaN,unit)}`}

export default function EventPlannerPanel({initialLocation,advancedMode,unit,canonicalHours=[],canonicalFusion=null,canonicalWeatherTwinApplied=false,backgroundOnly=false}:Props){
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
 const [sortMode,setSortMode]=useState<EventSortMode>(()=>storedSortMode())
 const [selectedRecordId,setSelectedRecordId]=useState('')
 const [editingRecordId,setEditingRecordId]=useState('')
 const [refreshingIds,setRefreshingIds]=useState<string[]>([])
 const [bulkRefreshing,setBulkRefreshing]=useState(false)
 const [workspaceView,setWorkspaceView]=useState<EventWorkspaceView>(()=>readEventCenterRecords().length?'overview':'editor')
 const [locationSearchOpen,setLocationSearchOpen]=useState(false)
 const savedEventsRef=useRef(savedEvents)
 const selectedRecordIdRef=useRef(selectedRecordId)
 const editingRecordIdRef=useRef(editingRecordId)
 const searchController=useRef<AbortController|null>(null)
 const searchDebounce=useRef(0)
 const analysisController=useRef<AbortController|null>(null)
 const forecastWindowHint=`Vorhersage aktuell bis ${formatDate(addDays(localToday(),13))}`
 const currentEventId=buildEventCenterId(destination,date,startTime,title.trim()||destination.name)
 const selectedRecord=savedEvents.find(item=>item.id===selectedRecordId)||null
 const editingRecord=savedEvents.find(item=>item.id===editingRecordId)||null
 const currentSavedRecord=editingRecord||(selectedRecord?.id===currentEventId?selectedRecord:null)||savedEvents.find(item=>item.id===currentEventId)||null
 const displayedEvents=useMemo(()=>sortEvents(savedEvents,sortMode),[savedEvents,sortMode])

 useEffect(()=>()=>{window.clearTimeout(searchDebounce.current);searchController.current?.abort();analysisController.current?.abort()},[])
 useEffect(()=>{savedEventsRef.current=savedEvents},[savedEvents])
 useEffect(()=>{selectedRecordIdRef.current=selectedRecordId},[selectedRecordId])
 useEffect(()=>{editingRecordIdRef.current=editingRecordId},[editingRecordId])
 useEffect(()=>{storageSet(EVENT_VALUES_KEY,JSON.stringify({title,date,startTime,endTime,environment,activity}))},[title,date,startTime,endTime,environment,activity])
 useEffect(()=>{storageSet(EVENT_SORT_KEY,sortMode)},[sortMode])
 useEffect(()=>{if(plan||storedLocation())return;setDestination(initialLocation)},[initialLocation,plan])
 useEffect(()=>{
  const sync=()=>{const records=readEventCenterRecords();setSavedEvents(records);if(!backgroundOnly){const activeId=editingRecordIdRef.current||selectedRecordIdRef.current,active=activeId?records.find(item=>item.id===activeId):null;if(active?.plan)setPlan(current=>!current||compareEventPlanFreshness(active.plan,current)>=0?active.plan:current)}}
  const openSaved=(event:Event)=>{if(backgroundOnly)return;const detail=(event as CustomEvent<{id?:string}>).detail,id=String(detail?.id||'');if(!id)return;const record=readEventCenterRecords().find(item=>item.id===id);if(record)loadRecord(record,'detail')}
  window.addEventListener(EVENT_CENTER_UPDATED_EVENT,sync)
  if(!backgroundOnly)window.addEventListener(EVENT_CENTER_OPEN_EVENT,openSaved as EventListener)
  window.addEventListener('storage',sync)
  return()=>{window.removeEventListener(EVENT_CENTER_UPDATED_EVENT,sync);if(!backgroundOnly)window.removeEventListener(EVENT_CENTER_OPEN_EVENT,openSaved as EventListener);window.removeEventListener('storage',sync)}
 },[backgroundOnly])
 useEffect(()=>{
  window.clearTimeout(searchDebounce.current)
  searchController.current?.abort()
  if(!locationSearchOpen){setSearching(false);return}
  const value=query.trim()
  if(value.length<2){setSearching(false);setSearchResults([]);setSearchError('');return}
  const debounceMs=/^\d{2,8}$/.test(value)?45:80
  searchDebounce.current=window.setTimeout(()=>{searchDebounce.current=0;void executeLocationSearch(value)},debounceMs)
  return()=>window.clearTimeout(searchDebounce.current)
 },[query,locationSearchOpen])

 async function executeLocationSearch(value:string){
  searchController.current?.abort()
  const controller=new AbortController()
  searchController.current=controller
  setSearching(true)
  setSearchError('')
  try{
   const results=await searchLocations(value,controller.signal)
   if(searchController.current!==controller||controller.signal.aborted)return
   setSearchResults(results)
   if(!results.length)setSearchError('Kein passender Ort oder POI gefunden.')
  }catch(reason){if(!controller.signal.aborted&&searchController.current===controller)setSearchError(reason instanceof Error?reason.message:'Ortssuche fehlgeschlagen.')}
  finally{if(searchController.current===controller&&!controller.signal.aborted)setSearching(false)}
 }
 function runSearch(event:FormEvent){
  event.preventDefault()
  window.clearTimeout(searchDebounce.current);searchDebounce.current=0
  const value=query.trim()
  if(value.length<2){searchController.current?.abort();setSearching(false);setSearchResults([]);setSearchError('Bitte mindestens zwei Zeichen eingeben.');return}
  void executeLocationSearch(value)
 }
 function chooseLocation(location:Location){window.clearTimeout(searchDebounce.current);searchController.current?.abort();setSearching(false);setDestination(location);setSearchResults([]);setQuery('');setSearchError('');storageSet(EVENT_LOCATION_KEY,JSON.stringify(location))}
 async function buildPlan(location:Location,eventDate:string,eventStartTime:string,eventEndTime:string,eventEnvironment:EventEnvironment,eventActivity:EventActivity,eventTitle:string,signal:AbortSignal,forceFresh=false){
  return buildEventPlan({location,eventDate,eventStartTime,eventEndTime,eventEnvironment,eventActivity,eventTitle,signal,forceFresh,canonical:{initialLocation,hours:canonicalHours,fusion:canonicalFusion,weatherTwinApplied:canonicalWeatherTwinApplied}})
 }
 function validateInputs(location:Location|null,eventDate:string,eventStartTime:string,eventEndTime:string){
  if(!location){setError('Bitte zuerst einen Ort auswählen.');return false}
  if(!eventDate||!eventStartTime||!eventEndTime){setError('Bitte Datum sowie Start- und Endzeit angeben.');return false}
  if(eventDate>addDays(localToday(),13)){setError('Der Event-Planer wertet die nächsten 14 Tage aus. Für spätere Termine bitte näher am Termin erneut prüfen.');return false}
  return true
 }
 function savePlanRecord(nextPlan:EventPlan,forceFavorite?:boolean){
  const id=editingRecordId||currentSavedRecord?.id||buildEventCenterId(nextPlan.location,nextPlan.date,nextPlan.startTime,nextPlan.title||nextPlan.location.name)
  const previous=readEventCenterRecords().find(item=>item.id===id)??savedEvents.find(item=>item.id===id)??null
  const change=compareEventPlans(previous?.plan,nextPlan)
  const isFavorite=forceFavorite??previous?.isFavorite??Boolean(currentSavedRecord?.isFavorite),favoriteChanged=previous?previous.isFavorite!==isFavorite:false
  const record:EventCenterRecord={
   id,
   title:nextPlan.title.trim()||nextPlan.location.name,
   location:nextPlan.location,
   date:nextPlan.date,
   startTime:nextPlan.startTime,
   endTime:nextPlan.endTime,
   environment:nextPlan.environment,
   activity:nextPlan.activity,
   isFavorite,
   favoriteUpdatedAt:favoriteChanged||(!previous&&isFavorite)?Date.now():previous?.favoriteUpdatedAt,
   createdAt:previous?.createdAt??Date.now(),
   updatedAt:Date.now(),
   lastOpenedAt:Date.now(),
   plan:nextPlan,
   change
  }
  const records=upsertEventCenterRecord(record)
  savedEventsRef.current=records
  setSavedEvents(records)
  setSelectedRecordId(record.id)
  if(editingRecordId)setEditingRecordId(record.id)
  return record
 }
 async function analyseEvent(event?:FormEvent,silent=false,forceFresh=false){
  event?.preventDefault()
  setError('')
  if(!validateInputs(destination,date,startTime,endTime))return
  if(forceFresh&&currentSavedRecord){
   setLoading(true)
   try{
    const result=await refreshEventWeather(currentSavedRecord.id,{reason:'detail'})
    const latest=readEventCenterRecords().find(item=>item.id===currentSavedRecord.id)
    if(result.refreshed>0&&latest?.plan){setPlan(latest.plan);setSavedEvents(readEventCenterRecords());setSelectedRecordId(latest.id);if(!silent)setWorkspaceView('detail')}
    else if(!silent)setError('Event-Wetter konnte nicht dauerhaft aktualisiert werden. Bitte Verbindung und Datenquellen prüfen.')
   }finally{setLoading(false)}
   return
  }
  if(!silent)setPlan(null)
  analysisController.current?.abort()
  const controller=new AbortController();analysisController.current=controller;setLoading(true)
  try{const nextPlan=await buildPlan(destination,date,startTime,endTime,environment,activity,title,controller.signal,forceFresh);setPlan(nextPlan);if(currentSavedRecord)savePlanRecord(nextPlan);if(!silent)setWorkspaceView('detail')}
  catch(reason){if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Event-Auswertung fehlgeschlagen.')}
  finally{if(analysisController.current===controller){if(!controller.signal.aborted)setLoading(false);analysisController.current=null}}
 }
 function refreshReason(mode:EventRefreshMode):EventWeatherRefreshReason{return mode==='detail'?'detail':mode==='overview'?'overview':mode==='manual'?'header':'auto-stale'}
 async function refreshStoredEvent(record:EventCenterRecord,markAsFavoritePass=false,silentFailure=false,mode:EventRefreshMode='manual'){
  setRefreshingIds(current=>current.includes(record.id)?current:[...current,record.id])
  try{
   if(markAsFavoritePass&&!record.isFavorite)toggleEventCenterFavorite(record.id)
   const result=await refreshEventWeather(record.id,{reason:refreshReason(mode)}),records=readEventCenterRecords(),latest=records.find(item=>item.id===record.id)
   savedEventsRef.current=records;setSavedEvents(records)
   if(latest?.plan&&!backgroundOnly&&(selectedRecordId===record.id||currentEventId===record.id)){setPlan(latest.plan);setSelectedRecordId(record.id)}
   if(result.refreshed<1&&!silentFailure)setError('Gespeichertes Event konnte nicht dauerhaft aktualisiert werden.')
   return result.refreshed>0
  }finally{setRefreshingIds(current=>current.filter(id=>id!==record.id))}
 }
 async function refreshStoredEvents(favoritesOnly=false,silentFailure=false,mode:EventRefreshMode='manual'){
  if(!silentFailure)setError('')
  setBulkRefreshing(true)
  try{
   const result=await refreshAllEventWeather({reason:refreshReason(mode),favoritesOnly}),records=readEventCenterRecords()
   savedEventsRef.current=records;setSavedEvents(records)
   if(result.failed>0&&!silentFailure)setError(`${result.failed} Event${result.failed===1?'':'s'} konnte${result.failed===1?'':'n'} nicht dauerhaft aktualisiert werden.`)
   return result.refreshed
  }finally{setBulkRefreshing(false)}
 }
 function loadRecord(record:EventCenterRecord,target:EventWorkspaceView='detail'){
  chooseLocation(record.location)
  setTitle(record.title)
  setDate(record.date)
  setStartTime(record.startTime)
  setEndTime(record.endTime)
  setEnvironment(record.environment)
  setActivity(record.activity)
  setPlan(record.plan)
  setSelectedRecordId(record.id)
  setEditingRecordId(record.id)
  setLocationSearchOpen(false)
  setWorkspaceView(target)
  markEventCenterOpened(record.id)
 }
 function startNewEvent(){
  setEditingRecordId('')
  setSelectedRecordId('')
  setPlan(null)
  setError('')
  setTitle('')
  setLocationSearchOpen(false)
  setWorkspaceView('editor')
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
  if(editingRecordId===record.id)setEditingRecordId('')
  if(currentSavedRecord?.id===record.id)setPlan(null)
  setSavedEvents(readEventCenterRecords())
 }
 function toggleFavorite(record:EventCenterRecord){toggleEventCenterFavorite(record.id);setSavedEvents(readEventCenterRecords())}

 if(backgroundOnly)return null

 const selectedEnvironment=ENVIRONMENT_OPTIONS.find(item=>item.id===environment)??ENVIRONMENT_OPTIONS[0]
 const selectedActivity=ACTIVITY_OPTIONS.find(item=>item.id===activity)??ACTIVITY_OPTIONS[0]
 const latestRuns=plan?.modelInfo?.runs?.slice(0,4)??[]
 const currentTitle=plan?.title?.trim()||title.trim()||'Geplantes Event'
 const outfitHint=plan?buildOutfitHint(plan.summary,plan.environment,plan.activity):''
 const timingHint=plan?buildTimingHint(plan.summary,plan.activity):''
 const lastUpdateText=plan?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(plan.refreshedAt)):''
 const favoriteEvents=savedEvents.filter(item=>item.isFavorite)

 return <section className="event-planner">
  <header className="event-planner-head"><div><span>EVENTPLANER</span><h4>Events & Aktivitäten</h4><p>Termin anlegen, Wetterlage erfassen und relevante Hinweise schnell abrufen.</p></div><div className="event-head-actions"><span className="travel-climate-badge">{forecastWindowHint}</span><AppInfoHint label="Informationen zum Eventplaner" width={390}><strong>Eventplaner</strong><p>MID verwendet dieselben plausibilisierten Wetterpfade, Einheiten und Qualitätsregeln wie die übrige App. Gespeicherte Events werden nur bei relevanten Wetteränderungen hervorgehoben; ein neuer Modelllauf allein erzeugt keine Warnmarkierung.</p><p>Event-Favoriten sind vollständig unabhängig von den normalen Ortsfavoriten. Derselbe Ort kann gleichzeitig Ortsfavorit und Event-Favorit sein; das Ändern des einen Status verändert den anderen nicht.</p><p>Flugwetter-Hazards sind automatisierte MID-Diagnosen und keine amtliche Flugwetterberatung.</p></AppInfoHint></div></header>

  <nav className="event-workspace-nav" aria-label="Eventplaner-Bereiche">
   <button type="button" className={workspaceView==='overview'?'active':''} onClick={()=>setWorkspaceView('overview')}><span>Übersicht</span><small>{savedEvents.length} gespeichert</small></button>
   <button type="button" className={workspaceView==='editor'?'active':''} onClick={()=>{if(workspaceView!=='editor'&&editingRecordId)setWorkspaceView('editor');else if(workspaceView!=='editor')startNewEvent()}}><span>{editingRecordId?'Bearbeiten':'Neu planen'}</span><small>{editingRecordId?'Event anpassen':'Aktivität anlegen'}</small></button>
   <button type="button" className={workspaceView==='detail'?'active':''} disabled={!plan} onClick={()=>plan&&setWorkspaceView('detail')}><span>Details & Rat</span><small>{plan?'Auswertung öffnen':'nach Wettercheck'}</small></button>
  </nav>

  {workspaceView==='overview'&&<section className="event-center-shelf">
   <header><div><span>EVENT-CENTER</span><h5>Kompakte Übersicht</h5><small>{savedEvents.length} gespeichert · {favoriteEvents.length} Favorit{favoriteEvents.length===1?'':'en'}</small></div><div className="event-center-actions"><button type="button" className="primary event-new-button" onClick={startNewEvent}><CalendarRange size={15}/> Neu</button><label className="event-center-sort"><ArrowUpDown size={14}/><span>Sortierung</span><select value={sortMode} onChange={(event:ValueEvent)=>setSortMode(event.target.value as EventSortMode)} aria-label="Events sortieren"><option value="chronological">Chronologisch</option><option value="favorites">Favoriten zuerst</option><option value="updated">Zuletzt geändert</option><option value="title">Titel A–Z</option></select></label><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(true,false,'overview')} disabled={bulkRefreshing||!favoriteEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<BellRing size={15}/>} Favoriten</button><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(false,false,'overview')} disabled={bulkRefreshing||!savedEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>} Alle</button><AppInfoHint label="Informationen zum Event-Center"><strong>Event-Center</strong><p>Standardmäßig chronologisch. Die Karten zeigen zuerst nur Termin, Ort und meteorologische Eckdaten. Aufklappen liefert eine Kurzbewertung; „Details & Ratschläge“ öffnet die vollständige Auswertung.</p></AppInfoHint></div></header>
   {savedEvents.length?<div className="event-center-grid compact">{displayedEvents.map(record=>{const active=record.id===selectedRecordId||record.id===currentSavedRecord?.id,recordPlan=record.plan,refreshing=refreshingIds.includes(record.id);return <article key={record.id} className={`event-center-card compact${active?' active':''}`}>
    <button type="button" className={`event-center-favorite${record.isFavorite?' active':''}`} onClick={()=>toggleFavorite(record)} aria-label={record.isFavorite?'Event-Favorit entfernen':'Als Event-Favorit markieren'} title={record.isFavorite?'Event-Favorit entfernen':'Als Event-Favorit markieren'}><Star size={15} fill={record.isFavorite?'currentColor':'none'}/></button>
    <details className="event-center-card-disclosure">
     <summary>
      <span className="event-center-card-overview">
       <span className="event-center-card-overview-head"><strong>{record.title||record.location.name}</strong><span className="event-center-card-tags"><span className="event-center-card-pill fill">{environmentLabel(record.environment)}</span><span className="event-center-card-pill">{activityLabel(record.activity)}</span>{record.change&&record.change.level!=='none'&&<span className={`event-center-card-pill signal-${record.change.level}`}>{record.change.badge}</span>}</span></span>
       <span className="event-center-card-meta"><span>{eventCompactRange(record)}</span><span>{record.location.name}</span></span>
       <span className="event-center-card-quick-weather"><WeatherPictogram code={recordPlan?.summary.weatherCode??0} day={recordPlan?.summary.isDay!==false} title={recordPlan?.summary.weatherLabel||label(recordPlan?.summary.weatherCode??0)}/><span>{eventMetricLine(recordPlan,unit)}</span></span>
      </span>
      <span className="event-center-disclosure-hint"><span>Vorschau</span><ChevronDown size={15}/></span>
     </summary>
     <div className="event-center-card-details">
      <div className="event-center-card-weather"><WeatherPictogram code={recordPlan?.summary.weatherCode??0} day={recordPlan?.summary.isDay!==false} title={recordPlan?.summary.weatherLabel||label(recordPlan?.summary.weatherCode??0)}/><div><b>{recordPlan?.advice.headline||'Noch keine Analyse'}</b><span>{recordPlan?.advice.summary||destinationLabel(record.location)}</span></div></div>
      {record.change?.level&&record.change.level!=='none'?<div className={`event-center-change ${record.change.level}`}><BellRing size={14}/><span>{record.change.summary}</span></div>:null}
      <footer><button type="button" className="primary" onClick={()=>loadRecord(record,'detail')}><ShieldCheck size={15}/> Details & Ratschläge</button><button type="button" className="secondary" onClick={()=>loadRecord(record,'editor')}><Pencil size={15}/> Bearbeiten</button><button type="button" className="secondary icon-only" onClick={()=>void refreshStoredEvent(record,false,false,'overview')} disabled={refreshing} aria-label="Event aktualisieren" title="Aktualisieren">{refreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>}</button><button type="button" className="secondary danger-lite icon-only" onClick={()=>removeRecord(record)} aria-label="Event löschen" title="Löschen"><Trash2 size={15}/></button></footer>
     </div>
    </details>
   </article>})}</div>:<div className="event-center-empty"><CalendarRange size={18}/><span>Noch keine Events gespeichert.</span><button type="button" className="primary" onClick={startNewEvent}>Erstes Event anlegen</button></div>}
  </section>}

  {workspaceView==='editor'&&<section className="event-editor-stack">
   <div className="event-planner-card compact-location-card">
    <div className="event-selected-destination compact"><MapPin size={17}/><span><small>Event-Ort</small><strong>{destinationLabel(destination)}</strong><em>{selectedEnvironment.label} · {selectedActivity.label}</em></span><div className="event-location-actions"><button type="button" className="secondary" onClick={()=>setLocationSearchOpen(value=>!value)}><Search size={15}/>{locationSearchOpen?'Suche schließen':'Ort ändern'}</button><button type="button" className="secondary icon-only" onClick={()=>{chooseLocation(initialLocation);setLocationSearchOpen(false)}} aria-label="MID-Ort übernehmen" title="MID-Ort"><MapPin size={15}/></button></div></div>
    {locationSearchOpen&&<div className="event-location-search-panel"><form className="travel-location-search compact" onSubmit={runSearch}><label><span>Anderen Ort suchen</span><div><Search size={16}/><input type="search" inputMode="search" enterKeyHint="search" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" value={query} onChange={(event:ValueEvent)=>setQuery(event.target.value)} placeholder="Ort, PLZ, ICAO oder POI" aria-label="Event-Ort suchen" aria-busy={searching} autoFocus/></div></label><button type="submit" className="secondary" disabled={searching||query.trim().length<2}>{searching?<RefreshCw className="spin" size={16}/>:<Search size={16}/>} Suchen</button></form>{searchError&&<small className="travel-search-error">{searchError}</small>}{searchResults.length>0&&<div className="travel-search-results" role="listbox" aria-label="Event-Orte">{searchResults.slice(0,8).map(location=><button type="button" key={`${location.id}:${location.latitude}:${location.longitude}`} onClick={()=>{chooseLocation(location);setLocationSearchOpen(false)}}><MapPin size={15}/><span><strong>{location.icao?`${location.icao} · ${location.name}`:location.name}</strong><small>{[location.poiCategory,location.admin1,location.country].filter(Boolean).join(' · ')||`${formatNumber(location.latitude,2)}°, ${formatNumber(location.longitude,2)}°`}</small></span></button>)}</div>}</div>}
   </div>

   <form className="event-plan-form compact" onSubmit={analyseEvent}>
    <header className="event-editor-head"><div><span>{editingRecordId?'EVENT BEARBEITEN':'NEUES EVENT'}</span><strong>{editingRecordId?'Termin und Aktivität anpassen':'Wenige Angaben – danach direkt zum Wettercheck'}</strong></div>{editingRecordId&&<button type="button" className="secondary" onClick={()=>plan?setWorkspaceView('detail'):setWorkspaceView('overview')}>Abbrechen</button>}</header>
    <div className="event-form-grid compact">
     <label className="event-title-field"><span>Event / Anlass</span><input value={title} onChange={(event:ValueEvent)=>setTitle(event.target.value)} placeholder="z. B. Spiel, Ausflug, Flug"/></label>
     <label><span>Datum</span><input type="date" min={localToday()} max={addDays(localToday(),13)} value={date} onChange={(event:ValueEvent)=>setDate(event.target.value)}/></label>
     <label><span>Beginn</span><input type="time" step="900" value={startTime} onChange={(event:ValueEvent)=>setStartTime(event.target.value)}/></label>
     <label><span>Ende</span><input type="time" step="900" value={endTime} onChange={(event:ValueEvent)=>setEndTime(event.target.value)}/></label>
    </div>
    <div className="event-choice-block compact"><span>Rahmen</span><div className="event-chip-row">{ENVIRONMENT_OPTIONS.map(option=><button type="button" key={option.id} className={environment===option.id?'active':''} onClick={()=>setEnvironment(option.id)} title={option.detail}><strong>{option.label}</strong></button>)}</div></div>
    <div className="event-choice-block compact activity"><span>Aktivität</span><div className="event-chip-grid">{ACTIVITY_OPTIONS.map(option=><button type="button" key={option.id} className={activity===option.id?'active':''} onClick={()=>setActivity(option.id)} title={option.detail}><strong>{option.id==='flight'?<><Plane size={14}/> {option.label}</>:option.label}</strong></button>)}</div></div>
    <div className="event-plan-actions compact"><span className="event-auto-update-note"><RefreshCw size={13}/> Automatische Neubewertung <AppInfoHint label="Informationen zur automatischen Aktualisierung" width={340}><strong>Automatische Aktualisierung</strong><p>Gespeicherte aktive Events werden im Hintergrund auf neue Modellläufe und veraltete Wetterstände geprüft und mindestens etwa alle 30 Minuten neu bewertet. Die Glocke reagiert nur auf deutlich veränderte meteorologische Eckdaten, nicht auf jeden neuen Modelllauf.</p></AppInfoHint></span><button type="submit" className="primary travel-analyse" disabled={loading}>{loading?<RefreshCw className="spin" size={17}/>:<CalendarRange size={17}/>} {loading?'Wird geprüft …':editingRecordId?'Änderungen prüfen':'Wetter prüfen'}</button></div>
   </form>
  </section>}

  {error&&<div className="error">{error}</div>}
  {loading&&<div className="travel-loading"><RefreshCw className="spin" size={20}/><div><strong>Analyse läuft</strong><span>{activity==='flight'?'Wetter, amtliche Flugwetterprodukte und Druckniveau-Hazards werden geprüft.':'Stundenwerte und relevante Wetterfaktoren werden geprüft.'}</span></div></div>}

  {workspaceView==='detail'&&plan&&<section className={`event-plan-result status-${plan.advice.status}`}>
   <div className="event-detail-toolbar"><button type="button" className="secondary" onClick={()=>setWorkspaceView('overview')}><ChevronLeft size={15}/> Übersicht</button><button type="button" className="secondary" onClick={()=>setWorkspaceView('editor')}><Pencil size={15}/> Bearbeiten</button><button type="button" className="secondary" onClick={startNewEvent}><CalendarRange size={15}/> Neu</button></div>
   <div className="event-guide-hero">
    <div className="event-guide-topbar">
     <div className="event-guide-tags"><span className="event-guide-pill fill">{environmentLabel(plan.environment)}</span><span className="event-guide-pill">{activityLabel(plan.activity)}</span><span className="event-guide-pill">{formatDate(plan.date)} · {formatClock(plan.startTime)}–{formatClock(plan.endTime)}</span></div>
     <div className="event-guide-status-wrap"><div className={`event-status-badge ${plan.advice.status}`}>{plan.advice.status==='good'?<ShieldCheck size={16}/>:<ShieldAlert size={16}/>}<strong>{statusLabel(plan.advice.status)}</strong></div>{currentSavedRecord?.change&&currentSavedRecord.change.level!=='none'?<small className={`event-inline-update ${currentSavedRecord.change.level}`}>{currentSavedRecord.change.summary}</small>:null}</div>
    </div>
    <div className="event-guide-main">
     <div className="event-guide-copy"><span>EVENT-CHECK</span><h5>{currentTitle}</h5><p>{destinationLabel(plan.location)}</p><strong>{plan.advice.headline}</strong><p>{plan.advice.summary}</p><div className="event-guide-inline-notes"><article><MapPin size={15}/><span>{timingHint}</span></article><article><BellRing size={15}/><span>Stand {lastUpdateText}</span></article></div><div className="event-result-toolbar"><button type="button" className="secondary" onClick={()=>currentSavedRecord?void analyseEvent(undefined,true,true):saveCurrentPlan(false)} disabled={loading}>{currentSavedRecord?<RefreshCw className={loading?'spin':undefined} size={15}/>:<Star size={15}/>} {currentSavedRecord?(loading?'Aktualisiere …':'Event aktualisieren'):'Event speichern'}</button>{currentSavedRecord?<button type="button" className="secondary" onClick={()=>toggleFavorite(currentSavedRecord)}><Star size={15} fill={currentSavedRecord.isFavorite?'currentColor':'none'}/>{currentSavedRecord.isFavorite?'Event-Favorit entfernen':'Event-Favorit'}</button>:<button type="button" className="secondary" onClick={()=>saveCurrentPlan(true)}><Star size={15}/>Als Event-Favorit speichern</button>}</div></div>
     <aside className="event-guide-weatherpanel"><small>Leitwetter</small><div className="event-guide-weatherrow"><WeatherPictogram code={plan.summary.weatherCode??0} day={plan.summary.isDay!==false} title={plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}/><div><strong>{formatNumber(plan.summary.temperatureAvg)}°</strong><span>{plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}</span></div></div><p>{outfitHint}</p><div className="event-guide-quickstats"><span><EventSummaryPrecipitationIcon summary={plan.summary}/>{eventPrecipLabel(plan.summary)} · {formatNumber(eventPrecipProbability(plan.summary))} %</span><span><Wind size={14}/>{wind(plan.summary.windMax??Number.NaN,unit)} · G {wind(plan.summary.gustMax??Number.NaN,unit)}</span><span><Sun size={14}/>UVI {formatUvi(plan.summary.uvMax??Number.NaN)}</span></div></aside>
    </div>
   </div>

   <div className="event-metrics-grid">
    <article><Thermometer size={17}/><small>Temperatur</small><strong>{formatNumber(plan.summary.temperatureAvg)} °C</strong><span>{formatNumber(plan.summary.temperatureMin)}–{formatNumber(plan.summary.temperatureMax)} °C · gefühlt Ø {formatNumber(plan.summary.apparentAvg)} °C</span></article>
    <article><EventSummaryPrecipitationIcon summary={plan.summary} size={17}/><small>Niederschlag</small><strong><span className="event-precip-detail-symbol" title={eventPrecipLabel(plan.summary)} aria-label={eventPrecipLabel(plan.summary)}><EventSummaryPrecipitationIcon summary={plan.summary}/></span> {formatNumber(eventPrecipProbability(plan.summary))} %</strong><span>{formatNumber(plan.summary.precipitationTotal,1)} mm{plan.summary.precipitationProbabilitySource==='ensemble-members-dwd-event'&&plan.summary.precipitationProbabilitySignificant!=null?` · >5 mm ${formatNumber(plan.summary.precipitationProbabilitySignificant)} %`:''}</span></article>
    <article><Wind size={17}/><small>Wind</small><strong>{wind(plan.summary.windMax??Number.NaN,unit)}</strong><span>Böen {wind(plan.summary.gustMax??Number.NaN,unit)}</span></article>
    <article><Sun size={17}/><small>UVI / Sicht</small><strong>UVI {formatUvi(plan.summary.uvMax??Number.NaN)}</strong><span>Sicht min. {plan.summary.visibilityMin!=null?`${formatNumber(plan.summary.visibilityMin/1000,1)} km`:'–'}</span></article>
   </div>

   <section className="event-guidance-section"><header><div><span>HINWEISE</span><strong>Wetterbedingte Hinweise und Maßnahmen</strong></div></header><div className="event-guidance-grid"><article><strong>Lagehinweise</strong><ul>{plan.advice.tips.map(item=><li key={item}>{item}</li>)}</ul></article><article><strong>Empfohlene Maßnahmen</strong><ul>{plan.advice.behavior.map(item=><li key={item}>{item}</li>)}</ul></article></div></section>

   {plan.activity==='flight'&&plan.summary.flightHazards?<section className={`event-flight-hazards ${plan.summary.flightHazards.overall}`}><header><div><Plane size={18}/><span><small>FLUGMETEOROLOGIE</small><strong>Hazard-Screening</strong></span></div><AppInfoHint label="Informationen zum Flugwetter-Screening" width={430}><strong>Quellen & Priorität</strong><p>MID priorisiert standort- und zeitbezogene ICAO-SIGMET und TAF; bei Nahterminen kommen METAR/SPECI und PIREP/AIREP hinzu. Mit autorisiertem WIFS-Zugang werden die maschinenlesbaren WAFS-SIGWX-Daten von WAFC London und WAFC Washington ausgewertet – also die Datenbasis der Significant-Weather-Charts. Nationale Wetterdienste fließen über den ICAO-Austausch ein; freigegebene Open-Data-Produkte werden, wo verfügbar, zusätzlich direkt genutzt (derzeit u. a. KNMI AIRMET/SIGMET). Die MID-Druckniveaudiagnose ergänzt diese amtlichen Quellen.</p><div className="event-flight-source-list">{plan.summary.flightHazards.sources?.map(source=><span key={source.id} className={source.status}><b>{source.label}</b><small>{source.status==='used'?'verwendet':source.status==='available'?'geprüft':source.status==='not-configured'?'Zugang nicht eingerichtet':'derzeit nicht erreichbar'}{source.detail?` · ${source.detail}`:''}</small></span>)}</div><p>Direkt zugangsbeschränkte oder nicht zur Weiterverarbeitung freigegebene nationale SWC-/Spezialprodukte werden nicht automatisiert aus Webseiten extrahiert.</p><p>Kein Ersatz für ein vorgeschriebenes amtliches Flugwetterbriefing.</p></AppInfoHint></header>{plan.summary.flightHazards.available?<div className="event-flight-hazard-grid">{plan.summary.flightHazards.items.map(item=><article key={item.id} className={item.level}><small>{item.label}</small><strong>{item.level==='caution'?'kritisch':item.level==='watch'?'beachten':'unauffällig'}</strong><span>{item.detail}</span></article>)}</div>:<div className="event-flight-unavailable">{plan.summary.flightHazards.note||'Flugprofildaten derzeit nicht verfügbar.'}</div>}{plan.summary.flightHazards.freezingLevelMin!=null?<footer>Nullgradgrenze im Zeitfenster: ca. {Math.round(plan.summary.flightHazards.freezingLevelMin/50)*50} m</footer>:null}</section>:null}

   <details className="event-detail-disclosure">
    <summary><span><small>MEHR DETAILS</small><strong>Stündlicher Verlauf & Datenbasis</strong></span><ChevronDown size={18}/></summary>
    <div className="event-detail-disclosure-body">
     <div className="event-timeline-card"><header><div><span>ZEITFENSTER</span><h6>Stündlicher Verlauf</h6></div><AppInfoHint label="Informationen zum Stundenverlauf" width={390}><strong>Stündlicher Verlauf</strong><p>{advancedMode?'Best Match, unabhängige Modellfamilien und MID-Plausibilisierung; bei Nahterminen zusätzlich Nowcast. Die große Niederschlagswahrscheinlichkeit wird über das gesamte Eventfenster ausgewertet: bevorzugt aus Ensemble-Membern über die im Zeitraum aufsummierte Niederschlagsmenge; falls diese Auswertung nicht verfügbar ist, als zeitgewichtetes Mittel aller überlappenden Stundenwahrscheinlichkeiten – niemals nur als höchste Einzelstunde. Die Prozentwerte in den Karten gelten für das jeweils angegebene Stundenintervall; Open-Meteo weist Niederschlagswerte als Summe bzw. Wahrscheinlichkeit der vorangehenden Stunde aus, daher schneidet MID diese Intervalle exakt auf Start und Ende des Events zu.':'Dieselbe plausibilisierte Stundenprognose wie in der übrigen App. Die große Niederschlagswahrscheinlichkeit gilt für den gesamten Eventzeitraum; die Karten zeigen nur die tatsächlich überlappenden Stundenintervalle.'}</p></AppInfoHint></header><div className="event-timeline">{plan.timeline.map(point=><article key={`${point.periodLabel||point.time}:${point.time}`}><time>{point.periodLabel||point.time}</time><WeatherPictogram code={point.weatherCode??0} day={point.isDay!==false} title={point.weatherLabel||label(point.weatherCode??0)}/><strong>{formatNumber(point.temperature)}°</strong><small className="event-timeline-weather-meta"><span>{point.weatherLabel||label(point.weatherCode??0)}</span><span aria-hidden="true"> · </span><EventTimelinePrecipitationProbability point={point}/></small><small>Wind {wind(point.wind??Number.NaN,unit)} · G {wind(point.gust??Number.NaN,unit)}</small></article>)}</div></div>
     <details className="event-model-disclosure"><summary><Info size={16}/><span>Daten & Modellstand</span><ChevronDown size={15}/></summary><div className="event-model-updates"><header><div><span>MODELLSTAND</span><h6>Aktuelle Laufstände</h6></div><small>{lastUpdateText}</small></header>{plan.modelInfo?.summary?<div className="event-model-update-lead"><BellRing size={16}/><span>{plan.modelInfo.summary}</span></div>:null}{latestRuns.length>0&&<div className="event-run-grid">{latestRuns.map(run=><article key={`${run.id}:${run.initialisationTime}`}><strong>{run.label}</strong><small>Init {modelStamp(run.initialisationTime)}</small><small>Verfügbar {modelStamp(run.availabilityTime||run.initialisationTime)}</small></article>)}</div>}<footer><span>Quelle: {plan.source}</span><small>{plan.summary.modelFamilyCount?`${plan.summary.modelFamilyCount} unabhängige Modellgruppen geprüft. `:''}{plan.summary.rapidCycleUsed?'Rapid-Cycle-Läufe einbezogen. ':''}{advancedMode?'Varianten derselben Modellfamilie werden nicht mehrfach gewichtet.':''}</small></footer></div></details>
    </div>
   </details>
  </section>}
 </section>
}
