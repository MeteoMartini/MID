import {bestMatchModelInfo,type BestMatchModelInfo} from './weather'
import {buildEventPlan} from './eventWeatherEngine'
import {EVENT_CENTER_REFRESH_DONE_EVENT,EVENT_CENTER_REFRESH_EVENT,buildEventModelSignature,compareEventPlans,completeEventCenterRefreshRequest,pendingEventCenterRefreshRequest,readEventCenterRecords,upsertEventCenterRecord,type EventCenterRecord,type EventPlan} from './eventCenter'

export type EventWeatherRefreshReason='dashboard'|'header'|'overview'|'detail'|'auto-start'|'auto-stale'|'auto-interval'|'auto-resume'|'model-run'
export type EventWeatherRefreshResult={requested:number;refreshed:number;failed:number;skipped:number;reason:EventWeatherRefreshReason;at:number}

type QueueEntry={promise:Promise<boolean>;sequence:number}
const eventQueues=new Map<string,QueueEntry>()
let sequence=0
let monitorUsers=0
let monitorStop:(()=>void)|null=null
const AUTO_REFRESH_MS=30*60*1000
const MODEL_CHECK_MS=5*60*1000
const STARTUP_DELAY_MS=800
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
export function eventModelRevision(modelInfo:BestMatchModelInfo|null|undefined){
 return Math.max(0,...(modelInfo?.runs??[]).map(run=>Math.max(modelRunEpoch(run.initialisationTime),modelRunEpoch(run.availabilityTime))))
}
export function eventPlanSourceRevision(plan:EventPlan|null|undefined){return Math.max(Number(plan?.sourceRevisionAt)||0,eventModelRevision(plan?.modelInfo))}
export function hasNewEventModelRun(previous:BestMatchModelInfo|null|undefined,current:BestMatchModelInfo|null|undefined){
 if(!current?.runs?.length)return false
 if(!previous?.runs?.length)return true
 const oldRuns=new Map(previous.runs.map(run=>[run.id,modelRunEpoch(run.initialisationTime)||modelRunEpoch(run.availabilityTime)]))
 return current.runs.some(run=>{const next=modelRunEpoch(run.initialisationTime)||modelRunEpoch(run.availabilityTime),old=oldRuns.get(run.id);return next>0&&(!old||next>old+1000)})
}
function sourceAllowsCommit(previous:EventPlan|null|undefined,next:EventPlan){
 const previousRevision=eventPlanSourceRevision(previous),nextRevision=eventPlanSourceRevision(next)
 if(previousRevision>0&&nextRevision>0&&nextRevision+1000<previousRevision)return false
 return true
}
function broadcast(result:EventWeatherRefreshResult,requestedAt=0){
 if(typeof window==='undefined')return
 window.dispatchEvent(new CustomEvent(EVENT_CENTER_REFRESH_DONE_EVENT,{detail:{...result,requestedAt}}))
}

