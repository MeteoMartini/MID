import {useEffect,useMemo,useRef,useState,type FormEvent} from 'react'
import {ArrowUpDown,BellRing,CalendarRange,ChevronDown,ChevronLeft,CloudRain,Info,MapPin,Pencil,Plane,RefreshCw,Search,ShieldCheck,ShieldAlert,Star,Sun,Thermometer,Trash2,Wind} from 'lucide-react'
import {WeatherPictogram} from './WeatherPictogram'
import {applyEnsembleDailyPrecipitationProbability,bestMatchModelInfo,eventEnsembleForecast,forecast,label,localIsoEpoch,mapDays,mapHours,radarNowcast,searchLocations,station,thunderstormNowcast,wind,type EventPrecipitationProbabilityAssessment,type Hour,type Location,type WindUnit} from './weather'
import {EVENT_CENTER_OPEN_EVENT,EVENT_CENTER_UPDATED_EVENT,buildEventCenterId,compareEventPlans,deleteEventCenterRecord,markEventCenterOpened,readEventCenterRecords,toggleEventCenterFavorite,upsertEventCenterRecord,type EventActivity,type EventAdvice,type EventCenterRecord,type EventEnvironment,type EventPlan,type EventStatus,type EventSummary,type EventTimelinePoint} from './eventCenter'
import {applyForecastFusionDays,applyForecastFusionHours,finalizeForecastHours,forecastFusionLabel,loadForecastFusion,type ForecastFusionResult} from './forecastFusion'
import {compactPrecipitationTypeLabel,precipitationParts} from './precipitation'
import {formatUvi} from './format'
import {loadEventFlightHazards} from './eventAviation'
import {AppInfoHint} from './AppInfoPopover'
import {applyLocalTwinForecastFromReport,applyLocalTwinHours,buildForecastVerificationReport,readWeatherTwinSettings} from './forecastVerification'

type Props={initialLocation:Location;advancedMode:boolean;unit:WindUnit;canonicalHours?:Hour[];canonicalFusion?:ForecastFusionResult|null;canonicalWeatherTwinApplied?:boolean}
type ValueEvent={target:{value:string}}

const EVENT_LOCATION_KEY='mid:event-planner:location'
const EVENT_VALUES_KEY='mid:event-planner:values'
const AUTO_REFRESH_MS=30*60*1000
const EVENT_SORT_KEY='mid:event-center:sort'
type EventSortMode='chronological'|'favorites'|'updated'|'title'
type EventWorkspaceView='overview'|'editor'|'detail'

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
function sameForecastLocation(a:Location,b:Location){const meanLat=(a.latitude+b.latitude)*Math.PI/360,dLat=(a.latitude-b.latitude)*111.32,dLon=(a.longitude-b.longitude)*111.32*Math.cos(meanLat);return Math.hypot(dLat,dLon)<=.35}
function modelStamp(value?:string){if(!value)return'–';const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(date):value}
function parseMinuteStamp(value:string){const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);if(!match)return Number.NaN;return Date.UTC(Number(match[1]),Number(match[2])-1,Number(match[3]),Number(match[4]),Number(match[5]))}
function parseStoredValues(){try{return JSON.parse(storageGet(EVENT_VALUES_KEY)||'{}') as Partial<{title:string;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity}>}catch{return{}}}
function storedSortMode():EventSortMode{const value=storageGet(EVENT_SORT_KEY);return value==='favorites'||value==='updated'||value==='title'?value:'chronological'}
function eventStartStamp(record:EventCenterRecord){const stamp=Date.parse(`${record.date}T${record.startTime||'00:00'}:00`);return Number.isFinite(stamp)?stamp:Number.MAX_SAFE_INTEGER}
function sortEvents(records:EventCenterRecord[],mode:EventSortMode){const chronological=(a:EventCenterRecord,b:EventCenterRecord)=>eventStartStamp(a)-eventStartStamp(b)||(b.updatedAt||0)-(a.updatedAt||0);return [...records].sort((a,b)=>{if(mode==='favorites'&&a.isFavorite!==b.isFavorite)return a.isFavorite?-1:1;if(mode==='updated')return(b.updatedAt||0)-(a.updatedAt||0)||chronological(a,b);if(mode==='title')return(a.title||a.location.name).localeCompare(b.title||b.location.name,'de-DE',{sensitivity:'base'})||chronological(a,b);return chronological(a,b)})}
function unique<T>(values:(T|null|undefined)[]){return values.filter((value,index,array)=>value!=null&&array.indexOf(value)===index) as T[]}
function environmentLabel(value:EventEnvironment){return ENVIRONMENT_OPTIONS.find(item=>item.id===value)?.label??value}
function activityLabel(value:EventActivity){return ACTIVITY_OPTIONS.find(item=>item.id===value)?.label??value}
function majorWeatherCode(codes:(number|null)[]){const ranked=unique(codes).sort((a,b)=>weatherSeverity(b)-weatherSeverity(a));return ranked[0]??null}
function weatherSeverity(code:number|null){if(code==null)return 0;if([95,96,99].includes(code))return 6;if([71,73,75,77,85,86].includes(code))return 5;if([65,67,82].includes(code))return 4;if([63,66,81].includes(code))return 3;if([61,80,51,53,55,56,57].includes(code))return 2;if([45,48].includes(code))return 1;return 0}
function mean(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);if(!usable.length)return null;return usable.reduce((sum,value)=>sum+value,0)/usable.length}
function max(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);return usable.length?Math.max(...usable):null}
function min(values:(number|null)[]){const usable=values.filter((value):value is number=>value!=null);return usable.length?Math.min(...usable):null}

