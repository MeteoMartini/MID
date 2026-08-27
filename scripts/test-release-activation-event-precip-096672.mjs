import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgText,baselineText,eventPanel,serviceWorker,legacyWorker,workerSource,changelog,implementation]=await Promise.all([
 read('package.json'),read('MID_BASELINE.json'),read('src/EventPlannerPanel.tsx'),read('public/service-worker.js'),read('public/sw.js'),read('worker-src/00-core-observations.js'),read('CHANGELOG.md'),read('MID_IMPLEMENTATION_0.9.67.2.md')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-release-activation-event-precip-096672.mjs';

assert.ok(versionAtLeast(pkg.version,'0.9.67.2'));
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests','protectedFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
for(const file of [test,'MID_IMPLEMENTATION_0.9.67.2.md'])assert.ok(baseline.requiredFiles.includes(file),`${file} fehlt in requiredFiles.`);
assert.equal(serviceWorker,legacyWorker,'Primärer und kompatibler Service Worker weichen ab.');
assert.ok(serviceWorker.includes(`const CACHE='mid-shell-v${pkg.version}'`));
const install=serviceWorker.match(/self\.addEventListener\('install',[\s\S]*?\);\nself\.addEventListener\('activate'/)?.[0]||'';
const cacheAt=install.indexOf('await cacheShell(CACHE)'),prepareAt=install.indexOf('await prepareUpdate()'),activateAt=install.indexOf('await self.skipWaiting()');
assert.ok(cacheAt>=0&&prepareAt>cacheAt&&activateAt>prepareAt,'Update wird nicht erst nach vollständiger Shell-Prüfung aktiviert.');
assert.ok(install.includes('if(self.registration.active)'),'Erstinstallation und Update werden nicht getrennt.');
assert.ok(serviceWorker.includes("const validatedUpdate=meta.pending?.targetVersion===VERSION&&meta.mode==='updating'"));
assert.ok(serviceWorker.includes('if(retryNewerRollback||validatedUpdate)await navigateClientsForUpdate()'));
assert.ok(serviceWorker.includes('MID_RUNTIME_HEALTHY')&&serviceWorker.includes('previousCache'),'Gesundheits-/Rückfallvertrag fehlt.');
assert.match(eventPanel,/eventPrecipLabel\(plan\.summary\)[\s\S]*eventPrecipProbability\(plan\.summary\)[\s\S]*precipitationTotal,1\)[\s\S]*mm[\s\S]*Wind/,'Kompakte Eventzeile enthält Wahrscheinlichkeit und Niederschlagsmenge nicht gemeinsam.');
assert.ok(workerSource.includes(`const WORKER_VERSION='${pkg.version}'`));
assert.ok(changelog.includes('## 0.9.67.2'));
assert.ok(implementation.includes('wartender Service Worker')&&implementation.includes('Niederschlagsmenge in mm'));

console.log('MID v0.9.67.2: validiertes Browser-/PWA-Update wird aktiviert; kompakte Events zeigen Wahrscheinlichkeit und Menge.');
