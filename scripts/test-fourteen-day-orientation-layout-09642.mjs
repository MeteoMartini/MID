import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [cockpit,sourceStyles,builtStyles,pkgText,baselineText,implementation]=await Promise.all([
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/styles-src/30-modern.css',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('MID_IMPLEMENTATION_0.9.64.2.md',root),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-fourteen-day-orientation-layout-09642.mjs';

for(const token of [
 "data-cockpit-horizontal-scroll=\"false\"",
 "className={`cockpit-fourteen-card regime-${item.regime}",
 'data-regime={item.regimeText}',
 'regimeText=regimeLabel(regime,precipitationForm?.label)',
 'className={`cockpit-fourteen-regime ${item.regime}`}',
 '<small>{modelCount}/{reference} M</small>',
 'className="cockpit-fourteen-row temperature"',
 'className="cockpit-fourteen-row precipitation"',
 'className="cockpit-fourteen-row wind"',
 '{cardinal(item.direction)} {wind(item.bestWind,unit)} · {compactGustLabel(item.bestGust,unit)}',
 'Alle Tageswerte vollständig in der Übersicht'
])assert.ok(cockpit.includes(token),`14-Tage-Datenintegration unvollständig: ${token}`);

const marker='/* MID v0.9.64.2 · 14-Tage-Cockpit ohne horizontales Scrollen: 14 Zeilen hochkant, 7 × 2 quer. */';
for(const [name,styles] of [['Quell-CSS',sourceStyles],['Aggregat-CSS',builtStyles]]){
 const section=styles.slice(styles.lastIndexOf(marker));
 assert.ok(section.startsWith(marker),`${name}: v0.9.64.2-Layoutvertrag fehlt oder wird überschrieben.`);
 const portraitStart=section.indexOf('@media (orientation:portrait) and (max-width:900px)');
 const landscapeStart=section.indexOf('@media (orientation:landscape) and (max-width:1024px)');
 assert.ok(portraitStart>=0&&landscapeStart>portraitStart,`${name}: Hoch-/Tablet-Querformatblöcke fehlen.`);
 assert.ok(section.includes('.cockpit-fourteen-grid{grid-template-columns:repeat(14,minmax(190px,1fr))}'),`${name}: lesbare Desktop-Mindestbreite der 14-Tage-Karten fehlt.`);
 assert.ok(section.includes('@media (orientation:landscape) and (min-width:1025px)'),`${name}: Desktop-Lesbarkeitsvertrag oberhalb der Tabletbreite fehlt.`);
 assert.ok(section.includes('grid-template-areas:"heading consistency" "regime regime" "temps temps"'),`${name}: Desktop-Kopf trennt Wetterlage, Regime und Temperatur nicht kollisionsfrei.`);
 const portrait=section.slice(portraitStart,landscapeStart),landscape=section.slice(landscapeStart);
 for(const token of [
  'grid-template-columns:minmax(0,1fr)!important',
  'grid-template-areas:"header header header" "temperature precipitation wind"',
  '.cockpit-fourteen-day{min-width:0;overflow:visible!important}',
  '.cockpit-fourteen-day>.cockpit-focus-card.fourteen{display:none}',
  'grid-template-areas:"label value" "label detail"',
  'white-space:normal!important'
 ])assert.ok(portrait.includes(token),`${name}: vollständige Hochformat-Zeilen fehlen: ${token}`);
 for(const token of [
  'grid-template-columns:repeat(7,minmax(0,1fr))!important',
  'grid-auto-rows:1fr',
  'grid-template-areas:"header" "temperature" "precipitation" "wind"',
  '.cockpit-fourteen-day>.cockpit-focus-card.fourteen{display:none}',
  'overflow:visible!important',
  'white-space:normal!important'
 ])assert.ok(landscape.includes(token),`${name}: vollständiges 7×2-Querformat fehlt: ${token}`);
 for(const token of ['regime-wet','regime-showery','regime-sunny','regime-windy','regime-warm','regime-quiet'])assert.ok(section.includes(token),`${name}: farbige 14-Tage-Klassifikation fehlt: ${token}`);
 assert.ok(!section.includes('text-overflow:ellipsis'),`${name}: 14-Tage-Werte dürfen nicht mit Ellipsis abgeschnitten werden.`);
 assert.ok(!section.includes('overflow-x:auto'),`${name}: 14-Tage-Layout darf keinen horizontalen Scrollcontainer erneut einführen.`);
}

assert.ok(pkg.version.localeCompare('0.9.64.2',undefined,{numeric:true,sensitivity:'base'})>=0,'Responsive 14-Tage-Darstellung benötigt mindestens Wartungsrelease v0.9.64.2.');
assert.equal(pkg.scripts?.['test:fourteen-day-orientation-layout'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion sind nicht synchron.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Verbindliche Baseline-Regression fehlt.');
assert.ok(baseline.regressionTests?.includes(test),'Regressionskatalog enthält den neuen Vertrag nicht.');
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.64.2.md'),'Implementierungsvertrag ist nicht als Pflichtdatei geschützt.');
for(const token of ['14 Zeilen','7 × 2','ohne horizontales Scrollen','Heiß','Ruhig','Modellzahl','Worker'])assert.ok(implementation.includes(token),`Implementierungsnotiz unvollständig: ${token}`);

console.log(`${pkg.version}: 14 vollständige Hochformat-Zeilen, 7×2-Tablet-Querformat und lesbare Desktopkarten geschützt.`);
