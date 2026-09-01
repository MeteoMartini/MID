import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,baselineRaw,installer,maintenanceTest,syncSource,syncRegression]=await Promise.all([
 read('package.json'),read('MID_BASELINE.json'),read('ci/github/workflows/install-mid.yml'),
 read('scripts/test-dependency-actions-maintenance-096673.mjs'),read('scripts/sync-github-workflows.mjs'),read('scripts/test-github-actions-v7-sync-09570.mjs')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-release-workflow-pin-boundary-096674.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.67.4'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(installer.includes("--exclude='.github/'"));
assert.ok(installer.includes("git add -A -- . ':(exclude).github/**'"));
assert.ok(!maintenanceTest.includes("read('.github/workflows/mid-code-revision.yml')"),'Wartungstest darf den absichtlich geschützten aktiven Workflow nicht als Installationsvoraussetzung lesen.');
assert.ok(maintenanceTest.includes("read('ci/github/workflows/install-mid.yml')"));
const codeql='cdf488f595d80d6e07e03d4674febd5ab45fa938';
assert.ok(syncSource.includes(`CODEQL_V4_SHA='${codeql}'`));
assert.ok(syncSource.includes('github/codeql-action/${action}@${CODEQL_V4_SHA} # v4.37.9'));
assert.ok(syncRegression.includes('v4.37.6')&&syncRegression.includes('v4.37.9'));
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: Release-Installer schützt .github, während der explizite Workflow-Sync CodeQL 4.37.9 und die Action-Pins administrativ aktualisiert.`);
