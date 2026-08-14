import type {BestMatchModelInfo} from './weather'
import {runBackgroundNetworkTask} from './backgroundNetwork'
import {buildEventPlan} from './eventWeatherEngine'
import {EVENT_CENTER_REFRESH_DONE_EVENT,EVENT_CENTER_REFRESH_EVENT,buildEventModelSignature,compareEventPlanFreshness,compareEventPlans,completeEventCenterRefreshRequest,eventPlanFreshness,pendingEventCenterRefreshRequest,readEventCenterRecords,upsertEventCenterRecord,type EventCenterRecord,type EventPlan} from './eventCenter'

export type EventWeatherRefreshReason='dashboard'|'header'|'overview'|'detail'|'auto-start'|'auto-stale'|'auto-interval'|'auto-resume'|'model-run'
export type EventWeatherRefreshResult={requested:number;refreshed:number;failed:number;skipped:number;reason:EventWeatherRefreshReason;at:number}

type QueueEntry={promise:Promise<boolean>;sequence:number}
const eventQueues=new Map<string,QueueEntry>()
let sequence=0
let monitorUsers=0
let monitorStop:(()=>void)|null=null

// Seit v0.9.53.18 ist die Eventüberwachung bewusst passiv. Der v0.9.53.8-
// Mechanismus mit Start-/Focus-Modellpolling und erzwungenem 30-Minuten-Fullrefresh
// erzeugte zusammen mit Favoritenlernen und Core-Abruf zu viele parallele Modellrequests.
const EVENT_STALE_AFTER_MS=60*60*1000
const STALE_CHECK_MS=15*60*1000
const STARTUP_DELAY_MS=1200
const RESUME_DELAY_MS=30*1000
const BACKGROUND_QUIET_MS=45*1000
const BACKGROUND_BATCH_LIMIT=4
const BACKGROUND_EVENT_GAP_MS=1400
const REFRESH_TRANSACTION_TIMEOUT_MS=55*1000
const ACTIVE_EVENT_PAST_GRACE_MS=6*3600000
const ACTIVE_EVENT_FUTURE_MS=14*86400000

function eventEndStamp(record:EventCenterRecord){const stamp=Date.parse(`${record.date}T${record.endTime||record.startTime||'23:59'}:00`);return Number.isFinite(stamp)?stamp:Number.MAX_SAFE_INTEGER}
function eventStartStamp(record:EventCenterRecord){const stamp=Date.parse(`${record.date}T${record.startTime||'00:00'}:00`);return Number.isFinite(stamp)?stamp:0}
function activeRecords(records=readEventCenterRecords()){
 const now=Date.now()
 return records.filter(record=>eventEndStamp(record)>=now-ACTIVE_EVENT_PAST_GRACE_MS&&eventStartStamp(record)<=now+ACTIVE_EVENT_FUTURE_MS)
}
function modelRunEpoch(value?:string){const stamp=value?Date.parse(value):Number.NaN;return Number.isFinite(stamp)?stamp:0}
export function eventModelRevision(modelInfo:BestMatchModelInfo|null|undefined){return Math.max(0,...(modelInfo?.runs??[]).map(run=>Math.max(modelRunEpoch(run.initialisationTime),modelRunEpoch(run.availabilityTime))))}
export function eventPlanSourceRevision(plan:EventPlan|null|undefined){return Math.max(Number(plan?.sourceRevisionAt)||0,eventModelRevision(plan?.modelInfo))}
export function hasNewEventModelRun(previous:BestMatchModelInfo|null|undefined,current:BestMatchModelInfo|null|undefined){
 if(!current?.runs?.length)return false
 if(!previous?.runs?.length)return true
 const oldRuns=new Map(previous.runs.map(run=>[run.id,modelRunEpoch(run.initialisationTime)||modelRunEpoch(run.availabilityTime)]))
 return current.runs.some(run=>{const next=modelRunEpoch(run.initialisationTime)||modelRunEpoch(run.availabilityTime),old=oldRuns.get(run.id);return next>0&&(!old||next>old+1000)})
}
function refreshTransactionAllowsCommit(previous:EventPlan|null|undefined,next:EventPlan){return !previous||compareEventPlanFreshness(previous,next)<=0}
function broadcast(result:EventWeatherRefreshResult,requestedAt=0){if(typeof window==='undefined')return;window.dispatchEvent(new CustomEvent(EVENT_CENTER_REFRESH_DONE_EVENT,{detail:{...result,requestedAt}}))}
function isManualReason(reason:EventWeatherRefreshReason){return reason==='dashboard'||reason==='header'||reason==='overview'||reason==='detail'}
function pause(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms))}

