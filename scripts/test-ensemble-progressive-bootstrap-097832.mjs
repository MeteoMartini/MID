import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [app,weather,cockpit,renderer,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/weather.ts',root),'utf8'),
 readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
 readFile(new URL('src/SkyBarSegments.tsx',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-ensemble-progressive-bootstrap-097832.mjs';
for(const token of ["requestPriority=ens.length?'normal':'foreground'",'ensembles(loc.latitude,loc.longitude,ensembleController.signal,requestPriority)','if(value.bootstrap)scheduleRetry(2_000)','setEnsembleRuns(current=>value.runs?.length?value.runs:current)'])assert.ok(app.includes(token),`Progressiver Ensemble-Apppfad fehlt: ${token}`);
for(const token of ['fastEnsembleBootstrap(','memberEnsembleBootstrap(','meanEnsembleBootstrap(','ENSEMBLE_BOOTSTRAP_MEMBER_IDS','ENSEMBLE_BOOTSTRAP_MEAN_IDS','try{const mean=await meanEnsembleBootstrap','bootstrap:true'])assert.ok(weather.includes(token),`Schneller Ensemble-Bootstrap fehlt: ${token}`);
assert.ok(!weather.slice(weather.indexOf('async function fastEnsembleBootstrap('),weather.indexOf('async function meanFallback(')).includes('Promise.any(['),'Bootstrap muss Mean/Spread vor dem großen Memberpfad seriell priorisieren.');
assert.ok(weather.includes("model.id,signal,'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m','foreground'"),'Der schnelle Member-Bootstrap muss nur die für die sofortige Unsicherheitsdarstellung benötigten Kernvariablen laden.');
assert.ok(cockpit.includes('ensembleError?:string')&&cockpit.includes('Ensemble-Nachladung wird erneut versucht'),'14d muss einen echten Ensemble-Nachladefehler sichtbar machen.');
assert.ok(renderer.includes('joinedLeft=touches(')&&renderer.includes('joinedRight=touches(')&&renderer.includes('Math.abs(a.strokeWidth-b.strokeWidth)<=0.01'),'Skybar muss gleich dicke aneinanderstoßende Segmente kantenlos verbinden.');
assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:ensemble-progressive-bootstrap'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Progressiver Ensemble-/Skybar-Test muss in der Baseline verpflichtend sein.');
console.log(`MID v${pkg.version}: progressiver 14d-Ensemble-Bootstrap und kantenlose gleichdicke Skybar-Segmente geschützt.`);
