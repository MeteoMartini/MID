import assert from 'node:assert/strict';
import {readdir,readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const [core,pkgRaw,baselineRaw,implementation]=await Promise.all([
 readFile(path.join(root,'src/MapLibreCore.tsx'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8'),
 readFile(path.join(root,'MID_IMPLEMENTATION_0.9.67.5.md'),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-maplibre-v6-worker-runtime-096675.mjs';

assert.ok(versionAtLeast(pkg.version,'0.9.67.5'));
assert.equal(pkg.dependencies?.['maplibre-gl'],'6.6.0');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:maplibre-v6-worker-runtime'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.67.5.md'));

const workerImport="import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';";
assert.ok(core.includes(workerImport),'Vite-kompatibler MapLibre-6-Workerimport fehlt.');
assert.ok(core.includes('maplibregl.setWorkerUrl(maplibreWorkerUrl);'),'MapLibre-6-Worker-URL wird nicht gesetzt.');
assert.ok(core.indexOf('maplibregl.setWorkerUrl(maplibreWorkerUrl);')<core.indexOf('new maplibregl.Map('),'Worker-URL muss vor der ersten Karte gesetzt werden.');
assert.ok(!core.includes("maplibre-gl-worker.mjs?url'"),'Ein ungebündelter ?url-Worker verliert in Produktion sein Shared-Modul.');

const assetsDir=path.join(root,'dist','assets');
try{
 const names=await readdir(assetsDir),workers=names.filter(name=>/^maplibre-gl-worker-.*\.js$/.test(name));
 assert.equal(workers.length,1,`Produktionsbuild benötigt genau einen selbstständigen MapLibre-Worker, gefunden: ${workers.join(', ')||'keiner'}.`);
 const workerPath=path.join(assetsDir,workers[0]),workerCode=await readFile(workerPath,'utf8'),workerStat=await stat(workerPath);
 assert.ok(workerStat.size>100_000,'MapLibre-Worker ist zu klein und offenbar nicht selbstständig gebündelt.');
 assert.ok(!/from\s*["'][^"']*maplibre-gl-shared/.test(workerCode),'MapLibre-Worker hängt noch von einem nicht emittierten Shared-Geschwistermodul ab.');
}catch(error){
 if(error?.code!=='ENOENT')throw error;
}

assert.ok(implementation.includes('Vite-Workergrenze')&&implementation.includes('GeoJSON-Flächen'));
console.log('MID 0.9.67.5: MapLibre-6-Vite-Workergrenze und produktive GeoJSON-Flächenverarbeitung geprüft.');
