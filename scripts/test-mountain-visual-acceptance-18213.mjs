import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {access,mkdir,mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {preview} from 'vite';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const chromiumCandidates=[process.env.CHROMIUM_PATH,'/repl/tools/bin/chromium','/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean);
let chromiumPath;
for(const candidate of chromiumCandidates){try{await access(candidate);chromiumPath=candidate;break}catch{}}
if(!chromiumPath){
 console.log('Bergwetter-Visualmatrix übersprungen: Chromium ist in dieser Umgebung nicht verfügbar.');
 process.exit(0);
}

const viewports=[
 {id:'iphone-narrow',label:'iPhone schmal',width:390,height:844},
 {id:'iphone-wide',label:'iPhone breit',width:430,height:932},
 {id:'android-width',label:'Android-Breite',width:412,height:915},
 {id:'ipad-portrait',label:'iPad Hochformat',width:834,height:1194},
 {id:'ipad-landscape',label:'iPad Querformat',width:1194,height:834},
 {id:'desktop',label:'Desktop',width:1440,height:900},
];
const themes=['light','dark'];
const mountainOnly=process.env.MID_MOUNTAIN_ONLY==='1';
const twoStations=process.env.MID_MOUNTAIN_TWO_STATIONS==='1';
const profile=await mkdtemp(path.join(os.tmpdir(),'mid-mountain-cdp-'));
const visualDir=process.env.MID_MOUNTAIN_VISUAL_DIR?path.resolve(root,process.env.MID_MOUNTAIN_VISUAL_DIR):null;
const screenshotDir=visualDir?path.join(visualDir,'screenshots'):null;
let server,chrome,socket,commandId=0,sessionId;
const pending=new Map(),browserErrors=[],delay=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

async function waitFor(label,check,timeout=45000){
 const until=Date.now()+timeout;
 let lastError;
 while(Date.now()<until){
  try{const value=await check();if(value)return value}catch(error){lastError=error}
  await delay(250);
 }
 throw new Error(`${label} wurde nicht rechtzeitig erreicht.${lastError?` Letzter Fehler: ${lastError.message}`:''}`);
}
function cdp(method,params={},targetSession=sessionId){
 return new Promise((resolve,reject)=>{
  const id=++commandId;
  pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params,...(targetSession?{sessionId:targetSession}:{})}));
 });
}
async function evaluate(expression){
 const response=await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(response.result.exceptionDetails)throw new Error(response.result.exceptionDetails.text||'Browser-Ausdruck fehlgeschlagen.');
 return response.result.result?.value;
}
async function waitForValue(label,expression,predicate,timeout=45000){
 return waitFor(label,async()=>{
  const value=await evaluate(expression);
  return predicate(value)?value:null;
 },timeout);
}
async function clickAt(selector,index=0){
 const point=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})][${index}];if(!e||e.disabled)return null;e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 assert.ok(point,`Interaktionsziel fehlt oder ist deaktiviert: ${selector}[${index}]`);
 await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
 await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
 await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',buttons:0,clickCount:1});
}
async function clickButtonContaining(selector,text){
 const point=await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(button=>button.textContent.includes(${JSON.stringify(text)}));if(!e||e.disabled)return null;e.scrollIntoView({block:'center',inline:'center',behavior:'instant'});const r=e.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}})()`);
 assert.ok(point,`Schaltfläche mit "${text}" fehlt oder ist deaktiviert.`);
 await cdp('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});
 await cdp('Input.dispatchMouseEvent',{type:'mousePressed',x:point.x,y:point.y,button:'left',buttons:1,clickCount:1});
 await cdp('Input.dispatchMouseEvent',{type:'mouseReleased',x:point.x,y:point.y,button:'left',buttons:0,clickCount:1});
}
async function clickIfClosed(selector){
 const expanded=await evaluate(`document.querySelector(${JSON.stringify(selector)})?.getAttribute('aria-expanded')||''`);
 if(expanded!=='true')await clickAt(selector);
}
async function navigateToForecast(){
 const visible=await evaluate(`Boolean([...document.querySelectorAll('.modern-forecast-horizons>button')].some(button=>button.getClientRects().length&&button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height>0))`);
 if(visible)return;
 await clickButtonContaining('.dashboard-bottom-tabs button','Vorhersage');
 await waitForValue('Aktive Forecast-Ansicht',`Boolean([...document.querySelectorAll('.modern-forecast-horizons>button')].some(button=>button.getClientRects().length&&button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height>0))`,Boolean);
}
async function navigateToMountain(){
 const readyExpression=`(()=>{const root=[...document.querySelectorAll('.mountain-ski')].find(node=>node.getClientRects().length>0&&node.getBoundingClientRect().width>0);return Boolean(root?.querySelector('.mountain-current-source')&&root.querySelector('.mountain-seven-day'))})()`;
 if(await evaluate(readyExpression))return;
 const visible=await evaluate(`Boolean([...document.querySelectorAll('.mountain-ski')].some(node=>node.getClientRects().length>0&&node.getBoundingClientRect().width>0))`);
 if(!visible){
  await clickButtonContaining('.dashboard-bottom-tabs button','Mehr');
  await waitForValue('Geöffnete Mehr-Navigation',`Boolean(document.querySelector('.dashboard-section-drawer .dashboard-section-nav-list.drawer'))`,Boolean);
  await clickButtonContaining('.dashboard-section-drawer .dashboard-section-nav-list.drawer button','Berg- und Wintersport');
 }
 await waitForValue('Bereit gerenderte Bergansicht',readyExpression,Boolean,60000);
}
async function measureControls(selector){
 const measurement=await evaluate(`(()=>{
  const selector=${JSON.stringify(selector)},visible=node=>{const r=node.getBoundingClientRect(),style=getComputedStyle(node);return node.getClientRects().length>0&&r.width>0&&r.height>0&&style.display!=='none'&&style.visibility!=='hidden'&&style.visibility!=='collapse'};
  return JSON.stringify([...document.querySelectorAll(selector)].filter(visible).map(node=>{
   node.scrollIntoView({block:'center',inline:'center',behavior:'instant'});
   const r=node.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
   return{label:(node.innerText||node.getAttribute('aria-label')||node.className||'control').trim().replace(/\\\\s+/g,' ').slice(0,48),width:r.width,height:r.height,left:r.left,top:r.top,hit:hit===node||node.contains(hit),hitTarget:hit?hit.tagName.toLowerCase()+'.'+String(hit.className?.baseVal??hit.className??'').replace(/\\\\s+/g,'.'):'none'};
  }));
 })()`);
 return JSON.parse(measurement);
}
async function setViewport(width,height,theme){
 await cdp('Emulation.setDeviceMetricsOverride',{
  width,height,deviceScaleFactor:1,mobile:width<=850,
  screenWidth:width,screenHeight:height,
  screenOrientation:{type:width>height?'landscapePrimary':'portraitPrimary',angle:width>height?90:0},
 });
 await evaluate(`(()=>{document.documentElement.dataset.theme=${JSON.stringify(theme)};localStorage.setItem('theme',${JSON.stringify(theme)});return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))})()`);
}
async function scrollMountainToTop(){
 await evaluate(`(()=>{const e=document.querySelector('.mountain-ski');if(e)window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+window.scrollY-8))})()`);
}
async function closeOpenMountainDays(){
 const open=await evaluate(`document.querySelector('.mountain-day-toggle[aria-expanded="true"]')?1:0`);
 if(open)await clickAt('.mountain-day-toggle[aria-expanded="true"]');
 await waitForValue('Geschlossene Berg-Tagesdetails',`[...document.querySelectorAll('.mountain-day-toggle')].every(button=>button.getAttribute('aria-expanded')!=='true')`,Boolean);
}
async function verifyMountainMatrix(label){
 const initial=JSON.parse(await evaluate(`(()=>{
  const root=[...document.querySelectorAll('.mountain-ski')].find(node=>node.getClientRects().length>0&&node.getBoundingClientRect().width>0),overview=root?.querySelector('.mountain-forecast-overview'),seven=overview?.querySelector(':scope > .mountain-seven-day'),matrix=overview?.querySelector(':scope > .mountain-forecast-matrix'),summary=matrix?.querySelector('.mountain-forecast-summary');
  return JSON.stringify({afterSevenDays:Boolean(seven&&seven.nextElementSibling===matrix),children:overview?[...overview.children].map(node=>node.className||node.tagName):[],label:summary?.textContent.trim()||'',expanded:summary?.getAttribute('aria-expanded')||'',hiddenContent:!matrix?.querySelector('.mountain-forecast-content')})
 })()`));
 assert.ok(initial.afterSevenDays,`${label}: Höhenvergleich folgt nicht direkt auf die Sieben-Tage-Ansicht (${JSON.stringify(initial)}).`);
 assert.ok(initial.label.includes('Höhenvergleich'),`${label}: sichtbare Bezeichnung „Höhenvergleich“ fehlt (${initial.label}).`);
 assert.equal(initial.expanded,'false',`${label}: Höhenvergleich muss standardmäßig geschlossen sein.`);
 assert.ok(initial.hiddenContent,`${label}: geschlossener Höhenvergleich rendert bereits Matrix-Inhalt.`);
 await clickAt('.mountain-forecast-summary');
 await waitForValue(`${label}: Höhenvergleich geöffnet`,`document.querySelector('.mountain-forecast-summary')?.getAttribute('aria-expanded')||''`,value=>value==='true');
 const visible=JSON.parse(await evaluate(`(()=>{
  const matrix=document.querySelector('.mountain-forecast-matrix'),levels=[...matrix.querySelectorAll('.mountain-matrix-level')],timeRow=matrix.querySelector('.mountain-matrix-level .mountain-matrix-row'),scroll=matrix.querySelector('.mountain-matrix-scroll');
  return JSON.stringify({roles:levels.map(node=>node.dataset.levelRole),headers:levels.map(node=>node.querySelector(':scope > header b')?.textContent.trim()||''),windArrows:matrix.querySelectorAll('.mountain-matrix-wind-arrow[role="img"][aria-label]').length,windWarningCells:matrix.querySelectorAll('.mountain-matrix-row>span[class*="mountain-wind-warning-"]').length,timeCells:timeRow?.querySelectorAll(':scope > span').length||0,threeHourSelected:matrix.querySelector('.mountain-matrix-controls button[aria-pressed="true"]')?.textContent.trim()||'',scroll:scroll?{clientWidth:scroll.clientWidth,scrollWidth:scroll.scrollWidth}:null,documentWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth})
 })()`));
 const expectedRoles=twoStations?['valley','summit']:['valley','middle','summit'];
 assert.deepEqual(visible.roles,expectedRoles,`${label}: Höhenvergleich muss nur vorhandene Tal-/Mitte-/Bergstationen zeigen.`);
 for(const [role,station] of [['valley','Talstation'],['middle','Mittelstation'],['summit','Bergstation']])if(expectedRoles.includes(role))assert.ok(visible.headers[expectedRoles.indexOf(role)].startsWith(station),`${label}: Rollenlabel ${station} fehlt (${visible.headers.join(' | ')}).`);
 assert.ok(visible.windArrows>0,`${label}: Matrix-Windrichtungspfeile fehlen.`);
 assert.ok(visible.windWarningCells>0,`${label}: Warnfarben für starke Matrix-Böen fehlen.`);
 assert.ok(visible.timeCells>0&&visible.threeHourSelected==='3 h',`${label}: 3-h-Ansicht ist nicht initial ausgewählt.`);
 assert.ok(visible.scroll&&visible.scroll.scrollWidth>=visible.scroll.clientWidth,`${label}: Matrix besitzt keinen eigenen horizontalen Overflowbereich.`);
 assert.ok(visible.documentWidth<=visible.viewportWidth+1,`${label}: geöffnete Matrix erweitert die Dokumentbreite (${visible.documentWidth}/${visible.viewportWidth}).`);
 const threeHourCells=visible.timeCells;
 await clickButtonContaining('.mountain-matrix-controls button','1 h');
 const oneHourCells=await waitForValue(`${label}: 1-h-Auflösung`,`document.querySelector('.mountain-matrix-level .mountain-matrix-row')?.querySelectorAll(':scope > span').length||0`,value=>value>threeHourCells);
 assert.ok(oneHourCells>threeHourCells,`${label}: 1-h-Auflösung zeigt nicht mehr Zeitpunkte als 3 h (${oneHourCells}/${threeHourCells}).`);
 await clickButtonContaining('.mountain-matrix-controls button','3 h');
 await waitForValue(`${label}: 3-h-Auflösung wiederhergestellt`,`document.querySelector('.mountain-matrix-controls button[aria-pressed="true"]')?.textContent.trim()||''`,value=>value==='3 h');
 await clickAt('.mountain-forecast-summary');
 await waitForValue(`${label}: Höhenvergleich wieder geschlossen`,`document.querySelector('.mountain-forecast-summary')?.getAttribute('aria-expanded')||''`,value=>value==='false');
}
async function snapshotWindAndWeather(){
 return await evaluate(`(()=>{
  const metrics=[...document.querySelectorAll('.mountain-current-rail .mid-metric')];
  const find=label=>metrics.find(item=>item.querySelector('.mid-metric-label')?.textContent.trim()===label);
  return JSON.stringify({
   currentWind:document.querySelector('.mountain-wind-value')?.textContent.trim()||'',
   dayWind:document.querySelector('.mountain-day-wind b')?.textContent.trim()||'',
   periodWind:document.querySelector('.mountain-period-wind')?.textContent.trim()||'',
   temperature:find('Temperatur')?.querySelector('strong')?.textContent.trim()||'',
   currentPrecipitation:find('Niederschlag')?.querySelector('strong')?.textContent.trim()||'',
   periodPrecipitation:document.querySelector('.mountain-period-precip')?.textContent.trim()||''
  })
 })()`);
}
function browserPrelude(favorite,location,mountain){
 return `(()=>{
  const favorite=${JSON.stringify(favorite)},fixtureLocation=${JSON.stringify(location)},mountain=${JSON.stringify(mountain)};
  const favs=JSON.stringify([favorite]),hourMs=3600000,now=Date.now(),start=Math.floor(now/hourMs)*hourMs-24*hourMs;
  const berlinParts=epoch=>Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vienna',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date(epoch)).map(part=>[part.type,part.value]));
  const localIso=epoch=>{const p=berlinParts(epoch);return p.year+'-'+p.month+'-'+p.day+'T'+p.hour+':'+p.minute};
   const currentLocalHour=Number(localIso(now).slice(11,13));
   const times=Array.from({length:193},(_,index)=>localIso(start+index*hourMs));
  const dayKeys=[...new Set(times.map(value=>value.slice(0,10)))].slice(1,9);
  const levels=[
   {latitude:mountain.valleyLatitude,longitude:mountain.valleyLongitude,elevation:mountain.valleyElevation,role:0,temp:-2,wind:27,gust:40,name:mountain.valleyName},
   {latitude:mountain.middleLatitude,longitude:mountain.middleLongitude,elevation:mountain.middleElevation,role:1,temp:-7,wind:42,gust:59,name:mountain.middleName},
   {latitude:mountain.summitLatitude,longitude:mountain.summitLongitude,elevation:mountain.summitElevation,role:2,temp:-12,wind:52,gust:90,name:mountain.summitName}
  ];
   window.__mountainFixtureExpectedPrecipitation={times,byRole:levels.map(point=>({role:point.role,values:times.map(time=>{const localHour=Number(time.slice(11,13)),hoursFromNow=(localHour-currentLocalHour+24)%24,wet=hoursFromNow<=3||(localHour>=8&&localHour<=13);return point.role===1?null:wet?(point.role===0?1.2:2.3):0})}))};
  const makePoint=(point,index)=>{
   const hourly={time:times};
   const keys=['temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation_probability','precipitation','rain','showers','snowfall','snow_depth','weather_code','cloud_cover','cloud_cover_low','visibility','freezing_level_height','wet_bulb_temperature_2m','wind_speed_10m','wind_gusts_10m','wind_direction_10m','uv_index','cape','is_day','sunshine_duration','lifted_index','convective_inhibition','total_column_integrated_water_vapour','temperature_850hPa'];
   for(const pressure of [1000,950,925,900,850,800,700,600])keys.push('cloud_cover_'+pressure+'hPa','geopotential_height_'+pressure+'hPa');
   for(const key of keys)hourly[key]=times.map((time,i)=>{
    const localHour=Number(time.slice(11,13)),isDay=localHour>=7&&localHour<19?1:0,hoursFromNow=(localHour-currentLocalHour+24)%24,wet=hoursFromNow<=3||(localHour>=8&&localHour<=13);
    const snow=wet&&point.role>0?.65:0,precip=wet?(point.role===0?1.2:2.3):0;
    const values={
     temperature_2m:point.temp+Math.sin(i/8)*2,apparent_temperature:point.temp-5,
     relative_humidity_2m:wet?94:70,dew_point_2m:point.temp-3,
     precipitation_probability:wet?91:18,precipitation:precip,rain:point.role===0?precip:0,showers:0,snowfall:snow,
     snow_depth:point.role===0?.12:point.role===1?.34:.58,
     weather_code:wet?(point.role===0?61:71):(isDay?1:3),cloud_cover:wet?92:48,cloud_cover_low:wet?82:32,
     visibility:wet?4200:14000,freezing_level_height:point.role===0?1550:1050,wet_bulb_temperature_2m:point.temp-2,
     wind_speed_10m:point.wind,wind_gusts_10m:point.gust,wind_direction_10m:292,uv_index:isDay?2.4:0,cape:wet?110:20,
     is_day:isDay,sunshine_duration:isDay?1800:0,lifted_index:i%17===0?null:-1.4,
     convective_inhibition:i%19===0?null:14,total_column_integrated_water_vapour:wet?17:10,
     temperature_850hPa:-5+Math.sin(i/24),cloud_cover_1000hPa:wet?92:48,cloud_cover_950hPa:wet?84:42,
     cloud_cover_925hPa:wet?76:38,cloud_cover_900hPa:wet?70:34,cloud_cover_850hPa:wet?64:29,
     cloud_cover_800hPa:wet?58:26,cloud_cover_700hPa:wet?45:20,cloud_cover_600hPa:wet?35:15,
     geopotential_height_1000hPa:110,geopotential_height_950hPa:540,geopotential_height_925hPa:760,
     geopotential_height_900hPa:980,geopotential_height_850hPa:1500,geopotential_height_800hPa:1950,
     geopotential_height_700hPa:3050,geopotential_height_600hPa:4200
    };
     if(point.role===1&&key==='precipitation')return null;
     return values[key];
   });
   const localHour=Number(localIso(now).slice(11,13)),isDay=localHour>=7&&localHour<19?1:0;
   const current={time:new Date(now).toISOString(),temperature_2m:point.temp,apparent_temperature:point.temp-5,relative_humidity_2m:82,dew_point_2m:point.temp-3,precipitation:1.4,rain:point.role===0?1.4:0,showers:0,snowfall:point.role===0?0:.6,snow_depth:point.role===0?.12:point.role===1?.34:.58,weather_code:point.role===0?61:71,cloud_cover:82,cloud_cover_low:72,visibility:5200,freezing_level_height:1200,wet_bulb_temperature_2m:point.temp-2,wind_speed_10m:point.wind,wind_gusts_10m:point.gust,wind_direction_10m:292,uv_index:isDay?2.4:0,cape:90,is_day:isDay,temperature_850hPa:-5,geopotential_height_850hPa:1500};
   const daily={time:dayKeys,temperature_2m_max:dayKeys.map((_,d)=>point.temp+3+d%2),temperature_2m_min:dayKeys.map((_,d)=>point.temp-4-d%2),precipitation_sum:dayKeys.map(()=>point.role===1?null:14),precipitation_probability_max:dayKeys.map(()=>91),rain_sum:dayKeys.map(()=>point.role===0?14:0),showers_sum:dayKeys.map(()=>0),snowfall_sum:dayKeys.map(()=>point.role===0?0:4.2),precipitation_hours:dayKeys.map(()=>6),weather_code:dayKeys.map(()=>point.role===0?61:71),wind_speed_10m_max:dayKeys.map(()=>point.wind),wind_gusts_10m_max:dayKeys.map(()=>point.gust),wind_direction_10m_dominant:dayKeys.map(()=>292),uv_index_max:dayKeys.map(()=>3.2),sunshine_duration:dayKeys.map(()=>point.role===0?18000:10800),sunrise:dayKeys.map(date=>date+'T06:20'),sunset:dayKeys.map(date=>date+'T18:35')};
   return{latitude:point.latitude,longitude:point.longitude,elevation:point.elevation,timezone:'Europe/Vienna',timezone_abbreviation:'CEST',utc_offset_seconds:7200,current,hourly,daily};
  };
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  window.__mountainFixtureRequests=[];
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   const raw=typeof input==='string'?input:input?.url||String(input),url=new URL(raw,window.location.href);
   window.__mountainFixtureRequests.push(url.href);
   if(url.hostname==='api.open-meteo.com'&&url.pathname==='/v1/forecast'){
    const latitudes=(url.searchParams.get('latitude')||'47.2692').split(','),longitudes=(url.searchParams.get('longitude')||'11.4041').split(','),elevations=(url.searchParams.get('elevation')||'574').split(',');
     const requested=latitudes.map((latitude,index)=>{
      const elevation=Number(elevations[index]||elevations[0]),role=levels.reduce((best,point)=>Math.abs(point.elevation-elevation)<Math.abs(levels[best].elevation-elevation)?point.role:best,0);
      return makePoint({latitude:Number(latitude),longitude:Number(longitudes[index]||longitudes[0]),elevation,role,temp:[-2,-7,-12][role],wind:[27,42,52][role],gust:[40,59,90][role]},index);
     });
    return json(requested.length===1?requested[0]:requested);
   }
   if(url.hostname==='api.open-meteo.com'&&url.pathname==='/v1/elevation')return json({elevation:[1100,2200,3300]});
   if(url.hostname==='ensemble-api.open-meteo.com'){
    const count=Math.max(25,Math.min(361,Number(url.searchParams.get('forecast_days')||7)*24+1));
    const ensembleTimes=Array.from({length:count},(_,i)=>localIso(Math.floor(now/hourMs)*hourMs+i*hourMs)),hourly={time:ensembleTimes};
    for(const key of (url.searchParams.get('hourly')||'').split(','))if(key&&key!=='time')hourly[key]=ensembleTimes.map((_,i)=>key.includes('spread')?180:key.includes('temperature_850hPa')?-5+Math.sin(i/24):key.includes('geopotential_height_850hPa')?1500:key.includes('snowfall_height')?1200:key.includes('freezing_level_height')?1450:null);
    return json({timezone:'Europe/Vienna',utc_offset_seconds:7200,hourly});
   }
   if(url.searchParams.get('mode')==='geosphere-snow')return json({available:true,valueCm:136,stationName:'Hochgebirgs-Schneemessstation Kitzbüheler Alpen · Teststation mit langem Namen',stationId:'MID-VISUAL-01',stationElevation:pointElevation(url.searchParams.get('elevation')),distanceKm:4.2,heightDifferenceM:28,observedAt:new Date().toISOString(),provider:'GeoSphere Austria'});
   if(url.hostname.endsWith('.invalid'))return json({available:false,error:'Deterministischer Testadapter'});
   if(url.hostname.startsWith('overpass.'))return json({elements:[]});
   return originalFetch(input,init);
  };
  function pointElevation(value){const number=Number(value);return Number.isFinite(number)?number:2200}
  localStorage.setItem('theme','light');
  localStorage.setItem('windUnit','kn');
  localStorage.setItem('mid:favorites',favs);
  localStorage.setItem('mid:favorites:shadow:v1',favs);
  localStorage.setItem('mid:favorites:updated-at',new Date().toISOString());
  localStorage.setItem('mid:favorites:order:v1',JSON.stringify({ids:[favorite.id],updatedAt:new Date().toISOString()}));
  localStorage.setItem('mid:mountain:47.26920:11.40410',JSON.stringify(mountain));
  localStorage.setItem('mid:lastLocation',JSON.stringify(fixtureLocation));
  localStorage.setItem('mid:last-dashboard-section:v1','mountain');
  localStorage.setItem('mid:module-open-contract:v6','1');
  localStorage.setItem('mid:module:mountain','1');
  localStorage.setItem('mid:layoutMode','advanced');
  localStorage.setItem('metarProxyUrl','https://mountain-fixture.invalid/worker');
 })();`;
}

try{
 if(screenshotDir)await mkdir(screenshotDir,{recursive:true});
 server=await preview({root,logLevel:'silent',preview:{host:'127.0.0.1',port:0,strictPort:true}});
 const address=server.httpServer.address(),baseUrl=`http://127.0.0.1:${address.port}`;
 await waitFor('Vite-Produktionsvorschau',async()=>{const response=await fetch(baseUrl);return response.ok});

 chrome=spawn(chromiumPath,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--remote-debugging-port=0','--remote-allow-origins=*',`--user-data-dir=${profile}`,'about:blank',
 ],{stdio:'ignore'});
 const activePortPath=path.join(profile,'DevToolsActivePort');
 const remotePort=await waitFor('Chromium-CDP-Port',async()=>{try{return(await readFile(activePortPath,'utf8')).split('\n')[0]}catch{return null}});
 const browserInfo=await fetch(`http://127.0.0.1:${remotePort}/json/version`).then(response=>response.json());
 socket=new WebSocket(browserInfo.webSocketDebuggerUrl);
 socket.addEventListener('message',event=>{
  let packet;
  try{packet=JSON.parse(typeof event.data==='string'?event.data:Buffer.from(event.data).toString())}catch{return}
  if(!packet.id){
   if(packet.method==='Runtime.exceptionThrown')browserErrors.push({type:'exception',text:packet.params?.exceptionDetails?.text,description:packet.params?.exceptionDetails?.exception?.description,stack:packet.params?.exceptionDetails?.exception?.description});
   if(packet.method==='Runtime.consoleAPICalled'&&packet.params?.type==='error')browserErrors.push({type:'console',args:(packet.params.args||[]).map(item=>item.value??item.description??item.type)});
   return;
  }
  const request=pending.get(packet.id);
  if(!request)return;
  pending.delete(packet.id);
  if(packet.error)request.reject(new Error(packet.error.message));else request.resolve(packet);
 });
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
 const target=await cdp('Target.createTarget',{url:'about:blank'},undefined);
 const attached=await cdp('Target.attachToTarget',{targetId:target.result.targetId,flatten:true},undefined);
 sessionId=attached.result.sessionId;
 await cdp('Page.enable');
 await cdp('Runtime.enable');
 await cdp('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true,screenWidth:390,screenHeight:844,screenOrientation:{type:'portraitPrimary',angle:0}});

 const location={id:'innsbruck-visual-fixture',name:'Innsbruck',latitude:47.2692,longitude:11.4041,elevation:574,country:'Österreich',country_code:'AT',timezone:'Europe/Vienna'};
 const mountain={
  schemaVersion:2,enabled:true,season:'winter',middleEnabled:!twoStations,
  valleyElevation:1100,middleElevation:2200,summitElevation:3300,
  valleyName:'Talstation Sonnwies · Kitzbüheler Alpen, Testprofil mit langem Stationsnamen',
  middleName:'Mittelstation Panoramaalm · Kitzbüheler Alpen, Testprofil mit langem Stationsnamen',
  summitName:'Bergstation Hahnenkamm · Kitzbüheler Alpen, Testprofil mit langem Stationsnamen',
  valleyLatitude:47.30,valleyLongitude:11.35,middleLatitude:47.28,middleLongitude:11.38,summitLatitude:47.25,summitLongitude:11.40,
  profileSource:'manual',profileConfidence:'high',profileUpdatedAt:'2026-09-25T12:00:00.000Z',
 };
 const favorite={id:'mid-18-2-13-visual-fixture',location,alias:'MID 18.2.13 Winter-Testprofil',group:'Visualtests',isDefault:true,rules:{enabled:false},mountain,water:{enabled:false,waterType:'auto',activity:'general',maxWaveHeight:1.5,maxGustKt:28,minWaterTemperature:15}};
 await cdp('Page.addScriptToEvaluateOnNewDocument',{source:browserPrelude(favorite,location,mountain)});
 await cdp('Page.navigate',{url:`${baseUrl}/#mid-section-mountain`});
 await waitForValue('MID-Oberfläche',`Boolean(document.querySelector('.dashboard-bottom-tabs'))`,Boolean);
  try{
   const appReadiness=await waitForValue('Bergwetter mit Fixture-Daten',`(()=>{if(document.querySelector('#root .mid-startup-recovery'))return'recovery';return document.querySelector('.mountain-ski')&&document.querySelector('.mountain-current-source')&&document.querySelector('.mountain-seven-day-row')?'ready':''})()`,value=>Boolean(value),60000);
   assert.equal(appReadiness,'ready','Die App hat statt der Bergwetter-Oberfläche den Start-Recovery-Zustand angezeigt.');
  }catch(error){
   const diagnostic=await evaluate(`JSON.stringify({hash:location.hash,fixture:window.__mountainFixtureRequests?.slice(-12),body:document.body.innerText.slice(0,1800),root:document.querySelector('#root')?.innerHTML.slice(0,5000),bootStage:document.querySelector('#mid-boot-stage')?.textContent,guard:!!document.querySelector('#root .mid-startup-recovery'),mountain:document.querySelector('.mountain-ski')?.outerHTML.slice(0,1200),favorite:localStorage.getItem('mid:favorites'),lastStartError:localStorage.getItem('mid:runtime:last-start-error')})`);
   console.error(`Bergwetter-Browserdiagnose: ${diagnostic}\nBrowserfehler: ${JSON.stringify(browserErrors.slice(-20))}`);
  throw error;
 }

   const seasonalPriority={
    winter:{
     current:['mountain-metric-temperature','mountain-metric-feel','mountain-metric-wind','mountain-metric-new-snow','mountain-metric-snow-depth','mountain-metric-visibility','mountain-metric-low-cloud','mountain-metric-precipitation','mountain-metric-snowline','mountain-metric-sunshine','mountain-metric-uv','mountain-metric-thunder'],
     peak:['mountain-indicator-snowline','mountain-indicator-new-snow','mountain-indicator-visibility','mountain-indicator-low-cloud','mountain-indicator-thunder','mountain-indicator-windchill','mountain-indicator-cloud-base','mountain-indicator-freezing','mountain-indicator-daylight','mountain-indicator-uv'],
    },
    summer:{
     current:['mountain-metric-temperature','mountain-metric-wind','mountain-metric-thunder','mountain-metric-precipitation','mountain-metric-visibility','mountain-metric-low-cloud','mountain-metric-uv','mountain-metric-feel','mountain-metric-sunshine','mountain-metric-new-snow','mountain-metric-snow-depth','mountain-metric-snowline'],
     peak:['mountain-indicator-visibility','mountain-indicator-low-cloud','mountain-indicator-thunder','mountain-indicator-windchill','mountain-indicator-cloud-base','mountain-indicator-freezing','mountain-indicator-daylight','mountain-indicator-snowline','mountain-indicator-uv'],
    },
   };
   for(const season of ['winter','summer']){
    await clickButtonContaining('.mountain-season-control button',season==='winter'?'Winter':'Sommer');
    await waitForValue(`${season}: Saisonreihenfolge aktiviert`,`document.querySelector('.mountain-current-rail')?.getAttribute('data-season')||''`,value=>value===season);
    const priorities=JSON.parse(await evaluate(`(()=>{
     const ordered=(selector,prefix)=>[...document.querySelectorAll(selector)].sort((a,b)=>Number(getComputedStyle(a).order)-Number(getComputedStyle(b).order)).map(node=>[...node.classList].find(name=>name.startsWith(prefix)));
     return JSON.stringify({current:ordered('.mountain-current-rail>.mid-metric','mountain-metric-'),peak:ordered('.mountain-peak-indicators>article','mountain-indicator-')});
    })()`));
    assert.deepEqual(priorities.current,seasonalPriority[season].current,`${season}: aktuelle Kennzahlen haben nicht die vorgesehene Saisonpriorität (${priorities.current.join(', ')}).`);
    assert.deepEqual(priorities.peak,seasonalPriority[season].peak,`${season}: Bergstations-Kennwerte haben nicht die vorgesehene Saisonpriorität (${priorities.peak.join(', ')}).`);
   }

  const initialDays=JSON.parse(await evaluate(`JSON.stringify({rows:document.querySelectorAll('.mountain-day-toggle:not(:disabled)').length,expanded:[...document.querySelectorAll('.mountain-day-toggle')].filter(button=>button.getAttribute('aria-expanded')==='true').length,periodCards:document.querySelectorAll('.mountain-period-card').length})`));
  assert.ok(initialDays.rows>=7,`Sieben-Tage-Übersicht hat nur ${initialDays.rows} bedienbare Tageszeilen.`);
  assert.equal(initialDays.expanded,0,'Forecast-Tagesdetails müssen zunächst geschlossen sein.');
  assert.equal(initialDays.periodCards,0,'Stundenintervalle dürfen vor Öffnen eines Tages nicht sichtbar sein.');
   const selectedStations=[];
   const stationCases=twoStations?[['Tal','Talstation Sonnwies','-2'],['Berg','Bergstation Hahnenkamm','-12']]:[['Tal','Talstation Sonnwies','-2'],['Mitte','Mittelstation Panoramaalm','-7'],['Berg','Bergstation Hahnenkamm','-12']];
   for(const [label,station,temp] of stationCases){
   await clickButtonContaining('.mountain-level-picker button',label);
   await waitForValue(`Stufenwechsel ${label}`,`document.querySelector('.mountain-current-heading strong')?.textContent||''`,value=>value.includes(station));
   const selected=JSON.parse(await evaluate(`(()=>{const metric=[...document.querySelectorAll('.mountain-current-rail .mid-metric')].find(item=>item.querySelector('.mid-metric-label')?.textContent.trim()==='Temperatur');return JSON.stringify({name:document.querySelector('.mountain-current-heading strong')?.textContent.trim()||'',temperature:metric?.querySelector('strong')?.textContent.trim()||''})})()`));
   assert.ok(selected.temperature.includes(temp),`${label}: erwartete eigene Fixture-Temperatur mit ${temp} °C, erhalten ${JSON.stringify(selected)}.`);
   selectedStations.push(selected);
   if(label==='Mitte'){
    await clickAt('.mountain-day-toggle:not(:disabled)',0);
    await waitForValue('Mittelstations-Intervalle mit fehlendem Niederschlag',`document.querySelectorAll('.mountain-period-card').length`,value=>value>0);
     const stationLabels=JSON.parse(await evaluate(`JSON.stringify({
      daily:document.querySelector('.mountain-seven-day-heading strong')?.textContent.trim()||'',
      day:document.querySelector('.mountain-day-toggle:not(:disabled)')?.getAttribute('aria-label')||'',
      hourly:document.querySelector('.mountain-day-detail[role="region"]')?.getAttribute('aria-label')||'',
      hourlyHeading:document.querySelector('.mountain-day-detail-level')?.textContent.trim()||''
     })`));
     for(const [view,labelText] of Object.entries(stationLabels))assert.ok(labelText.includes(station)&&labelText.includes('2200 m ü. NHN'),`Mittelstation/Höhe fehlt in der ${view}-Ansicht: ${JSON.stringify(stationLabels)}.`);
    const missing=JSON.parse(await evaluate(`JSON.stringify({day:document.querySelector('.mountain-day-precip b')?.childNodes[0]?.textContent.trim()||'',period:document.querySelector('.mountain-period-precip b')?.textContent.trim()||''})`));
    assert.equal(missing.day,'–','Fehlender Tagesniederschlag muss als „–“ statt als 0 dargestellt werden.');
    assert.equal(missing.period,'–','Fehlender Intervallniederschlag muss als „–“ statt als 0 dargestellt werden.');
    await clickAt('.mountain-day-toggle:not(:disabled)',0);
    await waitForValue('Mittelstations-Tagesdetails geschlossen',`document.querySelector('.mountain-day-toggle')?.getAttribute('aria-expanded')||''`,value=>value==='false');
   }
  }
  assert.equal(new Set(selectedStations.map(item=>item.temperature)).size,twoStations?2:3,twoStations?'Tal und Berg müssen getrennte Temperaturwerte verwenden.':'Tal, Mitte und Berg müssen getrennte Temperaturwerte verwenden.');
  await clickAt('.mountain-day-toggle:not(:disabled)',0);
 await waitForValue('Stundenkarten für den ersten Prognosetag',`document.querySelectorAll('.mountain-period-card').length`,value=>value>0);
  assert.equal(JSON.parse(await evaluate(`JSON.stringify({expanded:[...document.querySelectorAll('.mountain-day-toggle')].filter(button=>button.getAttribute('aria-expanded')==='true').length,details:document.querySelectorAll('.mountain-day-detail').length})`)).expanded,1,'Es darf genau ein Forecast-Tag geöffnet sein.');
  await clickAt('.mountain-day-toggle:not(:disabled)',1);
  await waitForValue('Exklusiver Wechsel zum zweiten Forecast-Tag',`JSON.stringify({first:document.querySelectorAll('.mountain-day-toggle')[0]?.getAttribute('aria-expanded'),second:document.querySelectorAll('.mountain-day-toggle')[1]?.getAttribute('aria-expanded'),details:document.querySelectorAll('.mountain-day-detail').length})`,value=>value===JSON.stringify({first:'false',second:'true',details:1}));
  await clickAt('.mountain-day-toggle:not(:disabled)',0);
  await waitForValue('Erster Forecast-Tag erneut geöffnet',`JSON.stringify({first:document.querySelectorAll('.mountain-day-toggle')[0]?.getAttribute('aria-expanded'),details:document.querySelectorAll('.mountain-day-detail').length})`,value=>value===JSON.stringify({first:'true',details:1}));
  const summitWindArrows=JSON.parse(await evaluate(`JSON.stringify(['.mountain-current-rail .mountain-wind-value .wind-direction-arrow','.mountain-day-wind .wind-direction-arrow','.mountain-period-wind .wind-direction-arrow'].map(selector=>{const node=document.querySelector(selector);return{selector,label:node?.getAttribute('aria-label')||'',className:node?.className||'',color:node?getComputedStyle(node).color:''}}))`));
  for(const arrow of summitWindArrows)assert.ok(arrow.label&&arrow.className.includes('warning-4')&&arrow.color==='rgb(155, 89, 198)',`Windrichtung/Warnfarbe fehlt oder ist inkonsistent in ${arrow.selector}: ${JSON.stringify(arrow)}.`);
  const precipitationInterval=JSON.parse(await evaluate(`(()=>{
   const row=document.querySelector('.mountain-seven-day-row.open'),card=row?.querySelector('.mountain-period-card'),time=card?.querySelector('time')?.textContent.trim()||'',date=row?.getAttribute('data-forecast-date')||'',fixture=window.__mountainFixtureExpectedPrecipitation;
   const [start,end]=time.split('–'),clockMinutes=value=>{const[hour,minute]=value.split(':').map(Number);return hour*60+minute},durationMinutes=(clockMinutes(end)-clockMinutes(start)+1440)%1440,hours=durationMinutes/60,startIndex=fixture?.times?.indexOf(date+'T'+start)??-1,values=fixture?.byRole?.find(item=>item.role===2)?.values||[],expected=startIndex>=0?values.slice(startIndex+1,startIndex+hours+1).reduce((sum,value)=>sum+(Number.isFinite(value)?value:0),0):NaN,actualText=card?.querySelector('.mountain-period-precip b')?.textContent.trim()||'';
   return JSON.stringify({time,date,hours,startIndex,expected,actualText});
  })()`));
  assert.ok(precipitationInterval.startIndex>=0&&precipitationInterval.hours>=1&&precipitationInterval.hours<=3,`Dreistundenintervall lässt sich nicht auf Stundenquelle abbilden: ${JSON.stringify(precipitationInterval)}.`);
  const displayedPrecipitation=Number((precipitationInterval.actualText.match(/-?\d+(?:[,.]\d+)?/)||[])[0]?.replace(',','.'));
  assert.ok(Number.isFinite(displayedPrecipitation)&&Math.abs(displayedPrecipitation-precipitationInterval.expected)<0.06,`Intervallniederschlag muss aus den zugrunde liegenden Stundenwerten summiert sein: ${JSON.stringify({...precipitationInterval,displayedPrecipitation})}.`);
 await clickIfClosed('.mountain-snowline-summary');
 await waitForValue('Schneefallgrenzen-Prognose',`Boolean(document.querySelector('.mountain-snowline-horizons button'))`,Boolean);

  await clickAt('.mountain-day-toggle:not(:disabled)',0);
  await waitForValue('Erster Tag vor der Tag-/Nachtprüfung geschlossen',`document.querySelector('.mountain-day-toggle')?.getAttribute('aria-expanded')||''`,value=>value==='false');
  await clickAt('.mountain-day-toggle:not(:disabled)',1);
  await waitForValue('Vollständiger Folgetag für Tag-/Nachtprüfung geöffnet',`document.querySelectorAll('.mountain-period-card').length`,value=>value>0);
 const iconStates=await evaluate(`JSON.stringify({
  day:document.querySelectorAll('.mountain-period-card .mid-weather-pictogram[data-day-part="day"]').length,
  night:document.querySelectorAll('.mountain-period-card .mid-weather-pictogram[data-day-part="night"]').length,
   precipitation:[...document.querySelectorAll('.mountain-period-precip')].map(node=>[...node.classList]).flat().filter(value=>value.startsWith('mountain-precip-'))
 })`);
 const iconState=JSON.parse(iconStates);
 assert.ok(iconState.day>0,'Tages-Wetterpiktogramme fehlen in den 3-h-Zeitfenstern.');
 assert.ok(iconState.night>0,'Nacht-Wetterpiktogramme fehlen in den 3-h-Zeitfenstern.');
 assert.ok(iconState.precipitation.some(value=>value==='mountain-precip-heavy'||value==='mountain-precip-moderate'),`Regen-/Schnee-Intervalle erreichen keine moderate/starke Niederschlagsklasse: ${JSON.stringify(iconState)}`);
   await clickAt('.mountain-day-toggle:not(:disabled)',0);
   await waitForValue('Erster Forecast-Tag nach Tag-/Nachtprüfung exklusiv wieder geöffnet',`JSON.stringify({first:document.querySelectorAll('.mountain-day-toggle')[0]?.getAttribute('aria-expanded'),second:document.querySelectorAll('.mountain-day-toggle')[1]?.getAttribute('aria-expanded'),details:document.querySelectorAll('.mountain-day-detail').length})`,value=>value===JSON.stringify({first:'true',second:'false',details:1}));

 const unitBefore=JSON.parse(await snapshotWindAndWeather());
 await evaluate(`window.dispatchEvent(new CustomEvent('mid:open-settings',{detail:{section:'units'}}))`);
  await waitForValue('Einheitenauswahl',`Boolean(document.querySelector('.settings-dialog .settings-units-section .settings-unit-grid button')&&[...document.querySelectorAll('.settings-dialog .settings-units-section .settings-unit-grid button')].some(button=>button.textContent.includes('km/h')))`,Boolean);
  await clickButtonContaining('.settings-dialog .settings-units-section .settings-unit-grid button','km/h');
  await waitForValue('Windanzeige in km/h',`[...document.querySelectorAll('.settings-dialog .settings-units-section .settings-unit-grid button')].find(button=>button.textContent.includes('km/h'))?.getAttribute('aria-pressed')||''`,value=>value==='true');
 const unitAfter=JSON.parse(await snapshotWindAndWeather());
 assert.notEqual(unitAfter.currentWind,unitBefore.currentWind,'Die aktuelle Wind-/Böenanzeige reagiert nicht auf die Einheitenauswahl.');
 assert.notEqual(unitAfter.dayWind,unitBefore.dayWind,'Die Tages-Windanzeige reagiert nicht auf die Einheitenauswahl.');
 assert.notEqual(unitAfter.periodWind,unitBefore.periodWind,'Die Intervall-Windanzeige reagiert nicht auf die Einheitenauswahl.');
 assert.equal(unitAfter.temperature,unitBefore.temperature,'Die Temperaturanzeige darf durch den Wind-Einheitenwechsel nicht verändert werden.');
 assert.equal(unitAfter.currentPrecipitation,unitBefore.currentPrecipitation,'Die Niederschlagswahrscheinlichkeit darf durch den Wind-Einheitenwechsel nicht verändert werden.');
 assert.equal(unitAfter.periodPrecipitation,unitBefore.periodPrecipitation,'Niederschlagsmengen dürfen durch den Wind-Einheitenwechsel nicht verändert werden.');
  await clickAt('.settings-dialog button[aria-label="Einstellungen schließen"]');
  await waitForValue('Geschlossene Einstellungen',`!document.querySelector('.settings-dialog')`,Boolean);
   if(!mountainOnly){
    await clickButtonContaining('.dashboard-bottom-tabs button','Vorhersage');
    await waitForValue('Sichtbare Forecast-Horizonte',`[...document.querySelectorAll('.modern-forecast-horizons button')].filter(button=>button.getClientRects().length&&button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height>0).length`,value=>value>0);
   }

 const results=[],surfaces=new Map();
 for(const viewport of viewports){
  for(const theme of themes){
   if(!mountainOnly)await navigateToForecast();
   await setViewport(viewport.width,viewport.height,theme);
   let forecastControls=[];
   if(!mountainOnly){
    await waitForValue(`${viewport.label} · ${theme}: Sichtbare Forecast-Horizonte`,`[...document.querySelectorAll('.modern-forecast-horizons>button')].filter(button=>button.getClientRects().length&&button.getBoundingClientRect().width>0&&button.getBoundingClientRect().height>0).length`,value=>value>0);
    forecastControls=await measureControls('.modern-forecast-horizons>button');
    assert.ok(forecastControls.length>0,`${viewport.label} · ${theme}: Keine aktiven Forecast-Horizontziele messbar.`);
    for(const control of forecastControls){
     if(viewport.width<=850)assert.ok(control.width>=44&&control.height>=44,`${viewport.label} · ${theme}: Forecast „${control.label}“ ist ${control.width.toFixed(1)}×${control.height.toFixed(1)} statt mindestens 44×44 CSS-Pixel.`);
     assert.ok(control.hit,`${viewport.label} · ${theme}: Forecast „${control.label}“ ist an der Hitboxmitte überdeckt (${control.hitTarget}).`);
    }
   }
   await navigateToMountain();
   await waitForValue(`${viewport.label} · ${theme}: Aktive Bergansicht`,`document.querySelector('.mountain-ski')?.getBoundingClientRect().width||0`,value=>value>0,60000);
    await closeOpenMountainDays();
     await verifyMountainMatrix(`${twoStations?'Zwei':'Drei'} Stationen · ${viewport.label} · ${theme}`);
   const dayState=JSON.parse(await evaluate(`JSON.stringify({rows:document.querySelectorAll('.mountain-day-toggle:not(:disabled)').length,expanded:[...document.querySelectorAll('.mountain-day-toggle')].filter(button=>button.getAttribute('aria-expanded')==='true').length,periodCards:document.querySelectorAll('.mountain-period-card').length})`));
   assert.ok(dayState.rows>=7,`${viewport.label} · ${theme}: Es fehlen 7-Tage-Zeilen (${dayState.rows}).`);
   assert.equal(dayState.expanded,0,`${viewport.label} · ${theme}: Tagesdetails müssen beim Einstieg geschlossen sein.`);
   assert.equal(dayState.periodCards,0,`${viewport.label} · ${theme}: Stundenkarten müssen beim Einstieg geschlossen sein.`);
    const summaryPresentation=JSON.parse(await evaluate(`(()=>{
     const weekdayNames=new Set(['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag']);
     const rows=[...document.querySelectorAll('.mountain-day-toggle:not(:disabled)')],visible=node=>node&&node.getClientRects().length>0;
     const rowInfo=rows.map(button=>{
      const date=button.querySelector('.mountain-day-date>b'),cells=[...button.querySelectorAll('.mountain-day-date,.mountain-day-weather,.mountain-day-temperature,.mountain-day-wind,.mountain-day-precip,.mountain-day-snowline,.mountain-day-sunshine,.mountain-day-expand')].filter(visible),rects=cells.map(node=>node.getBoundingClientRect());
      let overlaps=0;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++)if(rects[i].right>rects[j].left+1&&rects[j].right>rects[i].left+1&&rects[i].bottom>rects[j].top+1&&rects[j].bottom>rects[i].top+1)overlaps++;
      return{horizontalOverflow:button.scrollWidth>button.clientWidth+1,weekdayOverflow:date?date.scrollWidth>date.clientWidth+1:true,ellipsis:date?getComputedStyle(date).textOverflow==='ellipsis'||/…|\\.\\.\\./.test(date.textContent||''):true,overlaps};
     });
     const snow=[...document.querySelectorAll('.mountain-day-snow-value>strong')].map(node=>node.textContent.trim()),sun=[...document.querySelectorAll('.mountain-day-sunshine>b')].map(node=>node.textContent.trim()),labels=rows.map(button=>button.querySelector('.mountain-day-date>b')?.textContent.trim()||''),weekdays=labels.filter(label=>weekdayNames.has(label)).length;
     return JSON.stringify({rowCount:rows.length,rowInfo,snow,sun,weekdays});
    })()`));
    assert.ok(summaryPresentation.rowCount>=7,`${viewport.label} · ${theme}: Tageswerte für sieben Prognosetage fehlen.`);
    assert.ok(summaryPresentation.weekdays>=5,`${viewport.label} · ${theme}: Vollständige Wochentagsnamen fehlen (${summaryPresentation.weekdays}).`);
    assert.ok(summaryPresentation.rowInfo.every(row=>!row.horizontalOverflow&&!row.weekdayOverflow&&!row.ellipsis&&!row.overlaps),`${viewport.label} · ${theme}: Geschlossene Tageszeile ist abgeschnitten, horizontal breiter als ihr Container oder überlappt: ${JSON.stringify(summaryPresentation.rowInfo)}.`);
    assert.ok(summaryPresentation.snow.every(value=>/^(?:0 cm|<1 cm|\d+ cm|–)$/.test(value)),`${viewport.label} · ${theme}: Schneemengen haben nicht das vereinbarte Format: ${summaryPresentation.snow.join(', ')}.`);
    assert.ok(summaryPresentation.sun.every(value=>/^(?:\d+ h|–) · UV (?:\d+(?:,\d+)?|–)$/.test(value)),`${viewport.label} · ${theme}: Sonnenscheindauer/UVI haben kein gültiges Stunden-/Tagesmaximum-Format: ${summaryPresentation.sun.join(', ')}.`);
   await clickIfClosed('.mountain-day-toggle:not(:disabled)');
   await waitForValue('Stundenkarten je Test-Viewport',`document.querySelectorAll('.mountain-period-card').length`,value=>value>0);
    const periodPresentation=JSON.parse(await evaluate(`(()=>{
     const scroll=document.querySelector('.mountain-period-table-scroll'),table=document.querySelector('.mountain-period-grid'),snow=[...document.querySelectorAll('.mountain-period-snow')].map(node=>node.textContent.trim());
     return JSON.stringify({scrollWidth:scroll?.scrollWidth||0,clientWidth:scroll?.clientWidth||0,tableWidth:table?.scrollWidth||0,tableClientWidth:table?.clientWidth||0,snow});
    })()`));
    assert.ok(periodPresentation.snow.every(value=>/^(?:0 cm|<1 cm|\d+ cm|–)$/.test(value)),`${viewport.label} · ${theme}: Intervall-Neuschnee nicht im vereinbarten Format: ${periodPresentation.snow.join(', ')}.`);
    if(viewport.width<=900)assert.ok(periodPresentation.scrollWidth<=periodPresentation.clientWidth+1&&periodPresentation.tableWidth<=periodPresentation.tableClientWidth+1,`${viewport.label} · ${theme}: Mobile 3-Stunden-Details benötigen horizontales Scrollen: ${JSON.stringify(periodPresentation)}.`);
   await clickIfClosed('.mountain-snowline-summary');
   await waitForValue('Schneefallgrenzen-Zeiträume je Test-Viewport',`document.querySelectorAll('.mountain-snowline-horizons button').length`,value=>value>0);
    const controls=await measureControls('.mountain-season-control button,.mountain-level-picker button,.mountain-day-toggle:not(:disabled),.mountain-forecast-summary,.mountain-matrix-controls button,.mountain-snowline-summary,.mountain-snowline-horizons button,.mountain-enrichment-disclosure>summary');
   assert.ok(controls.length>=15,`${viewport.label} · ${theme}: Vergleichbare Berg-/Forecast-Controls fehlen (${controls.length}).`);
   for(const control of controls){
    if(viewport.width<=850)assert.ok(control.width>=44&&control.height>=44,`${viewport.label} · ${theme}: „${control.label}“ ist ${control.width.toFixed(1)}×${control.height.toFixed(1)} statt mindestens 44×44 CSS-Pixel.`);
     assert.ok(control.hit,`${viewport.label} · ${theme}: „${control.label}“ ist an der Hitboxmitte überdeckt (${control.hitTarget}, left ${control.left.toFixed(1)}, top ${control.top.toFixed(1)}).`);
   }
    await evaluate(`new Promise(resolve=>{window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'});requestAnimationFrame(()=>requestAnimationFrame(resolve))})`);
    const geometry=JSON.parse(await evaluate(`(()=>{
     const root=document.querySelector('.mountain-ski'),r=root.getBoundingClientRect(),surface=getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
     const heading=root.querySelector('.mountain-current-heading strong'),day=root.querySelector('.mountain-day-toggle'),rail=root.querySelector('.mountain-current-rail'),railRect=rail?.getBoundingClientRect(),railStyle=rail?getComputedStyle(rail):null;
     const app=document.querySelector('.app'),main=app?.querySelector(':scope > main'),footer=app?.querySelector(':scope > footer'),bar=document.querySelector('.dashboard-bottom-tabs');
     const mainRect=main?.getBoundingClientRect(),footerRect=footer?.getBoundingClientRect(),barRect=bar?.getBoundingClientRect(),barStyle=bar?getComputedStyle(bar):null;
     const safeBottomCss=getComputedStyle(document.documentElement).getPropertyValue('--mid-safe-bottom').trim(),safeBottom=parseFloat(safeBottomCss)||0,maxScroll=Math.max(0,document.documentElement.scrollHeight-innerHeight);
     const footerClearance=footerRect?innerHeight-footerRect.bottom:null,requiredClearance=barRect?barRect.height+Math.max(innerHeight-barRect.bottom,safeBottom):null;
     return JSON.stringify({surface,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,viewportWidth:innerWidth,viewportHeight:innerHeight,scrollY,rootWidth:r.width,rootLeft:r.left,rootRight:r.right,rootTop:r.top,rootBottom:r.bottom,stationName:heading?.textContent.trim()||'',dayHeight:day?.getBoundingClientRect().height||0,periods:root.querySelectorAll('.mountain-period-card').length,windUnit:localStorage.getItem('windUnit'),currentRail:railRect?{left:railRect.left,right:railRect.right,width:railRect.width,clientWidth:rail.clientWidth,scrollWidth:rail.scrollWidth,overflowX:railStyle.overflowX}:null,pageEnd:{atBottom:Math.abs(scrollY-maxScroll)<=2,mainBottom:mainRect?.bottom??null,footerBottom:footerRect?.bottom??null,footerClearance,requiredClearance},bottomBar:barRect?{left:barRect.left,right:barRect.right,top:barRect.top,bottom:barRect.bottom,height:barRect.height,position:barStyle.position,safeBottom:safeBottomCss}:null});
    })()`));
   assert.ok(geometry.surface,`${viewport.label} · ${theme}: Theme-Oberflächenfarbe fehlt.`);
   assert.ok(geometry.documentWidth<=viewport.width+1,`${viewport.label} · ${theme}: Dokument läuft horizontal über (${geometry.documentWidth}px bei ${viewport.width}px).`);
   assert.ok(geometry.rootLeft>=-1&&geometry.rootRight<=viewport.width+1,`${viewport.label} · ${theme}: Bergwetter-Surface liegt außerhalb des Viewports.`);
    assert.ok(geometry.rootTop+geometry.scrollY>=-1&&geometry.rootBottom+geometry.scrollY<=geometry.documentHeight+1,`${viewport.label} · ${theme}: Bergwetter-Surface liegt außerhalb des vertikal scrollbaren Dokuments.`);
   assert.ok(geometry.stationName.includes('langem Stationsnamen'),`${viewport.label} · ${theme}: Lang benannte Höhenstation fehlt.`);
   assert.ok(geometry.periods>0,`${viewport.label} · ${theme}: Niederschlags-/Schneezeitfenster fehlen.`);
    assert.ok(geometry.currentRail&&geometry.currentRail.width<=geometry.rootWidth+1&&geometry.currentRail.right<=viewport.width+1,`${viewport.label} · ${theme}: Aktuell-Bedingungen-Schiene liegt außerhalb des Layouts.`);
    assert.ok(['auto','scroll'].includes(geometry.currentRail.overflowX),`${viewport.label} · ${theme}: Aktuell-Bedingungen-Schiene ist nicht scrollbar.`);
    if(viewport.width<=850){
     assert.ok(geometry.bottomBar,`${viewport.label} · ${theme}: Mobile Floating Bottom-Bar fehlt.`);
     assert.ok(geometry.bottomBar.left>=-1&&geometry.bottomBar.right<=viewport.width+1&&geometry.bottomBar.bottom<=viewport.height+1,`${viewport.label} · ${theme}: Bottom-Bar liegt außerhalb des Viewports (${JSON.stringify(geometry.bottomBar)}).`);
     assert.equal(geometry.bottomBar.position,'fixed',`${viewport.label} · ${theme}: Bottom-Bar ist nicht fixiert.`);
      assert.ok(geometry.pageEnd.atBottom,`${viewport.label} · ${theme}: Dokument wurde vor der Seitenendprüfung nicht bis zum Ende gescrollt (${JSON.stringify(geometry.pageEnd)}).`);
      assert.ok(geometry.pageEnd.mainBottom!==null&&geometry.pageEnd.mainBottom<=geometry.bottomBar.top+1,`${viewport.label} · ${theme}: letzter Seiteninhalt überlappt die Bottom-Bar (${JSON.stringify({pageEnd:geometry.pageEnd,bottomBar:geometry.bottomBar})}).`);
      assert.ok(geometry.pageEnd.footerBottom!==null&&geometry.pageEnd.footerBottom<=geometry.bottomBar.top+1,`${viewport.label} · ${theme}: Footer überlappt die Bottom-Bar (${JSON.stringify({pageEnd:geometry.pageEnd,bottomBar:geometry.bottomBar})}).`);
      assert.ok(geometry.pageEnd.footerClearance!==null&&geometry.pageEnd.requiredClearance!==null&&geometry.pageEnd.footerClearance>=geometry.pageEnd.requiredClearance-1,`${viewport.label} · ${theme}: reale Footer-Reserve unterschreitet Bottom-Bar-/Safe-Area-Bedarf (${JSON.stringify({pageEnd:geometry.pageEnd,bottomBar:geometry.bottomBar})}).`);
     assert.ok(geometry.bottomBar.safeBottom.endsWith('px'),`${viewport.label} · ${theme}: Safe-Area-Inset ist nicht aufgelöst (${geometry.bottomBar.safeBottom}).`);
    }
   const key=`${viewport.width}x${viewport.height}`;
   if(surfaces.has(key))assert.notEqual(geometry.surface,surfaces.get(key),`${key}: Light und Dark verwenden dieselbe Oberflächenfarbe.`);
   else surfaces.set(key,geometry.surface);
   await scrollMountainToTop();
   if(screenshotDir){
    const image=await cdp('Page.captureScreenshot',{format:'jpeg',quality:78,fromSurface:true,captureBeyondViewport:false});
    const screenshot=`mountain-${viewport.id}-${theme}.jpg`;
    await writeFile(path.join(screenshotDir,screenshot),Buffer.from(image.result.data,'base64'));
    geometry.screenshot=`screenshots/${screenshot}`;
   }
    const minTouchEdge=[...forecastControls,...controls].length?Math.min(...[...forecastControls,...controls].map(control=>Math.min(control.width,control.height))):Number.NaN;
    results.push({viewport,theme,geometry,forecastControls:forecastControls.length,mountainControls:controls.length,minTouchTarget:Number.isFinite(minTouchEdge)?`${minTouchEdge.toFixed(1)} px Kantenlänge`:'–'});
    if(!mountainOnly)await navigateToForecast();
  }
 }

 if(screenshotDir){
  const rows=results.map(result=>{
   const {viewport,theme,geometry}=result;
   return`| ${viewport.label} · ${theme==='light'?'Light':'Dark'} | ${viewport.width}×${viewport.height} | ${result.forecastControls} | ${result.mountainControls} | ${result.minTouchTarget} | ${geometry.documentWidth} / ${viewport.width} px | ${geometry.currentRail.scrollWidth} / ${geometry.currentRail.clientWidth} px | ${geometry.surface} | [Screenshot](${geometry.screenshot}) |`;
  }).join('\n');
  const screenshots=results.map(result=>`### ${result.viewport.label} · ${result.theme==='light'?'Light':'Dark'} (${result.viewport.width}×${result.viewport.height})\n\n![${result.viewport.label} · ${result.theme}](screenshots/mountain-${result.viewport.id}-${result.theme}.jpg)`).join('\n\n');
  const runScope=mountainOnly?'Mountain-only; allgemeine Forecast-Navigation und deren Touch-Target-Prüfung übersprungen.':'Standardlauf einschließlich allgemeiner Forecast-Navigation und Touch-Target-Prüfung.';
  const report=`# MID 18.2.13 · Berg-/Wintersport Visual Acceptance\n\nDeterministischer Browserlauf der echten App-Komponenten mit kontrollierten Open-Meteo-, GeoSphere- und Ensemble-Antworten. Die Fixture-Daten sind Testdaten, keine aktuelle Wetterlage. Erstellt: ${new Date().toISOString()}.\n\n**Laufumfang:** ${runScope}\n\n## Matrix\n\n| Gerät | Viewport | Theme | Forecast-Ziele | Bergziele | kleinste Hitbox-Kantenlänge | Dokument-/Viewportbreite | Aktuell-Schiene (Inhalt/Ansicht) | Surface | Screenshot |\n|---|---:|---|---:|---:|---:|---:|---:|---:|---|\n${rows}\n\n## Geprüfte Zustände\n\n- 6 Viewports × Light/Dark; kein horizontaler Dokumentüberlauf; Theme-Oberflächen unterscheiden sich je Viewport.\n- Saisonwahl, saisonale Reihenfolge aktueller Kennzahlen und der Bergstationswerte, Höhenstufen, Tageszeilen und Schneefallgrenzen-Zeiträume: mittiger Trefferpunkt nicht überdeckt; bei Viewports bis 850 px mindestens 44×44 CSS-Pixel. Mobile Bottom-Bar, Safe-Area-Inset und Inhaltsabstand werden geprüft.\n- Tal/Mitte/Berg zeigen unterschiedliche, fixture-eigene Temperaturen. Tagesprognose und geöffnete Stundenansicht nennen die ausgewählte Station samt Höhe. Sieben Tage starten geschlossen; beim Öffnen bleibt höchstens ein Tag erweitert. Fehlender Mittelstationsniederschlag wird als „–“ gezeigt.\n- Geöffnete Stundenkarten summieren die Niederschlagsmengen der zugrunde liegenden stündlichen Fixture-Werte für das dargestellte 1–3-h-Intervall. Tages-/Nacht-Piktogramme und Regen-/Schneeintensität sind enthalten.\n- Windwechsel in den MID-Einstellungen (kn → km/h) ändert aktuelle, Tages- und Intervallwerte, aber nicht Temperatur oder Niederschlag. Richtungspfeile und DWD-Warnfarbe werden in aktuellen, Tages- und Intervallwerten geprüft.\n\n## Offenes Daten-/UI-Mapping\n\nDie zusätzliche Höhenmatrix mit 1-h/3-h-Steuerung und matrixspezifischer Warnfläche ist im gültigen Drei-Höhenstufen-Datensatz nicht sichtbar: Der Fallback auf diese Matrix greift nur bei leerer Höhenstufenliste, während die Matrix selbst die erste Höhenstufe benötigt. Daher sind deren Bedienelemente und Warnflächenfarbe nicht als visuell abgenommen ausgewiesen.\n\n## Datenabdeckung und Grenzen\n\nDie kontrollierten Fixture-Antworten decken drei Höhenpunkte, aktuelle/tägliche/stündliche Werte und ein vollständiges Testintervall ab; sie sind keine Live-Provider-Prüfung. Optionale Open-Meteo-Felder, reale GeoSphere-Verfügbarkeit und Ensemble-Verfügbarkeit bleiben providerabhängig. Die UI-Assertions prüfen Darstellung, Zuordnung und Einheitenverhalten, nicht die Richtigkeit einer aktuellen Wetterlage.\n\n## Screenshots\n\n${screenshots}\n`;
   const acceptedReport=report
    .replace('## Offenes Daten-/UI-Mapping\n\nDie zusätzliche Höhenmatrix mit 1-h/3-h-Steuerung und matrixspezifischer Warnfläche ist im gültigen Drei-Höhenstufen-Datensatz nicht sichtbar: Der Fallback auf diese Matrix greift nur bei leerer Höhenstufenliste, während die Matrix selbst die erste Höhenstufe benötigt. Daher sind deren Bedienelemente und Warnflächenfarbe nicht als visuell abgenommen ausgewiesen.','## Höhenvergleich\n\nDer standardmäßig geschlossene Höhenvergleich folgt direkt auf die Sieben-Tage-Ansicht. 1-h-/3-h-Umschaltung, Rollenbeschriftungen, Windrichtungspfeile, Warnzellen und interner horizontaler Overflow wurden in beiden Themes über sechs Viewports geprüft.')
    .replace('Die kontrollierten Fixture-Antworten decken drei Höhenpunkte',`Die kontrollierten Fixture-Antworten decken ${twoStations?'zwei':'drei'} Höhenpunkte`);
   await writeFile(path.join(visualDir,'MID_18.2.13_mountain_visual_acceptance.md'),acceptedReport);
 }
  console.log(`Berg-/Wintersport: echter App-Render, saisonale Kennzahlenpriorität, Stationshöhen, Hitboxen, Einheiten und Tag/Nacht geprüft: ${viewports.length} Viewports × ${themes.length} Themes.${mountainOnly?' Forecast-Navigation/-Touch-Target ausgelassen.':''}${screenshotDir?` Screenshots und Matrix: ${path.relative(root,visualDir)}.`:''}`);
}finally{
 for(const request of pending.values())request.reject(new Error('CDP-Verbindung beendet.'));
 socket?.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');
  await Promise.race([once(chrome,'exit'),delay(1800)]);
  if(chrome.exitCode===null){chrome.kill('SIGKILL');await Promise.race([once(chrome,'exit'),delay(800)])}
 }
 if(server)await server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}