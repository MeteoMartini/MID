import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const radar=await readFile(path.join(root,'src','RadarPanel.tsx'),'utf8');
const composite=await readFile(path.join(root,'src','CompositeData.ts'),'utf8');
const failures=[];
for(const token of [
  "const DWD_RADAR_WMS_PRIMARY='https://maps.dwd.de/geoserver/wms';",
  "const DWD_RADAR_LAYERS=['dwd:Radar_rv_product_1x1km_ger','dwd:Niederschlagsradar'];",
  "const SATELLITE_LATEST_DAY={provider:'eumetsat',layer:'mtg_fd:rgb_geocolour'",
  "const SATELLITE_LATEST_IR={provider:'eumetsat',layer:'mtg_fd:ir105_hrfi'",
  'result.mtgLightningLatestOnly=true',
  "result.dwdRadarLayer='dwd:Niederschlagsradar';result.dwdRadarLatestOnly=true",
  'async function compositeDiagnostics()',
  "if(mode==='composite-diagnostics')",
  'async function fetchWithDeadline',
  "cache:'no-store'",
  "'cache-control':'no-store, no-cache, must-revalidate'"
])if(!worker.includes(token))failures.push(`Live-WMS-Schutz fehlt: ${token}`);
for(const token of ['dwdRadarLatestOnly?:boolean;','mtgLightningLatestOnly?:boolean;'])if(!composite.includes(token))failures.push(`Komposit-Metadatenfeld fehlt: ${token}`);
for(const token of [
  'const LOCAL_SATELLITE_DAY:CompositeProduct=',
  'function localCompositeFallback(lat:number,lon:number)',
  'setProductTimes(localCompositeFallback(lat,lon))',
  'satelliteDirect?DIRECT_WMS[satelliteProvider]',
  'lightningDirect?DIRECT_WMS.eumetsat',
  'mtgLightningLatestOnly=mtgLightning&&!mtgLightningTimes.length',
  'Veraltete Blitzpunkt-Geometrien wurden verworfen',
  "fillColor:style.color"
])if(!radar.includes(token))failures.push(`Visueller Komposit-Fallback fehlt: ${token}`);
if(worker.includes("cache:'no-store',cf:{cacheTtl:0"))failures.push('Cloudflare-incompatible Kombination aus cache:no-store und cf.cacheTtl:0 ist noch vorhanden.');

const originalFetch=globalThis.fetch;
const tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64');
const captured=[];
globalThis.fetch=async(input,init={})=>{const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();if(request==='getmap'){captured.push({url:url.toString(),init});return new Response(tinyPng,{status:200,headers:{'content-type':'image/png'}})}throw new Error(`Unerwarteter Testabruf: ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?composite-live-test='+Date.now());
 const timesResponse=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=50.82&lon=7.04'),{}),times=await timesResponse.json();
 if(!timesResponse.ok||times.satelliteDayProduct?.layer!=='mtg_fd:rgb_geocolour'||!times.satelliteDayProduct?.latestOnly||!times.mtgLightningLatestOnly||!times.dwdRadarLatestOnly||times.dwdRadarLayer!=='dwd:Niederschlagsradar')failures.push(`Sofortige Live-Fallbacks werden nicht korrekt gemeldet: ${JSON.stringify(times)}`);
 if(captured.length)failures.push('composite-times blockiert weiterhin auf WMS-GetMap/Capabilities statt sofortige Fallbacks zu liefern.');
 const diagnostic=await module.default.fetch(new Request('https://mid.test/?mode=composite-diagnostics'),{}),diagnosticData=await diagnostic.json();
 if(!diagnostic.ok||diagnosticData.checks?.length!==3||!diagnosticData.checks.every(item=>item.ok))failures.push(`Quellendiagnose fehlgeschlagen: ${JSON.stringify(diagnosticData)}`);
 for(const [provider,layers] of [['dwd','dwd:Niederschlagsradar'],['eumetsat','mtg_fd:rgb_geocolour'],['eumetsat','mtg_fd:li_afa']]){
  const mapUrl=new URL('https://mid.test/');for(const[key,value]of Object.entries({mode:'composite-wms',provider,service:'WMS',request:'GetMap',version:provider==='dwd'?'1.1.1':'1.3.0',layers,styles:'',format:'image/png',transparent:'true',crs:'EPSG:3857',srs:'EPSG:3857',bbox:'700000,6500000,800000,6600000',width:'256',height:'256'}))mapUrl.searchParams.set(key,value);
  const response=await module.default.fetch(new Request(mapUrl),{}),last=captured.at(-1);
  if(!response.ok||!last||last.init?.cache!=='no-store'||last.init?.cf!==undefined||!String(response.headers.get('cache-control')).includes('no-store')||new URL(last.url).searchParams.has('time'))failures.push(`${layers} wird nicht cachefrei ohne TIME geladen: ${last?.url||response.status}`);
 }
}finally{globalThis.fetch=originalFetch}
if(failures.length){console.error('Komposit-Live-Layer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Komposit-Live-Layer geprüft: sofortige offizielle Latest-Fallbacks, Worker-/Direkt-WMS-Rückfall, Quellendiagnose und frische Blitzdarstellung sind abgesichert.');
