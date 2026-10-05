import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {regressionSuite} from './regression-suite.mjs';
import {regressionExecutionPlan,regressionRiskReasons} from './regression-execution.mjs';
import {regressionShardPlan} from './regression-shards.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
assert.deepEqual(regressionRiskReasons("import {readFile} from 'node:fs/promises';"),[]);
for(const sample of ["import {writeFile} from 'node:fs/promises';","import {spawn} from 'node:child_process';","import http from 'node:http'; const server=http.createServer(()=>{});","process.env.TEST='1';","await fetch('https://example.invalid/')","const moduleName='x'; await import(moduleName)"])assert.ok(regressionRiskReasons(sample).length>0,'Gefährliche Parallelprobe wurde nicht seriell klassifiziert: '+sample);
assert.ok((await import('./regression-execution.mjs')).classifyRegression,'Klassifizierer muss explizit exportiert bleiben.');
const tests=await regressionSuite(root),shardPlan=await regressionShardPlan(root),shardAll=Object.values(shardPlan.shards).flat(),plan=await regressionExecutionPlan(root,tests),all=[...plan.parallel,...plan.serial];
assert.equal(shardAll.length,tests.length);assert.equal(new Set(shardAll).size,tests.length);assert.ok(tests.every(name=>shardAll.includes(name)));
assert.equal(all.length,tests.length);assert.equal(new Set(all).size,tests.length);assert.ok(tests.every(name=>all.includes(name)));
assert.ok(plan.parallel.length>0);assert.ok(plan.serial.length>0);
for(const name of ['test-mountain-visual-acceptance-18213.mjs','test-worker-auto-deploy-09693.mjs','test-github-actions-v7-sync-09570.mjs'])assert.ok(plan.serial.includes(name),name+' muss seriell bleiben.');
const source=await readFile(path.join(root,'scripts','run-regressions.mjs'),'utf8');
const [gateCanonical,gateActive,autoCanonical,autoActive,installCanonical,installActive,installPatch]=await Promise.all([
 'ci/github/workflows/chatgpt-pr-gate.yml','.github/workflows/chatgpt-pr-gate.yml','ci/github/workflows/agent-source-release.yml','.github/workflows/agent-source-release.yml','ci/github/workflows/install-mid.yml','.github/workflows/install-mid.yml','workflow-patches/install-mid.yml'
].map(file=>readFile(path.join(root,file),'utf8')));
assert.equal(gateCanonical,gateActive);assert.equal(autoCanonical,autoActive);assert.equal(installCanonical,installActive);assert.equal(installCanonical,installPatch);
for(const token of ['fetch-depth: 1','prepare_pages_artifact:','git fetch --unshallow --no-tags origin','compare/${stable_before}...${release_sha}','-F force=false'])assert.ok((gateCanonical+autoCanonical+installCanonical).includes(token),'Release-Optimierungsvertrag fehlt: '+token);
for(const token of ['regressionExecutionPlan','MID_REGRESSION_JOBS','availableParallelism','Promise.all','for(const name of plan.serial)'])assert.ok(source.includes(token),'Runner-Vertrag fehlt: '+token);
assert.ok(!source.includes('spawnSync('));
console.log('Regressionen bleiben vollständig; '+plan.parallel.length+' parallel-sicher, '+plan.serial.length+' seriell.');
