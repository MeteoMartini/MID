import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [pkgText,baselineText,fragment,worker]=await Promise.all(['package.json','MID_BASELINE.json','worker-src/00-core-observations.js','worker/metar-proxy.js'].map(path=>readFile(new URL(path,root),'utf8')));
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),version=String(pkg.version);
assert.ok(fragment.includes(`const WORKER_VERSION='${version}';`),`Kanonische Worker-Teilquelle ist nicht auf ${version} synchronisiert.`);
assert.ok(worker.includes(`const WORKER_VERSION='${version}';`),`Generierter Worker ist nicht auf ${version} synchronisiert.`);
assert.equal(baseline.releaseVersion,version,'Baseline-Version ist nicht mit package.json synchronisiert.');
console.log(`Aggregate-Versionen geprüft: package, Baseline, Worker-Fragment und generierter Worker = ${version}.`);
