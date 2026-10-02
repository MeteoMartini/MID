import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const temp=mkdtempSync(join(tmpdir(),'mid144-'));
try{
 await build({stdin:{contents:readFileSync('src/weather.ts','utf8')+'\nexport {parseModelMembers,aggregateHourlyTemperature};',resolveDir:join(process.cwd(),'src'),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'data.mjs'),loader:{'.css':'empty'},logLevel:'silent'});
 const {parseModelMembers,aggregateHourlyTemperature}=await import(pathToFileURL(join(temp,'data.mjs')));
 const dates=Array.from({length:168},(_,i)=>new Date(Date.UTC(2026,9,2)+i*3600000).toISOString().slice(0,16)),weather={timezone:'GMT',utc_offset_seconds:0,hourly:{time:dates},daily:{}};
 for(let member=0;member<6;member++)weather.hourly['temperature_2m_member'+member]=dates.map((_,i)=>10+member+(i%24<12?0:8));
 const model={id:'a',label:'A',family:'a',independenceGroup:'a',maxDays:14,resolutionKm:25,updateHours:6,nativeTemporalHours:1,distributionMode:'native-members',baseWeight:1};
 const first=parseModelMembers(weather,model),second=parseModelMembers(weather,{...model,id:'b',family:'b',independenceGroup:'b'});assert.ok(first&&second);
 for(let day=0;day<7;day++){const date=dates[day*24].slice(0,10),rows=aggregateHourlyTemperature([first,second],date,day,new Map());assert.equal(rows.length,24);for(const row of rows){assert.equal(row.memberCount,12);assert.equal(row.modelFamilyCount,2);assert.ok(row.p25<=row.p50&&row.p50<=row.p75);assert.ok(row.epoch===Date.parse(row.time+'Z'))}}
 assert.deepEqual(aggregateHourlyTemperature([first,{...second,model:{...second.model,independenceGroup:'a'}}],'2026-10-08',6,new Map()),[]);
 assert.deepEqual(aggregateHourlyTemperature([first,{...second,model:{...second.model,distributionMode:'mean-spread'}}],'2026-10-08',6,new Map()),[]);
 assert.deepEqual(aggregateHourlyTemperature([first,{...second,model:{...second.model,nativeTemporalHours:6}}],'2026-10-08',6,new Map()),[]);
 const missing={...second,temperatureHours:second.temperatureHours.filter(row=>row.time!=='2026-10-08T12:00')};assert.ok(!aggregateHourlyTemperature([first,missing],'2026-10-08',6,new Map()).some(row=>row.time==='2026-10-08T12:00'));
 await build({stdin:{contents:"export {buildSevenDayForecastSummary} from './src/SevenDayForecastSummary';export {weatherMapAvailableTimes} from './src/WeatherMapsData';",resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',outfile:join(temp,'trend.mjs'),logLevel:'silent'});
 const {buildSevenDayForecastSummary,weatherMapAvailableTimes}=await import(pathToFileURL(join(temp,'trend.mjs')));
 assert.deepEqual(weatherMapAvailableTimes({id:'icon-rain-24h'},{referenceTimes:['2026-10-02T06:00:00Z'],times:['2026-10-02T12:00:00Z','2026-10-03T06:00:00Z']}),['2026-10-03T06:00:00Z']);
 const days=Array.from({length:7},(_,i)=>({date:dates[i*24].slice(0,10),min:10,max:20,code:i>=5?61:1,precipitation:i>=5?5:0,probability:i>=5?90:0,sunshineDuration:8*3600,sunrise:dates[i*24].slice(0,10)+'T07:00',sunset:dates[i*24].slice(0,10)+'T19:00'}));
 const hours=dates.map((time,i)=>{const wet=i>=5*24+12&&i<6*24+7;return{time,epoch:Date.parse(time+'Z'),temperature:15,isDay:i%24>=7&&i%24<19,code:wet?61:1,precipitation:wet?.6:0,rain:wet?.6:0,showers:0,snowfall:0,probability:wet?90:0,cloud:wet?90:15,gust:5,wind:3}});
 const text=buildSevenDayForecastSummary(days,hours);assert.match(text,/Mittwoch/);assert.match(text,/Nacht zum Donnerstag/);assert.equal((text.match(/Am Mittwoch/g)||[]).length,1);console.log('MID144: seven complete days, actual member quantiles, independent families, missing-hour gaps, daytime rain onset retained:',text);
 const rangeUi=readFileSync('src/ForecastRangeGuide.tsx','utf8'),rangeCss=readFileSync('src/radarForecastReadability.css','utf8'),cockpit=readFileSync('src/ForecastCockpit.tsx','utf8'),forecastRowsCss=readFileSync('src/midC18ForecastRows.css','utf8'),fourteenCss=readFileSync('src/midC18FourteenReplitFluidGrid.css','utf8');
 assert.match(rangeUi,/data-range-layout=\{compact\?'seven-day-compact':'fourteen-day-detail'\}/);assert.match(rangeUi,/temperatureRanges=\['minimum','temperature'\]/);assert.match(rangeUi,/data-temperature-pair="shared-scale"/);assert.match(rangeUi,/q25===q75\?q25:/);assert.match(rangeUi,/P25–P75 .*Median/);assert.match(rangeUi,/compactPrecipitationAmount\(v\)/);assert.doesNotMatch(rangeUi,/<small>P(?:25|75)<\/small>/);
 assert.match(rangeCss,/data-range-layout="seven-day-compact"/);assert.match(rangeCss,/data-range-layout="fourteen-day-detail"/);assert.match(rangeCss,/grid-template-areas:"label bounds" "track track"!important/);assert.match(rangeCss,/forecast-range-bounds\{[^}]*white-space:nowrap[^}]*overflow:visible/s);
 assert.match(cockpit,/className="cockpit-day-temps cockpit-day-temperature-pair"[^>]*role="group"[^>]*aria-label="Tmin und Tmax"/);assert.match(cockpit,/<small>Tmin<\/small><span>\{Math\.round\(day\.min\)\}°<\/span>/);assert.match(cockpit,/<small>Tmax<\/small><span>\{Math\.round\(day\.max\)\}°<\/span>/);assert.match(forecastRowsCss,/\.cockpit-day-temperature-pair\{[\s\S]*?border-radius:999px!important;[\s\S]*?background:/);
 assert.match(forecastRowsCss,/@media\(max-width:720px\)\{[\s\S]*?grid-template-areas:[\s\S]*?"rain rain wind wind"[\s\S]*?"pop pop pop cue"!important/);
 assert.match(fourteenCss,/\.cockpit-fourteen-compact-meta>\.precipitation\{[\s\S]*?overflow:visible!important/);assert.match(fourteenCss,/\.cockpit-fourteen-precip-values>b\{[\s\S]*?overflow:visible!important;[\s\S]*?white-space:nowrap!important;[\s\S]*?text-overflow:clip!important/);assert.match(fourteenCss,/\.cockpit-fourteen-compact-meta>\.wind\{[\s\S]*?flex-wrap:wrap!important/);assert.doesNotMatch(fourteenCss,/\.cockpit-fourteen-precip-values>b\{[^}]*text-overflow:ellipsis/s);
 console.log('MID-C12: regression guards for 7d/14d range layouts, shared Tmin/Tmax grouping, visible quantile pairs, and unprefixed boundary values.');
}finally{rmSync(temp,{recursive:true,force:true})}
