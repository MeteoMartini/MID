import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8'),weather=await readFile(path.join(root,'src','weather.ts'),'utf8'),worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),thunder=await readFile(path.join(root,'src','thunderstorm.ts'),'utf8'),failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(app,'formatZuluHm(clockTick)','Z-Zeit wird nicht als hhmmZ formatiert.');
if(app.includes("formatInZone(clockTick,'UTC',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'})}Z"))failures.push('Altes Z-Zeit-Format hh:mmZ ist noch aktiv.');
need(app,'Gewitterinformation','Separate Gewitterinformation fehlt in der Standortzeile.');
need(weather,"fetchWorkerJson<ThunderstormNowcast>('thunderstorm-nowcast'",'Frontend-Abruf für KONRAD3D fehlt.');
need(worker,"mode==='thunderstorm-nowcast'",'Workerroute thunderstorm-nowcast fehlt.');
need(worker,'DWD_KONRAD3D_INDEX','Offizieller DWD-KONRAD3D-Pfad fehlt.');
need(worker,"tagNumber(intensity,'heavy_rain_flag')",'KONRAD3D-Starkregenflag wird nicht ausgewertet.');
need(worker,"tagNumber(lightning,'lightning_rate')",'KONRAD3D-Blitzrate wird nicht ausgewertet.');
need(worker,"tagNumber(intensity,'hail_flag')",'KONRAD3D-Hagelflag wird nicht ausgewertet.');
if(/OfficialAlert|Amtliche Gewitterwarnung/.test(thunder))failures.push('Amtliche Warnungen sind noch mit der Gewitterinformation gekoppelt.');
need(thunder,'return null','Gewitterkarte wird ohne Gewittersignal weiterhin eingeblendet.');
need(thunder,'stationRainText','Stationsniederschlag wird nicht ergänzend berücksichtigt.');
if(failures.length){console.error('Gewitter-/Z-Zeit-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
const originalFetch=globalThis.fetch,now=new Date(),stamp=new Date(Math.floor(now.getTime()/300000)*300000),pad=v=>String(v).padStart(2,'0'),name=`KONRAD3D_${stamp.getUTCFullYear()}${pad(stamp.getUTCMonth()+1)}${pad(stamp.getUTCDate())}T${pad(stamp.getUTCHours())}${pad(stamp.getUTCMinutes())}00.xml`,forecast=new Date(stamp.getTime()+30*60000).toISOString();
const xml=`<?xml version="1.0"?><konrad3d><cells reference_time="${stamp.toISOString()}"><feature identifier="42"><geometry><centroid_3d><geodetic_coordinate><latitude>50.9000</latitude><longitude>7.2000</longitude></geodetic_coordinate></centroid_3d></geometry><intensity><severity>2</severity><hail_flag>1</hail_flag><heavy_rain_flag>2</heavy_rain_flag><gust_flag>1</gust_flag><trends><severity_trend_category>1</severity_trend_category></trends></intensity><hymec><area_hail>3.2</area_hail><area_large_hail>0</area_large_hail></hymec><lightning><lightning_rate>18</lightning_rate></lightning><tracking><cell_speed>35</cell_speed></tracking><forecast><centroid_forecasts><centroid_forecast forecast_time="${forecast}"><geodetic_coordinate><latitude>50.8200</latitude><longitude>7.0500</longitude></geodetic_coordinate><uncertainty_ellipse><major_axis>2.0</major_axis></uncertainty_ellipse></centroid_forecast></centroid_forecasts></forecast></feature></cells></konrad3d>`;
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url);if(url.pathname.endsWith('/konrad3d/'))return new Response(`<a href="${name}">${name}</a>`,{status:200});if(url.pathname.endsWith(name))return new Response(xml,{status:200,headers:{'content-type':'application/xml'}});throw new Error(`Unerwarteter KONRAD3D-Testabruf: ${url}`)};
try{const module=await import('../worker/metar-proxy.js?thunder-test='+Date.now()),response=await module.default.fetch(new Request('https://mid.test/?mode=thunderstorm-nowcast&lat=50.82&lon=7.04&country=DE'),{}),data=await response.json();if(!response.ok||!data.available||data.nearest?.severity!==2||data.nearest?.heavyRainFlag!==2||data.nearest?.lightningRate!==18||data.nearest?.arrivalMinutes!==0){console.error('KONRAD3D-Workerprüfung fehlgeschlagen:',JSON.stringify(data));process.exit(1)}console.log('Z-Zeit hhmmZ und Gewitterinformation geprüft: KONRAD3D-Zelle, Blitz, Hagel, Starkregen, Tracking, Signalfilter und Warnungstrennung.')}finally{globalThis.fetch=originalFetch}
