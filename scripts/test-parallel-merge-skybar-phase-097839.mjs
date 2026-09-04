import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(path,'utf8');
const [pkgRaw,baselineRaw,phase,skybar,cockpit,app,styles,navigation,settings,prepare,workflow,mirror,urlContract,weatherTypes,ensembleFragment]=await Promise.all([
  read('package.json'),read('MID_BASELINE.json'),read('src/precipitationPhaseColor.ts'),read('src/detailSkyBar.ts'),read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/styles-src/30-modern.css'),read('src/externalNavigation.ts'),read('src/ConnectedStationSettings.tsx'),read('tools/cloudflare/prepare_worker_deploy.mjs'),read('ci/github/workflows/install-mid.yml'),read('workflow-patches/install-mid.yml'),read('scripts/source-url-contract.mjs'),read('src/weather-src/00-types-models-search.tsfrag'),read('src/weather-src/30-ensemble-climate-hazards.tsfrag')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-parallel-merge-skybar-phase-097839.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.78.39'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}`);
for(const file of [test,'src/precipitationPhaseColor.ts','scripts/source-url-contract.mjs','scripts/test-codeql-alert-remediation-097834.mjs','MID_PR_SECURITY_MATRIX_0.9.78.34.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles`);

// Parallel-chat security/hardening must survive the merge.
assert.ok(urlContract.includes('new URL(match[0])')&&urlContract.includes('url.hostname===expected.hostname'),'Exakte URL-/Host-Prüfung aus dem Parallel-Chat fehlt.');
assert.ok(navigation.includes('let pendingNetatmoCallback:MidNetatmoOAuthCallback|null=null')&&navigation.includes('takePendingMidNetatmoOAuthCallback'),'Flüchtiger Netatmo-Handoff fehlt.');
assert.ok(!navigation.includes('sessionStorage.setItem')&&!navigation.includes('localStorage.setItem'),'Netatmo-Callback wird wieder persistent gespeichert.');
assert.ok(settings.includes('takePendingMidNetatmoOAuthCallback()'),'Stationsbereich übernimmt den flüchtigen OAuth-Handoff nicht.');
for(const token of ["mkdtemp(path.join(os.tmpdir(),'mid-worker-deploy-'))",'chmod(tempDir,0o700)',"mode:0o600,flag:'wx'",'config_path=${out}','meta_path=${metaOut}'])assert.ok(prepare.includes(token),`Sicherer Worker-Tempvertrag fehlt: ${token}`);
assert.equal(workflow,mirror,'Kanonischer Installer und Workflow-Patch müssen bytegleich bleiben.');
for(const token of ['steps.remote_worker.outputs.config_path','steps.remote_worker.outputs.meta_path'])assert.ok(workflow.includes(token),`Sicherer Workflow-Pfad fehlt: ${token}`);
assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-codeql-alert-remediation-097834.mjs'),'Parallel-CodeQL-Regression fehlt in der Baseline.');

// Main-chat v35-v38 functionality must also remain present.
assert.ok(weatherTypes.includes('const ENSEMBLE_FRESH_CACHE_MS=60*60*1000'),'60-min-Ensemblecache aus v0.9.78.37 fehlt.');
assert.ok(ensembleFragment.includes('const ENSEMBLE_MODEL_TIMEOUT_MS=20_000')&&ensembleFragment.includes('ENSEMBLE_BOOTSTRAP_TIMEOUT_MS=30_000'),'Ensemble-Deadlines aus v35/v37 fehlen.');
assert.ok(ensembleFragment.includes('loadEnsembleUnits(selected,6')&&ensembleFragment.includes('signal,2)'),'Begrenzte 6er-Vollfusion mit maximal zwei parallelen Abrufen fehlt.');
assert.ok(app.includes('scheduleRetry(2_000)'),'Schnelle 2-s-Vollfusion nach Bootstrap fehlt.');
assert.ok(cockpit.includes('RELATIVE_SUN_RAYS.map')&&cockpit.includes('className="sun-base sun-ray"'),'Vollständige unverzerrte Sonnendarstellung aus v37 fehlt.');
assert.ok(skybar.includes('SKYBAR_THICKNESS_STEPS=[2.4,3.3,4.2,5.1]'),'Vier kräftigere Skybar-Dicken aus v38 fehlen.');
assert.ok(cockpit.includes('calendarDayHours=probabilityHours')&&cockpit.includes('cockpitDaySkyBarSegments(calendarDayHours.length?calendarDayHours:dayHours)'),'24-h-Tageskarten-Skybar fehlt.');

// Phase-aware precipitation colours are now a single shared contract.
for(const token of ["liquid:'var(--param-precipitation)'","snow:'#66bce8'","mixed:'#a769d8'","storm:'#7869e8'"])assert.ok(phase.includes(token),`Phasenfarbe fehlt: ${token}`);
assert.ok(phase.includes("type==='snow'||type==='snowShowers'||type==='snowGrains'")&&phase.includes("type==='freezingRain'||type==='freezingDrizzle'||type==='sleet'||type==='sleetShowers'")&&phase.includes("type==='thunderstorm'||type==='thunderstormHail'"),'Niederschlagsphasen werden nicht vollständig klassifiziert.');
assert.ok(skybar.includes('color:precipitationPhaseColor(parts.type)')&&skybar.includes('precipitationPhaseColorLabel(parts.type)'),'Skybar nutzt die gemeinsame Phasenpalette nicht.');
assert.ok(cockpit.includes("import {precipitationPhaseColor} from './precipitationPhaseColor';")&&cockpit.includes('return precipitationPhaseColor(plausiblePrecipitation(sample).type)'),'24-h-/Cockpit-Niederschlagsfarbe ist nicht mit der Skybar synchronisiert.');
assert.ok(app.includes('Niederschlag · nach Phase')&&app.includes('Regen/Sprühregen/Schauer blau, Schnee hellblau, Misch-/gefrierende Phase violett, Gewitter/Hagel purpur'),'Skybar-Legende beschreibt die Phasenfarben nicht.');
assert.ok(styles.includes('.detaillegend i.precipitation-bar{background:linear-gradient(90deg,var(--param-precipitation) 0 25%,#66bce8 25% 50%,#a769d8 50% 75%,#7869e8 75% 100%)!important}'),'Legendenmuster zeigt die Phasenpalette nicht.');

console.log(`MID v${pkg.version}: Parallel-Chat-Security, v35-v38-Ensemble/Skybar/Sonne und phasenabhängige Niederschlagsfarben gemeinsam geschützt.`);
