import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { syncBuiltinESMExports } from 'node:module';
import { verifySettings, verifyModule, upload } from './upload-version.mjs';
const valid = () => ({compatibility_date:'2026-11-24',usage_model:'standard',bindings:[
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
  for(const model of [undefined,null,'bundled','unbound'])
    assert.throws(()=>verifySettings({...valid(),usage_model:model},{versionResponse:true}));
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

// Protocol-only fixture: the actual deployed rollback bytes are not copied into tests.
const fixtureBytes=Buffer.alloc(9119,0x61);
const fixtureHash=crypto.createHash('sha256').update(fixtureBytes).digest('hex');
const rollbackDigest='d08678abe4f70531080db2065e966916279098543c9a2dc7668cb886599c3135';
function mockFixtureDigest(t){
  const original=crypto.createHash;
  t.mock.method(crypto,'createHash',function(...args){
    const h=original(...args);
    const digest=h.digest.bind(h);
    h.digest=(encoding)=>{const result=digest(encoding);return encoding==='hex'&&result===fixtureHash?rollbackDigest:result;};
    return h;
  });
  syncBuiltinESMExports();
  t.after(()=>{t.mock.restoreAll();syncBuiltinESMExports();});
}
const baselineId='c92c57f2-e52e-48b0-a790-0a47a8e43566';
const deploymentId='39d373f2-f1c5-4e53-b64d-31e8c05dbe4c';
const newId='11111111-2222-4333-8444-555555555555';
const env={LOGICC_CF_ACCOUNT_ID:'a'.repeat(32),LOGICC_CF_VERSION_TOKEN:'mock-only',GH_TOKEN:'mock-only',GITHUB_SHA:'b'.repeat(40)};
function fixture(mode='ok') {
  const posts=[];
  let refReads=0, allocationReads=0, settingsReads=0, uploaded;
  const wrap=result=>Response.json({success:true,result});
  const fetcher=async (url,init={})=>{
    const u=new URL(url);
    if(u.origin==='https://api.github.com'){
      assert.equal(init.method??'GET','GET');
      const branch=u.pathname.split('/').at(-1);
      assert.ok(['main','mid-stable'].includes(branch));
      refReads++;
      return Response.json({ref:'refs/heads/'+branch,object:{type:'commit',sha:mode==='drift'&&refReads===3?'c'.repeat(40):env.GITHUB_SHA}});
    }
    assert.equal(u.origin,'https://api.cloudflare.com');
    assert.ok(u.pathname.includes('/accounts/'+env.LOGICC_CF_ACCOUNT_ID+'/workers/'));
    if(init.method==='POST'){
      posts.push({url,body:JSON.parse(init.body)});
      assert.ok(u.pathname.endsWith('/workers/mid-logicc-write/versions'));
      assert.equal(u.search,'?deploy=false');
      if(mode==='ambiguous')throw Error('synthetic transport ambiguity');
      uploaded=posts[0].body;
      return wrap({id:newId});
    }
    assert.equal(init.method,'GET');
    if(u.pathname.endsWith('/deployments')){
      allocationReads++;
      return wrap({deployments:[{id:deploymentId,versions:[{version_id:baselineId,percentage:mode==='traffic'&&allocationReads===2?90:100}]}]});
    }
    if(u.pathname.endsWith('/subdomain'))return wrap({enabled:mode!=='subdomain',previews_enabled:false});
    if(u.pathname.endsWith('/settings')){settingsReads++;return wrap({...valid(),compatibility_flags:[],usage_model:mode==='settings-drift'&&settingsReads===2?'unbound':'standard'});}
    if(u.pathname.endsWith('/versions'))return wrap([{id:mode==='newest'?'other':baselineId}]);
    if(u.pathname.endsWith('/'+baselineId)){
      assert.equal(u.search,'?include=modules');
      return wrap({id:baselineId,...valid(),main_module:'worker.mjs',modules:[{name:'worker.mjs',content_type:'application/javascript+module',content_base64:mode==='bad-rollback'?Buffer.alloc(9119,0x62).toString('base64'):mode==='noncanonical-rollback'?fixtureBytes.toString('base64')+'\n':fixtureBytes.toString('base64')}]});
    }
    if(u.pathname.endsWith('/'+newId)){
      assert.equal(u.search,'?include=modules');
      return wrap({id:newId,...valid(),annotations:uploaded.annotations,main_module:'worker.mjs',modules:mode==='wrong-bytes'?[{...uploaded.modules[0],content_base64:'YQ=='}]:uploaded.modules});
    }
    throw Error('unexpected mock URL');
  };
  return {posts,fetcher};
}
test('entire upload protocol: exactly one staged POST, verified immutable readback',async t=>{
  mockFixtureDigest(t);
  const {posts,fetcher}=fixture();
  await upload({env,fetcher});
  assert.equal(posts.length,1);
  assert.deepEqual(posts[0].body.bindings,[
    {type:'inherit',name:'MID_GITHUB_APP_PRIVATE_KEY',version_id:baselineId},
    {type:'inherit',name:'MID_WRITE_GATEWAY_KEY',version_id:baselineId},
  ]);
  assert.equal(posts[0].body.annotations['workers/message'],'MID SHA '+env.GITHUB_SHA);
  assert.equal(posts[0].body.usage_model,'standard');
});
test('preflight drift, traffic drift, or a newer upload prevents every POST',async t=>{
  mockFixtureDigest(t);
  for(const mode of ['drift','traffic','newest','subdomain','settings-drift']){
    const {posts,fetcher}=fixture(mode);
    await assert.rejects(upload({env,fetcher}));
    assert.equal(posts.length,0);
  }
});
test('ambiguous POST or wrong readback stops with no second POST',async t=>{
  mockFixtureDigest(t);
  for(const mode of ['ambiguous','wrong-bytes']){
    const {posts,fetcher}=fixture(mode);
    await assert.rejects(upload({env,fetcher}));
    assert.equal(posts.length,1);
  }
});

test('wrong rollback digest or noncanonical bytes stop before any POST',async()=>{
  for(const mode of ['ok','bad-rollback','noncanonical-rollback']){
    const {posts,fetcher}=fixture(mode);
    await assert.rejects(upload({env,fetcher}),/Baseline module digest/);
    assert.equal(posts.length,0);
  }
});

test('noncanonical rollback encoding fails even with protocol fixture digest',async t=>{
  mockFixtureDigest(t);
  const {posts,fetcher}=fixture('noncanonical-rollback');
  await assert.rejects(upload({env,fetcher}),/Baseline module digest/);
  assert.equal(posts.length,0);
});
