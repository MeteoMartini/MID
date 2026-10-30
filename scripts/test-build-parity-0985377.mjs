import test from 'node:test';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {environmentFingerprint,validateManifest,compareBuilds,buildInventory,captureInputs} from '../tools/ci/build-parity.mjs';
const manifest=()=>{const m=({schema:'mid.build-parity.v1',releaseAuthorized:false,inputs:{sourceSha:'a'.repeat(40),treeSha:'b'.repeat(40),lockSha:'c'.repeat(64),environmentSha:'d'.repeat(64),node:'v22.16.0',npm:'10.9.2',platform:'linux',arch:'x64',image:'20261025.353.1'},files:[{path:'index.html',bytes:10,sha256:'e'.repeat(64)},{path:'version.json',bytes:0,sha256:'f'.repeat(64)}]});
  const sha=s=>createHash('sha256').update(s).digest('hex');
  m.identity={schema:'mid.web-build-identity.v1',version:'0.9.85.377',sourceGitSha:m.inputs.sourceSha,builtAtUtc:'2026-10-30T15:00:00.000Z',assetsSha256:sha(m.files.map(f=>f.path+'\0'+f.sha256+'\n').join('')),assetCount:2};
  const raw=JSON.stringify(m.identity,null,2)+'\n';m.files.push({path:'mid-build-identity.json',bytes:Buffer.byteLength(raw),sha256:sha(raw)});return m;};
