import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const radar=await readFile(path.join(root,'src','RadarPanel.tsx'),'utf8');
const serviceWorker=await readFile(path.join(root,'public','service-worker.js'),'utf8');
const legacyWorker=await readFile(path.join(root,'public','sw.js'),'utf8');
const failures=[];

for(const token of [
  '[tileRevision,setTileRevision]=useState(()=>Math.floor(Date.now()/60000))',
  'loadCompositeTimes(lat,lon,controller.signal).then(raw=>{const data=withLocalCompositeFallback(raw,lat,lon);',
  'window.setInterval(()=>setTileRevision(value=>value+1),120000)',
  'onClick={()=>{setShowSatellite(value=>!value);setTileRevision(value=>value+1)}}',
  'rasterVersionUrl(satelliteProxy,tileRevision,iso)'
]) if(!radar.includes(token)) failures.push(`Automatische Raster-Aktualisierung fehlt: ${token}`);

for(const token of [
  'function liveDataRequest(request,url)',
  "const mode=String(url.searchParams.get('mode')||'').toLowerCase()",
  "if(liveDataRequest(request,url))return fetch(request,{cache:'no-store'})",
  'const cached=await cache.match(request);if(cached)return cached;'
]) if(!serviceWorker.includes(token)) failures.push(`Service-Worker-Livedatenregel fehlt: ${token}`);

if(serviceWorker.includes('const cached=await cache.match(request,{ignoreSearch:true});if(cached)return cached;')) failures.push('Der Service Worker ignoriert bei Laufzeitressourcen weiterhin Query-Parameter und kann dadurch alte WMS-Kacheln ausliefern.');
if(serviceWorker!==legacyWorker) failures.push('service-worker.js und sw.js weichen voneinander ab.');

if(failures.length){
  console.error('Komposit-Cache-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Komposit-Cache geprüft: Live-WMS-/Worker-Anfragen umgehen den App-Shell-Cache und Satellitenkacheln erhalten automatische Revisionswechsel.');
