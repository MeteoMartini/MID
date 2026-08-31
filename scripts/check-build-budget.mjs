import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {gzipSync} from 'node:zlib';

const root=path.resolve(process.argv[2]||'dist');
const baseline=JSON.parse(await readFile(new URL('../MID_PERFORMANCE_BASELINE.json',import.meta.url),'utf8'));
const COMPRESSIBLE_EXTENSIONS=new Set(['.js','.css','.html','.json','.xml','.svg','.txt','.webmanifest','.map']);
const STATIC_MEDIA_EXTENSIONS=new Set(['.png','.jpg','.jpeg','.webp','.avif','.gif','.ico','.woff','.woff2','.ttf','.otf']);
const files=[];
async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const full=path.join(dir,entry.name);entry.isDirectory()?await walk(full):files.push(full)}}
await walk(root);
const assets=[];
for(const file of files){
  const data=await readFile(file);
  const extension=path.extname(file).toLowerCase();
  assets.push({file:path.relative(root,file),bytes:data.length,gzipBytes:gzipSync(data,{level:9}).length,extension});
}
const js=assets.filter(x=>x.extension==='.js');
const css=assets.filter(x=>x.extension==='.css');
const compressible=assets.filter(x=>COMPRESSIBLE_EXTENSIONS.has(x.extension));
const staticMedia=assets.filter(x=>STATIC_MEDIA_EXTENSIONS.has(x.extension));
const totals={
  assetCount:assets.length,
  totalBytes:assets.reduce((s,x)=>s+x.bytes,0),
  totalGzipBytes:assets.reduce((s,x)=>s+x.gzipBytes,0),
  compressibleGzipBytes:compressible.reduce((s,x)=>s+x.gzipBytes,0),
  staticMediaBytes:staticMedia.reduce((s,x)=>s+x.bytes,0),
  jsGzipBytes:js.reduce((s,x)=>s+x.gzipBytes,0),
  cssGzipBytes:css.reduce((s,x)=>s+x.gzipBytes,0),
  largestJsGzipBytes:Math.max(0,...js.map(x=>x.gzipBytes)),
};
const failures=[];
for(const [key,limit] of Object.entries(baseline.limits||{}))if(Number.isFinite(limit)&&totals[key]>limit)failures.push(`${key}: ${totals[key]} > ${limit}`);
await mkdir('artifacts',{recursive:true});
await writeFile('artifacts/build-budget.json',JSON.stringify({schema:2,ok:!failures.length,totals,definitions:baseline.metricDefinitions||{},failures},null,2)+'\n');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`Build-Budget bestanden: ${totals.assetCount} Dateien · Code/Text gzip ${totals.compressibleGzipBytes} B · statische Medien ${totals.staticMediaBytes} B.`);
