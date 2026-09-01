import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {Cloud,CloudRain,RefreshCw,ThermometerSun,Snowflake,Wind as WindIcon,Gauge,Info} from 'lucide-react';
import {guardedOpenMeteoFetch} from './openMeteoGuard';
import {formatDecimalFixed} from './format';
import type {Location,WindUnit} from './weather';

type TrendMetric='temperature_max'|'temperature_min'|'precipitation'|'pressure'|'cloud'|'wind'|'gust';
type ModelView='combined'|'ecmwf-ec46'|'noaa-gefs';

type MetricAggregate='mean'|'sum';

interface MetricDefinition{
  id:TrendMetric;
  label:string;
  buttonLabel:string;
  unit:string;
  icon:typeof ThermometerSun;
  api:string;
  aggregate:MetricAggregate;
  weeklyMean:string;
  weeklyAnomaly:string;
  colorClass:string;
}

interface TrendWeekValue{
  mean:number;
  p10:number;
  p25:number;
  p75:number;
  p90:number;
  samples:number[];
  modelCount:number;
}

interface TrendWeek{
  id:string;
  label:string;
  startDate:string;
  endDate:string;
  values:Record<TrendMetric,TrendWeekValue|null>;
}

interface TrendModel{
  id:'ecmwf-ec46'|'noaa-gefs';
  family:string;
  members:number;
  horizonDays:number;
  gridLabel:string;
  weeks:TrendWeek[];
  climateWeeks:TrendWeek[];
}

interface TrendBundle{
  models:TrendModel[];
  fetchedAt:string;
  cacheStatus:'live'|'fresh-cache'|'stale-cache'|'mixed-stale';
  cacheAgeMinutes:number;
}

interface ApiPayload{
  daily?:Record<string,unknown>;
  daily_units?:Record<string,string>;
  weekly?:Record<string,unknown>;
  weekly_units?:Record<string,string>;
  generationtime_ms?:number;
  error?:boolean;
  reason?:string;
}

const SEASONAL_ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal';
const ENSEMBLE_ENDPOINT='https://ensemble-api.open-meteo.com/v1/ensemble';
const CACHE_PREFIX='mid:subseasonal-trend:v3';
const CACHE_MAX_AGE_MS=6*60*60*1000;
const METRICS:MetricDefinition[]=[
  {id:'temperature_max',label:'Tmax',buttonLabel:'Tmax',unit:'°C',icon:ThermometerSun,api:'temperature_2m_max',aggregate:'mean',weeklyMean:'temperature_2m_max',weeklyAnomaly:'temperature_2m_max_anomaly',colorClass:'metric-temperature-max'},
  {id:'temperature_min',label:'Tmin',buttonLabel:'Tmin',unit:'°C',icon:Snowflake,api:'temperature_2m_min',aggregate:'mean',weeklyMean:'temperature_2m_min',weeklyAnomaly:'temperature_2m_min_anomaly',colorClass:'metric-temperature-min'},
  {id:'precipitation',label:'Niederschlag',buttonLabel:'Niederschlag',unit:'mm/Woche',icon:CloudRain,api:'precipitation_sum',aggregate:'sum',weeklyMean:'precipitation_mean',weeklyAnomaly:'precipitation_anomaly',colorClass:'metric-precipitation'},
  {id:'pressure',label:'Luftdruck',buttonLabel:'Luftdruck',unit:'hPa',icon:Gauge,api:'pressure_msl_mean',aggregate:'mean',weeklyMean:'pressure_msl_mean',weeklyAnomaly:'pressure_msl_anomaly',colorClass:'metric-pressure'},
  {id:'cloud',label:'Bewölkung',buttonLabel:'Bewölkung',unit:'%',icon:Cloud,api:'cloud_cover_mean',aggregate:'mean',weeklyMean:'cloud_cover_mean',weeklyAnomaly:'cloud_cover_anomaly',colorClass:'metric-cloud'},
  {id:'wind',label:'Wind',buttonLabel:'Wind',unit:'kt',icon:WindIcon,api:'wind_speed_10m_mean',aggregate:'mean',weeklyMean:'wind_speed_10m_mean',weeklyAnomaly:'wind_speed_10m_anomaly',colorClass:'metric-wind'},
  {id:'gust',label:'Windböen',buttonLabel:'Böen',unit:'kt',icon:WindIcon,api:'wind_gusts_10m_mean',aggregate:'mean',weeklyMean:'wind_gusts_10m_mean',weeklyAnomaly:'wind_gusts_10m_anomaly',colorClass:'metric-gust'}
];
const DAILY_VARIABLES=[...new Set(METRICS.map(metric=>metric.api))];
const WEEKLY_VARIABLES=[...new Set(METRICS.flatMap(metric=>[metric.weeklyMean,metric.weeklyAnomaly]))];

