/**
 * MID AI Router – actual SQLite Durable Object atomic admission primitive.
 *
 * Runtime-neutral SQL storage contract: Cloudflare SQLite Durable Objects
 * expose .sql.exec(sql,...binds).toArray() and .transactionSync(callback).
 * A trusted server MUST construct with an independent validator verifying
 * the user's signed one-shot grant, account/price/privacy, source SHA and
 * exact model before calling reserve(). This module does NOT implement OAuth,
 * fetch, provider billing authentication, signing or external dispatch.
 * It is a QA-only candidate, never safe as an anonymous/public endpoint.
 */
const REQ=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const SHA40=/^[a-f0-9]{40}$/;
const DIGEST=/^[a-f0-9]{64}$/;
const PROVIDER=new Set(['groq','openrouter','gemini']);
const error=(reason)=>{const e=new Error('MID global admission blocked: '+reason);
 e.name='MidAiGlobalAdmissionBlocked';e.reason=reason;throw e;};
const sqlRows=(storage,query,...params)=>storage.sql.exec(query,...params).toArray();
export function createMidAiGlobalAdmission({
 storage,verifyIndependentGrant,now=()=>Date.now()
}={}){
 if(!storage?.sql?.exec || typeof storage.transactionSync!=='function' ||
    typeof verifyIndependentGrant!=='function' || typeof now!=='function')
   error('PROTECTED_SQLITE_AND_INDEPENDENT_VERIFIER_REQUIRED');
 // DDL must be durable; failure is fatal. No in-memory fallback.
 try{
   storage.sql.exec(`CREATE TABLE IF NOT EXISTS mid_ai_claims (
    request_id TEXT PRIMARY KEY, grant_digest TEXT NOT NULL,
    task_digest TEXT NOT NULL, model_id TEXT NOT NULL,
    provider TEXT NOT NULL, stable_sha TEXT NOT NULL,
    quota_subject TEXT NOT NULL, utc_day TEXT NOT NULL,
    claimed_at_ms INTEGER NOT NULL
   )`);
   storage.sql.exec(`CREATE TABLE IF NOT EXISTS mid_ai_daily_quota (
    quota_subject TEXT NOT NULL, utc_day TEXT NOT NULL,
    consumed INTEGER NOT NULL, PRIMARY KEY(quota_subject,utc_day)
   )`);
 }catch{error('SQLITE_SCHEMA_UNAVAILABLE');}
 return Object.freeze({
  async reserve(request){
   if(!REQ.test(request?.requestId||'') ||
      !SHA40.test(request?.expectedStableSha||'') ||
      !DIGEST.test(request?.taskDigest||''))
     error('INVALID_BOUND_REQUEST');
   let proof;
   try{proof=await verifyIndependentGrant(request);}
   catch{error('GRANT_VERIFICATION_UNAVAILABLE');}
   // No client-supplied boolean, price, model or quota ever constitutes proof.
   // The trusted validator must bind all fields and attest their origin.
   if(proof?.verified!==true || proof?.userAuthorized!==true ||
      proof?.sourceAligned!==true || proof?.freePlanVerified!==true ||
      proof?.modelAvailable!==true || proof?.zeroPriceVerified!==true ||
      proof?.hardStopVerified!==true || proof?.noPaidFallbackVerified!==true ||
      proof?.privacyApproved!==true || proof?.globalSubjectVerified!==true ||
      proof?.requestId!==request.requestId ||
      proof?.expectedStableSha!==request.expectedStableSha ||
      proof?.taskDigest!==request.taskDigest ||
      !DIGEST.test(proof?.grantDigest||'') ||
      !PROVIDER.has(proof?.provider) ||
      typeof proof?.model!=='string'||proof.model.length<4||
      proof.model.length>130 || !/^[a-zA-Z0-9/_.:-]+$/.test(proof.model) ||
      typeof proof?.quotaSubject!=='string' ||
      !/^[a-f0-9]{64}$/.test(proof.quotaSubject) ||
      !Number.isSafeInteger(proof?.maxDailyRequests) ||
      proof.maxDailyRequests<1 || proof.maxDailyRequests>1000)
     error('INDEPENDENT_ZERO_CASH_APPROVAL_MISSING');
   const stamp=now();
   if(!Number.isSafeInteger(stamp) || stamp<0)error('TRUSTED_CLOCK_INVALID');
   if(!Number.isSafeInteger(proof.expiresAtMs) ||
      proof.expiresAtMs<=stamp || proof.expiresAtMs-stamp>5*60*1000)
     error('SHORT_LIVED_GRANT_REQUIRED');
   const utcDay=new Date(stamp).toISOString().slice(0,10);
   try{
     return storage.transactionSync(()=>{
       const existing=sqlRows(storage,
         'SELECT request_id FROM mid_ai_claims WHERE request_id=?',
         request.requestId);
       if(existing.length)error('DUPLICATE_REQUEST_NO_RETRY');
       const rows=sqlRows(storage,
         'SELECT consumed FROM mid_ai_daily_quota WHERE quota_subject=? AND utc_day=?',
         proof.quotaSubject,utcDay);
       const used=rows.length?rows[0].consumed:0;
       if(!Number.isSafeInteger(used)||used<0)error('QUOTA_INTEGRITY_ERROR');
       if(used>=proof.maxDailyRequests)error('VERIFIED_FREE_QUOTA_EXHAUSTED');
       storage.sql.exec(`INSERT INTO mid_ai_claims
        (request_id,grant_digest,task_digest,model_id,provider,stable_sha,
         quota_subject,utc_day,claimed_at_ms) VALUES (?,?,?,?,?,?,?,?,?)`,
        request.requestId,proof.grantDigest,proof.taskDigest,
        proof.model,proof.provider,request.expectedStableSha,
        proof.quotaSubject,utcDay,stamp);
       storage.sql.exec(`INSERT INTO mid_ai_daily_quota
        (quota_subject,utc_day,consumed) VALUES (?,?,1)
        ON CONFLICT(quota_subject,utc_day)
        DO UPDATE SET consumed=consumed+1`,proof.quotaSubject,utcDay);
       // No prompt/key/response stored. Claim remains spent on any timeout.
       return Object.freeze({status:'RESERVED_NO_DISPATCH',
         requestId:request.requestId,stableSha:request.expectedStableSha,
         quotaDay:utcDay,remainingRequests:proof.maxDailyRequests-used-1,
         dispatchAuthorized:false,costStatus:'NOT_VERIFIED_POST_CALL'});
     });
   }catch(e){
     if(e?.name==='MidAiGlobalAdmissionBlocked')throw e;
     error('ATOMIC_DURABLE_RESERVATION_FAILED');
   }
  }
 });
}
