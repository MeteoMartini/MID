import {readFile} from 'node:fs/promises';

const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
if(!baseline.requiredRegressionTests?.includes('scripts/test-radar-model-phase-reliability-09395.mjs'))throw new Error('Zuverlässigkeitstest fehlt im Baseline-Vertrag.');

const realFetch=globalThis.fetch;
const testNowMs=Date.now(),quarterMs=15*60*1000,targetMs=Math.floor((testNowMs-15*60*1000)/quarterMs)*quarterMs;
let metaInitialMs=targetMs-2*60*60*1000;
let phaseBatchCalls=0,totalLocations=0,activeCalls=0,maxConcurrent=0,rateLimited=false;
function phasePoint(lat,lon,targetMs){
 const times=[-15,0,15].map(minutes=>new Date(targetMs+minutes*60000).toISOString());
 const three=value=>[value,value,value];
 return{latitude:lat,longitude:lon,elevation:80,minutely_15:{time:times,temperature_2m:three(6),relative_humidity_2m:three(90),wet_bulb_temperature_2m:three(5),weather_code:three(61),precipitation:three(.4),rain:three(.4),snowfall:three(0),snowfall_height:three(1200),freezing_level_height:three(1500)}};
}
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json')){if(/icon_d2_ruc|dwd_icon_d2_ruc/.test(url.pathname))return new Response('{}',{status:404,headers:{'content-type':'application/json'}});return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}})};
 if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
  phaseBatchCalls++;activeCalls++;maxConcurrent=Math.max(maxConcurrent,activeCalls);
  try{
   if(rateLimited)return new Response(JSON.stringify({error:true,reason:'Minutely API request limit exceeded. Please try again in one minute.'}),{status:429,headers:{'content-type':'application/json'}});
   const lats=String(url.searchParams.get('latitude')||'').split(',').filter(Boolean).map(Number),lons=String(url.searchParams.get('longitude')||'').split(',').filter(Boolean).map(Number),fields=String(url.searchParams.get('minutely_15')||'').split(',').filter(Boolean);
   if(lats.length!==lons.length)throw new Error('Latitude-/Longitude-Batch ist inkonsistent.');
   if(fields.length>9||fields.includes('showers'))throw new Error(`Phasenraster fordert zu viele Variablen an: ${fields.join(',')}`);
   totalLocations+=lats.length;
   const start=Date.parse(String(url.searchParams.get('start_minutely_15')||'')+'Z'),targetMs=start+15*60000;
   await new Promise(resolve=>setTimeout(resolve,1));
   return new Response(JSON.stringify(lats.map((lat,index)=>phasePoint(lat,lons[index],targetMs))),{status:200,headers:{'content-type':'application/json'}});
  }finally{activeCalls--}
 }
 throw new Error(`Unerwarteter Abruf: ${url}`);
};
try{
 const target=new Date(targetMs).toISOString();
 const module=await import(`../worker/metar-proxy.js?phase-reliability=${Date.now()}`);
 const response=await module.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(target)}`),{}),data=await response.json();
 if(!response.ok)throw new Error(`Phasenraster unerwartet abgelehnt: ${JSON.stringify(data)}`);
 if(!String(data.modelId||'')||data.lats?.length!==13||data.lons?.length!==19)throw new Error(`Unerwartetes dynamisches Phasenmodell/Raster: ${data.modelId} · ${data.lats?.length}×${data.lons?.length}`);
 if(!Array.isArray(data.candidateModels)||!data.candidateModels.length)throw new Error('Dynamische Phasenmodell-Auswahl fehlt.');
 const expected=13*19;if(data.frame?.weatherCode?.length!==expected||data.frame?.wetBulbTemperature2m?.length!==expected||data.frame?.snowfallHeight?.length!==expected)throw new Error('Phasenfelder sind nicht vollständig.');
 if(data.requestBudget?.locations!==247||data.requestBudget?.batches!==3||data.requestBudget?.variables>9)throw new Error(`Request-Budget verletzt: ${JSON.stringify(data.requestBudget)}`);
 if(totalLocations!==247)throw new Error(`Open-Meteo-Budget verletzt: ${totalLocations} statt 247 Standortwerte.`);
 if(phaseBatchCalls!==3||maxConcurrent!==1)throw new Error(`Batches nicht sequenziell: ${phaseBatchCalls} Abrufe, Parallelität ${maxConcurrent}.`);
 if(!(Number(data.gridSpacingKm)>=7&&Number(data.gridSpacingKm)<=15))throw new Error(`Stichpunktabstand nicht plausibel: ${data.gridSpacingKm} km`);

 // Bei einem Minutenlimit darf MID nicht den zweiten Modellalias nachfeuern. Stattdessen
 // wird ein höchstens 45 Minuten altes bereits belastbares Phasenfeld begrenzt genutzt.
 rateLimited=true;const beforeLimitCalls=phaseBatchCalls,nextTarget=new Date(targetMs+quarterMs).toISOString();
 const fallbackResponse=await module.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(nextTarget)}`),{}),fallback=await fallbackResponse.json();
 if(!fallbackResponse.ok||fallback.stale!==true||!/(?:API-Limit|Minutenlimit)/i.test(String(fallback.fallbackReason||'')))throw new Error(`Rate-Limit-Fallback fehlt: ${JSON.stringify(fallback)}`);
 if(phaseBatchCalls-beforeLimitCalls!==1)throw new Error(`Rate-Limit löste unnötige Folgeabrufe aus: ${phaseBatchCalls-beforeLimitCalls}.`);

 // Frischer Modulzustand: Ein deutlich zu alter Modelllauf muss weiter abgelehnt werden.
 rateLimited=false;metaInitialMs=testNowMs-12*60*60*1000;
 const staleModule=await import(`../worker/metar-proxy.js?phase-stale=${Date.now()}`);
 const staleResponse=await staleModule.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(target)}`),{}),staleData=await staleResponse.json();
 if(staleResponse.ok||!/(?:zu alt|kein geeignetes)/i.test(String(staleData.error||'')))throw new Error(`Staler Regionalmodell-Lauf wurde nicht abgelehnt: ${JSON.stringify(staleData)}`);
}finally{globalThis.fetch=realFetch}
console.log('Radar-/Regionalmodell-Phasenraster geprüft: dynamische Rapid-/Regionalmodellwahl, 13×19/247 Punkte, 3 sequenzielle Batches, Rate-Limit-Fallback und Stale-Run-Abbruch.');
