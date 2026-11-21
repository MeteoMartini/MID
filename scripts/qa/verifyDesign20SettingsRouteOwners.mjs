import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const source=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
const blob=createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0'+source).digest('hex');
const base='d5fd0cee5c6cf8df187f3493c864d136ab11bcd9';
const helper=new URL('./design20SettingsTabSplit.mjs',import.meta.url);
const state=blob===base?'--selftest':'--check-after';
const run=()=>JSON.parse(execFileSync(process.execPath,[helper.pathname,state],{encoding:'utf8'}).trim());
const first=run(),second=run();
assert.deepEqual(first,second,'Repeated verification must be deterministic, with no writes, timers or external services.');
assert.equal(first.sha??first.baseBlob,blob);
if(state==='--selftest'){
 assert.equal(first.result,'PASS-dry-run');
 assert.ok(first.proposedBlob&&first.proposedBlob!==blob);
 assert.equal(first.writes,0);
 assert.equal(first.tabOwnerGroups,13);
 assert.ok(first.deltaBytes>=200&&first.deltaBytes<=500);
}else{
 assert.equal(first.result,'PASS-after');
 assert.equal(first.checks.groups,11);
 assert.equal(first.checks.items,9);
}
for(const id of ['view','weather','navigation','units','favorites','notifications','quality','sync','system']){
 assert.ok(source.includes("['"+id+"','"),'Existing settings route lost: '+id);
}
assert.ok(source.includes("type SettingsSection='view'|'weather'|'navigation'|'units'|'notifications'|'favorites'|'quality'|'sync'|'system'"));
assert.ok(source.includes("const navigationMode:NavigationMode='bottom-tabs';"));
assert.ok(source.includes("const forecastCockpitEnabled=true;"));
console.log('MID Design20: Settings split dry-run/postcheck and 9 routes accepted; no app write performed.');
