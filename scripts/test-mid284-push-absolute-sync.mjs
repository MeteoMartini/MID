import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transform} from 'esbuild';

const client=readFileSync('src/pushNotifications.ts','utf8'),panel=readFileSync('src/PushSettingsPanel.tsx','utf8'),worker=readFileSync('worker-src/30-push-events.js','utf8'),aggregate=readFileSync('worker/metar-proxy.js','utf8');
assert.match(client,/let pushSaveTail:Promise<unknown>=Promise\.resolve\(\)/,'per-device push writes must be ordered');
assert.match(client,/response\.data\.timeDisplayMode!==mode/,'server must acknowledge the exact requested mode');
assert.match(client,/timeDisplayMode:serverMode/,'server status must expose the accepted mode');
assert.match(worker,/timeDisplayMode:entry\?validPushTimeDisplayMode\(entry\.timeDisplayMode\)/,'status response contains persisted mode');
assert.match(worker,/notificationIntervalMinutes,precipitationAlert,timeDisplayMode,deviceTimeZone,version:WORKER_VERSION/,'subscribe response confirms persisted mode');
assert.match(worker,/latestConfig!==evaluatedConfig/,'old scheduler tick may not clobber newer config');
assert.match(aggregate,/latestConfig!==evaluatedConfig/,'generated worker matches canonical source');
assert.match(panel,/Zeitanzeige nur auf diesem Gerät gespeichert/,'inactive subscription is not claimed as synced');
assert.match(panel,/timeDisplayMode===mode/,'UI must compare actual accepted preference');

const begin=client.indexOf('let pushSaveTail:'),end=client.indexOf('\n\nexport async function getPushStatus',begin);
assert(begin>0&&end>begin);
const code=(await transform(client.slice(begin,end),{loader:'ts',format:'cjs',target:'es2022'})).code;
let mode='relative',resolveFirst,order=[];
const context={Promise,URL,JSON,Error,readPushTimeDisplayMode:()=>mode,workerPost:(_,body)=>{
 order.push(body.timeDisplayMode);
 if(order.length===1)return new Promise(resolve=>{resolveFirst=()=>resolve({data:{ok:true,timeDisplayMode:'relative'}})});
 return Promise.resolve({data:{ok:true,timeDisplayMode:body.timeDisplayMode}});
},serialiseSubscription:()=>({endpoint:'https://push.example/test'}),activeFavorites:x=>x,document:{baseURI:'https://example.com/MID/'},navigator:{userAgent:'MID Regression'}};
vm.createContext(context);vm.runInContext(code+';globalThis.saveSubscription=saveSubscription;',context);
const args=[{},[],60,{leadMinutes:60,minimumAmountMm:.1,minimumDurationMinutes:0},null];
const first=context.saveSubscription(...args);
for(let i=0;i<8&&!order.length;i++)await Promise.resolve();
assert.deepEqual(order,['relative']);
mode='absolute';const second=context.saveSubscription(...args);
await Promise.resolve();assert.deepEqual(order,['relative'],'new write must wait until previous write has finished');
resolveFirst();await Promise.all([first,second]);
assert.deepEqual(order,['relative','absolute'],'the latest preference must win on the worker');
console.log('MID .284: push time mode race, server acknowledgement, UI status, and worker scheduler write protection checked.');
