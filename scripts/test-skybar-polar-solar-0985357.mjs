import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
const require=createRequire(import.meta.url),{Body,Observer,SearchRiseSet,Equator,Horizon}=require('astronomy-engine');
const {outputFiles}=await build({stdin:{contents:"export{astronomicalIsDayAt,solarDaylightWindowAt,solarTimelineWindow,solarIsDayFromEvents}from'./src/astronomy';export{detailSkyBarTimedSegments,detailSkyBarHourCells}from'./src/detailSkyBar';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {astronomicalIsDayAt:isDay,solarDaylightWindowAt:windowAt,solarTimelineWindow:timeline,solarIsDayFromEvents:fromEvents,detailSkyBarTimedSegments:paint,detailSkyBarHourCells:cells}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const HOUR=3600000,DAY=24*HOUR,tromso={latitude:69.65,longitude:18.96,timezone:'Europe/Oslo'},south={latitude:-77.84,longitude:166.67,timezone:'Antarctica/McMurdo'};
const inside=(bands,t)=>bands.some(b=>b.startEpoch<=t&&t<b.endEpoch);
const sample=(epoch,day,cloud=20)=>({epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+HOUR,isDay:day,cloud,sunshineDuration:null,precipitation:0,rain:0,showers:0,snowfall:0,code:0});
let checks=0;
for(const [location,date,expected] of [[tromso,'2026-06-21',true],[tromso,'2026-12-21',false],[south,'2026-06-21',false],[south,'2026-12-21',true],[{latitude:90,longitude:0,timezone:'UTC'},'2026-06-21',true],[{latitude:-90,longitude:0,timezone:'UTC'},'2026-06-21',false]]){
 const start=Date.parse(date+'T12:00:00Z'),win=windowAt(start,location);
 assert.equal(win.sunrise,undefined,'No fictitious polar sunrise');assert.equal(win.sunset,undefined,'No fictitious polar sunset');assert.equal(win.isDayWithoutEvents,expected);
 for(const fallback of [false,true]){
  assert.equal(isDay(start,location,fallback),expected,'Resolved polar astronomy overrides either provider fallback');
  for(const days of [1,7,14]){
   const end=start+days*DAY,sky=timeline(start,end,location,fallback);
   assert.equal(sky.events.length,0,'No invented polar events');
   for(let epoch=start;epoch<end;epoch+=6*HOUR){assert.equal(inside(sky.nightBands,epoch),!expected);checks++}
   const rows=Array.from({length:days*24},(_,i)=>sample(start+i*HOUR,isDay(start+i*HOUR,location,!expected))),copy=JSON.stringify(rows);
   const segments=paint(rows,start,end,0,0,100,8,sky.nightBands).filter(s=>s.layer==='base');
   assert.equal(segments.length>0,expected,'Known clear sky only paints yellow in actual polar daylight');
   assert.equal(cells(rows)[0].state,expected?'weather':'clear-night');
   assert.equal(JSON.stringify(rows),copy,'Source slots/amounts may not be mutated');
   const wet=rows.map(s=>({...s,precipitation:1,rain:1,code:61}));
   assert.deepEqual(paint(wet,start,end,0,0,100,8,sky.nightBands).filter(s=>s.layer==='precip'),paint(wet,start,end,0,0,100,8).filter(s=>s.layer==='precip'),'Solar state may not modify rain accumulation, intensity or geometry');
   assert.equal(paint(rows.map(s=>({...s,cloud:null})),start,end,0,0,100,8,sky.nightBands).length,0,'Missing cloud remains missing');
  }
 }
}
// Actual transition dates: one event and midnight-crossing daylight.
for(const date of ['2026-05-16','2026-05-17','2026-07-26']){
 const start=Date.parse(date+'T00:00:00+02:00'),end=start+DAY,win=windowAt(start+12*HOUR,tromso),events=[['sunrise',win.sunrise],['sunset',win.sunset]].filter(([,t])=>t).sort((a,b)=>a[1]-b[1]);
 assert.ok(events.length>0);if(date.endsWith('16'))assert.equal(events.length,1);else assert.ok(win.sunset<win.sunrise,'This local day begins in daylight');
 const sky=timeline(start,end,tromso,!isDay(start,tromso));
 for(const [kind,event] of events)for(const delta of [-1,0,1]){
  const epoch=event.getTime()+delta,expected=kind==='sunrise'?delta>=0:delta<0;
  for(const fallback of [false,true])assert.equal(isDay(epoch,tromso,fallback),expected,`${date} ${kind} ${delta}ms`);
  assert.equal(inside(sky.nightBands,epoch),!expected,'Exact timeline and symbol boundary parity');
 }
 // Independent upstream event search from a point well away from a crossing.
 const observer=new Observer(tromso.latitude,tromso.longitude,0);
 for(let epoch=start+HOUR/2;epoch<end;epoch+=HOUR){
  const rise=SearchRiseSet(Body.Sun,observer,1,new Date(epoch),370,0).date.getTime(),set=SearchRiseSet(Body.Sun,observer,-1,new Date(epoch),370,0).date.getTime();
  assert.equal(isDay(epoch,tromso),set<rise,'Local event ordering agrees with direct next-event search');
  const equ=Equator(Body.Sun,new Date(epoch),observer,true,true),alt=Horizon(new Date(epoch),observer,equ.ra,equ.dec).altitude;
  if(Math.abs(alt)>2)assert.equal(isDay(epoch,tromso),alt>0,'Independent altitude sanity far from the refracted horizon');
  checks++;
 }
}
// Normal/DST boundaries are unchanged, and invalid time/location remains fallback.
for(const date of ['2026-03-29','2026-10-25']){
 const loc={latitude:52.52,longitude:13.405,timezone:'Europe/Berlin'},win=windowAt(Date.parse(date+'T12:00Z'),loc);
 for(const [time,expected] of [[win.sunrise.getTime()-1,false],[win.sunrise.getTime(),true],[win.sunset.getTime()-1,true],[win.sunset.getTime(),false]])assert.equal(isDay(time,loc,!expected),expected);
}
for(const fallback of [true,false]){assert.equal(isDay(NaN,tromso,fallback),fallback);assert.equal(isDay(Date.now(),{latitude:NaN,longitude:0},fallback),fallback);assert.equal(fromEvents(NaN,1,2,fallback),fallback);assert.equal(fromEvents(4,3,3,fallback),fallback)}
const short=readFileSync('src/ShortTermForecast.tsx','utf8');assert.match(short,/solarIsDayFromEvents\(epoch,sunriseEpoch,sunsetEpoch,fallback\)/,'15/60-minute interpolation shares event-order semantics');
console.log(`MID .357 polar solar: ${checks} sampled timeline states; both poles/hemispheres, 1/7/14d, adversarial provider fallback, single/reversed events, exact milliseconds, rain/Missing/source immutability and DST passed.`);

// Real provider -> canonical Hour/Minute15 mapping, with deliberately wrong is_day.
const mapped=await build({entryPoints:['src/weather.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {mapHours,mapMinutely15}=await import('data:text/javascript;base64,'+Buffer.from(mapped.outputFiles[0].text).toString('base64'));
for(const [date,expected] of [['2026-06-21',true],['2026-12-21',false]]){
 const stamp=date+'T12:00',hourly={time:[stamp]},minutely_15={time:[stamp]};
 const values={temperature_2m:10,relative_humidity_2m:60,dew_point_2m:3,apparent_temperature:9,precipitation_probability:0,precipitation:0,rain:0,showers:0,snowfall:0,weather_code:1,cloud_cover:20,cloud_cover_low:10,cloud_cover_mid:0,cloud_cover_high:0,pressure_msl:1010,wind_speed_10m:3,wind_gusts_10m:6,wind_direction_10m:180,uv_index:0,visibility:30000,cape:0,sunshine_duration:0,is_day:expected?0:1};
 for(const [key,value] of Object.entries(values)){hourly[key]=[value];minutely_15[key]=[value]}
 const w={latitude:tromso.latitude,longitude:tromso.longitude,elevation:0,timezone:tromso.timezone,utc_offset_seconds:0,hourly,minutely_15,daily:{time:[date]},current:{}},before=JSON.stringify(w);
 assert.equal(mapHours(w)[0].isDay,expected,'Actual hourly mapper must override a wrong polar provider flag');
 assert.equal(mapMinutely15(w)[0].isDay,expected,'Actual 15-minute mapper must override a wrong polar provider flag');
 assert.equal(JSON.stringify(w),before,'Provider objects remain immutable');
}
console.log('MID .357 actual mapHours/mapMinutely15: polar provider override and raw-source immutability passed.');
