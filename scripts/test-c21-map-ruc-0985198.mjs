import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {discardStaleUnstartedRuns,decideRecovery} from '../tools/ruc/cloudflare_schedule_watchdog/src/index.js';
const read=p=>readFileSync(p,'utf8'),workflow=read('ci/github/workflows/mid-ruc-schedule-watchdog.yml');
const gate=workflow.slice(workflow.indexOf('          active_rows='),workflow.indexOf('          if [ -n "$active_url"')).split('\n').map(s=>s.startsWith('          ')?s.slice(10):s).join('\n');
const temp=mkdtempSync(path.join(tmpdir(),'mid-c21-ruc-'));
try {
 writeFileSync(path.join(temp,'gh'),'#!/bin/bash\n[ "${JOBS_ERROR:-0}" = 0 ] || exit 73\nprintf "%s" "$JOBS_JSON"\n',{mode:0o700});
 const now=Date.parse('2026-10-08T05:00:00Z'),run=(status,age,extras={})=>({id:123,status,created_at:new Date(now-age*60000).toISOString(),html_url:'https://github.com/run/123',...extras});
 const check=async(r,jobs,ignored)=>{
  const kept=await discardStaleUnstartedRuns([r],now,42,async()=>jobs);assert.equal(kept.length,ignored?0:1);
  const result=spawnSync('bash',['-c',`set -euo pipefail\n${gate}\nprintf 'ACTIVE=%s' "$active_url"`],{encoding:'utf8',env:{...process.env,PATH:`${temp}:${process.env.PATH}`,GITHUB_REPOSITORY:'MeteoMartini/MID',now_epoch:String(now/1000),recent_json:JSON.stringify({workflow_runs:[r]}),JOBS_JSON:JSON.stringify(jobs)}});
  assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.split('ACTIVE=')[1],ignored?'':r.html_url);
 };
 for(const status of ['queued','pending','requested'])await check(run(status,180),{total_count:0,jobs:[]},true);
 for(const status of ['queued','in_progress','waiting'])await check(run(status,42),{total_count:0,jobs:[]},false);
 for(const status of ['in_progress','waiting'])await check(run(status,180),{total_count:0,jobs:[]},false);
 await check(run('queued',180,{run_started_at:new Date(now-300000).toISOString()}),{total_count:0,jobs:[]},false);
 for(const jobs of [{total_count:1,jobs:[{status:'queued'}]},{total_count:1,jobs:[{status:'completed'}]},{total_count:0,jobs:[{}]},{jobs:[]}])await check(run('queued',180),jobs,false);
 await assert.rejects(discardStaleUnstartedRuns([run('queued',180)],now,42,async()=>{throw Error('API down')}));
 const failed=spawnSync('bash',['-c',`set -euo pipefail\n${gate}`],{env:{...process.env,PATH:`${temp}:${process.env.PATH}`,GITHUB_REPOSITORY:'MeteoMartini/MID',now_epoch:String(now/1000),recent_json:JSON.stringify({workflow_runs:[run('queued',180)]}),JOBS_ERROR:'1'}});assert.equal(failed.status,73);
 const freshRetry=run('completed',180,{run_started_at:new Date(now-300000).toISOString(),event:'workflow_dispatch'});assert.equal(decideRecovery([run('completed',60),freshRetry],now).reason,'dispatch-cooldown');
 const guard=workflow.slice(workflow.indexOf('          main_sha='),workflow.indexOf('          recent_json=')).split('\n').map(s=>s.startsWith('          ')?s.slice(10):s).join('\n');
 writeFileSync(path.join(temp,'gh'),'#!/bin/bash\n[ "${JOBS_ERROR:-0}" = 0 ] || exit 73\ncase "$*" in *mid-stable*) printf "%s" "$STABLE_SHA";; *) printf "%s" "$MAIN_SHA";; esac\n',{mode:0o700});
 for(const [main,stable,expected] of [['a'.repeat(40),'a'.repeat(40),'PASS'],['a'.repeat(40),'b'.repeat(40),'deferred'],['invalid','a'.repeat(40),'failure']]){
  const result=spawnSync('bash',['-c',`set -euo pipefail\n${guard}\necho PASS`],{encoding:'utf8',env:{...process.env,PATH:`${temp}:${process.env.PATH}`,GITHUB_REPOSITORY:'MeteoMartini/MID',MAIN_SHA:main,STABLE_SHA:stable}});
  if(expected==='failure')assert.notEqual(result.status,0);else {assert.equal(result.status,0);assert.ok(result.stdout.includes(expected));}
 }
 const primary=read('ci/github/workflows/mid-ruc-preprocess.yml');
 assert.ok(primary.includes('artifact-ids: ${{ needs.prepare.outputs.data_artifact_id }}'));assert.ok(primary.includes('data_artifact_id: ${{ steps.data_upload.outputs.artifact-id }}'));
 assert.equal((primary.match(/mid-ruc-pages-\$\{\{ github.run_id \}\}-\$\{\{ github.run_attempt \}\}/g)||[]).length,2);
 for(const file of ['mid-ruc-preprocess.yml','mid-ruc-schedule-watchdog.yml'])assert.equal(read(`ci/github/workflows/${file}`),read(`.github/workflows/${file}`));
 const radar=read('src/RadarPanel.tsx');assert.ok(radar.indexOf('Direkte Kartenzeitwahl')<radar.indexOf('<MapContainer center='));assert.ok(radar.includes('seek(Number(e.target.value))'));assert.ok(radar.includes('previousTimeline.current=frames[next].time')); assert.ok(read('src/UnifiedWeatherMap.tsx').includes('Synoptik erneut laden'));assert.ok(!read('src/nativeSynopticFields.ts').includes('wird vorbereitet'));
 console.log('C21: recovery fail-closed jobs, rerun cooldown, release guard, exact artifact handoff, direct time and synoptic retry verified.');
} finally {rmSync(temp,{recursive:true,force:true});}