test('identical independent inventories qualify bytes only, never authorize reuse',()=>{
  const a=manifest(),b=manifest();b.files.reverse();const result=compareBuilds(a,b);
  assert.equal(result.equivalent,true);assert.equal(result.reuseAuthorized,false);assert.equal(result.releaseAuthorized,false);
});
for(const key of Object.keys(manifest().inputs))test('changed build input rejected: '+key,()=>{
  const b=manifest();b.inputs[key]=['sourceSha','treeSha','lockSha','environmentSha'].includes(key)?'0'.repeat(b.inputs[key].length):'other';
  try{const result=compareBuilds(manifest(),b);assert.equal(result.equivalent,false);assert.deepEqual(result.inputDifferences,[key]);}catch(error){assert.match(error.message,/Invalid build identity/)}
});
test('changed, missing and additional files cannot hide behind unchanged filenames',()=>{
  for(const change of [m=>m.files[0].sha256='0'.repeat(64),m=>m.files[0].bytes++,m=>m.files.push({path:'extra',bytes:1,sha256:'0'.repeat(64)})]){
    const b=manifest();change(b);let result;try{result=compareBuilds(manifest(),b)}catch(error){assert.match(error.message,/identity|inventory/);continue}assert.equal(result.payloadEquivalent,false);
  }
  const b=manifest();b.files.pop();assert.throws(()=>compareBuilds(manifest(),b),/Incomplete/);
});
test('malformed, duplicate and traversal inventory is refused',()=>{
  for(const p of ['../x','/x','a/../x','a//x','a\\x','a\0x']){const b=manifest();b.files[0].path=p;assert.throws(()=>validateManifest(b),/Unsafe/)}
  const b=manifest();b.files.push({...b.files[0]});assert.throws(()=>validateManifest(b),/duplicate/);
  b.files.pop();b.inputs.extra='unknown';assert.throws(()=>validateManifest(b),/Unknown/);
});
test('VITE input order is deterministic; values remain absent; unrelated credentials are excluded',()=>{
  assert.equal(environmentFingerprint({VITE_A:'x',VITE_B:'y',TOKEN:'secret'}),environmentFingerprint({VITE_B:'y',VITE_A:'x'}));
  assert.notEqual(environmentFingerprint({VITE_A:'x'}),environmentFingerprint({VITE_A:'y'}));
  assert.notEqual(environmentFingerprint({VITE_A:'x'}),environmentFingerprint({VITE_A:'x',VITE_UNKNOWN:'z'}));
  assert.notEqual(environmentFingerprint({VITE_A:'x'}),environmentFingerprint({VITE_A:'x',VITE_lowercase:'z'}));
});
test('real inventory includes empty files and rejects symlinks',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'mid-parity-'));
  try{await writeFile(path.join(dir,'index.html'),'ok');await writeFile(path.join(dir,'version.json'),'');await mkdir(path.join(dir,'assets'));
    await writeFile(path.join(dir,'assets','a.js'),'same bytes');const files=await buildInventory(dir);
    assert.equal(files.length,3);assert.equal(files.find(f=>f.path==='version.json').bytes,0);
    await symlink(path.join(dir,'index.html'),path.join(dir,'assets','unsafe'));await assert.rejects(buildInventory(dir),/Unsafe/);
  }finally{await rm(dir,{recursive:true,force:true})}
});
test('qualification workflow cannot deploy, consume foreign artifacts or bypass independent builds',async()=>{
  const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
  const workflow=await read('ci/github/workflows/build-parity-qualification.yml');
  assert.equal(workflow,await read('.github/workflows/build-parity-qualification.yml'));
  assert.match(workflow,/contents: read/);assert.doesNotMatch(workflow,/secrets\.|attestations:|id-token:|contents: write|continue-on-error|workflow_run:/);
  assert.match(workflow,/copy: \[a, b\]/);assert.match(workflow,/fail-fast: false/);
  for(const token of ['npm ci','npm run build','needs: independent_build','ref: ${{ github.sha }}','digest-mismatch: error','mid-build-parity-${{ github.run_id }}-${{ github.run_attempt }}-a','mid-build-parity-${{ github.run_id }}-${{ github.run_attempt }}-b'])assert.ok(workflow.includes(token),token);
  const bot=await read('ci/github/workflows/agent-source-release.yml');
  assert.match(bot,/group: mid-agent-source-release\n  #.*\n  queue: max\n  cancel-in-progress: false/);
  assert.match(bot,/sha="\$\{EXPECTED_HEAD_SHA\}"/);
  const installer=await read('ci/github/workflows/install-mid.yml');
  assert.ok(installer.includes("needs.verify_core_shards.result == 'success'"));
  assert.ok(installer.includes('npm run test:regressions'));
});

test('real differing build timestamps remain visible without granting full byte identity',()=>{
 const a=manifest(),b=manifest();b.identity.builtAtUtc='2026-10-30T15:00:01.000Z';
 const raw=JSON.stringify(b.identity,null,2)+'\n',f=b.files.find(f=>f.path==='mid-build-identity.json');f.bytes=Buffer.byteLength(raw);f.sha256=createHash('sha256').update(raw).digest('hex');
 const result=compareBuilds(a,b);assert.equal(result.equivalent,false);assert.equal(result.payloadEquivalent,true);assert.equal(result.executionMetadataDiffers,true);assert.equal(result.reuseAuthorized,false);
 b.identity.assetsSha256='0'.repeat(64);assert.throws(()=>compareBuilds(a,b),/mismatch/);
});
test('ignored local environment files cannot enter a clean source fingerprint invisibly',async()=>{
 const dir=await mkdtemp(path.join(tmpdir(),'mid-build-inputs-'));
 const git=(...args)=>execFileSync('git',args,{cwd:dir,stdio:'pipe'});
 try{
  git('init','-q');git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid');
  await writeFile(path.join(dir,'.gitignore'),'.env*\n');await writeFile(path.join(dir,'package-lock.json'),'{}\n');
  git('add','.');git('commit','-qm','fixture');assert.match((await captureInputs(dir,{})).sourceSha,/^[a-f0-9]{40}$/);
  await writeFile(path.join(dir,'.env.local'),'VITE_lowercase=hidden\n');
  assert.equal(git('status','--porcelain').toString(),'');
  await assert.rejects(captureInputs(dir,{}));
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Source optional remote npm cache cannot block exact Node setup or bypass mandatory installation',async()=>{
 const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
 const source=await read('ci/github/workflows/chatgpt-pr-gate.yml');
 assert.equal(source,await read('.github/workflows/chatgpt-pr-gate.yml'));
 const setups=[...source.matchAll(/uses: actions\/setup-node@([a-f0-9]{40})[^\n]*\n        with:\n([\s\S]*?)(?=\n\n|\n      -)/g)];
 assert.equal(setups.length,5);
 for(const [,sha,config] of setups){assert.equal(sha,'949feb2413d6458794dcd2491c4babbbce0c15c1');assert.match(config,/node-version: 22.16.0/);assert.match(config,/package-manager-cache: false/);assert.doesNotMatch(config,/\bcache: npm/)}
 for(const token of ['npm ci','npm run audit:dependencies','npm run audit:all','npm run build','npm run test:regressions','fail-fast: false','Agent-Quellstand vollständig prüfen'])assert.ok(source.includes(token),token);
 assert.doesNotMatch(source,/continue-on-error/);
});
