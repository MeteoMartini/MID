import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const versionAtLeast=(value,target)=>{const a=String(value).split('.').map(Number),b=String(target).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return(a[i]||0)>(b[i]||0)}return true};

const [pollen,css,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/PollenForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midPollen.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-pollen-compact-dwd-levels-0985129.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.85.129'),'Der v0.9.85.129-Pollenvertrag muss in späteren Wartungsständen fortgelten.');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),self+' fehlt in '+key);

for(const code of ["'0':'keine'","'0-1':'keine bis gering'","'1':'gering'","'1-2':'gering bis mittel'","'2':'mittel'","'2-3':'mittel bis hoch'","'3':'hoch'"])assert.ok(pollen.includes(code),'DWD-Zwischenstufe fehlt: '+code);
assert.ok(pollen.includes("raw==='0-1'||raw.includes('keine bis gering'))return.5"),'0–1 darf nicht als keine Belastung klassifiziert werden.');
assert.ok(pollen.includes("raw==='1-2'||raw.includes('gering bis mittel')"),'1–2-Zwischenstufe fehlt.');
assert.ok(pollen.includes("raw==='2-3'||raw.includes('mittel bis hoch')"),'2–3-Zwischenstufe fehlt.');
assert.ok(pollen.includes('severity:pollenSeverity(item.entry)')&&pollen.includes('.filter(item=>item.severity>0)'),'Heutige Relevanz muss die siebenstufige DWD-Auswertung verwenden.');
assert.ok(pollen.includes('relevantTypes=sortedTypes.filter')&&pollen.includes('maxTypeSeverity(type)>0'),'Der 3-Tage-Ausblick muss zunächst nur relevante Pollenarten zeigen.');
assert.ok(pollen.includes('primaryTypes=relevantTypes.slice(0,4)'),'Die erste Detailstufe darf höchstens vier relevante Pollenarten zeigen.');
assert.ok(pollen.includes("detailTypes=showAll?sortedTypes:primaryTypes")&&pollen.includes('Alle 8 Pollenarten anzeigen'),'Alle acht Pollenarten dürfen erst in der expliziten zweiten Detailstufe erscheinen.');
assert.ok(pollen.includes("'DWD · Produktstand':'DWD · Abruf'")&&pollen.includes('pollen-region'),'Region, Quelle und fachlicher Produkt-/Abrufstand müssen kompakt erhalten bleiben.');
assert.ok(!pollen.includes('forecast-entry-head-pollen'),'Der alte mehrspaltige Forecast-Kopf darf die Pollendarstellung nicht mehr aufbrechen.');
assert.ok(css.includes('grid-template-columns:minmax(0,1fr) auto auto'),'Der kompakte Kopf braucht eine kontrollierte Rasterhierarchie.');
assert.ok(css.includes('min-height:44px'),'Das Haupt-Disclosure muss mindestens 44 px hoch bleiben.');
assert.ok(css.includes('.pollen-all-toggle{justify-self:start;min-height:44px'),'Auch die zweite Detailstufe braucht ein 44-px-Touchziel.');
assert.ok(css.includes('grid-template-columns:minmax(76px,1.12fr) repeat(3,minmax(0,1fr))'),'Die 3-Tage-Tabelle muss ohne künstliche 420-px-Mindestbreite in mobile Karten passen.');
assert.ok(!css.includes('min-width:420px'),'Die mobile Pollenmatrix darf keine horizontale Mindestbreite erzwingen.');
assert.ok(css.includes('scroll-margin-bottom:calc(5.5rem + env(safe-area-inset-bottom))'),'Geöffnete Pollendetails brauchen Abstand zur festen Bottom-Bar.');
console.log(`MID v${pkg.version}: kompakte Pollenhierarchie und siebenstufige DWD-Zwischenwerte ab v0.9.85.129 geschützt.`);