async function executeEventRefresh(recordId:string,reason:EventWeatherRefreshReason){
 const record=readEventCenterRecords().find(item=>item.id===recordId)
 if(!record)return false
 const controller=new AbortController(),startedAt=Date.now(),timeout=typeof window!=='undefined'?window.setTimeout(()=>controller.abort(new DOMException('Event-Aktualisierung überschritt das Zeitlimit','TimeoutError')),REFRESH_TRANSACTION_TIMEOUT_MS):0
 try{
  // Nur ausdrücklich manuelle Aktualisierungen umgehen vorhandene Caches. Automatische
  // Überwachung nutzt normale Freshness-Verträge und darf den Wetterdienst nicht fluten.
  const forceFresh=isManualReason(reason)
  const built=await buildEventPlan({location:record.location,eventDate:record.date,eventStartTime:record.startTime,eventEndTime:record.endTime,eventEnvironment:record.environment,eventActivity:record.activity,eventTitle:record.title,signal:controller.signal,forceFresh})
  const latest=readEventCenterRecords().find(item=>item.id===recordId)
  if(!latest)return false
  const nextPlan:EventPlan={...built,refreshStartedAt:startedAt,refreshReason:reason,sourceRevisionAt:eventModelRevision(built.modelInfo)}
  if(!refreshTransactionAllowsCommit(latest.plan,nextPlan))return false
  const change=compareEventPlans(latest.plan,nextPlan)
  upsertEventCenterRecord({...latest,updatedAt:Date.now(),plan:nextPlan,change})
  const persisted=readEventCenterRecords().find(item=>item.id===recordId)?.plan,persistedFreshness=eventPlanFreshness(persisted)
  return Boolean(persisted&&persistedFreshness.transactionAt>=startedAt&&compareEventPlanFreshness(persisted,nextPlan)>=0)
 }catch{return false}finally{if(timeout&&typeof window!=='undefined')window.clearTimeout(timeout)}
}

function enqueueEventRefresh(recordId:string,reason:EventWeatherRefreshReason){
 const previous=eventQueues.get(recordId)?.promise??Promise.resolve(true),jobSequence=++sequence
 const promise=previous.catch(()=>false).then(()=>executeEventRefresh(recordId,reason)).finally(()=>{if(eventQueues.get(recordId)?.sequence===jobSequence)eventQueues.delete(recordId)})
 eventQueues.set(recordId,{promise,sequence:jobSequence})
 return promise
}

export async function refreshEventWeather(recordId:string,options:{reason?:EventWeatherRefreshReason;requestedAt?:number}={}):Promise<EventWeatherRefreshResult>{
 const reason=options.reason??'detail',requestedAt=Number(options.requestedAt)||0,exists=readEventCenterRecords().some(record=>record.id===recordId)
 if(!exists){const result={requested:0,refreshed:0,failed:0,skipped:1,reason,at:Date.now()} satisfies EventWeatherRefreshResult;broadcast(result,requestedAt);return result}
 const ok=await enqueueEventRefresh(recordId,reason),result={requested:1,refreshed:ok?1:0,failed:ok?0:1,skipped:0,reason,at:Date.now()} satisfies EventWeatherRefreshResult
 if(requestedAt>0&&ok)completeEventCenterRefreshRequest(requestedAt)
 broadcast(result,requestedAt)
 return result
}

