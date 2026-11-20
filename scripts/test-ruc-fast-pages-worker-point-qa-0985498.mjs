// SHA-bound MID #946 Fast Producer→Worker trust contract and source mirror checks.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const active=readFileSync(new URL('../.github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');
const mirror=readFileSync(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');
assert.equal(active,mirror,'Protected RUC Publisher workflow mirror drift');
assert.match(active,/node tools\/ruc\/ruc_fast_pages_readback\.mjs "\$site_root"/, 'Fast Pages public readback must use configured site root');
assert.doesNotMatch(active,/node tools\/ruc\/ruc_fast_pages_readback\.mjs https:\/\/www\.midwx\.app/, 'Fast Pages site URL must not be hardcoded');
const readback=readFileSync(new URL('../tools/ruc/ruc_fast_pages_readback.mjs',import.meta.url),'utf8');
assert.match(readback,/new URL\('ruc\/', origin\.endsWith\('\/'\)/, 'readback must preserve configured Pages site-path prefix');
assert.match(active,/site_root='https:\/\/www\.midwx\.app\/'; fi/, 'known apex redirect must use canonical HTTPS www readback');
// Match the actual step-level YAML guards. Loose string tokens could remain
// in comments or unrelated jobs while production rollback is unprotected.
const fastJob=active.split(/^  publish_fast:\s*$/m)[1];
assert.ok(fastJob,'Protected Fast publisher job missing');
const steps=fastJob.split(/^      - name: /m).slice(1);
const stepById=id=>{
 const matches=steps.filter(s=>new RegExp('^        id: '+id+'$', 'm').test(s));
 assert.equal(matches.length,1,'Fast publisher step missing or duplicated: '+id);
 return matches[0];
};
const trustStep=stepById('fast_trust');
const rollbackStep=stepById('fast_rollback');
const rollbackReadback=stepById('fast_rollback_readback');
const restoreStep=stepById('fast_trust_restore');
assert.match(trustStep,/^        if: steps\.fast_readback\.outcome == 'success'$/m,
 'R2 receipt must follow successful public Pages SHA readback');
assert.match(rollbackStep,/^        if: .*steps\.fast_deployment\.outcome == 'success'.*steps\.fast_trust\.outcome == 'failure'/m,
 'The actual Pages rollback step must cover failed R2 trust transfer');
assert.match(rollbackReadback,/^        if: .*steps\.fast_rollback\.outcome == 'success'/m,
 'Original Pages SHA must be read back after rollback');
assert.match(restoreStep,/^        if: .*steps\.fast_trust\.outputs\.wrote == 'true'.*steps\.fast_rollback_readback\.outcome == 'success'/m,
 'No R2 restoration before verified Pages rollback');
const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const workerMirror=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
assert.equal(worker,workerMirror,'Generated Worker mirror drift');
assert.match(worker,/MID_RUC_FAST_TRUST_KEY='ruc\/fast\/publisher-trust\.v1\.json'/);
const cases=[
 '../tests/unit/mid-ruc-fast-pages-worker-point.test.mjs',
 '../tools/ruc/test_build_fast_trust_receipt.mjs'
];
for(const relative of cases){
 const test=fileURLToPath(new URL(relative,import.meta.url));
 const run=spawnSync(process.execPath,['--test',test],{stdio:'inherit',timeout:120000});
 if(run.error)throw run.error;
 if(run.status!==0)process.exit(run.status??1);
}
