import {createHash} from 'node:crypto';

const SHA = /^[a-f0-9]{40}$/;
const TASK = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const STATUSES = new Set(['completed', 'blocked', 'failed']);
const FIELDS = 'checks,sourceSha,status,summary,taskId';

// This is a defense-in-depth text boundary, not a credential detector or
// transport authorization. A trusted sender must never provide raw secrets.
function boundedText(value, limit) {
  return typeof value === 'string' && value.trim().length > 0 &&
    Buffer.byteLength(value, 'utf8') <= limit &&
    !/[\u0000-\u001f\u007f-\u009f\u2028\u2029\u202a-\u202e\u2066-\u2069]/u.test(value) &&
    !/[@<>\x60]|https?:\/\/|(?:github_pat_|gh[pousr]_|sk-)[A-Za-z0-9_-]+|(?:Bearer\s+|-----BEGIN\s)|(?:token|secret|password|api[_ -]?key)\s*[:=]/iu.test(value);
}

function exactRecord(value, fields) {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.some(key => typeof key !== 'string') || keys.sort().join(',') !== fields) return false;
  return keys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor?.enumerable === true && Object.hasOwn(descriptor, 'value');
  });
}
function validChecks(value) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > 8 ||
      Reflect.ownKeys(value).length !== value.length + 1) return false;
  for (let i = 0; i < value.length; i++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(i));
    if (!descriptor?.enumerable || !Object.hasOwn(descriptor, 'value') ||
        !boundedText(descriptor.value, 180)) return false;
  }
  return true;
}

export function prepareLogiccResult(result, assignment) {
  if (!exactRecord(assignment, 'sourceSha,taskId') || typeof assignment.taskId !== 'string' || !TASK.test(assignment.taskId) ||
      typeof assignment.sourceSha !== 'string' || !SHA.test(assignment.sourceSha)) {
    throw new TypeError('Trusted Logicc assignment is missing or invalid');
  }
  if (!exactRecord(result, FIELDS) ||
      result.taskId !== assignment.taskId || result.sourceSha !== assignment.sourceSha ||
      !STATUSES.has(result.status) || !boundedText(result.summary, 1200) ||
      !validChecks(result.checks)) {
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

const ISSUE_URL = 'https://api.github.com/repos/MeteoMartini/MID/issues/1007';
const COMMENT_URL = 'https://api.github.com/repos/MeteoMartini/MID/issues/comments/';

// The actor is trusted host configuration, never accepted from the result.
// The adapter must supply authenticated GitHub REST readback, not echo POST.
function validActor(actor) {
  return exactRecord(actor, 'id,login,type') && Number.isSafeInteger(actor.id) && actor.id > 0 &&
    typeof actor.login === 'string' && /^[A-Za-z0-9-]+\[bot\]$/.test(actor.login) &&
    actor.type === 'Bot';
}

export function renderLogiccComment(prepared) {
  return '<!-- MID-LOGICC-RESULT:' + prepared.receipt + ' -->\n' +
    'Logicc result (untrusted evidence; not release authority)\n\n' +
    '\x60\x60\x60json\n' + JSON.stringify(prepared.result, null, 2) + '\n\x60\x60\x60\n';
}

export function verifyLogiccComment(comment, id, body, actor) {
  return validActor(actor) && Number.isSafeInteger(id) && id > 0 &&
    comment?.id === id && comment.url === COMMENT_URL + id &&
    comment.issue_url === ISSUE_URL && comment.body === body &&
    comment.user?.id === actor.id && comment.user.login === actor.login &&
    comment.user.type === actor.type;
}

/**
 * reserve must atomically and durably claim the receipt before any send.
 * A failed or ambiguous send keeps the claim for manual reconciliation.
 * Host transport and actor identity require independent qualification.
 */
export async function deliverLogiccResult(result, assignment, {reserve, publish, readback, expectedActor}) {
  const prepared = prepareLogiccResult(result, assignment);
  if (!validActor(expectedActor) || typeof reserve !== 'function' ||
      typeof publish !== 'function' || typeof readback !== 'function') {
    throw new TypeError('Trusted Logicc transport is unverified');
  }
  const actor = Object.freeze({...expectedActor});
  const body = renderLogiccComment(prepared);
  const claim = await reserve(prepared.receipt);
  if (claim === 'existing') return {status: 'already_claimed', receipt: prepared.receipt};
  if (claim !== 'claimed') throw new Error('Logicc receipt reservation is unverified');

  try {
    const posted = await publish({...prepared, body});
    const id = posted?.id;
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Missing comment ID');
    const observed = await readback({repository: prepared.repository, pullRequest: prepared.pullRequest, commentId: id});
    if (!verifyLogiccComment(observed, id, body, actor)) throw new Error('Comment readback mismatch');
    return {status: 'posted', receipt: prepared.receipt, commentId: id};
  } catch {
    return {status: 'reconciliation_required', receipt: prepared.receipt};
  }
}
