import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initialCssAssetStats} from './lib/initialCssBudget.mjs';
const root=new URL('../',import.meta.url),read=file=>readFile(new URL(file,root),'utf8');
const checker=await read('scripts/check-build-budget.mjs');
const baseline=JSON.parse(await read('MID_PERFORMANCE_BASELINE.json'));
const html=await read('index.html');
assert.equal(baseline.schema,2);
for(const key of ['totalGzipBytes','compressibleGzipBytes','staticMediaBytes','jsGzipBytes','cssGzipBytes','largestJsGzipBytes'])assert.ok(Number.isFinite(baseline.limits?.[key]),`Budget fehlt: ${key}`);
assert.equal(baseline.limits.compressibleGzipBytes,5200000,'Das bisherige 5,2-MB-Code/Text-Sicherheitsnetz bleibt erhalten.');
assert.ok(checker.includes('COMPRESSIBLE_EXTENSIONS')&&checker.includes('STATIC_MEDIA_EXTENSIONS'));
assert.ok(checker.includes('compressibleGzipBytes')&&checker.includes('staticMediaBytes'));
assert.match(html,/id="mid-logo-preload" rel="preload" as="image" fetchpriority="high"/);
assert.ok(!html.includes('id="mid-logo-preload" rel="preload" href="./mid-logo-light-horizontal.png"'),'Der Boot-Preload darf nicht vor der Theme-Auflösung das Light-Logo anfordern.');
assert.ok(html.includes("document.getElementById('mid-logo-preload')?.setAttribute('href',logoPath)"),'Der synchron ermittelte Theme-Logo-Pfad muss den Preload setzen.');
const fixtureAssets=[
 {file:'assets/index-abc.css',extension:'.css',bytes:240,gzipBytes:100,brotliBytes:88},
 {file:'assets/lazy-def.css',extension:'.css',bytes:180,gzipBytes:75,brotliBytes:67}
];
const fixtureHtml='<link rel="preload" href="./assets/lazy-def.css"><link crossorigin href="./assets/index-abc.css?hash=1" rel="stylesheet"><link rel="modulepreload" href="./assets/lazy-def.css">';
const initial=initialCssAssetStats(fixtureHtml,fixtureAssets);
assert.deepEqual(initial.entries.map(item=>item.file),['assets/index-abc.css']);
assert.equal(initial.bytes,240);assert.equal(initial.gzipBytes,100);assert.equal(initial.brotliBytes,88);
assert.throws(()=>initialCssAssetStats('<link rel="stylesheet" href="./assets/absent.css">',fixtureAssets),/fehlt/);
assert.throws(()=>initialCssAssetStats('<link rel="modulepreload" href="./assets/index-abc.css">',fixtureAssets),/kein auswertbares/);
assert.throws(()=>initialCssAssetStats('<link rel="stylesheet" href="https://example.org/main.css">',fixtureAssets),/außerhalb/);
assert.ok(checker.includes('initialCssGzipBytes')&&checker.includes('initialCssBrotliBytes')&&checker.includes('initialCssAssets'));
console.log('Build-Budget trennt Code/Text von statischen Medien und misst das tatsächlich initial referenzierte CSS; Boot-Logo-Preload fordert nur die tatsächlich gewählte Theme-Variante an.');
