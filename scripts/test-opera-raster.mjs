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
 ['composite',path.join(root,'src','CompositeData.ts')]
].map(async([key,file])=>[key,await readFile(file,'utf8')])));
const failures=[];
const need=(key,token,message)=>{if(!files[key].includes(token))failures.push(message)};

need('worker',"mode==='opera-raster-meta'",'Workerroute opera-raster-meta fehlt.');
need('worker',"mode==='opera-raster-file'",'Workerroute opera-raster-file fehlt.');
need('worker','OPERA@${operaStamp(value)}@0@DBZH.h5','Offizieller OPERA-CIRRUS-DBZH-Dateipfad fehlt.');
need('panel','LazyOperaRasterOverlay','OPERA-Rasteroverlay ist nicht in das Kompositbild eingebunden.');
need('panel','OPERA CIRRUS · 1 km · 5 min','Dynamische OPERA-Quellenangabe fehlt.');
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
const dwd=files.worker.indexOf('if(!rainViewerOnly&&dwdExpected)'),rain=files.worker.indexOf('rainViewerRadarNowcast',dwd);if(dwd<0||rain<dwd)failures.push('Worker-Fallbackreihenfolge DWD vor RainViewer ist nicht erkennbar.');
const weatherDwd=files.weather.indexOf("requestRadarStage(params,'dwd'"),weatherOpera=files.weather.indexOf('analyseOperaRasterNowcast',weatherDwd),weatherFallback=files.weather.indexOf("'rainviewer',signal",weatherOpera);if(weatherDwd<0||weatherOpera<weatherDwd||weatherFallback<weatherOpera)failures.push('Frontend-Reihenfolge DWD → OPERA CIRRUS → Worker-Fallback ist nicht eingehalten.');

if(failures.length){console.error('OPERA-Phase-1-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('OPERA Phase 1 geprüft: echtes CIRRUS-HDF5, gemeinsame Rasterauswertung, DWD → OPERA → RainViewer und keine Stützpunktlogik.');

const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'?input:input.url),method=String(init.method||'GET').toUpperCase();
 if(url.hostname==='s3.waw3-1.cloudferro.com'&&method==='HEAD')return new Response(null,{status:200,headers:{'content-type':'application/x-hdf5'}});
 if(url.hostname==='s3.waw3-1.cloudferro.com')return new Response(new Uint8Array([137,72,68,70,13,10,26,10,1,2,3,4]),{status:200,headers:{'content-type':'application/x-hdf5','content-length':'12'}});
 throw new Error(`Unerwarteter OPERA-Testabruf: ${url}`);
};
try{
 const module=await import('../worker/metar-proxy.js?opera-raster-test='+Date.now());
 const metadataResponse=await module.default.fetch(new Request('https://mid.test/?mode=opera-raster-meta&lat=50.82&lon=7.04'),{}),metadata=await metadataResponse.json();
 if(!metadataResponse.ok||metadata.frames?.length!==13||metadata.nativeResolutionKm!==1||metadata.temporalResolutionMinutes!==5||!String(metadata.frames?.at(-1)?.fileUrl||'').includes('mode=opera-raster-file')){
  console.error('OPERA-Metadatentest fehlgeschlagen:',JSON.stringify(metadata));process.exit(1);
 }
 const times=metadata.frames.map(frame=>Date.parse(frame.time));if(times.some((time,index)=>index>0&&time-times[index-1]!==5*60000)){
  console.error('OPERA-Metadatentest fehlgeschlagen: Zeitachse ist nicht durchgehend fünfminütig.');process.exit(1);
 }
 const fileResponse=await module.default.fetch(new Request(metadata.frames.at(-1).fileUrl),{}),bytes=new Uint8Array(await fileResponse.arrayBuffer());
 if(!fileResponse.ok||bytes.length!==12||fileResponse.headers.get('access-control-allow-origin')!=='*'){
  console.error('OPERA-Dateiproxytest fehlgeschlagen.');process.exit(1);
 }
 console.log('OPERA-Workerintegration geprüft: 13 echte 5-Minuten-Metadatenframes und validierter CORS-HDF5-Proxy.');
}finally{globalThis.fetch=originalFetch}