function eventWeatherPart(point:EventTimelinePoint){return precipitationParts({time:point.time,precipitation:point.precipitation??0,rain:point.rain??0,showers:point.showers??0,snowfall:point.snowfall??0,probability:point.precipitationProbability??0,code:point.weatherCode??0,temperature:point.temperature??undefined,humidity:point.humidity??undefined,cloud:point.cloud??undefined,lowCloud:point.lowCloud??undefined,cape:point.cape??undefined,liftedIndex:point.liftedIndex??undefined,convectiveInhibition:point.convectiveInhibition??undefined,sunshineDuration:point.sunshineDuration??undefined,isDay:point.isDay})}
function summarizeTimeline(timeline:EventTimelinePoint[],fusion:ForecastFusionResult|null,eventProbability?:EventPrecipitationProbabilityAssessment|null,weatherTwinApplied=false):EventSummary{
 const temperatures=timeline.map(point=>point.temperature),apparents=timeline.map(point=>point.apparent),precipitationProbabilities=timeline.map(point=>point.precipitationProbability),winds=timeline.map(point=>point.wind),gusts=timeline.map(point=>point.gust),uvValues=timeline.map(point=>point.uv),visibilities=timeline.map(point=>point.visibility),parts=timeline.map(point=>({point,part:eventWeatherPart(point)})),wet=parts.filter(row=>row.part.type!=='none'),representative=(wet.length?wet:parts).sort((a,b)=>weatherSeverity(b.part.displayCode)-weatherSeverity(a.part.displayCode)||((b.point.precipitationProbability??0)+(b.point.precipitation??0)*8)-((a.point.precipitationProbability??0)+(a.point.precipitation??0)*8))[0],groups=new Set((fusion?.sources??[]).filter(source=>source.successful&&source.consensusRole!=='postprocessing').map(source=>source.independenceGroup||source.family));
 const probabilityWinner=[...wet].sort((a,b)=>(b.point.precipitationProbability??0)-(a.point.precipitationProbability??0)||b.part.total-a.part.total||weatherSeverity(b.part.displayCode)-weatherSeverity(a.part.displayCode))[0];
 const precipitationProbabilityRelevant=eventProbability?.probability??probabilityWinner?.point.precipitationProbability??max(precipitationProbabilities);
 const precipitationTypeLabel=probabilityWinner?compactPrecipitationTypeLabel(probabilityWinner.part.type):undefined;
 return{hours:timeline.length,temperatureAvg:mean(temperatures),temperatureMin:min(temperatures),temperatureMax:max(temperatures),apparentAvg:mean(apparents),precipitationProbabilityMax:max(precipitationProbabilities),precipitationProbabilityRelevant,precipitationProbabilitySignificant:eventProbability?.probabilitySignificant,precipitationProbabilitySource:eventProbability?'ensemble-members-dwd-event':'hourly-max-fallback',precipitationProbabilityMemberCount:eventProbability?.memberCount,precipitationProbabilityModelFamilies:eventProbability?.modelFamilyCount,precipitationTypeLabel,precipitationTotal:timeline.reduce((sum,point)=>sum+(point.precipitation??0),0),windMax:max(winds),gustMax:max(gusts),uvMax:max(uvValues),visibilityMin:min(visibilities),weatherCode:representative?.part.displayCode??majorWeatherCode(timeline.map(point=>point.weatherCode)),weatherLabel:representative?.part.type==='none'?label(representative.part.displayCode):representative?.part.weatherLabel,weatherSourceLabel:representative?.point.weatherSourceLabel,isDay:representative?.point.isDay,modelFamilyCount:groups.size||undefined,rapidCycleUsed:Boolean(fusion?.sources?.some(source=>source.successful&&source.rapidUpdate)),weatherTwinApplied}
}

function eventPrecipProbability(summary:EventSummary){return summary.precipitationProbabilityRelevant??summary.precipitationProbabilityMax}
function eventPrecipLabel(summary:EventSummary){return summary.precipitationTypeLabel||'Niederschlag'}

