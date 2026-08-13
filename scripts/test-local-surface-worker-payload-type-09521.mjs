import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [weather,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

assert.ok(weather.includes("type LocalSurfaceContext={error?:string;"),'LocalSurfaceContext muss den Worker-Fehlervertrag erfüllen.');
assert.ok(weather.includes("fetchWorkerJson<LocalSurfaceContext>('site-context'"),'Oberflächenkontext muss weiterhin typisiert über den Worker geladen werden.');
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Version und Baseline müssen übereinstimmen.');
assert.ok(/^0\.9\.52\./.test(pkg.version),'Hotfix gehört zur 0.9.52.x-Linie.');
assert.ok(baseline.requiredRegressionTests.includes('scripts/test-local-surface-worker-payload-type-09521.mjs'),'09521-Regression muss Required sein.');
console.log(`MID v${pkg.version}: LocalSurfaceContext erfüllt den WorkerPayload-Typvertrag.`);
