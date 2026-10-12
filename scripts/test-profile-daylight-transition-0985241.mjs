import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/ForecastCockpit.tsx','src/periodWeatherVisual.ts'],outdir:'/tmp/mid-profile-transition',bundle:true,platform:'node',format:'esm',write:false,loader:{'.css':'empty'},logLevel:'silent'});
const modules=await Promise.all(result.outputFiles.map(file=>import('data:text/javascript;base64,'+Buffer.from(file.text).toString('base64'))));
const {shortTermProfileHourlyPoints}=modules.find(m=>m.shortTermProfileHourlyPoints),{periodWeatherVisual}=modules.find(m=>m.periodWeatherVisual);
const now=Date.parse('2026-10-12T05:00Z');
for(const firstDay of [false,true]){
 const samples=[0,1,2,3].map(i=>({id:String(i),epoch:now+i*900000,source:'15-min',precipitationIntervalStartEpoch:now+i*900000,precipitationIntervalEndEpoch:now+(i+1)*900000,isDay:i===0?firstDay:!firstDay,code:i===0?0:3,weatherLabel:'Bewölkt',cloud:60,lowCloud:30,midCloud:20,highCloud:10,precipitation:0,rain:0,showers:0,snowfall:0,probability:10,gust:12,localAdjustment:0}));
 const rows=shortTermProfileHourlyPoints([],samples,'Europe/Berlin',now);
 assert.equal(rows.length,1);assert.equal(rows[0].isDay,firstDay,'Day/night belongs to the displayed interval start');assert.equal(rows[0].code,2);assert.equal(rows[0].cloud,60);assert.equal(rows[0].precipitation,0);assert.equal(rows[0].precipitationIntervalStartEpoch,now);assert.equal(rows[0].precipitationIntervalEndEpoch,now+3600000);
}
assert.equal(periodWeatherVisual([{code:3,cloud:90,precipitation:0,probability:0,isDay:true}],false,3,'Bewölkt').code,3,'A period without a civil time must not crash');
assert.equal(periodWeatherVisual([{time:'2026-10-12T12:00',code:0,cloud:0,precipitation:0,probability:0}],true,3,'Bewölkt').code,0,'Civil fallback remains usable');
console.log('Sunrise/sunset profile groups, missing civil time, start-daylight and exact precipitation intervals passed.');
