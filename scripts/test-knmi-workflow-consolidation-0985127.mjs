import assert from 'node:assert/strict';
import {access,readdir,readFile} from 'node:fs/promises';

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

const archived=['mid-knmi-grib-inspect.yml','mid-knmi-grib-range-index.yml','mid-knmi-grid-index-smoke.yml','mid-knmi-multiparam-packed-smoke.yml','mid-knmi-multirange-smoke.yml','mid-knmi-open-data-smoke.yml','mid-knmi-open-data-tar-inspect.yml','mid-knmi-packed-point-smoke.yml','mid-knmi-point-adapter-smoke.yml','mid-knmi-point-inspect.yml'];
for(const name of archived)await access(new URL('../ci/github/archive/knmi/'+name,import.meta.url));

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
