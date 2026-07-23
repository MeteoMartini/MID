import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=Object.fromEntries(await Promise.all([
 ['worker',path.join(root,'worker','metar-proxy.js')],
 ['panel',path.join(root,'src','RadarPanel.tsx')],
 ['source',path.join(root,'src','OperaRasterSource.ts')],
 ['overlay',path.join(root,'src','OperaRasterOverlay.tsx')],
 ['weather',path.join(root,'src','weather.ts')],
 ['composite',path.join(root,'src','CompositeData.ts')],
 ['styles',path.join(root,'src','styles.css')]
].map(async([key,file])=>[key,await readFile(file,'utf8')])));
const failures=[];
const need=(key,token,message)=>{if(!files[key].includes(token))failures.push(message)};

need('worker',"mode==='opera-raster-meta'",'Workerroute opera-raster-meta fehlt.');
need('worker',"mode==='opera-raster-file'",'Workerroute opera-raster-file fehlt.');
need('worker','OPERA@${operaStamp(value)}@0@DBZH.h5','Offizieller OPERA-CIRRUS-DBZH-Dateipfad fehlt.');
need('worker',"url.searchParams.set('list-type','2')",'OPERA-S3-Objektliste wird nicht abgefragt.');
need('worker','operaTimeFromKey','OPERA-Zeitstempel werden nicht aus real vorhandenen Objektschlüsseln gelesen.');
need('worker','operaListedFrames','OPERA-Metadaten beruhen nicht auf real gelisteten S3-Objekten.');
need('panel','LazyOperaRasterOverlay','OPERA-Rasteroverlay ist nicht in das Kompositbild eingebunden.');
need('panel','OPERA CIRRUS · 1 km · 5 min','Dynamische OPERA-Quellenangabe fehlt.');
need('panel','CompositeInfo','Infobutton für die Komposit-Dateninformation fehlt.');
for(const label of ['Quelle','Produkt','Auflösung','Stand','Alter','Status','Lizenz'])need('panel',`label:'${label}'`,`Komposit-Informationsfeld ${label} fehlt.`);
need('panel','Quellen, Datenstand und Lizenz anzeigen','Barrierefreie Beschriftung des Komposit-Infobuttons fehlt.');
need('styles','.composite-info-popover','Darstellung des Komposit-Infodialogs fehlt.');
if(files.panel.includes('<small className="source">Kompositquellen:'))failures.push('Der lange Komposit-Erklärtext steht weiterhin offen unter der Karte.');
need('source','ODIM-HDF5-Rasterpixel und 30-km-Umfeld direkt im Browser ausgewertet','Direkte Rasterauswertung für die Niederschlagswahrscheinlichkeit fehlt.');
need('source','sampleOperaRaster','Standort- und Umfeldstichprobe des OPERA-Rasters fehlt.');
need('weather','analyseOperaRasterNowcast','Aktuelle Niederschlagswahrscheinlichkeit nutzt OPERA CIRRUS nicht.');
need('weather','loadOperaRaster','OPERA-Rastermetadaten werden nicht für den Nowcast geladen.');
need('weather',"requestRadarStage(params,'dwd'",'Explizite DWD-Stufe vor OPERA fehlt.');
need('weather',"'rainviewer',signal",'Explizite RainViewer-Stufe nach OPERA fehlt.');
need('worker',"stage==='dwd'",'Worker unterstützt die isolierte DWD-Stufe nicht.');
need('worker',"stage==='rainviewer'",'Worker unterstützt die isolierte RainViewer-Stufe nicht.');
need('overlay','loadOperaRasterData','Karte und Wahrscheinlichkeit teilen nicht denselben Rasterdecoder.');
need('overlay','map.getPixelOrigin()','OPERA-Overlay verwendet keine eindeutig typisierte Pixelursprungskoordinate.');
if(files.overlay.includes('pixelBounds.min'))failures.push('OPERA-Overlay greift weiterhin auf optionales pixelBounds.min zu und kann TS18048 auslösen.');
need('composite',"fetchWorkerJson<OperaRasterResponse>('opera-raster-meta'",'Frontend-Client für OPERA-Rastermetadaten fehlt.');
if(files.worker.includes("mode==='opera-grid'")||files.worker.includes('operaGrid(')||files.panel.includes('CircleMarker key={`opera'))failures.push('Alte OPERA-Stützpunktdarstellung ist noch aktiv.');
if(files.worker.includes('operaRadarNowcast(')||files.worker.includes('OPERA_POSITION'))failures.push('Alte OPERA-Punktzeitreihen-Auswertung ist noch aktiv.');
if(files.worker.includes('for(let index=12;index>=0;index--)'))failures.push('OPERA-Metadaten erfinden weiterhin rückwirkende Frames ohne Objektprüfung.');
if(files.worker.includes("method:'HEAD'"))failures.push('OPERA-Erkennung hängt weiterhin von unzuverlässigen HEAD-Antworten ab.');
const dwd=files.worker.indexOf('if(!rainViewerOnly&&dwdExpected)'),rain=files.worker.indexOf('rainViewerRadarNowcast',dwd);if(dwd<0||rain<dwd)failures.push('Worker-Fallbackreihenfolge DWD vor RainViewer ist nicht erkennbar.');
const weatherDwd=files.weather.indexOf("requestRadarStage(params,'dwd'"),weatherOpera=files.weather.indexOf('analyseOperaRasterNowcast',weatherDwd),weatherFallback=files.weather.indexOf("'rainviewer',signal",weatherOpera);if(weatherDwd<0||weatherOpera<weatherDwd||weatherFallback<weatherOpera)failures.push('Frontend-Reihenfolge DWD → OPERA CIRRUS → Worker-Fallback ist nicht eingehalten.');

