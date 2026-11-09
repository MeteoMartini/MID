#!/usr/bin/env node
import { createHash } from 'node:crypto';
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
    taskFingerprint: taskFingerprint(task), proofCheckedAt: p.proofCheckedAt
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
  durableClaim, now = Date.now()
}) {
  if (liveApproved !== true) block('LIVE_NOT_APPROVED');
  if (typeof durableClaim !== 'function') block('DURABLE_IDEMPOTENCY_REQUIRED');
  const renewed = planMidAiRoute({ task, snapshot, providers, now });
  if (renewed.provider === 'github-native') block('GITHUB_NATIVE_IS_NOT_HTTP');
  if (!plan || plan.provider !== renewed.provider || plan.model !== renewed.model ||
      plan.requestId !== renewed.requestId ||
      plan.taskFingerprint !== renewed.taskFingerprint ||
      plan.proofCheckedAt !== renewed.proofCheckedAt ||
      plan.expectedStableSha !== renewed.expectedStableSha)
    block('PLAN_STALE');
  if (typeof fetchImpl !== 'function') block('TRANSPORT_NOT_AVAILABLE');
  if (!await durableClaim(task.requestId, plan.provider, plan.model))
    block('DUPLICATE_REQUEST');
  const req = buildMidAiRequest({ plan: renewed, prompt: task.prompt, credential });
  const response = await fetchImpl(req.url, {
    method: 'POST', headers: req.headers, body: req.body,
    signal: AbortSignal.timeout(15000), redirect: 'error'
  });
  if (!response || response.ok !== true)
    block('PROVIDER_HTTP_ERROR_' + (Number.isInteger(response?.status) ? response.status : 'UNKNOWN'));
  const bytes = Number(response.headers?.get?.('content-length'));
  if (Number.isFinite(bytes) && bytes > 65536) block('RESPONSE_TOO_LARGE');
  const raw = await response.text();
  if (raw.length > 65536) block('RESPONSE_TOO_LARGE');
  let data;
  try { data = JSON.parse(raw); } catch { block('INVALID_PROVIDER_RESPONSE'); }
  const answer = plan.provider === 'gemini' ?
    data?.candidates?.[0]?.content?.parts?.filter((x) => typeof x.text === 'string').map((x) => x.text).join('\n') :
    data?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) block('EMPTY_PROVIDER_RESPONSE');
  return Object.freeze({
    status: 'UNTRUSTED_REVIEW_ONLY', requestId: task.requestId, provider: plan.provider,
    model: plan.model, expectedStableSha: snapshot.stableSha,
    text: answer.slice(0, 16000), usage: data?.usage ?? data?.usageMetadata ?? null
  });
}
export const MID_AI_PROVIDER_ENV = Object.freeze(
  Object.fromEntries(Object.entries(PROVIDERS).map(([id, def]) => [id, def.key]))
);