const FALLBACK_DAILY_VARIABLES=['temperature_2m_max','temperature_2m_min','precipitation_sum','pressure_msl_mean','cloud_cover_mean','wind_speed_10m_mean'];
const FALLBACK_WEEKLY_VARIABLES=['temperature_2m_mean','temperature_2m_anomaly','precipitation_mean','precipitation_anomaly','pressure_msl_mean','pressure_msl_anomaly','cloud_cover_mean','cloud_cover_anomaly','wind_speed_10m_mean','wind_speed_10m_anomaly'];

function metricDefinition(metric:TrendMetric){
  return METRICS.find(item=>item.id===metric)??METRICS[0];
}

function windUnitLabel(unit:WindUnit){
  return unit==='kmh'?'km/h':unit==='ms'?'m/s':unit==='mph'?'mph':'kt';
}

function finite(values:number[]){
  return values.filter(Number.isFinite);
}

function mean(values:number[]){
  if(!values.length)return NaN;
  return values.reduce((sum,value)=>sum+value,0)/values.length;
}

function quantile(values:number[],position:number){
  if(!values.length)return NaN;
  const sorted=[...values].sort((a,b)=>a-b);
  if(sorted.length===1)return sorted[0];
  const index=(sorted.length-1)*Math.max(0,Math.min(1,position));
  const lower=Math.floor(index);
  const upper=Math.ceil(index);
  if(lower===upper)return sorted[lower];
  const mix=index-lower;
  return sorted[lower]*(1-mix)+sorted[upper]*mix;
}

function summarize(samples:number[],modelCount:number):TrendWeekValue|null{
  const valid=finite(samples);
  if(!valid.length)return null;
  return {
    mean:mean(valid),
    p10:quantile(valid,0.1),
    p25:quantile(valid,0.25),
    p75:quantile(valid,0.75),
    p90:quantile(valid,0.9),
    samples:valid,
    modelCount
  };
}

function daySpan(startDate:string,endDate:string){
  const start=Date.parse(`${startDate}T00:00:00Z`);
  const end=Date.parse(`${endDate}T00:00:00Z`);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 7;
  return Math.max(1,Math.round((end-start)/86400000)+1);
}

function aggregateMember(values:number[],aggregate:MetricAggregate){
  const valid=finite(values);
  if(!valid.length)return NaN;
  return aggregate==='sum'?valid.reduce((sum,value)=>sum+value,0):mean(valid);
}

function memberSeries(payload:ApiPayload,key:string){
  const members=new Map<number,number[]>();
  const rows=payload.daily??{};
  Object.entries(rows).forEach(([name,value])=>{
    const match=name.match(new RegExp(`^${key}_member(\\d+)$`));
    if(match&&Array.isArray(value))members.set(Number(match[1]),value.map(entry=>entry===null?Number.NaN:Number(entry)));
  });
  const base=Array.isArray(rows[key])?(rows[key] as unknown[]).map(entry=>entry===null?Number.NaN:Number(entry)):[];
  return members.size?[...members.values()].sort((a,b)=>a.length-b.length):base.length?[base]:[];
}

function buildWeeks(payload:ApiPayload):TrendWeek[]{
  const time=Array.isArray(payload.daily?.time)?(payload.daily?.time as unknown[]).map(String):[];
  const weeks:TrendWeek[]=[];
  for(let start=14;start<time.length;start+=7){
    const end=Math.min(start+6,time.length-1);
    const dayCount=end-start+1;
    const values=Object.fromEntries(METRICS.map(metric=>{
      const memberValues=memberSeries(payload,metric.api)
        .map(series=>aggregateMember(series.slice(start,end+1),metric.aggregate))
        .filter(Number.isFinite);
      return [metric.id,summarize(memberValues,Math.max(1,memberValues.length))] as const;
    })) as Record<TrendMetric,TrendWeekValue|null>;
    weeks.push({
      id:`${time[start]}:${time[end]}`,
      label:`Tag ${start+1}–${end+1}`,
      startDate:time[start],
      endDate:time[end],
      values
    });
    if(dayCount<7)break;
  }
  return weeks;
}

function weeklySeries(payload:ApiPayload,key:string){
  const values=payload.weekly?.[key];
  return Array.isArray(values)?values.map(entry=>entry===null?Number.NaN:Number(entry)):[];
}

function normalizedWeeklyValue(value:number,unit:string|undefined){
  if(!Number.isFinite(value))return NaN;
  if(unit==='Pa')return value/100;
  return value;
}

function findClimateWeekIndex(weeklyTimes:string[],week:TrendWeek,fallbackIndex:number){
  const exactStart=weeklyTimes.indexOf(week.startDate);
  if(exactStart>=0)return exactStart;
  const contained=weeklyTimes.findIndex(time=>time>=week.startDate&&time<=week.endDate);
  if(contained>=0)return contained;
  const target=Date.parse(`${week.startDate}T12:00:00Z`);
  const near=weeklyTimes.findIndex(time=>Math.abs(Date.parse(`${time}T12:00:00Z`)-target)<=3*86400000);
  if(near>=0)return near;
  const shifted=fallbackIndex+2;
  if(shifted>=0&&shifted<weeklyTimes.length)return shifted;
  return fallbackIndex>=0&&fallbackIndex<weeklyTimes.length?fallbackIndex:-1;
}

