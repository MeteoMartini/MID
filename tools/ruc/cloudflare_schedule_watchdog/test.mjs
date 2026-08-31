import assert from 'node:assert/strict';
import {decideRecovery} from './src/index.js';

const now = Date.parse('2026-08-31T12:00:00Z');
const run = (minutesAgo, extra={}) => ({
  created_at: new Date(now - minutesAgo * 60_000).toISOString(),
  status: 'completed',
  conclusion: 'success',
  event: 'schedule',
  ...extra
});

assert.equal(decideRecovery([run(10)], now).reason, 'fresh-run');
assert.equal(decideRecovery([run(50)], now).reason, 'stale-run');
assert.equal(decideRecovery([], now).reason, 'no-runs');
assert.equal(decideRecovery([run(60, {status:'in_progress', conclusion:null})], now).reason, 'active-run');
assert.equal(decideRecovery([run(55, {event:'workflow_dispatch'}), run(70)], now).reason, 'stale-run');
assert.equal(decideRecovery([run(5, {event:'workflow_dispatch'}), run(70)], now).reason, 'dispatch-cooldown');
assert.equal(decideRecovery([run(5, {conclusion:'failure'})], now).reason, 'latest-run-failed');

console.log('MID RUC external watchdog decision contract OK');
