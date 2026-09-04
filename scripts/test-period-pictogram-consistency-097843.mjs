import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [period,app,cockpit,ensemble,contract,baselineRaw,pkgRaw]=await Promise.all([
 read('src/periodWeatherVisual.ts'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/EnsemblePanel.tsx'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('MID_BASELINE.json'),read('package.json')
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-period-pictogram-consistency-097843.mjs';
assert.ok(period.includes("function displayCode(hour:Hour){return precipitationParts(hour).displayCode}"),'Periodenpiktogramme müssen die kanonische Niederschlagsphase nutzen.');
assert.ok(period.includes("const exact=hours.filter(hour=>hour.isDay===dayPeriod)"),'Tag- und Nachtstunden müssen für Periodenicons getrennt ausgewertet werden.');
assert.ok(period.includes('precipitationDominant=active.length>=Math.max(2,Math.ceil(pool.length*.25))||totalAmount>=.8||maxProbability>=70||thunder'),'Ein kurzes Einzelstundenereignis darf die gesamte Nacht-/Periode nicht ohne Relevanzschwelle dominieren.');
assert.ok(period.includes("if(Number(cloud)<=12)return 0")&&period.includes("if(Number(cloud)<=35)return 1")&&period.includes("if(Number(cloud)<=72)return 2"),'Trockene Perioden müssen über mittlere Bewölkung konsistent in Sky-Codes überführt werden.');
assert.ok(period.includes('options.preferFallbackCode?fallbackCode:dominantPeriodCode(pool)'),'Tagescharakter muss als autoritatives Aggregat für Tagespiktogramme verwendbar sein.');
assert.ok(period.includes('bestSampleScore'),'Phasenwahl innerhalb einer dominanten Wetterart muss den stärksten Einzelbeleg getrennt von der kumulierten Artbewertung halten.');
assert.ok(app.includes("import {periodWeatherVisual,type PeriodWeatherVisual} from './periodWeatherVisual'"),'Klassische 7d-/Detail-/Widgetdarstellung muss den zentralen Periodenaggregator nutzen.');
assert.ok(cockpit.includes("import {periodWeatherVisual} from './periodWeatherVisual'"),'Cockpit muss den zentralen Periodenaggregator nutzen.');
assert.ok(!app.includes('function periodWeatherVisual(')&&!cockpit.includes('function cockpitPeriodVisual('),'Lokale konkurrierende Perioden-Icon-Selektoren dürfen nicht wieder eingeführt werden.');
const dayLock=(source)=>source.includes('{preferFallbackCode:true}');
assert.ok(dayLock(app)&&dayLock(cockpit),'Tagespiktogramme müssen mit dayWeatherCharacter synchronisiert sein.');
assert.ok(app.includes('periodWeatherVisual(followingNightHours,false')&&app.includes('periodWeatherVisual(followingNightHoursForDate(selectedDay.date,hours),false'),'Klassische Tagesansichten müssen das kleine Piktogramm aus der tatsächlich folgenden Nacht ableiten.');
assert.ok(cockpit.includes('nightVisual=periodWeatherVisual(followingNightHoursForDate(day.date,hours),false'),'Cockpit-Tageskarten müssen das kleine Piktogramm aus der tatsächlich folgenden Nacht ableiten.');
assert.ok(ensemble.includes('character=dayWeatherCharacter(x,hours.filter(hour=>hour.time.startsWith(x.date)))'),'Ensemble-Fallback muss weiterhin den gemeinsamen Tagescharakter statt eines rohen Tagescodes verwenden.');
for(const token of ['Periodenkohärenz für Tag und Folgenacht','ein Renderer (`WeatherPictogram`), ein Periodenaggregator (`periodWeatherVisual`), ein Tagescharakter (`dayWeatherCharacter`)','Folgenacht-Piktogramm'])assert.ok(contract.includes(token),`Piktogrammvertrag unvollständig: ${token}`);
assert.equal(pkg.scripts?.['test:period-pictogram-consistency'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'Periodenpiktogramm-Regression fehlt in der Baseline.');
console.log(`MID v${pkg.version}: Tages- und Folgenacht-Piktogramme sind appweit an Tagescharakter bzw. tatsächliche Folgenacht gekoppelt.`);
