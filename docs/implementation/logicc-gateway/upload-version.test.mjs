import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifySettings, verifyModule } from './upload-version.mjs';
const valid = () => ({compatibility_date:'2026-11-24',bindings:[
  {type:'secret_text',name:'MID_GITHUB_APP_PRIVATE_KEY'},
  {type:'secret_text',name:'MID_WRITE_GATEWAY_KEY'}
]});
test('only documented version omission means zero explicit flags',()=>{
  assert.doesNotThrow(()=>verifySettings(valid(),{versionResponse:true}));
  assert.doesNotThrow(()=>verifySettings({...valid(),compatibility_flags:[]}));
  assert.throws(()=>verifySettings(valid()));
  for (const value of [null,undefined,{},'', ['nodejs_compat']])
    assert.throws(()=>verifySettings({...valid(),compatibility_flags:value},{versionResponse:true}));
  assert.throws(()=>verifySettings({...valid(),compatibility_date:'2026-11-25'},{versionResponse:true}));
  assert.throws(()=>verifySettings({...valid(),bindings:[...valid().bindings,{type:'plain_text',name:'extra'}]},{versionResponse:true}));
});
test('readback must equal frozen bytes, exact SHA annotation and module identity',async()=>{
  const bytes=await readFile(new URL('./worker.mjs',import.meta.url));
  const sha='a'.repeat(40), id='b'.repeat(36);
  const good={id,annotations:{'workers/tag':'logicc-0.1.1-2d8544bc4298f344','workers/message':'MID SHA '+sha},main_module:'worker.mjs',modules:[{name:'worker.mjs',content_type:'application/javascript+module',content_base64:bytes.toString('base64')}]};
  assert.doesNotThrow(()=>verifyModule(good,id,sha,bytes));
  for(const change of [{id:'wrong'},{annotations:{}},{modules:undefined},{modules:[]},{modules:[{...good.modules[0],content_base64:'YQ=='}]},{modules:[{...good.modules[0],content_type:'text/plain'}]},{main_module:'other.mjs'}])
    assert.throws(()=>verifyModule({...good,...change},id,sha,bytes));
});
