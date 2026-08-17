import {readFile} from 'node:fs/promises';

const [app,flight,vite,css]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/FlightMeteorologyPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../vite.config.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const module of ['RadarPanel','EnsemblePanel','WaterSportsPanel','FlightMeteorologyPanel']){
 if(!app.includes(`lazy(()=>import('./${module}'))`))failures.push(`${module} wird nicht lazy geladen`);
}
if(!flight.includes("lazy(()=>import('./MeteogramPanel'))"))failures.push('MeteogramPanel wird innerhalb der Flugmeteorologie nicht lazy geladen');
for(const token of ["target:'es2020'","cssCodeSplit:true","sourcemap:false","reportCompressedSize:false"]){
 if(!vite.includes(token))failures.push(`Sichere Vite-Optimierung fehlt: ${token}`);
}
if(vite.includes('manualChunks')){
 const auditedVendorSplit=vite.includes('manualChunks:midVendorChunk')&&vite.includes("return 'ReactVendor'")&&vite.includes("return 'ChartsVendor'");
 if(!auditedVendorSplit)failures.push('Riskante oder nicht auditierte manuelle Vendor-Chunk-Aufteilung ist aktiv');
 const chunkFunctionStart=vite.indexOf('function midVendorChunk');
 const chunkFunctionEnd=vite.indexOf('export default defineConfig');
 const chunkFunction=chunkFunctionStart>=0&&chunkFunctionEnd>chunkFunctionStart?vite.slice(chunkFunctionStart,chunkFunctionEnd):'';
 const chunkNames=[...chunkFunction.matchAll(/return\s+'([^']+)'/g)].map(match=>match[1]);
 const unexpected=[...new Set(chunkNames.filter(name=>!['ReactVendor','ChartsVendor'].includes(name)))];
 if(unexpected.length)failures.push(`Nicht auditierte Vendor-Chunks aktiv: ${unexpected.join(', ')}`);
 const manualChunkAssignments=[...vite.matchAll(/\bmanualChunks\s*:/g)].length;
 if(manualChunkAssignments!==1)failures.push(`Unerwartete Anzahl manualChunks-Zuweisungen: ${manualChunkAssignments}`);
 if(/return\s+['"](?:MapLibre|Maplibre|MapLibreVendor|MapVendor)['"]/.test(chunkFunction))failures.push('MapLibre darf nicht in einen manuellen Vendor-Chunk verschoben werden');
}
for(const token of ['content-visibility:auto','contain-intrinsic-size:auto 620px','overscroll-behavior-inline:contain','prefers-reduced-motion']){
 if(!css.includes(token))failures.push(`Responsive/Performance-CSS fehlt: ${token}`);
}
if(failures.length){
 console.error(`Performance-/Responsivitätsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Performance-/Responsivitätsprüfung bestanden: Lazy-Module, sichere Vite-Optimierungen, Rendering-Containment, Touch-Scrolling und reduzierte Bewegung sind abgesichert; nur die auditierte React-/Charts-Vendor-Aufteilung ist zulässig, MapLibre bleibt lazy.');
