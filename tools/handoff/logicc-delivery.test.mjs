import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverLogiccResult} from './logicc-result.mjs';

const assignment = {taskId: 'case-1', sourceSha: 'a'.repeat(40)};
const result = {...assignment, status: 'completed', summary: 'Done', checks: []};
const actor = {id:123,login:'synthetic-logicc[bot]',type:'Bot'};
const issue = 'https://api.github.com/repos/MeteoMartini/MID/issues/1007';
const url = 'https://api.github.com/repos/MeteoMartini/MID/issues/comments/42';
function reservation() {
  const claims = new Set();
  return async key => {
    if (claims.has(key)) return 'existing';
    claims.add(key);
    return 'claimed';
  };
}
function fixture(change = {}, failRead = false) {
  let calls = 0, reads = 0, posted;
  return {
    counts:()=>[calls, reads],
    deps: {
      expectedActor:actor, reserve:reservation(),
      publish: async ({repository,pullRequest,body,receipt}) => {
        assert.equal(repository,'MeteoMartini/MID');
        assert.equal(pullRequest,1007);
        assert.ok(body.includes(receipt));
        calls++;
        posted={id:42,url,issue_url:issue,body,user:actor};
        return {id:42};
      },
      readback:async request=>{
        assert.deepEqual(request,{repository:'MeteoMartini/MID',pullRequest:1007,commentId:42});
        reads++;
        if(failRead)throw Error('readback timeout');
        return {...posted,...change};
      }
    }
  };
}
test('concurrent delivery sends only once and verifies fixed target and author', async () => {
  const {deps,counts}=fixture();
  const results=await Promise.all([1,2].map(()=>deliverLogiccResult(result,assignment,deps)));
  assert.deepEqual(counts(),[1,1]);
  assert.deepEqual(results.map(x=>x.status).sort(),['already_claimed','posted']);
});
test('ambiguous send keeps claim and is never retried', async () => {
  let calls=0;
  const {deps}=fixture();
  deps.publish=async()=>{calls++;throw Error('timeout');};
  assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'reconciliation_required');
  assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'already_claimed');
  assert.equal(calls,1);
});
test('readback mismatch or timeout never claims success or repeats POST', async()=>{
  for(const change of [{id:99},{url:url+'x'},{issue_url:issue+'1'},{body:'wrong'},
      {user:{...actor,id:99}},{user:{...actor,login:'other[bot]'}},{user:{...actor,type:'User'}}]){
    const {deps,counts}=fixture(change);
    assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'reconciliation_required');
    assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'already_claimed');
    assert.deepEqual(counts(),[1,1]);
  }
  const {deps,counts}=fixture({},true);
  assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'reconciliation_required');
  assert.equal((await deliverLogiccResult(result,assignment,deps)).status,'already_claimed');
  assert.deepEqual(counts(),[1,1]);
});
test('unverified reservation cannot send', async () => {
  const {deps}=fixture();
  deps.reserve=async()=>undefined;
  deps.publish=async()=>assert.fail('Unexpected send');
  await assert.rejects(deliverLogiccResult(result,assignment,deps),/reservation is unverified/);
});
test('missing or non-bot actor and missing readback cannot reserve or send',async()=>{
  for(const patch of [{expectedActor:undefined},{expectedActor:{...actor,type:'User'}},{readback:undefined}]){
    const {deps}=fixture();
    await assert.rejects(deliverLogiccResult(result,assignment,{...deps,...patch,reserve:async()=>assert.fail('Unexpected claim')}),TypeError);
  }
});
test('invalid input never claims or publishes a receipt',async()=>{
  const {deps}=fixture();
  deps.reserve=async()=>assert.fail('Unexpected claim');
  deps.publish=async()=>assert.fail('Unexpected send');
  await assert.rejects(deliverLogiccResult({...result,checks:Array(1)},assignment,deps),TypeError);
});