function evaluateEvent(summary:EventSummary,environment:EventEnvironment,activity:EventActivity):EventAdvice{
 const tips:string[]=[]
 const behavior:string[]=[]
 let severity=0
 const thunder=[95,96,99].includes(summary.weatherCode??-1)
 if(thunder){severity+=5;tips.push('Gewitterrisiko im Zeitfenster.');behavior.push(activity==='flight'?'Flugplanung gegen aktuelle METAR/TAF und amtliche Flugwetterberatung abgleichen.':'Outdoor-Ablauf mit belastbarer Ausweichoption planen.')}
 if((eventPrecipProbability(summary)??0)>=75||(summary.precipitationTotal??0)>=5){severity+=environment==='indoor'?1:3;tips.push('Hohes Niederschlagsrisiko.');behavior.push(environment==='indoor'?'An- und Abreise mit Zeitpuffer planen.':'Regenschutz und geschützte Alternative vorsehen.')}
 else if((eventPrecipProbability(summary)??0)>=40||(summary.precipitationTotal??0)>=1.5){severity+=environment==='indoor'?0:2;tips.push(summary.weatherLabel?.includes('Sprühregen')?'Sprühregen zeitweise möglich.':'Niederschlag zeitweise möglich.');behavior.push('Leichten Wetterschutz einplanen.')}
 if((summary.windMax??0)>=22||(summary.gustMax??0)>=34){severity+=environment==='indoor'?1:3;tips.push('Wind/Böen können den Ablauf deutlich beeinflussen.');behavior.push(activity==='watersports'?'Gewässer- und Materialgrenzen prüfen.':activity==='flight'?'Start-/Landephase und lokale Windgrenzen gesondert prüfen.':'Windempfindliche Ausrüstung sichern.')}
 else if((summary.windMax??0)>=14||(summary.gustMax??0)>=24){severity+=1;tips.push('Spürbarer Wind.');behavior.push(activity==='flight'?'Böen und lokale Windrichtung vor Abflug prüfen.':'Wind bei Kleidung und Streckenwahl berücksichtigen.')}
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29){severity+=2;tips.push('Hohe Wärmebelastung.');behavior.push('Trinkpausen und Schatten einplanen.')}
 if((summary.temperatureMin??summary.temperatureAvg??99)<=3){severity+=2;tips.push('Kalte Bedingungen.');behavior.push('Wärmeschutz und Aufwärmzeit berücksichtigen.')}
 if((summary.uvMax??0)>=6&&environment!=='indoor'&&activity!=='flight'){severity+=1;tips.push('Erhöhte UV-Belastung.');behavior.push('Sonnenschutz einplanen.')}
 if((summary.visibilityMin??99999)<1000){severity+=2;tips.push('Deutlich eingeschränkte Sicht möglich.');behavior.push(activity==='flight'?'Sichtminima und Alternates gesondert prüfen.':'Anfahrt und Wegführung mit Reserve planen.')}
 if(activity==='cycling'||activity==='running'||activity==='hiking')behavior.push('Untergrund auf Nässe und Rutschgefahr prüfen.')
 if(activity==='skiing')behavior.push('Bergwetter, Höhenwind und Schneefallgrenze zusätzlich prüfen.')
 if(activity==='golf'||activity==='tennis'||activity==='football')behavior.push('Flexible Unterbrechung bei Böen oder Schauern vorsehen.')
 if(activity==='concert'||activity==='city')behavior.push('Aufenthaltsdauer im Freien an die Wetterlage anpassen.')
 if(activity==='gym'||activity==='yoga'||environment==='indoor')behavior.push('Wetter wirkt hier vor allem auf An- und Abreise.')
 if(activity==='watersports')behavior.push('Wassertemperatur, Gewässerstatus und lokale Hinweise ergänzend prüfen.')
 if(activity==='flight'&&summary.flightHazards){
  const flight=summary.flightHazards
  if(flight.overall==='caution')severity=Math.max(severity,7)
  else if(flight.overall==='watch')severity=Math.max(severity,4)
  for(const item of flight.items.filter(item=>item.level!=='none').slice(0,3))tips.push(`${item.label}: ${item.detail}.`)
  behavior.push('Vereisung, Turbulenz/CAT, Wolkenuntergrenze und Sicht gegen aktuelle Flugwetterprodukte verifizieren.')
 }
 const status:EventStatus=severity>=6?'caution':severity>=3?'watch':'good'
 if(!tips.length)tips.push(activity==='flight'?'Keine markante flugmeteorologische Einschränkung im MID-Screening.':'Keine markante Wettereinschränkung im Zeitfenster.')
 if(!behavior.length)behavior.push('Normale Vorbereitung ist voraussichtlich ausreichend.')
 const headline=activity==='flight'
  ?status==='good'?'Flugmeteorologisch unauffällig':status==='watch'?'Flugmeteorologische Einschränkungen prüfen':'Flugmeteorologisch kritisch'
  :status==='good'?'Günstige Bedingungen':status==='watch'?'Einzelne Einschränkungen beachten':'Wetterkritische Bedingungen'
 const summaryText=activity==='flight'
  ?status==='good'?'Das MID-Screening zeigt aktuell keine markante flugmeteorologische Einschränkung.':status==='watch'?'Mindestens ein flugmeteorologischer Faktor verdient vor Abflug eine gezielte Prüfung.':'Mehrere oder markante flugmeteorologische Faktoren können die Durchführung einschränken.'
  :status==='good'?'Der Termin ist nach aktuellem Stand gut planbar.':status==='watch'?'Der Termin bleibt planbar, einzelne Wetterfaktoren sollten berücksichtigt werden.':'Wetterfaktoren können den Ablauf deutlich beeinträchtigen.'
 return{status,headline,summary:summaryText,tips:unique(tips).slice(0,4),behavior:unique(behavior).slice(0,4)}
}
function clockFromCivilStamp(stamp:number){const date=new Date(stamp);return`${String(date.getUTCHours()).padStart(2,'0')}:${String(date.getUTCMinutes()).padStart(2,'0')}`}
function timelineForWindow(hours:Hour[],date:string,startTime:string,endTime:string){
 const startStamp=parseMinuteStamp(`${date}T${startTime}`)
 let endStamp=parseMinuteStamp(`${date}T${endTime}`)
 if(!Number.isFinite(startStamp)||!Number.isFinite(endStamp))return[] as EventTimelinePoint[]
 if(endStamp<=startStamp)endStamp=startStamp+60*60000
 const rows=hours.map(hour=>({hour,stamp:parseMinuteStamp(hour.time)})).filter(row=>Number.isFinite(row.stamp)).sort((a,b)=>a.stamp-b.stamp),result:EventTimelinePoint[]=[]
 for(let index=0;index<rows.length;index++){
  const {hour,stamp:intervalEnd}=rows[index],previous=index>0?rows[index-1].stamp:intervalEnd-3600000,rawStep=intervalEnd-previous,step=Number.isFinite(rawStep)&&rawStep>=15*60000&&rawStep<=3*3600000?rawStep:3600000,intervalStart=intervalEnd-step,overlapStart=Math.max(intervalStart,startStamp),overlapEnd=Math.min(intervalEnd,endStamp)
  if(overlapEnd<=overlapStart)continue
  const fraction=(overlapEnd-overlapStart)/step,scaled=(value:number|null|undefined)=>Number.isFinite(Number(value))?Number(value)*fraction:null,precipitation=scaled(hour.precipitation),rain=scaled(hour.rain),showers=scaled(hour.showers),snowfall=scaled(hour.snowfall),sunshineDuration=scaled(hour.sunshineDuration)
  const part=precipitationParts({time:hour.time,epoch:hour.epoch,timezone:hour.timezone,precipitation:precipitation??0,rain:rain??0,showers:showers??0,snowfall:snowfall??0,probability:hour.probability,code:hour.code,temperature:hour.temperature,dewPoint:hour.dewPoint,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration:sunshineDuration??undefined,isDay:hour.isDay})
  result.push({time:clockFromCivilStamp(overlapEnd),periodLabel:`${clockFromCivilStamp(overlapStart)}–${clockFromCivilStamp(overlapEnd)}`,temperature:hour.temperature,apparent:hour.apparent,precipitationProbability:hour.probability,precipitation,rain,showers,snowfall,weatherCode:part.displayCode,weatherLabel:part.type==='none'?label(part.displayCode):part.weatherLabel,wind:hour.wind,gust:hour.gust,uv:hour.uvIndex,visibility:hour.visibility,humidity:hour.humidity,cloud:hour.cloud,lowCloud:hour.lowCloud,cape:hour.cape,liftedIndex:hour.liftedIndex,convectiveInhibition:hour.convectiveInhibition,sunshineDuration,isDay:hour.isDay,weatherSourceId:hour.weatherSourceId,weatherSourceLabel:hour.weatherSourceLabel})
 }
 return result
}

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
 if((eventPrecipProbability(summary)??0)>=75)return'Puffer für Schauer einplanen'
 if((summary.windMax??0)>=18||(summary.gustMax??0)>=28)return'exponierte Phasen möglichst kurz halten'
 if((summary.temperatureMax??summary.temperatureAvg??0)>=29)return'Pausen und Wasserstellen einplanen'
 return'gute Planbarkeit im gewählten Zeitfenster'
}
function eventCompactRange(record:EventCenterRecord){return`${formatDate(record.date)} · ${formatClock(record.startTime)}–${formatClock(record.endTime)}`}
function eventMetricLine(plan:EventPlan|null,unit:WindUnit){if(!plan)return'Noch keine Analyse.';return`${formatNumber(plan.summary.temperatureAvg)} °C · ${eventPrecipLabel(plan.summary)} Zeitraum ${formatNumber(eventPrecipProbability(plan.summary))} % · Wind ${wind(plan.summary.windMax??Number.NaN,unit)} · G ${wind(plan.summary.gustMax??Number.NaN,unit)}`}

