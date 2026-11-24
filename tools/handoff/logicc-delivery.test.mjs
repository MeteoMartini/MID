import test from 'node:test';
import assert from 'node:assert/strict';
import {deliverLogiccResult} from './logicc-result.mjs';

const assignment = {taskId: 'case-1', sourceSha: 'a'.repeat(40)};
const result = {...assignment, status: 'completed', summary: 'Done', checks: []};

function reservation() {
  const claims = new Set();
  return async key => {
    if (claims.has(key)) return 'existing';
    claims.add(key);
    return 'claimed';
  };
}

test('concurrent delivery sends only once to fixed target', async () => {
  let calls = 0;
  const dependencies = {reserve: reservation(), publish: async ({repository, pullRequest}) => {
    assert.equal(repository, 'MeteoMartini/MID');
    assert.equal(pullRequest, 1007);
    calls++;
    return {id: 42};
  }};
  const results = await Promise.all([1, 2].map(() => deliverLogiccResult(result, assignment, dependencies)));
  assert.equal(calls, 1);
  assert.deepEqual(results.map(item => item.status).sort(), ['already_claimed', 'posted']);
});

test('ambiguous send keeps the claim and is never retried', async () => {
  let calls = 0;
  const dependencies = {reserve: reservation(), publish: async () => {
    calls++;
    throw new Error('timeout');
  }};
  assert.equal((await deliverLogiccResult(result, assignment, dependencies)).status, 'reconciliation_required');
  assert.equal((await deliverLogiccResult(result, assignment, dependencies)).status, 'already_claimed');
  assert.equal(calls, 1);
});

test('unverified reservation cannot send', async () => {
  await assert.rejects(deliverLogiccResult(result, assignment, {
    reserve: async () => undefined, publish: async () => assert.fail('Unexpected send'),
  }), /reservation is unverified/);
});
