import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,existsSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
const read=p=>readFileSync(p,'utf8');
const watchdog=read('ci/github/workflows/mid-ruc-schedule-watchdog.yml');
const shell=watchdog.slice(watchdog.indexOf('          set -euo pipefail')).split('\n').map(l=>l.startsWith('          ')?l.slice(10):l).join('\n');
const temp=mkdtempSync(path.join(tmpdir(),'mid-c22-publication-'));
try {
 const marker=path.join(temp,'dispatched');
 writeFileSync(path.join(temp,'gh'),`#!/bin/bash
set -eu
case "$*" in
  *"workflow run"*) touch "$DISPATCH_MARKER"; exit 0;;
  *"git/ref/heads/main"*) printf '%s' "$MAIN_SHA";;
  *"git/ref/heads/mid-stable"*) printf '%s' "$STABLE_SHA";;
  *"event=schedule"*) printf '%s' "$SCHEDULE_JSON";;
  *"event=workflow_dispatch"*) printf '%s' "$DISPATCH_JSON";;
  *"per_page=30"*) printf '%s' "$RECENT_JSON";;
  *) exit 77;;
esac
`,{mode:0o700});
 writeFileSync(path.join(temp,'sleep'),'#!/bin/bash\nexit 0\n',{mode:0o700});
 const now=new Date().toISOString(),sha='a'.repeat(40);
 const recent=(status,event='schedule')=>({id:123,status,event,conclusion:status==='completed'?'success':null,created_at:now,run_started_at:now,html_url:'https://github.com/run/123'});
 const check=(extra,dispatched,message)=>{
  rmSync(marker,{force:true});
  const env={...process.env,PATH:`${temp}:${process.env.PATH}`,GITHUB_EVENT_NAME:'schedule',GITHUB_REPOSITORY:'MeteoMartini/MID',RUC_WORKFLOW:'mid-ruc-preprocess.yml',DISPATCH_MARKER:marker,MAIN_SHA:sha,STABLE_SHA:sha,DATA_CATCHUP:'true',SCHEDULE_JSON:JSON.stringify({workflow_runs:[recent('completed')]}),RECENT_JSON:JSON.stringify({workflow_runs:[recent('completed')]}),DISPATCH_JSON:JSON.stringify({workflow_runs:[recent('queued','workflow_dispatch')]}),...extra};
  const result=spawnSync('bash',['-c',shell],{encoding:'utf8',env});
  assert.equal(result.status,0,result.stderr);assert.equal(existsSync(marker),dispatched,result.stdout);assert.ok(result.stdout.includes(message),result.stdout);
 };
 // Regression: a green scheduled run that never published cannot block recovery.
 check({},true,'RUC recovery dispatch verified');
 check({DATA_CATCHUP:'false'},false,'schedule event verified');
 check({DATA_CATCHUP:''},true,'scheduler success alone is insufficient');
 check({STABLE_SHA:'b'.repeat(40)},false,'release not yet promoted');
 check({RECENT_JSON:JSON.stringify({workflow_runs:[recent('in_progress')]})},false,'active preprocessing run');
 check({RECENT_JSON:JSON.stringify({workflow_runs:[recent('completed','workflow_dispatch')]})},false,'cooldown');
 check({GITHUB_EVENT_NAME:'workflow_run'},true,'RUC recovery dispatch verified');
 check({GITHUB_EVENT_NAME:'workflow_run',DATA_CATCHUP:'false'},false,'schedule event verified');
 const primary=read('ci/github/workflows/mid-ruc-preprocess.yml');
 const upload=primary.slice(primary.indexOf('        id: data_upload'),primary.indexOf('      - name: Bereits aktuellen'));
 assert.ok(upload.includes('name: mid-ruc-data-${{ github.run_id }}-${{ github.run_attempt }}'));
 assert.ok(!upload.includes('artifact-ids:')&&!upload.includes('merge-multiple:'));
 assert.ok(primary.includes('artifact-ids: ${{ needs.prepare.outputs.data_artifact_id }}'));
 assert.ok(!primary.includes('"Die Vorbereitungsbasis ist nicht mehr der aktuelle `mid-stable`'));
 assert.ok(watchdog.includes("github.event.workflow_run.conclusion == 'success'"));
 assert.ok(watchdog.includes("github.event.workflow_run.head_branch == 'main'"));
 assert.ok(watchdog.includes('github.event.workflow_run.head_repository.full_name == github.repository'));
 assert.ok(watchdog.includes('persist-credentials: false'));
 for(const f of ['mid-ruc-preprocess.yml','mid-ruc-schedule-watchdog.yml'])assert.equal(read(`ci/github/workflows/${f}`),read(`.github/workflows/${f}`));
 console.log('C22: green-but-unpublished catch-up, public freshness, release retry, active/cooldown gates and attempt-bound upload verified');
} finally {rmSync(temp,{recursive:true,force:true});}
