import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const preprocess=read('ci/github/workflows/mid-ruc-preprocess.yml');
const watchdog=read('ci/github/workflows/mid-ruc-schedule-watchdog.yml');
const external=read('tools/ruc/cloudflare_schedule_watchdog/src/index.js');
const wrangler=read('tools/ruc/cloudflare_schedule_watchdog/wrangler.toml');
const setup=read('MID_RUC_SCHEDULER_RESILIENCE_SETUP.md');
const must=(value,message)=>assert.ok(value,message);

for(const token of ["cron: '11 * * * *'","cron: '41 * * * *'",'trigger_source:','default: manual','inputs.force'])must(preprocess.includes(token),`RUC preprocess resilience token missing: ${token}`);
assert.equal((preprocess.match(/cron:/g)||[]).length,2,'Primary RUC scheduler slots must remain exactly :11 and :41.');

for(const token of ["cron: '8,18,28,38,48,58 * * * *'",'active preprocessing run already exists','workflow_dispatch cooldown (<18 min)','-f force=false -f trigger_source=github-watchdog','cancel-in-progress: false'])must(watchdog.includes(token),`RUC watchdog resilience token missing: ${token}`);
assert.equal((watchdog.match(/cron:/g)||[]).length,1,'Internal watchdog should use one six-slot cron expression.');
must(watchdog.includes('per_page=30'),'Internal watchdog must inspect recent workflow runs before dispatching.');

for(const token of ['decideRecovery','active-run','dispatch-cooldown','stale-run','latest-run-failed',"trigger_source: 'cloudflare-watchdog'", "force: 'false'"])must(external.includes(token),`External watchdog source-prep token missing: ${token}`);
for(const token of ['workers_dev = false','crons = ["*/10 * * * *"]','STALE_MINUTES = "42"','DISPATCH_COOLDOWN_MINUTES = "18"'])must(wrangler.includes(token),`External watchdog Wrangler contract missing: ${token}`);
must(setup.includes('nur quellseitig vorbereitet und nicht aktiviert'),'External watchdog must remain source-prepared only until explicit manual credential setup.');
console.log('RUC scheduler resilience contract OK: primary :11/:41 preserved, 10-minute guarded GitHub watchdog and external Cloudflare source preparation protected.');