function buildEc46ClimateWeeks(payload:ApiPayload,weeks:TrendWeek[]):TrendWeek[]{
  const weeklyTimes=Array.isArray(payload.weekly?.time)?(payload.weekly?.time as unknown[]).map(String):[];
  const meanSeries=Object.fromEntries(METRICS.map(metric=>[metric.id,weeklySeries(payload,metric.weeklyMean)])) as Record<TrendMetric,number[]>;
  const anomalySeries=Object.fromEntries(METRICS.map(metric=>[metric.id,weeklySeries(payload,metric.weeklyAnomaly)])) as Record<TrendMetric,number[]>;
  return weeks.map((week,index)=>{
    const climateValues=Object.fromEntries(METRICS.map(metric=>{
      const climateIndex=findClimateWeekIndex(weeklyTimes,week,index);
      const meanUnit=payload.weekly_units?.[metric.weeklyMean];
      const anomalyUnit=payload.weekly_units?.[metric.weeklyAnomaly];
      const center=normalizedWeeklyValue(meanSeries[metric.id]?.[climateIndex]??NaN,meanUnit);
      const anomaly=normalizedWeeklyValue(anomalySeries[metric.id]?.[climateIndex]??NaN,anomalyUnit);
      if(!Number.isFinite(center))return [metric.id,null] as const;
      let climate=center;
      if(Number.isFinite(anomaly))climate=center-anomaly;
      if(metric.id==='precipitation')climate*=daySpan(week.startDate,week.endDate);
      return [metric.id,Number.isFinite(climate)?climate:null] as const;
    })) as Record<TrendMetric,number|null>;
    return {
      id:week.id,
      label:week.label,
      startDate:week.startDate,
      endDate:week.endDate,
      values:climateValues as unknown as Record<TrendMetric,TrendWeekValue|null>
    };
  });
}

function modelFromPayload(id:TrendModel['id'],family:string,members:number,horizonDays:number,gridLabel:string,payload:ApiPayload):TrendModel{
  const weeks=buildWeeks(payload);
  const climateWeeks=id==='ecmwf-ec46'?buildEc46ClimateWeeks(payload,weeks):[];
  return {id,family,members,horizonDays,gridLabel,weeks,climateWeeks};
}

async function fetchJson(url:string,signal:AbortSignal,refresh:boolean){
  const response=await guardedOpenMeteoFetch(url,{signal,cache:refresh?'reload':'default'},{priority:'normal'});
  let payload:unknown;
  try{payload=await response.json()}catch{throw new Error(`Trendquelle lieferte kein gültiges JSON (HTTP ${response.status}).`)}
  if(!response.ok){
    const reason=payload&&typeof payload==='object'&&'reason' in payload?String((payload as {reason?:unknown}).reason||''):'';
    throw new Error(reason||`Trendquelle HTTP ${response.status}`);
  }
  return payload as ApiPayload;
}

async function fetchEcmwf(latitude:number,longitude:number,signal:AbortSignal,refresh:boolean){
  const request = async (dailyVars:string[],weeklyVars:string[]) => {
    const params=new URLSearchParams({
      latitude:String(latitude),
      longitude:String(longitude),
      timezone:'GMT',
      forecast_days:'46',
      cell_selection:'nearest',
      wind_speed_unit:'kn',
      daily:dailyVars.join(','),
      weekly:weeklyVars.join(',')
    });
    return fetchJson(`${SEASONAL_ENDPOINT}?${params}`,signal,refresh);
  };
  let payload:ApiPayload;
  try{
    payload=await request(DAILY_VARIABLES,WEEKLY_VARIABLES);
  }catch(error){
    payload=await request(FALLBACK_DAILY_VARIABLES,FALLBACK_WEEKLY_VARIABLES);
  }
  return modelFromPayload('ecmwf-ec46','ECMWF EC46',50,46,'ECMWF O320 · ca. 36 km',payload);
}

async function fetchGefs(latitude:number,longitude:number,signal:AbortSignal,refresh:boolean){
  const request = async (dailyVars:string[]) => {
    const params=new URLSearchParams({
      latitude:String(latitude),
      longitude:String(longitude),
      timezone:'GMT',
      models:'ncep_gefs025',
      forecast_days:'35',
      cell_selection:'nearest',
      wind_speed_unit:'kn',
      daily:dailyVars.join(',')
    });
    return fetchJson(`${ENSEMBLE_ENDPOINT}?${params}`,signal,refresh);
  };
  let payload:ApiPayload;
  try{
    payload=await request(DAILY_VARIABLES);
  }catch(error){
    payload=await request(FALLBACK_DAILY_VARIABLES);
  }
  return modelFromPayload('noaa-gefs','NOAA GEFS',30,35,'GEFS 0,5° · ca. 50 km',payload);
}

