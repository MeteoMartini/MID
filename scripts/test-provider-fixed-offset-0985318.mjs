import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-provider-time-'));
try{
 await build({stdin:{contents:readFileSync('src/weather.ts','utf8')+'\nexport {reconcileForecastDaysWithHours,parseModelMembers,pseudoModelFromMeanSpread,eventMemberPrecipitationTotals,parseForecastCoreCache,readEnsembleCache,readEventEnsembleCache,forecastQuery};',resolveDir:resolve('src'),loader:'ts'},outfile:join(dir,'weather.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {mapHours,mapMinutely15,mapDays,providerIsoEpoch,localIsoEpoch,reconcileForecastDaysWithHours,parseModelMembers,pseudoModelFromMeanSpread,eventMemberPrecipitationTotals,parseForecastCoreCache,readEnsembleCache,readEventEnsembleCache,forecastQuery}=await import(pathToFileURL(join(dir,'weather.mjs')));
 const fixture=(start,timezone,offset,count=97)=>{
  const stamps=(step,n)=>Array.from({length:n},(_,i)=>new Date(Date.parse(start+'Z')+i*step).toISOString().slice(0,16));
  const times=stamps(3600000,count),fields=['temperature_2m','relative_humidity_2m','dew_point_2m','apparent_temperature','precipitation_probability','precipitation','rain','showers','snowfall','weather_code','cloud_cover','cloud_cover_low','cloud_cover_mid','cloud_cover_high','pressure_msl','wind_speed_10m','wind_direction_10m','wind_gusts_10m','uv_index','visibility','cape','sunshine_duration','is_day'];
  const hourly=Object.fromEntries(fields.map(k=>[k,times.map(()=>({temperature_2m:10,relative_humidity_2m:90,dew_point_2m:8,apparent_temperature:9,precipitation_probability:80,precipitation:1,rain:1,weather_code:61,cloud_cover:100,pressure_msl:1010,wind_speed_10m:10,wind_gusts_10m:20,visibility:20000}[k]??0))]));
  hourly.time=times;hourly.temperature_2m=times.map((_,i)=>10+i/100);
  const dates=[...new Set(times.map(t=>t.slice(0,10)))],daily=Object.fromEntries(['temperature_2m_max','temperature_2m_min','precipitation_sum','rain_sum','showers_sum','snowfall_sum','precipitation_hours','precipitation_probability_max','wind_speed_10m_max','wind_gusts_10m_max','wind_direction_10m_dominant','uv_index_max','weather_code','sunshine_duration'].map(k=>[k,dates.map(()=>({temperature_2m_max:20,temperature_2m_min:0,precipitation_sum:24,rain_sum:24,wind_speed_10m_max:10,wind_gusts_10m_max:20,weather_code:61,precipitation_probability_max:80}[k]??0))]));
  daily.time=dates;daily.sunrise=dates.map(d=>d+'T07:00');daily.sunset=dates.map(d=>d+'T18:00');
  const quarter=stamps(900000,(count-1)*4+1),minutely_15={time:quarter,precipitation:quarter.map(()=>.25),rain:quarter.map(()=>.25),showers:quarter.map(()=>0),snowfall:quarter.map(()=>0),weather_code:quarter.map(()=>61),precipitation_probability:quarter.map(()=>80),sunshine_duration:quarter.map(()=>0)};
  return {latitude:50.82,longitude:7.04,elevation:50,timezone,utc_offset_seconds:offset,current:{time:times[27]},hourly,daily,minutely_15};
 };
 for(const [start,zone,offset,target,count]of [['2026-10-24T00:00','Europe/Berlin',7200,'2026-10-25',25],['2026-03-28T00:00','Europe/Berlin',3600,'2026-03-29',23],['2026-10-24T00:00','UTC',0,'2026-10-25',24],['2026-10-24T00:00','Asia/Kathmandu',20700,'2026-10-25',24],['2026-10-24T00:00','America/St_Johns',-9000,'2026-10-25',24]]){
  const w=fixture(start,zone,offset),before=JSON.stringify(w),hours=mapHours(w),minutes=mapMinutely15(w);
  assert.equal(hours.length,w.hourly.time.length);
  for(let i=0;i<hours.length;i++){assert.equal(hours[i].epoch,Date.parse(w.hourly.time[i]+'Z')-offset*1000);assert.equal(hours[i].sourceTime,w.hourly.time[i]);if(i)assert.equal(hours[i].epoch-hours[i-1].epoch,3600000);}
  for(let i=0;i<minutes.length;i++){assert.equal(minutes[i].epoch,Date.parse(w.minutely_15.time[i]+'Z')-offset*1000);if(i)assert.equal(minutes[i].epoch-minutes[i-1].epoch,900000);}
  assert.equal(new Set(hours.map(h=>h.time)).size,hours.length,'Repeated autumn hour retains unique display key');
  const localHours=hours.filter(h=>h.time.startsWith(target));assert.equal(localHours.length,count);
  const day=mapDays(w).find(d=>d.date===target);assert.ok(day,'Complete civil day must survive the provider-boundary change');
  assert.equal(day.precipitation,count,'Accumulate exactly the real 23/24/25h day');
  if(count!==24){assert.equal(day.providerDayWindow.aligned,false);assert.equal(day.providerDayWindow.calendarRebuilt,true);assert.equal(day.max,Math.max(...localHours.map(h=>h.temperature)));assert.equal(day.min,Math.min(...localHours.map(h=>h.temperature)));const updated=reconcileForecastDaysWithHours([day],hours.map(h=>({...h,wind:40,gust:50,direction:90,uvIndex:3})))[0];assert.equal(updated.wind,40);assert.equal(updated.gust,50);assert.equal(updated.direction,90);assert.equal(updated.uvMax,3);}
  const ensemble=parseModelMembers(w,{id:'fixture'});assert.ok(ensemble);const member=ensemble.members.get('_control').find(d=>d.date===target);assert.equal(member.precipitation,count);assert.equal(member.complete.precipitation,true);
  if(count!==24)assert.deepEqual(eventMemberPrecipitationTotals(w,target,'00:00','23:00'),[count-1],'User-local event window uses provider absolute endpoints');
  assert.equal(JSON.stringify(w),before,'Raw endpoints, accumulations and weather data stay immutable');
 }
 // Request-time offset after the autumn switch used to omit today's first hour.
 const query=forecastQuery(50.82,7.04,{timeZone:'Europe/Berlin'});
 assert.equal(query.get('past_hours'),'25');assert.equal(query.get('forecast_hours'),'336');
 assert.equal(query.get('forecast_days'),'14');assert.equal(query.has('past_days'),false,'Daily list still begins today');
 const worker=readFileSync('worker-src/00-core-observations.js','utf8');
 assert.match(worker,/forecast_days:'14',past_hours:'25',forecast_hours:'336'/,'Worker and direct request preserve the same full-day coverage');
 const clipped=fixture('2026-10-25T00:00','Europe/Berlin',3600);
 assert.ok(!mapDays(clipped).some(day=>day.date==='2026-10-25'),'Reproduce missing today when request begins at fixed-offset midnight');
 const complete=fixture('2026-10-24T06:00','Europe/Berlin',3600,121);
 complete.minutely_15=undefined;
 complete.hourly.weather_code=complete.hourly.time.map(()=>80);complete.hourly.cloud_cover=complete.hourly.time.map(()=>20);
 complete.hourly.is_day=complete.hourly.time.map(t=>Number(t.slice(11,13))>=7&&Number(t.slice(11,13))<18?1:0);
 complete.hourly.sunshine_duration=complete.hourly.time.map(t=>Number(t.slice(11,13))>=9&&Number(t.slice(11,13))<16?1800:0);
 const todayHours=mapHours(complete).filter(h=>h.time.startsWith('2026-10-25'));
 assert.equal(todayHours.length,25);
 const originalNow=Date.now;let morning;
 try{
  for(const clock of ['07:00','15:00','22:00']){
   Date.now=()=>Date.parse('2026-10-25T'+clock+'Z');
   const day=mapDays(complete).find(day=>day.date==='2026-10-25');assert.ok(day);
   assert.equal(day.precipitation,25,'Past rainfall is retained through the evening');
   assert.equal(day.sunshineDuration,7*1800,'Morning sunshine is retained after sunset');
   assert.equal(day.min,Math.min(...todayHours.map(h=>h.temperature)));
   assert.equal(day.max,Math.max(...todayHours.map(h=>h.temperature)));
   const metrics=({precipitation,sunshineDuration,min,max})=>({precipitation,sunshineDuration,min,max});
   if(morning)assert.deepEqual(metrics(day),morning,'Full-day values do not shrink with elapsed time');else morning=metrics(day);
  }
 }finally{Date.now=originalNow}
 const omitted=structuredClone(complete);for(const values of Object.values(omitted.hourly))values.splice(25,1);
 assert.ok(!mapDays(omitted).some(day=>day.date==='2026-10-25'),'Real missing hours remain missing, never zero-filled');
 const spread=fixture('2026-10-23T00:00','Europe/Berlin',7200,193);spread.hourly.temperature_2m_spread=spread.hourly.time.map(()=>1);spread.hourly.precipitation_spread=spread.hourly.time.map(()=>0);
 const synthetic=pseudoModelFromMeanSpread(spread,{id:'spread',label:'spread',maxDays:14});assert.ok(synthetic);
 for(const rows of synthetic.members.values())assert.equal(rows.find(d=>d.date==='2026-10-25').precipitation,25,'Mean/spread fallback respects the same 25h accumulation boundary');
 const validRaw=fixture('2026-10-24T00:00','Europe/Berlin',7200);
 assert.ok(parseForecastCoreCache(JSON.stringify({time:Date.now(),value:validRaw})),'Known raw fixed-offset cache can be safely remapped');
 assert.equal(parseForecastCoreCache(JSON.stringify({time:Date.now(),value:{...validRaw,utc_offset_seconds:undefined}})),null,'Ambiguous legacy raw cache must not guess an offset');
 const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),lookups=[];
 try{Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>{lookups.push(key);return key.includes('mid:ensemble:v18:')||key.includes('mid:event-ensemble:v4:')?'{}':null}}});assert.equal(readEnsembleCache(50.8,7),null);assert.equal(readEventEnsembleCache(50.8,7,'2026-10-25','00:00','23:00'),null);assert.ok(lookups.some(k=>k.startsWith('mid:ensemble:v19:')));assert.ok(lookups.some(k=>k.startsWith('mid:event-ensemble:v5:')));}finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}
 const missing=fixture('2026-10-24T00:00','Europe/Berlin',7200);for(const values of Object.values(missing.hourly))values.splice(30,1);
 const shifted=fixture('2026-10-03T00:00','Australia/Lord_Howe',37800,145),shiftedDate='2026-10-05';
 assert.match(mapHours(shifted).find(h=>h.time.startsWith(shiftedDate)).time,/T00:30/,'Fixture actually has a phase-shifted local hourly grid');
 const shiftedMember=parseModelMembers(shifted,{id:'shifted'}).members.get('_control').find(d=>d.date===shiftedDate);
 assert.deepEqual(shiftedMember.complete,{temperature:false,precipitation:false,wind:false,sunshine:false},'24 samples at :30 cannot prove a midnight-aligned civil day');
 assert.ok(!mapDays(shifted).some(d=>d.date===shiftedDate),'No fabricated partial-hour split of source accumulations');
 assert.ok(!mapDays(missing).some(d=>d.date==='2026-10-25'),'Incomplete mismatched civil day cannot reuse a fixed 24h total');
 assert.equal(providerIsoEpoch('2026-10-25T03:00','Europe/Berlin',7200),Date.parse('2026-10-25T01:00Z'));
 assert.equal(localIsoEpoch('2026-10-25T03:00','Europe/Berlin',7200),Date.parse('2026-10-25T02:00Z'),'User-local event remains IANA-aware');
 assert.equal(providerIsoEpoch('2026-10-25T02:00+01:00','Europe/Berlin',7200),Date.parse('2026-10-25T01:00Z'),'Explicit offsets take precedence');
 console.log('PASS actual provider hourly/minutely/calendar/ensemble mappings: fixed UTC provenance, DST 23/25h, unique repeated-hour keys, half/quarter-hour offsets, missing coverage and immutable raw values');
}finally{rmSync(dir,{recursive:true,force:true})}
