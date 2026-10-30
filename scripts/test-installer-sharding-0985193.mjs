import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {mapBrowserMemoryProbe,mapBrowserWidths,mapBrowserCases,mapBrowserRunPlan,MAP_BROWSER_WIDTHS} from './map-browser-shards.mjs';
const root=process.cwd(),source=await readFile('ci/github/workflows/install-mid.yml','utf8');
for(const file of ['.github/workflows/install-mid.yml','workflow-patches/install-mid.yml'])assert.equal(await readFile(file,'utf8'),source);
for(const token of ['prepare_release:','verify_core:','verify_heavy:','needs: [prepare_release, verify_core, verify_core_shards, verify_heavy]','fail-fast: false','MID_REGRESSION_SHARD: ${{ matrix.shard }}','npm run test:regressions','npm run build','snapshot_sha','MID_SNAPSHOT_SHA','${{ github.sha }}','${{ github.run_id }}-${{ github.run_attempt }}','persist-credentials: false'])assert.ok(source.includes(token),'Installer gate missing: '+token);
const coreShards=source.split('  verify_core_shards:')[1].split('  verify_heavy:')[0];
assert.ok(coreShards && coreShards.includes('needs: prepare_release'),'Four-part Core matrix must be release-snapshot bound.');
assert.equal((coreShards.match(/shard: core-[1-4]\/4/g)||[]).length,4,'Exactly four disjoint core matrix entries required.');
for(const shard of ['core-1/4','core-2/4','core-3/4','core-4/4'])assert.equal(coreShards.split('shard: '+shard).length,2,'Missing/duplicated core shard '+shard);
for(const invariant of ['fail-fast: false','MID_REGRESSION_SHARD: ${{ matrix.shard }}','npm run test:regressions',
 'npm run build','MID_SNAPSHOT_SHA','digest-mismatch: error','tools/ruc/requirements-pages.txt','persist-credentials: false']){
 assert.ok(coreShards.includes(invariant),'Core matrix invariant missing: '+invariant);
}
const coreBuild=source.split('  verify_core:')[1].split('  verify_core_shards:')[0];
assert.ok(coreBuild.includes('npm run build') && coreBuild.includes('node --check worker/metar-proxy.js'),'Release build, audit and Worker syntax must remain.');
assert.ok(!coreBuild.includes('MID_REGRESSION_SHARD: core'),'Installer must not repeat monolithic Core in addition to all four mandatory shards.');
const collectorGate=source.split('  install_build:')[1].split('  deploy_worker:')[0];
assert.ok(collectorGate.includes("needs.verify_core_shards.result == 'success'"),'Commit/promotion must fail unless every Core matrix shard succeeded.');
const heavy=source.split('  verify_heavy:')[1].split('  install_build:')[0];assert.equal((heavy.match(/shard: heavy-unified-map/g)||[]).length,3);for(const key of ['heavy-browser-state','heavy-native-map','heavy-mountain-visual',"map_group: '1/3'","map_group: '2/3'","map_group: '3/3'"])assert.ok(heavy.includes(key));assert.ok(!heavy.includes('secrets.')&&!heavy.includes('permission-contents: write'));
for(const key of ['prepare_release','verify_core','verify_core_shards','verify_heavy']){const block=source.split('  '+key+':')[1].split(/^  \w+:/m)[0];assert.ok(!block.includes('secrets.')&&!block.includes('permission-contents: write'),'No write credentials before aggregate gate');}
const collector=source.split('  install_build:')[1].split('  deploy_worker:')[0];assert.ok(collector.includes('needs.verify_core.outputs.snapshot_sha'));assert.ok(!collector.includes('continue-on-error'));
assert.equal((source.match(/artifact-ids: \$\{\{ needs\.(?:prepare_release|verify_core)\.outputs\.snapshot_id \}\}/g)||[]).length,4,'Retries must download the immutable producer artifact, not the new attempt name');
assert.equal((source.match(/digest-mismatch: error/g)||[]).length,4);assert.equal((source.match(/Missing producer artifact ID/g)||[]).length,4);
const allCases=mapBrowserCases(),assigned=['1/3','2/3','3/3'].flatMap(mapBrowserCases),caseKey=row=>`${row.width}/${row.theme}/${row.design}`;assert.equal(assigned.length,24);assert.equal(new Set(assigned.map(caseKey)).size,24,'No duplicated or dropped cases');assert.deepEqual(assigned.map(caseKey).sort(),allCases.map(caseKey).sort());assert.deepEqual(['1/3','2/3','3/3'].map(shard=>mapBrowserCases(shard).length),[10,8,6],'Desktop work rebalanced without reducing coverage');assert.deepEqual(mapBrowserWidths(),[...MAP_BROWSER_WIDTHS]);for(const bad of ['0/3','4/3','1/2','abc','1/3 ']){assert.throws(()=>mapBrowserWidths(bad));assert.throws(()=>mapBrowserCases(bad))}
assert.deepEqual(mapBrowserRunPlan(),['1/3','2/3','3/3']);for(const shard of ['1/3','2/3','3/3'])assert.deepEqual(mapBrowserRunPlan(shard),[shard]);for(const bad of ['0/3','1/2','abc'])assert.throws(()=>mapBrowserRunPlan(bad));
const wrapper=await readFile('scripts/test-unified-map-layers-0985167.mjs','utf8');assert.ok(wrapper.includes('for(const shard of mapBrowserRunPlan(process.env.MID_MAP_QA_SHARD))')&&wrapper.includes('MID_MAP_QA_SHARD:shard')&&wrapper.includes('timeout:900000'),'Revision wrapper must run complete assigned shards without raising per-shard budget');
const temp=await mkdtemp(path.join(tmpdir(),'mid-snapshot-test-')),checkout=path.join(temp,'checkout'),snapshot=path.join(temp,'snapshot'),output=path.join(temp,'output'),tool=path.join(root,'tools/ci/release-snapshot.mjs'),event='a'.repeat(40);
try{await mkdir(checkout);await mkdir(path.join(checkout,'.git'));await writeFile(path.join(checkout,'.git','keep'),'git');await writeFile(path.join(checkout,'source.txt'),'validated release');
 const run=(op,env={})=>execFileSync(process.execPath,[tool,op,snapshot],{cwd:checkout,env:{...process.env,GITHUB_SHA:event,GITHUB_OUTPUT:output,...env},encoding:'utf8'});
 run('pack');const digest=(await readFile(output,'utf8')).match(/snapshot_sha=([a-f0-9]{64})/)[1];await writeFile(path.join(checkout,'source.txt'),'old');await writeFile(path.join(checkout,'stale.txt'),'stale');run('restore',{MID_SNAPSHOT_SHA:digest});assert.equal(await readFile(path.join(checkout,'source.txt'),'utf8'),'validated release');assert.equal(await readFile(path.join(checkout,'.git','keep'),'utf8'),'git');await assert.rejects(readFile(path.join(checkout,'stale.txt')));
 assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:'b'.repeat(64)}));assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:digest,GITHUB_SHA:'c'.repeat(40)}));await writeFile(path.join(snapshot,'release.tar.gz'),'tampered');assert.throws(()=>run('restore',{MID_SNAPSHOT_SHA:digest}));assert.equal(await readFile(path.join(checkout,'source.txt'),'utf8'),'validated release');
}finally{await rm(temp,{recursive:true,force:true})}
console.log('Installer: exact event/manifest/archive/files binding, fail-closed parallel gate and lossless 24-case map partition verified.');

assert.equal((heavy.match(/shard: heavy-browser-state/g)||[]).length,1,'Installer must independently repeat the entire browser-state shard exactly once.');

assert.deepEqual(mapBrowserRunPlan().filter(mapBrowserMemoryProbe),['3/3'],'Exactly one complete isolated memory probe survives the three-group run');
assert.equal(mapBrowserMemoryProbe(''),true,'Direct full-matrix runs retain the memory probe');
for(const bad of ['0/3','4/3','1/2','abc'])assert.throws(()=>mapBrowserMemoryProbe(bad));
const mapRunner=await readFile('scripts/verify-unified-map-browser-0985167.mjs','utf8');
assert.ok(mapRunner.includes('perfEnabled&&mapBrowserMemoryProbe(process.env.MID_MAP_QA_SHARD)')&&mapRunner.includes("verifyCase(390,'light','next',true)"),'Preserve the entire original 20-cycle probe on the lighter shard');
