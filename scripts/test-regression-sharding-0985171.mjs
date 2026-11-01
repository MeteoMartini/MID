import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {regressionSuite} from './regression-suite.mjs';
import {mapBrowserCases,mapBrowserRunPlan,mapBrowserMemoryProbe} from './map-browser-shards.mjs';
import {REGRESSION_HEAVY_SHARDS,REGRESSION_SHARD_NAMES,regressionShardPlan} from './regression-shards.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tests=await regressionSuite(root),plan=await regressionShardPlan(root),assigned=REGRESSION_SHARD_NAMES.flatMap(name=>plan.shards[name]);
assert.equal(assigned.length,tests.length,'Shard-Summe muss exakt dem vollständigen Regressionsinventar entsprechen.');
assert.equal(new Set(assigned).size,tests.length,'Kein Regressionstest darf in zwei Shards liegen.');
assert.deepEqual(new Set(assigned),new Set(tests),'Kein Regressionstest darf durch Sharding fehlen.');
const mapKey=row=>`${row.width}:${row.theme}:${row.design}`;
const fullMap=mapBrowserCases(),groups=['1/3','2/3','3/3'],partition=groups.flatMap(mapBrowserCases);
assert.equal(fullMap.length,24,'6 Breiten, zwei Themes und zwei Designs bleiben verpflichtend.');
assert.equal(partition.length,24,'Kein Karten-Browserfall darf beim Laufzeit-Balancing entfallen.');
assert.equal(new Set(partition.map(mapKey)).size,24,'Alle Browserfälle müssen genau einem Job zugeordnet sein.');
assert.deepEqual(new Set(partition.map(mapKey)),new Set(fullMap.map(mapKey)),'Vollständige Browsermatrix muss erhalten bleiben.');
assert.deepEqual(groups.map(group=>mapBrowserCases(group).length),[9,7,8],'Laufzeitkalibrierte 9/7/8-Gruppierung bleibt verbindlich.');
assert.deepEqual(mapBrowserRunPlan(),groups,'Alle drei Pflichtgruppen bleiben aktiv.');
assert.equal(mapBrowserMemoryProbe('2/3'),true,'20 Reload-/GC-Memory-Zyklen bleiben zwingend vorhanden.');
for(const group of ['1/3','3/3'])assert.equal(mapBrowserMemoryProbe(group),false,'Memory-Probe darf nicht doppelt laufen.');

assert.deepEqual(REGRESSION_HEAVY_SHARDS['heavy-browser-state'],['test-favorite-selection-browser-0985189.mjs','test-forecast-display-persistence-0985166.mjs','test-fourteen-css-lazy-0985339.mjs']);
assert.deepEqual(REGRESSION_HEAVY_SHARDS['heavy-native-map'],['test-adaptive-native-maps-0985141.mjs']);
assert.deepEqual(REGRESSION_HEAVY_SHARDS['heavy-unified-map'],['test-unified-map-layers-0985167.mjs']);
assert.deepEqual(REGRESSION_HEAVY_SHARDS['heavy-mountain-visual'],['test-mountain-visual-acceptance-18213.mjs']);
for(const name of Object.values(REGRESSION_HEAVY_SHARDS).flat())assert.ok(!plan.shards.core.includes(name),name+' darf nicht zusätzlich im Core-Shard laufen.');

