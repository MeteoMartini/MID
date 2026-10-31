import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const activeRoot=new URL('../.github/workflows/',import.meta.url);
const canonicalRoot=new URL('../ci/github/workflows/',import.meta.url);
const p4aWorkflowPattern=/^mid-knmi-.*\.ya?ml$/i;
const [active,canonical]=await Promise.all([
 readdir(activeRoot).then(files=>files.filter(name=>p4aWorkflowPattern.test(name)).sort()),
 readdir(canonicalRoot).then(files=>files.filter(name=>p4aWorkflowPattern.test(name)).sort())
]);
assert.deepEqual(active,[],'KNMI-P4a-Diagnoseworkflows dürfen nicht weiter aktiv sein.');
assert.deepEqual(canonical,[],'Kanonische KNMI-P4a-Diagnoseworkflows dürfen nicht wieder durch Sync entstehen.');

const archiveRoot=new URL('../ci/github/archive/knmi/',import.meta.url);
const archived=(await readdir(archiveRoot)).filter(name=>/\\.ya?ml$/i.test(name));
assert.deepEqual(archived,[],'Alte KNMI-Experimente dürfen nicht erneut im aktiven Source-Tree eingecheckt werden.');
const archiveManifest=await readFile(new URL('README.md',archiveRoot),'utf8');
assert.ok(archiveManifest.includes('1ade69f46b9bf77e9adaa360353ffacc7a0b967c'),'Archiv-Provenienz muss an den freigegebenen Stable-SHA gebunden bleiben.');
const archivedBlobs=[["mid-knmi-grib-inspect.yml","c929ca61f0c268beb834b5c9cbdf5ebe3e8f739b"],["mid-knmi-grib-range-index.yml","4acb1699b9542d4dd399210debdd100e9fb33aa5"],["mid-knmi-grid-index-smoke.yml","45828407836ac5dc8e70c37362772d6b867dc3e5"],["mid-knmi-multiparam-packed-smoke.yml","977c098daaa0361d0fab20ae4aa94c63a09afb24"],["mid-knmi-multirange-smoke.yml","5de5140f1aa7c8771fb029a4d13c05714a367357"],["mid-knmi-open-data-smoke.yml","594bdf5e9d38968ac6340ec94e4650772b0d4fe6"],["mid-knmi-open-data-tar-inspect.yml","90f8f482a6e94e8e4865e23be98198b506d07751"],["mid-knmi-packed-point-smoke.yml","71d2da505c2544f25b6e0b1b4b18b28becf7f857"],["mid-knmi-point-adapter-smoke.yml","a1093b48a7d8985dd86c928fa63281998309a584"],["mid-knmi-point-inspect.yml","c6e7285ed1fe38f65b07bbe2cb7a0a7df7dd6b79"]];
for(const [name,sha] of archivedBlobs){
 assert.ok(archiveManifest.includes(name)&&archiveManifest.includes(sha),'Unveränderliche KNMI-Workflow-Historie muss rekonstruierbar bleiben: '+name);
}

const [sync,model,worker,core]=await Promise.all([
 readFile(new URL('scripts/sync-github-workflows.mjs',root),'utf8'),
 readFile(new URL('src/weather-src/00-types-models-search.tsfrag',root),'utf8'),
 readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
 readFile(new URL('worker-src/40-aviation-router.js',root),'utf8')
]);
assert.doesNotMatch(sync,/workflows\/mid-knmi-/i,'Entfernte P4a-Workflows dürfen nicht mehr im Synchronisator stehen.');
for(const id of ['knmi_harmonie_arome_europe','knmi_harmonie_arome_netherlands'])assert.ok(model.includes("id:'"+id+"'"),'Reguläre KNMI-HARMONIE-Modelle müssen erhalten bleiben: '+id);
assert.ok(worker.includes("id:'knmi_harmonie_europe'"),'Regulärer KNMI-Forecast-Workerpfad darf nicht verloren gehen.');
assert.ok(core.includes('knmiAirmetSignals'),'KNMI-Aviation AIRMET/SIGMET darf nicht entfernt werden.');
console.log('KNMI P4a: manuelle Diagnoseworkflows entfernt; Historiennachweise und produktive KNMI-Modelle/Beobachtung geschützt.');
