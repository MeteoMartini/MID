import fs from 'node:fs';
import path from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';

const assetsDir=path.resolve('dist/assets');
if(!fs.existsSync(assetsDir)){console.log('Feature-Chunk-Budget: dist/assets fehlt; Prüfung wird nach dem Vite-Build aktiv.');process.exit(0)}
const files=fs.readdirSync(assetsDir).filter(name=>/\.(?:js|css)$/.test(name)).map(name=>{const data=fs.readFileSync(path.join(assetsDir,name));return{name,bytes:data.length,gzipBytes:gzipSync(data,{level:9}).length,brotliBytes:brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:11}}).length}});
const rules=[
 ['MapLibreCore JS',/^MapLibreCore-.*\.js$/,1_050_000],
 ['MapLibre Worker',/^maplibre-gl-worker-.*\.js$/,520_000],
 ['Charts Vendor',/^ChartsVendor-.*\.js$/,460_000],
 ['React Vendor',/^ReactVendor-.*\.js$/,410_000],
 ['Radar Feature',/^RadarPanel-.*\.js$/,150_000],
 ['Ensemble Feature',/^EnsemblePanel-.*\.js$/,135_000],
 ['Long-range Feature',/^LongRangePanel-.*\.js$/,70_000],
 ['MapLibre CSS',/^MapLibreCore-.*\.css$/,100_000],
];
const failures=[];
for(const [label,pattern,maxBytes] of rules){const matches=files.filter(item=>pattern.test(item.name));if(!matches.length){failures.push(`${label}: Chunk fehlt`);continue}for(const item of matches)if(item.bytes>maxBytes)failures.push(`${label}: ${item.bytes} B > ${maxBytes} B (${item.name})`)}
const excluded=/^(?:index-|MapLibreCore-|maplibre-gl-worker-|ChartsVendor-|ReactVendor-|esm-|web-|rolldown-runtime-|preload-helper-)/;
const featureJs=files.filter(item=>item.name.endsWith('.js')&&!excluded.test(item.name));
for(const item of featureJs)if(item.bytes>180_000)failures.push(`Feature-Chunk ${item.name}: ${item.bytes} B > 180000 B`);
const report=files.sort((a,b)=>b.bytes-a.bytes).slice(0,18);
console.log('Feature-Chunk-Budget (Bytes · gzip · brotli):');
for(const item of report)console.log(`- ${item.name}: ${item.bytes} · ${item.gzipBytes} · ${item.brotliBytes}`);
if(failures.length){for(const failure of failures)console.error('✗ '+failure);process.exit(1)}
console.log('✓ MID Feature-/Lazy-Chunks bleiben innerhalb der v0.9.85.95-Härtungsbudgets.');
