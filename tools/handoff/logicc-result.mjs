import {createHash} from 'node:crypto';

const SHA = /^[a-f0-9]{40}$/;
const TASK = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const STATUSES = new Set(['completed', 'blocked', 'failed']);
const FIELDS = 'checks,sourceSha,status,summary,taskId';

function boundedText(value, limit) {
  return typeof value === 'string' && value.trim().length > 0 &&
    Buffer.byteLength(value, 'utf8') <= limit && !/[\u0000-\u001f\u007f]/u.test(value);
}

export function prepareLogiccResult(result, assignment) {
  if (!assignment || typeof assignment.taskId !== 'string' || !TASK.test(assignment.taskId) ||
      typeof assignment.sourceSha !== 'string' || !SHA.test(assignment.sourceSha)) {
    throw new TypeError('Trusted Logicc assignment is missing or invalid');
  }
  if (!result || Object.keys(result).sort().join(',') !== FIELDS ||
      result.taskId !== assignment.taskId || result.sourceSha !== assignment.sourceSha ||
      !STATUSES.has(result.status) || !boundedText(result.summary, 1200) ||
      !Array.isArray(result.checks) || result.checks.length > 8 ||
      !result.checks.every(check => boundedText(check, 180))) {
    throw new TypeError('Invalid Logicc result for the trusted assignment');
  }

  const receipt = createHash('sha256').update(JSON.stringify([
    'MeteoMartini/MID#1007', assignment.taskId, assignment.sourceSha,
  ])).digest('hex');
  return {repository: 'MeteoMartini/MID', pullRequest: 1007, receipt, result: {
    taskId: assignment.taskId, sourceSha: assignment.sourceSha,
    status: result.status, summary: result.summary, checks: [...result.checks],
  }};
}

/**
 * reserve must atomically and durably claim the receipt before any send.
 * A failed or ambiguous send keeps the claim for manual reconciliation.
 */
export async function deliverLogiccResult(result, assignment, {reserve, publish}) {
  const prepared = prepareLogiccResult(result, assignment);
  const claim = await reserve(prepared.receipt);
  if (claim === 'existing') return {status: 'already_claimed', receipt: prepared.receipt};
  if (claim !== 'claimed') throw new Error('Logicc receipt reservation is unverified');

  try {
    const posted = await publish(prepared);
    if (!Number.isSafeInteger(posted?.id) || posted.id <= 0) {
      throw new Error('Missing comment ID');
    }
    return {status: 'posted', receipt: prepared.receipt, commentId: posted.id};
  } catch {
    return {status: 'reconciliation_required', receipt: prepared.receipt};
  }
}
