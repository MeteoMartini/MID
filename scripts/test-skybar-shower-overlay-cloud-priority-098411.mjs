import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,renderer,app,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
  read('src/detailSkyBar.ts'),
  read('src/SkyBarSegments.tsx'),
  read('src/App.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),
  read('package.json'),
  read('MID_BASELINE.json'),
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-shower-overlay-cloud-priority-098411.mjs';

// Cloud cover is the primary base-state signal. A high sunshine-duration aggregate
// must not turn 69 % total cloud into a maximum yellow band.
assert.ok(skybar.includes('if(cloudKnown){')&&skybar.indexOf('if(cloudKnown){')<skybar.indexOf('if(daylight&&sunshineDirect){'),'Gesamtbewölkung muss im Skybar-Grundband vor dem Sonnenschein-Fallback ausgewertet werden.');
assert.ok(skybar.includes('if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);'),'Direkte Sonnenscheindauer bleibt als eigenständiger WMO-Parameter erhalten.');
assert.ok(skybar.includes('if(daylight&&boundedCloud<50)')&&skybar.includes('const visualSunshine=clamp01(1-boundedCloud/100)'),'Gelbes Grundband muss bei bekannter Gesamtbewölkung aus dem komplementären Aufklarungsanteil entstehen.');
assert.ok(skybar.includes('const width=cloudBandWidth(boundedCloud);')&&skybar.includes("color:'#aeb3b9'"),'Ab 50 % Gesamtbewölkung muss das Grundband grau sein.');
assert.ok(app.includes('69 % Gesamtbewölkung nicht durch eine hohe Sonnenscheindauer als maximal sonnig'),'UI-Vertrag schützt den konkreten 69-%-Fehler nicht.');

// Shower situations: precipitation is a separate, later SVG layer on the same centre line.
// If its stroke is thinner, the yellow base remains visible around it; if equal/thicker,
// normal SVG paint order fully covers the base without colour mixing.
assert.ok(skybar.includes("layer:'base'")&&skybar.includes("layer:'precip'"),'Grund- und Niederschlagslage müssen getrennt bleiben.');
assert.ok(skybar.includes('return [...baseSegments,...precipSegments]'),'Niederschlag muss nach dem Grundband gezeichnet werden.');
assert.ok(skybar.includes('appendSegment(segmentsForLayer(visual.layer)')&&skybar.includes(',centerY,visual)'),'Grund- und Niederschlagslage müssen dieselbe Mittellinie verwenden.');
assert.ok(renderer.includes('segments.map((segment,index)=>')&&!renderer.includes('sort('),'Renderer darf die fachlich definierte Layer-Reihenfolge nicht umsortieren.');
assert.ok(app.includes('Bei Sonne bleibt ein breiteres gelbes Grundband seitlich sichtbar')&&app.includes('gleich dick oder dicker, verdeckt er das gelbe Band vollständig'),'UI-Hinweis muss die Schauer-Überlagerungslogik erklären.');
assert.ok(contract.includes('Niederschlag ist eine eigenständige Overlay-Lage und darf auch bei Sonne auftreten')&&contract.includes('ist der Niederschlagsstreifen gleich dick oder dicker, verdeckt er das gelbe Grundband vollständig'),'Vertrag muss sonnige Schauer und Dickenüberlagerung festschreiben.');

// DWD rain-intensity classes plus one explicit MID-only visual split for the fourth width.
for(const token of ['if(amount<0.05)return null;','if(amount<=0.5)return 0;','if(amount<=4)return 1;','if(amount<15)return 2;','return 3;'])assert.ok(skybar.includes(token),`Niederschlagsstufe fehlt: ${token}`);
assert.ok(skybar.includes("const precipIntensityLabel=(amount:number)=>amount<=0.5?'leicht':amount<=4?'mäßig':amount<15?'stark':'stark · hohe Intensität'"),'Intensitätslabel muss zu denselben Grenzen passen.');
assert.ok(contract.includes('keine zusätzliche DWD-Intensitätsklasse'),'MID-Stufe 4 muss ausdrücklich als Darstellungsunterteilung dokumentiert sein.');

// All current visible Skybars stay on the same central helper.
for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);

assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'Neue Schauer-/Cloud-Priority-Regression fehlt in requiredFiles.');
assert.equal(pkg.scripts?.['test:skybar-shower-overlay-cloud-priority'],`node ${test}`,'Package-Testeintrag fehlt.');

console.log(`MID v${pkg.version}: Skybar schützt Cloud-Priority, sonnige Schauer-Overlays, DWD-Intensitätsgrenzen und Dickenüberlagerung appweit.`);