const [canonical,active]=await Promise.all([
 readFile(path.join(root,'ci/github/workflows/chatgpt-pr-gate.yml'),'utf8'),
 readFile(path.join(root,'.github/workflows/chatgpt-pr-gate.yml'),'utf8')
]);
assert.equal(canonical,active,'Kanonischer und aktiver Source-Gate-Workflow müssen bytegleich sein.');
for(const token of [
 'source_core:','heavy_regressions:','validate_source:',
 'name: Agent-Quellstand vollständig prüfen',
 'fail-fast: false','heavy-browser-state','heavy-native-map','heavy-unified-map','heavy-mountain-visual',
 'core_regressions:','CORE_MATRIX_RESULT: ${{ needs.core_regressions.result }}','MID_REGRESSION_SHARD: \${{ matrix.shard }}',
 'needs.source_core.result','needs.heavy_regressions.result'
])assert.ok(canonical.includes(token),'Source-Gate-Shardingvertrag fehlt: '+token);
assert.ok(canonical.indexOf('source_core:')<canonical.indexOf('validate_source:'),'Required gate must remain the final aggregator.');
assert.ok(canonical.includes('npm run build'),'Jeder Heavy-Shard braucht denselben Produktionsbuild als Browser-QA-Basis.');
const heavy=canonical.split('  heavy_regressions:')[1].split('  validate_source:')[0];
assert.equal((heavy.match(/shard: heavy-browser-state/g)||[]).length,1,'Browser-state wrappers must run exactly once in their own source matrix job.');
assert.equal((heavy.match(/shard: heavy-unified-map/g)||[]).length,3,'All three disjoint map groups must run before source release.');
for(const group of ['1/3','2/3','3/3'])assert.ok(heavy.includes("map_group: '"+group+"'"));
assert.ok(heavy.includes('MID_MAP_QA_SHARD: ${'+'{ matrix.map_group }}'));
assert.ok(!heavy.includes('continue-on-error')&&!heavy.includes('secrets.'),'Source matrix remains read-only and fail-closed.');
const coreMatrix=canonical.split('  core_regressions:')[1].split('  heavy_regressions:')[0];
for(const index of [1,2,3,4])assert.ok(coreMatrix.includes('shard: core-'+index+'/4'),'Core Teil '+index+' muss isoliert laufen.');
assert.equal((coreMatrix.match(/- shard: core-\d\/4/g)||[]).length,4,'Alle vier Core-Teiljobs sind Pflicht.');
assert.ok(!coreMatrix.includes('continue-on-error')&&coreMatrix.includes('fail-fast: false'),'Keine gescheiterten Core-Teile freigeben.');
assert.ok(canonical.includes('      - core_regressions')&&canonical.includes('needs.core_regressions.result'),'Der finale Freigabegate muss alle Core-Teile abwarten.');
assert.ok(!canonical.split('  source_core:')[1].split('  core_regressions:')[0].includes('MID_REGRESSION_SHARD=core npm run test:regressions'),'Core-Ausführung muss pro isoliertem Job statt in überlangem Source-Step erfolgen.');
console.log('MID v0.9.85.171: Regressionsinventar verlustfrei in Core plus drei isolierte Heavy-Shards partitioniert.');

// Execute the real final gate script: the migration cannot release on a skipped,
// cancelled or failed native 27h qualification, while unrelated PRs stay unchanged.
const gate=canonical.slice(canonical.indexOf('  validate_source:'));
assert.ok(gate.includes('      - ruc27_qualification')&&gate.includes('needs.ruc27_qualification.result'));
assert.ok(gate.includes("RUC27_REQUIRED: ${{ github.head_ref == 'chatgpt/v0.9.85.336-ruc27-qualification' }}"));
const gateScript=gate.split('        run: |\n')[1].split('\n').filter(line=>line.startsWith('          ')).map(line=>line.slice(10)).join('\n');
for(const [required,result,core,heavy,visual,extreme,success] of [
 ['false','skipped','success','success','skipped','false',true],
 ['true','success','success','success','skipped','false',true],
 ...['skipped','failure','cancelled',''].map(result=>['true',result,'success','success','skipped','false',false]),
 ['true','success','failure','success','skipped','false',false],
 ['true','success','success','failure','skipped','false',false],
 ['true','success','success','success','skipped','true',false],
]){
 const run=spawnSync('bash',['-c',gateScript],{encoding:'utf8',env:{...process.env,RUC27_REQUIRED:required,RUC27_RESULT:result,CORE_RESULT:core,CORE_MATRIX_RESULT:'success',HEAVY_RESULT:heavy,VISUAL_RESULT:visual,EXTREME_BRANCH:extreme}});
 assert.equal(run.status===0,success,`actual final Source gate: required=${required}, ruc=${result}, core=${core}, heavy=${heavy}, visual=${visual}`);
}

// Every skipped/failed/cancelled/missing Core matrix result must block promotion.
for(const result of ['skipped','failure','cancelled','']){
 const run=spawnSync('bash',['-c',gateScript],{encoding:'utf8',env:{...process.env,RUC27_REQUIRED:'false',RUC27_RESULT:'skipped',CORE_RESULT:'success',CORE_MATRIX_RESULT:result,HEAVY_RESULT:'success',VISUAL_RESULT:'skipped',EXTREME_BRANCH:'false'}});
 assert.notEqual(run.status,0,'Incomplete Core matrix must block source release: '+result);
}
