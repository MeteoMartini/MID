# MID RUC external scheduler watchdog

This directory contains the provider-independent second scheduler layer for the DWD RUC preprocessing workflow. **Operational dispatches are evidenced in GitHub; the old inactive label was stale.** Cloudflare account-level deployment identity and cron metadata have not been inspected in this audit.

## Operational evidence · 2026-10-09

Both completed prepare-job logs contain the executed output `RUC trigger source: cloudflare-watchdog`, beyond merely displaying the shell script:

- [RUC run 37965530049, prepare job 113938814905](https://github.com/MeteoMartini/MID/actions/runs/37965530049/job/113938814905): 17:20:20 UTC (19:20 CEST).
- [RUC run 37977200345, prepare job 113978381400](https://github.com/MeteoMartini/MID/actions/runs/37977200345/job/113978381400): 19:00:20 UTC (21:00 CEST). The data publication was correctly skipped during the .219→.220 release transition.

These establish accepted recovery dispatches labelled by the external watchdog. They are not a direct inspection of Cloudflare deployment/version IDs or cron trigger configuration. Source `*/10 * * * *` is the configured cron contract, not an independently retrieved account setting. No credentials or deployment were modified to obtain this evidence.

## Why it exists

GitHub `schedule` is best-effort. The primary RUC workflow and the internal GitHub watchdog can therefore both miss their timers during a GitHub scheduler stall. This optional Cloudflare Cron Worker checks GitHub independently every 10 minutes and only dispatches a guarded recovery when necessary.

## Safety gates

- `GITHUB_TOKEN` must be stored as a Cloudflare Worker secret, never in source.
- Use a fine-grained GitHub token restricted to `MeteoMartini/MID` with the minimum repository permission required to read and dispatch Actions workflows.
- The target workflow must accept `trigger_source` and retain `force=false` freshness guarding.
- No R2 storage or paid MID resource is required by this watchdog implementation.
- Deployment is intentionally **not automated** from the Professional release because a new cross-provider credential and Worker activation require an explicit administrative step.
- `workers_dev=false` keeps the watchdog off the public workers.dev route; recovery dispatches run only from the scheduled handler.

## Administrative setup reference (explicit approval required)

From this directory with Wrangler authenticated to the intended MID Cloudflare account:

1. `npx wrangler secret put GITHUB_TOKEN`
2. `npx wrangler deploy`

Then verify that the Worker has the cron trigger `*/10 * * * *`.

## Recovery policy

- no dispatch while a preprocessing run is active;
- no dispatch within 18 minutes of any recent `workflow_dispatch`;
- no dispatch while the newest workflow run is <=42 minutes old and not failed;
- immediate guarded dispatch after a completed failed run when no cooldown/active run blocks it;
- dispatch when the newest workflow run is >42 minutes old or no run exists.

Every external repair uses `force=false` and `trigger_source=cloudflare-watchdog`.
