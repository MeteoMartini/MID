import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
const temp=await mkdtemp(resolve(tmpdir(),'mid-composite-test-'));
try{
 const result=await build({stdin:{contents:"export * from './src/modelForecastTime';export * from './src/rucSynopticFields';export * from './src/cloudWeatherData';export * from './src/cloudWeatherIsobars';export * from './src/nativeSynopticFields';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',write:false});
 const path=resolve(temp,'test.mjs');await writeFile(path,result.outputFiles[0].text);const m=await import(path);
 for(const zone of ['UTC','Europe/Berlin','Asia/Kathmandu','America/St_Johns']){
  process.env.TZ=zone;assert.equal(m.modelLeadLabel('2026-10-25T00:00','2026-10-25T03:00'),'+3 h');assert.equal(m.modelLeadLabel('2026-10-25T02:00+02:00','2026-10-25T01:00-02:00'),'+3 h');assert.equal(m.modelLeadLabel('2026-10-25T00:00Z','2026-10-27T00:00Z'),'+48 h');
 }
 assert.equal(m.modelLeadLabel('bad','bad'),'Zeitschritt unbekannt');assert.equal(m.modelLeadLabel('2026-10-25T03:00','2026-10-25T00:00'),'Zeitschritt unbekannt');
 const stamp=Math.floor(Date.now()/3600000)*3600000,run=new Date(stamp).toISOString(),time=h=>new Date(stamp+h*3600000).toISOString();
 const d={schema:'mid.ruc.synoptic-fields.v1',modelId:'icon-d2-ruc',run,sampling:'nearest-native-cell',maxNearestKm:5,model:{label:'DWD ICON-D2-RUC',run,resolutionKm:2.2,license:'CC BY 4.0',frames:Array.from({length:28},(_,hour)=>({hour,time:time(hour),file:`icon-d2-ruc-${String(hour).padStart(3,'0')}.bin`,bytes:100,decodedBytes:1000,sha256:'1'.repeat(64),encoding:'gzip-json',cloudWeather:true}))}};
 const noAnalysisWeather=structuredClone(d);noAnalysisWeather.model.frames[0].cloudWeather=false;assert.equal(m.validateRucSynopticIndex(noAnalysisWeather).frames[0].cloudWeather,false);
 const model=m.validateRucSynopticIndex(d);assert.match(m.modelAvailableLabel(run,model.frames.map(f=>f.time)),/\+0 h bis \+27 h · 28 Termine · 1-h-Schritte/);
 assert.match(m.modelAvailableLabel(run,[time(0),time(3),time(12),time(48)]),/\+48 h.*unterschiedliche/);assert.equal(m.modelAvailableLabel(run,[]),'Keine bestätigten Vorhersageschritte');
 for(const mutate of [x=>x.model.frames.pop(),x=>x.model.frames[3].hour=2,x=>x.model.frames[3].time=time(4),x=>x.model.frames[3].cloudWeather=false,x=>x.model.frames[3].file='../evil',x=>x.modelId='icon-d2',x=>x.maxNearestKm=6,x=>x.run=time(-5)]){const bad=structuredClone(d);mutate(bad);assert.throws(()=>m.validateRucSynopticIndex(bad))}
 const catalog={schema:'mid.synoptic.fields.v1',models:{'icon-d2-ruc':model}};
 assert(m.cloudWeatherSources(null,catalog).some(s=>s.id==='icon-d2-ruc'));assert(m.eligibleCloudIsobarModel('icon-d2-ruc'));
 const field={model:'icon-d2-ruc',run,time:time(3),resolutionKm:2.2,scale:.1,lats:[47,48],lons:[6,7],thetae:[0,100,null,300],cloudWeather:{cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:[0,1000,null,500],weather:[0,95,null,75]}};
 assert.equal(m.synopticAt(field,47.1,6.1),0);assert.equal(m.synopticAt(field,47.9,6.1),null);assert.equal(m.synopticAt(field,46,6),null);
 const cloud=m.synopticCloudWeather(field);assert.equal(cloud.model,'icon-d2-ruc');assert.deepEqual(m.cloudWeatherAt(cloud,47.1,6.9),{cloud:100,weather:95});assert.deepEqual(m.cloudWeatherAt(cloud,47.9,6.1),{cloud:null,weather:null});assert.deepEqual(m.cloudWeatherPixel(null,null,'pseudo'),[0,0,0,0]);
 const axes=Array.from({length:12},(_,i)=>47+i*.5),longitude=Array.from({length:12},(_,i)=>6+i*.5),fc={type:'FeatureCollection',features:[]};
 const full={schema:'mid.synoptic.field.v1',model:'icon-d2-ruc',sampling:'nearest-native-cell',run,time:time(3),resolutionKm:2.2,unit:'°C',scale:.1,lats:axes,lons:longitude,thetae:Array(144).fill(360),height:fc,pressure:fc,humidity:fc,wind:[],cloudWeather:{cloudUnit:'%',weatherUnit:'WMO 4677',cloudScale:.1,cloud:Array(144).fill(750),weather:Array(144).fill(95)}};
 assert.equal(m.validateSynopticField(full,'icon-d2-ruc',model,model.frames[3]),full);
 for(const patch of [{sampling:'linear'},{cloudWeather:undefined},{cloudWeather:{...full.cloudWeather,weather:Array(144).fill(null)}},{cloudWeather:{...full.cloudWeather,weather:Array(144).fill(95.5)}}])assert.throws(()=>m.validateSynopticField({...full,...patch},'icon-d2-ruc',model,model.frames[3]));
 const ui=await readFile('src/UnifiedWeatherMap.tsx','utf8');assert(ui.includes('forecastTimeSummary'));assert(ui.includes('modelAvailableLabel(forecastRun,times)'));
 const python=spawnSync('python3',['-m','unittest','test_ruc_synoptic_fields'],{cwd:'tools/ruc',encoding:'utf8',timeout:90000});assert.equal(python.status,0,python.stdout+python.stderr);
 console.log('RUC composite/native GRIB, nine components, categories, UTC, horizons and Missing: passed');
}finally{await rm(temp,{recursive:true,force:true})}
