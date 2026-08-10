import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [worker,radar,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,tokens)=>{for(const token of tokens)if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('Mehrort-Resilienz',worker,[
 'const stormReversePlaceCache=new Map()',
 'function stormMotionEstimate(',
 'synthetic:true',
 'for(let minutes=remainingStart;minutes<=60;minutes+=10)',
 'async function overpassStormPlaces(track,impact)',
 'Promise.any(requests)',
 'async function mapStormPlacesConcurrent(',
 'if(rows.length<3||nonReferenceRows.length<2||futureRows.length<2)',
 "OpenStreetMap/Overpass + BigDataCloud · ergänzter KONRAD3D-Zugbahnkorridor",
 'trackForecasts:track.filter(point=>point.minutes>0)'
]);
need('Ruckelfreie Karte',radar,[
 'function withAdjacentPreload',
 'dwdRenderBlend=withAdjacentPreload',
 'rainRenderBlend=withAdjacentPreload',
 'snapshotToken=satelliteUntimed?`latest:${revision}`:`snapshot:${iso}`',
 'keepBuffer={2}',
 'keepBuffer={1}',
 'updateWhenIdle={touchDevice}',
 'updateWhenZooming={!touchDevice}',
 'fadeAnimation={!touchDevice}',
 'zoomAnimation={!touchDevice}',
 'markerZoomAnimation={!touchDevice}'
]);
if(radar.includes('RasterCacheRevision'))failures.push('Rasterlayer werden beim Zoom weiterhin vollständig cache-invalidiert.');
need('GPU-schonende Überblendung',styles,[
 '.composite-card .maplibregl-canvas-container{transform:translateZ(0);backface-visibility:hidden}',
 'will-change:opacity'
]);
need('Package-Test',pkg,['test:storm-place-radar-performance']);
need('Baseline-Test',baseline,['scripts/test-storm-place-resilience-radar-performance-09154.mjs']);

const compileTsx=(source,fileName)=>{
 const output=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022},reportDiagnostics:true,fileName});
 const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
 if(errors.length)throw new Error(errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,'\n')).join(' | '));
};
try{compileTsx(radar,'RadarPanel.tsx')}catch(error){failures.push(`RadarPanel-Parser: ${error instanceof Error?error.message:String(error)}`)}

try{
 const transformed=worker.replace(/export\s*\{[^}]+\};?/g,'').replace(/export default\s*\{/, 'const __workerDefault={')+"\nmodule.exports={stormTrackPoints,enrichStormAffectedPlaces};";
 const mockFetch=async input=>{
  const url=String(input);
  if(url.includes('overpass'))return new Response(JSON.stringify({elements:[{type:'node',lat:50,lon:7,tags:{name:'Startstadt',place:'town',population:'20000'}}]}),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('bigdatacloud')){const parsed=new URL(url),longitude=Number(parsed.searchParams.get('longitude')),name=longitude<7.08?'Startstadt':longitude<7.2?'Ort A':longitude<7.35?'Ort B':'Ort C';return new Response(JSON.stringify({locality:name,countryCode:'DE'}),{status:200,headers:{'content-type':'application/json'}})}
  throw new Error(`Unerwartete Test-URL ${url}`);
 };
 const module={exports:{}};new Function('module','exports','fetch',transformed)(module,module.exports,mockFetch);
 const cell={id:'K3D-resilience',latitude:50,longitude:7,currentImpactRadiusKm:6,motionDirectionDeg:90,speedKmh:60,trackForecasts:[]};
 const track=module.exports.stormTrackPoints(cell);
 if(track.length<7||track.at(-1)?.minutes!==60)failures.push(`Synthetische 60-Minuten-Zugbahn unvollständig: ${track.length}/${track.at(-1)?.minutes}`);
 if(!track.slice(1).every(point=>point.synthetic===true))failures.push('Ausgedünnte Produktspur wird nicht eindeutig als abgeleitete Ergänzung gekennzeichnet.');
 const enriched=await module.exports.enrichStormAffectedPlaces(cell,50,7,'2026-08-04T12:00:00Z'),places=enriched.affectedPlaces??[],names=new Set(places.map(place=>place.name));
 if(places.length<3||names.size<3)failures.push(`Ortsliste bleibt auf einen/zu wenige Orte beschränkt: ${places.map(place=>place.name).join(', ')}`);
 if((enriched.futureAffectedPlaceCount??0)<2)failures.push(`Zu wenige vorausliegende Orte: ${enriched.futureAffectedPlaceCount}`);
 if(!String(enriched.routeSummary||'').includes('über'))failures.push(`Mehrort-Zugbahnsatz fehlt: ${enriched.routeSummary}`);
 if(!String(enriched.placeSource||'').includes('Overpass + BigDataCloud'))failures.push(`Ergänzungsquelle nicht transparent: ${enriched.placeSource}`);
}catch(error){failures.push(`Funktionale Mehrortprüfung nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Stormtracker-/Mehrort-/Performanceprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Mehrere Gewitterorte, 60-Minuten-Zugbahn, Fallback-Ergänzung und ruckelarme Radar-Layer geprüft.');
