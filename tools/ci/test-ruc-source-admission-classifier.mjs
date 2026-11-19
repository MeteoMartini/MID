import test from 'node:test';
import assert from 'node:assert/strict';
import {classifyRucSourceChanges,RESTORE_ONLY,NATIVE_ADMISSION_SURFACES}
  from './ruc-source-admission-classifier.mjs';

const restore='tools/ruc/restore_ruc_pages_snapshot.py';
const restoreTest='tools/ruc/test_restore_ruc_pages_snapshot.py';
const cases=[
 ['docs only',['docs/implementation/qa.md'],false,false],
 ['unrelated UI',['src/App.tsx'],false,false],
 ['no changes',[],false,false],
 ['restore only',[restore],false,true],
 ['restore test only',[restoreTest],false,true],
 ['both restore paths',[restore,restoreTest],false,true],
 ['restore and release note',[restore,'RELEASE_NOTES.md'],false,true],
 ['native builder',['tools/ruc/build_ruc_bundle.py'],true,false],
 ['DWD scheduler',['tools/ruc/check_ruc_schedule_guard.py'],true,false],
 ['native sidecar regression',['tools/ruc/test_ruc_native_sidecar.py'],true,false],
 ['unknown RUC file',['tools/ruc/experimental.py'],true,false],
 ['RUC moved out',[restore,'tools/ruc/old.py','docs/old.py'],true,false],
 ['path prefix trick',[restore+'/trailing'],true,false],
 ['path suffix trick',[restore+'.bak'],true,false],
 ['newline trick',[restore+'\nother'],true,false],
 ['RUC composite verifier',['scripts/verify-ruc-composites.mjs'],true,false],
 ['RUC synoptic consumer',['src/rucSynopticFields.ts'],true,false],
 ['native synoptic consumer',['src/nativeSynopticFields.ts'],true,false],
 ['cloud original consumer',['src/cloudWeatherData.ts'],true,false],
 ['active gate workflow',['.github/workflows/chatgpt-pr-gate.yml'],true,false],
 ['canonical gate workflow',['ci/github/workflows/chatgpt-pr-gate.yml'],true,false],
 ['classifier modified',['tools/ci/ruc-source-admission-classifier.mjs'],true,false],
 ['classifier tests modified',['tools/ci/test-ruc-source-admission-classifier.mjs'],true,false],
 ['Vitest wrapper modified',['tests/unit/mid-ruc-source-admission-classifier.test.ts'],true,false],
 ['mixed restore native',[restore,'tools/ruc/build_ruc_bundle.py'],true,false],
 ['mixed restore workflow',[restore,'.github/workflows/chatgpt-pr-gate.yml'],true,false],
 ['duplicated paths',['tools/ruc/build_ruc_bundle.py','tools/ruc/build_ruc_bundle.py'],true,false],
];
for(const [label,paths,enabled,restoreOnly] of cases){
 test(label,()=>{
  const actual=classifyRucSourceChanges(paths);
  assert.equal(actual.enabled,enabled);
  assert.equal(actual.restoreOnly,restoreOnly);
  assert.equal(actual.fullAdmissionPaths>0,enabled);
 });
}
test('restore exemption exact set',()=>{
 assert.deepEqual([...RESTORE_ONLY].sort(),[restore,restoreTest].sort());
 assert.equal(RESTORE_ONLY.size,2);
});
test('sensitive gate changes never become exempt',()=>{
 assert.equal(NATIVE_ADMISSION_SURFACES.size,9);
 for(const p of NATIVE_ADMISSION_SURFACES)assert.equal(classifyRucSourceChanges([restore,p]).enabled,true,p);
});
test('invalid diff fails closed',()=>{
 for(const p of [null,'abc',[null],[12],[''],['broken\0path']])
  assert.throws(()=>classifyRucSourceChanges(p),/Unverifiable/);
});
