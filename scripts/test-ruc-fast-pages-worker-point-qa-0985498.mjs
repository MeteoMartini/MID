// SHA-bound, R2-free MID Fast original producer → GitHub OIDC → Pages → Worker.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const active=readFileSync(new URL('../.github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');
const mirror=readFileSync(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8');
assert.equal(active,mirror,'Protected RUC Publisher workflow mirror drift');
assert.match(active,/node tools\/ruc\/ruc_fast_pages_readback\.mjs "\$site_root"/,
 'public native Fast Pages readback must use configured HTTPS root');
const prepare=active.split(/^  prepare_fast:\s*$/m)[1]?.split(/^  publish_fast:\s*$/m)[0];
const publish=active.split(/^  publish_fast:\s*$/m)[1];
assert.ok(prepare&&publish,'independent original DWD Fast prepare/publish jobs required');
assert.match(prepare,/id-token: write/,'issuer-signed SHA requires GitHub job-scoped OIDC permission');
assert.match(prepare,/build_fast_oidc_proof\.mjs fast-delivery-proof\.json candidate-site\/ruc\/fast\/publisher-proof\.v2\.json/,
 'protected producer must seal signed manifest digest before artifact upload');
assert.ok(prepare.indexOf('build_fast_oidc_proof.mjs')<prepare.indexOf('id: fast_candidate_archive'),
 'Publisher must sign before the candidate is sealed by Actions artifact digest');
assert.match(publish,/group: mid-pages/,'Fast publisher must preserve global Pages lock');
assert.match(publish,/id: fast_readback/);
assert.match(publish,/id: fast_oidc_readback/);
assert.match(publish,/ruc_fast_oidc_readback\.mjs "\$site_root"/);
assert.ok(publish.indexOf('id: fast_readback')<publish.indexOf('id: fast_oidc_readback')&&
 publish.indexOf('id: fast_oidc_readback')<publish.indexOf('id: fast_rollback'));
assert.match(publish,/steps\.fast_deployment\.outcome == 'success' && \(steps\.fast_readback\.outcome == 'failure' \|\| steps\.fast_oidc_readback\.outcome == 'failure'\)/,
 'Failed issuer signature/public proof readback must trigger original Pages rollback');
assert.match(publish,/id: fast_rollback_readback/);
assert.doesNotMatch(publish,/MID_RUC_R2_BUCKET|r2 object (put|delete)|fast_trust_restore|fast_trust/);
const pagesReadback=readFileSync(new URL('../tools/ruc/ruc_fast_pages_readback.mjs',import.meta.url),'utf8');
assert.match(pagesReadback,/new URL\('ruc\/', origin\.endsWith\('\/'\)/);
const oidc=readFileSync(new URL('../tools/ruc/fast_oidc_proof.mjs',import.meta.url),'utf8');
assert.match(oidc,/mid-ruc-fast-manifest:v1:/);
assert.match(oidc,/crypto\.subtle\.verify/);
assert.match(oidc,/repository_id/);
assert.match(oidc,/workflow_ref/);
assert.match(oidc,/FAST_OIDC_REPOSITORY_ID='1305110795'/);
const worker=readFileSync(new URL('../worker.js',import.meta.url),'utf8');
const workerMirror=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const workerSrc=readFileSync(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8');
assert.equal(worker,workerMirror,'Generated Worker mirror drift');
assert.ok(worker.includes('async function midFastSignedPagesTrust(env)')&&
 workerSrc.includes('async function midFastSignedPagesTrust(env)'));
assert.match(worker,/verifyFastOidcProof\(proof,jwks,/);
assert.match(worker,/MID_RUC_FAST_TRUST_KEY='ruc\/fast\/publisher-trust\.v1\.json'/,
 'Existing optional legacy private trust must not silently regress');
for(const relative of [
 '../tests/unit/mid-ruc-fast-pages-worker-point.test.mjs',
 '../tools/ruc/test_fast_oidc_proof.mjs',
 '../tools/ruc/test_build_fast_trust_receipt.mjs'
]){
 const file=fileURLToPath(new URL(relative,import.meta.url));
 const result=spawnSync(process.execPath,['--test',file],{stdio:'inherit',timeout:120000});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status??1);
}
