import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [regime,dayLabel,cockpit,app,ensembleCss,modernCss,contract,baselineRaw,pkgRaw]=await Promise.all([
 read('src/forecastRegime.ts'),read('src/forecastDayLabel.ts'),read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/styles-src/20-ensemble-composite.css'),read('src/styles-src/30-modern.css'),read('MID_WEATHER_REGIME_COLOR_CONTRACT.md'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-weather-regime-shared-contract-097911.mjs';
assert.ok(regime.includes("export type ForecastDayRegime='wet'|'showery'|'sunny'|'windy'|'warm'|'quiet';"),'Gemeinsamer Regimetyp fehlt.');
assert.ok(regime.includes('export function forecastDayRegime(day:Day,hours:Hour[]):ForecastDayRegime'),'Gemeinsame Regimeklassifikation fehlt.');
assert.ok(regime.includes('assessment.showery&&assessment.dominant')&&regime.includes("return'showery'"),'Schauer-Regime muss aus derselben Fachlogik entstehen.');
assert.ok(cockpit.includes("import {forecastDayRegime,forecastRegimeLabel,type ForecastDayRegime} from './forecastRegime';"),'ForecastCockpit nutzt den gemeinsamen Regimevertrag nicht.');
assert.ok(!cockpit.includes('function dayRegime(')&&!cockpit.includes('function regimeLabel('),'ForecastCockpit darf keine parallele Regimelogik mehr besitzen.');
assert.ok(dayLabel.includes("import {forecastDayRegime} from './forecastRegime';")&&dayLabel.includes('regime=forecastDayRegime(day,dayHours)'),'Kompakte 7d-Kurzform muss dieselbe Regimeklassifikation verwenden.');
assert.ok(app.includes("import {forecastDayRegime,type ForecastDayRegime} from './forecastRegime';"),'Klassische 7d-Ansicht ist nicht an den Regimevertrag angebunden.');
assert.ok(app.includes('regime=forecastDayRegime(d,allDayHoursForDate)')&&app.includes('<ForecastConditionPills label={compactSevenDayConditionLabel(d,allDayHoursForDate)} regime={regime}/>'),'Klassische 7d-Pille erhält keine Regimefarbe.');
for(const css of [ensembleCss,modernCss])assert.ok(css.includes('--mid-weather-regime-accent'),'CSS-Regimeableitung fehlt.');
assert.ok(ensembleCss.includes('.cockpit-phase-line .showery{background:color-mix(in srgb,var(--weather-regime-showery) 12%,var(--surface))}'),'Phase-Line behandelt Schauer nicht zentral.');
assert.ok(ensembleCss.includes('.forecast-condition-pill.primary.regime-showery{--mid-weather-regime-accent:var(--weather-regime-showery)}'),'Klassische 7d-Pille behandelt Schauer nicht mit derselben Palette.');
for(const legacy of ['.cockpit-phase-line .wet{background:color-mix(in srgb,#2697d8','.cockpit-phase-line .sunny,.cockpit-phase-line .warm{background:color-mix(in srgb,#f6ad16','.cockpit-phase-line .windy{background:color-mix(in srgb,#3abb78'])assert.ok(!ensembleCss.includes(legacy),`Legacy-Regimefarbe noch aktiv: ${legacy}`);
assert.ok(contract.includes('forecastDayRegime')&&contract.includes('klassische 7-Tage-Ansicht'),'Vertrag dokumentiert gemeinsame Fachlogik oder klassische 7d-Färbung nicht.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes('src/forecastRegime.ts')&&baseline.requiredFiles?.includes(test),'Shared-Regimevertrag fehlt in requiredFiles.');
console.log(`MID v${pkg.version}: sichtbare Wetterregime nutzen gemeinsame Fachlogik und zentrale Farben in 7d/14d sowie klassischer 7d-Ansicht.`);
