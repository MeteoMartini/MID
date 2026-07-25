import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const workerText=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const failures=[];
for(const token of [
  "const DWD_RADAR_WMS_PRIMARY='https://maps.dwd.de/geoserver/wms';",
  "const DWD_RADAR_WMS_WORKSPACE='https://maps.dwd.de/geoserver/dwd/wms';",
  'const DWD_RADAR_WMS_BASES=[DWD_RADAR_WMS_PRIMARY,DWD_RADAR_WMS_BACKUP,DWD_RADAR_WMS_WORKSPACE,DWD_RADAR_WMS_BACKUP_WORKSPACE];',
  'function dwdLayerForEndpoint(layer,base)',
  "String(value).split(',').map(layer=>dwdLayerForEndpoint(layer,base)).join(',')",
  "result.dwdRadarLayer='dwd:Niederschlagsradar';result.dwdRadarLatestOnly=true"
])if(!workerText.includes(token))failures.push(`DWD-WMS-Routing fehlt: ${token}`);
const originalFetch=globalThis.fetch,tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64'),getMapUrls=[];
globalThis.fetch=async input=>{const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();if(request==='getmap'){getMapUrls.push(url.toString());if(url.pathname==='/geoserver/wms')return new Response('temporarily unavailable',{status:503});return new Response(tinyPng,{status:200,headers:{'content-type':'image/png'}})}throw new Error(`Unerwarteter Abruf: ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?dwd-routing-test='+Date.now());
 const mapUrl=new URL('https://mid.test/');for(const[key,value]of Object.entries({mode:'composite-wms',provider:'dwd',service:'WMS',request:'GetMap',version:'1.1.1',layers:'dwd:Radar_rv_product_1x1km_ger',styles:'',format:'image/png',transparent:'true',srs:'EPSG:3857',bbox:'700000,6500000,800000,6600000',width:'256',height:'256'}))mapUrl.searchParams.set(key,value);
 const response=await module.default.fetch(new Request(mapUrl),{}),workspaceRequest=getMapUrls.find(value=>new URL(value).pathname==='/geoserver/dwd/wms');
 if(!response.ok||!workspaceRequest||new URL(workspaceRequest).searchParams.get('layers')!=='Radar_rv_product_1x1km_ger')failures.push(`Workspace-Fallback entfernt Namespace nicht korrekt: ${workspaceRequest||response.status}`);
}finally{globalThis.fetch=originalFetch}
if(failures.length){console.error('DWD-WMS-Routing-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('DWD-WMS-Routing geprüft: generischer offizieller Endpunkt zuerst, Backup und Workspace-Fallback mit passendem namespacefreien Layernamen.');
