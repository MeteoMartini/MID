import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [worker,fusion,app,twin,diagnostics,eventEngine,pkgText,baselineText]=await Promise.all(['worker-src/00-core-observations.js','src/forecastFusion.ts','src/App.tsx','src/forecastVerification.ts','src/ForecastSourceDiagnostics.tsx','src/eventWeatherEngine.ts','package.json','MID_BASELINE.json'].map(read));
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-forecast-fusion-canonical-weighting-09610.mjs';
assert.equal(pkg.version,baseline.releaseVersion);assert.ok(baseline.requiredRegressionTests.includes(test)&&baseline.regressionTests.includes(test));

// Nutzervertrag: eine kanonische, nachvollziehbare Prognose statt widersprüchlicher Teilpfade.
for(const token of ['fusionWeatherRegime','fusionRegionalFactor','fusionRegimeFactor','fusionWeightFactors','horizonFactor','regionalFactor','regimeFactor','freshnessFactor'])assert.ok(worker.includes(token),`Fusionsfaktor fehlt: ${token}`);
assert.ok(worker.includes("version:9")&&worker.includes('weightingByDate'),'Worker muss die Gewichtung tageweise diagnostizieren.');
assert.ok(worker.includes("independenceBudget:'one-budget-per-independence-group'"),'Unabhängigkeitsbudget ist nicht explizit dokumentiert.');
assert.match(worker,/for\(const\[group,items\]of groups\).*groupBudget:budget.*weight:budget\*Math\.max/s,'Varianten derselben Familie müssen ein einziges Gruppenbudget teilen.');
for(const token of ["id:'icon_d2_ruc'","id:'icon_d2'","independenceGroup:'dwd-icon'"])assert.ok(worker.includes(token),`DWD-RUC-Familienvertrag fehlt: ${token}`);
for(const token of ["id:'knmi_harmonie_europe'","id:'knmi_harmonie'","id:'dmi_harmonie'"])assert.match(worker,new RegExp(`${token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[^\n]+independenceGroup:'uwc-west-harmonie'`),`UWC-West-HARMONIE muss ein gemeinsames Unabhängigkeitsbudget teilen: ${token}`);
assert.ok(worker.includes("localSkillStage:'weather-twin-on-device'"),'Lokale tatsächliche Prognosegüte muss als eigene nachgelagerte Stufe ausgewiesen sein.');
for(const token of ['regularizedWeights','modelPredictionIsLearnable','validation.days<6','applyLocalTwinHours'])assert.ok(twin.includes(token),`Gütegewichtung fehlt: ${token}`);
assert.ok(fusion.includes("const CACHE_PREFIX='mid:forecast-fusion:v9:'"),'Geänderte Fusionsdiagnose muss den alten Cache invalidieren.');

const order=['applyForecastFusionHours(','applyLocalTwinHours(','finalizeForecastHours(','applyHyperlocalForecastHours(','finalizeForecastMinute15(','reconcileForecastDaysWithHours('].map(token=>app.indexOf(token));
assert.ok(order.every(index=>index>=0)&&order.every((index,i)=>i===0||index>order[i-1]),'Kanonische Fusions-/Nowcast-Reihenfolge wurde verändert.');
for(const token of ['displayHours=finalizedHours.hours','displayMinutes15=useMemo(()=>finalizeForecastMinute15','canonicalHours={displayHours}','hours={displayHours}','minutes15={displayMinutes15}'])assert.ok(app.includes(token),`App-weiter Displayvertrag fehlt: ${token}`);
assert.ok(eventEngine.includes('finalizeForecastHours')&&eventEngine.includes('applyHyperlocalForecastHours'),'Event-Prognosen müssen denselben Finalisierungspfad nutzen.');
for(const token of ['Quellen &amp; Gewichtung','Kanonischer Ablauf','Varianten einer Familie teilen genau ein Budget','Lokale tatsächliche Prognosegüte'])assert.ok(diagnostics.includes(token),`Nutzerdiagnose fehlt: ${token}`);
console.log(`MID v${pkg.version}: kanonische P0/P1-Fusion mit Lage-, Horizont-, Regional-, Frische-, Unabhängigkeits- und lokaler Gütestufe geprüft.`);
