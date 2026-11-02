import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readPresentationEntrySources} from './lib/presentationEntrySources.mjs';

const [cockpit,styles,entry,baselineText]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midDesignWeToday.css',import.meta.url),'utf8'),
 readPresentationEntrySources(),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const baseline=JSON.parse(baselineText);
const name='scripts/test-design-we-today-compact-0985412.mjs';
for(const list of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[list].includes(name),name+' fehlt in '+list);
assert.ok(baseline.requiredFiles.includes(name),'WE-Test muss als Pflichtdatei geführt sein');
assert.ok(entry.includes("import './midC27CompactProfile.css';")&&!entry.includes("import './midDesignWeToday.css';"),'Die geschützte Eager-CSS-Kaskade darf nicht erweitert werden.');
assert.ok(cockpit.includes("import('./midDesignWeToday.css')"),'Design-WE muss als separater dynamischer CSS-Chunk am Heute-Renderer hängen.');

for(const token of [
 'data-mid-we-today="true"',
 'className="mid-we-parameter-controls"',
 'data-mid-chart-focus={profileFocus}',
 'aria-pressed={profileFocus===option.key}',
 'className="mid-we-selected-focus"',
 'className="mid-we-selected-metrics"',
 'className="mid-we-detail-toggle"',
 'aria-expanded={profileFullDetails}',
 'className="cockpit-meteogram-pro__tooltip-content" hidden={!profileFullDetails}',
 'setProfileFullDetails(value=>!value)',
 'useDisplayPreference(\'ForecastCockpit.profileFullDetails\'',
 'shortTermKnownPrecipitationLabel(selectedPoint)',
 'shortTermKnownProbabilityLabel(selectedPoint.probability)',
 'Number.isFinite(selectedPoint.pressure)',
 'shortTermCloudLayerTriplet(selectedPoint)',
 'profileXForEpoch(point.epoch)',
 'data-mid-skybar="profile"',
 'className={\`cloud-opacity-band ${row.className}\`}',
 'x1={selectedVisualPoint.x} x2={selectedVisualPoint.x} y1={skyBandTop}',
 '<DwdPrecipitationTypeDisclosure location={location} enabled={showDwdPrecipitationTypeRadar}/>'
])assert.ok(cockpit.includes(token),'WE Heute Vertragsbestandteil fehlt: '+token);

for(const token of [
 'const selectedNow90Point=now90.find(point=>point.id===selectedPoint.id)??null',
 'aria-label="Details zum ausgewählten Viertelstundenpunkt"',
 'shortTermKnownPrecipitationLabel(selectedNow90Point)',
 'shortTermKnownProbabilityLabel(selectedNow90Point.probability)',
 "Number.isFinite(selectedNow90Point.wind)?wind(selectedNow90Point.wind,unit):'n. v.'",
 "Number.isFinite(selectedNow90Point.gust)?wind(selectedNow90Point.gust,unit):'n. v.'"
])assert.ok(cockpit.includes(token),'90min-Detail/NoData-Vertrag fehlt: '+token);
assert.ok(styles.includes('.mid-we-now90-selected'),'Die auswählbaren 90min-Einzeldaten müssen mobil sichtbar sein.');
assert.ok(styles.includes("html[data-mid-design='next']:root .forecast-cockpit .cockpit-weather-profile[data-mid-we-today='true']>.cockpit-meteogram-pro__head>.cockpit-weather-profile__toolbar"),'C27-Max-Content-Toolbar muss auf Mobilgeräten korrekt übersteuert werden.');
const idx=(token)=>cockpit.indexOf(token);
assert.ok(idx('skyBandTop=profileY(50)')<idx('cloudTop=profileY(101)')&&
 idx('cloudTop=profileY(101)')<idx('tempTop=profileY(150)')&&
 idx('tempTop=profileY(150)')<idx('precipTop=profileY(321)')&&
 idx('precipTop=profileY(321)')<idx('windTop=profileY(406)')&&
 idx('windTop=profileY(406)')<idx('pressureTop=profileY(498)'),
 'Reihenfolge Himmel/Wolken → Thermik → Niederschlag → Wind → Druck darf nicht kippen');

for(const token of [
 '[data-mid-we-today=\'true\']',
 '.mid-we-parameter-controls',
 '.mid-we-selected-focus',
 '.mid-we-selected-metrics',
 '.mid-we-detail-toggle',
 "data-mid-chart-focus='temperature'",
 "data-mid-chart-focus='precipitation'",
 "data-mid-chart-focus='wind'",
 '@media(max-width:959px)',
 '@media(max-width:620px)',
 '@media(max-width:350px)',
 '@media(prefers-reduced-motion:reduce)',
 'min-height:44px',
 'overflow-x:auto',
 'var(--text)'
])assert.ok(styles.includes(token),'WE CSS Vertragsbestandteil fehlt: '+token);
assert.ok(!styles.includes('display:none!important;}\nhtml[data-mid-design=\'next\'] .forecast-cockpit [data-mid-we-today=\'true\'] .profile-sky-strip'),'Skybar darf nicht versteckt werden');
console.log('MID Design-WE Heute: 24h-Story-Achse, Skybar/Wolken oben, Fokus, UTCI, NoData, alle Einzeldaten und responsive Bedienung als Source-Vertrag geprüft.');
