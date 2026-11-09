# MID AI Router — kostenloses Modellrouting und Blends (Originalquellen, 09.11.2026)

**Status:** Research + non-production QA candidate for [#725](https://github.com/MeteoMartini/MID/issues/725) / [Draft #728](https://github.com/MeteoMartini/MID/pull/728). **No live provider integration or account credentials approved.** Stable source remained v0.9.85.451 at the start of this work. This file is research, NOT a provider attestation and NOT a release contract override.

## Decision: avoid buying credits, not merely cheap tokens

Free has three materially different meanings:

1. **0-priced exact model and no funded account**: candidate for direct routing only if official model price, account-specific rate-limit, disabled paid fallback, actual billing state, and privacy controls are all freshly verified by a separate signing authority. Examples: the currently documented OpenRouter \`:free\` collection, a genuinely unbilled Gemini Free project, and Groq Free plan.
2. **Included recurring *priced* API allowance**: potential **0 cash expense**, but **not 0 API price**. Vercel AI Gateway's documented $5 every 30 days is the notable example. Never silently treat it as \`maxCostUsd: 0\` or enable the existing strict free-only adapter. A future *separate* signed credit-reservation subsystem must confirm free-tier account, supported model, current credit balance, true remaining credit, full estimated/max request cost, no paid balance, no auto top-ups and no credential/provider fallback. **DISABLED until independently proven.**
3. **One-time promotion, free chat subscription, paid API or unavailable product**: not eligible for persistent direct execution. ChatGPT Plus and Perplexity's consumer Free/Pro subscriptions do not supply reusable, free model API usage for this project.

### Provider priorities and prohibitions

| Candidate | Original evidence / 2026-11-09 finding | MID decision |
| --- | --- | --- |
| **Groq Free** | Official per-model org limits, e.g. gpt-oss-20b/120b; [Groq limits](https://console.groq.com/docs/rate-limits). | Existing direct QA adapter; **account proof + actual key required** before any call |
| **OpenRouter Free** | [Free models](https://openrouter.ai/collections/free-models), [pricing](https://openrouter.ai/pricing): zero-priced \`:free\`, 50/day without credit purchase, paid models and automatic selection must be excluded. | Existing direct QA adapter; explicit pinned model, NO \`openrouter/free\` random routing |
| **Gemini Free** | [Google API pricing](https://ai.google.dev/gemini-api/docs/pricing): free model subset, unbilled-project limits, input can be used to improve Google's products. | Existing direct QA adapter; **public and already redacted only**; no billing link |
| **Cohere trial** | [API limits](https://docs.cohere.com/v2/docs/rate-limits): free evaluation key, 1,000 calls/month; [FAQ](https://docs.cohere.com/docs/cohere-faqs) limits trial to evaluation/prototyping. | Additional QA candidate, **not** production adapter |
| **SambaNova Cloud** | [Official free-account instructions](https://docs.sambanova.ai/docs/en/integrations/vscode), model availability/Free limits must be account-verified. | Additional direct candidate, disabled pending hard billing/privacy check |
| **Cloudflare Workers AI** | [Official pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/): 10,000 free neurons/day; Paid plan bills overage; some models paid only. | Candidate only on documented **Workers Free** with allowed model; not automatically on existing paid MID Cloudflare |
| **Vercel AI Gateway** | [Official pricing](https://vercel.com/docs/ai-gateway/pricing): $5 included each 30 days before first purchase, then paid-tier behavior changes. [Sonar](https://vercel.com/ai-gateway/models/sonar) exists and uses *priced* inference plus web search. | **High-value Perplexity research candidate**, but **separate capped-credit route disabled** until non-paying account and exact Sonar free-tier eligibility are independently established |
| **Perplexity directly** | [Perplexity subscription comparison](https://www.perplexity.ai/help-center/de/articles/11187416-welches-perplexity-abonnement-ist-das-richtige-fur-sie): API Platform requires API credits, no free API grants. | **Blocked for direct no-buy API**; access Perplexity only via independently verified included Vercel allowance, if possible |
| **GitHub Copilot Pro** | Existing authorized GitHub Copilot connected routes, distinct from GitHub Models. | Use existing Copilot for private repo/PR coding and review under MID governance; **never claim generic Copilot REST model proxy** |
| **GitHub Models** | [Official GitHub retirement](https://docs.github.com/en/github-models): fully retired **2026-07-30**. | **Blocked forever**; do not create obsolete tokens or workflow permissions |
| **Mistral Free** | [Official latest usage limits](https://docs.mistral.ai/admin/billing-usage/usage-limits): Free mode includes Studio/Vibe but **not API**; API requires activation of pay-as-you-go. | **Blocked for no-purchase API**; conflicting older guides are stale |
| **Hugging Face** | [Official Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing): $0.10 monthly free-account credit, tiny allowance. | Low-priority QA; not 0-priced or a reliable multi-model hub |
| **Cerebras** | Historical free docs conflict with newer 2026 trial/promo reports requiring payment method. | Fail-closed; no standing free-tier assumption or adapter |
| **ChatGPT Plus API** | [OpenAI API credit eligibility](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions): Plus **not eligible** for included API credits. | Existing ChatGPT/Work/Codex interfaces only, no implied OpenAI API balance |


### Vercel AI Gateway / Perplexity — read-only account verification 2026-11-09

The Vercel connector was granted read-only MID team access after an
initial `403 forbidden`. The actual team `mid-0529` / `MID` is now
readable. Vercel's Git deployment-context readback reports **Hobby plan**,
**zero Vercel projects** and **zero Git-linked Vercel projects**.
A team-scoped November billing-charge lookup returned `404
costs_not_found`; this means costs were not available through that
API, **not** a verified $0 spend. The connector does not expose the
authenticated AI Gateway credit balance, payment-method status, budgets,
paid overage / auto-top-up state or all AI Gateway API key metadata.
Therefore there is **still no account-specific zero-cash attestation**.
No deployment, provider key, purchase or API request was made.
A connected app is *not* an attested payment-safe runtime.

Current originals:
- [Pricing](https://vercel.com/docs/ai-gateway/pricing):
  $5 included every 30 days on an unpurchased/free AI Gateway tier, lost
  once credits are bought. Auto top-up is disabled by default, but current
  account settings must be read back, not assumed.
- [Sonar model price](https://vercel.com/ai-gateway/models/sonar):
  \`perplexity/sonar\` is **priced**, currently $0.25 / 1M input tokens
  and $2.50 / 1M output tokens **plus web search charges** around
  $2.50 / 1,000 searches; exact live model/provider costs must be refreshed.
  It is not a $0-per-token model and its web search cannot be disabled.
- [AI Gateway budget semantics](https://vercel.com/docs/ai-gateway/observability-and-spend/budgets):
  budgets are **soft limits**; a single admitted request may exceed them.
  They do not reserve credits, BYOK costs do **not** count toward budgets,
  and a team still needs credits or a payment method to make requests.
- [Gateway usage API](https://vercel.com/docs/ai-gateway/observability-and-spend/usage):
  authenticated credits/balance and per-generation costs can support
  evidence *after* team permission, but cannot alone guarantee that an
  in-flight request will never exceed the remaining free allowance.

**MID decision: LIVE BLOCKED.** Provider-side hard fail at zero cash,
account Free-tier state, no purchased credit, no auto top-up, no BYOK
billing bypass, no Vercel spend outside prepaid entitlement, a private
execution location, a bound signed approval, token/search upper bounds
and non-overlapping durable credit admission must all be demonstrated
before any conditional Sonar implementation. A key-scoped or team budget
alone is **not sufficient** under the MID cost governance contract.

Do **not** add \`vercel-perplexity-sonar\` to the direct zero-priced
allowlist. \`mid-ai-router-blend.mjs\` catalog records
\`directExecutionAllowed:false\` and the soft-budget/payment caution.
The existing direct provider builder rejects even a forged
\`perplexity/sonar\` plan, regardless of self-supplied free flags.

### GitHub Copilot Fusion: existing subscription blend, not external API

[Official Copilot Fusion documentation](https://docs.github.com/en/copilot/concepts/models/copilot-fusion) describes **Single**, **Cascade**, and **Critique** execution patterns. Fusion Standard generally routes to one model; High/Max may use several and consume more included GitHub AI Credits. Official [Copilot individual billing](https://docs.github.com/en/copilot/concepts/billing-and-usage/individuals/billing) confirms per-model/token AI credit metering. Paid plan users are advertised 30% off Fusion model charges only **through 2026-11-30**; do not treat that as a permanent allowance. No extra Fusion subscription is required, but overage purchase or billing must stay **disabled**.

**Surface limitations:** Official docs list VS Code, Copilot CLI, GitHub Copilot app and JetBrains as Fusion clients. Do **not** claim Fusion is callable through ChatGPT, the MID AI Router REST dispatcher or GitHub Issues by a hidden API. For mostly iPhone/iPad workflows, prefer existing **GitHub-connected Copilot agent issue/Draft bridge** for bounded coding; Fusion can be invoked *only* in an actually available supported Copilot client, optionally through a computer if necessary, while respecting the existing GitHub permissions and spend caps. GitHub Models' retired inference API is not a substitute.

Do not install a new Copilot SDK, a paid token broker or another GitHub App just to invoke Fusion. Any future programmatic adapter requires confirmed interface availability, model/credit readback and independent GitHub security review.

### Exact OpenRouter models for *public* QA pilots (not private source)

- **Cohere North Mini Code** \`cohere/north-mini-code:free\`: [original model page](https://openrouter.ai/cohere/north-mini-code), appropriate for redacted public code review.
- **Recursive Flint** \`recursive/flint-v1.0:free\`: [model page](https://openrouter.ai/recursive/flint-v1.0%3Afree/), public coding/test design; may be unavailable and has no EU in-region guarantee.
- **Google Gemma 4 26B A4B** \`google/gemma-4-26b-a4b-it:free\`: [model page](https://openrouter.ai/de/google/gemma-4-26b-a4b-it%3Afree), independent model family from Groq's \`openai/gpt-oss-20b\` but **not independent from Google Gemini** under current blend policy.
- **NVIDIA Nemotron 3.5 Super VL** \`nvidia/nemotron-3.5-super-vl:free\`: [official model listing](https://openrouter.ai/nvidia/nemotron-3.5-super-vl%3Afree); its free-endpoint privacy notice specifically forbids confidential/personal inputs and permits service improvement logging. **Do not transmit private MID code, personal images, unreleased mockups or proprietary data.** A verified multimodal consent/scope would be required, and current router remains text-only.

**Do not auto-enable anonymous stealth models** without clear provider identity and acceptable data policy. The OpenRouter free model aggregator \`openrouter/free\` chooses a varying free backend; MID deliberately forbids it because deterministic provenance and per-provider privacy review would be lost.

## Blends — safer than unconstrained model cascades

- **Default one-model public review**: at most one signed, no-cash direct model request.
- **Independent two-model review**: *only* for explicit user-initiated \`independent-review\`, \`bounded-code-review\` or \`weather-science\`; requires \`task.maxExternalCalls === 2\`. Select two distinct Free-proofed **providers and underlying model families**. No second call if one is unavailable and no implicit retry after 429 or failure. Each receives its **own task ID, task fingerprint, short-lived signed grant and one-shot ledger claim**.
- **Source-backed research**: ChatGPT connected web search/Firecrawl for original official documentation, optionally one external text model for public research, and only then a second independent public reviewer if explicitly authorized; a two-model agreement is **not evidence of truth**. Official DWD/WMO requirements, timestamps, valid times, units, warnings and provenance remain authoritative.
- **Private GitHub code**: keep via ChatGPT/GitHub and existing authorized Copilot workflow; **do not send private repo files to free external models**. Replit only UI, Kilo a separate optional bounded actor, neither a universal router.
- **Perplexity Sonar via Vercel**: if future no-cash included-credit route is ever proven, restrict to public, bounded, citation-backed web research. Query token and search billing are nonzero. The existing 0-price router must **not** call it.

### Implemented in QA branch

\`scripts/mid-ai-router-blend.mjs\` adds a deterministic **network-free**, no-automatic-dispatch two-model plan and a *non-authorizing* 2026 research-status registry. It does not add any third-party execution credentials, Vercel gateway, cloud service, autonomous watcher, release permissions or production capability. \`scripts/qa-mid-ai-router-blend-0985452.mjs\` and existing \`tests/unit/mid-ai-router.test.ts\` cover independent provider/model-family exclusion, two-request user authorization, free price/privacy/quota/SHA gating, and exclusion of retired/paid services.

### Residual gates

Before any live execution: provider account ownership, hard zero-cash boundary (or separate actual included-credit accounting), signed independent approver who checks actual provider evidence, secure backend, protected credential store, replay prevention for the actual host, independent privacy/data-use review, official model run/version/price confirmation and one approved non-sensitive smoke request. **No service setup in this QA draft and no paid credits.**
