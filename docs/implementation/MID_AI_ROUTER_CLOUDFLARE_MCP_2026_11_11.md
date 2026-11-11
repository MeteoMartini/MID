# MID AI Router — Cloudflare MCP/OAuth runtime qualification (11 Nov 2026)

Status: AUTHENTICATED SOURCE CANDIDATE in isolated GitHub Router PR #728.
Not deployed. Not a verified Cloudflare account or provider API run. No
MID production release has been requested or allowed by these files.

The service consists of these files:
- scripts/mid-ai-router-mcp-http.mjs — stateless MCP HTTP JSON-RPC gateway
  supporting list_models_status, plan_request, compare_two_reviews (read-only)
  and execute_public_review (signed write, one upstream HTTP request).
- router/cloudflare/oauth-server.mjs — OAuthAuthorizationServer v1.2.4 with
  browser-bound client consent, separate optional write scope, GitHub OAuth
  PKCE S256 and exact operator identity allowlist; only user ID persisted.
- router/cloudflare/mcp-worker.mjs — OAuthResourceServer v1.2.4 that accepts
  tokens only from the AUTH_SERVER binding and uses a secret HMAC pepper to
  derive principal hash. Executes with existing SHA/readback/Ed25519 and
  SQLite Durable Object atomic claim, never an anonymous model route.
- router/cloudflare/wrangler.auth.toml and wrangler.mcp.toml — configuration
  templates only, no Cloudflare IDs, tokens or secrets.
- router/cloudflare/package.json — separate dependency pin. A full
  reproducible installer lockfile and actual Cloudflare Workers bundle are
  NOT yet qualified. Existing MID root build dependencies were not changed.

No new app workflows, pricing plans, browser secret stores, account keys,
release gates, Pages workers or main/stable code have been modified.

No unauthenticated public inference. A complete live request requires:
1. An actual Cloudflare Free account, OAuth KV namespace, SQLite DO
   qualification and AUTH_SERVER service binding with exact HTTPS issuer and
   resource URLs, plus a verified Free-plan cost/no-overage state.
2. Real GitHub OAuth client ID/secret with callback to the known auth Worker;
   numeric owner user ID allowlist and consent/PKCE browser testing.
3. The independent operator-controlled Ed25519 grant signer with authenticated
   real provider-account free billing hard stop, exact model/ZDR/privacy
   and global quota attestation. This signer is not invented in the runtime.
4. Runtime secrets provisioned in Cloudflare ONLY by an authorized operator:
   MID_AI_GITHUB_CLIENT_ID, MID_AI_GITHUB_CLIENT_SECRET,
   MID_AI_ALLOWED_GITHUB_USER_ID, MID_AI_AUTH_ISSUER,
   MID_AI_RESOURCE_URL, MID_AI_SIGNER_PUBLIC_KEY, MID_AI_SIGNER_KEY_ID,
   MID_AI_SUBJECT_PEPPER, and dedicated Free-provider API key(s).
   MID_AI_LIVE_DISPATCH_ARMED defaults off. Do not paste keys into chat,
   docs, logs or a PR. Missing configuration MUST fail closed.
5. Real SDK dependency lock, package resolution, Worker build and
   end-to-end OAuth/issuer/DO tests before deployment. Existing offline
   22+ scenarios and static source tests are NOT deployment evidence.
6. Supported ChatGPT user account entitlement for full MCP write tools.
   OpenAI documentation presently limits full MCP write access to
   Business/Enterprise/Edu; Plus entitlement is NOT established. This
   cannot be bypassed by exposing a public unauthenticated model route.

No costs or billing are approved. A request denied for lacking a grant,
scope, ZDR, source SHA, signing key or quota MUST NOT fallback to a paid
gateway, open billing or retry an ambiguous response. Two-model summaries
only analyze already obtained untrusted receipts and never originate a
second provider call. All meteorological claims require independent
original-source verification.

Reference documentation:
https://github.com/cloudflare/workers-oauth-provider/tree/v1.2.4
https://developers.cloudflare.com/agents/model-context-protocol/protocol/authorization/
https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt
