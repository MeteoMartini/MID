#!/usr/bin/env node
/** MID AI Router offline contract/negative tests. No network, no credentials. */
import assert from 'node:assert/strict';
import {generateKeyPairSync, sign} from 'node:crypto';
import {midAiGrantSigningBytes} from './mid-ai-router-approval.mjs';
import {
  planMidAiRoute, buildMidAiRequest, executeMidAiRoute,
  MidAiRouterBlocked, MID_AI_PROVIDER_ENV
} from './mid-ai-router.mjs';

const now = Date.now();
const sha = 'a'.repeat(40);
const snapshot = { stableSha: sha, mainSha: sha, version: '0.9.85.451' };
const task = {
  requestId: 'mid-review-0001', userInitiated: true, expectedStableSha: sha,
  kind: 'independent-review', dataClass: 'public-redacted',
  prompt: 'Audit public, non-secret test data. Do not run code.'
};
const provider = (id, model, priority = 1) => ({
  id, model, enabled: true, accountTier: 'free', hardStopVerified: true,
  paidFallback: false, paidOveragePossible: false, priceInputUsd: 0,
  priceOutputUsd: 0, freePriceProven: true, credentialPresent: true,
  modelAvailabilityVerified: true, privacyApproved: true,
  privacyCheckedAt: new Date(now).toISOString(),
  proofCheckedAt: new Date(now).toISOString(), remainingRequests: 2,
  capabilities: ['independent-review', 'weather-science'], priority
});
const openrouter = provider('openrouter', 'google/gemma-3-27b-it:free', 2);
const groq = provider('groq', 'openai/gpt-oss-20b', 1);
const gemini = provider('gemini', 'gemini-2.5-flash', 3);
const setup = (opts = {}) => ({
  task: opts.task ?? task, snapshot: opts.snapshot ?? snapshot,
  providers: opts.providers ?? [openrouter, groq, gemini], now: opts.now ?? now
});
function rejectRoute(label, opts, expected = 'NO_VERIFIED_ZERO_COST_PROVIDER') {
  assert.throws(() => planMidAiRoute(setup(opts)), (err) =>
    err instanceof MidAiRouterBlocked && err.reason === expected, label);
}
let assertions = 0;
function ok(label, fn) { fn(); assertions++; }

const plan = planMidAiRoute(setup());
ok('least-priority free provider', () => {
  assert.equal(plan.provider, 'groq'); assert.equal(plan.model, groq.model);
  assert.equal(plan.status, 'PLAN_ONLY'); assert.equal(plan.expectedStableSha, sha);
});
ok('existing GitHub direct is preferred', () => {
  const p = planMidAiRoute(setup({ task: { ...task, kind: 'repo-readback' }, providers: [] }));
  assert.equal(p.provider, 'github-native'); assert.equal(p.action, 'existing-connector');
});
ok('never route to Kilo as proxy', () => rejectRoute(
  'kilo is not a direct provider', { providers: [provider('kilo', 'any')] }
));
ok('user-initiated authorization required', () => rejectRoute(
  'not authorized', { task: { ...task, userInitiated: false } }, 'USER_AUTHORIZATION_REQUIRED'
));
ok('requires SHA match', () => rejectRoute(
  'stale', { task: { ...task, expectedStableSha: 'b'.repeat(40) } }, 'SOURCE_DRIFT'
));
ok('requires main equals stable', () => rejectRoute(
  'drift', { snapshot: { ...snapshot, mainSha: 'b'.repeat(40) } }, 'SOURCE_DRIFT'
));
ok('reject private data', () => rejectRoute(
  'private', { task: { ...task, dataClass: 'private' } }, 'DATA_NOT_CLEARED'
));
ok('reject secrets in prompt', () => rejectRoute(
  'secret', { task: { ...task, prompt: 'api_key: supersecretvalue12345' } }, 'SECRET_PATTERN'
));
ok('reject unsupported task and private repo pushes', () => rejectRoute(
  'release', { task: { ...task, kind: 'release-deploy' } }, 'UNSUPPORTED_TASK'
));
ok('reject overlong task', () => rejectRoute(
  'long', { task: { ...task, prompt: 'A'.repeat(12001) } }, 'INVALID_PROMPT'
));
const mutations = [
  ['missing key', { credentialPresent: false }],
  ['unknown key status', { credentialPresent: undefined }],
  ['unknown model availability', { modelAvailabilityVerified: undefined }],
  ['unverified model availability', { modelAvailabilityVerified: false }],
  ['missing privacy approval', { privacyApproved: undefined }],
  ['declined privacy approval', { privacyApproved: false }],
  ['stale privacy proof', { privacyCheckedAt: new Date(now - 7 * 3600000).toISOString() }],
  ['paid tier', { accountTier: 'developer' }],
  ['soft limit', { hardStopVerified: false }],
  ['unknown limit', { hardStopVerified: undefined }],
  ['paid fallback', { paidFallback: true }],
  ['unknown fallback', { paidFallback: undefined }],
  ['possible overage', { paidOveragePossible: true }],
  ['unknown overage', { paidOveragePossible: undefined }],
  ['unverified price', { freePriceProven: false }],
  ['nonzero input price', { priceInputUsd: 0.01 }],
  ['nonzero output price', { priceOutputUsd: 0.001 }],
  ['unknown price', { priceOutputUsd: undefined }],
  ['exhausted quota', { remainingRequests: 0 }],
  ['unknown quota', { remainingRequests: undefined }],
  ['not enabled', { enabled: false }],
  ['stale proof', { proofCheckedAt: '2026-11-08T01:00:00Z' }],
  ['future proof', { proofCheckedAt: new Date(now + 7 * 3600000).toISOString() }],
  ['unapproved paid OpenRouter model', { model: 'openai/gpt-4.1' }],
  ['openrouter auto-model selector not permitted', { model: 'openrouter/free' }]
];
for (const [label, mut] of mutations) {
  ok(label, () => rejectRoute(label, { providers: [{ ...openrouter, ...mut }] }));
}
ok('routing returns no credential', () => {
  const text = JSON.stringify(plan);
  assert.equal(text.includes('API_KEY'), false);
  assert.equal(text.includes('authorization'), false);
});
ok('build authenticates only fixed provider endpoints', () => {
  const p = planMidAiRoute(setup({ providers: [openrouter] }));
  const req = buildMidAiRequest({ plan: p, prompt: task.prompt, credential: 'FAKE_TEST_SECRET' });
  assert.equal(req.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.equal(req.headers.authorization, 'Bearer FAKE_TEST_SECRET');
  assert.equal(JSON.parse(req.body).provider.allow_fallbacks, false);
  assert.equal(JSON.parse(req.body).provider.data_collection, 'deny');
  assert.equal(JSON.parse(req.body).provider.zdr, true);
  assert.deepEqual(JSON.parse(req.body).provider.max_price, {prompt:0,completion:0,request:0});
  assert.equal(JSON.parse(req.body).model, 'google/gemma-3-27b-it:free');
  assert.equal(req.body.includes('FAKE_TEST_SECRET'), false);
});
ok('Groq uses current output token limit', () => {
  const p = planMidAiRoute(setup({ providers: [groq] }));
  const req = buildMidAiRequest({ plan: p, prompt: task.prompt, credential: 'FAKE_TEST_SECRET' });
  assert.equal(JSON.parse(req.body).max_completion_tokens, 512);
  assert.equal(JSON.parse(req.body).max_tokens, undefined);
});
ok('Gemini request is x-goog-api-key only', () => {
  const p = planMidAiRoute(setup({ providers: [gemini] }));
  const req = buildMidAiRequest({ plan: p, prompt: task.prompt, credential: 'FAKE_TEST_SECRET' });
  assert.match(req.url, /generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-/);
  assert.equal(req.headers['x-goog-api-key'], 'FAKE_TEST_SECRET');
  assert.equal(req.headers.authorization, undefined);
  assert.equal(JSON.parse(req.body).generationConfig.maxOutputTokens, 512);
});
ok('only server-side env names are exposed', () => {
  assert.deepEqual(Object.keys(MID_AI_PROVIDER_ENV).sort(), ['gemini', 'groq', 'openrouter']);
  assert.equal(MID_AI_PROVIDER_ENV.groq, 'GROQ_API_KEY');
});
// Test-only ephemeral signer; production must use a separately controlled
// private signing authority. The private key is never stored or logged.
const {privateKey,publicKey} = generateKeyPairSync('ed25519');
process.env.MID_AI_ROUTER_APPROVAL_KEY_ID = 'mid-qa-approval-key';
process.env.MID_AI_ROUTER_APPROVAL_PUBLIC_KEY_PEM =
  publicKey.export({format:'pem',type:'spki'}).toString();
function signedFor(p=plan,changes={},signingKey=privateKey){
  const grant={
    schema:'mid.ai-router.execution-grant.v1',
    audience:'mid-ai-router-direct-free-review-v1',
    keyId:'mid-qa-approval-key',
    requestId:p.requestId,taskKind:p.taskKind,
    taskFingerprint:p.taskFingerprint,proofFingerprint:p.proofFingerprint,
    provider:p.provider,model:p.model,expectedStableSha:p.expectedStableSha,
    version:snapshot.version,dataClass:'public-redacted',maxCostUsd:0,
    issuedAt:new Date(Date.now()-10000).toISOString(),
    expiresAt:new Date(Date.now()+90000).toISOString(),
    ...changes
  };
  return {approvalGrant:grant,
    approvalSignature:sign(null,midAiGrantSigningBytes(grant),signingKey).toString('base64url')};
}
const durableOk = async () => true;
const textResponse = (text, reportedLength = null, chunkSize = 7) => {
  const bytes = new TextEncoder().encode(text);
  return {
    ok: true, status: 200, headers: { get: () => reportedLength },
    body: new ReadableStream({
      start(controller) {
        for (let i = 0; i < bytes.length; i += chunkSize)
          controller.enqueue(bytes.subarray(i, i + chunkSize));
        controller.close();
      }
    })
  };
};
const goodResponse = (body) => textResponse(JSON.stringify(body));
async function rejected(label, args, expected) {
  await assert.rejects(() => executeMidAiRoute(args), (err) =>
    err instanceof MidAiRouterBlocked && err.reason === expected, label);
  assertions++;
}
const args = {
  ...setup(), plan, ...signedFor(plan), credential: 'FAKE_TEST_SECRET',
  liveApproved: true, durableClaim: durableOk,
  fetchImpl: async () => goodResponse({ choices: [{ message: { content: 'Untrusted QA result.' } }] })
};
await rejected('network disabled by default', { ...args, liveApproved: false }, 'LIVE_NOT_APPROVED');
await rejected('durable claim is mandatory', { ...args, durableClaim: undefined }, 'DURABLE_IDEMPOTENCY_REQUIRED');
await rejected('unknown credential', { ...args, credential: '' }, 'MISSING_CREDENTIAL');
await rejected('duplicate', { ...args, durableClaim: async () => false }, 'DUPLICATE_REQUEST');
await rejected('stale free-tier evidence after plan', {
  ...args, plan: {...plan, proofCheckedAt: '2026-11-09T09:30:00Z' }
}, 'PLAN_STALE');
await rejected('stale plan', {
  ...args, plan: { ...plan, model: 'openai/changed' }
}, 'PLAN_STALE');
await rejected('prompt changed after planning', { ...args, task: { ...task, prompt: 'Unapproved different payload' } }, 'PLAN_STALE');

await rejected('missing signed approval', {
  ...args, approvalGrant: undefined
}, 'INVALID_GRANT_SCHEMA');
await rejected('bad signature', {
  ...args, approvalSignature: 'A'.repeat(86)
}, 'GRANT_SIGNATURE_REJECTED');
await rejected('wrong signing key', {
  ...args, ...signedFor(plan,{},generateKeyPairSync('ed25519').privateKey)
}, 'GRANT_SIGNATURE_REJECTED');
await rejected('free cost tampering after signature', {
  ...args, approvalGrant: {...args.approvalGrant,maxCostUsd:1}
}, 'INVALID_GRANT_POLICY');
await rejected('wrong provider in grant', {
  ...args, approvalGrant: {...args.approvalGrant,provider:'gemini'}
}, 'GRANT_BINDING_MISMATCH');
await rejected('wrong proof hash in grant', {
  ...args, approvalGrant: {...args.approvalGrant,proofFingerprint:'f'.repeat(64)}
}, 'GRANT_BINDING_MISMATCH');
await rejected('expired signed approval', {
  ...args, ...signedFor(plan,{
    issuedAt:new Date(now-120000).toISOString(),
    expiresAt:new Date(now-1000).toISOString()
  })
}, 'GRANT_EXPIRED_OR_INVALID_TIME');
await rejected('long validity signed approval', {
  ...args, ...signedFor(plan,{
    issuedAt:new Date(now-20000).toISOString(),
    expiresAt:new Date(now+3600000).toISOString()
  })
}, 'GRANT_EXPIRED_OR_INVALID_TIME');
await rejected('changed provider price after planning', {
  ...args, providers:[{...groq,remainingRequests:1}]
}, 'PLAN_STALE');
await rejected('changed privacy proof after planning', {
  ...args, providers:[{...groq,privacyCheckedAt:new Date(now-60000).toISOString()}]
}, 'PLAN_STALE');
{
  const saved=process.env.MID_AI_ROUTER_APPROVAL_PUBLIC_KEY_PEM;
  delete process.env.MID_AI_ROUTER_APPROVAL_PUBLIC_KEY_PEM;
  try{
    await rejected('unconfigured approval trust anchor',args,'APPROVER_NOT_CONFIGURED');
  }finally{process.env.MID_AI_ROUTER_APPROVAL_PUBLIC_KEY_PEM=saved;}
}
{
  let claims=0,requests=0;
  await rejected('bad grant never reserves a request', {
    ...args,approvalSignature:'A'.repeat(86),
    durableClaim:async()=>{claims++;return true;},
    fetchImpl:async()=>{requests++;return goodResponse({});}
  },'GRANT_SIGNATURE_REJECTED');
  assert.equal(claims,0);assert.equal(requests,0);
}
await rejected('429 no paid retries', { ...args, fetchImpl: async () => ({ ok: false, status: 429 }) },
  'PROVIDER_HTTP_ERROR_429');
await rejected('malformed JSON', {
  ...args, fetchImpl: async () => textResponse('not-json')
}, 'INVALID_PROVIDER_RESPONSE');
await rejected('oversized content length', {
  ...args, fetchImpl: async () => textResponse('{}', '66000')
}, 'RESPONSE_TOO_LARGE');
await rejected('invalid content length', {
  ...args, fetchImpl: async () => textResponse('{}', 'not-a-length')
}, 'INVALID_RESPONSE_LENGTH');
await rejected('unstreamed body blocked', {
  ...args, fetchImpl: async () => ({ok:true,headers:{get:()=>null},text:async()=> '{}'})
}, 'UNSTREAMED_RESPONSE');
await rejected('oversized stream with no content length', {
  ...args, fetchImpl: async () => textResponse('X'.repeat(66000), null, 1024)
}, 'RESPONSE_TOO_LARGE');
await rejected('bad utf8 in stream', {
  ...args, fetchImpl: async () => ({
    ok:true, headers:{get:()=>null},
    body:new ReadableStream({start(controller){
      controller.enqueue(new Uint8Array([0xff,0xfe]));controller.close();
    }})
  })
}, 'INVALID_RESPONSE_STREAM');
const received = [];
const result = await executeMidAiRoute({
  ...args, fetchImpl: async (url, input) => {
    received.push({ url, input }); return goodResponse({
      choices: [{ message: { content: 'Untrusted QA result.' } }],
      usage: { total_tokens: 14 }
    });
  }
});
assert.equal(result.status, 'UNTRUSTED_REVIEW_ONLY');
assert.equal(result.text, 'Untrusted QA result.');
assert.equal(result.usage.total_tokens, 14);
assert.equal(received.length, 1);
assert.equal(received[0].input.redirect, 'error');
assert.equal(received[0].input.method, 'POST');
assert.ok(received[0].input.signal);
assert.ok(!JSON.stringify(result).includes('FAKE_TEST_SECRET'));
assertions++;
const gp = planMidAiRoute(setup({ providers: [gemini] }));
const gr = await executeMidAiRoute({
  ...args, plan: gp, providers: [gemini], ...signedFor(gp),
  fetchImpl: async () => goodResponse({
    candidates: [{ content: { parts: [{ text: 'Review A' }, { text: 'Review B' }] } }]
  })
});
assert.equal(gr.text, 'Review A\nReview B');
assertions++;
console.log('MID AI Router offline tests OK; scenarios=' + assertions + '; no live API used.');
