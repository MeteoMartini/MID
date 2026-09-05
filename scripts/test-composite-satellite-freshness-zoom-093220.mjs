import {readFile} from 'node:fs/promises';
const [panel,worker,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)};
const reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: Altvertrag noch vorhanden ${token}`)};
for(const token of [
 'function RasterZoomLifecycle({onStart,onEnd}',
 'useMapEvents({zoomstart:onStart,zoomend:onEnd})',
 'const[tileRevision,setTileRevision]=useState(0),[rasterZooming,setRasterZooming]=useState(false)',
 'handleRasterZoomStart=useCallback(()=>setRasterZooming(true)',
 'setTileRevision(value=>value+1);setRasterZooming(false)',
 '<RasterZoomLifecycle onStart={handleRasterZoomStart} onEnd={handleRasterZoomEnd}/>',
 'satelliteUntimed=Boolean(satelliteProduct?.latestOnly)',
 'satelliteBlend=targetSeconds>referenceSeconds+90?[]:satelliteUntimed?',
 'requestedSatelliteKey=satelliteUntimed?`latest:',
 'satelliteRenderFrames=[',
 'loadedSatelliteFrames.has(requestedSatelliteKey)',
 'time:iso',
 'keepBuffer={0}',
 'updateWhenZooming={false}'
])need('RadarPanel',panel,token);
for(const token of ['satelliteRenderBlend=withAdjacentPreload','latestToken=satelliteProduct.latestOnly','const tileRevision=0,rasterZooming=false'])reject('RadarPanel',panel,token);
for(const token of [
 "const EUMETSAT_WMS='https://view.eumetsat.int/geoserver/wms'",
 "{provider:'eumetsat',layer:'mtg_fd:rgb_geocolour'",
 'const SATELLITE_MAX_AGE_MINUTES=75',
 'const DWD_SATELLITE_MAX_AGE_MINUTES=210',
 'latest>=now-maxAgeMinutes*60000',
 'latestOnly:false',
 'latestOnly:true',
 'timeVerified:false',
 'untimedDwd.sort',
 'timed.sort((a,b)=>(b.latest-a.latest)'
])need('Worker',worker,token);
for(const token of ['SATELLITE_LATEST_DAY','SATELLITE_LATEST_IR'])reject('Worker',worker,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error('MID Satelliten-/Zoomprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID: Satellitenbild nutzt echte TIME-Snapshots mit Doppelpuffer; DWD ohne TIME bleibt kontrollierter, cache-busted Live-Snapshot.');