async function loadTrend(location:{latitude:number;longitude:number},signal:AbortSignal,refresh:boolean):Promise<TrendBundle>{
  const cacheKey=`${CACHE_PREFIX}:${location.latitude.toFixed(4)}:${location.longitude.toFixed(4)}`;
  const now=Date.now();
  const readCache=()=>{
    try{
      const raw=localStorage.getItem(cacheKey);
      if(!raw)return null;
      const parsed=JSON.parse(raw) as {savedAt:number;data:TrendBundle};
      if(!parsed?.savedAt||!parsed?.data?.models?.length)return null;
      return parsed;
    }catch{return null;}
  };
  const cached=readCache();
  if(cached&&!refresh&&now-cached.savedAt<=60*60*1000){
    return {...cached.data,cacheStatus:'fresh-cache',cacheAgeMinutes:Math.max(1,Math.round((now-cached.savedAt)/60000))};
  }
  try{
    const settled=await Promise.allSettled([
      fetchEcmwf(location.latitude,location.longitude,signal,refresh),
      fetchGefs(location.latitude,location.longitude,signal,refresh)
    ]);
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    const models=settled.flatMap(result=>result.status==='fulfilled'?[result.value]:[]);
    if(!models.length){
      const rejection=settled.find(result=>result.status==='rejected') as PromiseRejectedResult|undefined;
      throw rejection?.reason instanceof Error?rejection.reason:new Error('Keine Subseasonal-Daten verfügbar.');
    }
    const bundle:TrendBundle={models,fetchedAt:new Date().toISOString(),cacheStatus:settled.every(result=>result.status==='fulfilled')?'live':'mixed-stale',cacheAgeMinutes:0};
    try{localStorage.setItem(cacheKey,JSON.stringify({savedAt:now,data:bundle}))}catch{}
    return bundle;
  }catch(error){
    if(cached&&now-cached.savedAt<=CACHE_MAX_AGE_MS){
      return {...cached.data,cacheStatus:'stale-cache',cacheAgeMinutes:Math.max(1,Math.round((now-cached.savedAt)/60000))};
    }
    throw error;
  }
}

function resample(samples:number[],count=51){
  if(!samples.length)return [];
  const sorted=[...samples].sort((a,b)=>a-b);
  if(sorted.length===1)return Array.from({length:count},()=>sorted[0]);
  return Array.from({length:count},(_,index)=>quantile(sorted,index/(count-1))).filter(Number.isFinite);
}

function combineWeeks(models:TrendModel[]):TrendWeek[]{
  const ids=new Map<string,{label:string;startDate:string;endDate:string}>();
  models.forEach(model=>model.weeks.forEach(week=>ids.set(week.id,{label:week.label,startDate:week.startDate,endDate:week.endDate})));
  return [...ids.entries()]
    .sort((a,b)=>a[1].startDate.localeCompare(b[1].startDate))
    .map(([id,meta])=>{
      const values={} as Record<TrendMetric,TrendWeekValue|null>;
      for(const metric of METRICS){
        const contributors=models.flatMap(model=>{
          const value=model.weeks.find(week=>week.id===id)?.values[metric.id];
          return value?.samples.length?[value.samples]:[];
        });
        values[metric.id]=contributors.length?summarize(contributors.flatMap(samples=>resample(samples)),contributors.length):null;
      }
      return {id,...meta,values};
    });
}

function formatDate(value:string){
  if(!value)return '–';
  const [year,month,day]=value.split('-').map(Number);
  if(!year||!month||!day)return value;
  return `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.`;
}

function formatMetric(value:number,metric:TrendMetric,windUnit:WindUnit){
  if(!Number.isFinite(value))return '–';
  if(metric==='wind'||metric==='gust')return formatWindMetric(value,windUnit);
  if(metric==='cloud')return `${formatDecimalFixed(value,0)} %`;
  if(metric==='pressure')return `${formatDecimalFixed(value,1)} hPa`;
  if(metric==='precipitation')return `${formatDecimalFixed(value,1)} mm`;
  return `${formatDecimalFixed(value,1)} °C`;
}

function spreadLabel(value:TrendWeekValue,metric:TrendMetric,windUnit:WindUnit){
  return `${formatMetric(value.p10,metric,windUnit)} – ${formatMetric(value.p90,metric,windUnit)}`;
}

function climateNumber(climateWeeks:TrendWeek[],id:string,metric:TrendMetric){
  const week=climateWeeks.find(entry=>entry.id===id);
  const value=(week?.values as unknown as Record<TrendMetric,number|null>|undefined)?.[metric];
  return Number.isFinite(value)?Number(value):NaN;
}

