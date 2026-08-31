const ACTIVE_STATUSES = new Set(['queued', 'in_progress', 'waiting', 'pending', 'requested']);
const FAILED_CONCLUSIONS = new Set(['failure', 'cancelled', 'timed_out', 'action_required', 'startup_failure']);

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function runTimeMs(run) {
  const parsed = Date.parse(String(run?.created_at ?? ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function decideRecovery(runs, nowMs, staleMinutes = 42, cooldownMinutes = 18) {
  const list = Array.isArray(runs) ? runs : [];
  const active = list.find(run => ACTIVE_STATUSES.has(String(run?.status ?? '')));
  if (active) {
    return { action: 'noop', reason: 'active-run', run: active };
  }

  const recentDispatch = list.find(run => String(run?.event ?? '') === 'workflow_dispatch');
  const recentDispatchMs = runTimeMs(recentDispatch);
  if (recentDispatchMs && nowMs - recentDispatchMs < cooldownMinutes * 60_000) {
    return { action: 'noop', reason: 'dispatch-cooldown', run: recentDispatch };
  }

  const latest = list[0];
  if (!latest) {
    return { action: 'dispatch', reason: 'no-runs' };
  }

  const latestMs = runTimeMs(latest);
  const ageMinutes = latestMs ? Math.max(0, (nowMs - latestMs) / 60_000) : Number.POSITIVE_INFINITY;
  const failed = FAILED_CONCLUSIONS.has(String(latest?.conclusion ?? ''));
  if (!failed && ageMinutes <= staleMinutes) {
    return { action: 'noop', reason: 'fresh-run', run: latest, ageMinutes };
  }

  return {
    action: 'dispatch',
    reason: failed ? 'latest-run-failed' : 'stale-run',
    run: latest,
    ageMinutes
  };
}

function config(env) {
  return {
    owner: String(env.GITHUB_OWNER || 'MeteoMartini'),
    repo: String(env.GITHUB_REPO || 'MID'),
    workflow: String(env.GITHUB_WORKFLOW || 'mid-ruc-preprocess.yml'),
    ref: String(env.GITHUB_REF || 'main'),
    staleMinutes: positiveInt(env.STALE_MINUTES, 42),
    cooldownMinutes: positiveInt(env.DISPATCH_COOLDOWN_MINUTES, 18)
  };
}

function githubHeaders(env) {
  const token = String(env.GITHUB_TOKEN || '').trim();
  if (!token) throw new Error('GITHUB_TOKEN secret is missing');
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'MID-RUC-External-Watchdog'
  };
}

async function githubRequest(env, url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...githubHeaders(env),
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(`GitHub API ${response.status}: ${detail}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function checkAndRecover(env, nowMs = Date.now()) {
  const cfg = config(env);
  const workflow = encodeURIComponent(cfg.workflow);
  const branch = encodeURIComponent(cfg.ref);
  const runsUrl = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/actions/workflows/${workflow}/runs?branch=${branch}&per_page=30`;
  const payload = await githubRequest(env, runsUrl);
  const runs = Array.isArray(payload?.workflow_runs) ? payload.workflow_runs : [];
  const decision = decideRecovery(runs, nowMs, cfg.staleMinutes, cfg.cooldownMinutes);

  if (decision.action !== 'dispatch') {
    console.log(`MID RUC external watchdog: ${decision.reason}`);
    return decision;
  }

  const dispatchUrl = `https://api.github.com/repos/${encodeURIComponent(cfg.owner)}/${encodeURIComponent(cfg.repo)}/actions/workflows/${workflow}/dispatches`;
  await githubRequest(env, dispatchUrl, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      ref: cfg.ref,
      inputs: {
        force: 'false',
        trigger_source: 'cloudflare-watchdog'
      }
    })
  });

  console.warn(`MID RUC external watchdog: dispatched recovery (${decision.reason})`);
  return {...decision, dispatched: true};
}

export default {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(checkAndRecover(env).catch(error => {
      console.error(`MID RUC external watchdog failed: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }));
  },

  async fetch() {
    return Response.json({
      service: 'MID RUC external watchdog',
      scheduler: 'Cloudflare Cron Trigger',
      interval: '10 minutes',
      status: 'configured'
    }, {
      headers: {'Cache-Control': 'no-store'}
    });
  }
};
