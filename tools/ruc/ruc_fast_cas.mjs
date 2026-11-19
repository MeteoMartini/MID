/* Read-only-qualified RUC Fast pointer CAS primitive for R2 Workers API.
 * No endpoint, credential, producer or deployment is authorized by this module.
 * All upstream SHA/byte, consumer and GitHub source gates must be supplied by a
 * trusted privileged caller, never by an unauthenticated request body.
 */
export const FAST_POINTER_SCHEMA = 'mid.ruc.fast-fenced-pointer.v1';
const KEY = 'ruc/fast/authorized.json';
const SHA = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const RUN = /^20\d\d-\d\d-\d\dT\d\d:00$/;
function assert(cond, message) { if (!cond) throw new Error(message); }
export function validRun(value) {
  assert(typeof value === 'string' && RUN.test(value), 'noncanonical UTC model run');
  const d = new Date(value + 'Z');
  assert(Number.isFinite(d.getTime()) && d.toISOString().slice(0,16) === value, 'invalid UTC model run');
  return d.getTime();
}
export function validatePointer(row) {
  assert(row && typeof row === 'object' && !Array.isArray(row) && row.schema === FAST_POINTER_SCHEMA, 'untrusted fast pointer schema');
  assert(Number.isSafeInteger(row.generation) && row.generation >= 1, 'invalid fencing generation');
  assert(COMMIT.test(row.stableSha), 'untrusted stable source identity');
  assert(SHA.test(row.siteSha256) && SHA.test(row.primaryManifestSha256) && SHA.test(row.fastManifestSha256), 'missing immutable site/source digest');
  const full = validRun(row.primaryRun), fast = validRun(row.fastRun);
  assert(fast >= full && fast - full <= 6*3600000, 'fast run must not downgrade the primary source or exceed 6h');
  assert(row.horizonHours === 6 && row.epsAvailable === false, 'Fast deterministic source cannot claim EPS');
  assert(row.mode === 'shadow' || row.mode === 'active', 'invalid pointer mode');
  assert(row.rootPrimaryNeverChanged === true && row.fullEps20Readmission === true, 'original 27h/EPS20 must be intact');
  return row;
}
export function makeNextPointer(previous, row) {
  if (previous !== null) validatePointer(previous);
  const next = {...row, schema:FAST_POINTER_SCHEMA, generation:(previous?.generation ?? 0)+1};
  validatePointer(next);
  if (previous) {
    assert(previous.stableSha === next.stableSha, 'stable changed: reacquire full source admission');
    assert(validRun(next.fastRun) >= validRun(previous.fastRun), 'stale Fast publication attempt');
    assert(validRun(next.primaryRun) >= validRun(previous.primaryRun), 'primary RUC downgrade forbidden');
    if (next.mode === 'active') {
      // A new candidate must first be published as an independently admitted
      // shadow; activation may only flip its mode. A conditional R2 put alone
      // cannot prove that the new site's original bytes were staged/read back.
      // When an existing active source advances, fall back to full RUC while
      // staging the next shadow, then activate that *exact* immutable site.
      for (const key of [
        'stableSha', 'siteSha256', 'primaryManifestSha256', 'fastManifestSha256',
        'primaryRun', 'fastRun', 'horizonHours', 'epsAvailable',
        'rootPrimaryNeverChanged', 'fullEps20Readmission'
      ]) {
        assert(previous[key] === next[key],
          'Fast activation requires identical admitted shadow candidate: '+key);
      }
    }
  }
  return next;
}
function serialize(value) { return JSON.stringify(value, Object.keys(value).sort()) + '\n'; }
async function readCurrent(bucket, key=KEY) {
  assert(bucket && typeof bucket.get === 'function' && typeof bucket.put === 'function', 'R2 bucket with conditional put required');
  const object=await bucket.get(key);
  if(object === null) return {pointer:null,etag:null};
  assert(typeof object.etag==='string' && object.etag.length>0, 'missing authoritative R2 etag');
  const row=JSON.parse(await object.text());
  validatePointer(row);
  return {pointer:row,etag:object.etag};
}
/* CAS is atomic only for this R2 key, per R2 conditional-write contract.
 * It is NOT a universal GitHub-Pages+R2 transaction. Caller must separately
 * ensure all Pages writers share the canonical mid-pages lease.
 */
export async function casFastPointer(bucket, row, {key=KEY, verifyGrant}={}) {
  assert(key===KEY, 'canonical pointer key only');
  assert(typeof verifyGrant==='function', 'trusted release authorization callback mandatory');
  const before=await readCurrent(bucket,key);
  const next=makeNextPointer(before.pointer,row);
  // An initial active pointer has no authenticated previous generation to
  // restore after a Pages or Worker readback failure. First initialize the
  // fenced pointer in shadow mode, then activate in a separate authorized CAS.
  assert(before.pointer !== null || next.mode === 'shadow',
    'first Fast pointer must be shadow; active publication has no rollback target');
  assert(await verifyGrant(Object.freeze({...next})) === true, 'no authenticated release/consumer source grant');
  const conditional=before.etag?{etagMatches:before.etag}:{etagDoesNotMatch:'*'};
  const result=await bucket.put(key,serialize(next),{
    onlyIf:conditional,
    httpMetadata:{contentType:'application/json',cacheControl:'no-store'},
  });
  if(result===null)return {committed:false,reason:'lost-atomic-CAS',previous:before.pointer};
  const after=await readCurrent(bucket,key);
  assert(after.etag===result.etag && serialize(after.pointer)===serialize(next),'post-CAS readback drift; do not signal success');
  return {committed:true,etag:after.etag,current:next,previous:before.pointer};
}
/* Compensating rollback is a NEW generation and succeeds only if this writer's
 * exact committed ETag still owns the pointer. A newer writer wins instead.
 * Rollback never edits /ruc/latest.json or original EPS20 objects.
 */
export async function casRollbackFastPointer(bucket, committed, {key=KEY, verifyGrant}={}) {
  assert(key===KEY && committed?.committed===true && committed.etag, 'verified own commit required');
  assert(typeof verifyGrant==='function', 'trusted rollback authorization mandatory');
  const before=await readCurrent(bucket,key);
  if(before.etag!==committed.etag || serialize(before.pointer)!==serialize(committed.current))
    return {rolledBack:false,reason:'newer-writer-or-pointer-drift'};
  assert(committed.previous!==null, 'first activation has no safe older pointer; do not invent rollback');
  const next={...committed.previous,generation:committed.current.generation+1};
  validatePointer(next);
  assert(await verifyGrant(Object.freeze({...next}))===true,'unverified rollback authorization');
  const result=await bucket.put(key,serialize(next),{onlyIf:{etagMatches:committed.etag},httpMetadata:{contentType:'application/json',cacheControl:'no-store'}});
  if(result===null)return {rolledBack:false,reason:'lost-atomic-rollback-CAS'};
  const after=await readCurrent(bucket,key);
  assert(after.etag===result.etag && serialize(after.pointer)===serialize(next),'rollback readback drift');
  return {rolledBack:true,etag:after.etag,pointer:next};
}
