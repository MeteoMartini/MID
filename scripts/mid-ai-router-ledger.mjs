/**
 * MID AI Router offline/local QA ledger (not a production distributed store).
 *
 * Atomic O_EXCL reservations block a second network dispatch with the same
 * request ID, including after process restart or an ambiguous first response.
 * No automatic retries, lease-expiry takeovers or deletion/compaction.
 * Only a trusted, OS-provisioned private directory on a local POSIX filesystem
 * is supported. NFS, ephemeral runners, multi-host Workers and production
 * secret stores are intentionally outside this contract.
 */
import {createHash} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat,open,realpath} from 'node:fs/promises';
import {isAbsolute,join,resolve} from 'node:path';
import {MidAiRouterBlocked} from './mid-ai-router.mjs';

const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$/;
const SHA40 = /^[a-f0-9]{40}$/;
const SHA64 = /^[a-f0-9]{64}$/;

const blocked = (reason) => {throw new MidAiRouterBlocked(reason);};

function validatePlan(plan) {
  if (!plan || plan.status !== 'PLAN_ONLY' || !ID.test(plan.requestId || '') ||
      !SHA40.test(plan.expectedStableSha || '') ||
      !SHA64.test(plan.taskFingerprint || '') ||
      !['openrouter','groq','gemini'].includes(plan.provider) ||
      typeof plan.model !== 'string' || plan.model.length > 128 ||
      !Number.isFinite(Date.parse(plan.proofCheckedAt || '')))
    blocked('INVALID_LEDGER_PLAN');
}

/**
 * Return a durableClaim callback for executeMidAiRoute.
 *
 * The directory must already exist, must be 0700 (or stricter), must belong
 * to the running service user, and must not be a symlink. Operations are
 * serialized across processes only on a reliably local POSIX filesystem.
 */
export function makeMidAiLocalDurableClaim({directory,plan}) {
  validatePlan(plan);
  if (process.platform === 'win32' || typeof process.getuid !== 'function')
    blocked('LEDGER_POSIX_REQUIRED');
  if (typeof directory !== 'string' || !isAbsolute(directory) ||
      directory !== resolve(directory))
    blocked('LEDGER_ABSOLUTE_DIRECTORY_REQUIRED');
  const fileName = createHash('sha256')
    .update('mid-ai-router-request-v1\0' + plan.requestId)
    .digest('hex') + '.json';

  return async (requestId,provider,model) => {
    if (requestId !== plan.requestId || provider !== plan.provider ||
        model !== plan.model)
      blocked('CLAIM_PLAN_MISMATCH');

    let rootStat;
    try {
      rootStat = await lstat(directory);
      if (!rootStat.isDirectory() || rootStat.isSymbolicLink() ||
          rootStat.uid !== process.getuid() || (rootStat.mode & 0o077) !== 0 ||
          (await realpath(directory)) !== directory)
        blocked('UNSAFE_LEDGER_DIRECTORY');
    } catch (error) {
      if (error instanceof MidAiRouterBlocked) throw error;
      blocked('LEDGER_DIRECTORY_UNAVAILABLE');
    }

    const filename = join(directory,fileName);
    let handle;
    try {
      handle = await open(filename,
        constants.O_CREAT | constants.O_EXCL |
        constants.O_WRONLY | constants.O_NOFOLLOW,0o600);
    } catch (error) {
      if (error?.code === 'EEXIST') return false;
      blocked('LEDGER_EXCLUSIVE_CREATE_FAILED');
    }
    const record = {
      schema: 'mid-ai-router-claim.v1',
      requestHash: fileName.slice(0,64),
      provider: plan.provider,
      model: plan.model,
      expectedStableSha: plan.expectedStableSha,
      taskFingerprint: plan.taskFingerprint,
      proofCheckedAt: plan.proofCheckedAt
    };
    // A partially written reservation stays claimed. Never delete or retry.
    try {
      await handle.writeFile(JSON.stringify(record) + '\n','utf8');
      await handle.sync();
    } catch {
      blocked('LEDGER_PERSIST_FAILED');
    } finally {
      await handle.close();
    }

    // Flush parent directory entry to stable storage, or fail closed.
    let directoryHandle;
    try {
      directoryHandle = await open(directory,constants.O_RDONLY |
        constants.O_DIRECTORY | constants.O_NOFOLLOW);
      const stat = await directoryHandle.stat();
      if (stat.ino !== rootStat.ino || stat.dev !== rootStat.dev)
        blocked('LEDGER_DIRECTORY_CHANGED');
      await directoryHandle.sync();
    } catch (error) {
      if (error instanceof MidAiRouterBlocked) throw error;
      blocked('LEDGER_DIRECTORY_SYNC_FAILED');
    } finally {
      await directoryHandle?.close();
    }
    return true;
  };
}