async function executeEventRefresh(recordId:string,reason:EventWeatherRefreshReason){
 const record=readEventCenterRecords().find(item=>item.id===recordId)
 if(!record)return false
 const controller=new AbortController(),startedAt=Date.now(),timeout=typeof window!=='undefined'?window.setTimeout(()=>controller.abort(new DOMException('Event-Aktualisierung überschritt das Zeitlimit','TimeoutError')),REFRESH_TRANSACTION_TIMEOUT_MS):0
 try{
  const built=await buildEventPlan({location:record.location,eventDate:record.date,eventStartTime:record.startTime,eventEndTime:record.endTime,eventEnvironment:record.environment,eventActivity:record.activity,eventTitle:record.title,signal:controller.signal,forceFresh:true})
  const latest=readEventCenterRecords().find(item=>item.id===recordId)
  if(!latest)return false
  const nextPlan:EventPlan={...built,refreshStartedAt:startedAt,refreshReason:reason,sourceRevisionAt:eventModelRevision(built.modelInfo)}
  if(!sourceAllowsCommit(latest.plan,nextPlan))return false
  const change=compareEventPlans(latest.plan,nextPlan)
  upsertEventCenterRecord({...latest,updatedAt:Date.now(),plan:nextPlan,change})
  return true
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
 const reason=options.reason??'overview',requestedAt=Number(options.requestedAt)||0,now=Date.now(),ids=options.recordIds?new Set(options.recordIds):null
 let targets=activeRecords()
 if(ids)targets=targets.filter(record=>ids.has(record.id))
 if(options.favoritesOnly)targets=targets.filter(record=>record.isFavorite)
 if(options.staleOnly)targets=targets.filter(record=>!record.plan||now-Number(record.plan.refreshedAt||record.updatedAt||0)>=AUTO_REFRESH_MS)
 // Favoriten werden als vollständige Beobachtungsliste behandelt; die Lastgrenze gilt nur für allgemeine Sammelläufe.
 if(!options.favoritesOnly&&!ids)targets=targets.slice(0,20)
 if(!targets.length){const result={requested:0,refreshed:0,failed:0,skipped:0,reason,at:Date.now()} satisfies EventWeatherRefreshResult;if(requestedAt>0)completeEventCenterRefreshRequest(requestedAt);broadcast(result,requestedAt);return result}
 const settled=await Promise.all(targets.map(record=>enqueueEventRefresh(record.id,reason))),refreshed=settled.filter(Boolean).length,failed=settled.length-refreshed,result={requested:targets.length,refreshed,failed,skipped:0,reason,at:Date.now()} satisfies EventWeatherRefreshResult
 // Persistierte manuelle Anforderungen gelten erst dann als erledigt, wenn wirklich alle Ziel-Events neu gerechnet wurden.
 if(requestedAt>0&&failed===0&&refreshed===targets.length)completeEventCenterRefreshRequest(requestedAt)
 broadcast(result,requestedAt)
 return result
}

async function modelRunRefresh(){
 const records=activeRecords();if(!records.length)return
 const groups=new Map<string,EventCenterRecord[]>()
 for(const record of records){const key=`${record.location.latitude.toFixed(4)}:${record.location.longitude.toFixed(4)}:${record.location.country_code||record.location.country||''}`,list=groups.get(key)??[];list.push(record);groups.set(key,list)}
 for(const group of groups.values()){
  const sample=group[0],controller=new AbortController(),timer=window.setTimeout(()=>controller.abort(),14000)
  try{
   const info=await bestMatchModelInfo(sample.location.latitude,sample.location.longitude,sample.location.country_code||sample.location.country,controller.signal)
   const changed=group.filter(record=>hasNewEventModelRun(record.plan?.modelInfo,info)).map(record=>record.id)
   if(changed.length)await refreshAllEventWeather({reason:'model-run',recordIds:changed})
  }catch{}finally{window.clearTimeout(timer)}
 }
}

async function runPendingManualRequest(){
 const pending=pendingEventCenterRefreshRequest();if(!pending)return
 const source=(pending.source==='header'?'header':pending.source==='dashboard'?'dashboard':'overview') satisfies EventWeatherRefreshReason
 await refreshAllEventWeather({reason:source,requestedAt:pending.at})
}

function installMonitor(){
 if(typeof window==='undefined')return()=>{}
 let stopped=false,modelRunning=false,catchupRunning=false
 const catchup=async(reason:EventWeatherRefreshReason,force=false)=>{if(stopped||catchupRunning||document.visibilityState==='hidden')return;catchupRunning=true;try{await runPendingManualRequest();if(force)await refreshAllEventWeather({reason});else await refreshAllEventWeather({reason,staleOnly:true})}finally{catchupRunning=false}}
 const models=async()=>{if(stopped||modelRunning||document.visibilityState==='hidden'||navigator.onLine===false)return;modelRunning=true;try{await modelRunRefresh()}finally{modelRunning=false}}
 const request=(event:Event)=>{const detail=(event as CustomEvent<{source?:string;requestedAt?:number}>).detail,pending=pendingEventCenterRefreshRequest(),requestedAt=Number(detail?.requestedAt)||pending?.at||0,source=String(detail?.source||pending?.source||'overview'),reason=(source==='header'?'header':source==='dashboard'?'dashboard':'overview') satisfies EventWeatherRefreshReason;void refreshAllEventWeather({reason,requestedAt})}
 const resume=()=>{if(document.visibilityState==='hidden')return;void catchup('auto-resume');void models()}
 window.addEventListener(EVENT_CENTER_REFRESH_EVENT,request)
 document.addEventListener('visibilitychange',resume)
 window.addEventListener('pageshow',resume)
 window.addEventListener('focus',resume)
 window.addEventListener('online',resume)
 const initial=window.setTimeout(()=>{void catchup('auto-start');void models()},STARTUP_DELAY_MS)
 const staleTimer=window.setInterval(()=>void catchup('auto-stale'),MODEL_CHECK_MS)
 const modelTimer=window.setInterval(()=>void models(),MODEL_CHECK_MS)
 const forcedTimer=window.setInterval(()=>void catchup('auto-interval',true),AUTO_REFRESH_MS)
 return()=>{stopped=true;window.removeEventListener(EVENT_CENTER_REFRESH_EVENT,request);document.removeEventListener('visibilitychange',resume);window.removeEventListener('pageshow',resume);window.removeEventListener('focus',resume);window.removeEventListener('online',resume);window.clearTimeout(initial);window.clearInterval(staleTimer);window.clearInterval(modelTimer);window.clearInterval(forcedTimer)}
}

export function startEventWeatherMonitor(){
 monitorUsers++
 if(!monitorStop)monitorStop=installMonitor()
 return()=>{monitorUsers=Math.max(0,monitorUsers-1);if(monitorUsers===0&&monitorStop){monitorStop();monitorStop=null}}
}

export function eventWeatherMonitorStatus(){return{running:Boolean(monitorStop),queued:eventQueues.size,modelCheckMs:MODEL_CHECK_MS,forceRefreshMs:AUTO_REFRESH_MS}}
export function currentEventModelSignature(plan:EventPlan|null|undefined){return buildEventModelSignature(plan?.modelInfo)}
