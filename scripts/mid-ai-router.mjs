#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {verifyMidAiExecutionGrant} from './mid-ai-router-approval.mjs';
/**
 * MID AI Router (non-production QA candidate).
 * Server-side only. No automatic network, GitHub write, release, or paid fallback.
 * Validates zero-extra-cost evidence supplied by a trusted operator before routing.
 * Evidence flags MUST be independently checked against the actual provider account.
 */
const SHA = /^[a-f0-9]{40}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{7,79}$/;
const MAX_PROMPT = 12000;
const FRESH_MS = 6 * 60 * 60 * 1000;
const taskFingerprint = (task) => createHash('sha256').update(JSON.stringify([
  task.requestId, task.kind, task.dataClass, task.expectedStableSha, task.prompt
])).digest('hex');
/* Proof hash never contains the credential. Signed grant binds exact source
 * of trusted billing/privacy/model evidence as passed to the dispatcher.
 * The attesting authority must verify its truth; a hash cannot do that. */
const proofFingerprint = (p) => createHash('sha256').update(JSON.stringify([
  p.id,p.model,p.enabled,p.accountTier,p.hardStopVerified,p.paidFallback,
  p.paidOveragePossible,p.priceInputUsd,p.priceOutputUsd,p.freePriceProven,
  p.credentialPresent,p.modelAvailabilityVerified,p.privacyApproved,
  p.privacyCheckedAt,p.proofCheckedAt,p.remainingRequests,
  p.foundationPublisher ?? null,p.lineageVerified ?? null,
  p.lineageCheckedAt ?? null,p.lineageEvidenceSha256 ?? null,
  [...p.capabilities].sort()
])).digest('hex');
const PROVIDERS = Object.freeze({
  openrouter: Object.freeze({
    key: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: (id) => /^[a-z0-9][a-z0-9./_-]{1,120}:free$/.test(id)
  }),
  groq: Object.freeze({
    key: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: (id) => /^[a-z0-9][a-z0-9./_-]{1,120}$/.test(id)
  }),
  gemini: Object.freeze({
    key: 'GEMINI_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/',
    model: (id) => /^gemini-[a-z0-9.-]{3,100}$/.test(id)
  })
});
const TASKS = new Set(['independent-review', 'external-research', 'weather-science', 'bounded-code-review']);
export class MidAiRouterBlocked extends Error {
  constructor(reason) {
    super('MID AI Router blocked: ' + reason);
    this.name = 'MidAiRouterBlocked';
    this.reason = reason;
  }
}
const block = (reason) => { throw new MidAiRouterBlocked(reason); };
const fresh = (iso, now) => {
  const then = Date.parse(iso);
  return Number.isFinite(then) && then <= now && now - then <= FRESH_MS;
};
function validateTask(task, snapshot) {
  if (!task || task.userInitiated !== true) block('USER_AUTHORIZATION_REQUIRED');
  if (!ID.test(task.requestId || '')) block('INVALID_REQUEST_ID');
  if (!SHA.test(task.expectedStableSha || '')) block('INVALID_EXPECTED_SHA');
  if (!snapshot || !SHA.test(snapshot.mainSha || '') || !SHA.test(snapshot.stableSha || '') ||
      snapshot.mainSha !== snapshot.stableSha || snapshot.stableSha !== task.expectedStableSha)
    block('SOURCE_DRIFT');
  if (typeof snapshot.version !== 'string' || !/^0\.\d+\.\d+\.\d+$/.test(snapshot.version))
    block('UNVERIFIED_VERSION');
  if (task.kind === 'repo-readback') return;
  if (!TASKS.has(task.kind)) block('UNSUPPORTED_TASK');
  if (task.dataClass !== 'public-redacted') block('DATA_NOT_CLEARED');
  if (typeof task.prompt !== 'string' || !task.prompt.trim() || task.prompt.length > MAX_PROMPT)
    block('INVALID_PROMPT');
  // Defense in depth only: dataClass still must be independently approved.
  if (/(?:api[_-]?key|bearer|password|secret|private[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9_./+-]{12,}/i.test(task.prompt))
    block('SECRET_PATTERN');
}
function freeProofOk(p, now) {
  if (!p || p.enabled !== true || p.accountTier !== 'free' ||
      p.hardStopVerified !== true || p.paidFallback !== false ||
      p.paidOveragePossible !== false || p.priceInputUsd !== 0 ||
      p.priceOutputUsd !== 0 || p.freePriceProven !== true ||
      p.credentialPresent !== true || p.modelAvailabilityVerified !== true ||
      p.privacyApproved !== true || !fresh(p.privacyCheckedAt, now) ||
      !Number.isInteger(p.remainingRequests) ||
      p.remainingRequests < 1 || !fresh(p.proofCheckedAt, now))
    return false;
  const def = PROVIDERS[p.id];
  return !!def && typeof p.model === 'string' && def.model(p.model) &&
    Array.isArray(p.capabilities) && p.capabilities.length > 0;
}
/**
 * Read-only deterministic routing. A 'free' label or an API key is NOT a spend cap.
 * Fails closed instead of silently selecting Kilo or a paid model.
 */
export function planMidAiRoute({ task, snapshot, providers = [], now = Date.now() }) {
  validateTask(task, snapshot);
  if (task.kind === 'repo-readback') {
    return Object.freeze({
      status: 'PLAN_ONLY', provider: 'github-native', action: 'existing-connector',
      expectedStableSha: snapshot.stableSha, requestId: task.requestId
    });
  }
  if (!Array.isArray(providers)) block('INVALID_PROVIDER_REGISTRY');
  const suitable = providers.filter((p) => freeProofOk(p, now) &&
    p.capabilities.includes(task.kind));
  suitable.sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100) ||
    a.id.localeCompare(b.id));
  if (!suitable.length) block('NO_VERIFIED_ZERO_COST_PROVIDER');
  const p = suitable[0];
  return Object.freeze({
    status: 'PLAN_ONLY', provider: p.id, model: p.model,
    requestId: task.requestId, taskKind: task.kind, expectedStableSha: snapshot.stableSha,
    taskFingerprint: taskFingerprint(task), proofFingerprint: proofFingerprint(p),
    proofCheckedAt: p.proofCheckedAt
  });
}
/** Build an endpoint-bound request without exposing credentials in logs. */
export function buildMidAiRequest({ plan, prompt, credential }) {
  if (!plan || plan.status !== 'PLAN_ONLY' || !PROVIDERS[plan.provider])
    block('UNSUPPORTED_EXECUTION_PLAN');
  if (typeof credential !== 'string' || !credential.trim())
    block('MISSING_CREDENTIAL');
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT)
    block('INVALID_PROMPT');
  const def = PROVIDERS[plan.provider];
  if (!def.model(plan.model)) block('MODEL_NOT_ALLOWED');
  if (plan.provider === 'gemini') {
    return {
      url: def.endpoint + encodeURIComponent(plan.model) + ':generateContent',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': credential },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 512 }
      })
    };
  }
  const headers = { 'content-type': 'application/json', authorization: 'Bearer ' + credential };
  const payload = {
    model: plan.model, messages: [{ role: 'user', content: prompt }],
    stream: false
  };
  if (plan.provider === 'openrouter') {
    payload.max_tokens = 512;
    payload.provider = {
      allow_fallbacks: false, data_collection: 'deny', zdr: true,
      max_price: { prompt: 0, completion: 0, request: 0 }
    };
  } else payload.max_completion_tokens = 512;
  return { url: def.endpoint, headers, body: JSON.stringify(payload) };
}
/**
 * This is NOT a production dispatcher. Requires explicit per-call live approval and
 * a durable exactly-once claim from the external trusted runner.
 */
