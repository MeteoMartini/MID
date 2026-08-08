import {readFile} from 'node:fs/promises';
const [pkgRaw,lockRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../package-lock.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),lock=JSON.parse(lockRaw),baseline=JSON.parse(baselineRaw),failures=[];
const nano=lock.packages?.['node_modules/nanoid'],post=lock.packages?.['node_modules/postcss'];
const parts=value=>String(value||'').split('.').map(Number);
const atLeast=(value,min)=>{const a=parts(value),b=parts(min);for(let i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return true};
if(!nano||!atLeast(nano.version,'3.3.17'))failures.push(`nanoid ist ${nano?.version||'nicht vorhanden'}; erforderlich ist >=3.3.17 im 3.x-Pfad.`);
if(!post||!atLeast(post.version,'8.5.23'))failures.push(`postcss ist ${post?.version||'nicht vorhanden'}; erforderlich ist >=8.5.23.`);
if(nano?.version?.startsWith('4.'))failures.push('nanoid 4.x ist für GHSA-2v37-7h3g-55p8 nicht zulässig.');
if(pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version||pkg.version!==baseline.releaseVersion)failures.push('Releaseversion ist zwischen package.json, Lockfile und Baseline nicht synchron.');
if(!baseline.regressionTests?.includes('scripts/test-nightly-audit-dependencies-09311.mjs'))failures.push('Security-Audit-Regression fehlt in MID_BASELINE.json.');
if(failures.length){console.error('Nächtliche Dependency-Audit-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`Nächtliche Audit-Abhängigkeiten geprüft: nanoid ${nano.version}, postcss ${post.version}.`);
