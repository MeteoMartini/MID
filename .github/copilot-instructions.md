# MID – GitHub Copilot repository instructions

These are the **always-on** entry instructions for Copilot Chat, cloud agent and code review. Read [AGENTS.md](../AGENTS.md) first: it and the linked versioned MID contracts remain binding. This file adds a Copilot-specific workflow, not new permissions.

## Mission and authority

MID is a German-language, scientifically grounded, accessible and responsive weather application (React/TypeScript/Vite; Cloudflare Workers; Capacitor iOS; MapLibre). GitHub `MeteoMartini/MID` is the only code source of truth. Product decisions belong to the user; ChatGPT coordinates integration and releases. Copilot assists **only with an expressly assigned, bounded MID task**. Do not initiate or expand work autonomously.

## Mandatory read-only preflight for every task

1. Fetch/verify **full** remote commit SHAs for `main` and `mid-stable`; they must agree before development. Confirm version using `package.json`, `MID_BASELINE.json` and `MID_SOURCE_OF_TRUTH.md`; do not trust the current checkout, memory, an old branch or a ZIP.
2. Read `AGENTS.md`, applicable contracts in `contracts/index.json`, and the relevant implementation/source/test files. Check open PRs, Drafts, `copilot/*`, `chatgpt/*`, `codex/*`, `replit/*` and ongoing overlapping work before choosing files.
3. Check the task's exact goal, allowed paths, dependencies, acceptance criteria, time/data provenance, and whether writing is actually authorized. Make a short plan and explicitly list exclusions. Preserve existing local/uncommitted work before any sync or checkout.
4. If `main` or `mid-stable` differs, permissions are insufficient, provenance/overlap is unclear, or mandatory verification cannot run, **stop fail-closed** and return evidence. Do not work from stale code.

## Work boundary and handoff

- For a read-only audit: **do not modify files, refs, PRs or release state**. Report reproducible issues, exact file/line locations, impact and fixes.
- For an explicitly authorized implementation: work only in the assigned scope on an isolated, verified working copy. Never write to `main`, `mid-stable`, `chatgpt/*`, `codex/*` or `replit/*` through Copilot; never impersonate an authorized release or integration actor.
- Copilot-created `copilot/*` refs are **untrusted candidates**, not MID integration branches. Do not assume GitHub Copilot's default PR/push behavior is permitted. If an external Draft candidate or a safe transport is not explicitly authorized and verifiably possible, keep work local and deliver a reproducible diff/patch and QA report; do not publish it. Never open a non-Draft production PR or mark a Copilot Draft ready for review autonomously.
- Only an independently verified `chatgpt/*` or `codex/*` **source integration** can proceed to the established Source-PR Gate → SHA-bound release-bot merge → server-side ZIP → `install-mid.yml` → Worker/Pages → Stable promotion. Copilot may not merge, deploy, trigger promotion, rewrite Git history, force-push, bypass checks, alter secrets or loosen rulesets.
- Review, tests and claimed QA must be specific to the **exact resulting commit**; report any missing browser, WebGL, iOS, VoiceOver, network or data-source evidence as `NOT VERIFIED`. A local lint/build success is never a release authorization.

## Scientific, privacy and UI quality

- Use WMO/DWD conventions and authoritative data where applicable; distinguish MID heuristics from **official warnings**. Preserve units, model run, valid time, accumulation interval, area, uncertainty and source. Missing values are not zero; do not smooth away real extremes.
- Preserve existing app functions, consistent Skybar/colors/icons, time axes and parameter precision. Test small/large phone, tablet portrait/landscape, desktop, light/dark, touch, keyboard, safe areas and WCAG 2.2 AA targets; include widgets/exports when shared renderers change.
- Minimize cost and personal data; never log secrets or individual locations in telemetry. No new paid service, broad permissions or production keys without the user's explicit approval.

## Required completion report

Return: task/scope; remote base `main`/`mid-stable` full SHAs + version and check time; local branch/parent/head/tree SHAs if applicable; files and behavior changed; source and science assumptions; focused tests with exact outcomes; full-gate status; remaining gaps/risks; overlaps with parallel PRs; and **`NO MERGE / NO DEPLOY / NO STABLE PROMOTION`** unless the established release actor independently proves otherwise.

See [Copilot collaboration contract](../docs/implementation/MID_COPILOT_COLLABORATION_2026_11_06.md). Reusable prompts: [preflight](prompts/mid-preflight.prompt.md) and [handoff](prompts/mid-handoff.prompt.md).
