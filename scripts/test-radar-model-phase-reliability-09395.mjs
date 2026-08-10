import {readFile} from 'node:fs/promises';

const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
if(!baseline.requiredRegressionTests?.includes('scripts/test-radar-model-phase-reliability-09395.mjs'))throw new Error('Zuverlässigkeitstest fehlt im Baseline-Vertrag.');

const realFetch=globalThis.fetch;
const target='2026-08-10T18:00:00.000Z';
let metaInitialMs=Date.parse('2026-08-10T16:00:00.000Z');
let phaseBatchCalls=0;
function phasePoint(lat,lon){
 const times=['2026-08-10T17:45:00.000Z','2026-08-10T18:00:00.000Z','2026-08-10T18:15:00.000Z'];
 const three=value=>[value,value,value];
 return{latitude:lat,longitude:lon,elevation:80,minutely_15:{time:times,temperature_2m:three(6),relative_humidity_2m:three(90),wet_bulb_temperature_2m:three(5),weather_code:three(61),precipitation:three(.4),rain:three(.4),showers:three(0),snowfall:three(0),snowfall_height:three(1200),freezing_level_height:three(1500)}};
}
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json'))return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}});
 if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
  phaseBatchCalls++;
  const lats=String(url.searchParams.get('latitude')||'').split(',').map(Number),lons=String(url.searchParams.get('longitude')||'').split(',').map(Number);
  if(lats.length!==lons.length)throw new Error('Latitude-/Longitude-Batch ist inkonsistent.');
  return new Response(JSON.stringify(lats.map((lat,index)=>phasePoint(lat,lons[index]))),{status:200,headers:{'content-type':'application/json'}});
 }
 throw new Error(`Unerwarteter Abruf: ${url}`);
};
try{
 const module=await import(`../worker/metar-proxy.js?phase-reliability=${Date.now()}`);
 const response=await module.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(target)}`),{}),data=await response.json();
 if(!response.ok)throw new Error(`Phasenraster unerwartet abgelehnt: ${JSON.stringify(data)}`);
 if(data.modelId!=='icon-d2'||data.lats?.length!==35||data.lons?.length!==49)throw new Error(`Unerwartete Rastergeometrie: ${data.lats?.length}×${data.lons?.length}`);
 const expected=35*49;if(data.frame?.weatherCode?.length!==expected||data.frame?.wetBulbTemperature2m?.length!==expected||data.frame?.snowfallHeight?.length!==expected)throw new Error('Phasenfelder sind nicht vollständig.');
 if(!(Number(data.gridSpacingKm)>=3&&Number(data.gridSpacingKm)<=7))throw new Error(`Stichpunktabstand nicht plausibel: ${data.gridSpacingKm} km`);
 if(phaseBatchCalls<5||phaseBatchCalls>20)throw new Error(`Unplausible Anzahl Modellbatches: ${phaseBatchCalls}`);

 // Ein deutlich zu alter Modelllauf muss abgelehnt werden, statt eine scheinpräzise Phase zu liefern.
 metaInitialMs=Date.parse('2026-08-10T10:00:00.000Z');
 const stale=await module.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(target)}`),{}),staleData=await stale.json();
 if(stale.ok||!String(staleData.error||'').includes('zu alt'))throw new Error(`Staler ICON-D2-Lauf wurde nicht abgelehnt: ${JSON.stringify(staleData)}`);
}finally{globalThis.fetch=realFetch}
console.log('Radar-/ICON-D2-Phasenraster funktional geprüft: 35×49 vollständig, ca. 3–7 km Stichpunktabstand und Stale-Run-Abbruch.');
