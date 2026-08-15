import type {BestMatchModelInfo,Location} from './weather'
import type {EventFlightHazardSummary} from './eventAviation'
import {readDurableStorageValue,writeDurableStorageValue} from './storageSafety'
import {mergeEventFavoritePreference} from './eventFavoriteState'
import {localIsoToEpoch} from './timeDisplay'

export type EventEnvironment='indoor'|'outdoor'|'covered'
export type EventActivity='general'|'running'|'cycling'|'hiking'|'skiing'|'climbing'|'football'|'tennis'|'golf'|'gym'|'yoga'|'watersports'|'city'|'concert'|'flight'
export type EventStatus='good'|'watch'|'caution'
export type EventTimelinePoint={time:string;periodLabel?:string;durationMinutes?:number;temperature:number|null;apparent:number|null;precipitationProbability:number|null;precipitation:number|null;rain?:number|null;showers?:number|null;snowfall?:number|null;weatherCode:number|null;weatherLabel?:string;wind:number|null;gust:number|null;uv:number|null;visibility:number|null;humidity?:number|null;cloud?:number|null;lowCloud?:number|null;cape?:number|null;liftedIndex?:number|null;convectiveInhibition?:number|null;sunshineDuration?:number|null;isDay?:boolean;weatherSourceId?:string;weatherSourceLabel?:string}
export type EventSummary={hours:number;temperatureAvg:number|null;temperatureMin:number|null;temperatureMax:number|null;apparentAvg:number|null;precipitationProbabilityMax:number|null;precipitationProbabilityRelevant?:number|null;precipitationProbabilitySignificant?:number|null;precipitationProbabilitySource?:'ensemble-members-dwd-event'|'hourly-window-average-fallback';precipitationProbabilityMemberCount?:number;precipitationProbabilityModelFamilies?:number;precipitationTypeLabel?:string;precipitationTotal:number|null;windMax:number|null;gustMax:number|null;uvMax:number|null;visibilityMin:number|null;weatherCode:number|null;weatherLabel?:string;weatherSourceLabel?:string;isDay?:boolean;modelFamilyCount?:number;rapidCycleUsed?:boolean;weatherTwinApplied?:boolean;flightHazards?:EventFlightHazardSummary}
export type EventAdvice={status:EventStatus;headline:string;summary:string;tips:string[];behavior:string[]}
export type EventPlan={location:Location;title:string;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity;timeline:EventTimelinePoint[];summary:EventSummary;advice:EventAdvice;modelInfo:BestMatchModelInfo|null;refreshedAt:number;source:string;sourceRevisionAt?:number;refreshStartedAt?:number;refreshReason?:string}
export type EventChangeLevel='none'|'model'|'minor'|'major'
export type EventChangeMeta={level:EventChangeLevel;badge:string;summary:string;updatedAt:number;modelSignature:string;conditionsSignature:string;runHeadline:string}
export type EventCenterRecord={id:string;title:string;location:Location;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity;isFavorite:boolean;favoriteUpdatedAt?:number;createdAt:number;updatedAt:number;lastOpenedAt:number;plan:EventPlan|null;change:EventChangeMeta|null}

export const EVENT_CENTER_STORAGE_KEY='mid:event-center:v1'
export const EVENT_CENTER_UPDATED_EVENT='mid:event-center-updated'
export const EVENT_CENTER_OPEN_EVENT='mid:event-center-open'
export const EVENT_CENTER_REFRESH_EVENT='mid:event-center-refresh'
export const EVENT_CENTER_REFRESH_DONE_EVENT='mid:event-center-refresh-done'
const EVENT_CENTER_REFRESH_REQUEST_KEY='mid:event-center:refresh-request:v1'
const EVENT_CENTER_REFRESH_DONE_KEY='mid:event-center:refresh-done:v1'
export type EventCenterRefreshRequest={at:number;source:string}

