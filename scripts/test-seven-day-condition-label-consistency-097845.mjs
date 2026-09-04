import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,contract,baselineRaw,pkgRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-seven-day-condition-label-consistency-097845.mjs';
assert.ok(cockpit.includes("function cockpitDayConditionLabel(character:ReturnType<typeof dayWeatherCharacter>)"),'7d-Tageskarten brauchen einen eigenen, aus dayWeatherCharacter abgeleiteten sichtbaren Bedingungstext.');
assert.ok(cockpit.includes("conditionText=cockpitDayConditionLabel(weather)"),'7d-Karten müssen den sichtbaren Text aus demselben Tagescharakter wie das Piktogramm ableiten.');
assert.ok(cockpit.includes("dayVisual=periodWeatherVisual(dayHours,true,weather.code,dayWeatherCharacterText(weather),{preferFallbackCode:true})"),'Das große Tagespiktogramm muss weiter denselben dayWeatherCharacter führen.');
assert.ok(cockpit.includes('>{conditionText}</span>'),'Die sichtbare Beschreibung darf nicht mehr den groben regimeText ausgeben.');
assert.ok(cockpit.includes('<WeatherPictogram code={dayVisual.code} day size={14} compact title={conditionText}'),'Auch das kleine Piktogramm der Beschreibungspille muss denselben dayVisual-Code verwenden.');
assert.ok(cockpit.includes('Regime: ${regimeText}'),'Regime bleibt als sekundäre UI-Metadaten erhalten.');
for(const token of ['Text-/Piktogramm-Kohärenz in Tageskarten','Sichtbarer Tagesbeschreibungstext = `dayWeatherCharacter(...).label`','Regime ist nur Präsentationsmetadatum'])assert.ok(contract.includes(token),`Piktogrammvertrag unvollständig: ${token}`);
assert.equal(pkg.scripts?.['test:seven-day-condition-label-consistency'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'7d-Beschreibungsregression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: 7d-Beschreibung und Tagespiktogramm stammen aus demselben Tagescharakter.`);
