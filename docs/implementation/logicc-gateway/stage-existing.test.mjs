import test from 'node:test';
import assert from 'node:assert/strict';
import {stage} from './stage-existing.mjs';
// Hashes of both immutable real versions are checked by the live preflight.
// This offline protocol fixture uses synthetic module bytes, with a test-local
// digest substitute only for those exact synthetic buffers.
const old='c92c57f2-e52e-48b0-a790-0a47a8e43566',candidate='c23678a6-04ab-4396-af80-0fbca0d867a9';
const accidental='0da4bc08-ce80-4457-9805-5bf9fce5434b',created='11111111-2222-4333-8444-555555555555';
const baseline='39d373f2-f1c5-4e53-b64d-31e8c05dbe4c';
const hashes=['d08678abe4f70531080db2065e966916279098543c9a2dc7668cb886599c3135','2d8544bc4298f3445884e46151f41176b87e80348c9ff9ce439e215bf1cdacd4'];
const bytes=[new Uint8Array(9119).fill(65),new Uint8Array(9545).fill(66)];
const original=crypto.subtle.digest.bind(crypto.subtle);
function mockDigest(t){t.mock.method(crypto.subtle,'digest',async(alg,b)=>{
  const a=new Uint8Array(b);const i=bytes.findIndex(v=>v.length===a.length&&v.every((x,k)=>x===a[k]));
  return i<0?original(alg,b):Uint8Array.from(hashes[i].match(/../g),h=>parseInt(h,16)).buffer;
});}
const env={LOGICC_CF_ACCOUNT_ID:'a'.repeat(32),LOGICC_CF_VERSION_TOKEN:'test',GH_TOKEN:'test',GITHUB_SHA:'b'.repeat(40),LOGICC_TRAFFIC_ACTION:'stage'};
const one=id=>[{version_id:id,percentage:100}],split=[{version_id:old,percentage:100},{version_id:candidate,percentage:0}];
const settings={compatibility_date:'2026-11-24',usage_model:'standard',compatibility_flags:[],bindings:['MID_GITHUB_APP_PRIVATE_KEY','MID_WRITE_GATEWAY_KEY'].map(name=>({name,type:'secret_text'}))};
function fixture(mode='ok',action='stage'){
  let active={id:accidental,versions:one(candidate)},reads=0,refs=0;const posts=[];
  if(mode==='baseline')active={id:baseline,versions:one(old)};
  if(mode==='already')active={id:created,versions:split};
  const wrap=result=>Response.json({success:true,result});
  const fetcher=async(url,init={})=>{
    const u=new URL(url);
    if(u.origin==='https://api.github.com'){assert.equal(init.method??'GET','GET');refs++;return Response.json({ref:'refs/heads/'+u.pathname.split('/').at(-1),object:{type:'commit',sha:mode==='ref-drift'&&refs===3?'c'.repeat(40):env.GITHUB_SHA}});}
    assert.equal(u.origin,'https://api.cloudflare.com');
    assert.ok(u.pathname.includes('/accounts/'+env.LOGICC_CF_ACCOUNT_ID+'/workers/'));
    if(init.method==='POST'){
      assert.ok(u.pathname.endsWith('/scripts/mid-logicc-write/deployments'));
      assert.equal(u.search,'');
      const body=JSON.parse(init.body);posts.push(body);assert.equal(body.strategy,'percentage');
      assert.deepEqual(body.versions,action==='stage'?split:one(old));
      if(mode==='ambiguous')throw Error('timeout');
      active={id:created,versions:mode==='bad-readback'?one(candidate):body.versions};
      return wrap({id:created,versions:body.versions});
    }
    assert.equal(init.method,'GET');
    if(u.pathname.endsWith('/deployments')){reads++;return wrap({deployments:[mode==='race'&&reads===2?{id:created,versions:one(candidate)}:active]});}
    if(u.pathname.endsWith('/settings'))return wrap(mode==='settings'?{...settings,usage_model:'unbound'}:settings);
    if(u.pathname.endsWith('/subdomain'))return wrap({enabled:true,previews_enabled:mode==='preview'});
    const i=u.pathname.endsWith('/'+old)?0:u.pathname.endsWith('/'+candidate)?1:-1;
    assert.ok(i>=0);assert.equal(u.search,'?include=modules');
    const b=mode==='hash'&&i===1?new Uint8Array(9545).fill(67):bytes[i];
    return wrap({id:i===0?old:candidate,...settings,main_module:'worker.mjs',modules:[{name:'worker.mjs',content_type:'application/javascript+module',content_base64:btoa(String.fromCharCode(...b))}]});
  };
  return {posts,run:()=>stage({env:{...env,LOGICC_TRAFFIC_ACTION:action},fetcher})};
}
test('recover accidental promotion to exact 100/0 with one POST',async t=>{mockDigest(t);const f=fixture();assert.equal((await f.run()).status,'verified_allocation');assert.equal(f.posts.length,1);});
test('stage existing upload from baseline, no upload',async t=>{mockDigest(t);const f=fixture('baseline');assert.equal((await f.run()).status,'verified_allocation');assert.equal(f.posts.length,1);});
test('already staged is read-only',async t=>{mockDigest(t);const f=fixture('already');assert.equal((await f.run()).status,'already_target');assert.equal(f.posts.length,0);});
test('rollback staged allocation to baseline',async t=>{mockDigest(t);const f=fixture('already','rollback');assert.equal((await f.run()).status,'verified_allocation');assert.equal(f.posts.length,1);});
test('preflight hash, config, ref or concurrent drift prevents POST',async t=>{mockDigest(t);for(const m of ['hash','settings','preview','ref-drift','race']){const f=fixture(m);await assert.rejects(f.run());assert.equal(f.posts.length,0);}});
test('ambiguous POST or incorrect readback never retries',async t=>{mockDigest(t);for(const m of ['ambiguous','bad-readback']){const f=fixture(m);await assert.rejects(f.run());assert.equal(f.posts.length,1);}});
test('promotion not implemented',async()=>{await assert.rejects(stage({env:{...env,LOGICC_TRAFFIC_ACTION:'promote'},fetcher:()=>assert.fail('unexpected request')}));});
