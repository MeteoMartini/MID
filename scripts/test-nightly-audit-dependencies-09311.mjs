import {readFile} from 'node:fs/promises';
const [pkgRaw,lockRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../package-lock.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),lock=JSON.parse(lockRaw),baseline=JSON.parse(baselineRaw),failures=[];
const nano=lock.packages?.['node_modules/nanoid'],proto=lock.packages?.['node_modules/protocol-buffers-schema'],post=lock.packages?.['node_modules/postcss'],browserslist=lock.packages?.['node_modules/browserslist'];
const parts=value=>String(value||'').split('.').map(Number);
const atLeast=(value,min)=>{const a=parts(value),b=parts(min);for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return true};
if(!nano||!atLeast(nano.version,'3.3.18'))failures.push(`nanoid ist ${nano?.version||'nicht vorhanden'}; erforderlich ist >=3.3.18 im 3.x-Pfad.`);
if(!proto||!atLeast(proto.version,'3.6.1'))failures.push(`protocol-buffers-schema ist ${proto?.version||'nicht vorhanden'}; erforderlich ist >=3.6.1.`);
if(!post||!atLeast(post.version,'8.5.23'))failures.push(`postcss ist ${post?.version||'nicht vorhanden'}; erforderlich ist >=8.5.23.`);
if(!browserslist||!atLeast(browserslist.version,'4.28.7'))failures.push(`browserslist ist ${browserslist?.version||'nicht vorhanden'}; erforderlich ist >=4.28.7 wegen GHSA-73wf-gq98-2v4g/GHSA-c83g-rgw3-j3cx.`);
if(nano&&!nano.version.startsWith('3.'))failures.push(`nanoid ${nano.version} liegt außerhalb des kompatiblen 3.x-Pfads.`);
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version||pkg.version!==baseline.releaseVersion)failures.push('Releaseversion ist zwischen package.json, Lockfile und Baseline nicht synchron.');
if(!baseline.regressionTests?.includes('scripts/test-nightly-audit-dependencies-09311.mjs'))failures.push('Security-Audit-Regression fehlt in MID_BASELINE.json.');
if(!baseline.requiredRegressionTests?.includes('scripts/test-nightly-audit-dependencies-09311.mjs'))failures.push('Security-Audit-Regression ist nicht als Pflichtregression geschützt.');
if(failures.length){console.error('Nächtliche Dependency-Audit-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Nächtliche Audit-Abhängigkeiten geprüft: nanoid ${nano.version}, protocol-buffers-schema ${proto.version}, postcss ${post.version}, browserslist ${browserslist.version}.`);
