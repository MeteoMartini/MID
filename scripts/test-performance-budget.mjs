import {readFile} from 'node:fs/promises';

const [app,flight,vite,css,mapWorkspace]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/FlightMeteorologyPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../vite.config.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/MapWorkspacePanel.tsx',import.meta.url),'utf8')
]);
const failures=[];
for(const module of ['EnsemblePanel','WaterSportsPanel','FlightMeteorologyPanel']){
 if(!app.includes(`lazy(()=>import('./${module}'))`))failures.push(`${module} wird nicht lazy geladen`);
}
if(!mapWorkspace.includes("const LazyUnifiedWeatherMap=lazy(()=>import('./UnifiedWeatherMap'))")||!mapWorkspace.includes('const MemoLazyUnifiedWeatherMap=memo(LazyUnifiedWeatherMap)'))failures.push('RadarPanel bleibt nicht lazy und memoisiert im gemeinsamen Kartenarbeitsraum');
if(!mapWorkspace.includes("lazy(()=>import('./UnifiedWeatherMap'))"))failures.push('WeatherMapsPanel wird im gemeinsamen Kartenarbeitsraum nicht lazy geladen');
if(!flight.includes("lazy(()=>import('./MeteogramPanel'))"))failures.push('MeteogramPanel wird innerhalb der Flugmeteorologie nicht lazy geladen');
for(const token of ["target:'es2020'","cssCodeSplit:true","sourcemap:false","reportCompressedSize:false"]){
 if(!vite.includes(token))failures.push(`Sichere Vite-Optimierung fehlt: ${token}`);
}
for(const token of ["minify:'oxc'","cssMinify:'lightningcss'",'rolldownOptions','codeSplitting',"name:'ReactVendor'","name:'ChartsVendor'"]){
 if(!vite.includes(token))failures.push(`Auditierte Vite-8-Optimierung fehlt: ${token}`);
}
for(const token of ["minify:'esbuild'","cssMinify:'esbuild'",'manualChunks','rollupOptions'])if(vite.includes(token))failures.push(`Deprecated Vite-Pfad ist aktiv: ${token}`);
if(/name:['"](?:MapLibre|Maplibre|MapLibreVendor|MapVendor)['"]/.test(vite))failures.push('MapLibre darf nicht in einen erzwungenen Vendor-Chunk verschoben werden');
for(const token of ['content-visibility:auto','contain-intrinsic-size:auto 620px','overscroll-behavior-inline:contain','prefers-reduced-motion']){
 if(!css.includes(token))failures.push(`Responsive/Performance-CSS fehlt: ${token}`);
}
if(failures.length){
 console.error(`Performance-/Responsivitätsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Performance-/Responsivitätsprüfung bestanden: Lazy-Module, sichere Vite-Optimierungen, Rendering-Containment, Touch-Scrolling und reduzierte Bewegung sind abgesichert; nur die auditierte React-/Charts-Vendor-Aufteilung ist zulässig, MapLibre bleibt lazy.');
