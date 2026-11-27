import assert from 'node:assert/strict';
import test from 'node:test';
import {sendLogiccResult} from './logicc-github-transport.mjs';

const assignment = {taskId: 'smoke', sourceSha: 'a'.repeat(40)};
const result = {...assignment, status: 'completed', summary: 'Smoke passed', checks: []};
const actor = {id: 123, login: 'logicc[bot]', type: 'Bot'};
const config = {
  getInstallationToken: async () => 'mock_token',
  reserve: async () => 'claimed',
  expectedActor: actor,
};
const issues = 'https://api.github.com/repos/MeteoMartini/MID/issues';

test('writes once to PR 1007 and verifies the installed actor by GET', async t => {
  let body;
  const mock = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.Authorization, 'Bearer mock_token');
    if (options.method === 'POST') {
      assert.equal(url, issues + '/1007/comments');
      body = JSON.parse(options.body).body;
      return Response.json({id: 7}, {status: 201});
    }
    assert.equal(options.method, 'GET');
    assert.equal(url, issues + '/comments/7');
    return Response.json({id: 7, url, issue_url: issues + '/1007', body, user: actor});
  });
  assert.equal((await sendLogiccResult(result, assignment, config)).status, 'posted');
  assert.equal(mock.mock.callCount(), 2);
});

test('duplicate receipt performs no network requests', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw Error('unexpected'); });
  assert.equal((await sendLogiccResult(result, assignment, {...config,
    reserve: async () => 'existing',
  })).status, 'already_claimed');
  assert.equal(mock.mock.callCount(), 0);
});

test('ambiguous POST is not replayed', async t => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw Error('timeout'); });
  assert.equal((await sendLogiccResult(result, assignment, config)).status, 'reconciliation_required');
  assert.equal(mock.mock.callCount(), 1);
});

test('invalid or oversized responses never cause another POST', async t => {
  for (const response of [
    () => new Response('{}',{status:403}),
    () => new Response('{"id":7}',{status:201,headers:{'content-type':'text/plain'}}),
    () => new Response('{"id":7}',{status:201,headers:{'content-type':'application/json','content-length':'65537'}}),
    () => new Response('{"id":7}',{status:201,headers:{'content-type':'application/json','content-length':'20'}}),
    () => new Response('{"id":7,"pad":"'+'x'.repeat(65536)+'"}',{status:201,headers:{'content-type':'application/json'}}),
    () => new Response(Uint8Array.of(255),{status:201,headers:{'content-type':'application/json'}}),
    () => Response.json([], {status:201}),
    () => new Response('{"id":',{status:201,headers:{'content-type':'application/json'}}),
  ]) {
    const mock=t.mock.method(globalThis,'fetch',async()=>response());
    assert.equal((await sendLogiccResult(result,assignment,config)).status,'reconciliation_required');
    assert.equal(mock.mock.callCount(),1);
    mock.mock.restore();
  }
});
test('bad readback and token-provider failure do not repeat writes', async t => {
  const mock=t.mock.method(globalThis,'fetch',async (_url,options)=>
    options.method==='POST'?Response.json({id:7},{status:201}):Response.json({id:7,user:{id:999}}));
  assert.equal((await sendLogiccResult(result,assignment,config)).status,'reconciliation_required');
  assert.equal(mock.mock.callCount(),2);
  mock.mock.restore();
  const denied=t.mock.method(globalThis,'fetch',async()=>{throw Error('unexpected request');});
  for (const getInstallationToken of [async()=>null,async()=>{throw Error('unavailable');}])
    assert.equal((await sendLogiccResult(result,assignment,{...config,getInstallationToken})).status,'reconciliation_required');
  assert.equal(denied.mock.callCount(),0);
});
