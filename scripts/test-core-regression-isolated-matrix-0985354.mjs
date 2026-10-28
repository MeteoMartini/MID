import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {regressionSuite} from './regression-suite.mjs';
import {REGRESSION_CORE_SUBSHARDS,REGRESSION_SHARD_NAMES,regressionCoreSubshards,regressionShard,regressionShardPlan} from './regression-shards.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file='scripts/test-core-regression-isolated-matrix-0985354.mjs';
const [canonical,active,baselineRaw,packageRaw]=await Promise.all([
 readFile(path.join(root,'ci/github/workflows/chatgpt-pr-gate.yml'),'utf8'),
 readFile(path.join(root,'.github/workflows/chatgpt-pr-gate.yml'),'utf8'),
 readFile(path.join(root,'MID_BASELINE.json'),'utf8'),
 readFile(path.join(root,'package.json'),'utf8'),
]);
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(packageRaw);
assert.equal(pkg.version,baseline.releaseVersion);
for(const key of ['regressionTests','requiredRegressionTests'])assert.ok(baseline[key].includes(file),`New matrix invariant absent from ${key}`);
assert.equal(canonical,active,'Active and canonical Source PR workflows must be byte-identical.');
assert.deepEqual(REGRESSION_CORE_SUBSHARDS,['core-1/4','core-2/4','core-3/4','core-4/4']);
const tests=await regressionSuite(root),plan=await regressionShardPlan(root),full=await regressionShard(root,'core');
assert.deepEqual(full,plan.shards.core,'Original core alias remains complete.');
const parts=regressionCoreSubshards(full);
const actual=(await Promise.all(REGRESSION_CORE_SUBSHARDS.map(name=>regressionShard(root,name)))).flat();
const keys=new Set(actual);
assert.equal(actual.length,full.length,'All core tests must execute once across independent CI jobs.');
assert.equal(keys.size,full.length,'No test may be executed by two Core jobs.');
assert.deepEqual([...keys].sort(),[...full].sort(),'Missing core tests are a release blocker.');
assert.equal(actual.filter(name=>name==='test-core-regression-isolated-matrix-0985354.mjs').length,1);
for(const [index,name] of REGRESSION_CORE_SUBSHARDS.entries()){
 assert.deepEqual(parts[name],full.filter((_,i)=>i%REGRESSION_CORE_SUBSHARDS.length===index));
 assert.ok(parts[name].length>0,`Core subshard empty: ${name}`);
}
await assert.rejects(regressionShard(root,'core-0/4'),/Unknown MID regression shard/);
await assert.rejects(regressionShard(root,'core-5/4'),/Unknown MID regression shard/);
await assert.rejects(regressionShard(root,'core-1/3'),/Unknown MID regression shard/);
const allAssigned=[...actual,...REGRESSION_SHARD_NAMES.filter(name=>name!=='core').flatMap(name=>plan.shards[name])];
assert.equal(allAssigned.length,tests.length,'Core+Heavy coverage must preserve every test.');
assert.deepEqual(new Set(allAssigned),new Set(tests));
const source=canonical.split('  source_core:')[1].split('  core_regressions:')[0];
const core=canonical.split('  core_regressions:')[1].split('  heavy_regressions:')[0];
const heavy=canonical.split('  heavy_regressions:')[1].split('  ruc27_qualification:')[0];
const release=canonical.split('  validate_source:')[1];
for(const token of ['npm run audit:dependencies','npm run audit:all','python tools/ruc/test_fetch_resilience.py','npm run build','node --check worker/metar-proxy.js','cap copy ios','Server-seitige Release-Paketierung vorprüfen'])assert.ok(source.includes(token),`Source preflight lost: ${token}`);
assert.ok(!source.includes('MID_REGRESSION_SHARD=core npm run test:regressions'),'Monolithic regression step must no longer monopolize Source Core timeout.');
for(const name of REGRESSION_CORE_SUBSHARDS)assert.equal(core.split('shard: '+name).length,2,'Exactly one matrix job per Core subset: '+name);
assert.ok(core.includes('fail-fast: false')&&!core.includes('continue-on-error'),'Core matrix must be fail-closed and run every part.');
for(const token of ['npm ci','npm run build','tools/ruc/requirements-pages.txt','MID_REGRESSION_SHARD: ${{ matrix.shard }}','npm run test:regressions','timeout-minutes: 13'])assert.ok(core.includes(token),`Core matrix lost execution/provenance: ${token}`);
assert.ok(heavy.includes('heavy-mountain-visual')&&heavy.includes('heavy-unified-map')&&heavy.includes('heavy-browser-state'),'Existing heavy matrix must stay mandatory.');
for(const token of ['- source_core','- core_regressions','- heavy_regressions','CORE_MATRIX_RESULT: ${{ needs.core_regressions.result }}','CORE_MATRIX_RESULT" != success','HEAVY_RESULT" != success','always()'])assert.ok(release.includes(token),`Gate would allow incomplete source regression matrix: ${token}`);
assert.ok(!release.includes('continue-on-error'),'Release must never ignore a failed required source job.');
console.log(`MID ${pkg.version}: ${full.length} Core regressions in four lossless isolated shards; ${tests.length} full inventory covered, all source/heavy/installer gates retained.`);
