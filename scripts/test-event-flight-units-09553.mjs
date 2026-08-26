import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [panel,aviation,worker,baselineText,pkgText]=await Promise.all(['src/EventPlannerPanel.tsx','src/eventAviation.ts','worker/metar-proxy.js','MID_BASELINE.json','package.json'].map(path=>readFile(new URL(path,root),'utf8')));
for(const token of [
  "function aviationVisibility(value:number|null|undefined)",
  "if(n<1000)return`${Math.max(50,Math.round(n/50)*50)} m`",
  "return'≥ 10 km'",
  "function aviationCeiling(value:number|null|undefined)",
  "`${Math.round(n/100)*100} ft AGL`",
  "function flightHazardDetail(",
  "wind(gust,unit)",
  "Sicht / Wolkenuntergrenze",
  "Wolkenuntergrenze {aviationCeiling(plan.summary.flightHazards?.ceilingMinFt)}"
])assert.ok(panel.includes(token),`Flug-Event-Einheitenvertrag fehlt im Panel: ${token}`);
for(const token of [
  "visibilityMinM?:number|null",
  "gustMaxKt?:number|null",
  "unit?:'kt'|'m'|'ft'",
  "detail:aviationVisibility(visibilityMin)",
  "ft AGL",
  "resolvedCeilingMinFt=ceilingMinFt",
  "resolvedVisibilityMinM=visibilityMin",
  "resolvedGustMaxKt=gustMax",
  "ceilingMinFt:resolvedCeilingMinFt,visibilityMinM:resolvedVisibilityMinM,gustMaxKt:resolvedGustMaxKt"
])assert.ok(aviation.includes(token),`Flug-Hazard-Rohwertvertrag fehlt: ${token}`);
for(const token of [
  'function aviationVisibilityMetersText(value)',
  'visibility*1609.344',
  "unit:'m'",
  "unit:'kt'",
  "unit:'ft'",
  'Wolkenuntergrenze ${Math.round(ceiling/100)*100} ft'
])assert.ok(worker.includes(token),`Amtlicher Flugwetter-Einheitenvertrag fehlt im Worker: ${token}`);
assert.ok(!worker.includes('`Sicht ${visibility.toFixed(visibility<1?1:0)} SM`'),'Amtliche Event-Sicht darf nicht mehr in SM dargestellt werden.');
const baseline=JSON.parse(baselineText),pkg=JSON.parse(pkgText);
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-event-flight-units-09553.mjs'));
assert.ok(baseline.regressionTests.includes('scripts/test-event-flight-units-09553.mjs'));
assert.equal(pkg.scripts['test:event-flight-units'],'node scripts/test-event-flight-units-09553.mjs');
console.log('Flug-Events geprüft: Wind folgt der gewählten Einheit, Sicht nutzt m/km, Wolkenuntergrenze ft AGL und entfernte METAR/TAF-Rohwerte überschreiben keine lokalen Eckwerte.');
