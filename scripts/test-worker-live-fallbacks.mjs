import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const failures=[];
for(const token of [
 "const SATELLITE_LATEST_DAY={provider:'eumetsat',layer:'mtg_fd:rgb_geocolour'",
 "const SATELLITE_LATEST_IR={provider:'eumetsat',layer:'mtg_fd:ir105_hrfi'",
 "layer:'mtg_fd:rgb_geocolour'",
 'satelliteProduct(capabilities,SATELLITE_DAY_CANDIDATES,now)',
 'dwdTimesFromCapabilities(dwdXml,timingLayer)',
 'result.dwdRadarLatestOnly=result.dwdRadarLayer===alias||!observed.length',
 'async function compositeDiagnostics()',
 "if(mode==='composite-diagnostics')",
 'async function fetchWithDeadline',
 'cf:{cacheTtl:180,cacheEverything:true}'
])if(!worker.includes(token))failures.push(`Live-WMS-Schutz fehlt: ${token}`);
const originalFetch=globalThis.fetch,tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64'),captured=[];
const now=Date.now(),stamp=offset=>new Date(now+offset*60000).toISOString().replace('.000Z','Z');
const eumetsatXml=`<WMS_Capabilities><Capability><Layer><Layer><Name>mtg_fd:rgb_geocolour</Name><Dimension name="time">${stamp(-30)},${stamp(-20)},${stamp(-10)}</Dimension></Layer><Layer><Name>mtg_fd:ir105_hrfi</Name><Dimension name="time">${stamp(-30)},${stamp(-20)},${stamp(-10)}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`;
const dwdXml=`<WMS_Capabilities><Capability><Layer><Layer><Name>dwd:Radar_rv_product_1x1km_ger</Name><Dimension name="time">${stamp(-15)},${stamp(-10)},${stamp(-5)}</Dimension></Layer><Layer><Name>dwd:Niederschlagsradar</Name><Dimension name="time">${stamp(-15)},${stamp(-10)},${stamp(-5)}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`;
globalThis.fetch=async(input,init={})=>{const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();if(request==='getcapabilities'){if(url.hostname.includes('eumetsat'))return new Response(eumetsatXml,{status:200,headers:{'content-type':'application/xml'}});if(url.hostname.includes('dwd.de'))return new Response(dwdXml,{status:200,headers:{'content-type':'application/xml'}})}if(request==='getmap'){captured.push({url:url.toString(),init});return new Response(tinyPng,{status:200,headers:{'content-type':'image/png'}})}throw new Error(`Unerwarteter Testabruf: ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?composite-live-test='+Date.now());
 const timesResponse=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=50.82&lon=7.04'),{}),times=await timesResponse.json();
 if(!timesResponse.ok||times.satelliteDayProduct?.layer!=='mtg_fd:rgb_geocolour'||times.satelliteDayProduct?.latestOnly||!times.satelliteDayProduct?.latestTime||times.dwdRadarLatestOnly!==true||!times.dwdRadar?.length||times.dwdRadarLayer!=='dwd:Niederschlagsradar')failures.push(`Exakte aktuelle Produktzeiten werden nicht korrekt gemeldet: ${JSON.stringify(times)}`);
 if(captured.length)failures.push('composite-times darf keine WMS-GetMap-Probe benötigen; Capabilities genügen.');
 const diagnostic=await module.default.fetch(new Request('https://mid.test/?mode=composite-diagnostics'),{}),diagnosticData=await diagnostic.json();
 if(!diagnostic.ok||diagnosticData.checks?.length!==3||!diagnosticData.checks.every(item=>item.ok))failures.push(`Quellendiagnose fehlgeschlagen: ${JSON.stringify(diagnosticData)}`);
}finally{globalThis.fetch=originalFetch}
if(failures.length){console.error('Komposit-Live-Layer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Komposit-Live-Layer geprüft: verifizierte WMS-Zeitdimensionen, stabiler DWD-Radaralias, exakte Referenzzeit und Quellendiagnose sind abgesichert.');
