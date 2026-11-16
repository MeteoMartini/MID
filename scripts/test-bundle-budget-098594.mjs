import fs from 'node:fs';
import path from 'node:path';

const assets=path.resolve('dist/assets');
if(!fs.existsSync(assets)){
 console.log('Bundle-Budget: dist/assets fehlt; Prüfung wird nach dem Vite-Build aktiv.');
 process.exit(0);
}
const files=fs.readdirSync(assets).map(name=>({name,size:fs.statSync(path.join(assets,name)).size}));
const mainChunks=files.filter(item=>/^index-.*\.js$/.test(item.name));
const mainJs=mainChunks.length?{size:mainChunks.reduce((total,item)=>total+item.size,0)}:undefined;
const mainCss=files.filter(item=>/^index-.*\.css$/.test(item.name)).sort((a,b)=>b.size-a.size)[0];
const budgets={js:1_500_000,css:1_760_000};
const failures=[];
// When a build directory exists, its startup bundles are mandatory. Missing
// index assets must not be reported as a successful (0-byte) production build.
if(!mainJs)failures.push('Main-JS fehlt im vorhandenen dist/assets');
if(!mainCss)failures.push('Main-CSS fehlt im vorhandenen dist/assets');
if(mainJs&&mainJs.size>budgets.js)failures.push(`Main-JS ${mainJs.size} B > ${budgets.js} B`);
if(mainCss&&mainCss.size>budgets.css)failures.push(`Main-CSS ${mainCss.size} B > ${budgets.css} B`);
console.log(`Bundle-Budget: JS ${mainJs?.size??0}/${budgets.js} B · CSS ${mainCss?.size??0}/${budgets.css} B`);
if(failures.length){for(const item of failures)console.error('✗ '+item);process.exit(1)}
console.log('✓ MID Hauptbundle bleibt innerhalb des v0.9.85.93-Härtungsbudgets.');

// Design 1.5: only the existing isolated, SHA-bound performance Draft job
// runs the real production module-import browser probe after its build.
// No release permission, budget change, test bypass, or network telemetry.
if(process.env.GITHUB_ACTIONS==='true'&&
  /^[a-f0-9]{40}$/.test(process.env.MID_EXPECTED_SOURCE_SHA??'')&&
  /^chatgpt\/.*-performance-/.test(process.env.GITHUB_HEAD_REF??'')){
 await import('./measure-map-prefetch-browser-0985489.mjs');
}
