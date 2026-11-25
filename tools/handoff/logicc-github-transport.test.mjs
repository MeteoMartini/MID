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
