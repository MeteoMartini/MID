import {readFile} from 'node:fs/promises';
const [panel,worker,sw,swAlias,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../public/sw.js',import.meta.url),'utf8'),
 readFile(new URL('../public/service-worker.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
const reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: Altvertrag noch vorhanden ${token}`)};
for(const [name,text] of [['sw.js',sw],['service-worker.js',swAlias]]){
 for(const token of [
  'function dynamicNetworkRequest(url)',
  "Boolean(mode)||url.searchParams.has('_mid_frame')||url.searchParams.has('_mid_revision')",
  "request==='getmap'||request==='getfeatureinfo'||service==='wms'",
  'async function purgeDynamicCacheEntries()',
  'await purgeDynamicCacheEntries();const meta=await readMeta()',
  "if(dynamicNetworkRequest(url))return fetch(request,{cache:'no-store'})",
  'const shellAsset=runtimeShellAsset(request,url)'
 ])need(name,text,token);
 reject(name,text,"const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;\n  return fetch(request).then(response=>{if(response.ok&&['script','style','image','font'].includes(request.destination))");
}
need('RadarPanel',panel,"satelliteTimeline,targetSeconds,{interpolationGapSeconds:0,earlyGraceSeconds:45*60");
need('RadarPanel',panel,"...(iso?{time:iso}:{})");
reject('RadarPanel',panel,"satelliteTimeline,targetSeconds,{interpolationGapSeconds:35*60");
need('Worker',worker,"const cacheTtl=base===EUMETSAT_WMS?60:180");
need('Worker',worker,"'Cache-Control':'no-cache'");
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(pv!=='0.9.32.21')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.32.21 Satelliten-Snapshot-/Cacheprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.21: dynamische WMS-Anfragen network-only, Altcache-Bereinigung und diskrete EUMETSAT-Zeitstände geprüft.');
