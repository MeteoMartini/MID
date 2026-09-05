import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,app,labelSource,contract,baselineRaw,pkgRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/forecastDayLabel.ts'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-seven-day-condition-label-consistency-097845.mjs';
assert.ok(cockpit.includes("conditionText=cockpitDayConditionLabel(weather)"),'7d-Karten behalten den vollständigen Tagescharakter für Tooltip/Piktogrammkontext.');
assert.ok(cockpit.includes("regimeText=compactSevenDayConditionLabel(day,displayHours)"),'7d-Cockpit muss die kompakte sichtbare Einzeilenform verwenden.');
assert.ok(cockpit.includes("dayVisual=periodWeatherVisual(dayHours,true,weather.code,dayWeatherCharacterText(weather),{preferFallbackCode:true})"),'Das große Tagespiktogramm muss weiter denselben dayWeatherCharacter führen.');
assert.ok(cockpit.includes('>{regimeText}</span>'),'Die sichtbare 7d-Pille muss die kompakte Kurzform ausgeben.');
assert.ok(!cockpit.includes('>{conditionText}</span>'),'Der lange Tagesbeschreibungstext darf nicht mehr sichtbar in der 7d-Pille stehen.');
assert.ok(app.includes('<ForecastConditionPills label={compactSevenDayConditionLabel(d,allDayHoursForDate)}/>'),'Auch die klassische 7d-Ansicht muss dieselbe kompakte Kurzform verwenden.');
for(const label of ["'Sonnig'","'Regen'","'Schauer'","'Ruhig'","'Windig'","'Warm'"])assert.ok(labelSource.includes(label),`Kompakte 7d-Kategorie fehlt: ${label}`);
for(const token of ['Verbindliche Präzisierung v0.9.78.61 – kompakte 7-Tage-Kurzform','Sichtbare 7-Tage-Pille = kompakte Einzeilen-Kategorie','Der vollständige Tagescharakter bleibt im Tooltip'])assert.ok(contract.includes(token),`Piktogrammvertrag unvollständig: ${token}`);
assert.equal(pkg.scripts?.['test:seven-day-condition-label-consistency'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'7d-Beschreibungsregression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: 7d-Kacheln verwenden kompakte Einzeilen-Kategorien bei erhaltenem Tagescharakter/Piktogramm.`);