export async function executeMidAiRoute({
  plan, task, snapshot, providers, credential, fetchImpl, liveApproved = false,
  durableClaim, approvalGrant, approvalSignature, trustedSourceReadback
}) {
  // Dispatch checks real server time, not a caller-supplied historical timestamp.
  const now = Date.now();
  if (liveApproved !== true) block('LIVE_NOT_APPROVED');
  if (typeof durableClaim !== 'function') block('DURABLE_IDEMPOTENCY_REQUIRED');
  // A trusted server runner MUST perform a fresh, independent GitHub readback.
  // Do not accept a caller-supplied snapshot as evidence that stable is current.
  // The runner is responsible for making this callback authoritative; the
  // callback alone is not a cryptographic attestation of GitHub API origin.
  if (typeof trustedSourceReadback !== 'function') block('SOURCE_READBACK_REQUIRED');
  let current;
  try { current = await trustedSourceReadback(); }
  catch { block('SOURCE_READBACK_UNAVAILABLE'); }
  const readbackNow = Date.now(); // clock sampled AFTER the awaited GitHub read
  const checked = Date.parse(current?.checkedAt);
  if (!Number.isFinite(checked) || checked > readbackNow || readbackNow-checked > 30000)
    block('SOURCE_READBACK_STALE');
  if (!SHA.test(current?.mainSha || '') || !SHA.test(current?.stableSha || '') ||
      current.mainSha !== current.stableSha ||
      current.mainSha !== snapshot?.mainSha ||
      current.stableSha !== snapshot?.stableSha ||
      current.stableSha !== task?.expectedStableSha ||
      current.version !== snapshot?.version)
    block('SOURCE_DRIFT');
  const renewed = planMidAiRoute({ task, snapshot, providers, now });
  if (renewed.provider === 'github-native') block('GITHUB_NATIVE_IS_NOT_HTTP');
  if (!plan || plan.provider !== renewed.provider || plan.model !== renewed.model ||
      plan.requestId !== renewed.requestId ||
      plan.taskFingerprint !== renewed.taskFingerprint ||
      plan.proofFingerprint !== renewed.proofFingerprint ||
      plan.proofCheckedAt !== renewed.proofCheckedAt ||
      plan.expectedStableSha !== renewed.expectedStableSha)
    block('PLAN_STALE');
  if (typeof fetchImpl !== 'function') block('TRANSPORT_NOT_AVAILABLE');
  // Non-forgeable approval by a separately controlled private signing key.
  // Cannot be replaced by liveApproved or self-reported account flags.
  verifyMidAiExecutionGrant({grant: approvalGrant, signature: approvalSignature,
    plan: renewed, task, snapshot, now});
  // Reject missing credentials before burning the one-shot durable claim.
  const req = buildMidAiRequest({ plan: renewed, prompt: task.prompt, credential });
  if (!await durableClaim(task.requestId, plan.provider, plan.model))
    block('DUPLICATE_REQUEST');
  const response = await fetchImpl(req.url, {
    method: 'POST', headers: req.headers, body: req.body,
    signal: AbortSignal.timeout(15000), redirect: 'error'
  });
  if (!response || response.ok !== true)
    block('PROVIDER_HTTP_ERROR_' + (Number.isInteger(response?.status) ? response.status : 'UNKNOWN'));
  // Streaming cap: response.text() would allocate the entire untrusted body
  // before checking length, and Content-Length can be missing or forged.
  const headerLength = response.headers?.get?.('content-length');
  if (headerLength != null && headerLength !== '') {
    const declared = Number(headerLength);
    if (!Number.isSafeInteger(declared) || declared < 0) block('INVALID_RESPONSE_LENGTH');
    if (declared > 65536) block('RESPONSE_TOO_LARGE');
  }
  if (!response.body || typeof response.body.getReader !== 'function')
    block('UNSTREAMED_RESPONSE');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let totalBytes = 0, raw = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      if (!(chunk.value instanceof Uint8Array)) block('INVALID_RESPONSE_CHUNK');
      totalBytes += chunk.value.byteLength;
      if (totalBytes > 65536) block('RESPONSE_TOO_LARGE');
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
  } catch (error) {
    try { await reader.cancel(); } catch { /* transport already closed */ }
    if (error instanceof MidAiRouterBlocked) throw error;
    block('INVALID_RESPONSE_STREAM');
  } finally {
    reader.releaseLock();
  }
  let data;
  try { data = JSON.parse(raw); } catch { block('INVALID_PROVIDER_RESPONSE'); }
  // Validate the actual model returned by the upstream API. A requested
  // model name is not evidence that an intermediary really served it.
  // OpenRouter and Groq return `model`; Gemini returns `modelVersion`.
  const reportedModel = plan.provider === 'gemini' ? data?.modelVersion : data?.model;
  const normalizedModel = plan.provider === 'gemini' &&
    typeof reportedModel === 'string' && reportedModel.startsWith('models/') ?
    reportedModel.slice('models/'.length) : reportedModel;
  if (typeof normalizedModel !== 'string' || normalizedModel !== plan.model)
    block('RESPONSE_MODEL_MISMATCH');
  const answer = plan.provider === 'gemini' ?
    data?.candidates?.[0]?.content?.parts?.filter((x) => typeof x.text === 'string').map((x) => x.text).join('\n') :
    data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) block('EMPTY_PROVIDER_RESPONSE');
  return Object.freeze({
    status: 'UNTRUSTED_REVIEW_ONLY', requestId: task.requestId, provider: plan.provider,
    model: plan.model, providerReportedModel: reportedModel,
    expectedStableSha: snapshot.stableSha,
    text: answer.slice(0, 16000), usage: data?.usage ?? data?.usageMetadata ?? null,
    usageStatus: data?.usage || data?.usageMetadata ? 'UPSTREAM_REPORTED_UNVERIFIED' : 'NOT_VERIFIED',
    costStatus: 'NOT_VERIFIED'
  });
}
export const MID_AI_PROVIDER_ENV = Object.freeze(
  Object.fromEntries(Object.entries(PROVIDERS).map(([id, def]) => [id, def.key]))
);
