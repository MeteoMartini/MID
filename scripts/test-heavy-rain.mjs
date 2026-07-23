import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,worker,heavy,radolan,thunder]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'src','heavyRain.ts'),'utf8'),
 readFile(path.join(root,'src','RadolanRasterSource.ts'),'utf8'),
 readFile(path.join(root,'src','thunderstorm.ts'),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
for(const mode of['radolan-yw-meta','radolan-yw-file','rv-accumulation','kostra-file','dwd-rain-station'])need(worker,`mode==='${mode}'`,`Workerroute ${mode} fehlt.`);
need(worker,'DWD_RADOLAN_YW_ROOT','Offizieller RADOLAN-YW-Pfad fehlt.');
need(worker,'DWD_KOSTRA_ASC_ROOT','Offizieller KOSTRA-DWD-2020-Pfad fehlt.');
need(heavy,'observed15','RADOLAN-Summe 15 Minuten fehlt.');
need(heavy,'observed30','RADOLAN-Summe 30 Minuten fehlt.');
need(heavy,'observed60','RADOLAN-Summe 60 Minuten fehlt.');
need(heavy,'observed180','RADOLAN-Summe 180 Minuten fehlt.');
need(heavy,'observed360','RADOLAN-Summe 360 Minuten fehlt.');
need(heavy,'forecast120','RV-Nowcast bis +120 Minuten fehlt.');
for(const duration of['30','60','360'])need(heavy,`durationMinutes===${duration}`,`KOSTRA-Einordnung ${duration} Minuten fehlt.`);
need(heavy,'heavyRainFlag','KONRAD3D-Starkregenflag fehlt in der Starkregenbewertung.');
need(heavy,'amount10m','DWD-Stationsabgleich fehlt.');
need(heavy,'if(!actualSignal)return null','Starkregenkarte wird nicht konsequent auf tatsächliche Signale begrenzt.');
need(app,'heavyRainInfo&&<aside','Starkregenkarte wird nicht bedingt eingeblendet.');
need(app,"loadHeavyRainBase(loc.latitude,loc.longitude,loc.country_code||loc.country",'Starkregenanalyse erhält Standort und Land nicht korrekt.');
if(/combineHeavyRain\([^)]*official/.test(app))failures.push('Amtliche Warnungen werden unzulässig in die Starkregenbewertung eingespeist.');
if(/combineThunderstormInformation\([^)]*official/.test(app))failures.push('Amtliche Warnungen überschreiben weiterhin die Gewitterinformation.');
if(/OfficialAlert|Amtliche Gewitterwarnung/.test(thunder))failures.push('Gewitterinformation ist noch mit amtlichen Warnungen gekoppelt.');
need(radolan,'sampleRadolanPoint','RADOLAN-HDF5-Punktdekodierung fehlt.');
if(failures.length){console.error('Starkregen-/Überflutungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Starkregen-/Überflutungsindikator geprüft: RADOLAN YW 15–360 min, RV +120 min, KONRAD3D, KOSTRA, Stationsabgleich, Signalfilter und Warnungstrennung.');

const originalFetch=globalThis.fetch;
const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIEAAACBCAYAAADnoNlQAAAAV0lEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgbASUAAGQVSZ9AAAAAElFTkSuQmCC','base64');
const base=Math.floor(Date.now()/300000)*300000,pad=value=>String(value).padStart(2,'0'),ywName=time=>{const date=new Date(time);return`raa01-yw_10000-${String(date.getUTCFullYear()).slice(-2)}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}-dwd---bin.hdf5`},ywFiles=Array.from({length:6},(_,index)=>ywName(base-(5-index)*5*60000)),times=Array.from({length:27},(_,index)=>new Date(base+(index-2)*5*60000).toISOString()).join(',');
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();
 if(url.pathname.endsWith('/radolan/yw/'))return new Response(ywFiles.map(name=>`<a href="${name}">${name}</a>`).join('\n'),{status:200,headers:{'content-type':'text/html'}});
 if(url.pathname.includes('/radolan/yw/raa01-yw_'))return new Response(new Uint8Array(2048),{status:200,headers:{'content-type':'application/x-hdf5'}});
 if(url.pathname.includes('/KOSTRA_DWD_2020/asc/'))return new Response(new Uint8Array([80,75,3,4]),{status:200,headers:{'content-type':'application/zip'}});
 if(request==='getcapabilities')return new Response(`<WMS_Capabilities><Capability><Layer><Layer><Name>dwd:Radar_rv_product_1x1km_ger</Name><Dimension name="time">${times}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`,{status:200,headers:{'content-type':'application/xml'}});
 if(request==='getmap')return new Response(transparentPng,{status:200,headers:{'content-type':'image/png'}});
 if(request==='getfeatureinfo')return new Response('Results for FeatureType radar\nGRAY_INDEX = 6\n',{status:200,headers:{'content-type':'text/plain'}});
 if(url.hostname==='api.brightsky.dev')return new Response(JSON.stringify({weather:{timestamp:new Date(base).toISOString(),temperature:20,precipitation_10:4.2,source_id:1},sources:[{id:1,dwd_station_id:'TEST',station_name:'DWD Test',lat:50.96,lon:7.65}]}),{status:200,headers:{'content-type':'application/json'}});
 throw new Error(`Unerwarteter Starkregen-Testabruf: ${url}`)};
try{const module=await import('../worker/metar-proxy.js?heavy-rain-test='+Date.now());
 const metaResponse=await module.default.fetch(new Request('https://mid.test/?mode=radolan-yw-meta&lat=50.96&lon=7.65'),{}),meta=await metaResponse.json();
 if(!metaResponse.ok||meta.frames?.length!==6||meta.product!=='YW – quasi-angeeichte 5-Minuten-Niederschlagshöhe'){console.error('RADOLAN-Metadatenprüfung fehlgeschlagen:',JSON.stringify(meta));process.exit(1)}
 const fileResponse=await module.default.fetch(new Request(`https://mid.test/?mode=radolan-yw-file&file=${ywFiles.at(-1)}`),{});if(!fileResponse.ok||!String(fileResponse.headers.get('content-type')).includes('hdf5')){console.error('RADOLAN-Dateiproxy fehlgeschlagen.');process.exit(1)}
 const kostraResponse=await module.default.fetch(new Request('https://mid.test/?mode=kostra-file&duration=60'),{});if(!kostraResponse.ok||!String(kostraResponse.headers.get('content-type')).includes('zip')){console.error('KOSTRA-Dateiproxy fehlgeschlagen.');process.exit(1)}
 const rvResponse=await module.default.fetch(new Request('https://mid.test/?mode=rv-accumulation&lat=50.96&lon=7.65&country=DE'),{}),rv=await rvResponse.json();if(!rvResponse.ok||rv.forecast30<2.9||rv.forecast60<5.9||rv.forecast120<11.9){console.error('RV-Akkumulationsprüfung fehlgeschlagen:',JSON.stringify(rv));process.exit(1)}
 const stationResponse=await module.default.fetch(new Request('https://mid.test/?mode=dwd-rain-station&lat=50.96&lon=7.65&country=DE'),{}),station=await stationResponse.json();if(!stationResponse.ok||!station.available||station.amount10m!==4.2){console.error('Stationsregenprüfung fehlgeschlagen:',JSON.stringify(station));process.exit(1)}
 console.log('Workerintegration geprüft: RADOLAN-Metadaten/Proxy, KOSTRA-Proxy, RV +30/+60/+120 und DWD-Stationsregen.');
}finally{globalThis.fetch=originalFetch}