function trendDescription(weeks:TrendWeek[],climateWeeks:TrendWeek[],metric:TrendMetric,windUnit:WindUnit){
  const values=weeks.map(week=>week.values[metric]?.mean).filter(Number.isFinite) as number[];
  if(!values.length)return 'Derzeit liegen für diesen Zeitraum keine belastbaren Werte vor.';
  const climateDiffs=weeks.map(week=>{
    const meanValue=week.values[metric]?.mean;
    const climateValue=climateNumber(climateWeeks,week.id,metric);
    return typeof meanValue==='number'&&Number.isFinite(meanValue)&&Number.isFinite(climateValue)?meanValue-climateValue:NaN;
  }).filter(Number.isFinite) as number[];
  const delta=mean(climateDiffs);
  if(Number.isFinite(delta)){
    if(metric==='precipitation')return `Im Mittel ${formatDecimalFixed(Math.abs(delta),1)} mm/Woche ${delta>=0?'nasser':'trockener'} als das EC46-Modellklima.`;
    if(metric==='cloud')return `Im Mittel ${formatDecimalFixed(Math.abs(delta),0)} %-Punkte ${delta>=0?'wolkiger':'aufgelockerter'} als das EC46-Modellklima.`;
    if(metric==='wind'||metric==='gust')return `Im Mittel ${formatMetric(Math.abs(delta),metric,windUnit)} ${delta>=0?'stärker':'schwächer'} als das EC46-Modellklima.`;
    return `Im Mittel ${formatMetric(Math.abs(delta),metric,windUnit)} ${delta>=0?'über':'unter'} dem EC46-Modellklima.`;
  }
  const avg=mean(values);
  return `Wochenmittel im Bereich von ${formatMetric(avg,metric,windUnit)}.`;
}

function clamp(value:number,min:number,max:number){
  return Math.min(max,Math.max(min,value));
}

function niceStep(raw:number){
  if(!Number.isFinite(raw)||raw<=0)return 1;
  const power=10**Math.floor(Math.log10(raw));
  const normalized=raw/power;
  const factor=normalized<=1?1:normalized<=2?2:normalized<=2.5?2.5:normalized<=5?5:10;
  return factor*power;
}

function niceTicks(min:number,max:number,count:number){
  if(!Number.isFinite(min)||!Number.isFinite(max))return [0,1];
  if(min===max){
    const padding=Math.abs(min||1)*0.15||1;
    return [min-padding,min,min+padding];
  }
  const step=niceStep((max-min)/Math.max(1,count-1));
  const start=Math.floor(min/step)*step;
  const end=Math.ceil(max/step)*step;
  const ticks:number[]=[];
  for(let value=start;value<=end+step*0.5;value+=step)ticks.push(Number(value.toFixed(6)));
  return ticks;
}

function axisLabel(value:number,metric:TrendMetric,windUnit:WindUnit){
  if(metric==='wind'||metric==='gust')return formatDecimalFixed(convertWind(value,windUnit),windUnit==='ms'?1:0);
  if(metric==='cloud')return formatDecimalFixed(value,0);
  if(metric==='pressure')return formatDecimalFixed(value,0);
  if(metric==='precipitation')return formatDecimalFixed(value,0);
  return formatDecimalFixed(value,0);
}

function valueToDisplay(value:number,metric:TrendMetric,windUnit:WindUnit){
  if(!Number.isFinite(value))return NaN;
  return metric==='wind'||metric==='gust'?convertWind(value,windUnit):value;
}

