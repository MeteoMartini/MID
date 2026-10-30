import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {environmentFingerprint,validateManifest,compareBuilds,buildInventory} from '../tools/ci/build-parity.mjs';
const manifest=()=>({schema:'mid.build-parity.v1',releaseAuthorized:false,inputs:{sourceSha:'a'.repeat(40),treeSha:'b'.repeat(40),lockSha:'c'.repeat(64),environmentSha:'d'.repeat(64),node:'v22.16.0',npm:'10.9.2',platform:'linux',arch:'x64',image:'20261025.353.1'},files:[{path:'index.html',bytes:10,sha256:'e'.repeat(64)},{path:'version.json',bytes:0,sha256:'f'.repeat(64)}]});
test('identical independent inventories qualify bytes only, never authorize reuse',()=>{
  const a=manifest(),b=manifest();b.files.reverse();const result=compareBuilds(a,b);
  assert.equal(result.equivalent,true);assert.equal(result.reuseAuthorized,false);assert.equal(result.releaseAuthorized,false);
});
for(const key of Object.keys(manifest().inputs))test('changed build input rejected: '+key,()=>{
  const b=manifest();b.inputs[key]=['sourceSha','treeSha','lockSha','environmentSha'].includes(key)?'0'.repeat(b.inputs[key].length):'other';
  const result=compareBuilds(manifest(),b);assert.equal(result.equivalent,false);assert.deepEqual(result.inputDifferences,[key]);
});
test('changed, missing and additional files cannot hide behind unchanged filenames',()=>{
  for(const change of [m=>m.files[0].sha256='0'.repeat(64),m=>m.files[0].bytes++,m=>m.files.push({path:'extra',bytes:1,sha256:'0'.repeat(64)})]){
    const b=manifest();change(b);assert.equal(compareBuilds(manifest(),b).equivalent,false);
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
});
test('real inventory includes empty files and rejects symlinks',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'mid-parity-'));
  try{await writeFile(path.join(dir,'index.html'),'ok');await writeFile(path.join(dir,'version.json'),'');await mkdir(path.join(dir,'assets'));
    await writeFile(path.join(dir,'assets','a.js'),'same bytes');const files=await buildInventory(dir);
    assert.equal(files.length,3);assert.equal(files.find(f=>f.path==='version.json').bytes,0);
    await symlink(path.join(dir,'index.html'),path.join(dir,'assets','unsafe'));await assert.rejects(buildInventory(dir),/Unsafe/);
  }finally{await rm(dir,{recursive:true,force:true})}
});
