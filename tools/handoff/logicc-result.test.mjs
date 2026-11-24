import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLogiccResult} from './logicc-result.mjs';

const assignment = {taskId: 'logicc-1', sourceSha: 'a'.repeat(40)};
const result = {...assignment, status: 'completed', summary: 'Review complete', checks: ['Local checks passed']};

test('only PR 1007 is addressed and the receipt is stable per assignment', () => {
  const first = prepareLogiccResult(result, assignment);
  assert.equal(first.repository, 'MeteoMartini/MID');
  assert.equal(first.pullRequest, 1007);
  assert.match(first.receipt, /^[a-f0-9]{64}$/);
  assert.equal(prepareLogiccResult({...result, status: 'blocked'}, assignment).receipt, first.receipt);
  const next = {...assignment, taskId: 'logicc-2'};
  assert.notEqual(prepareLogiccResult({...result, ...next}, next).receipt, first.receipt);
});

test('rejects caller-selected targets, stale SHAs, unknown tasks and oversized or malformed results', () => {
  for (const patch of [
    {pullRequest: 1}, {repository: 'other/repo'}, {sourceSha: 'b'.repeat(40)},
    {taskId: 'unknown'}, {status: 'merge'}, {summary: 'ä'.repeat(601)},
    {summary: 'a\nb'}, {checks: Array(9).fill('x')}, {checks: [null]},
  ]) {
    assert.throws(() => prepareLogiccResult({...result, ...patch}, assignment), TypeError);
  }
  assert.throws(() => prepareLogiccResult(result, null), TypeError);
});