export function persistEventCenterRefreshRequest(source:string){
 const at=Date.now();try{if(!readEventCenterRecords().length)return 0;writeDurableStorageValue(EVENT_CENTER_REFRESH_REQUEST_KEY,JSON.stringify({at,source}))}catch{return 0}return at
}
export function pendingEventCenterRefreshRequest():EventCenterRefreshRequest|null{
 try{const request=JSON.parse(readDurableStorageValue(EVENT_CENTER_REFRESH_REQUEST_KEY)||'null') as EventCenterRefreshRequest|null,done=Number(readDurableStorageValue(EVENT_CENTER_REFRESH_DONE_KEY)||0);return request&&Number.isFinite(Number(request.at))&&Number(request.at)>done?{at:Number(request.at),source:String(request.source||'manual')}:null}catch{return null}
}
export function completeEventCenterRefreshRequest(requestedAt:number){try{if(Number.isFinite(requestedAt)&&requestedAt>0){const previous=Number(readDurableStorageValue(EVENT_CENTER_REFRESH_DONE_KEY)||0);if(requestedAt>previous)writeDurableStorageValue(EVENT_CENTER_REFRESH_DONE_KEY,String(requestedAt))}}catch{}}

function safeNumber(value:number|null|undefined,fallback=0){return Number.isFinite(Number(value))?Number(value):fallback}
function rounded(value:number|null|undefined,digits=0){const factor=10**digits;return Math.round(safeNumber(value)*factor)/factor}
function isObject(value:unknown):value is Record<string,unknown>{return Boolean(value&&typeof value==='object'&&!Array.isArray(value))}

export function buildEventModelSignature(modelInfo:BestMatchModelInfo|null|undefined){
 const runs=(modelInfo?.runs??[]).slice(0,6).map(run=>[run.id,run.label,run.initialisationTime,run.availabilityTime].filter(Boolean).join('@')).join('|')
 return `${modelInfo?.runs?.[0]?.id??modelInfo?.likelyChain??'none'}::${runs}`
}
export function buildEventConditionsSignature(plan:EventPlan|null|undefined){
 if(!plan)return'none'
 const summary=plan.summary
 return [plan.advice.status,summary.weatherCode??'na',rounded(summary.temperatureAvg,1),rounded(summary.precipitationProbabilityRelevant??summary.precipitationProbabilityMax),rounded(summary.windMax),rounded(summary.gustMax),rounded(summary.uvMax),summary.flightHazards?.overall??'na'].join('|')
}
export function buildEventRunHeadline(modelInfo:BestMatchModelInfo|null|undefined){
 const primary=modelInfo?.runs?.[0]?.label||modelInfo?.likelyChain||'Best Match'
 const init=modelInfo?.runs?.[0]?.initialisationTime?.slice(11,16)
 return init?`${primary} · Lauf ${init} UTC`:primary
}

