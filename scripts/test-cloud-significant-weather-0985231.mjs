import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const temp=mkdtempSync(path.resolve('.mid-cloud-weather-'));
try{
 await build({entryPoints:['src/cloudWeatherData.ts','src/cloudWeatherExport.ts','src/nativeSynopticFields.ts'],outdir:temp,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent',define:{'import.meta.env':'{}'}});
 const m=await import(pathToFileURL(path.join(temp,'cloudWeatherData.js'))),exp=await import(pathToFileURL(path.join(temp,'cloudWeatherExport.js'))),native=await import(pathToFileURL(path.join(temp,'nativeSynopticFields.js')));
 const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),time=new Date(Date.parse(run)+3*3600000).toISOString();
 const cloud={kind:'cloud',run,time,scale:.1,lats:[47,48],lons:[6,7],values:[0,1000,NaN,500]},weather={...cloud,kind:'sigwx',values:[0,610,NaN,860]};
 const pair=m.nativeCloudWeatherPair(cloud,weather);assert.deepEqual(pair.cloud,[0,100,null,50]);assert.deepEqual(pair.weather,[0,61,null,86]);assert.deepEqual(m.cloudWeatherAt(pair,47,6),{cloud:0,weather:0});assert.deepEqual(m.cloudWeatherAt(pair,48,6),{cloud:null,weather:null});assert.equal(m.cloudWeatherAt(pair,46,6),null);
 for(const patch of [{run:'2026-01-01T00:00:00Z'},{time:run},{lats:[46,48]},{lons:[6,8]},{kind:'pressure'}])assert.throws(()=>m.nativeCloudWeatherPair(cloud,{...weather,...patch}));
 assert.equal(m.significantWeatherStyle(null),undefined);assert.equal(m.significantWeatherStyle(61.5),undefined);assert.equal(m.significantWeatherStyle(61).color,'#39ed24');assert.match(m.significantWeatherStyle(36).label,/Schneetreiben/);for(const code of [57,59,67,69,81,84,86])assert.match(m.significantWeatherStyle(code).label,/mäßig.*stark/);
 assert.doesNotMatch(m.significantWeatherStyle(91).label,/Gewitter ·/);assert.match(m.cloudWeatherDescription(null),/nicht verfügbar/);const codes=m.SIGNIFICANT_WEATHER_STYLES.flatMap(s=>s.codes);assert.equal(codes.length,new Set(codes).size);
 const meta=[{layer:m.GDPS_CLOUD_LAYER,times:[run,time],referenceTimes:[run],styles:[{name:'CLOUD',rendering:'fill'}]},{layer:m.GDPS_WEATHER_LAYER,times:[time],referenceTimes:[run],styles:[{name:'INSTPRECIPITATIONTYPE',rendering:'fill'}]}];
 assert.deepEqual(m.gdpsCloudWeatherPlan(meta,Date.parse(time)),{run,time,times:[time]});assert.equal(m.gdpsCloudWeatherPlan([meta[0]],Date.parse(time)),null);assert.equal(m.gdpsCloudWeatherPlan([meta[0],{...meta[1],referenceTimes:['2026-01-01T00:00:00Z']}],Date.parse(time)),null);assert.equal(m.gdpsCloudWeatherPlan([meta[0],{...meta[1],times:[]}],Date.parse(time)),null);assert.equal(m.gdpsCloudWeatherPlan([meta[0],{...meta[1],styles:[{name:'made-up',rendering:'fill'}]}],Date.parse(time)),null);
 assert.deepEqual(m.cloudWeatherSources({products:{cloud:{frames:[{time}]},sigwx:{frames:[{time}]}}},{models:{'icon-eu':{label:'DWD ICON-EU',frames:[{time,cloudWeather:true}]},icon:{label:'DWD ICON',frames:[{time}]}}}).map(s=>s.id),['icon-d2','icon-eu','gdps']);
 const axis=Array.from({length:12},(_,i)=>47+i*.5),lon=Array.from({length:12},(_,i)=>6+i*.5),fc={type:'FeatureCollection',features:[]},model={run,resolutionKm:14},ref={time,cloudWeather:true},cw={cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:Array(144).fill(500),weather:Array(144).fill(61)},field={schema:'mid.synoptic.field.v1',model:'icon-eu',run,time,resolutionKm:14,unit:'°C',scale:.1,lats:axis,lons:lon,thetae:Array(144).fill(420),height:fc,pressure:fc,humidity:fc,wind:[],cloudWeather:cw};
 assert.equal(native.validateSynopticField(field,'icon-eu',model,ref),field);assert.equal(m.synopticCloudWeather(field).cloud[0],50);
 for(const patch of [{cloudUnit:'1'},{weatherUnit:'inferred'},{cloudScale:1},{cloud:[1]},{weather:Array(144).fill(61.5)},{cloud:Array(144).fill(1001)}])assert.throws(()=>native.validateSynopticField({...field,cloudWeather:{...cw,...patch}},'icon-eu',model,ref));assert.throws(()=>native.validateSynopticField({...field,cloudWeather:undefined},'icon-eu',model,ref));
 const svg=exp.cloudWeatherSvg(pair,'data:image/png;base64,AA',[{name:'A&B',latitude:47,longitude:6},{name:'Missing',latitude:48,longitude:6}]);assert.match(svg,/A&amp;B/);assert.match(svg,/0 % Wolken/);assert.match(svg,/Wetter nicht verfügbar/);assert.match(svg,/Schneeschauer/);assert.match(svg,/gleicher|Gleicher/);
 const worker=readFileSync('worker-src/20-composite-models.js','utf8');assert.ok(worker.includes("PrecipType-Instant',{forecast:true,categorical:true"));assert.ok(worker.includes("?.categorical)?'false':'true'"));
 console.log('Combined cloud/weather: strict cycle/time/grid pairs, unknown preservation, WMO intensity bounds, same-cycle GDPS capability intersection, synoptic payload validation and shared exports passed.');
}finally{rmSync(temp,{recursive:true,force:true});}
