import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [modelSource,weatherSource,weatherAggregate,app,confidence,pkgRaw,baselineRaw]=await Promise.all([
 read('src/weather-src/00-types-models-search.tsfrag'),
 read('src/weather-src/30-ensemble-climate-hazards.tsfrag'),
 read('src/weather.ts'),
 read('src/App.tsx'),
 read('src/ensembleAssessment.ts'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-ensemble-fast-availability-097836.mjs';

assert.ok(modelSource.includes('signal?:AbortSignal,concurrency=2)')&&modelSource.includes('Math.max(1,Math.round(concurrency))'),'Ensemble-Loader muss für den Bootstrap explizit auf einen parallelen Abruf begrenzbar sein.');
assert.ok(weatherAggregate.includes('signal?:AbortSignal,concurrency=2)')&&weatherAggregate.includes('Math.max(1,Math.round(concurrency))'),'Generiertes Weather-Aggregat muss die Bootstrap-Parallelitätsgrenze enthalten.');
for(const source of [weatherSource,weatherAggregate]){
 assert.ok(source.includes('minimumIndependentGroups?:number;minimumWeightedSamples?:number')&&source.includes('groupsUsed.size<minimumIndependentGroups'),'Aggregation muss für den sichtbar gekennzeichneten Bootstrap genau eine echte Ensemblefamilie zulassen können, ohne den finalen Mehrmodellvertrag aufzuweichen.');
 assert.ok(source.includes('loadEnsembleUnits(selected,1,async definition=>')&&source.includes("'temperature_2m,temperature_2m_spread,precipitation,precipitation_spread','foreground'),definition),signal,1"),'Mean/Spread-Schnellstart muss genau einen Modellabruf gleichzeitig starten.');
 assert.ok(source.includes('aggregateMembers(results,[],{minimumIndependentGroups:1,minimumWeightedSamples:5})'),'Bootstrap muss einen echten Einzelmodell-Ensemblelauf vorläufig sichtbar machen können.');
 const fast=source.slice(source.indexOf('async function fastEnsembleBootstrap('),source.indexOf('\nasync function meanFallback('));
 assert.ok(fast.indexOf('meanEnsembleBootstrap(')>=0&&fast.indexOf('memberEnsembleBootstrap(')>fast.indexOf('meanEnsembleBootstrap('),'Schnellstart muss Mean/Spread priorisieren und Mitgliederdaten nur als nachgeordneten Fallback anfragen.');
 assert.ok(!fast.includes('Promise.any('),'Initialer iOS-Ensemblepfad darf Mean/Spread und große Mitgliederdaten nicht mehr parallel gegeneinander starten.');
 const ensemblesStart=source.slice(source.indexOf('export async function ensembles('),source.indexOf('\nconst CLIMATE_CACHE_PREFIX='));
 assert.ok(ensemblesStart.includes("if(priority==='foreground')")&&ensemblesStart.includes('Ensemble-Schnellstart konnte aktuell weder einen Mean/Spread-Lauf noch einen vollständigen Mitgliedslauf laden.')&&ensemblesStart.indexOf('throw new Error(\'Ensemble-Schnellstart')<ensemblesStart.indexOf('const selected=selectedFullEnsembleModels'),'Ein fehlgeschlagener Erststart muss sichtbar abbrechen statt unmittelbar den großen Acht-Modell-Fan-out auf dem iPhone zu starten.');
}

assert.ok(app.includes('keepLoadingUntilRefresh=false')&&app.includes('if(value.bootstrap)keepLoadingUntilRefresh=true')&&app.includes('if(value.bootstrap)scheduleRetry(2_000)')&&app.includes('setEnsLoading(keepLoadingUntilRefresh)'),'Nach einem vorläufigen Schnellstart muss die Oberfläche sichtbar signalisieren, dass die vollständige Modellfusion weiter nachgeladen wird.');
assert.ok(confidence.includes('coverage.families>=2'),'Ein Einzelmodell-Bootstrap darf nicht dieselbe Modellkonsistenzwertung wie eine echte Mehrmodellbasis erhalten.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und package.json müssen synchron sein.');
assert.equal(baseline.version,pkg.version,'Auch das Legacy-Baseline-Versionsfeld muss mit dem Release synchron bleiben.');
const syncVersion=await read('scripts/sync-version.mjs');
assert.ok(syncVersion.includes('baseline.releaseVersion=version;')&&syncVersion.includes('baseline.version=version;'),'Versionssynchronisierung muss beide Baseline-Versionsfelder pflegen.');
assert.equal(pkg.scripts?.['test:ensemble-fast-availability'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Fast-Availability-Regression muss in beiden Baseline-Testlisten stehen.');
console.log(`MID v${pkg.version}: Mean/Spread-first, serieller Einzelmodell-Bootstrap, vorläufige Anzeige und nachgelagerte Vollfusion geschützt.`);
