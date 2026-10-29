import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
async function module(contents){const b=await build({stdin:{contents,loader:'ts',resolveDir:process.cwd()+'/src'},bundle:true,write:false,platform:'node',format:'esm'});return import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'))}
const weather=await module("export {hazards} from './weather';"),warnings=await module("export {summarizeDwdWarnings,summarizeDwdWarningsForDay} from './dwdWarnings';");
const originalNow=Date.now,start=Date.parse('2026-10-29T19:00Z'),hour=3600000;Date.now=()=>start;
try{
 const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8'),from=cockpit.indexOf('const SHORT_TERM_HAZARD_LEVELS:'),to=cockpit.indexOf('function shortTermImpactWindowLabel(',from);
 const profile=await module("import {hazards} from './weather';const DWD_WARNING_COLORS={1:'yellow',2:'orange',3:'red',4:'purple'};"+cockpit.slice(from,to)+';export {shortTermImpactForInterval};');
 for(const [at,amount]of [[60,3],[4,3],[60,35],[-1,0]]){
  const rows=Array.from({length:168},(_,i)=>({epoch:start+i*hour,time:new Date(start+i*hour).toISOString(),temperature:4,apparent:4,dewPoint:0,humidity:60,wind:1,gust:1,direction:0,cloud:0,precipitation:0,rain:0,showers:0,snowfall:i===at?amount:0,visibility:20000,code:0}));
  const ensemble={hours:rows.map(x=>({epoch:x.epoch,time:x.time,precipitationP75:0,precipitationP90:0,precipitationNeighborhoodP75:0,precipitationNeighborhoodP90:0,temperatureP25:4,temperatureP10:4,temperatureP75:4,gustP75:1,gustP90:1}))};
  for(const eps of [undefined,ensemble]){
   const signals=weather.hazards(rows,undefined,1400,'kn',eps).filter(s=>s.kind==='snow');
   if(at<0){assert.equal(signals.length,0);continue}assert.ok(signals.length);
   for(const s of signals){assert.equal(Date.parse(s.validFrom),start+at*hour);assert.equal(Date.parse(s.validTo),start+(at+1)*hour)}
   const impacts=Array.from({length:24},(_,i)=>profile.shortTermImpactForInterval(signals,start+i*hour,start+(i+1)*hour,rows[i]));
   assert.equal(impacts.some(x=>x.level>0),at<24,'24h profile must only contain events overlapping its actual horizon');
   assert.ok(profile.shortTermImpactForInterval(signals,start+at*hour,start+(at+1)*hour,rows[at]).level>0,'actual snowfall remains visible');
  }
  if(at===60)assert.equal(warnings.summarizeDwdWarningsForDay(rows,'2026-10-29',1400).filter(s=>s.kind==='snow').length,0);
  if(at>=0)assert.ok(warnings.summarizeDwdWarnings(rows,1400).some(s=>s.kind==='snow'&&s.value===amount));
 }
 const intervalRows=Array.from({length:168},(_,i)=>({epoch:start+i*hour,time:new Date(start+i*hour).toISOString(),temperature:4,gust:1,precipitation:0,rain:0,showers:0,snowfall:i===60?3:0,...(i===60?{precipitationIntervalStartEpoch:start+59*hour,precipitationIntervalEndEpoch:start+60*hour}:{})}));
 const explicit=warnings.summarizeDwdWarnings(intervalRows,1400).filter(x=>x.kind==='snow');assert.ok(explicit.length);for(const signal of explicit){assert.equal(Date.parse(signal.validFrom),start+59*hour);assert.equal(Date.parse(signal.validTo),start+60*hour)}
 console.log('PASS snow occurrence, unchanged amounts/high stages, full hazard/EPS presentation, actual 24h profile selector and dry calendar day');
}finally{Date.now=originalNow}
