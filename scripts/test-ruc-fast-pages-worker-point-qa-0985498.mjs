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
assert.match(active,/id: fast_trust/,'Independent R2 publisher receipt missing');
assert.match(active,/steps\.fast_trust\.outcome == 'failure'/,'Failed trust handoff must trigger Pages rollback');
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
