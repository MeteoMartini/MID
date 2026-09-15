import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [modern,aggregate,app,pkgRaw,baselineRaw]=await Promise.all([
 read('src/styles-src/30-modern.css'),read('src/styles.css'),read('src/App.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const marker='/* MID v0.9.84.81 · iPhone-Header/Bottom-Navigation: Screenshot-Audit 17.7.24.';
assert.ok(modern.includes(marker),'v0.9.84.81 Screenshot-Audit fehlt im modernen CSS.');
const markerIndex=modern.indexOf(marker);
assert.ok(markerIndex>modern.indexOf('MID v0.9.84.80'),'v0.9.84.81 muss die vorherigen Layoutregeln in der Kaskade übersteuern.');
const patch=modern.slice(markerIndex);
for(const token of [
 ".navigation-bottom-tabs .dashboard-bottom-tabs button span{",
 'white-space:nowrap!important;',
 'overflow-wrap:normal!important;',
 'word-break:keep-all!important;',
 'hyphens:none!important;',
 "grid-template-areas:'brand actions' 'search search'!important;",
 '.settings-header .search-stack>.search,',
 'grid-template-columns:minmax(0,1fr) 46px!important;',
 '.header-favorites .favorite-bubbles>button>b::after{',
 "content:'Std.';",
 "grid-template-areas:'brand' 'actions' 'search'!important;"
])assert.ok(patch.includes(token),`Screenshot-Audit-Vertrag fehlt: ${token}`);

for(const token of ['<span>Kurzfrist</span>','<span>7 Tage</span>','<span>14 Tage</span>','className="search-input-shell"','className="secondary locate"','<FavoriteQuickStrip'])
 assert.ok(app.includes(token),`Header-/Navigationsfunktion fehlt: ${token}`);

const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(aggregate,modules.join(''),'src/styles.css ist nicht aus den kanonischen Style-Modulen synchronisiert.');
const parts=String(pkg.version).split('.').map(Number),minimumVersion=[0,9,84,81];assert.ok(parts.length===4&&parts.every(Number.isFinite)&&parts.reduce((comparison,part,index)=>comparison!==0?comparison:part-minimumVersion[index],0)>=0,'Release muss den Screenshot-Fix v0.9.84.81 oder neuer enthalten.');
const test='scripts/test-mobile-header-bottom-nav-098481.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes(test),`${test} fehlt in ${key}.`);
console.log('OK mobile header + bottom navigation 098481');
