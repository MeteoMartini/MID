# MID AI Router — zero-extra-cost direct-provider QA core (Issue #725)

**Status:** QA candidate only, **not activated, not deployed, not a new MID build**.
Started from verified MID stable v0.9.85.451, full commit
`d8852f672a40d26348d214dc85e9a3a1b9d79c1f`.
This document supplements (never supersedes) `AGENTS.md`,
`MID_COST_GOVERNANCE_CONTRACT.md`,
`MID_CHATGPT_GITHUB_CONTRACT.md` and
`docs/implementation/MID_AGENT_PLUGIN_ROUTING_2026_11_07.md`.

## Scope and purpose

The independent router is **not** a MID weather-data endpoint, new user interface,
general-purpose remote shell, or deployment actor. Existing features, RUC,
weather warnings, version mirrors, release pipelines, and Cloudflare Worker
production configuration are deliberately unchanged.

The user requested that ChatGPT coordinate tasks and use a **MID AI Router**
rather than funnel all providers through Kilo. Available execution lanes:

- `github-native`: existing connected GitHub readback — preferred for repository facts.
- `openrouter`: direct, **explicit** model ID ending in `:free`.
- `groq`: direct Free-account API (not any paid developer tier).
- `gemini`: direct Free API-project model, only approved public/redacted inputs.
- Copilot Pro and the already linked Kilo GitHub bot: **existing** bounded
  GitHub-issue/Draft/read-only bridge, not hidden API proxies.
- Work and Codex: ChatGPT-internal, separately quota-limited capacities
  with user-selected modes, **not** callable as arbitrary third-party APIs.
- Replit, Context7, Firecrawl, PostHog, Product Design, Figma, PR Completion:
  task-specific connected tools per existing rules.
- Cubic: optional external GitHub App reviewer, no provider key.
- Vercel AI Gateway, Cloudflare Workers AI: **disabled** pending verified
  free-account billing, hard-stop and privacy scope, not used as paid fallback.

## Actual implementation

`scripts/mid-ai-router.mjs` exports:
- `planMidAiRoute`: pure, deterministic, **network-free** provider choice.
- `buildMidAiRequest`: direct Groq/OpenRouter/Gemini REST payloads
  to fixed HTTPS endpoints. No Kilo forwarding and no user-provided URL.
- `executeMidAiRoute`: **nonproduction** reference request function.
  Live use is blocked unless caller explicitly supplies `liveApproved:true`,
  independent account/price/credit proof, a durable exactly-once claim,
  a server-side credential and trusted transport. No background dispatch
  or retry. Revalidates snapshot and pricing evidence at dispatch time.
- Result classification `UNTRUSTED_REVIEW_ONLY`: never executes
  a model reply, merges a PR or triggers production/release actions.

**No secrets are checked in or read during tests. No external service has
been contacted by this implementation.** Do not publish keys to the weather
frontend, Pages, issues, comments, logs or AI prompts.

## Router credentials (future controlled environment only)

When independently checked and authorized, the backend will read:

| Provider | Intended environment secret | Where |
| --- | --- | --- |
| Groq Free | `GROQ_API_KEY` | Dedicated protected MID AI Router backend environment |
| OpenRouter :free | `OPENROUTER_API_KEY` | Same environment |
| Gemini Free | `GEMINI_API_KEY` | Same environment |

These values **do not** belong in Kilo BYOK for MID routing. Kilo may
independently use the user's existing setup for its own authorized work,
but is not the router's proxy. No repository/environment secrets should
be created before scope and a safe backend are finalized. Account creation,
OAuth and billing remain user actions.

### Free proof is not a self-service toggle

`planMidAiRoute` accepts a provider registry from a **trusted
external control plane**; it cannot independently determine the user's
real account billing status or guarantee that a remote provider will never
bill. For every call, a future audited control plane must fetch/revalidate:

- Account actually in Free tier; upgrades/credits/auto-top-up disabled,
  no postpaid metering or paid fallback; a genuine provider-side hard stop.
- Price for that **exact** model, both input and output = USD 0, evidence
  from an official source; free-pricing proof newer than six hours.
- Account-specific remaining requests and rate limits; cap exhaustion
  blocks routing. The requested exact model must have independently verified
  current Free-tier availability (`modelAvailabilityVerified`).
- Privacy terms, prompt redaction, request scope and retention. The control
  plane supplies explicit `privacyApproved` and fresh `privacyCheckedAt`
  only after the data-use rules were independently reviewed; Gemini Free
  may use prompts for product improvement, so private/unreleased MID data
  remain excluded. OpenRouter requests additionally set `data_collection:deny`,
  `zdr:true`, `max_price:{prompt:0,completion:0,request:0}` and
  `allow_fallbacks:false`; incompatibility is a deliberate no-result, not a
  reason to relax privacy or cost filters. Groq uses `max_completion_tokens`.
- Stable+main exact SHA and version, user-initiated task ID and
  **durable exactly-once dispatch**. A simple volatile in-memory Set
  is insufficient. No automatic retry after ambiguous response.

**Do not set the proof flags solely because an API key exists, a model name
says "free", or a generic console has a soft budget.** Production HTTP
dispatch must remain disabled until the above server-side evidence/secret
manager/idempotency components are separately implemented and verified.
The reference `executeMidAiRoute` is NOT a release-grade
permission gateway.

## Validation and constraints

Offline deterministic QA script (named `qa-` to avoid falsely joining the mandatory
`requiredRegressionTests` inventory before versioned release integration):
`node scripts/qa-mid-ai-router-0985452.mjs`

Tests cover stale/mismatched SHA, user authorization, private data and
secrets, unsupported release tasks, missing key, wrong/unknown Free tier,
missing hard stop, paid/unknown model price, paid or unknown fallback,
quota exhaustion, stale evidence, a non-free OpenRouter model, prompt
isolation, request headers, failed HTTP, 429, malformed/oversized response,
durable duplicate prevention, direct model response, and Kilo exclusion.
The `tests/unit/mid-ai-router.test.ts` Vitest test runs the full offline QA
suite in real Node 22 on GitHub; the suite includes streaming response-size
limits, malformed UTF-8 and invalid/missing HTTP body/length handling.
No real credentials or real network used; mocked HTTP is not a
real provider, privacy, billing, RUC or iOS acceptance test.

Provider REST references:
- Groq https://console.groq.com/docs/api-reference
- OpenRouter https://openrouter.ai/docs/api-reference/overview
- Gemini https://ai.google.dev/gemini-api/docs/generate-content/text-generation
- MID issue https://github.com/MeteoMartini/MID/issues/725

## Next acceptance gate

1. Validate native Node 22 offline QA via the existing Vitest unit/Coverage
   pilot on exact PR HEAD, then obtain independent code/security review.
2. Set up a non-public, protected existing-infrastructure control plane with
   no extra costs. No product build or extra packages for this draft.
3. Verify provider-specific hard zero-cost boundaries and account-specific
   proof with the user; only then accept server-side secrets via protected UI.
4. Perform **one approved non-sensitive** single-provider live call with durable
   dispatch evidence (still no writes/merges/releases).
5. If desired, integrate with MID CI via the **standard** source-PR, exact-head
   source gate, release-bot ZIP, installer, Worker/Pages and Stable-promotion;
   bump version/changelog/mirrors with that actual release candidate.
