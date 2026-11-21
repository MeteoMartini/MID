import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const source=readFileSync(new URL('../../src/App.tsx',import.meta.url),'utf8');
const blob=createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0'+source).digest('hex');
const helper=fileURLToPath(new URL('./design20SettingsTabSplit.mjs',import.meta.url));
// Post-integration contract: the old unmodified App.tsx must NEVER pass.
const run=()=>JSON.parse(execFileSync(process.execPath,[helper,'--check-after'],{encoding:'utf8'}).trim());
const first=run(),second=run();
assert.deepEqual(first,second,'Repeated verification must be deterministic, with no writes, timers or external services.');
assert.equal(first.sha??first.baseBlob,blob);
assert.equal(first.result,'PASS-after','The actual deployed settings JSX gates are required.');
assert.equal(first.checks.groups,11);
assert.equal(first.checks.items,9);
for(const id of ['view','weather','navigation','units','favorites','notifications','quality','sync','system']){
 assert.ok(source.includes("['"+id+"','"),'Existing settings route lost: '+id);
}
assert.ok(source.includes("type SettingsSection='view'|'weather'|'navigation'|'units'|'notifications'|'favorites'|'quality'|'sync'|'system'"));
assert.ok(source.includes("const navigationMode:NavigationMode='bottom-tabs';"));
assert.ok(source.includes("const forecastCockpitEnabled=true;"));
console.log('MID Design20: Settings split strict postpatch and 9 routes accepted; no app write performed.');
