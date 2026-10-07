import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [canonical,active,baseline,pkg]=await Promise.all([
 read('ci/github/workflows/widget-export.yml'),
 read('.github/workflows/widget-export.yml'),
 read('MID_BASELINE.json'),
 read('package.json')
]);
assert.equal(active,canonical,'Aktiver und kanonischer Widget-Workflow müssen bytegleich sein.');
for(const token of [
 "cron: '17 0,6,12,18 * * *'",
 'workflow_dispatch:',
 'ref: mid-stable'
])assert.ok(canonical.includes(token),`Widget-Zeitplan fehlt: ${token}`);
assert.ok(!canonical.includes('workflow_run:'),'Widget-Export darf nicht mehr automatisch an Release-Abschlüsse gekoppelt sein.');
assert.ok(!canonical.includes('push:\n    branches:\n      - mid-stable'),'Widget-Export darf nicht mehr automatisch an mid-stable-Pushes gekoppelt sein.');
assert.ok(!canonical.includes("github.event_name != 'workflow_run'"),'Veralteter Workflow-Run-Guard muss entfernt sein.');
assert.equal((canonical.match(/cron:/g)||[]).length,1,'Widget-Export muss genau einen Cron-Ausdruck besitzen.');
const parsedBaseline=JSON.parse(baseline),parsedPackage=JSON.parse(pkg),self='scripts/test-widget-export-stable-trigger-0985179.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(parsedBaseline[key]?.includes(self),`${self} fehlt in ${key}.`);
assert.equal(parsedPackage.scripts?.['test:widget-export-stable-trigger'],`node ${self}`);
console.log(`MID v${parsedPackage.version}: Widget-Export läuft automatisch ausschließlich viermal täglich im 6-Stunden-Abstand; manueller Start bleibt erhalten.`);
