---
applyTo: "ci/github/**,.github/workflows/**,tools/ci/**,scripts/**"
---

# MID CI, tooling and governance rules

- Workflow changes are **not** routine Copilot task scope. Audit/read is allowed; propose any necessary modifications with evidence and let an authorized ChatGPT/Codex integration handle them. Do not alter protected infrastructure, required checks, signing, credentials, rulesets or release actors.
- Canonical workflow source is `ci/github/workflows/`; `.github/workflows/` is a generated mirror via `npm run sync:github-workflows` in a separately authorized repository-maintenance change. Never edit one copy alone.
- Honor the full regression inventory in `MID_BASELINE.json`, including original/negative weather fixtures, all Core and Heavy shards, browser tests, version mirrors, budgets, dependency scanning and exact-SHA comparison. Never skip, mark failing as passing, or reuse unrelated green runs.
- GitHub Actions need least privilege and actions pinned to immutable full commit SHAs. Do not add unapproved network destinations, external paid services, auto-merge workflows or unsafe credentials.
- CI environment compatibility must be reproduced: pinned Playwright/browser requirements may not work on a newly rolled `ubuntu-latest` image; qualify a versioned runner/Playwright combination rather than weakening tests.
- Copilot's default branch/PR features do not bypass MID's protected branches or Source-PR Gate. Return a proposed patch and exact verification steps if the agent lacks an authorized write/transport path.
