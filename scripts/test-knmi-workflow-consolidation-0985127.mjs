import assert from 'node:assert/strict';
import {access,readdir,readFile} from 'node:fs/promises';

const activeRoot=new URL('../.github/workflows/',import.meta.url);
const active=(await readdir(activeRoot)).filter(name=>/^mid-knmi-.*\.ya?ml$/i.test(name)).sort();
const expected=['mid-knmi-eps-rolling-manifest.yml','mid-knmi-eps-rolling-offset-smoke.yml'];
assert.deepEqual(active,expected,'Aktiv bleiben nur die zwei produktionsnahen KNMI-Diagnoseworkflows.');

const archived=['mid-knmi-grib-inspect.yml','mid-knmi-grib-range-index.yml','mid-knmi-grid-index-smoke.yml','mid-knmi-multiparam-packed-smoke.yml','mid-knmi-multirange-smoke.yml','mid-knmi-open-data-smoke.yml','mid-knmi-open-data-tar-inspect.yml','mid-knmi-packed-point-smoke.yml','mid-knmi-point-adapter-smoke.yml','mid-knmi-point-inspect.yml'];
for(const name of archived)await access(new URL('../ci/github/archive/knmi/'+name,import.meta.url));

const sync=await readFile(new URL('../scripts/sync-github-workflows.mjs',import.meta.url),'utf8');
for(const name of expected){
 const [canonical,activeContent]=await Promise.all([
  readFile(new URL('../ci/github/workflows/'+name,import.meta.url),'utf8'),
  readFile(new URL('../.github/workflows/'+name,import.meta.url),'utf8')
 ]);
 assert.equal(canonical,activeContent,name+' muss kanonisch gespiegelt sein.');
 assert.ok(sync.includes(`['workflows/${name}','workflows/${name}']`),name+' fehlt im Workflow-Sync.');
 assert.match(activeContent,/workflow_dispatch:/);
 assert.match(activeContent,/KNMI_OPEN_DATA_API_KEY/);
}
console.log('MID v0.9.85.127: KNMI-Workflowbestand von 12 auf 2 aktive Diagnosepfade konsolidiert.');
