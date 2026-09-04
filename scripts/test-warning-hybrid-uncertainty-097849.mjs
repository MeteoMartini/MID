import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,weatherSource,styleSource,styles,baselineRaw,pkgRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
 read('src/styles-src/30-modern.css'),
 read('src/styles.css'),
 read('MID_BASELINE.json'),
 read('package.json')
]);

// Hybrid: amtlich zuerst, MID danach, gemeinsame Zustandszeile statt widersprüchlicher Doppelköpfe.
for(const token of [
 'function WarningCenter(',
 'WARNUNGEN & HINWEISE',
 'Amtliche Warnlage und MID-Ergänzungen',
 '<MemoOfficialWarnings alerts={alerts}',
 '<MemoHazards data={automatic}',
 'Amtliche Meldungen haben Vorrang.',
 'DWD · AMTLICH',
 'MID · ERGÄNZUNG',
 'MID · PROGNOSEHINWEIS'
])assert.ok(app.includes(token),`Hybrid-Warnvertrag fehlt: ${token}`);
assert.ok(app.indexOf('<MemoOfficialWarnings alerts={alerts}')<app.indexOf('<MemoHazards data={automatic}'),'Amtliche Warnungen müssen im Hybrid-Zentrum vor MID-Hinweisen stehen.');

// Gewählte Windeinheit wird auch für die kompakte amtliche Zusammenfassung genutzt; Originaltext bleibt unverändert.
for(const token of [
 'function officialAlertMetric(alert:OfficialAlert,unit:WindUnit)',
 'wind(kmh[0]/KMH_PER_KT,unit)',
 '<p>{a.description}</p>',
 'a.instruction&&<p className="instruction">'
])assert.ok(app.includes(token),`Einheiten-/Originaltextvertrag fehlt: ${token}`);

// Automatische Warnungen zeigen Bereiche/qualitative räumliche Unsicherheit statt punktgenauer Modellspitzen.
for(const token of [
 'displayMetric?:string',
 'displayText?:string',
 'scopeLabel?:string',
 'precisionLabel?:string',
 'hazardWindBand(',
 "conditional?'örtlich'",
 "precisionLabel=conditional?'Ortstreffer unsicher'",
 'In Schauernähe sind örtlich Böen im Bereich',
 'Gewitter sind kleinräumig und treffen nicht jeden Ort.',
 'Niederschlagskerne können kleinräumig deutlich abweichen',
 'Nebelgrenzen und Sichtweiten können sich auf kurzer Distanz stark unterscheiden',
 'Glätte beziehungsweise Glatteis kann punktuell auftreten',
 'Bodennahe Werte und geschützte Lagen können stärker abweichen'
])assert.ok(weatherSource.includes(token),`Unsicherheitsvertrag fehlt: ${token}`);

// Amtliche Warnstufenfarben sind reserviert; MID nutzt Parameterfarben.
for(const token of [
 '.official-alert.yellow{--official-level:#e0b92e',
 '.official-alert.orange{--official-level:#ef8d32',
 '.official-alert.red{--official-level:#e74a4a',
 '.official-alert.purple{--official-level:#a866df',
 'article[data-kind=wind]{--mid-hazard-color:var(--param-wind)}',
 'article[data-kind=heavyRain]',
 'article[data-kind=thunderstorm]{--mid-hazard-color:#8f6bc9',
 'background:var(--mid-hazard-color)'
]){
 assert.ok(styleSource.includes(token),`Modulare Hybrid-CSS-Regel fehlt: ${token}`);
 assert.ok(styles.includes(token),`Aggregierte Hybrid-CSS-Regel fehlt: ${token}`);
}

const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-warning-hybrid-uncertainty-097849.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: Hybrid-Warnzentrum, Einheitenvertrag und unsicherheitsbewusste automatische Warninhalte geprüft.`);