function pathFromPoints(points:{x:number;y:number}[]){
  return points.length?`M ${points.map(point=>`${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' L ')}`:'';
}

function polygonFromBands(top:{x:number;y:number}[],bottom:{x:number;y:number}[]){
  if(!top.length||!bottom.length||top.length!==bottom.length)return '';
  return `${top.map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')} ${[...bottom].reverse().map(point=>`${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ')}`;
}

function TrendChart({weeks,climateWeeks,metric,windUnit}:{weeks:TrendWeek[];climateWeeks:TrendWeek[];metric:TrendMetric;windUnit:WindUnit}){
  const [activeIndex,setActiveIndex]=useState<number|null>(null);
  useEffect(()=>{setActiveIndex(null)},[metric,weeks.map(week=>week.id).join('|')]);
  const width=640,height=244,margin={top:12,right:16,bottom:40,left:46};
  const usableWidth=width-margin.left-margin.right,usableHeight=height-margin.top-margin.bottom;
  const points=weeks.map((week,index)=>{
    const value=week.values[metric];
    const climate=climateNumber(climateWeeks,week.id,metric);
    return {
      week,
      index,
      x:margin.left+(weeks.length===1?usableWidth/2:(usableWidth*Math.max(0,index))/Math.max(1,weeks.length-1)),
      mean:valueToDisplay(value?.mean??NaN,metric,windUnit),
      p10:valueToDisplay(value?.p10??NaN,metric,windUnit),
      p25:valueToDisplay(value?.p25??NaN,metric,windUnit),
      p75:valueToDisplay(value?.p75??NaN,metric,windUnit),
      p90:valueToDisplay(value?.p90??NaN,metric,windUnit),
      climate:valueToDisplay(climate,metric,windUnit),
      raw:value,
      rawClimate:climate
    };
  });
  let dataValues=points.flatMap(point=>[point.mean,point.p10,point.p25,point.p75,point.p90,point.climate]).filter(Number.isFinite) as number[];
  if(metric==='cloud')dataValues=[...dataValues,0,100];
  if(metric==='precipitation')dataValues=[...dataValues,0];
  let min=Math.min(...dataValues),max=Math.max(...dataValues);
  if(!Number.isFinite(min)||!Number.isFinite(max)){min=0;max=1;}
  if(metric==='cloud'){min=0;max=100;}else if(metric==='precipitation'){min=0;max=Math.max(max,5);}else if(min===max){const pad=Math.abs(min||1)*0.15||1;min-=pad;max+=pad;}else{const pad=(max-min)*0.12;min-=pad;max+=pad;}
  const ticks=niceTicks(min,max,5);
  const scaleY=(value:number)=>margin.top+usableHeight-((value-ticks[0])/(ticks[ticks.length-1]-ticks[0]||1))*usableHeight;
  const outerTop=points.filter(point=>Number.isFinite(point.p90)).map(point=>({x:point.x,y:scaleY(point.p90)}));
  const outerBottom=points.filter(point=>Number.isFinite(point.p10)).map(point=>({x:point.x,y:scaleY(point.p10)}));
  const innerTop=points.filter(point=>Number.isFinite(point.p75)).map(point=>({x:point.x,y:scaleY(point.p75)}));
  const innerBottom=points.filter(point=>Number.isFinite(point.p25)).map(point=>({x:point.x,y:scaleY(point.p25)}));
  const meanPoints=points.filter(point=>Number.isFinite(point.mean)).map(point=>({x:point.x,y:scaleY(point.mean)}));
  const climatePoints=points.filter(point=>Number.isFinite(point.climate)).map(point=>({x:point.x,y:scaleY(point.climate)}));
  const activePoint=activeIndex===null?null:points[activeIndex]??null;
  return <div className="subseasonal-chart" onClick={event=>{if(event.target===event.currentTarget)setActiveIndex(null)}}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Witterungstrend ${metricDefinition(metric).label}`}>
      {ticks.map(tick=>{
        const y=scaleY(tick);
        return <g key={tick}>
          <line x1={margin.left} x2={width-margin.right} y1={y} y2={y} stroke="currentColor" opacity="0.1" />
          <text x={margin.left-8} y={y+4} textAnchor="end" className="axis-label" fill="currentColor" opacity="0.55">{axisLabel(tick,metric,windUnit)}</text>
        </g>;
      })}
      {points.map(point=><line key={`x-${point.week.id}`} x1={point.x} x2={point.x} y1={margin.top} y2={height-margin.bottom} stroke="currentColor" opacity="0.05" />)}
      {outerTop.length===outerBottom.length&&outerTop.length>1?<polygon className="anomaly-plume outer" points={polygonFromBands(outerTop,outerBottom)} />:null}
      {innerTop.length===innerBottom.length&&innerTop.length>1?<polygon className="anomaly-plume inner" points={polygonFromBands(innerTop,innerBottom)} />:null}
      {climatePoints.length>1?<path className="climate-reference-line" d={pathFromPoints(climatePoints)} />:null}
      {meanPoints.length>1?<path className="anomaly-mean-line" fill="none" d={pathFromPoints(meanPoints)} />:null}
      {meanPoints.map((point,index)=><circle key={`dot-${index}`} cx={point.x} cy={point.y} r={4} fill="currentColor" className="trend-point" />)}
      {points.map(point=><g key={`label-${point.week.id}`}>
        <text x={point.x} y={height-18} textAnchor="middle" className="month-label" fill="currentColor" opacity="0.75">{point.week.label}</text>
        <text x={point.x} y={height-8} textAnchor="middle" className="month-label" fill="currentColor" opacity="0.55">{formatDate(point.week.startDate)}</text>
      </g>)}
    </svg>
    {points.map(point=>Number.isFinite(point.mean)?<button
      key={`hit-${point.week.id}`}
      type="button"
      className={`subseasonal-point-hit ${activeIndex===point.index?'active':''}`}
      style={{left:`${(point.x/width)*100}%`,top:`${(scaleY(point.mean)/height)*100}%`}}
      onClick={event=>{event.stopPropagation();setActiveIndex(current=>current===point.index?null:point.index)}}
      aria-label={`${point.week.label}: ${formatMetric(point.raw?.mean??NaN,metric,windUnit)}`}
    />:null)}
    {activePoint&&Number.isFinite(activePoint.mean)?<div
      className="subseasonal-point-tooltip"
      style={{left:`${clamp((activePoint.x/width)*100,14,86)}%`,top:`${clamp((scaleY(activePoint.mean)/height)*100,16,78)}%`}}
      onClick={event=>event.stopPropagation()}
    >
      <strong>{activePoint.week.label}</strong>
      <small>{formatDate(activePoint.week.startDate)} – {formatDate(activePoint.week.endDate)}</small>
      <span>Mittel: {formatMetric(activePoint.raw?.mean??NaN,metric,windUnit)}</span>
      <span>P25–P75: {formatMetric(activePoint.raw?.p25??NaN,metric,windUnit)} – {formatMetric(activePoint.raw?.p75??NaN,metric,windUnit)}</span>
      <span>P10–P90: {formatMetric(activePoint.raw?.p10??NaN,metric,windUnit)} – {formatMetric(activePoint.raw?.p90??NaN,metric,windUnit)}</span>
      {Number.isFinite(activePoint.rawClimate)?<span>EC46-Klimamittel: {formatMetric(activePoint.rawClimate,metric,windUnit)}</span>:null}
    </div>:null}
  </div>;
}

