import {readFile} from 'node:fs/promises';

const [app,vite,css]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../vite.config.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
for(const module of ['RadarPanel','EnsemblePanel','WaterSportsPanel','MeteogramPanel']){
 if(!app.includes(`lazy(()=>import('./${module}'))`))failures.push(`${module} wird nicht lazy geladen`);
}
for(const token of ["target:'es2020'","cssCodeSplit:true","sourcemap:false","reportCompressedSize:false"]){
 if(!vite.includes(token))failures.push(`Sichere Vite-Optimierung fehlt: ${token}`);
}
if(vite.includes('manualChunks'))failures.push('Riskante manuelle Vendor-Chunk-Aufteilung ist wieder aktiv');
for(const token of ['content-visibility:auto','contain-intrinsic-size:auto 620px','overscroll-behavior-inline:contain','prefers-reduced-motion']){
 if(!css.includes(token))failures.push(`Responsive/Performance-CSS fehlt: ${token}`);
}
if(failures.length){
 console.error(`Performance-/Responsivitätsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Performance-/Responsivitätsprüfung bestanden: Lazy-Module, sichere Vite-Optimierungen, Rendering-Containment, Touch-Scrolling und reduzierte Bewegung sind abgesichert; manuelle Vendor-Chunks sind deaktiviert.');