export function compareEventPlans(previous:EventPlan|null|undefined,next:EventPlan):EventChangeMeta{
 const modelSignature=buildEventModelSignature(next.modelInfo)
 const conditionsSignature=buildEventConditionsSignature(next)
 const runHeadline=buildEventRunHeadline(next.modelInfo)
 if(!previous)return{level:'none',badge:'Stabil',summary:'Event gespeichert. Änderungen werden erst bei deutlich veränderten Wetter-Eckdaten gemeldet.',updatedAt:Date.now(),modelSignature,conditionsSignature,runHeadline}
 const previousModelSignature=buildEventModelSignature(previous.modelInfo)
 const rainDelta=rounded((next.summary.precipitationProbabilityRelevant??next.summary.precipitationProbabilityMax??0)-(previous.summary.precipitationProbabilityRelevant??previous.summary.precipitationProbabilityMax??0))
 const precipitationDelta=rounded((next.summary.precipitationTotal??0)-(previous.summary.precipitationTotal??0),1)
 const windDelta=rounded((next.summary.windMax??0)-(previous.summary.windMax??0))
 const gustDelta=rounded((next.summary.gustMax??0)-(previous.summary.gustMax??0))
 const tempDelta=rounded((next.summary.temperatureAvg??0)-(previous.summary.temperatureAvg??0),1)
 const statusChanged=previous.advice.status!==next.advice.status
 const weatherChanged=eventWeatherImpactKey(previous.summary)!==eventWeatherImpactKey(next.summary)
 const modelChanged=modelSignature!==previousModelSignature
 const changes:string[]=[]
 let level:EventChangeLevel='none'
 if(statusChanged){level='major';changes.push(statusChangeSummary(previous.advice.status,next.advice.status))}
 if(rainDelta>=20){level=level==='major'?'major':'minor';changes.push(`Niederschlagsrisiko deutlich gestiegen (+${rainDelta} %-P.).`)}
 else if(rainDelta<=-20){level=level==='major'?'major':'minor';changes.push(`Niederschlagsrisiko deutlich gesunken (${rainDelta} %-P.).`)}
 if(precipitationDelta>=1.5){level=level==='major'?'major':'minor';changes.push(`Erwartete Niederschlagsmenge höher (+${precipitationDelta.toLocaleString('de-DE')} mm).`)}
 else if(precipitationDelta<=-1.5){level=level==='major'?'major':'minor';changes.push(`Erwartete Niederschlagsmenge geringer (${precipitationDelta.toLocaleString('de-DE')} mm).`)}
 if(windDelta>=6||gustDelta>=8){level=level==='major'?'major':'minor';changes.push('Wind/Böen deutlich stärker.')}
 else if(windDelta<=-6||gustDelta<=-8){level=level==='major'?'major':'minor';changes.push('Wind/Böen deutlich schwächer.')}
 if(Math.abs(tempDelta)>=3){level=level==='major'?'major':'minor';changes.push(tempDelta>0?'Temperaturtrend deutlich milder.':'Temperaturtrend deutlich kühler.')}
 if(weatherChanged){level=level==='major'?'major':'minor';changes.push('Wettercharakter deutlich geändert.')}
 if(level==='none'){changes.push(modelChanged?'Neuer Modelllauf, meteorologische Eckdaten im bisherigen Erwartungsbereich.':'Meteorologische Eckdaten im bisherigen Erwartungsbereich.')}
 const badge=level==='major'?'Relevant':level==='minor'?'Geändert':'Stabil'
 return{level,badge,summary:changes.join(' '),updatedAt:Date.now(),modelSignature,conditionsSignature,runHeadline}
}

function eventWeatherImpactKey(summary:EventSummary){
 const text=`${summary.precipitationTypeLabel||''} ${summary.weatherLabel||''}`.toLocaleLowerCase('de-DE')
 if(/kein(?:e|en)?\s+niederschlag|trocken/.test(text)&&!/(regen|schauer|sprühregen|schnee|graupel|eisregen|gewitter|hagel)/.test(text))return'dry'
 if(/gewitter|hagel/.test(text))return'thunder'
 if(/eisregen|gefrier|glatteis/.test(text))return'freezing'
 if(/schnee|graupel/.test(text))return'snow'
 if(/regen|schauer|sprühregen|niederschlag/.test(text))return'rain'
 const code=Number(summary.weatherCode)
 if([95,96,99].includes(code))return'thunder'
 if([56,57,66,67].includes(code))return'freezing'
 if([71,73,75,77,85,86].includes(code))return'snow'
 if([51,53,55,61,63,65,80,81,82].includes(code))return'rain'
 if([45,48].includes(code))return'fog'
 return'dry'
}

