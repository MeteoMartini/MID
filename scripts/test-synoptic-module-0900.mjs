import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const workerSource=read('worker/metar-proxy.js'),synopticSource=read('src/synoptic.ts'),panelSource=read('src/SynopticPanel.tsx'),app=read('src/App.tsx'),modules=read('src/dashboardModules.ts'),styles=read('src/styles.css');

for(const token of [
 "mode==='synoptic-analysis'","mode==='dwd-surface-analysis-image'",'discoverDwdSurfaceAnalysis','MID-Frontkandidat · objektive Modellanalyse','fetchSynopticModel','synopticAgreement','synopticObservationCorridor','synopticTiming','objective-front-candidates','front-timing-assimilation'
])assert.ok(workerSource.includes(token),`Worker-Synoptikvertrag fehlt: ${token}`);
for(const token of [
 'Amtliche DWD-Bodenanalyse','Interaktive MID-Synoptik','Nächster markanter Wetterwechsel','Vorher','Während','Nachher','Unsicherheitsbudget nach Ursache','Erklärbare Kausalkette','Lokales Analogarchiv und Ereignisverifikation','Beobachtungskorridor stromaufwärts','persönlichen Schwellenwert','SynopticLifecycle','timingErrorMinutes','impactSignature'
])assert.ok((panelSource+synopticSource).includes(token),`Synoptik-Ausbaustufe fehlt: ${token}`);
assert.ok(!modules.includes("|'synoptic'")&&!modules.includes("id:'synoptic'"),'Die entfernte Synoptiksektion darf nicht mehr in der Dashboardkonfiguration erscheinen');
assert.ok(!app.includes("case'synoptic'")&&!app.includes('MemoLazySynoptic')&&!app.includes('LazySynoptic'),'Die entfernte Synoptiksektion darf nicht mehr in App integriert sein');
assert.ok(panelSource.toLowerCase().includes('unveränderte amtliche referenz')&&panelSource.includes('objektive Modellanalyse'),'amtliche und objektive Frontdarstellung müssen ausdrücklich getrennt bleiben');
for(const token of ['grid-template-columns:repeat(auto-fit','@media(max-width:760px)','@media(max-width:520px)','minmax(0,1fr)','height:clamp'])assert.ok(styles.includes(token),`Responsive Synoptikregel fehlt: ${token}`);
assert.ok(!styles.includes('.synoptic-panel{width:'),'Synoptikmodul darf keine starre Desktopbreite erzwingen');

const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const[file,source,jsx]of[['synoptic.ts',synopticSource,false],['SynopticPanel.tsx',panelSource,true]]){const compilerOptions={target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,...(jsx?{jsx:ts.JsxEmit.ReactJSX}:{})},result=ts.transpileModule(source,{compilerOptions,fileName:file,reportDiagnostics:true}),errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'))}

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-synoptic-'));
try{
 const executable=synopticSource
  .replace("import type {Day,EnsembleDay,Hour,Location,RadarNowcast,Station,ThunderstormNowcast} from './weather';",'')
  .replace("import {readWeatherTwinSettings,type TwinActivity} from './forecastVerification';",`const readWeatherTwinSettings=()=>({activities:{commute:{enabled:true,maxRainProbability:70,maxGustKt:40,minTemperature:-15,maxTemperature:40,minimumWindowHours:1},outdoor:{enabled:true,maxRainProbability:40,maxGustKt:28,minTemperature:-5,maxTemperature:32,minimumWindowHours:2},garden:{enabled:true,maxRainProbability:25,maxGustKt:25,minTemperature:2,maxTemperature:30,minimumWindowHours:2},rowing:{enabled:true,maxRainProbability:35,maxGustKt:18,minTemperature:2,maxTemperature:30,minimumWindowHours:1},dog:{enabled:false,maxRainProbability:45,maxGustKt:30,minTemperature:-5,maxTemperature:28,minimumWindowHours:1},ski:{enabled:false,maxRainProbability:65,maxGustKt:30,minTemperature:-20,maxTemperature:8,minimumWindowHours:2},heat:{enabled:false,maxRainProbability:100,maxGustKt:100,minTemperature:-50,maxTemperature:26,minimumWindowHours:3}}});`)
  .replace("import {fetchWorkerJson} from './workerClient';",'const fetchWorkerJson=async()=>({});');
 const output=ts.transpileModule(executable,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'synoptic.ts',reportDiagnostics:true}),errors=(output.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));const file=path.join(tempDir,'synoptic.mjs');fs.writeFileSync(file,output.outputText);
 const store=new Map();globalThis.localStorage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
 const module=await import(`${pathToFileURL(file).href}?v=${Date.now()}`),now=Date.now(),hours=Array.from({length:90},(_,index)=>{const before=index<30,after=index>34;return{time:new Date(now+index*3600000).toISOString(),epoch:now+index*3600000,timezone:'Europe/Berlin',temperature:before?19:after?11:16,apparent:16,humidity:75,dewPoint:before?14:after?6:11,pressure:index===32?1005:1014,precipitation:index>=30&&index<=34?1.2:0,rain:index>=30&&index<=34?1.2:0,showers:0,snowfall:0,probability:index>=30&&index<=34?85:10,code:index>=30&&index<=34?63:2,wind:before?10:18,gust:before?16:36,direction:before?190:after?305:250,cloud:index>=29&&index<=35?96:40,lowCloud:30,uvIndex:0,visibility:10000,cape:50,sunshineDuration:0,isDay:true}}),location={id:1,name:'Testort',latitude:50.8,longitude:7.1,timezone:'Europe/Berlin'};
 const candidate=module.localFrontCandidate(hours,location);assert.ok(candidate,'lokaler Frontkandidat muss aus markantem Feldwechsel entstehen');assert.equal(candidate.type,'cold');
 const intelligence=module.buildSynopticIntelligence({location,locationKey:'test',hours,days:[],ensemble:[],station:null,radar:null,worker:null});assert.ok(intelligence.event);assert.equal(intelligence.phases.length,3);assert.ok(intelligence.uncertainty.length>=5);assert.ok(intelligence.impacts.some(item=>item.activity==='garden'));assert.ok(intelligence.causalChain.length>=3);assert.equal(intelligence.event.lifecycle,'detected');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const workerTemp=path.join(os.tmpdir(),`mid-worker-synoptic-${Date.now()}.mjs`);fs.writeFileSync(workerTemp,workerSource);