if(failures.length){console.error('OPERA-Phase-1-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('OPERA Phase 1 geprüft: echtes CIRRUS-HDF5, gemeinsame Rasterauswertung, DWD → OPERA → RainViewer und keine Stützpunktlogik.');

const originalFetch=globalThis.fetch;
const nominal=(()=>{const date=new Date();date.setUTCSeconds(0,0);date.setUTCMinutes(Math.floor(date.getUTCMinutes()/5)*5);return date.getTime()})();
const objectKey=value=>{const date=new Date(value),pad=number=>String(number).padStart(2,'0');return`${date.getUTCFullYear()}/${pad(date.getUTCMonth()+1)}/${pad(date.getUTCDate())}/OPERA/COMP/OPERA@${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}@0@DBZH.h5`};
const listedKeys=Array.from({length:13},(_,index)=>objectKey(nominal-(12-index)*5*60000));
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'?input:input.url),method=String(init.method||'GET').toUpperCase();
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&url.searchParams.get('list-type')==='2'){
  const prefix=url.searchParams.get('prefix')||'',keys=listedKeys.filter(key=>key.startsWith(prefix)),xml=`<?xml version="1.0" encoding="UTF-8"?><ListBucketResult>${keys.map(key=>`<Contents><Key>${key}</Key></Contents>`).join('')}</ListBucketResult>`;
  return new Response(xml,{status:200,headers:{'content-type':'application/xml'}});
 }
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&method==='HEAD')throw new Error('HEAD darf für OPERA nicht mehr benötigt werden.');
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&url.pathname.includes('/OPERA/COMP/OPERA@'))return new Response(new Uint8Array([137,72,68,70,13,10,26,10,1,2,3,4]),{status:200,headers:{'content-type':'application/x-hdf5','content-length':'12'}});
 throw new Error(`Unerwarteter OPERA-Testabruf: ${url}`);
};
try{
 const module=await import('../worker/metar-proxy.js?opera-raster-test='+Date.now());
 const metadataResponse=await module.default.fetch(new Request('https://mid.test/?mode=opera-raster-meta&lat=50.82&lon=7.04'),{}),metadata=await metadataResponse.json();
 if(!metadataResponse.ok||metadata.frames?.length!==13||metadata.nativeResolutionKm!==1||metadata.temporalResolutionMinutes!==5||metadata.discovery!=='S3 ListObjectsV2'||!String(metadata.frames?.at(-1)?.fileUrl||'').includes('mode=opera-raster-file')||!String(metadata.frames?.at(-1)?.fileUrl||'').includes('key=')){
  console.error('OPERA-Metadatentest fehlgeschlagen:',JSON.stringify(metadata));process.exit(1);
 }
 const times=metadata.frames.map(frame=>Date.parse(frame.time));if(times.some((time,index)=>index>0&&time-times[index-1]!==5*60000)){
  console.error('OPERA-Metadatentest fehlgeschlagen: Zeitachse ist nicht durchgehend fünfminütig.');process.exit(1);
 }
 const fileResponse=await module.default.fetch(new Request(metadata.frames.at(-1).fileUrl),{}),bytes=new Uint8Array(await fileResponse.arrayBuffer());
 if(!fileResponse.ok||bytes.length!==12||fileResponse.headers.get('access-control-allow-origin')!=='*'||fileResponse.headers.get('x-mid-opera-key')!==listedKeys.at(-1)){
  console.error('OPERA-Dateiproxytest fehlgeschlagen.');process.exit(1);
 }
 console.log('OPERA-Workerintegration geprüft: 13 tatsächlich gelistete 5-Minuten-Frames und validierter CORS-HDF5-Proxy.');
}finally{globalThis.fetch=originalFetch}

const fallbackFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'?input:input.url),method=String(init.method||'GET').toUpperCase();
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&url.searchParams.get('list-type')==='2')return new Response('Index vorübergehend nicht verfügbar',{status:503});
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&method==='GET'&&String(init.headers?.Range||init.headers?.range||'').startsWith('bytes='))return new Response(new Uint8Array([137,72,68,70,13,10,26,10]),{status:206,headers:{'content-type':'application/x-hdf5','content-range':'bytes 0-7/12'}});
 throw new Error(`Unerwarteter OPERA-Fallback-Testabruf: ${url}`);
};
try{
 const fallbackModule=await import('../worker/metar-proxy.js?opera-raster-fallback-test='+Date.now());
 const response=await fallbackModule.default.fetch(new Request('https://mid.test/?mode=opera-raster-meta&lat=50.82&lon=7.04'),{}),metadata=await response.json();
 if(!response.ok||metadata.discovery!=='HDF5 Range-Probe'||metadata.frames?.length!==13){
  console.error('OPERA-Range-Probe-Fallbacktest fehlgeschlagen:',JSON.stringify(metadata));process.exit(1);
 }
 console.log('OPERA-Fallback geprüft: S3-Indexausfall wird durch bestätigte HDF5-Range-Probes aufgefangen.');
}finally{globalThis.fetch=fallbackFetch}
