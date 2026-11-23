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
assert.equal((preprocess.match(/^\s*-\s+cron\s*:/gm)||[]).length,4,
 'Exactly two full-RUC slots, one guarded Fast schedule and one protected Fast recovery slot are permitted.');
assert.deepEqual(
 [...preprocess.matchAll(/^\s*-\s+cron:\s*'([^']+)'$/gm)].map(match=>match[1]),
 ['11 * * * *','41 * * * *','13,43 * * * *','28,58 * * * *'],
 'The original primary :11/:41, independent :13/:43 Fast and protected :28/:58 Fast recovery slots must remain exact.'
);
const workflowJob=id=>preprocess.split(new RegExp('^  '+id+':\\s*$', 'm'))[1]?.split(/^  [a-z][\w-]*:\s*$/m)[0]??'';
for(const job of ['calculate','prepare']){
 const body=workflowJob(job);
 const condition=body.match(/^    if:\s*(.*)$/m)?.[1]??'';
 must(condition.includes("!((github.event.schedule == '13,43 * * * *' || github.event.schedule == '28,58 * * * *')") &&
      condition.includes("inputs.fast_only == true"),
      'The full RUC '+job+' job must exclude independent Fast slots');
}
must(preprocess.includes("github.event.schedule == '13,43 * * * *'") && preprocess.includes("github.event.schedule == '28,58 * * * *'"),
 'The independent Fast and protected Fast recovery slots must remain separately classified from the original EPS/full pipeline.');
must(preprocess.includes('default: false'),'Manual RUC dispatch must default to the freshness guard; forced rebuild remains explicit.');
must(preprocess.includes('cache-dependency-path: tools/ruc/requirements*.txt')&&preprocess.includes("requirements='tools/ruc/requirements-pages.txt'")&&preprocess.includes("requirements='tools/ruc/requirements.txt'"),'Free Pages preprocessing must prefer the lean dependency set while remaining safe during an older-stable activation window.');
must(preprocess.includes("MID_RUC_EPS_DECODE_WORKERS: '2'"),'RUC-EPS decode must use the conservative two-process default.');
must(preprocess.includes('group: mid-pages\n      queue: max\n      cancel-in-progress: false'),'RUC Pages publish must queue safely instead of replacing an existing pending deployment.');

for(const token of ["cron: '23,53 * * * *'",'active preprocessing run already exists','workflow_dispatch cooldown (<18 min)','-f force=false -f trigger_source=github-watchdog','cancel-in-progress: false'])must(watchdog.includes(token),`RUC watchdog resilience token missing: ${token}`);
assert.equal((watchdog.match(/cron:/g)||[]).length,1,'Internal watchdog should use one two-slot cron expression.');
must(watchdog.includes('per_page=30'),'Internal watchdog must inspect recent workflow runs before dispatching.');

for(const token of ['decideRecovery','active-run','dispatch-cooldown','stale-run','latest-run-failed',"trigger_source: 'cloudflare-watchdog'", "force: 'false'"])must(external.includes(token),`External watchdog source-prep token missing: ${token}`);
for(const token of ['workers_dev = false','crons = ["*/10 * * * *"]','STALE_MINUTES = "42"','DISPATCH_COOLDOWN_MINUTES = "18"'])must(wrangler.includes(token),`External watchdog Wrangler contract missing: ${token}`);
must(setup.includes('nur quellseitig vorbereitet und nicht aktiviert'),'External watchdog must remain source-prepared only until explicit manual credential setup.');
console.log('RUC scheduler resilience contract OK: primary :11/:41 preserved, two-slot guarded GitHub watchdog and external Cloudflare source preparation protected.');
