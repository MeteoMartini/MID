import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const c={Intl};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(fs.readFileSync('src/precipitation.ts','utf8').replace(/export /g,'')),c);
const wet={precipitation:1,rain:1,showers:0,snowfall:0,probability:90,temperature:0,humidity:95};
for(const code of [66,67])assert.equal(c.precipitationParts({...wet,code}).type,'freezingRain');
for(const code of [68,69])assert.equal(c.precipitationParts({...wet,code,snowfall:.3}).type,'sleet');
for(const code of [83,84])assert.equal(c.precipitationParts({...wet,code,snowfall:.3,showers:1,rain:0}).type,'sleetShowers');
assert.equal(c.precipitationParts({...wet,code:67,temperature:3,dewPoint:2.5}).type,'rain','Humid warm screenshot is rain, never fabricated snow');
assert.equal(c.precipitationParts({...wet,code:67,temperature:3,dewPoint:2.5,surfaceTemperature:-2}).type,'freezingRain','Cold-ground freezing hazard retained');
assert.equal(c.precipitationParts({...wet,code:67,temperature:3,wetBulbTemperature:-.5}).type,'freezingRain','Native evaporative cooling retained');
assert.equal(c.precipitationParts({...wet,code:67,temperature:4,humidity:null,dewPoint:null}).type,'freezingRain','Missing moisture is unknown, not zero');
assert.equal(c.precipitationParts({...wet,code:67,temperature:4,humidity:98,precipitationPhenomenonObserved:true}).type,'freezingRain','Observed FZRA never relabelled');
assert.equal(c.reconcileForecastPrecipitation({...wet,code:69,snowfall:.3,rain:0,showers:1,cape:800}).code,84,'Mixed stratiform to shower preserves rain/snow mixture');
assert.equal(c.reconcileForecastPrecipitation({...wet,code:84,snowfall:.3,showers:0,rain:1,cloud:100,lowCloud:100}).code,69,'Mixed shower to stratiform preserves rain/snow mixture');
assert.equal(c.precipitationParts({...wet,code:71,precipitation:1,rain:.5,snowfall:.35}).type,'sleet','Independent half liquid / half snow water establishes mixed phase');
assert.equal(c.precipitationParts({...wet,code:71,precipitation:1,rain:0,snowfall:.7}).type,'snow','Total snow water is not extra rain');
assert.equal(c.precipitationParts({...wet,code:71,precipitation:1,rain:1,snowfall:.7}).type,'snow','Inconsistent components cannot invent a mixture');
assert.equal(c.precipitationParts({...wet,code:67,precipitation:1,rain:.5,snowfall:.35}).type,'freezingRain','A true freezing code is not converted to mixed snow');
assert.equal(c.precipitationParts({...wet,code:71,precipitation:1,rain:.5,snowfall:.35,precipitationPhenomenonObserved:true}).type,'snow','Observed phase stays authoritative');
const core=fs.readFileSync('worker-src/00-core-observations.js','utf8'),mixedWorker=new Function(core.slice(core.indexOf('function mixedForecastCode('),core.indexOf('function reconcileForecastPrecipitation(amount,'))+'return mixedForecastCode;')();for(const code of [61,71,80,85,67,68]){const sample={...wet,precipitation:1,rain:.5,snowfall:.35,code};assert.equal(mixedWorker(1,.5,0,.35,code,false),c.mixedForecastPrecipitationCode(1,.5,0,.35,code,false),'Worker/frontend forecast mixture parity');}
const w={number:v=>v==null?undefined:Number(v),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))};vm.createContext(w);vm.runInContext(fs.readFileSync('worker-src/25-dach-extreme-outlook.js','utf8'),w);
const fixture=(code,snowfall=0)=>({ensemble:{hourly:{precipitation:[4,4,4,4],precipitation_spread:[0,0,0,0],temperature_2m:[-1,-1,-1,-1],temperature_2m_spread:[0,0,0,0],snowfall:Array(4).fill(snowfall)}},diagnostic:{hourly:{weather_code:Array(4).fill(code)}}});
for(const code of [61,63,68,69,71,73,75,83,84,85,86]){const f=fixture(code,2.8);assert.equal(w.dachExtremeIce(f.ensemble,f.diagnostic,0,4,2000).signal,null,'Cold snow/mixed/rain alone never establishes freezing rain');}
const f=fixture(67);assert.ok(w.dachExtremeIce(f.ensemble,f.diagnostic,0,4,2000).signal,'Explicit cold freezing-rain liquid retained');
const snow=fixture(67,2.8);assert.equal(w.dachExtremeIce(snow.ensemble,snow.diagnostic,0,4,2000).signal,null,'All precipitation water accounted as snow cannot accrete as freezing liquid');
console.log('Distinct WMO rain-snow/freezing phases, screenshot warmth, cold-ground/native-wet-bulb/observed protection and no ice from snow verified.');
