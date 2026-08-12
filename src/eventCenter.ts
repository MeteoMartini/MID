import type {BestMatchModelInfo,Location} from './weather'

export type EventEnvironment='indoor'|'outdoor'|'covered'
export type EventActivity='general'|'running'|'cycling'|'hiking'|'skiing'|'climbing'|'football'|'tennis'|'golf'|'gym'|'yoga'|'watersports'|'city'|'concert'
export type EventStatus='good'|'watch'|'caution'
export type EventTimelinePoint={time:string;temperature:number|null;apparent:number|null;precipitationProbability:number|null;precipitation:number|null;rain?:number|null;showers?:number|null;snowfall?:number|null;weatherCode:number|null;weatherLabel?:string;wind:number|null;gust:number|null;uv:number|null;visibility:number|null;humidity?:number|null;cloud?:number|null;lowCloud?:number|null;cape?:number|null;liftedIndex?:number|null;convectiveInhibition?:number|null;sunshineDuration?:number|null;isDay?:boolean;weatherSourceId?:string;weatherSourceLabel?:string}
export type EventSummary={hours:number;temperatureAvg:number|null;temperatureMin:number|null;temperatureMax:number|null;apparentAvg:number|null;precipitationProbabilityMax:number|null;precipitationTotal:number|null;windMax:number|null;gustMax:number|null;uvMax:number|null;visibilityMin:number|null;weatherCode:number|null;weatherLabel?:string;weatherSourceLabel?:string;isDay?:boolean;modelFamilyCount?:number;rapidCycleUsed?:boolean}
export type EventAdvice={status:EventStatus;headline:string;summary:string;tips:string[];behavior:string[]}
export type EventPlan={location:Location;title:string;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity;timeline:EventTimelinePoint[];summary:EventSummary;advice:EventAdvice;modelInfo:BestMatchModelInfo|null;refreshedAt:number;source:string}
export type EventChangeLevel='none'|'model'|'minor'|'major'
export type EventChangeMeta={level:EventChangeLevel;badge:string;summary:string;updatedAt:number;modelSignature:string;conditionsSignature:string;runHeadline:string}
export type EventCenterRecord={id:string;title:string;location:Location;date:string;startTime:string;endTime:string;environment:EventEnvironment;activity:EventActivity;isFavorite:boolean;createdAt:number;updatedAt:number;lastOpenedAt:number;plan:EventPlan|null;change:EventChangeMeta|null}

export const EVENT_CENTER_STORAGE_KEY='mid:event-center:v1'
export const EVENT_CENTER_UPDATED_EVENT='mid:event-center-updated'
export const EVENT_CENTER_OPEN_EVENT='mid:event-center-open'

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
 return [plan.advice.status,summary.weatherCode??'na',rounded(summary.temperatureAvg,1),rounded(summary.precipitationProbabilityMax),rounded(summary.windMax),rounded(summary.uvMax,1)].join('|')
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
 if(!previous)return{level:'major',badge:'Neu',summary:'Neu im Event-Center gespeichert.',updatedAt:Date.now(),modelSignature,conditionsSignature,runHeadline}
 const previousModelSignature=buildEventModelSignature(previous.modelInfo)
 const previousConditionsSignature=buildEventConditionsSignature(previous)
 const rainDelta=rounded((next.summary.precipitationProbabilityMax??0)-(previous.summary.precipitationProbabilityMax??0))
 const windDelta=rounded((next.summary.windMax??0)-(previous.summary.windMax??0))
 const tempDelta=rounded((next.summary.temperatureAvg??0)-(previous.summary.temperatureAvg??0),1)
 const statusChanged=previous.advice.status!==next.advice.status
 const weatherChanged=previous.summary.weatherCode!==next.summary.weatherCode
 const modelChanged=modelSignature!==previousModelSignature
 const changes:string[]=[]
 let level:EventChangeLevel='none'
 if(statusChanged){level='major';changes.push(`Einschätzung jetzt ${statusLabel(next.advice.status)} statt ${statusLabel(previous.advice.status)}.`)}
 if(rainDelta>=15){level=level==='major'?'major':'minor';changes.push('Niederschlagsrisiko höher.')}
 else if(rainDelta<=-15){level=level==='major'?'major':'minor';changes.push('Niederschlagsrisiko niedriger.')}
 if(windDelta>=6){level=level==='major'?'major':'minor';changes.push('Wind deutlich stärker.')}
 else if(windDelta<=-6){level=level==='major'?'major':'minor';changes.push('Wind deutlich schwächer.')}
 if(Math.abs(tempDelta)>=3){level=level==='major'?'major':'minor';changes.push(tempDelta>0?'Temperaturtrend milder.':'Temperaturtrend kühler.')}
 if(weatherChanged&&level==='none'){level='minor';changes.push('Leitwetter aktualisiert.')}
 if(modelChanged&&level==='none'){level='model';changes.push('Neuer Modelllauf ohne größere Abweichung.')}
 if(level==='none'&&previousConditionsSignature!==conditionsSignature){level='minor';changes.push('Kleinere Anpassungen im Zeitfenster.')}
 if(level==='none'){changes.push('Keine wesentliche Änderung gegenüber dem letzten Stand.')}
 const badge=level==='major'?'Tendenz neu':level==='minor'?'Update':level==='model'?'Modell neu':'Stabil'
 return{level,badge,summary:changes.join(' '),updatedAt:Date.now(),modelSignature,conditionsSignature,runHeadline}
}

