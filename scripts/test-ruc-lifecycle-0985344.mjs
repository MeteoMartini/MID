import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
for(const pattern of ['test_prepared_snapshot.py','test_timed_command.py']){
 const result=spawnSync('python',['-m','unittest','discover','-s','tools/ruc','-p',pattern],{encoding:'utf8',timeout:60000});
 assert.equal(result.status,0,result.stdout+result.stderr);
}
const workflow=readFileSync('ci/github/workflows/mid-ruc-preprocess.yml','utf8');
function step(name){const start=workflow.indexOf('      - name: '+name+'\n');assert.ok(start>=0,name);const end=workflow.indexOf('\n      - ',start+1);return workflow.slice(start,end<0?undefined:end);}
function shell(name){return step(name).split('        run: |\n')[1].split('\n').map(l=>l.replace(/^          /,'')).join('\n');}
const first=shell('RUC-Basis und laufendes Release gegen aktuellen MID-Stable-Stand prüfen');
const second=shell('MID-Stable und Releasefenster unmittelbar vor dem Pages-Publish erneut prüfen');
const root=mkdtempSync(join(tmpdir(),'mid-ruc-guards-'));
function guard(script,{main='0.9.85.344',stable='0.9.85.344',head='b'.repeat(40),expected='a'.repeat(40)}={}){
 const bin=join(root,'bin');mkdirSync(bin,{recursive:true});
 writeFileSync(join(root,'package.json'),JSON.stringify({version:stable}));
 writeFileSync(join(bin,'git'),`#!/bin/sh\ncase "$1" in\n fetch) exit 0;;\n rev-parse) printf '%s\\n' '${head}';;\n show) printf '%s\\n' '${JSON.stringify({version:main})}';;\n *) exit 99;;\nesac\n`,{mode:0o755});
 const output=join(root,'output');writeFileSync(output,'');
 execFileSync('bash',['-c',script],{cwd:root,encoding:'utf8',env:{...process.env,PATH:bin+':'+process.env.PATH,GITHUB_OUTPUT:output,GITHUB_STEP_SUMMARY:join(root,'summary'),EXPECTED_STABLE_SHA:expected}});
 return readFileSync(output,'utf8');
}
try{
 // Compatible old producer/new consumer is admitted only with the subsequent
 // mandatory contract/byte/JS gates; current app version still controls the shell.
 assert.match(guard(first),/allowed=true/);assert.match(guard(first),new RegExp('consumer_sha='+'b'.repeat(40)));
 assert.match(guard(first,{main:'0.9.85.345'}),/allowed=false/);
 assert.match(guard(first,{main:''}),/allowed=false/);
 assert.match(guard(second,{expected:'b'.repeat(40)}),/allowed=true/);
 assert.match(guard(second,{expected:'b'.repeat(40),head:'c'.repeat(40)}),/allowed=false/);
 assert.match(guard(second,{expected:'b'.repeat(40),main:'0.9.85.345'}),/allowed=false/);
 const admission=workflow.indexOf('name: Vollständige Snapshot-Wiederzulassung mit aktuellem Stable-Datenvertrag'),compose=workflow.indexOf('name: MID-Seite mit aktuellem Stable-Stand und RUC-Snapshot zusammensetzen');
 assert.ok(admission>0&&admission<compose,'Immutable bytes/contract must be checked before composing the current shell');
 assert.match(step('Vollständige Snapshot-Wiederzulassung mit aktuellem Stable-Datenvertrag'),/verify_prepared_snapshot\.mjs/);
 assert.match(step('MID-Stable und Releasefenster unmittelbar vor dem Pages-Publish erneut prüfen'),/EXPECTED_STABLE_SHA: \$\{\{ steps\.stable_guard\.outputs\.consumer_sha \}\}/);
 assert.match(step('Bereits geprüften Snapshot ohne fachliche Neuberechnung laden'),/digest-mismatch: error/);
 // upload-artifact v7 excludes hidden roots/files even when explicitly named.
 assert.match(step('Unveränderlichen RUC-Kern für getrennte Aufbereitung sichern'),/path: \.\/ruc-core-checkpoint/);
 assert.ok(!workflow.includes('path: .ruc-timings.jsonl'));assert.ok(!workflow.includes('path: .ruc-workflow-timings.json'));
 assert.ok(workflow.includes('mv .ruc-out ruc-core-checkpoint'));
 assert.ok(readFileSync('tools/ruc/report_workflow_timings.py','utf8').includes("Path('ruc-workflow-timings.json')"));
 assert.match(step('Neuesten vollständigen RUC\/RUC-EPS-Lauf laden und dekodieren'),/steps\.freshness\.outputs\.should_run == 'true'/);
}finally{rmSync(root,{recursive:true,force:true});}
console.log('RUC lifecycle: real codec/replay/ancestry/integrity tests; timeout/descendant cleanup; release-window and exact consumer-SHA guards passed.');
