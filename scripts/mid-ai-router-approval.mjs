/**
 * MID AI Router: offline QA candidate, signed per-dispatch authorization.
 *
 * A separately trusted approver signs the exact request, free-tier policy,
 * source SHA and proof fingerprint. Only the public Ed25519 verification key
 * is exposed to the executor by its trusted operator's protected environment.
 *
 * NEVER place the signing private key in MID/GitHub issues, GitHub Secrets
 * readable by untrusted PRs, provider prompts, logs, or the frontend.
 */
import {createPublicKey,verify} from 'node:crypto';
import {MidAiRouterBlocked} from './mid-ai-router.mjs';

const deny = reason => {throw new MidAiRouterBlocked(reason);};
const S40=/^[a-f0-9]{40}$/;
const S64=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const KID=/^[a-z0-9][a-z0-9._-]{3,63}$/;
const MODELS=new Set(['openrouter','groq','gemini']);
const GRANT_FIELDS=Object.freeze([
  'schema','audience','keyId','requestId','taskKind','taskFingerprint',
  'proofFingerprint','provider','model','expectedStableSha','version',
  'dataClass','maxCostUsd','issuedAt','expiresAt'
]);
const FRESH_WINDOW_MS=5*60*1000;
const plain = x => x!==null && typeof x==='object' && !Array.isArray(x) &&
  Object.getPrototypeOf(x)===Object.prototype;

/** Stable, fixed-field wire serialization; no variable JSON object order. */
export function midAiGrantSigningBytes(grant){
  if(!plain(grant) ||
      Object.keys(grant).length!==GRANT_FIELDS.length ||
      !GRANT_FIELDS.every(k=>Object.hasOwn(grant,k)))
    deny('INVALID_GRANT_SCHEMA');
  if(grant.schema!=='mid.ai-router.execution-grant.v1' ||
     grant.audience!=='mid-ai-router-direct-free-review-v1' ||
     !KID.test(grant.keyId) ||
     !ID.test(grant.requestId) ||
     !['independent-review','external-research','weather-science','bounded-code-review'].includes(grant.taskKind) ||
     !S64.test(grant.taskFingerprint) || !S64.test(grant.proofFingerprint) ||
     !MODELS.has(grant.provider) ||
     typeof grant.model!=='string' || grant.model.length<2 || grant.model.length>128 ||
     !S40.test(grant.expectedStableSha) ||
     !/^0\.\d+\.\d+\.\d+$/.test(grant.version) ||
     grant.dataClass!=='public-redacted' ||
     !Object.is(grant.maxCostUsd,0) ||
     typeof grant.issuedAt!=='string' || typeof grant.expiresAt!=='string')
    deny('INVALID_GRANT_POLICY');
  return Buffer.from('MID-AI-ROUTER-GRANT-V1\0'+JSON.stringify(
    GRANT_FIELDS.map(k=>grant[k])),'utf8');
}
/**
 * SECURITY BOUNDARY: only protected server environment may provision the key.
 * No caller-supplied verification key, no test-only bypass, no fallback key.
 */
export function verifyMidAiExecutionGrant({grant,signature,plan,task,snapshot,now=Date.now()}){
  if(!plan || !task || !snapshot || !Number.isSafeInteger(now))
    deny('INVALID_GRANT_CONTEXT');
  const keyId=process.env.MID_AI_ROUTER_APPROVAL_KEY_ID;
  const pub=process.env.MID_AI_ROUTER_APPROVAL_PUBLIC_KEY_PEM;
  if(!KID.test(keyId||'') || typeof pub!=='string' || !pub.includes('BEGIN PUBLIC KEY') ||
      pub.length>4096)
    deny('APPROVER_NOT_CONFIGURED');
  const bytes=midAiGrantSigningBytes(grant);
  if(grant.keyId!==keyId) deny('GRANT_KEY_ID_MISMATCH');
  if(grant.requestId!==plan.requestId ||
      grant.requestId!==task.requestId ||
      grant.taskKind!==task.kind ||
      grant.taskFingerprint!==plan.taskFingerprint ||
      grant.proofFingerprint!==plan.proofFingerprint ||
      grant.provider!==plan.provider || grant.model!==plan.model ||
      grant.expectedStableSha!==snapshot.stableSha ||
      grant.expectedStableSha!==plan.expectedStableSha ||
      grant.version!==snapshot.version ||
      grant.dataClass!==task.dataClass)
    deny('GRANT_BINDING_MISMATCH');
  const issued=Date.parse(grant.issuedAt),expires=Date.parse(grant.expiresAt);
  if(!Number.isFinite(issued) || !Number.isFinite(expires) ||
      new Date(issued).toISOString()!==grant.issuedAt ||
      new Date(expires).toISOString()!==grant.expiresAt ||
      issued>now || expires<=now || expires<=issued ||
      expires-issued>FRESH_WINDOW_MS || now-issued>FRESH_WINDOW_MS)
    deny('GRANT_EXPIRED_OR_INVALID_TIME');
  if(typeof signature!=='string' || !/^[A-Za-z0-9_-]{86}$/.test(signature))
    deny('INVALID_GRANT_SIGNATURE');
  const sig=Buffer.from(signature,'base64url');
  if(sig.length!==64 || sig.toString('base64url')!==signature)
    deny('INVALID_GRANT_SIGNATURE');
  let key;
  try{key=createPublicKey(pub);}catch{deny('INVALID_APPROVER_PUBLIC_KEY');}
  if(key.asymmetricKeyType!=='ed25519')deny('INVALID_APPROVER_KEY_TYPE');
  let valid=false;
  try{valid=verify(null,bytes,key,sig);}catch{deny('GRANT_VERIFY_ERROR');}
  if(!valid)deny('GRANT_SIGNATURE_REJECTED');
  return true;
}
