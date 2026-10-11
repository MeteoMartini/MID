import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-location-intelligence-'));
try{
 await build({entryPoints:['src/locationComparison.ts','src/modelRunChanges.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const changes=await import(pathToFileURL(join(dir,'modelRunChanges.js')));
 const {comparePlace,rankPlaces,distanceKm}=await import(pathToFileURL(join(dir,'locationComparison.js')));
 const origin={id:1,name:'A',latitude:50,longitude:7,timezone:'UTC'},start=Date.parse('2026-10-12T10:00Z'),times=Array.from({length:6},(_,i)=>new Date(start+i*3600000).toISOString().slice(0,16));
 const weather={latitude:50,longitude:7,elevation:40,timezone:'UTC',current:{},daily:{},hourly:{time:times,temperature_2m:Array(6).fill(18),wind_gusts_10m:Array(6).fill(12),wind_speed_10m:Array(6).fill(6),precipitation:Array(6).fill(0),precipitation_probability:Array(6).fill(20)}};
 for(const field of ['is_day','weather_code','cloud_cover','uv_index','relative_humidity_2m','dew_point_2m','apparent_temperature','rain','showers','snowfall','wind_direction_10m'])weather.hourly[field]=Array(6).fill(field==='relative_humidity_2m'?60:0);
 const place={id:'a',label:'A',location:origin,weather},dry=comparePlace(place,origin,start,6);assert.equal(dry.complete,true);assert.equal(dry.dryHours,6);assert.equal(dry.rain,0);assert.equal(dry.suitable,6);
 const hole={...weather,hourly:{...weather.hourly,precipitation:[0,0,null,0,0,0]}};const missing=comparePlace({...place,id:'hole',weather:hole},origin,start,6);assert.equal(missing.complete,false);assert.equal(missing.dryHours,3);assert.equal(missing.rain,null);assert.equal(missing.coverage,5);
 const gap={...weather,hourly:{...weather.hourly,time:times.map((t,i)=>i===2?'2026-10-12T18:00':t)}};assert.equal(comparePlace({...place,weather:gap},origin,start,6).dryHours,3,'A missing absolute hour breaks a dry window');
 const stale=comparePlace({...place,weather:{...weather,_mid_core_proxy:{stale:true}}},origin,start,6);assert.equal(stale.complete,false);
 assert.equal(rankPlaces([missing,stale,dry],'dry')[0],dry);assert.ok(distanceKm(origin,{...origin,latitude:51})>100);
 const alerts=[{id:'live',headline:'Wind',source:'DWD',level:'yellow',onset:'2026-10-12T12:00Z',expires:'2026-10-12T15:00Z'},{id:'past',headline:'Alt',source:'DWD',level:'yellow',expires:'2026-10-12T09:00Z'}];assert.equal(comparePlace({...place,alerts},origin,start,6).warnings.length,1);
 const ensemble=[{temperatureHours:times.map((time,i)=>({time,epoch:start+i*3600000,p25:16,p75:20,memberCount:10,modelFamilyCount:2}))}];assert.equal(comparePlace({...place,ensemble},origin,start,6).spread,4);assert.equal(comparePlace({...place,ensemble:[{temperatureHours:ensemble[0].temperatureHours.slice(0,5)}]},origin,start,6).spread,null);
 const risky=comparePlace({...place,weather:{...weather,hourly:{...weather.hourly,precipitation_probability:Array(6).fill(60)}}},origin,start,6);assert.equal(risky.dryHours,0,'Dry deterministic amount alone cannot establish a confident dry window');
 const old={version:1,createdAt:'2026-10-25T00:00Z',runKey:'a',signature:'old',days:[],precipitationOnset:'2026-10-25T02:00',precipitationOnsetEpoch:Date.parse('2026-10-25T00:00Z'),timezone:'Europe/Berlin'},next={...old,signature:'new',precipitationOnsetEpoch:Date.parse('2026-10-25T01:00Z')};assert.equal(changes.compareModelChangeSnapshots(old,next).items.find(i=>i.metric==='onset').delta,1,'Stored absolute rain onset disambiguates the repeated DST hour');
 const originalNow=Date.now;Date.now=()=>Date.parse('2026-10-25T00:00Z');try{const h=[{time:'2026-10-25T02:00',epoch:Date.parse('2026-10-25T00:00Z'),timezone:'Europe/Berlin',precipitation:0,probability:0},{time:'2026-10-25T02:00',epoch:Date.parse('2026-10-25T01:00Z'),timezone:'Europe/Berlin',precipitation:.2,probability:80}];const captured=changes.buildModelChangeSnapshot([],[],h,[]);assert.equal(captured.precipitationOnsetEpoch,h[1].epoch);assert.ok(captured.signature.includes(String(h[1].epoch)),'Absolute onset is part of the change identity')}finally{Date.now=originalNow}
 assert.equal(changes.compareModelChangeSnapshots(old,{...next,createdAt:'2026-10-25T03:00Z',precipitationOnset:undefined,precipitationOnsetEpoch:undefined}).items.filter(i=>i.metric==='onset').length,0,'Already elapsed rain onset is not a forecast revision');
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('MID .240: common absolute windows, missing/stale data, dry continuity, ranking, warning scope and ensemble coverage passed.');

if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-location-intelligence-browser-0985240.mjs'],{stdio:'inherit',timeout:360000});