const originalFetch=globalThis.fetch,originalNow=Date.now;Date.now=()=>Date.UTC(2026,7,2,18,0,0);
try{
 const start=Date.UTC(2026,7,1,0,0,0),times=Array.from({length:120},(_,index)=>new Date(start+index*3600000).toISOString().slice(0,16));
 globalThis.fetch=async(input,init={})=>{const url=new URL(String(input));
  if(url.hostname==='www.dwd.de'&&url.pathname.endsWith('hobbyeuropakarten.html'))return new Response(`<html><img src="/DWD/wetter/wv_spez/hobbymet/wetterkarten/ana_boden_na.png"></html>`,{status:200,headers:{'content-type':'text/html'}});
  if(url.hostname==='www.dwd.de'&&url.pathname.endsWith('ana_boden_na.png'))return new Response(new Uint8Array([137,80,78,71]),{status:200,headers:{'content-type':'image/png','last-modified':'Sun, 02 Aug 2026 12:30:00 GMT'}});
  if(url.hostname==='api.open-meteo.com'){
   const lats=url.searchParams.get('latitude').split(',').map(Number),lons=url.searchParams.get('longitude').split(',').map(Number),centerLon=lons[Math.floor(lons.length/2)];
   const rows=lats.map((latitude,index)=>{const longitude=lons[index],spatial=(longitude-centerLon)*1.25,hourly={time:times,temperature_2m:[],dew_point_2m:[],pressure_msl:[],wind_speed_10m:[],wind_direction_10m:[],wind_gusts_10m:[],precipitation:[],cloud_cover:[],wind_speed_850hPa:[],wind_direction_850hPa:[]};for(let hour=0;hour<times.length;hour++){const before=hour<48,after=hour>54,transition=hour>=48&&hour<=54;hourly.temperature_2m.push((before?19:after?10:15)+spatial);hourly.dew_point_2m.push((before?14:after?5:10)+spatial*.8);hourly.pressure_msl.push(transition?1004+Math.abs(hour-51)*.25:1014);hourly.wind_speed_10m.push(before?10:18);hourly.wind_direction_10m.push(before?185:after?305:245);hourly.wind_gusts_10m.push(before?16:38);hourly.precipitation.push(transition?1.4:0);hourly.cloud_cover.push(transition?98:45);hourly.wind_speed_850hPa.push(28);hourly.wind_direction_850hPa.push(285)}return{latitude,longitude,hourly}});return Response.json(rows);
  }
  if(url.hostname==='api.brightsky.dev'){const lat=Number(url.searchParams.get('lat')),lon=Number(url.searchParams.get('lon')),id=`${lat.toFixed(2)}-${lon.toFixed(2)}`;return Response.json({weather:{source_id:id,timestamp:'2026-08-02T17:50:00Z',temperature:11,dew_point:8,pressure_msl:1007,wind_direction_10:290,wind_speed_10:25,cloud_cover:90,precipitation_10:.4},sources:[{id,dwd_station_id:id,station_name:`DWD ${id}`,lat,lon,height:80}]})}
  if(url.hostname==='aviationweather.gov')return Response.json([{icaoId:'EDDK',name:'Köln/Bonn',lat:50.8659,lon:7.1427,reportTime:'2026-08-02T17:50:00Z',temp:12,dewp:8,wdir:290,wspd:15,wgst:25,altim:1008}]);
  throw new Error(`unexpected fetch ${url}`)
 };
 const worker=await import(`${pathToFileURL(workerTemp).href}?v=${Date.now()}`),request=new Request('https://worker.example/?mode=synoptic-analysis&lat=50.8&lon=7.1');const response=await worker.default.fetch(request,{}),data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert.equal(data.officialAnalysis.available,true);assert.ok(data.candidates.length>=2,'mindestens zwei Modelle sollen den Testfrontkandidaten tragen');assert.ok(data.agreement.supportingModels>=2);assert.ok(data.corridor.stations.length>=1);assert.ok(data.timing.assimilatedAt);assert.ok(data.sources.some(item=>item.kind==='official-analysis'));assert.ok(data.candidates.every(item=>item.summary.includes('MID-Frontkandidat · objektive Modellanalyse')));
 const imageResponse=await worker.default.fetch(new Request('https://worker.example/?mode=dwd-surface-analysis-image'),{});assert.equal(imageResponse.status,200);assert.match(imageResponse.headers.get('content-type')||'',/^image\//);
}finally{globalThis.fetch=originalFetch;Date.now=originalNow;fs.rmSync(workerTemp,{force:true})}
console.log('MID-Synoptik v0.9.0.0 geprüft: DWD-Referenz, Isobaren/Stationsplots, Frontobjekte, Multimodell, Korridor, Timing, Verifikation, Analogarchiv, Unsicherheit, Kausalkette, Auswirkungen und responsive Darstellung.');
