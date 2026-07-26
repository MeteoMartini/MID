import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const worker=await readFile(path.join(root,'worker','metar-proxy.js'),'utf8');
const failures=[];
for(const token of [
 "const SATELLITE_LATEST_DAY={provider:'eumetsat',layer:'mtg_fd:rgb_geocolour'",
 "const SATELLITE_LATEST_IR={provider:'eumetsat',layer:'mtg_fd:ir105_hrfi'",
 'result.mtgLightningLatestOnly=true',
 "result.dwdRadarLayer='dwd:Niederschlagsradar';result.dwdRadarLatestOnly=true",
 'async function compositeDiagnostics()',
 "if(mode==='composite-diagnostics')",
 'async function fetchWithDeadline',
 "cache:'no-store'"
])if(!worker.includes(token))failures.push(`Live-WMS-Schutz fehlt: ${token}`);
const originalFetch=globalThis.fetch,tinyPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAF/gL+5qJ3WQAAAABJRU5ErkJggg==','base64'),captured=[];
globalThis.fetch=async(input,init={})=>{const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();if(request==='getmap'){captured.push({url:url.toString(),init});return new Response(tinyPng,{status:200,headers:{'content-type':'image/png'}})}throw new Error(`Unerwarteter Testabruf: ${url}`)};
try{
 const module=await import('../worker/metar-proxy.js?composite-live-test='+Date.now());
 const timesResponse=await module.default.fetch(new Request('https://mid.test/?mode=composite-times&lat=50.82&lon=7.04'),{}),times=await timesResponse.json();
 if(!timesResponse.ok||times.satelliteDayProduct?.layer!=='mtg_fd:rgb_geocolour'||!times.satelliteDayProduct?.latestOnly||!times.mtgLightningLatestOnly||!times.dwdRadarLatestOnly||times.dwdRadarLayer!=='dwd:Niederschlagsradar')failures.push(`Sofortige Live-Fallbacks werden nicht korrekt gemeldet: ${JSON.stringify(times)}`);
 if(captured.length)failures.push('composite-times blockiert weiterhin auf WMS-GetMap statt sofortige Fallbacks zu liefern.');
 const diagnostic=await module.default.fetch(new Request('https://mid.test/?mode=composite-diagnostics'),{}),diagnosticData=await diagnostic.json();
 if(!diagnostic.ok||diagnosticData.checks?.length!==3||!diagnosticData.checks.every(item=>item.ok))failures.push(`Quellendiagnose fehlgeschlagen: ${JSON.stringify(diagnosticData)}`);
}finally{globalThis.fetch=originalFetch}
if(failures.length){console.error('Komposit-Live-Layer-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Komposit-Live-Layer geprüft: sofortige offizielle Latest-Fallbacks und Quellendiagnose sind abgesichert.');