function convertWind(value:number,unit:WindUnit){
  if(!Number.isFinite(value))return NaN;
  if(unit==='kmh')return value*1.852;
  if(unit==='ms')return value*0.514444;
  if(unit==='mph')return value*1.15078;
  return value;
}

function formatWindMetric(value:number,unit:WindUnit){
  const converted=convertWind(value,unit);
  if(!Number.isFinite(converted))return '–';
  const digits=unit==='ms'?1:0;
  return `${formatDecimalFixed(converted,digits)} ${windUnitLabel(unit)}`;
}

export default function SubseasonalTrendPanel({location,windUnit='kn',advancedMode=false}:{location:Location;windUnit?:WindUnit;advancedMode?:boolean}){
  const [data,setData]=useState<TrendBundle|null>(null);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [error,setError]=useState('');
  const [metric,setMetric]=useState<TrendMetric>(()=>{
    try{
      const stored=localStorage.getItem('mid:subseasonal-trend:metric');
      return METRICS.some(item=>item.id===stored)?stored as TrendMetric:'temperature_max';
    }catch{return 'temperature_max';}
  });
  const [view,setView]=useState<ModelView>(()=>{
    try{
      const stored=localStorage.getItem('mid:subseasonal-trend:view');
      return stored==='ecmwf-ec46'||stored==='noaa-gefs'?stored:'combined';
    }catch{return 'combined';}
  });
  const [infoOpen,setInfoOpen]=useState(false);
  const controllerRef=useRef<AbortController|null>(null);

  const load=useCallback(async(refresh=false)=>{
    controllerRef.current?.abort();
    const controller=new AbortController();
    controllerRef.current=controller;
    if(refresh)setRefreshing(true);else setLoading(true);
    setError('');
    try{
      const bundle=await loadTrend(location,controller.signal,refresh);
      if(!controller.signal.aborted){
        setData(bundle);
        setView(current=>current==='combined'||bundle.models.some(model=>model.id===current)?current:'combined');
      }
    }catch(reason){
      if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Witterungstrend konnte nicht geladen werden.');
    }finally{
      if(controllerRef.current===controller)controllerRef.current=null;
      if(!controller.signal.aborted){setLoading(false);setRefreshing(false);}
    }
  },[location.latitude,location.longitude]);

  useEffect(()=>{load();return()=>controllerRef.current?.abort();},[load]);
  useEffect(()=>{try{localStorage.setItem('mid:subseasonal-trend:metric',metric)}catch{}},[metric]);
  useEffect(()=>{try{localStorage.setItem('mid:subseasonal-trend:view',view)}catch{}},[view]);

  const models=data?.models??[];
  const combined=useMemo(()=>combineWeeks(models),[models]);
  const selectedWeeks=view==='combined'?combined:models.find(model=>model.id===view)?.weeks??combined;
  const climateWeeks=models.find(model=>model.id==='ecmwf-ec46')?.climateWeeks??[];
  const selectedLabel=view==='combined'?'Multi-Modell':models.find(model=>model.id===view)?.family??'Multi-Modell';
  const def=metricDefinition(metric);
  const Icon=def.icon;
  const cacheLabel=data?.cacheStatus==='fresh-cache'?`Cache · ${data.cacheAgeMinutes} min`:data?.cacheStatus==='stale-cache'?`Fallback-Cache · ${data.cacheAgeMinutes} min`:data?.cacheStatus==='mixed-stale'?`teilweise Cache · ${data.cacheAgeMinutes} min`:'';

  return <section className={`section-panel long-range-panel subseasonal-trend ${def.colorClass}`}>
    <header className="section-head long-range-head subseasonal-head">
      <div>
        <h3>Witterungstrend · Tag 15–46</h3>
        <p>Wochenblöcke statt scheinpräziser Tageswerte · ECMWF EC46 + NOAA GEFS bis Tag 35</p>
      </div>
      <div className="long-range-head-actions">
        <button type="button" onClick={()=>load(true)} aria-label="Witterungstrend aktualisieren" disabled={refreshing}>{refreshing?<RefreshCw size={18} className="spin"/>:<RefreshCw size={18}/>}</button>
        <button type="button" onClick={()=>setInfoOpen(open=>!open)} aria-expanded={infoOpen} aria-label="Methodik anzeigen"><Info size={18}/></button>
      </div>
    </header>

    {loading?<p className="section-status">Witterungstrend wird geladen…</p>:null}
    {!loading&&error?<p className="section-status error">{error}</p>:null}

    {!loading&&models.length?<>
      <div className="long-range-family-chips subseasonal-families">
        {models.map(model=><span key={model.id}>{model.family}<small>{model.members||'–'} Member · bis Tag {model.horizonDays}</small></span>)}
      </div>

      <div className="long-range-controls subseasonal-controls">
        <div className="long-range-model-selector subseasonal-model-selector">
          <button type="button" className={view==='combined'?'active':''} onClick={()=>setView('combined')}>
            <b>Multi-Modell</b>
            <small>{models.length} unabhängige Familien</small>
          </button>
          {models.map(model=><button key={model.id} type="button" className={view===model.id?'active':''} onClick={()=>setView(model.id)}>
            <b>{model.family}</b>
            <small>{model.members} Member · {model.gridLabel}</small>
          </button>)}
        </div>
        <div className="long-range-model-selector subseasonal-metric-selector">
          {METRICS.map(item=><button key={item.id} type="button" className={`${metric===item.id?'active ':''}${item.colorClass}`} onClick={()=>setMetric(item.id)}>
            <b>{item.buttonLabel}</b>
            <small>{item.id==='wind'||item.id==='gust'?windUnitLabel(windUnit):item.unit}</small>
          </button>)}
        </div>
      </div>

      {infoOpen?<div className="long-range-method">
        <b>Methodik & Hinweise</b>
        <p>ECMWF EC46 liefert 50 Ensemblemitglieder bis Tag 46, NOAA GEFS 30 Ensemblemitglieder bis Tag 35. MID verdichtet beide Quellen auf Wochenblöcke ab Tag 15 und gewichtet Modellfamilien im Multi-Modell unabhängig von der Memberzahl 1:1.</p>
        <p>Das EC46-Klimamittel wird je Wochenblock aus den zugehörigen Wochenfeldern der Seasonal-API abgeleitet und anhand der Zeitachse statt über starre Indexe zugeordnet, damit auch Teilwochen am Periodenende konsistent bleiben.</p>
        <p>Tmax/Tmin nutzen das übliche Farbkonzept warm/kühl. Für Wind werden – soweit von der Quelle geliefert – zusätzlich Windböen als eigene Kennzahl geführt. Per Klick oder Tipp auf einen Kurvenpunkt erscheint ein kompaktes Tooltip wie im 24d-Ensemble.</p>
        <p>Ab Tag 36 steht derzeit nur EC46 zur Verfügung; der Multi-Modell-Pfad reduziert sich dann automatisch auf die verbleibende Modellfamilie.</p>
        {cacheLabel?<p><b>Datenstatus:</b> {cacheLabel}</p>:null}
      </div>:null}

      <div className="long-range-grid" style={{gridTemplateColumns:'1fr'}}>
        <article className={`subseasonal-main-chart ${def.colorClass}`}>
          <header>
            <Icon size={18}/>
            <div>
              <strong>{def.label} · {selectedLabel}</strong>
              <small>{trendDescription(selectedWeeks,climateWeeks,metric,windUnit)}</small>
            </div>
          </header>
          <div className="subseasonal-chart-legend">
            <span className="ensemble"><i/>Ensemble-Mittel</span>
            <span className="climate"><i/>EC46-Klimamittel</span>
            <span className="spread"><i/>P25–P75 / P10–P90</span>
          </div>
          <TrendChart weeks={selectedWeeks} climateWeeks={climateWeeks} metric={metric} windUnit={windUnit}/>
          <footer>
            <span>Außen P10–P90 · innen P25–P75</span>
            <span>{view==='combined'?'Modellfamilien gleich gewichtet':'Ensemblemitglieder des gewählten Modells'}</span>
          </footer>
        </article>
      </div>

      <section className="long-range-models subseasonal-comparison">
        <header>
          <div>
            <span>ENSEMBLE-VERGLEICH</span>
            <h4>{def.label} je Wochenblock</h4>
          </div>
        </header>
        <div className="long-range-model-strip">
          {combined.map(week=>{
            const climate=climateNumber(climateWeeks,week.id,metric);
            return <article key={week.id}>
              <strong>{week.label}</strong>
              <small>{formatDate(week.startDate)} – {formatDate(week.endDate)}</small>
              {models.map(model=>{
                const value=model.weeks.find(row=>row.id===week.id)?.values[metric];
                return value?<span key={model.id}>{model.family}: {formatMetric(value.mean,metric,windUnit)}<small> · P10–P90 {spreadLabel(value,metric,windUnit)}</small></span>:null;
              })}
              {week.values[metric]?<em>Multi: {formatMetric(week.values[metric]!.mean,metric,windUnit)} · {week.values[metric]!.modelCount} Modellfamilie{week.values[metric]!.modelCount===1?'':'n'}</em>:null}
              {Number.isFinite(climate)?<small className="climate-value">EC46-Klimamittel: {formatMetric(climate,metric,windUnit)}</small>:null}
            </article>;
          })}
        </div>
        {advancedMode?<div className="long-range-method"><b>Quellen und Reichweite</b><p>ECMWF EC46: 36-km-Subseasonal-Ensemble bis 46 Tage. NOAA GEFS 0,5°: Ensemble bis 35 Tage. MID verdichtet beide auf identische Wochenblöcke und hält die Inter-Modell-Gewichtung unabhängig von der Memberzahl bei 1:1. Klimareferenz: EC46-Modellklima aus offiziellen Wochenmittel-/Anomaliefeldern.</p></div>:null}
      </section>
    </>:null}
  </section>;
}
