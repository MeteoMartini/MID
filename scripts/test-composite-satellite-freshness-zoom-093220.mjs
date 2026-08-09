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
 "const iso=satelliteProduct.latestOnly?'':((frame as any).iso||satelliteLatestIso||'')",
 "latestToken=satelliteProduct.latestOnly?`latest:${productTimes.checkedAt||Math.floor(referenceMs/300000)}`",
 'keepBuffer={0}',
 'updateWhenZooming={false}'
])need('RadarPanel',panel,token);
reject('RadarPanel',panel,'const tileRevision=0,rasterZooming=false');
for(const token of [
 "const EUMETSAT_WMS='https://view.eumetsat.int/geoserver/wms'",
 "{provider:'eumetsat',layer:'mtg_fd:rgb_geocolour'",
 'fresh:latest>=now-35*60000',
 "products.sort((a,b)=>Number(b.fresh)-Number(a.fresh)||(b.latest-a.latest)||(b.priority??0)-(a.priority??0)"
])need('Worker',worker,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(pv!=='0.9.32.20')failures.push(`unerwartete Version ${pv}`);
if(failures.length){console.error('MID v0.9.32.20 Satelliten-/Zoomprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.9.32.20: EUMETSAT-Primärquelle, recency-first RGB-Auswahl und vollständiger Raster-Neuaufbau nach Zoom geprüft.');