export async function refreshAllEventWeather(options:{reason?:EventWeatherRefreshReason;requestedAt?:number;favoritesOnly?:boolean;staleOnly?:boolean;recordIds?:string[]}={}):Promise<EventWeatherRefreshResult>{
 const reason=options.reason??'overview',requestedAt=Number(options.requestedAt)||0,now=Date.now(),ids=options.recordIds?new Set(options.recordIds):null,manual=isManualReason(reason)
 let targets=activeRecords().sort((a,b)=>eventStartStamp(a)-eventStartStamp(b))
 if(ids)targets=targets.filter(record=>ids.has(record.id))
 if(options.favoritesOnly)targets=targets.filter(record=>record.isFavorite)
 if(options.staleOnly)targets=targets.filter(record=>!record.plan||now-Number(record.plan.refreshedAt||record.updatedAt||0)>=EVENT_STALE_AFTER_MS)
 if(!manual&&!ids)targets=targets.slice(0,BACKGROUND_BATCH_LIMIT)
 else if(!options.favoritesOnly&&!ids)targets=targets.slice(0,20)
 if(!targets.length){const result={requested:0,refreshed:0,failed:0,skipped:0,reason,at:Date.now()} satisfies EventWeatherRefreshResult;if(requestedAt>0)completeEventCenterRefreshRequest(requestedAt);broadcast(result,requestedAt);return result}
 let refreshed=0,failed=0
 for(let index=0;index<targets.length;index++){
  const ok=await enqueueEventRefresh(targets[index].id,reason);if(ok)refreshed++;else failed++
  if(!manual&&index<targets.length-1)await pause(BACKGROUND_EVENT_GAP_MS)
 }
 const result={requested:targets.length,refreshed,failed,skipped:0,reason,at:Date.now()} satisfies EventWeatherRefreshResult
 if(requestedAt>0&&failed===0&&refreshed===targets.length)completeEventCenterRefreshRequest(requestedAt)
 broadcast(result,requestedAt)
 return result
}

async function runPendingManualRequest(){
 const pending=pendingEventCenterRefreshRequest();if(!pending)return
 const source=(pending.source==='header'?'header':pending.source==='dashboard'?'dashboard':'overview') satisfies EventWeatherRefreshReason
 await refreshAllEventWeather({reason:source,requestedAt:pending.at})
}

function installMonitor(){
 if(typeof window==='undefined')return()=>{}
 let stopped=false,autoRunning=false,resumeTimer=0,monitorController=new AbortController()
 const autoCatchup=(reason:EventWeatherRefreshReason)=>{if(stopped||autoRunning||document.visibilityState==='hidden'||navigator.onLine===false)return;autoRunning=true;void runBackgroundNetworkTask('event-weather-auto',()=>refreshAllEventWeather({reason,staleOnly:true}),{signal:monitorController.signal,quietMs:BACKGROUND_QUIET_MS}).catch(()=>undefined).finally(()=>{autoRunning=false})}
 const request=(event:Event)=>{const detail=(event as CustomEvent<{source?:string;requestedAt?:number}>).detail,pending=pendingEventCenterRefreshRequest(),requestedAt=Number(detail?.requestedAt)||pending?.at||0,source=String(detail?.source||pending?.source||'overview'),reason=(source==='header'?'header':source==='dashboard'?'dashboard':'overview') satisfies EventWeatherRefreshReason;void refreshAllEventWeather({reason,requestedAt})}
 const resume=()=>{if(document.visibilityState==='hidden')return;window.clearTimeout(resumeTimer);resumeTimer=window.setTimeout(()=>autoCatchup('auto-resume'),RESUME_DELAY_MS)}
 window.addEventListener(EVENT_CENTER_REFRESH_EVENT,request)
 document.addEventListener('visibilitychange',resume)
 window.addEventListener('pageshow',resume)
 window.addEventListener('focus',resume)
 window.addEventListener('online',resume)
 const initial=window.setTimeout(()=>{void runPendingManualRequest();autoCatchup('auto-start')},STARTUP_DELAY_MS)
 const staleTimer=window.setInterval(()=>autoCatchup('auto-stale'),STALE_CHECK_MS)
 return()=>{stopped=true;monitorController.abort();window.removeEventListener(EVENT_CENTER_REFRESH_EVENT,request);document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);window.clearTimeout(initial);window.clearTimeout(resumeTimer);window.clearInterval(staleTimer)}
}

export function startEventWeatherMonitor(){monitorUsers++;if(!monitorStop)monitorStop=installMonitor();return()=>{monitorUsers=Math.max(0,monitorUsers-1);if(monitorUsers===0&&monitorStop){monitorStop();monitorStop=null}}}
export function eventWeatherMonitorStatus(){return{running:Boolean(monitorStop),queued:eventQueues.size,staleCheckMs:STALE_CHECK_MS,staleAfterMs:EVENT_STALE_AFTER_MS,backgroundBatchLimit:BACKGROUND_BATCH_LIMIT,modelMonitoring:'passive-refresh' as const}}
export function currentEventModelSignature(plan:EventPlan|null|undefined){return buildEventModelSignature(plan?.modelInfo)}
