import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,styles,thunderstorm,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/styles.css'),
 read('src/thunderstorm.ts'),
 read('package.json'),
 read('MID_BASELINE.json')
]);

// Compact: Wetter, Radar und Quellen bilden eine Karte; die frühere Kopie im Ortskopf bleibt unsichtbar.
for(const token of [
 'function CurrentNowcards(',
 'className="hero current-compact"',
 'className="current-weather-overview"',
 'className="current-compact-source"',
 'nowcards={<CurrentNowcards',
 'Aktuelle Niederschlags- und Gefahrenlage',
 'Niederschlag jetzt',
 'radarCompactSource(radar,precipNow.source,timezone)',
 'current-metrics-toggle'
])assert.ok(app.includes(token),`Compact-Kopfvertrag fehlt: ${token}`);
for(const token of [
 'main>.place>.place-nowcards{display:none!important}',
 '.hero.current-compact{',
 '.current-weather-overview{',
 '.current-compact-source{',
 '.hero.current-compact .current-metrics-toggle{position:static'
])assert.ok(styles.includes(token),`Compact-CSS-Vertrag fehlt: ${token}`);

// Gewitter/Starker Schauer und Starkregen/Sturzflut bleiben mit allen Details erreichbar.
for(const token of [
 'local-now-disclosure thunder-now',
 'thunderInfo.sectionLabel',
 'ThunderPlaceList places={thunderInfo.places}',
 'thunderInfo.detailGroups',
 'thunderInfo.advisory',
 'local-now-disclosure heavy-rain-now',
 'Starkregen-/Sturzflutindikator',
 'heavyRainInfo.flashFloodPotential',
 'heavyRainInfo.details.map',
 'heavyRainInfo.source'
])assert.ok(app.includes(token),`Lokaler Gefahrenkartenvertrag fehlt: ${token}`);
assert.ok(thunderstorm.includes("sectionLabel:'Schauerinformation'|'Gewitterinformation'|'Konvektionsinformation'"),'Starker Schauer und Gewitter müssen fachlich getrennt bleiben.');

// Responsive Warnkarte: Tagesgruppen, eine Zeile pro Zeitfenster und Details direkt unter der Zeile.
for(const token of [
 'className="warnings-responsive-shell"',
 'hazards compact-list hazards-responsive-card hazards-current-',
 'className="hazard-day-grid"',
 'className="hazard-day-group"',
 'hazardDayHeading(item.validFrom,timezone)',
 'aria-expanded={expanded}',
 'expanded?<ChevronDown',
 ':<ChevronRight',
 'x.metric&&<em>{x.metric}</em>',
 'Automatisch aus Best Match abgeleitet.',
 'amtliche Meldungen siehe direkt anschließend'
])assert.ok(app.includes(token),`Responsive Warnkartenvertrag fehlt: ${token}`);
for(const token of [
 '.hazard-day-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))',
 '@media(orientation:portrait) and (max-width:760px)',
 '@media(orientation:landscape) and (max-height:600px)',
 '.hazard-day-grid{grid-template-columns:1fr}',
 '.warnings-responsive-shell>.official-warnings{'
])assert.ok(styles.includes(token),`Hoch-/Querformat-Warnlayout fehlt: ${token}`);

// Amtliche CAP-Texte und Handlungsanweisungen dürfen durch die visuelle Zusammenführung nicht verloren gehen.
for(const token of ['<p>{a.description}</p>','a.instruction&&<p className="instruction">','officialAlertValidity(a,timezone)','Originaltext: ${language}'])assert.ok(app.includes(token),`Amtlicher Warntextvertrag fehlt: ${token}`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-current-warning-compact-responsive-09654.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
assert.ok(baseline.requiredRegressionTests.includes(test),'Compact-/Warnkartenprüfung muss im Pflichtvertrag stehen.');
assert.ok(baseline.regressionTests.includes(test),'Compact-/Warnkartenprüfung muss im Release-Testlauf stehen.');
assert.ok(baseline.requiredFiles.includes(test),'Compact-/Warnkartenprüfung muss als Pflichtdatei geschützt sein.');
console.log(`MID v${pkg.version}: Compact-Kopf, lokale Gefahrenkarten und responsive Warnkarte geprüft.`);
