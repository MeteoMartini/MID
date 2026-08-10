import {readFile} from 'node:fs/promises';
const [source,overlay,panel,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/CompositeHymecNgSource.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/CompositeHymecNgOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
const reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: unerwünscht ${token}`)};
for(const token of [
 'const code=Math.round(raw*raster.gain+raster.offset)',
 'hymecNgRasterDiagnostics',
 "rgba:[0,0,0,0]"
])need('HymecNG-Decoder',source,token);
for(const token of ['hymecNgRasterDiagnostics(value)','klassifizierte Niederschlagsflächen vorhanden','aktuell keine klassifizierten Niederschlagsflächen'])need('HymecNG-Overlay',overlay,token);
for(const token of [
 'onHymecStatus=useCallback',
 'onStatus={onHymecStatus}',
 'hymecMeta?.fresh!==false',
 'snapshotToken=satelliteUntimed?`latest:${revision}`:`snapshot:${iso}`',
 'time:iso',
 'der amtliche DWD-3h-Satellitenstand bleibt bis zum nächsten regulären Termin zulässig.'
])need('RadarPanel',panel,token);
for(const token of ['onStatus={(status,message=', 'satelliteRenderBlend=withAdjacentPreload'])reject('RadarPanel',panel,token);
for(const token of [
 'Promise.allSettled(DWD_HYMECNG_ROOTS.map',
 'sort((a,b)=>b.latestTime-a.latestTime)',
 'ageMinutes>25',
 'fresh:true',
 'const SATELLITE_MAX_AGE_MINUTES=75',
 'const DWD_SATELLITE_MAX_AGE_MINUTES=210',
 'latest>=now-maxAgeMinutes*60000',
 'latestOnly:false',
 'latestOnly:true',
 'timeVerified:false'
])need('Worker',worker,token);
for(const token of ['SATELLITE_LATEST_DAY','SATELLITE_LATEST_IR'])reject('Worker',worker,token);
need('Baseline',baseline,'scripts/test-hymecng-satellite-snapshot-09383.mjs');
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);

// Funktional: Von zwei offiziellen HymecNG-Roots muss der jüngste Index gewählt werden.
const originalFetch=globalThis.fetch,now=Date.now(),months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const row=(offsetMinutes)=>{const d=new Date(now+offsetMinutes*60000),pad=n=>String(n).padStart(2,'0'),filename=`composite_HymecNG_${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}_${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}_000-hd5`,date=`${pad(d.getUTCDate())}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()}`,time=`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00`;return`${filename} ${date} ${time}`};
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url);if(url.hostname==='opendata.dwd.de')return new Response(`<html>${row(-18)}</html>`,{status:200,headers:{'content-type':'text/html'}});if(url.hostname==='opendatao.dwd.de')return new Response(`<html>${row(-4)}</html>`,{status:200,headers:{'content-type':'text/html'}});throw new Error(`Unerwarteter Abruf ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?hymec-snapshot-test='+Date.now());
 const response=await module.default.fetch(new Request('https://mid.test/?mode=dwd-hymecng-meta'),{}),data=await response.json();
 if(!response.ok||!data.available||data.fresh!==true||Number(data.ageMinutes)>25||!String(data.sourceRoot||'').includes('opendatao.dwd.de'))failures.push(`Jüngster HymecNG-Root wird nicht sauber gewählt: ${JSON.stringify(data)}`);
}finally{globalThis.fetch=originalFetch}

if(failures.length){console.error('HymecNG-/Satelliten-Snapshot-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('HymecNG-Lifecycle, gain/offset-Klassendekodierung, frischer Root sowie zeitgestempelter Satellit mit kontrolliertem DWD-Latest-Fallback geprüft.');