function statusLabel(value:EventStatus){return value==='good'?'Günstig':value==='watch'?'Beobachten':'Achtung'}
function statusRank(value:EventStatus){return value==='good'?0:value==='watch'?1:2}
function statusChangeSummary(previous:EventStatus,next:EventStatus){const direction=statusRank(next)>statusRank(previous)?'verschärft':'verbessert';return `Bewertung ${direction}: jetzt „${statusLabel(next)}“ (zuvor „${statusLabel(previous)}“).`}
function normalizeLegacyChangeSummary(summary:string){return summary.replace(/Einschätzung jetzt (passt|beobachten|Achtung) statt (passt|beobachten|Achtung)\./gi,(_match,nextLabel:string,previousLabel:string)=>{const parse=(label:string):EventStatus=>label.toLocaleLowerCase('de-DE')==='achtung'?'caution':label.toLocaleLowerCase('de-DE')==='beobachten'?'watch':'good';return statusChangeSummary(parse(previousLabel),parse(nextLabel))})}
export type EventLifecycleState='upcoming'|'ongoing'|'expired'
function eventLocalEpoch(record:EventCenterRecord,time:string){const value=`${record.date}T${time}:00`,stamp=localIsoToEpoch(value,record.location.timezone);return Number.isFinite(stamp)?stamp:0}
function shiftedEventDate(value:string,days:number){const date=new Date(`${value}T12:00:00Z`);if(!Number.isFinite(date.getTime()))return value;date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10)}
export function eventCenterStartEpoch(record:EventCenterRecord){return eventLocalEpoch(record,record.startTime||'00:00')}
export function eventCenterEndEpoch(record:EventCenterRecord){const endTime=record.endTime||record.startTime||'23:59',startTime=record.startTime||'00:00',sameDay=eventLocalEpoch(record,endTime);if(endTime>=startTime)return sameDay;const nextDate={...record,date:shiftedEventDate(record.date,1)};return eventLocalEpoch(nextDate,endTime)}
export function eventCenterLifecycle(record:EventCenterRecord,now=Date.now()):EventLifecycleState{const start=eventCenterStartEpoch(record),end=eventCenterEndEpoch(record);if(end>0&&end<now)return'expired';if(start>0&&start<=now&&(end<=0||end>=now))return'ongoing';return'upcoming'}
export function isEventCenterRecordExpired(record:EventCenterRecord,now=Date.now()){return eventCenterLifecycle(record,now)==='expired'}

export function sortEventCenterRecords(records:EventCenterRecord[],now=Date.now()){
 return [...records].sort((a,b)=>{
  const aState=eventCenterLifecycle(a,now),bState=eventCenterLifecycle(b,now),aExpired=aState==='expired',bExpired=bState==='expired'
  if(aExpired!==bExpired)return aExpired?1:-1
  const aDate=eventCenterStartEpoch(a),bDate=eventCenterStartEpoch(b)
  if(aExpired&&bExpired){const aEnd=eventCenterEndEpoch(a),bEnd=eventCenterEndEpoch(b);if(aEnd&&bEnd&&aEnd!==bEnd)return bEnd-aEnd}
  if(aDate&&bDate&&aDate!==bDate)return aDate-bDate
  if(aDate!==bDate)return aDate?-1:1
  return (b.updatedAt||0)-(a.updatedAt||0)
 })
}

export function normalizeEventCenterRecord(value:unknown):EventCenterRecord|null{
 const record=isObject(value)?value:null
 if(!record||!isObject(record.location))return null
 const location=record.location as Location
 const id=String(record.id||'').trim()||`event-${Date.now()}`
 const planRecord=isObject(record.plan)?record.plan as Record<string,unknown>:null
 const title=String(record.title||'').trim()||String(planRecord?.title||'').trim()||'Event'
 const date=String(record.date||planRecord?.date||'')
 const startTime=String(record.startTime||planRecord?.startTime||'')
 const endTime=String(record.endTime||planRecord?.endTime||'')
 const environment=String(record.environment||planRecord?.environment||'outdoor') as EventEnvironment
 const activity=String(record.activity||planRecord?.activity||'general') as EventActivity
 const rawChange=(record.change??null) as EventChangeMeta|null
 const normalizedSummary=rawChange?normalizeLegacyChangeSummary(String(rawChange.summary||'')):''
 const legacyNonMaterial=Boolean(rawChange&&(rawChange.level==='model'||/Event neu gespeichert|Kleinere Anpassungen im Zeitfenster|Neuer Modelllauf ohne relevante Abweichung/i.test(normalizedSummary)))
 const change=rawChange?{...rawChange,level:legacyNonMaterial?'none':rawChange.level,badge:legacyNonMaterial?'Stabil':rawChange.badge,summary:legacyNonMaterial?'Meteorologische Eckdaten im bisherigen Erwartungsbereich.':normalizedSummary}:null
 const createdAt=safeNumber(record.createdAt as number|undefined,Date.now()),isFavorite=Boolean(record.isFavorite),favoriteUpdatedAt=safeNumber(record.favoriteUpdatedAt as number|undefined,isFavorite?createdAt:0)
 return{ id,title,location,date,startTime,endTime,environment,activity,isFavorite,favoriteUpdatedAt,createdAt,updatedAt:safeNumber(record.updatedAt as number|undefined,Date.now()),lastOpenedAt:safeNumber(record.lastOpenedAt as number|undefined,0),plan:(record.plan??null) as EventPlan|null,change }
}

