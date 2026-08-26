import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [travel,panel,workerSource,workerCore,generatedWorker,pkgRaw,baselineRaw,changelog,implementation]=await Promise.all([
 readFile('src/travelPlanner.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('worker-src/40-aviation-router.js','utf8'),
 readFile('worker-src/00-core-observations.js','utf8'),
 readFile('worker.js','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('CHANGELOG.md','utf8'),
 readFile('MID_IMPLEMENTATION_0.9.66.7.md','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-travel-water-noaa-oisst-09667.mjs';

assert.ok(pkg.version.startsWith('0.9.66.')&&Number(pkg.version.split('.')[3])>=7,'NOAA-OISST benötigt mindestens MID 0.9.66.7.');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:travel-water-noaa-oisst'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.66.7.md'),'Umsetzungsnachweis 0.9.66.7 fehlt in der Baseline.');
assert.ok(workerCore.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Version sind nicht gekoppelt.');
assert.ok(generatedWorker.includes(workerSource.trim()),'Generierter Worker enthält den kanonischen NOAA-OISST-Pfad nicht.');

for(const token of [
 "const NOAA_OISST_LTM_ASCII='https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.oisst.v2.highres/sst.day.mean.ltm.1991-2020.nc.ascii'",
 "const NOAA_OISST_SCHEMA='mid.travel-water-climate.v1'",
 'const NOAA_OISST_MAX_DISTANCE_KM=80',
 'sst.day.mean.ltm.1991-2020.nc.ascii',
 'value>=-3&&value<=45',
 "mode==='travel-water-climate'",
 "'travel-water-climate'"
])assert.ok(workerSource.includes(token),`Worker-NOAA-OISST-Vertrag fehlt: ${token}`);
for(const token of [
 "const WATER_CACHE_PREFIX='mid:travel-water-climate:noaa-oisst-1991-2020:v5:'",
 "fetchWorkerJson<TravelWaterWorkerPayload>('travel-water-climate'",
 "payload.schema!=='mid.travel-water-climate.v1'",
 'if(!payload.available){return',
 'writeCache(key,value)'
])assert.ok(travel.includes(token),`Client-NOAA-OISST-Vertrag fehlt: ${token}`);
assert.ok(!travel.includes("models:'era5_ocean'")&&!travel.includes('MARINE_ARCHIVE_ENDPOINT'),'Defekter Open-Meteo-ERA5-Ocean-Pfad ist weiterhin aktiv.');
assert.ok(panel.includes('NOAA-OISST-Mittel für den Reisezeitraum')&&panel.includes('NOAA-OISST-v2.1-Meeresoberflächenmittel der Normperiode 1991–2020'),'Quelle/Methodik der Wassertemperatur ist nicht transparent.');
assert.ok(changelog.startsWith('## 0.9.66.7'));
for(const token of ['vollständig `null`','NOAA OISST v2.1','Worker-Upload','Iberostar Waves Creta Panorama','22,66 °C'])assert.ok(implementation.includes(token),`Umsetzungsnachweis unvollständig: ${token}`);

const NativeResponse=globalThis.Response,nativeFetch=globalThis.fetch,queries=[];
function mockOisstAscii(url){
 const expression=decodeURIComponent(url.search.slice(1)),match=expression.match(/^sst\[(\d+):1:(\d+)\]\[(\d+):1:(\d+)\]\[(\d+):1:(\d+)\]$/);
 assert.ok(match,`Unerwarteter OPeNDAP-Ausdruck: ${expression}`);
 const [,timeStartRaw,timeEndRaw,latStartRaw,latEndRaw,lonStartRaw,lonEndRaw]=match,timeStart=Number(timeStartRaw),timeEnd=Number(timeEndRaw),latStart=Number(latStartRaw),latEnd=Number(latEndRaw),lonStart=Number(lonStartRaw),lonEnd=Number(lonEndRaw),timeCount=timeEnd-timeStart+1,latCount=latEnd-latStart+1,lonCount=lonEnd-lonStart+1,missing='-9.96921E36',lines=[`Dataset { Grid { ARRAY: Float32 sst[time = ${timeCount}][lat = ${latCount}][lon = ${lonCount}]; } sst; } mock;`,'---------------------------------------------',`sst.sst[${timeCount}][${latCount}][${lonCount}]`];
 for(let timeOffset=0;timeOffset<timeCount;timeOffset++)for(let latOffset=0;latOffset<latCount;latOffset++){
  const timeIndex=timeStart+timeOffset,latIndex=latStart+latOffset,values=[];
  for(let lonIndex=lonStart;lonIndex<=lonEnd;lonIndex++){
   let value=missing;
   if(latIndex===501&&lonIndex===98){if(timeIndex>=290&&timeIndex<=299)value=String(22+(timeIndex-290)*.1);else if(timeIndex===58)value='18';else if(timeIndex===59)value='20'}
   values.push(value);
  }
  lines.push(`[${timeOffset}][${latOffset}], ${values.join(', ')}`);
 }
 lines.push('',`sst.time[${timeCount}]`,'0');
 return lines.join('\n');
}
try{
 globalThis.fetch=async input=>{const url=new URL(String(input));assert.equal(url.hostname,'psl.noaa.gov','Worker nutzt nicht den offiziellen NOAA-PSL-OPeNDAP-Endpunkt.');queries.push(decodeURIComponent(url.search.slice(1)));return new NativeResponse(mockOisstAscii(url),{status:200,headers:{'content-type':'text/plain'}})};
 const worker=(await import(`../worker.js?sst=${Date.now()}`)).default;
 const creteResponse=await worker.fetch(new Request('https://worker.invalid/?mode=travel-water-climate&lat=35.4&lon=24.65&start=2026-10-18&end=2026-10-27'),{}),crete=await creteResponse.json();
 assert.equal(creteResponse.status,200);assert.equal(crete.schema,'mid.travel-water-climate.v1');assert.equal(crete.available,true);assert.equal(crete.days,10);assert.equal(crete.temperature,22.45);assert.ok(crete.gridDistanceKm>3&&crete.gridDistanceKm<4);assert.deepEqual(crete.grid,{latitude:35.375,longitude:24.625});assert.equal(queries[0],'sst[290:1:299][497:1:505][93:1:103]');

 const leapResponse=await worker.fetch(new Request('https://worker.invalid/?mode=travel-water-climate&lat=35.4&lon=24.65&start=2028-02-29&end=2028-02-29'),{}),leap=await leapResponse.json();
 assert.equal(leap.available,true);assert.equal(leap.days,1);assert.equal(leap.temperature,19,'29. Februar muss aus 28. Februar und 1. März interpoliert werden.');

 const inlandResponse=await worker.fetch(new Request('https://worker.invalid/?mode=travel-water-climate&lat=48.137&lon=11.575&start=2026-10-18&end=2026-10-27'),{}),inland=await inlandResponse.json();
 assert.equal(inlandResponse.status,200);assert.equal(inland.available,false);assert.equal(inland.temperature,null);assert.match(inland.reason,/80 km/);
}finally{globalThis.fetch=nativeFetch}

console.log('MID 0.9.66.7: reale NOAA-OISST-Klimatologie für Kreta, Kalendertage, Schaltjahr, Küstenradius, Binnenlandausschluss, Workerroute und UI-Vertrag geprüft.');
