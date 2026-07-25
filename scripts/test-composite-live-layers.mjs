import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const radar=await readFile(path.join(root,'src','RadarPanel.tsx'),'utf8');
const failures=[];

for(const token of [
  "const DWD_RADAR_WMS_PRIMARY='https://maps.dwd.de/geoserver/wms';",
  'const DWD_RADAR_WMS_BASES=[DWD_RADAR_WMS_PRIMARY,DWD_RADAR_WMS_BACKUP,DWD_RADAR_WMS_WORKSPACE,DWD_RADAR_WMS_BACKUP_WORKSPACE];',
  "firstWmsCapabilities(DWD_RADAR_WMS_BASES,'DWD')",
  "layer:'dwd:Satellite_meteosat_1km_euat_rgb_day_hrv_and_night_ir108_3h'",
  "function sameWmsLayer(left,right)",
  "function dwdLayerForEndpoint(layer,base)",
  "cache:'no-store',cf:{cacheTtl:0,cacheEverything:false}",
  "'cache-control':'no-store, no-cache, must-revalidate'",
  'const maxAgeMinutes=Number(candidate.maxAgeMinutes)||190,freshAgeMinutes=Number(candidate.freshAgeMinutes)||80;'
]) if(!worker.includes(token)) failures.push(`Live-WMS-Schutz fehlt: ${token}`);

for(const token of [
  'useDwdLightningRaster=dwdLightning&&dwdLightningTimes.length>0',
  'useMtgLightningRaster=mtgLightning&&mtgLightningTimes.length>0',
  'lightningAvailableTimes=useDwdLightningRaster?dwdLightningTimes:useMtgLightningRaster?mtgLightningTimes:[]',
  "version:'1.3.0',time:(frame as any).iso,tiled:true",
  'showLightning&&!vectorLightning&&!useDwdLightningRaster&&useMtgLightningRaster'
]) if(!radar.includes(token)) failures.push(`Blitz-Raster-Fallback fehlt: ${token}`);

if(worker.includes("'cache-control':'public, max-age=120','x-mid-wms-provider'")) failures.push('WMS-Kartenbilder werden weiterhin browserseitig zwei Minuten gecacht.');
if(/Number\.isFinite\(latest\).*else latestOnly\.push/.test(worker)) failures.push('Veraltete Satelliten-Zeitdimension kann weiterhin als latestOnly ausgegeben werden.');

const originalFetch=globalThis.fetch;
const now=Date.now(),fresh=new Date(Math.floor((now-5*60000)/300000)*300000).toISOString(),stale=new Date(now-8*3600000).toISOString();
const eumetCapabilities=`<WMS_Capabilities><Capability><Layer>
  <Layer><Name>mtg_fd:vis06_hrfi</Name><Dimension name="time">${stale}</Dimension></Layer>
  <Layer><Name>msg_fes:rgb_eview</Name><Dimension name="time">${fresh}</Dimension></Layer>
  <Layer><Name>mtg_fd:ir105_hrfi</Name><Dimension name="time">${fresh}</Dimension></Layer>
  <Layer><Name>mtg_fd:li_afa</Name><Dimension name="time">${fresh}</Dimension></Layer>
</Layer></Capability></WMS_Capabilities>`;
const dwdCapabilities=`<WMS_Capabilities><Capability><Layer>
  <Layer><Name>dwd:Radar_rv_product_1x1km_ger</Name><Dimension name="time">${fresh}</Dimension></Layer>
  <Layer><Name>dwd:Blitzdichte</Name></Layer>
</Layer></Capability></WMS_Capabilities>`;
const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64');
let capturedMapUrl='',capturedMapInit;
globalThis.fetch=async(input,init={})=>{
  const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();
  if(request==='getcapabilities')return new Response(url.hostname.includes('eumetsat')?eumetCapabilities:dwdCapabilities,{status:200,headers:{'content-type':'application/xml'}});
  if(request==='getmap'){
    capturedMapUrl=url.toString();capturedMapInit=init;
    return new Response(tinyPng,{status:200,headers:{'content-type':'image/png','cache-control':'public, max-age=999'}});
  }
  throw new Error(`Unerwarteter Testabruf: ${url}`);
};
try{
  const module=await import('../worker/metar-proxy.js?composite-live-test='+Date.now());
  const timesResponse=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=50.82&lon=7.04'),{}),times=await timesResponse.json();
  if(!timesResponse.ok||times.satelliteDayProduct?.layer!=='msg_fes:rgb_eview'||times.satelliteDayProduct?.latestOnly||!times.mtgLightning?.length||times.dwdRadarLayer!=='dwd:Radar_rv_product_1x1km_ger'){
    failures.push(`Kompositzeiten wählen Quellen nicht korrekt: ${JSON.stringify(times)}`);
  }
  const mapUrl=new URL('https://mid.test/');
  for(const [key,value] of Object.entries({mode:'composite-wms',provider:'dwd',service:'WMS',request:'GetMap',version:'1.1.1',layers:'dwd:Radar_rv_product_1x1km_ger',styles:'',format:'image/png',transparent:'true',srs:'EPSG:3857',bbox:'700000,6500000,800000,6600000',width:'256',height:'256',time:fresh}))mapUrl.searchParams.set(key,value);
  const mapResponse=await module.default.fetch(new Request(mapUrl),{});
  if(!mapResponse.ok||!capturedMapUrl.includes('/geoserver/wms?')||capturedMapInit?.cache!=='no-store'||capturedMapInit?.cf?.cacheTtl!==0||!String(mapResponse.headers.get('cache-control')).includes('no-store')){
    failures.push(`DWD-Live-WMS wird nicht cachefrei über den offiziellen generischen Endpunkt geladen: ${capturedMapUrl} / ${mapResponse.status}`);
  }
}finally{globalThis.fetch=originalFetch}

if(failures.length){
  console.error('Komposit-Live-Layer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Komposit-Live-Layer geprüft: frische WMS-Antworten, DWD-Workspace-Endpunkt, Stale-Satellitenfilter und MTG-LI-Fallback sind aktiv.');