export default function EventPlannerPanel({initialLocation,advancedMode,unit,canonicalHours=[],canonicalFusion=null,canonicalWeatherTwinApplied=false}:Props){
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
 const searchController=useRef<AbortController|null>(null)
 const analysisController=useRef<AbortController|null>(null)
 const forecastWindowHint=`Vorhersage aktuell bis ${formatDate(addDays(localToday(),13))}`
 const currentEventId=buildEventCenterId(destination,date,startTime,title.trim()||destination.name)
 const selectedRecord=savedEvents.find(item=>item.id===selectedRecordId)||null
 const editingRecord=savedEvents.find(item=>item.id===editingRecordId)||null
 const currentSavedRecord=editingRecord||(selectedRecord?.id===currentEventId?selectedRecord:null)||savedEvents.find(item=>item.id===currentEventId)||null
 const displayedEvents=useMemo(()=>sortEvents(savedEvents,sortMode),[savedEvents,sortMode])

 useEffect(()=>()=>{searchController.current?.abort();analysisController.current?.abort()},[])
 useEffect(()=>{storageSet(EVENT_VALUES_KEY,JSON.stringify({title,date,startTime,endTime,environment,activity}))},[title,date,startTime,endTime,environment,activity])
 useEffect(()=>{storageSet(EVENT_SORT_KEY,sortMode)},[sortMode])
 useEffect(()=>{if(plan||storedLocation())return;setDestination(initialLocation)},[initialLocation,plan])
 useEffect(()=>{
  if(!plan)return
  const timer=window.setInterval(()=>{void analyseEvent(undefined,true)},AUTO_REFRESH_MS)
  return()=>window.clearInterval(timer)
 },[plan,destination,date,startTime,endTime,environment,activity,title])
 useEffect(()=>{
  const sync=()=>setSavedEvents(readEventCenterRecords())
  const openSaved=(event:Event)=>{const detail=(event as CustomEvent<{id?:string}>).detail,id=String(detail?.id||'');if(!id)return;const record=readEventCenterRecords().find(item=>item.id===id);if(record)loadRecord(record,'detail')}
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
  const country=location.country_code||location.country,[weather,modelInfo,fusion,eventEnsemble]=await Promise.all([forecast(location.latitude,location.longitude,signal),bestMatchModelInfo(location.latitude,location.longitude,country,signal).catch(()=>null),loadForecastFusion(location.latitude,location.longitude,country,location.elevation,signal).catch(()=>null),eventEnsembleForecast(location.latitude,location.longitude,eventDate,eventStartTime,eventEndTime,signal).catch(()=>({days:[],models:[],precipitationProbability:null}))])
  const baseHours=mapHours(weather),baseDays=mapDays(weather),fusedDays=applyForecastFusionDays(baseDays,fusion),canonical=sameForecastLocation(location,initialLocation)&&canonicalHours.length>0,ensembleDays=eventEnsemble.days??[],eventProbability=eventEnsemble.precipitationProbability??null;let finalHours=canonical?canonicalHours:applyForecastFusionHours(baseHours,baseDays,fusedDays,fusion),now=Date.now(),startEpoch=localIsoEpoch(`${eventDate}T${eventStartTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0),endEpoch=localIsoEpoch(`${eventDate}T${eventEndTime}`,weather.timezone,Number(weather.utc_offset_seconds)||0);if(Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch<startEpoch)endEpoch=startEpoch+3600000
  const nearNow=Number.isFinite(startEpoch)&&Number.isFinite(endEpoch)&&endEpoch>=now-30*60000&&startEpoch<=now+4*3600000;let nowcastApplied=false,thunderApplied=false,weatherTwinApplied=canonical&&canonicalWeatherTwinApplied
  if(!canonical){
   const twinSettings=readWeatherTwinSettings(),locationKey=`${Number(location.latitude).toFixed(5)}:${Number(location.longitude).toFixed(5)}`,twinReport=twinSettings.enabled&&twinSettings.useAsMainForecast&&ensembleDays.length?buildForecastVerificationReport(locationKey,fusedDays,ensembleDays,location,baseHours):null,localTwinDays=twinReport?applyLocalTwinForecastFromReport(fusedDays,twinReport):fusedDays,twinEligible=Boolean(twinReport?.mainForecastStatus.eligible&&localTwinDays!==fusedDays),displayBaseDays=applyEnsembleDailyPrecipitationProbability(twinEligible?localTwinDays:fusedDays,ensembleDays);if(twinEligible){finalHours=applyLocalTwinHours(locationKey,finalHours,fusedDays,localTwinDays);weatherTwinApplied=true}
   let radar:Awaited<ReturnType<typeof radarNowcast>>=null,thunder:Awaited<ReturnType<typeof thunderstormNowcast>>=null,observedTemperature=Number(weather.current?.temperature_2m),observedAt=now;
   if(nearNow){
    const [radarResult,thunderResult,stationResult]=await Promise.allSettled([radarNowcast(location.latitude,location.longitude,country,signal,true),thunderstormNowcast(location.latitude,location.longitude,country,signal),station(location.latitude,location.longitude,country,location.elevation??weather.elevation,location,signal,true)]);radar=radarResult.status==='fulfilled'?radarResult.value:null;thunder=thunderResult.status==='fulfilled'?thunderResult.value:null;const observation=stationResult.status==='fulfilled'?stationResult.value:null,stamp=observation?.timestamp?Date.parse(observation.timestamp):Number.NaN,fresh=Boolean(observation&&Number.isFinite(observation.temperature)&&(!Number.isFinite(stamp)||now-stamp<150*60000));if(fresh){observedTemperature=Number(observation!.temperature);observedAt=Number.isFinite(stamp)?stamp:now}
   }
   const finalized=finalizeForecastHours(finalHours,displayBaseDays,{radar,thunder,observedTemperature,observedAt,applyOperationalRadar:nearNow});finalHours=finalized.hours;nowcastApplied=finalized.radarApplied;thunderApplied=finalized.thunderApplied
  }
  const timeline=timelineForWindow(finalHours,eventDate,eventStartTime,eventEndTime)
  if(!timeline.length)throw new Error('Für den gewählten Zeitraum sind noch keine Stundendaten verfügbar. Bitte Datum oder Uhrzeit anpassen.')
  const summary=summarizeTimeline(timeline,canonical?canonicalFusion:fusion,eventProbability,weatherTwinApplied)
  if(eventActivity==='flight'&&Number.isFinite(startEpoch)&&Number.isFinite(endEpoch))summary.flightHazards=await loadEventFlightHazards(location.latitude,location.longitude,location.elevation??weather.elevation??0,startEpoch,endEpoch,signal)
  const advice=evaluateEvent(summary,eventEnvironment,eventActivity),fusionState=forecastFusionLabel(canonical?canonicalFusion:fusion),source=[canonical?'Aktive Ortsvorhersage · identische MID-Endstufe':fusionState||'Open-Meteo Best Match · gemeinsame MID-Plausibilisierung',weatherTwinApplied?'Wetterzwilling · lokal validierte Temperatur-/Böenkorrektur':'',eventProbability?`Event-PoP ${eventStartTime}–${eventEndTime} · Ensemble-Member >0,2 mm`:'PoP · Stundenfallback',nowcastApplied?'Radar-Nowcast':'' ,thunderApplied?'Konvektiv-/Gewitter-Nowcast':'',eventActivity==='flight'&&summary.flightHazards?.available?'Druckniveau-Flugwetterdiagnose':''].filter(Boolean).join(' · ')
  return{location,title:eventTitle.trim(),date:eventDate,startTime:eventStartTime,endTime:eventEndTime,environment:eventEnvironment,activity:eventActivity,timeline,summary,advice,modelInfo,refreshedAt:Date.now(),source} satisfies EventPlan
 }
 function validateInputs(location:Location|null,eventDate:string,eventStartTime:string,eventEndTime:string){
  if(!location){setError('Bitte zuerst einen Ort auswählen.');return false}
  if(!eventDate||!eventStartTime||!eventEndTime){setError('Bitte Datum sowie Start- und Endzeit angeben.');return false}
  if(eventDate>addDays(localToday(),13)){setError('Der Event-Planer wertet die nächsten 14 Tage aus. Für spätere Termine bitte näher am Termin erneut prüfen.');return false}
  return true
 }
 function savePlanRecord(nextPlan:EventPlan,forceFavorite?:boolean){
  const id=editingRecordId||currentSavedRecord?.id||buildEventCenterId(nextPlan.location,nextPlan.date,nextPlan.startTime,nextPlan.title||nextPlan.location.name)
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
  if(editingRecordId)setEditingRecordId(record.id)
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
   if(!silent)setWorkspaceView('detail')
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
  const targets=favoritesOnly?savedEvents.filter(item=>item.isFavorite):savedEvents.slice(0,12)
  if(!targets.length)return
  setBulkRefreshing(true)
  try{for(const item of targets)await refreshStoredEvent(item,favoritesOnly)}finally{setBulkRefreshing(false)}
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

 const selectedEnvironment=ENVIRONMENT_OPTIONS.find(item=>item.id===environment)??ENVIRONMENT_OPTIONS[0]
 const selectedActivity=ACTIVITY_OPTIONS.find(item=>item.id===activity)??ACTIVITY_OPTIONS[0]
 const latestRuns=plan?.modelInfo?.runs?.slice(0,4)??[]
 const currentTitle=plan?.title?.trim()||title.trim()||'Geplantes Event'
 const outfitHint=plan?buildOutfitHint(plan.summary,plan.environment,plan.activity):''
 const timingHint=plan?buildTimingHint(plan.summary,plan.activity):''
 const lastUpdateText=plan?new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(plan.refreshedAt)):''
 const favoriteEvents=savedEvents.filter(item=>item.isFavorite)

 return <section className="event-planner">
  <header className="event-planner-head"><div><span>EVENTPLANER</span><h4>Events & Aktivitäten</h4><p>Termin anlegen, Wetterlage erfassen und relevante Hinweise schnell abrufen.</p></div><div className="event-head-actions"><span className="travel-climate-badge">{forecastWindowHint}</span><AppInfoHint label="Informationen zum Eventplaner" width={390}><strong>Eventplaner</strong><p>MID verwendet dieselben plausibilisierten Wetterpfade, Einheiten und Qualitätsregeln wie die übrige App. Gespeicherte Events werden nur bei relevanten Wetteränderungen hervorgehoben; ein neuer Modelllauf allein erzeugt keine Warnmarkierung.</p><p>Flugwetter-Hazards sind automatisierte MID-Diagnosen und keine amtliche Flugwetterberatung.</p></AppInfoHint></div></header>

  <nav className="event-workspace-nav" aria-label="Eventplaner-Bereiche">
   <button type="button" className={workspaceView==='overview'?'active':''} onClick={()=>setWorkspaceView('overview')}><span>Übersicht</span><small>{savedEvents.length} gespeichert</small></button>
   <button type="button" className={workspaceView==='editor'?'active':''} onClick={()=>{if(workspaceView!=='editor'&&editingRecordId)setWorkspaceView('editor');else if(workspaceView!=='editor')startNewEvent()}}><span>{editingRecordId?'Bearbeiten':'Neu planen'}</span><small>{editingRecordId?'Event anpassen':'Aktivität anlegen'}</small></button>
   <button type="button" className={workspaceView==='detail'?'active':''} disabled={!plan} onClick={()=>plan&&setWorkspaceView('detail')}><span>Details & Rat</span><small>{plan?'Auswertung öffnen':'nach Wettercheck'}</small></button>
  </nav>

  {workspaceView==='overview'&&<section className="event-center-shelf">
   <header><div><span>EVENT-CENTER</span><h5>Kompakte Übersicht</h5><small>{savedEvents.length} gespeichert · {favoriteEvents.length} Favorit{favoriteEvents.length===1?'':'en'}</small></div><div className="event-center-actions"><button type="button" className="primary event-new-button" onClick={startNewEvent}><CalendarRange size={15}/> Neu</button><label className="event-center-sort"><ArrowUpDown size={14}/><span>Sortierung</span><select value={sortMode} onChange={(event:ValueEvent)=>setSortMode(event.target.value as EventSortMode)} aria-label="Events sortieren"><option value="chronological">Chronologisch</option><option value="favorites">Favoriten zuerst</option><option value="updated">Zuletzt geändert</option><option value="title">Titel A–Z</option></select></label><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(true)} disabled={bulkRefreshing||!favoriteEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<BellRing size={15}/>} Favoriten</button><button type="button" className="secondary" onClick={()=>void refreshStoredEvents(false)} disabled={bulkRefreshing||!savedEvents.length}>{bulkRefreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>} Alle</button><AppInfoHint label="Informationen zum Event-Center"><strong>Event-Center</strong><p>Standardmäßig chronologisch. Die Karten zeigen zuerst nur Termin, Ort und meteorologische Eckdaten. Aufklappen liefert eine Kurzbewertung; „Details & Ratschläge“ öffnet die vollständige Auswertung.</p></AppInfoHint></div></header>
   {savedEvents.length?<div className="event-center-grid compact">{displayedEvents.map(record=>{const active=record.id===selectedRecordId||record.id===currentSavedRecord?.id,recordPlan=record.plan,refreshing=refreshingIds.includes(record.id);return <article key={record.id} className={`event-center-card compact${active?' active':''}`}>
    <button type="button" className={`event-center-favorite${record.isFavorite?' active':''}`} onClick={()=>toggleFavorite(record)} aria-label={record.isFavorite?'Favorit entfernen':'Als Favorit markieren'} title={record.isFavorite?'Favorit entfernen':'Als Favorit markieren'}><Star size={15} fill={record.isFavorite?'currentColor':'none'}/></button>
    <details className="event-center-card-disclosure">
     <summary>
      <span className="event-center-card-overview">
       <span className="event-center-card-overview-head"><strong>{record.title||record.location.name}</strong><span className="event-center-card-tags"><span className="event-center-card-pill fill">{environmentLabel(record.environment)}</span><span className="event-center-card-pill">{activityLabel(record.activity)}</span>{record.change&&record.change.level!=='none'&&<span className={`event-center-card-pill signal-${record.change.level}`}>{record.change.badge}</span>}</span></span>
       <span className="event-center-card-meta"><span>{eventCompactRange(record)}</span><span>{record.location.name}</span></span>
       <span className="event-center-card-quick-weather"><WeatherPictogram code={recordPlan?.summary.weatherCode??0} day title={label(recordPlan?.summary.weatherCode??0)}/><span>{eventMetricLine(recordPlan,unit)}</span></span>
      </span>
      <span className="event-center-disclosure-hint"><span>Vorschau</span><ChevronDown size={15}/></span>
     </summary>
     <div className="event-center-card-details">
      <div className="event-center-card-weather"><WeatherPictogram code={recordPlan?.summary.weatherCode??0} day title={label(recordPlan?.summary.weatherCode??0)}/><div><b>{recordPlan?.advice.headline||'Noch keine Analyse'}</b><span>{recordPlan?.advice.summary||destinationLabel(record.location)}</span></div></div>
      {record.change?.level&&record.change.level!=='none'?<div className={`event-center-change ${record.change.level}`}><BellRing size={14}/><span>{record.change.summary}</span></div>:null}
      <footer><button type="button" className="primary" onClick={()=>loadRecord(record,'detail')}><ShieldCheck size={15}/> Details & Ratschläge</button><button type="button" className="secondary" onClick={()=>loadRecord(record,'editor')}><Pencil size={15}/> Bearbeiten</button><button type="button" className="secondary icon-only" onClick={()=>void refreshStoredEvent(record)} disabled={refreshing} aria-label="Event aktualisieren" title="Aktualisieren">{refreshing?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>}</button><button type="button" className="secondary danger-lite icon-only" onClick={()=>removeRecord(record)} aria-label="Event löschen" title="Löschen"><Trash2 size={15}/></button></footer>
     </div>
    </details>
   </article>})}</div>:<div className="event-center-empty"><CalendarRange size={18}/><span>Noch keine Events gespeichert.</span><button type="button" className="primary" onClick={startNewEvent}>Erstes Event anlegen</button></div>}
  </section>}

  {workspaceView==='editor'&&<section className="event-editor-stack">
   <div className="event-planner-card compact-location-card">
    <div className="event-selected-destination compact"><MapPin size={17}/><span><small>Event-Ort</small><strong>{destinationLabel(destination)}</strong><em>{selectedEnvironment.label} · {selectedActivity.label}</em></span><div className="event-location-actions"><button type="button" className="secondary" onClick={()=>setLocationSearchOpen(value=>!value)}><Search size={15}/>{locationSearchOpen?'Suche schließen':'Ort ändern'}</button><button type="button" className="secondary icon-only" onClick={()=>{chooseLocation(initialLocation);setLocationSearchOpen(false)}} aria-label="MID-Ort übernehmen" title="MID-Ort"><MapPin size={15}/></button></div></div>
    {locationSearchOpen&&<div className="event-location-search-panel"><form className="travel-location-search compact" onSubmit={runSearch}><label><span>Anderen Ort suchen</span><div><Search size={16}/><input value={query} onChange={(event:ValueEvent)=>setQuery(event.target.value)} placeholder="Ort, Venue oder ICAO" autoFocus/></div></label><button type="submit" className="secondary" disabled={searching}>{searching?<RefreshCw className="spin" size={16}/>:<Search size={16}/>} Suchen</button></form>{searchError&&<small className="travel-search-error">{searchError}</small>}{searchResults.length>0&&<div className="travel-search-results" role="listbox" aria-label="Event-Orte">{searchResults.slice(0,8).map(location=><button type="button" key={`${location.id}:${location.latitude}:${location.longitude}`} onClick={()=>{chooseLocation(location);setLocationSearchOpen(false)}}><MapPin size={15}/><span><strong>{location.icao?`${location.icao} · ${location.name}`:location.name}</strong><small>{[location.poiCategory,location.admin1,location.country].filter(Boolean).join(' · ')||`${formatNumber(location.latitude,2)}°, ${formatNumber(location.longitude,2)}°`}</small></span></button>)}</div>}</div>}
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
    <div className="event-plan-actions compact"><span className="event-auto-update-note"><RefreshCw size={13}/> Automatische Neubewertung <AppInfoHint label="Informationen zur automatischen Aktualisierung" width={340}><strong>Automatische Aktualisierung</strong><p>Geöffnete Events werden etwa alle 30 Minuten neu bewertet. Die Glocke reagiert nur auf deutlich veränderte meteorologische Eckdaten, nicht auf jeden neuen Modelllauf.</p></AppInfoHint></span><button type="submit" className="primary travel-analyse" disabled={loading}>{loading?<RefreshCw className="spin" size={17}/>:<CalendarRange size={17}/>} {loading?'Wird geprüft …':editingRecordId?'Änderungen prüfen':'Wetter prüfen'}</button></div>
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
     <div className="event-guide-copy"><span>EVENT-CHECK</span><h5>{currentTitle}</h5><p>{destinationLabel(plan.location)}</p><strong>{plan.advice.headline}</strong><p>{plan.advice.summary}</p><div className="event-guide-inline-notes"><article><MapPin size={15}/><span>{timingHint}</span></article><article><BellRing size={15}/><span>Stand {lastUpdateText}</span></article></div><div className="event-result-toolbar"><button type="button" className="secondary" onClick={()=>saveCurrentPlan(false)}><Star size={15} fill={currentSavedRecord?'currentColor':'none'}/>{currentSavedRecord?'Event aktualisieren':'Event speichern'}</button>{currentSavedRecord?<button type="button" className="secondary" onClick={()=>toggleFavorite(currentSavedRecord)}><Star size={15} fill={currentSavedRecord.isFavorite?'currentColor':'none'}/>{currentSavedRecord.isFavorite?'Favorit entfernen':'Favorit'}</button>:<button type="button" className="secondary" onClick={()=>saveCurrentPlan(true)}><Star size={15}/>Als Favorit speichern</button>}</div></div>
     <aside className="event-guide-weatherpanel"><small>Leitwetter</small><div className="event-guide-weatherrow"><WeatherPictogram code={plan.summary.weatherCode??0} day={plan.summary.isDay!==false} title={plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}/><div><strong>{formatNumber(plan.summary.temperatureAvg)}°</strong><span>{plan.summary.weatherLabel||label(plan.summary.weatherCode??0)}</span></div></div><p>{outfitHint}</p><div className="event-guide-quickstats"><span><CloudRain size={14}/>{eventPrecipLabel(plan.summary)} · Zeitraum {formatNumber(eventPrecipProbability(plan.summary))} %</span><span><Wind size={14}/>{wind(plan.summary.windMax??Number.NaN,unit)} · G {wind(plan.summary.gustMax??Number.NaN,unit)}</span><span><Sun size={14}/>UVI {formatUvi(plan.summary.uvMax??Number.NaN)}</span></div></aside>
    </div>
   </div>

   <div className="event-metrics-grid">
    <article><Thermometer size={17}/><small>Temperatur</small><strong>{formatNumber(plan.summary.temperatureAvg)} °C</strong><span>{formatNumber(plan.summary.temperatureMin)}–{formatNumber(plan.summary.temperatureMax)} °C · gefühlt Ø {formatNumber(plan.summary.apparentAvg)} °C</span></article>
    <article><CloudRain size={17}/><small>Niederschlag</small><strong>{eventPrecipLabel(plan.summary)} · Zeitraum {formatNumber(eventPrecipProbability(plan.summary))} %</strong><span>{formatClock(plan.startTime)}–{formatClock(plan.endTime)} · {formatNumber(plan.summary.precipitationTotal,1)} mm{plan.summary.precipitationProbabilitySource==='ensemble-members-dwd-event'&&plan.summary.precipitationProbabilitySignificant!=null?` · >5 mm ${formatNumber(plan.summary.precipitationProbabilitySignificant)} %`:''}</span></article>
    <article><Wind size={17}/><small>Wind</small><strong>{wind(plan.summary.windMax??Number.NaN,unit)}</strong><span>Böen {wind(plan.summary.gustMax??Number.NaN,unit)}</span></article>
    <article><Sun size={17}/><small>UVI / Sicht</small><strong>UVI {formatUvi(plan.summary.uvMax??Number.NaN)}</strong><span>Sicht min. {plan.summary.visibilityMin!=null?`${formatNumber(plan.summary.visibilityMin/1000,1)} km`:'–'}</span></article>
   </div>

   <section className="event-guidance-section"><header><div><span>RATSCHLÄGE</span><strong>Was für dieses Event wichtig ist</strong></div></header><div className="event-guidance-grid"><article><strong>Wichtig</strong><ul>{plan.advice.tips.map(item=><li key={item}>{item}</li>)}</ul></article><article><strong>Empfehlung</strong><ul>{plan.advice.behavior.map(item=><li key={item}>{item}</li>)}</ul></article></div></section>

   {plan.activity==='flight'&&plan.summary.flightHazards?<section className={`event-flight-hazards ${plan.summary.flightHazards.overall}`}><header><div><Plane size={18}/><span><small>FLUGMETEOROLOGIE</small><strong>Hazard-Screening</strong></span></div><AppInfoHint label="Informationen zum Flugwetter-Screening" width={430}><strong>Quellen & Priorität</strong><p>MID priorisiert standort- und zeitbezogene ICAO-SIGMET und TAF; bei Nahterminen kommen METAR/SPECI und PIREP/AIREP hinzu. Mit autorisiertem WIFS-Zugang werden die maschinenlesbaren WAFS-SIGWX-Daten von WAFC London und WAFC Washington ausgewertet – also die Datenbasis der Significant-Weather-Charts. Nationale Wetterdienste fließen über den ICAO-Austausch ein; freigegebene Open-Data-Produkte werden, wo verfügbar, zusätzlich direkt genutzt (derzeit u. a. KNMI AIRMET/SIGMET). Die MID-Druckniveaudiagnose ergänzt diese amtlichen Quellen.</p><div className="event-flight-source-list">{plan.summary.flightHazards.sources?.map(source=><span key={source.id} className={source.status}><b>{source.label}</b><small>{source.status==='used'?'verwendet':source.status==='available'?'geprüft':source.status==='not-configured'?'Zugang nicht eingerichtet':'derzeit nicht erreichbar'}{source.detail?` · ${source.detail}`:''}</small></span>)}</div><p>Direkt zugangsbeschränkte oder nicht zur Weiterverarbeitung freigegebene nationale SWC-/Spezialprodukte werden nicht automatisiert aus Webseiten extrahiert.</p><p>Kein Ersatz für ein vorgeschriebenes amtliches Flugwetterbriefing.</p></AppInfoHint></header>{plan.summary.flightHazards.available?<div className="event-flight-hazard-grid">{plan.summary.flightHazards.items.map(item=><article key={item.id} className={item.level}><small>{item.label}</small><strong>{item.level==='caution'?'kritisch':item.level==='watch'?'beachten':'unauffällig'}</strong><span>{item.detail}</span></article>)}</div>:<div className="event-flight-unavailable">{plan.summary.flightHazards.note||'Flugprofildaten derzeit nicht verfügbar.'}</div>}{plan.summary.flightHazards.freezingLevelMin!=null?<footer>Nullgradgrenze im Zeitfenster: ca. {Math.round(plan.summary.flightHazards.freezingLevelMin/50)*50} m</footer>:null}</section>:null}

   <details className="event-detail-disclosure">
    <summary><span><small>MEHR DETAILS</small><strong>Stündlicher Verlauf & Datenbasis</strong></span><ChevronDown size={18}/></summary>
    <div className="event-detail-disclosure-body">
     <div className="event-timeline-card"><header><div><span>ZEITFENSTER</span><h6>Stündlicher Verlauf</h6></div><AppInfoHint label="Informationen zum Stundenverlauf" width={390}><strong>Stündlicher Verlauf</strong><p>{advancedMode?'Best Match, unabhängige Modellfamilien und MID-Plausibilisierung; bei Nahterminen zusätzlich Nowcast. Die große Niederschlagswahrscheinlichkeit gilt separat für das gesamte Eventfenster. Die Prozentwerte in den Karten gelten für das jeweils angegebene Stundenintervall; Open-Meteo weist Niederschlagswerte als Summe bzw. Wahrscheinlichkeit der vorangehenden Stunde aus, daher schneidet MID diese Intervalle exakt auf Start und Ende des Events zu.':'Dieselbe plausibilisierte Stundenprognose wie in der übrigen App. Die große Niederschlagswahrscheinlichkeit gilt für den gesamten Eventzeitraum; die Karten zeigen nur die tatsächlich überlappenden Stundenintervalle.'}</p></AppInfoHint></header><div className="event-timeline">{plan.timeline.map(point=><article key={`${point.periodLabel||point.time}:${point.time}`}><time>{point.periodLabel||point.time}</time><WeatherPictogram code={point.weatherCode??0} day={point.isDay!==false} title={point.weatherLabel||label(point.weatherCode??0)}/><strong>{formatNumber(point.temperature)}°</strong><small>{point.weatherLabel||label(point.weatherCode??0)} · PoP {formatNumber(point.precipitationProbability)} %</small><small>Wind {wind(point.wind??Number.NaN,unit)} · G {wind(point.gust??Number.NaN,unit)}</small></article>)}</div></div>
     <details className="event-model-disclosure"><summary><Info size={16}/><span>Daten & Modellstand</span><ChevronDown size={15}/></summary><div className="event-model-updates"><header><div><span>MODELLSTAND</span><h6>Aktuelle Laufstände</h6></div><small>{lastUpdateText}</small></header>{plan.modelInfo?.summary?<div className="event-model-update-lead"><BellRing size={16}/><span>{plan.modelInfo.summary}</span></div>:null}{latestRuns.length>0&&<div className="event-run-grid">{latestRuns.map(run=><article key={`${run.id}:${run.initialisationTime}`}><strong>{run.label}</strong><small>Init {modelStamp(run.initialisationTime)}</small><small>Verfügbar {modelStamp(run.availabilityTime||run.initialisationTime)}</small></article>)}</div>}<footer><span>Quelle: {plan.source}</span><small>{plan.summary.modelFamilyCount?`${plan.summary.modelFamilyCount} unabhängige Modellgruppen geprüft. `:''}{plan.summary.rapidCycleUsed?'Rapid-Cycle-Läufe einbezogen. ':''}{advancedMode?'Varianten derselben Modellfamilie werden nicht mehrfach gewichtet.':''}</small></footer></div></details>
    </div>
   </details>
  </section>}
 </section>
}
