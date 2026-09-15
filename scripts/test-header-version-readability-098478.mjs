import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const modern=await read('src/styles-src/30-modern.css');
const aggregate=await read('src/styles.css');
const app=await read('src/App.tsx');
const pkg=JSON.parse(await read('package.json'));
const baseline=JSON.parse(await read('MID_BASELINE.json'));

assert.match(app,/className="brand-version">v\{VERSION\}<\/small>/,'Header verwendet nicht die kanonische vollständige MID-Version.');
assert.match(modern,/MID v0\.9\.84\.78 · Header-Audit/,'v0.9.84.78 Header-Audit-Marker fehlt.');
assert.match(modern,/\.settings-header \.brand-version\{[\s\S]*?white-space:nowrap!important;[\s\S]*?overflow:visible!important;[\s\S]*?text-overflow:clip!important;[\s\S]*?max-width:none!important;/,'Versionslabel ist nicht app-weit gegen Abschneiden geschützt.');
assert.match(modern,/@media\(max-width:430px\)\{[\s\S]*?\.top\.settings-header,[\s\S]*?\.navigation-bottom-tabs>\.top\.settings-header\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important;[\s\S]*?grid-template-areas:'brand' 'actions' 'search'!important;/,'iPhone-Header trennt Marke, Aktionen und Suche nicht in eigene Zeilen.');
assert.match(modern,/\.settings-header \.brand-version,[\s\S]*?\.navigation-bottom-tabs \.settings-header \.brand-version\{[\s\S]*?font-size:clamp\(13px,4vw,15px\)!important;/,'Mobile Versionsanzeige bleibt zu klein oder ungeschützt.');
assert.match(modern,/\.settings-header \.compact-actions,[\s\S]*?grid-area:actions;[\s\S]*?justify-self:end!important;/,'Aktionsleiste besitzt im schmalen Header keinen eigenen Layoutbereich.');
assert.match(modern,/\.settings-header \.search-stack,[\s\S]*?grid-area:search;[\s\S]*?width:100%/,'Suche erhält im schmalen Header keine volle eigene Zeile.');

const modules=await Promise.all(['00-foundation.css','10-features.css','20-ensemble-composite.css','25-extreme-outlook.css','30-modern.css'].map(name=>read(`src/styles-src/${name}`)));
assert.equal(aggregate,modules.join(''),'styles.css ist nicht mit den kanonischen CSS-Modulen synchron.');
const parts=String(pkg.version).split('.').map(Number);
const minimumVersion=[0,9,84,78];
assert.ok(parts.length===4&&parts.every(Number.isFinite)&&parts.reduce((comparison,part,index)=>comparison!==0?comparison:part-minimumVersion[index],0)>=0,`Release liegt vor v0.9.84.78: ${pkg.version}`);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok((baseline[key]||[]).includes('scripts/test-header-version-readability-098478.mjs'),`${key} enthält den Header-Pflichtvertrag nicht.`);
console.log('OK header version readability 098478');
