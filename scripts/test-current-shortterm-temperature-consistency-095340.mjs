import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire,stripTypeScriptTypes} from 'node:module';

const require=createRequire(import.meta.url);const ts=require('typescript-strada');const test='scripts/test-current-shortterm-temperature-consistency-095340.mjs';
const [presentation,app,shortTerm,cockpit,eventEngine,forecastContract,hyperlocalContract,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/forecastPresentation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../MID_FORECAST_CONSISTENCY_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../MID_HYPERLOCAL_ANALYSIS_CONTRACT.md',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const compiled=ts?ts.transpileModule(presentation,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,strict:true},reportDiagnostics:true,fileName:'forecastPresentation.ts'}):{outputText:stripTypeScriptTypes(presentation,{mode:'transform'}),diagnostics:[]};
assert.equal(compiled.diagnostics?.filter(item=>item.category===ts?.DiagnosticCategory?.Error).length??0,0,'forecastPresentation.ts muss transpilerbar bleiben.');
const module=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`);

// Screenshot-Regressionsfall: Current 21 °C um 09:37 darf in der unmittelbar folgenden
// 09:45-Kachel nicht allein durch eine zweite Stationskorrektur auf 20 °C fallen.
assert.equal(module.bridgeObservedTemperature(21,20,8,90),21,'Die erste Viertelstunde muss am aktuellen Messanker starten.');
const after23=module.bridgeObservedTemperature(21,20,23,90);
assert.ok(after23>20.85&&after23<21,'Nach der Haltephase muss der Übergang sanft beginnen.');
const after45=module.bridgeObservedTemperature(21,20,45,90);
assert.ok(after45>20&&after45<21,'Innerhalb der 90 Minuten muss ein echter Übergang statt Sprung entstehen.');
assert.equal(module.bridgeObservedTemperature(21,20,90,90),20,'Nach 90 Minuten darf die kanonische Forecast-Temperatur erreicht sein.');

const berlin='Europe/Berlin',now=Date.parse('2026-08-16T20:00:00Z'); // 22:00 MESZ
assert.equal(module.relativeForecastTimeLabel(Date.parse('2026-08-16T20:30:00Z'),berlin,now),'22:30');
assert.equal(module.relativeForecastTimeLabel(Date.parse('2026-08-17T06:00:00Z'),berlin,now),'morgen 08:00','Zeit am Folgetag braucht einen Tagesbezug.');
assert.equal(module.relativeForecastTimeLabel(Date.parse('2026-08-18T06:00:00Z'),berlin,now),'übermorgen 08:00');

for(const token of [
 'finalizationObservedTemperature=shortTermAnchor?.observed?.temperature?undefined:',
 'observedTemperature:finalizationObservedTemperature',
 'applyHyperlocalForecastHours(core.hours,shortTermAnchor',
 'anchor={shortTermAnchor}'
])assert.ok(app.includes(token),`App-weiter Current-/Forecast-Pfad fehlt: ${token}`);
assert.ok(!app.includes('observedTemperature:currentObservedTemperature'),'Eine Stationsbeobachtung darf nicht vor der Hyperlokalkorrektur ein zweites Mal in die Stunde geschrieben werden.');

for(const token of [
 'canonicalLocal=Number(base.localAdjustment)>0',
 'bridgeObservedTemperature(anchorTemperature,assimilatedTemperature',
 'canonicalLocal?base.temperature',
 'canonicalLocal?base.wind'
])assert.ok(shortTerm.includes(token),`Kurzfrist darf kanonisch lokalisierte Stunden nicht erneut assimilieren: ${token}`);

for(const token of [
 'relativeForecastTimePhrase(',
 'function shortTermProfileHourlyPoints(hours:Hour[],adjusted:ShortTermForecastPoint[],timezone:string,now=Date.now())',
 'const windowEnd=now+PROFILE_WINDOW_MS',
 'precipitationPresentationHours(hours).filter(hour=>hour.epoch<windowEnd&&hour.epoch+HOUR_MS>now)',
 'precipitationIntervalStartEpoch:start',
 'localAdjustment:Number(hour.localAdjustment)||0',
 'shortTermProfileHourlyPoints(hours,adjusted,timezone,profileNow)',
 '<span className="cockpit-tab-copy"><b>{horizonTitle(horizon)}</b><small>{summary}</small></span>'
])assert.ok(cockpit.includes(token),`Cockpit-Konsistenz-/Zeitkontext fehlt: ${token}`);
assert.ok(!cockpit.includes('const headerSummary='),'Redundante Cockpit-Kopfzusammenfassung darf nicht erneut aufgebaut werden.');
assert.ok(!cockpit.includes('<span>{headerSummary}</span>'),'Redundanter Cockpit-Untertitel unter dem Gesamttitel muss entfallen.');

for(const token of [
 'observedTemperature:localAnchor?.observed?.temperature?undefined:observedTemperature',
 'applyHyperlocalForecastHours(finalized.hours,localAnchor,now,referenceHours)'
])assert.ok(eventEngine.includes(token),`Events müssen denselben einmaligen Stationsanker verwenden: ${token}`);

assert.ok(forecastContract.includes('nur einmal zentral')&&forecastContract.includes('Stationsanker'),'Forecast-Vertrag muss die einmalige zentrale Stationsanker-Assimilation schützen.');
assert.ok(hyperlocalContract.includes('90 Minuten')&&hyperlocalContract.includes('Stationsanker'),'Hyperlokalvertrag muss den kanonischen Stationsanker bis in die 90-Minuten-/24-h-Kette schützen.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test));
console.log(`MID v${pkg.version}: Current-, 90-min-, 24-h- und Folgetag-Zeitkonsistenz geprüft.`);
