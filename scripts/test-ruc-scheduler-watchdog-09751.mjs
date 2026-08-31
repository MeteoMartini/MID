import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [primary,watchdog,sync,baselineText]=await Promise.all([
 readFile(new URL('../ci/github/workflows/mid-ruc-preprocess.yml',import.meta.url),'utf8'),
 readFile(new URL('../ci/github/workflows/mid-ruc-schedule-watchdog.yml',import.meta.url),'utf8'),
 readFile(new URL('./sync-github-workflows.mjs',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);

assert.equal((primary.match(/cron:/g)||[]).length,2,'Primärer RUC-Workflow muss exakt :11/:41 behalten.');
for(const token of [
 "cron: '11 * * * *'","cron: '41 * * * *'",'workflow_dispatch:','force:','default: true','type: boolean',
 '"${{ inputs.force }}" != "false"','tools/ruc/check_ruc_schedule_guard.py','cancel-in-progress: false'
])assert.ok(primary.includes(token),`Primärer RUC-Schedulervertrag fehlt: ${token}`);

assert.equal((watchdog.match(/cron:/g)||[]).length,1,'GitHub-Watchdog muss die sechs 10-Minuten-Prüfslots in genau einer Cron-Expression bündeln.');
for(const token of [
 "cron: '8,18,28,38,48,58 * * * *'",'actions: write','group: mid-ruc-schedule-watchdog',
 "'.github/workflows/mid-ruc-schedule-watchdog.yml'","'.github/workflows/mid-ruc-preprocess.yml'",
 'event=schedule&per_page=1','per_page=30','active preprocessing run already exists','workflow_dispatch cooldown (<18 min)',
 'gh workflow run "$RUC_WORKFLOW" -R "$GITHUB_REPOSITORY" --ref main -f force=false -f trigger_source=github-watchdog',
 'event=workflow_dispatch&per_page=1','RUC recovery dispatch verified','no new workflow_dispatch run became visible within 90 seconds',
 'recovery_self_test=false','GITHUB_EVENT_NAME','RUC watchdog deployment self-test: guarded recovery dispatch will be exercised once.'
])assert.ok(watchdog.includes(token),`RUC-Watchdog-Vertrag fehlt: ${token}`);
assert.ok(sync.includes("['workflows/mid-ruc-schedule-watchdog.yml','workflows/mid-ruc-schedule-watchdog.yml']"),'Admin-Sync verwaltet den RUC-Watchdog nicht.');

const baseline=JSON.parse(baselineText),test='scripts/test-ruc-scheduler-watchdog-09751.mjs';
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes(test),`${test} fehlt in requiredFiles.`);
assert.ok(baseline.requiredFiles.includes('ci/github/workflows/mid-ruc-schedule-watchdog.yml'),'Kanonischer RUC-Watchdog ist keine geschützte Pflichtdatei.');
console.log('RUC :11/:41 plus verdichteter same-provider 10-Minuten-Watchdog mit Active-Run-Sperre, Cooldown, guarded dispatch und Run-Nachweis geschützt.');