function statusLabel(value:EventStatus){return value==='good'?'passt':value==='watch'?'beobachten':'Achtung'}
function parseDateStamp(value:string,time='00:00'){const stamp=Date.parse(`${value}T${time}:00`);return Number.isFinite(stamp)?stamp:0}

export function sortEventCenterRecords(records:EventCenterRecord[]){
 return [...records].sort((a,b)=>{
  if(a.isFavorite!==b.isFavorite)return a.isFavorite?-1:1
  const aDate=parseDateStamp(a.date,a.startTime),bDate=parseDateStamp(b.date,b.startTime)
  if(aDate&&bDate&&aDate!==bDate)return aDate-bDate
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
 return{ id,title,location,date,startTime,endTime,environment,activity,isFavorite:Boolean(record.isFavorite),createdAt:safeNumber(record.createdAt as number|undefined,Date.now()),updatedAt:safeNumber(record.updatedAt as number|undefined,Date.now()),lastOpenedAt:safeNumber(record.lastOpenedAt as number|undefined,0),plan:(record.plan??null) as EventPlan|null,change:(record.change??null) as EventChangeMeta|null }
}

export function readEventCenterRecords(){
 try{
  const raw=JSON.parse(localStorage.getItem(EVENT_CENTER_STORAGE_KEY)||'[]')
  const list=Array.isArray(raw)?raw.map(normalizeEventCenterRecord).filter((item):item is EventCenterRecord=>Boolean(item)):[ ]
  return sortEventCenterRecords(list)
 }catch{return[]}
}
export function writeEventCenterRecords(records:EventCenterRecord[]){
 const sorted=sortEventCenterRecords(records)
 try{localStorage.setItem(EVENT_CENTER_STORAGE_KEY,JSON.stringify(sorted))}catch{}
 if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(EVENT_CENTER_UPDATED_EVENT,{detail:sorted}))
 return sorted
}
export function upsertEventCenterRecord(record:EventCenterRecord){
 const current=readEventCenterRecords(),index=current.findIndex(item=>item.id===record.id)
 if(index>=0)current[index]=record
 else current.unshift(record)
 return writeEventCenterRecords(current)
}
export function deleteEventCenterRecord(id:string){return writeEventCenterRecords(readEventCenterRecords().filter(item=>item.id!==id))}
export function toggleEventCenterFavorite(id:string){return writeEventCenterRecords(readEventCenterRecords().map(item=>item.id===id?{...item,isFavorite:!item.isFavorite,updatedAt:Date.now()}:item))}
export function markEventCenterOpened(id:string){return writeEventCenterRecords(readEventCenterRecords().map(item=>item.id===id?{...item,lastOpenedAt:Date.now(),change:item.change?{...item.change,level:'none',badge:'Gesehen'}:item.change}:item))}
export function buildEventCenterId(location:Location,date:string,startTime:string,title:string){
 const slug=`${String(title||location.name||'event').trim().toLowerCase().replace(/[^a-z0-9äöüß]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,42)||'event'}`
 const lat=Number(location.latitude).toFixed(3),lon=Number(location.longitude).toFixed(3)
 return `${slug}:${date}:${startTime}:${lat}:${lon}`
}
