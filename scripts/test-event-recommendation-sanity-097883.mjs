import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript-strada');

const root=new URL('../',import.meta.url);
const [policySource,panelSource,engineSource,baseline,contract]=await Promise.all([
 readFile(new URL('src/eventRecommendationPolicy.ts',root),'utf8'),
 readFile(new URL('src/EventPlannerPanel.tsx',root),'utf8'),
 readFile(new URL('src/eventWeatherEngine.ts',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse),
 readFile(new URL('MID_EVENT_RECOMMENDATION_CONTRACT.md',root),'utf8')
]);
const js=ts.transpileModule(policySource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const policy=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
const summary=(overrides={})=>({hours:2,temperatureAvg:24,temperatureMin:24,temperatureMax:25,apparentAvg:24,precipitationProbabilityMax:35,precipitationProbabilityRelevant:35,precipitationProbabilitySource:'ensemble-members-dwd-event',precipitationTotal:0,sunshineDurationTotal:0,windMax:8,gustMax:14,uvMax:0,visibilityMin:10000,weatherCode:2,...overrides});

assert.equal(policy.buildEventOutfitHint(summary(),'outdoor','football'),'leichte, atmungsaktive Sportkleidung','Fußball bei 24 °C darf keine Übergangskleidung empfehlen.');
assert.equal(policy.buildEventOutfitHint(summary(),'outdoor','running'),'leichte, atmungsaktive Sportkleidung','Laufen bei 24 °C braucht eine belastungsangepasste Empfehlung.');
assert.equal(policy.buildEventOutfitHint(summary(),'outdoor','city'),'leichte Sommerkleidung','Alltags-/Stadtaktivität bei 24 °C soll leichte Sommerkleidung empfehlen.');
assert.match(policy.buildEventOutfitHint(summary({temperatureAvg:14,temperatureMin:12,temperatureMax:15,apparentAvg:13}),'outdoor','football'),/dünne Schicht für Pausen/,'Kühler Fußballtermin braucht Pausenschicht statt Alltags-Übergangskleidung.');
assert.match(policy.buildEventOutfitHint(summary(),'indoor','football'),/Sportkleidung für den Innenraum/,'Indoor-Fußball darf nicht aus Außentemperatur Alltagskleidung ableiten.');
assert.match(policy.buildEventOutfitHint(summary(),'outdoor','skiing'),/Ski-\/Winterbekleidung/,'Skifahren braucht sportartspezifische Bekleidung.');
assert.match(policy.buildEventOutfitHint(summary(),'outdoor','watersports'),/Wassertemperatur\/Neopren separat prüfen/,'Wassersport darf nicht nur nach Lufttemperatur beraten.');
assert.equal(policy.eventHeatGuidance(summary({temperatureAvg:27,temperatureMax:28,apparentAvg:27}),'outdoor','football')?.severityDelta,1,'Intensive Sportart muss Wärme früher berücksichtigen.');
assert.equal(policy.eventHeatGuidance(summary({temperatureAvg:28,temperatureMax:28,apparentAvg:28}),'outdoor','city'),null,'Passive Aktivität darf bei 28 °C nicht automatisch dieselbe Wärmestufe wie Fußball erhalten.');
assert.equal(policy.eventHeatGuidance(summary({temperatureAvg:32,temperatureMax:33,apparentAvg:32}),'indoor','gym'),null,'Außentemperatur darf Indoor-Gym nicht als thermisch kritisch klassifizieren.');
assert.equal(policy.eventPrecipitationProbability(summary({precipitationProbabilityRelevant:null,precipitationProbabilitySource:'unavailable'})),null,'Fehlende Event-Wahrscheinlichkeit muss fehlend bleiben.');
assert.match(panelSource,/function formatNumber\(value:number\|null\|undefined,digits=0\)\{if\(value==null\|\|!Number\.isFinite/,'Nullwerte werden im Event-UI noch als 0 formatiert.');
assert.match(panelSource,/buildEventOutfitHint\(summary,environment,activity\)/,'Event-Leitwetter nutzt die zentrale Empfehlungspolitik nicht.');
assert.match(panelSource,/coverageComplete===false\|\|eventPrecipProbability\(summary\)==null\)return'Datengrundlage unvollständig; vor dem Termin erneut aktualisieren'/,'Unvollständige Daten dürfen nicht gleichzeitig eine Entwarnung im Timing-Hinweis erzeugen.');
assert.match(engineSource,/eventHeatGuidance\(summary,environment,activity\)/,'EventAdvice nutzt die aktivitätsbezogene Wärmelogik nicht.');
assert.match(engineSource,/eventColdGuidance\(summary,environment,activity\)/,'EventAdvice nutzt die aktivitätsbezogene Kältelogik nicht.');
assert.match(contract,/Fehlende Werte bleiben fehlend/,'Datenwahrheitsvertrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-event-recommendation-sanity-097883.mjs'),'Neue Event-Empfehlungsregression ist nicht verpflichtend.');
assert.ok(baseline.requiredFiles?.includes('MID_EVENT_RECOMMENDATION_CONTRACT.md'),'Event-Empfehlungsvertrag ist nicht in der Baseline geschützt.');
console.log('MID v0.9.78.83: aktivitäts-, umgebungs- und datenbewusste Event-Empfehlungen geprüft.');
