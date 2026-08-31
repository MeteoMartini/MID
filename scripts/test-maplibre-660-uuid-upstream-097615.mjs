import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';
const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [pkgRaw,lockRaw,baselineRaw,policy,rules,implementation]=await Promise.all([
 read('package.json'),read('package-lock.json'),read('MID_BASELINE.json'),read('MID_DEPENDENCY_UPGRADE_POLICY.md'),read('MID_BRANCH_RULESET.json'),read('MID_IMPLEMENTATION_0.9.76.15.md')
]);
const pkg=JSON.parse(pkgRaw),lock=JSON.parse(lockRaw),baseline=JSON.parse(baselineRaw),branch=JSON.parse(rules);
const test='scripts/test-maplibre-660-uuid-upstream-097615.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.76.15'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(pkg.dependencies?.['maplibre-gl'],'6.6.0');
assert.equal(lock.packages?.['node_modules/maplibre-gl']?.version,'6.6.0');
assert.equal(lock.packages?.['node_modules/@maplibre/maplibre-gl-style-spec']?.version,'26.4.1');
assert.equal(lock.packages?.['node_modules/maplibre-gl']?.dependencies?.['@maplibre/maplibre-gl-style-spec'],'^26.3.0');
assert.equal(pkg.devDependencies?.['@capacitor/cli'],'8.5.0');
assert.equal(lock.packages?.['node_modules/@capacitor/cli']?.dependencies?.xcode,'^3.0.1');
assert.equal(lock.packages?.['node_modules/xcode']?.version,'3.0.1');
assert.equal(lock.packages?.['node_modules/xcode']?.dependencies?.uuid,'^7.0.3');
assert.equal(lock.packages?.['node_modules/uuid']?.version,'7.0.3');
assert.ok(policy.includes('@capacitor/cli 8.5.0 -> xcode 3.0.1 -> uuid ^7.0.3'));
assert.ok(policy.includes('kein')&&policy.includes('inkompatibles UUID-Override'));
assert.equal(branch.target,'mid-stable');
assert.ok(branch.requiredChecks?.includes('MID CI verify'));
assert.equal(branch.releaseEvidenceStatus,'MID / stable-release-quality');
assert.equal(branch.releaseWorkflowBypassRequired,true);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(implementation.includes('MapLibre GL JS 6.6.0')&&implementation.includes('uuid@7.0.3')&&implementation.includes('Branch-Schutz'));
console.log(`MID v${pkg.version}: MapLibre 6.6.0, transitive UUID-Upstreamgrenze und Stable-Branch-Schutzvorlage geprüft.`);
