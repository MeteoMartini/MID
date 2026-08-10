import {readFile} from 'node:fs/promises';
const [worker,panel,pkg,baseline]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
for(const token of ['const DWD_SATELLITE_MAX_AGE_MINUTES=210','maxAgeMinutes:210','latest>=now-maxAgeMinutes*60000','timeVerified:false','snapshotRevision'])need('Worker',worker,token);
need('RadarPanel',panel,'lateGraceSeconds:190*60');
need('RadarPanel',panel,'der amtliche DWD-3h-Satellitenstand bleibt bis zum nächsten regulären Termin zulässig.');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);

const originalFetch=globalThis.fetch,now=Date.now(),iso=value=>new Date(value).toISOString();
const eumetOld=iso(now-40*24*3600000),dwdRecent=iso(now-170*60000);
const capabilities=(layer,time)=>`<?xml version="1.0"?><WMS_Capabilities><Capability><Layer><Name>root</Name><Layer><Name>${layer}</Name><Dimension name="time">${time}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`;
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.hostname==='view.eumetsat.int')return new Response(capabilities('mtg_fd:rgb_geocolour',eumetOld),{status:200,headers:{'content-type':'text/xml'}});
 if(url.hostname.endsWith('dwd.de'))return new Response(capabilities('dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h',dwdRecent),{status:200,headers:{'content-type':'text/xml'}});
 throw new Error(`Unerwarteter Abruf ${url}`);
};
try{
 const module=await import('../worker/metar-proxy.js?satellite-3h='+Date.now());
 const response=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=50.8&lon=7.1'),{}),data=await response.json();
 if(!response.ok)failures.push(`composite-times HTTP ${response.status}`);
 if(data.satelliteDayProduct?.provider!=='dwd')failures.push(`DWD-3h-Fallback nicht gewählt: ${JSON.stringify(data.satelliteDayProduct)}`);
 if(!String(data.satelliteDayProduct?.layer||'').includes('rgb_day_hrv_and_night_ir108_3h'))failures.push(`Falscher DWD-Satellitenlayer: ${JSON.stringify(data.satelliteDayProduct)}`);
 if(!Array.isArray(data.satelliteDayProduct?.times)||!data.satelliteDayProduct.times.length)failures.push('DWD-3h-Fallback ohne Zeitstand');
}finally{globalThis.fetch=originalFetch}
if(failures.length){console.error('Satelliten-3h-Fallback-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Satellit: EUMETSAT-NRT eng, amtlicher DWD-3h-Stand zeitgestempelt bevorzugt und bei fehlender TIME-Dimension als kontrollierter Live-Snapshot geschützt.');
