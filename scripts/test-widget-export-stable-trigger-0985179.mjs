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
 'workflow_run:',
 'push:\n    branches:\n      - mid-stable',
 "cron: '17 * * * *'",
 'workflow_dispatch:',
 'ref: mid-stable',
 'github.event_name != \'workflow_run\''
])assert.ok(canonical.includes(token),`Widget-Stable-Trigger fehlt: ${token}`);
const parsedBaseline=JSON.parse(baseline),parsedPackage=JSON.parse(pkg),self='scripts/test-widget-export-stable-trigger-0985179.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(parsedBaseline[key]?.includes(self),`${self} fehlt in ${key}.`);
assert.equal(parsedPackage.scripts?.['test:widget-export-stable-trigger'],`node ${self}`);
console.log(`MID v${parsedPackage.version}: Widget-Export startet deterministisch bei jeder mid-stable-Promotion und behält Workflow-Run, Stundenplan sowie manuellen Start als Redundanz.`);
