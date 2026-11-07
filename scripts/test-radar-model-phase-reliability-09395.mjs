import {readFile} from 'node:fs/promises';

const baseline=JSON.parse(await readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
if(!baseline.requiredRegressionTests?.includes('scripts/test-radar-model-phase-reliability-09395.mjs'))throw new Error('Zuverlässigkeitstest fehlt im Baseline-Vertrag.');

const realFetch=globalThis.fetch;
const testNowMs=Date.now(),quarterMs=15*60*1000,targetMs=Math.floor((testNowMs-15*60*1000)/quarterMs)*quarterMs;
let metaInitialMs=targetMs-2*60*60*1000;
let phaseBatchCalls=0,totalLocations=0,activeCalls=0,maxConcurrent=0,rateLimited=false;
let fixtureIndex=0;
function phasePoint(lat,lon,targetMs){
 const fixture=[null,0,-1,.4,false,' ',undefined,2][fixtureIndex++%8],code=[null,0,71.5,61,false,' ',100,99][(fixtureIndex-1)%8];
 const times=[-15,0,15].map(minutes=>new Date(targetMs+minutes*60000).toISOString());
 const three=value=>[value,value,value];
 return{latitude:lat,longitude:lon,elevation:80,minutely_15:{time:times,temperature_2m:three(6),relative_humidity_2m:three(90),wet_bulb_temperature_2m:three(5),weather_code:three(code),precipitation:three(fixture),rain:three(fixture),snowfall:three(fixture),snowfall_height:three(1200),freezing_level_height:three(1500)}};
}
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json')){if(/icon_d2_ruc|dwd_icon_d2_ruc|dwd_icon_eu|\/dwd_icon\//.test(url.pathname))return new Response('{}',{status:404,headers:{'content-type':'application/json'}});return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}})};
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

 for(const name of ['precipitation','rain','snowfall']){
  if(JSON.stringify(data.frame[name].slice(0,8))!==JSON.stringify([null,0,null,.4,null,null,null,2]))throw new Error(name+': Missing/negative must remain null while zero survives JSON');
 }
 if(JSON.stringify(data.frame.weatherCode.slice(0,8))!==JSON.stringify([null,0,null,61,null,null,null,99]))throw new Error('Missing/fractional WW must not become a clear-sky or rounded code');
 if(!data.frame.showers.every(value=>value===null))throw new Error('Unrequested showers must remain Missing');
 // Bei einem Minutenlimit darf MID nicht den zweiten Modellalias nachfeuern. Stattdessen
 // wird ein höchstens 45 Minuten altes bereits belastbares Phasenfeld begrenzt genutzt.
 rateLimited=true;const beforeLimitCalls=phaseBatchCalls,nextTarget=new Date(targetMs+quarterMs).toISOString();
 const fallbackResponse=await module.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(nextTarget)}`),{}),fallback=await fallbackResponse.json();
 if(!fallbackResponse.ok||fallback.stale!==true||!/(?:API-Limit|Minutenlimit)/i.test(String(fallback.fallbackReason||'')))throw new Error(`Rate-Limit-Fallback fehlt: ${JSON.stringify(fallback)}`);
 if(JSON.stringify(fallback.frame.precipitation)!==JSON.stringify(data.frame.precipitation))throw new Error('Stale cache altered Missing/zero semantics');
 if(phaseBatchCalls-beforeLimitCalls!==1)throw new Error(`Rate-Limit löste unnötige Folgeabrufe aus: ${phaseBatchCalls-beforeLimitCalls}.`);

 // Frischer Modulzustand: Ein deutlich zu alter Modelllauf muss weiter abgelehnt werden.
 rateLimited=false;metaInitialMs=testNowMs-12*60*60*1000;
 const staleModule=await import(`../worker/metar-proxy.js?phase-stale=${Date.now()}`);
 const staleResponse=await staleModule.default.fetch(new Request(`https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target=${encodeURIComponent(target)}`),{}),staleData=await staleResponse.json();
 if(staleResponse.ok||!/(?:zu alt|kein geeignetes|keine mit originalmaske|kein verifizierter aktueller)/i.test(String(staleData.error||'')))throw new Error(`Staler Regionalmodell-Lauf wurde nicht abgelehnt: ${JSON.stringify(staleData)}`);

 // #683: The same visible 13x19 map MUST select phase source per cell.
 // D2 has source holes, EU only covers some of them, ICON Global the rest.
 metaInitialMs=targetMs-2*60*60*1000;
 const byModel={dwd_icon_d2_15min:0,dwd_icon_eu:0,dwd_icon:0};
 const iso=new Date(targetMs).toISOString(),hourIso=new Date((Math.floor(targetMs/3600000)+1)*3600000).toISOString(),triple=value=>[value,value,value];
 globalThis.fetch=async request=>{
  const url=new URL(typeof request==='string'?request:request.url);
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json'))
   return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}});
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
   const model=url.searchParams.get('models');
   if(!Object.hasOwn(byModel,model))throw new Error('Prohibited non-ICON source '+model);
   const lats=url.searchParams.get('latitude').split(',').map(Number),lons=url.searchParams.get('longitude').split(',').map(Number);
   byModel[model]+=lats.length;
   return new Response(JSON.stringify(lats.map((lat,i)=>{
    const nativeD2=model==='dwd_icon_d2_15min',available=nativeD2?lat>50.95:model==='dwd_icon_eu'?lat>50.35:true;
    const values={time:triple(nativeD2?iso:hourIso),temperature_2m:triple(1),relative_humidity_2m:triple(95),weather_code:triple(available?nativeD2?61:model==='dwd_icon_eu'?71:87:null),precipitation:triple(available?.5:null),rain:triple(available?.4:null),snowfall:triple(available?0:null),snowfall_height:triple(400),freezing_level_height:triple(500)};
    return {latitude:lat,longitude:lons[i],elevation:50,[nativeD2?'minutely_15':'hourly']:values};
   })),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected original/provider network endpoint '+url);
 };
 const priorityModule=await import('../worker/metar-proxy.js?phase-priority='+Date.now());
 const priorityResponse=await priorityModule.default.fetch(new Request('https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target='+encodeURIComponent(target)),{});
 const priority=await priorityResponse.json();
 if(!priorityResponse.ok)throw new Error('Per-cell priority fixture failed: '+JSON.stringify(priority));
 const sourceCounts=priority.sourceCounts||{},sourceByCell=priority.phaseSourceByCell;
 if(!Array.isArray(sourceByCell)||sourceByCell.length!==247)throw new Error('Missing per-cell source map');
 for(const id of ['dwd-icon-d2','dwd-icon-eu','dwd-icon-global'])if(!(sourceCounts[id]>0))throw new Error('Missing true source tier '+id+': '+JSON.stringify(sourceCounts));
 if(sourceCounts['dwd-icon-d2-ruc']!==0)throw new Error('No original RUC fixture available here');
 if(Object.values(sourceCounts).reduce((a,b)=>a+b,0)!==247)throw new Error('NoData source-selection gaps or duplicates');
 if(byModel.dwd_icon_d2_15min!==247||byModel.dwd_icon_eu<=0||byModel.dwd_icon<=0)throw new Error('Incorrect fallback request inventory '+JSON.stringify(byModel));
 if(priority.requestBudget.modelPointRequests!==Object.values(byModel).reduce((a,b)=>a+b,0))throw new Error('Untruthful model request budget');
 for(let i=0;i<247;i++){
  const id=sourceByCell[i],interval=priority.phaseIntervalMinutesByCell[i],valid=priority.phaseValidTimeByCell[i],run=priority.phaseRunByCell[i];
  if(!run||!valid||!(interval===(id==='dwd-icon-d2'?15:60)))throw new Error('Invalid per-cell run/validity/accumulation interval at '+i);
  if(id==='dwd-icon-d2'&&Date.parse(valid)!==targetMs)throw new Error('Original D2 15-minute valid time drift');
  if(id!=='dwd-icon-d2'&&!(Date.parse(valid)>targetMs&&Date.parse(valid)<=targetMs+3600000))throw new Error('ICON EU/global must use the end stamp of the 1h interval containing target, not an already elapsed hour');
  if(priority.frame.rucRain[i]!==null||priority.frame.rucSnowfallWaterEquivalent[i]!==null)throw new Error('Open-Meteo fallback wrongly labeled as RUC');
 }
 if(priority.provider.includes('native Originalzellen')&&!priority.provider.includes('nicht native Originalzellen'))throw new Error('Open-Meteo interpolated samples impersonate native DWD originals');


 // Code-only model metadata must NOT block a real fallback phase.
 // The derived Open-Meteo weather_code may be finite even when ALL
 // precipitation/rain/snowfall fields are Missing. A numeric code
 // (including 0 = apparently dry, or 71 = snow) does not fill that gap.
 let d2CodeOnlyCells=0,euCodeOnlyFallbackCalls=0;
 globalThis.fetch=async request=>{
  const url=new URL(typeof request==='string'?request:request.url);
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json'))
   return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}});
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
   const model=url.searchParams.get('models'),lats=url.searchParams.get('latitude').split(',').map(Number),lons=url.searchParams.get('longitude').split(',').map(Number);
   const d2=model==='dwd_icon_d2_15min',eu=model==='dwd_icon_eu';
   if(!d2&&!eu)throw new Error('Unexpected global phase request for covered D2/EU NoData fixture');
   if(eu)euCodeOnlyFallbackCalls+=lats.length;
   return new Response(JSON.stringify(lats.map((latitude,i)=>{
    const codeOnly=d2&&latitude>50.9;
    if(codeOnly)d2CodeOnlyCells++;
    return{latitude,longitude:lons[i],elevation:50,[d2?'minutely_15':'hourly']:{
     time:triple(d2?iso:hourIso),
     weather_code:triple(d2?(codeOnly&&latitude>51.1?71:0):61),
     precipitation:triple(d2?(codeOnly?null:0):.3),
     rain:triple(d2?(codeOnly?null:0):.3),
     snowfall:triple(d2?(codeOnly?null:0):0),
     snowfall_height:triple(500),freezing_level_height:triple(900),
     temperature_2m:triple(2),relative_humidity_2m:triple(85)
    }};
   })),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected phase code-only NoData probe '+url);
 };
 const codeOnlyModule=await import('../worker/metar-proxy.js?phase-code-only-nodata='+Date.now());
 const codeOnlyResponse=await codeOnlyModule.default.fetch(new Request('https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target='+encodeURIComponent(target)),{});
 const codeOnlyGrid=await codeOnlyResponse.json();
 if(!codeOnlyResponse.ok)throw new Error('Code-only NoData fallback request failed: '+JSON.stringify(codeOnlyGrid));
 let expectedCodeOnly=0,expectedExplicitDry=0,seenDryCode=0,seenSnowCode=0;
 for(let j=0;j<codeOnlyGrid.lats.length;j++)for(let i=0;i<codeOnlyGrid.lons.length;i++){
  const latitude=codeOnlyGrid.lats[j],k=j*codeOnlyGrid.lons.length+i;
  const source=codeOnlyGrid.phaseSourceByCell[k];
  if(latitude>50.9){
   expectedCodeOnly++;
   if(latitude>51.1)seenSnowCode++;else seenDryCode++;
   if(source!=='dwd-icon-eu'||codeOnlyGrid.frame.rain[k]!==.3||codeOnlyGrid.phaseIntervalMinutesByCell[k]!==60)
    throw new Error('D2 WW-only Missing masked genuine EU phase at '+k+': '+source);
  }else{
   expectedExplicitDry++;
   if(source!=='dwd-icon-d2'||codeOnlyGrid.frame.rain[k]!==0||codeOnlyGrid.frame.snowfall[k]!==0||codeOnlyGrid.phaseIntervalMinutesByCell[k]!==15)
    throw new Error('D2 true zero amounts were not preserved as dry at '+k+': '+source);
  }
 }
 if(!seenDryCode||!seenSnowCode||!expectedExplicitDry||d2CodeOnlyCells!==expectedCodeOnly||euCodeOnlyFallbackCalls!==expectedCodeOnly)
  throw new Error('Code-only 0/71 and real dry 0 negative fixture did not execute all paths.');
 if(codeOnlyGrid.sourceCounts?.['dwd-icon-d2']!==expectedExplicitDry||codeOnlyGrid.sourceCounts?.['dwd-icon-eu']!==expectedCodeOnly)
  throw new Error('Code-only NoData cells were counted as valid D2 coverage '+JSON.stringify(codeOnlyGrid.sourceCounts));

 // Genuine provider behavior (HTTP 400): one out-of-domain D2 point invalidates
 // an entire multi-location call. Valid D2 cells must survive bounded bisection.
 let rejectedD2Groups=0,allD2Calls=0;
 globalThis.fetch=async request=>{
  const url=new URL(typeof request==='string'?request:request.url);
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json'))
   return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000}),{status:200,headers:{'content-type':'application/json'}});
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
   const model=url.searchParams.get('models'),lats=url.searchParams.get('latitude').split(',').map(Number),lons=url.searchParams.get('longitude').split(',').map(Number);
   if(lats.length>120||lats.length!==lons.length)throw new Error('HTTP400-isolation exceeded per-batch request limit');
   if(model==='dwd_icon_d2_15min'){
    allD2Calls++;
    if(lats.some(lat=>lat<=50.55)){
     rejectedD2Groups++;
     return new Response(JSON.stringify({error:true,reason:'No data is available for this location'}),{status:400,headers:{'content-type':'application/json'}});
    }
   }
   if(!['dwd_icon_d2_15min','dwd_icon_eu','dwd_icon'].includes(model))throw new Error('Unexpected non-ICON fallback model '+model);
   const d2=model==='dwd_icon_d2_15min';
   return new Response(JSON.stringify(lats.map((lat,i)=>{
    const available=d2||model==='dwd_icon'?true:lat>50.35;
    return{latitude:lat,longitude:lons[i],elevation:50,[d2?'minutely_15':'hourly']:{
     time:triple(d2?iso:hourIso),weather_code:triple(available?(d2?null:model==='dwd_icon_eu'?71:87):null),
     precipitation:triple(available?.3:null),rain:triple(available?(d2?.3:0):null),snowfall:triple(available?(d2?0:.2):null),
     snowfall_height:triple(300),freezing_level_height:triple(500),temperature_2m:triple(1),relative_humidity_2m:triple(90)
    }}
   })),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected network access '+url);
 };
 const isolatedModule=await import('../worker/metar-proxy.js?phase-http400-isolation='+Date.now());
 const isolatedResponse=await isolatedModule.default.fetch(new Request('https://mid.test/?mode=precipitation-phase-grid&lat=50.82&lon=7.05&target='+encodeURIComponent(target)),{});
 const isolatedData=await isolatedResponse.json();
 if(!isolatedResponse.ok)throw new Error('D2 partial-coverage HTTP400 isolation failed: '+JSON.stringify(isolatedData));
 const expectedValidD2=isolatedData.lats.filter(lat=>lat>50.55).length*isolatedData.lons.length;
 if(!rejectedD2Groups||allD2Calls<4)throw new Error('Fixture never exercised failed batch plus cell bisection');
 if(isolatedData.sourceCounts?.['dwd-icon-d2']!==expectedValidD2)throw new Error('Valid D2 cells lost after a single bad coordinate: '+JSON.stringify(isolatedData.sourceCounts)+' expected '+expectedValidD2);
 if(!(isolatedData.sourceCounts?.['dwd-icon-eu']>0&&isolatedData.sourceCounts?.['dwd-icon-global']>0))throw new Error('Cell holes did not fall through EU/global');
 if(Object.values(isolatedData.sourceCounts).reduce((sum,n)=>sum+n,0)!==247)throw new Error('Partial D2 HTTP400 caused missing/duplicate cells');
 if(isolatedData.requestBudget?.batches>48||isolatedData.requestBudget?.locations!==247)throw new Error('Bisection exceeded bounded request budget');
 for(let j=0;j<isolatedData.lats.length;j++)for(let i=0;i<isolatedData.lons.length;i++){
  const index=j*isolatedData.lons.length+i,source=isolatedData.phaseSourceByCell[index];
  if(isolatedData.lats[j]>50.55&&source!=='dwd-icon-d2')throw new Error('Valid original D2 geographic cell incorrectly replaced at '+index);
  if(isolatedData.lats[j]<=50.55&&source==='dwd-icon-d2')throw new Error('Rejected D2 coordinate admitted as valid at '+index);
 }

 // The real 2026-11-07 Open-Meteo D2 grid advertises north=58.08 in WGS84.
 // Older candidate shortcut north=58 excluded a valid 58.05N D2 point.
 let d2NorthSeen=0,d2OutsideProviderSeen=0;
 globalThis.fetch=async request=>{
  const url=new URL(typeof request==='string'?request:request.url);
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/static/meta.json')){
   const id=url.pathname.includes('dwd_icon_d2_15min')?'d2':url.pathname.includes('dwd_icon_eu')?'eu':'global';
   const bbox=id==='d2'?'BBOX[43.18,-3.94,58.08,20.34]':id==='eu'?'BBOX[29.5,-23.5,70.5,62.5]':'BBOX[-90,-180,90,179.75]';
   return new Response(JSON.stringify({last_run_initialisation_time:metaInitialMs/1000,crs_wkt:'GEOGCRS["WGS 84", '+bbox+']'}),{status:200,headers:{'content-type':'application/json'}});
  }
  if(url.hostname==='api.open-meteo.com'&&url.pathname.includes('/v1/forecast')){
   const model=url.searchParams.get('models'),lats=url.searchParams.get('latitude').split(',').map(Number),lons=url.searchParams.get('longitude').split(',').map(Number),d2=model==='dwd_icon_d2_15min';
   if(d2){d2NorthSeen+=lats.filter(v=>v>58&&v<=58.08).length;d2OutsideProviderSeen+=lats.filter(v=>v>58.1).length;}
   if(!['dwd_icon_d2_15min','dwd_icon_eu','dwd_icon'].includes(model))throw new Error('Non-ICON provider');
   return new Response(JSON.stringify(lats.map((lat,i)=>({latitude:lat,longitude:lons[i],elevation:20,[d2?'minutely_15':'hourly']:{
    time:triple(d2?iso:hourIso),weather_code:triple(d2?null:71),precipitation:triple(.1),rain:triple(d2?.1:0),snowfall:triple(d2?0:.1),
    snowfall_height:triple(500),freezing_level_height:triple(700),temperature_2m:triple(1),relative_humidity_2m:triple(90)
   }}))),{status:200,headers:{'content-type':'application/json'}});
  }
  throw new Error('Unexpected model grid probe '+url);
 };
 const northernModule=await import('../worker/metar-proxy.js?phase-d2-north-WKT='+Date.now());
 const northernResponse=await northernModule.default.fetch(new Request('https://mid.test/?mode=precipitation-phase-grid&lat=58.05&lon=7.05&target='+encodeURIComponent(target)),{});
 const northern=await northernResponse.json();
 if(!northernResponse.ok)throw new Error('Northern grid shortlist failed: '+JSON.stringify(northern));
 const near58=northern.lats.findIndex(lat=>Math.abs(lat-58.05)<.001),centerLonIndex=Math.floor(northern.lons.length/2);
 if(near58<0||northern.phaseSourceByCell[near58*northern.lons.length+centerLonIndex]!=='dwd-icon-d2')throw new Error('D2 actual 58.05N grid cell was cropped');
 if(!d2NorthSeen||d2OutsideProviderSeen)throw new Error('D2 WKT shortlist is misaligned: north='+d2NorthSeen+' outside='+d2OutsideProviderSeen);
 if(!northern.sourceCounts?.['dwd-icon-eu']||!northern.sourceCounts?.['dwd-icon-d2'])throw new Error('Both native-boundary D2 and EU outside D2 must coexist');


 // A stalled Open-Meteo response BODY must be cancelled by the SAME signal
 // that guards HTTP headers. Header-only timeouts are insufficient for a
 // 28-second browser map deadline, and NoData must never turn into a zero.
 const {createContext,runInContext}=await import('node:vm');
 const phaseSource=await readFile(new URL('../worker-src/20-composite-models.js',import.meta.url),'utf8');
 const helperStart=phaseSource.indexOf('async function midPhaseJsonResponse(');
 const helperEnd=phaseSource.indexOf('\nasync function phaseModelMetadata(',helperStart);
 if(helperStart<0||helperEnd<=helperStart)throw new Error('Phase full-body timeout helper missing from source.');
 const bodyAbortCalls=[];
 const abortContext=createContext({
  URL,Response,DOMException,AbortController,Date,setTimeout,clearTimeout,
  openMeteoQuotaOrigin:()=>null,openMeteoQuotaCooldownByOrigin:new Map(),rememberOpenMeteoQuota:()=>{},
  fetch:async(_url,init)=>new Response(new ReadableStream({
   start(controller){
    init.signal.addEventListener('abort',()=>{
     bodyAbortCalls.push('aborted');
     controller.error(new Error('aborted stalled phase JSON body'));
    },{once:true});
   }
  }),{status:200,headers:{'content-type':'application/json'}})
 });
 runInContext(phaseSource.slice(helperStart,helperEnd),abortContext,{timeout:2000});
 let bodyRejected=false;
 try{await runInContext('midPhaseJsonResponse("https://api.open-meteo.com/v1/forecast",{},35)',abortContext,{timeout:2000})}
 catch(error){bodyRejected=/aborted stalled phase JSON body|abort/i.test(String(error))}
 if(!bodyRejected||bodyAbortCalls.length!==1)throw new Error('A stalled JSON body passed the phase deadline or was not aborted: '+bodyAbortCalls.length);
 abortContext.fetch=async()=>new Response(JSON.stringify({precipitation:0,rain:null}),{status:200,headers:{'content-type':'application/json'}});
 const immediate=await runInContext('midPhaseJsonResponse("https://api.open-meteo.com/v1/forecast",{},200)',abortContext,{timeout:2000});
 if(!immediate.response.ok||immediate.payload.precipitation!==0||immediate.payload.rain!==null)
  throw new Error('Full-body response helper changed genuine dry zero or Missing null.');

}finally{globalThis.fetch=realFetch}
console.log('Radar-/Regionalmodell-Phasenraster geprüft: dynamische Rapid-/Regionalmodellwahl, 13×19/247 Punkte, 3 sequenzielle Batches, Rate-Limit-Fallback und Stale-Run-Abbruch.');
