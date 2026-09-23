import fs from 'node:fs';
import path from 'node:path';

const assets=path.resolve('dist/assets');
if(!fs.existsSync(assets)){
 console.log('Bundle-Budget: dist/assets fehlt; Prüfung wird nach dem Vite-Build aktiv.');
 process.exit(0);
}
const files=fs.readdirSync(assets).map(name=>({name,size:fs.statSync(path.join(assets,name)).size}));
const mainJs=files.filter(item=>/^index-.*\.js$/.test(item.name)).sort((a,b)=>b.size-a.size)[0];
const mainCss=files.filter(item=>/^index-.*\.css$/.test(item.name)).sort((a,b)=>b.size-a.size)[0];
const budgets={js:1_500_000,css:1_760_000};
const failures=[];
if(mainJs&&mainJs.size>budgets.js)failures.push(`Main-JS ${mainJs.size} B > ${budgets.js} B`);
if(mainCss&&mainCss.size>budgets.css)failures.push(`Main-CSS ${mainCss.size} B > ${budgets.css} B`);
console.log(`Bundle-Budget: JS ${mainJs?.size??0}/${budgets.js} B · CSS ${mainCss?.size??0}/${budgets.css} B`);
if(failures.length){for(const item of failures)console.error('✗ '+item);process.exit(1)}
console.log('✓ MID Hauptbundle bleibt innerhalb des v0.9.85.93-Härtungsbudgets.');
