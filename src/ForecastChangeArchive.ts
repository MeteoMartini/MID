import {useEffect} from 'react';
import {forecast,mapDays,mapHours,type Location,type Weather,type EnsembleDay,type ModelRunMeta} from './weather';
import {buildModelChangeSnapshot,modelChangeLocationKey,updateModelChangeRadar,readModelChangeHistory,recordModelChangeCaptureStatus,readModelChangeCaptureStatus} from './modelRunChanges';
export const FORECAST_ARCHIVE_UPDATED='mid:forecast-archive-updated';
const FAVORITE_SUCCESS_MS=30*60*1000,FAVORITE_FAILURE_RETRY_MS=5*60*1000;
/** A selected favourite is not excluded until it has an actual, recent archive basis.
 * Failed/uncaptured favourites are retried while the app is visible, even if never opened. */
export function dueForecastArchiveFavorites(favorites:{location:Location}[],now=Date.now()){
 const seen=new Set<string>();
 return favorites.map(f=>f.location).filter(place=>{
  const key=modelChangeLocationKey(place);
  if(seen.has(key))return false;seen.add(key);
  const status=readModelChangeCaptureStatus(key),age=now-Date.parse(status?.checkedAt||'');
  if(!Number.isFinite(age)||age<0)return true;
  const complete=status?.count>0&&(status.state==='stored'||status.state==='unchanged');
  return age>=(complete?FAVORITE_SUCCESS_MS:FAVORITE_FAILURE_RETRY_MS);
 });
}
/** Archive the actual Best-Match inputs, independent of any lazy disclosure. */
export function captureForecastInputs(location:Location,weather:Weather,ensemble:EnsembleDay[]=[],runs:ModelRunMeta[]=[]){
 const key=modelChangeLocationKey(location);let stage:'input'|'storage'='input';
 try{
 if(weather._mid_core_proxy?.stale||(weather._mid_core_proxy?.ageMs??0)>3*3600000)return recordModelChangeCaptureStatus(key,'stale');
 const days=mapDays(weather).map(day=>{const index=weather.daily.time.indexOf(day.date);return {...day,precipitation:typeof weather.daily.precipitation_sum?.[index]==='number'?day.precipitation:NaN,gust:typeof weather.daily.wind_gusts_10m_max?.[index]==='number'?day.gust:NaN}});
 if(!days.length)return recordModelChangeCaptureStatus(key,'incomplete');
 const snapshot=buildModelChangeSnapshot(ensemble,days,mapHours(weather),runs);
 snapshot.inputs={...snapshot.inputs!,context:'best-match-inputs',provider:weather._mid_core_proxy?.provider||'Open-Meteo Best Match',sourceUpdatedAt:weather._mid_core_proxy?.sourceUpdatedAt,fallback:weather._mid_core_proxy?.fallback===true};
 // Only actually available ensemble inputs supply probability, spread and consistency.
 stage='storage';const report=updateModelChangeRadar(key,snapshot),saved=readModelChangeHistory(key).filter(row=>row.inputs?.context==='best-match-inputs').at(-1),status=recordModelChangeCaptureStatus(key,saved?.signature!==snapshot.signature||saved?.inputs?.context!==snapshot.inputs.context?'error':report.unchanged?'unchanged':'stored',saved?.signature!==snapshot.signature?'storage':undefined);
 return status;
 }catch{return recordModelChangeCaptureStatus(key,'error',stage==='storage'?'storage':'invalid-data')}finally{if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent(FORECAST_ARCHIVE_UPDATED,{detail:{key}}))}
}
export function useForecastChangeArchive({location,weather,favorites,ensemble=[],runs=[]}:{location:Location|null;weather:Weather|null;favorites:{location:Location}[];ensemble?:EnsembleDay[];runs?:ModelRunMeta[]}){
 const favoritesKey=favorites.map(f=>`${modelChangeLocationKey(f.location)}:${f.location.timezone}:${f.location.elevation}`).join('|');
 useEffect(()=>{if(location&&weather)captureForecastInputs(location,weather,ensemble,runs)},[location?.latitude,location?.longitude,weather,ensemble,runs]);
 useEffect(()=>{
  const controller=new AbortController();let running=false;
  async function refresh(){
   if(running||document.visibilityState==='hidden'||navigator.onLine===false)return;
   running=true;
   const list=dueForecastArchiveFavorites(favorites);let cursor=0;
   async function load(){
    while(cursor<list.length&&!controller.signal.aborted){
     const place=list[cursor++],key=modelChangeLocationKey(place);
     try{
      const result=await forecast(place.latitude,place.longitude,controller.signal,{priority:'background',timeZone:place.timezone,elevation:place.elevation});
      if(!controller.signal.aborted)captureForecastInputs(place,result);
     }catch{
      if(!controller.signal.aborted){recordModelChangeCaptureStatus(key,'error','fetch');window.dispatchEvent(new CustomEvent(FORECAST_ARCHIVE_UPDATED,{detail:{key}}))}
     }
    }
   }
   try{await Promise.all([load(),load()])}finally{running=false}
  }
  void refresh();const timer=window.setInterval(()=>void refresh(),FAVORITE_FAILURE_RETRY_MS),resume=()=>void refresh();
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{controller.abort();window.clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume)};
 },[favoritesKey,location?.latitude,location?.longitude]);
}
