import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('worker-src/00-core-observations.js');
const fn=source.slice(source.indexOf('async function dwdRucStaticJson('),source.indexOf('\n',source.indexOf('async function dwdRucStaticJson(')));
const urls=[];
const context={URL,Date,fetchWithDeadline:async url=>{urls.push(new URL(url));return{ok:true,json:async()=>({run:'new'})}}};
vm.createContext(context);vm.runInContext(fn,context);
await context.dwdRucStaticJson(new URL('https://example.test/ruc/'),'latest.json');
assert.equal(urls.at(-1).search,'','Forecast requests must preserve established cache behaviour');
await context.dwdRucStaticJson(new URL('https://example.test/ruc/'),'latest.json',true);
assert.ok(urls.at(-1).searchParams.has('mid_ruc_health_probe'),'Health must isolate the mutable upstream pointer');
assert.equal(urls.at(-1).pathname,'/ruc/latest.json');
const signer=read('ci/github/workflows/mid-d2-original-release-approval.yml');
assert.equal(signer,read('.github/workflows/mid-d2-original-release-approval.yml'),
  'Protected original signer must keep canonical and active workflows identical');
assert.equal((signer.match(/for ref in main mid-stable; do/g)||[]).length,2,
  'Protected signer must recheck both refs before and after attestation');
assert.ok(signer.indexOf('Revalidate protected Stable and source immediately before signing') < signer.indexOf('uses: actions/attest@'));
assert.ok(signer.indexOf('Revalidate protected Stable and index after attestation before handoff') > signer.indexOf('uses: actions/attest@'));
assert.ok(signer.includes('id: attest') && signer.includes('steps.attest.outputs.bundle-path'),
  'Signer must expose the original signed bundle to independent verification');
const verifyPos=signer.indexOf('Verify exact SLSA signer and index digest before archival');
assert.ok(verifyPos > signer.indexOf('Revalidate protected Stable and index after attestation before handoff')
  && verifyPos < signer.indexOf('Archive signed original D2 evidence, not deployed data'),
  'Cryptographic verification must finish before evidence upload');
for (const flag of ['gh attestation verify d2-original-approved/index.json',
  '--bundle "$ATTEST_BUNDLE"', '--signer-workflow "$GITHUB_REPOSITORY/.github/workflows/mid-d2-original-release-approval.yml"',
  '--source-ref refs/heads/main', '--source-digest "$GITHUB_SHA"',
  '--predicate-type https://slsa.dev/provenance/v1']) {
  assert.ok(signer.includes(flag), 'Missing strict SLSA verification constraint: '+flag);
}
for (const file of ['original-dwd-slsa-verification.json', 'original-dwd-attestation-bundle.json']) {
  assert.ok(signer.includes('            '+file), 'Verified SLSA proof must be archived: '+file);
}
const workflow=read('ci/github/workflows/install-mid.yml');
assert.ok(workflow.includes("steps.ruc_guard.outputs.current == 'true'"));
assert.ok(workflow.includes('check_ruc_snapshot_current.py'));
assert.equal(workflow,read('workflow-patches/install-mid.yml'));
const result=spawnSync(process.env.PYTHON||'python3',['tools/ruc/test_workflow_coordination.py'],{cwd:new URL('../',import.meta.url),encoding:'utf8'});
assert.equal(result.status,0,result.stderr);
console.log('RUC coordination: separate public/Worker checks, unchanged forecast cache and late snapshot rejection verified');