export function readEventCenterRecords(){
 try{
  const raw=JSON.parse(readDurableStorageValue(EVENT_CENTER_STORAGE_KEY)||'[]')
  const list=Array.isArray(raw)?raw.map(normalizeEventCenterRecord).filter((item):item is EventCenterRecord=>Boolean(item)):[ ]
  return sortEventCenterRecords(list)
 }catch{return[]}
}
export function writeEventCenterRecords(records:EventCenterRecord[]){
 const sorted=sortEventCenterRecords(records)
 writeDurableStorageValue(EVENT_CENTER_STORAGE_KEY,JSON.stringify(sorted))
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(EVENT_CENTER_UPDATED_EVENT,{detail:sorted}))
 return sorted
}
function eventModelRevision(modelInfo:BestMatchModelInfo|null|undefined){return Math.max(0,...(modelInfo?.runs??[]).flatMap(run=>[run.initialisationTime,run.availabilityTime]).map(value=>{const stamp=value?Date.parse(value):Number.NaN;return Number.isFinite(stamp)?stamp:0}))}
export function eventPlanFreshness(plan:EventPlan|null|undefined){const refreshedAt=Number(plan?.refreshedAt)||0,startedAt=Number(plan?.refreshStartedAt)||0;return{transactionAt:startedAt||refreshedAt,refreshedAt,startedAt,sourceRevision:Math.max(Number(plan?.sourceRevisionAt)||0,eventModelRevision(plan?.modelInfo))}}
export function compareEventPlanFreshness(left:EventPlan|null|undefined,right:EventPlan|null|undefined){const a=eventPlanFreshness(left),b=eventPlanFreshness(right);if(a.transactionAt!==b.transactionAt)return a.transactionAt-b.transactionAt;if(a.refreshedAt!==b.refreshedAt)return a.refreshedAt-b.refreshedAt;if(a.sourceRevision!==b.sourceRevision)return a.sourceRevision-b.sourceRevision;return 0}
export function upsertEventCenterRecord(record:EventCenterRecord){
 const current=readEventCenterRecords(),index=current.findIndex(item=>item.id===record.id)
 if(index>=0){const existing=current[index],favorite=mergeEventFavoritePreference(existing,record),base=existing.plan&&record.plan&&compareEventPlanFreshness(existing.plan,record.plan)>0?{...record,updatedAt:Math.max(Number(record.updatedAt)||0,Number(existing.updatedAt)||0),plan:existing.plan,change:existing.change}:record;current[index]={...base,...favorite}}
 else current.unshift(record)
 return writeEventCenterRecords(current)
}
export function deleteEventCenterRecord(id:string){return writeEventCenterRecords(readEventCenterRecords().filter(item=>item.id!==id))}
export function toggleEventCenterFavorite(id:string){const at=Date.now();return writeEventCenterRecords(readEventCenterRecords().map(item=>item.id===id?{...item,isFavorite:!item.isFavorite,favoriteUpdatedAt:at,updatedAt:at}:item))}
export function markEventCenterOpened(id:string){return writeEventCenterRecords(readEventCenterRecords().map(item=>item.id===id?{...item,lastOpenedAt:Date.now(),change:item.change?{...item.change,level:'none',badge:'Gesehen'}:item.change}:item))}
export function buildEventCenterId(location:Location,date:string,startTime:string,title:string){
 const slug=`${String(title||location.name||'event').trim().toLowerCase().replace(/[^a-z0-9äöüß]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,42)||'event'}`
 const lat=Number(location.latitude).toFixed(3),lon=Number(location.longitude).toFixed(3)
 return `${slug}:${date}:${startTime}:${lat}:${lon}`
}
