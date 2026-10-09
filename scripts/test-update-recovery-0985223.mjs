import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const worker=fs.readFileSync('public/service-worker.js','utf8');
const updater=fs.readFileSync('src/v078.ts','utf8');
const pwa=fs.readFileSync('src/pwa.ts','utf8');
const retry=worker.slice(worker.indexOf('function retryRollbackVersion'),worker.indexOf('async function rollbackDocument'));
function fixture(mode){
 let timer,posted,closed=false,navigation;const status={textContent:''},button={disabled:false,textContent:''};
 const scope={document:{getElementById:()=>status},navigator:{serviceWorker:{controller:mode==='missing'?null:{postMessage(message){posted=message;if(mode==='throw')throw Error('disconnected')}}}},URL,location:{href:'https://example.test/',replace:url=>navigation=url},setTimeout(fn){timer=fn;return 1},clearTimeout(){},MessageChannel:class{constructor(){this.port1={close(){closed=true}};this.port2={};scope.channel=this}}};
 vm.runInNewContext(retry+'\nretryRollbackVersion(button)',{...scope,button,MessageChannel:scope.MessageChannel});
 return {button,status,timeout:()=>timer(),reply:data=>scope.channel.port1.onmessage({data}),get posted(){return posted},get closed(){return closed},get navigation(){return navigation}};
}
for(const mode of ['missing','throw']){const f=fixture(mode);assert.equal(f.button.disabled,false);assert.ok(f.status.textContent);assert.equal(f.navigation,undefined)}
const lost=fixture('lost');assert.equal(lost.button.disabled,true);assert.equal(lost.posted.type,'MID_USE_CURRENT');lost.timeout();assert.equal(lost.button.disabled,false);assert.ok(lost.closed);assert.match(lost.status.textContent,/Keine Antwort/);lost.reply({ok:true});assert.equal(lost.navigation,undefined,'late replies must not navigate after failure');
const rejected=fixture('lost');rejected.reply({ok:false,error:'Cache unvollständig'});assert.equal(rejected.button.disabled,false);assert.equal(rejected.status.textContent,'Cache unvollständig');assert.equal(rejected.navigation,undefined);
const accepted=fixture('lost');accepted.reply({ok:true});assert.match(accepted.navigation,/mid-retry=/);assert.ok(accepted.closed);
assert.ok(updater.includes("if(status.workerVersion===version){if(status.activeVersion!==version)await retryMidCurrentVersion()"));
assert.ok(updater.includes('await retryMidCurrentVersion()'));
assert.ok(updater.includes("strong.textContent=statusText?'MID-Update noch nicht aktiviert':'Neue MID-Version verfügbar'"));
assert.ok(updater.includes('if(dismissedVersion===remote)return'));
assert.ok(updater.includes("window.addEventListener('online'"));
assert.ok(pwa.includes('if(automatic&&waiting&&navigator.serviceWorker.controller)'));
assert.ok(!worker.includes('await navigator.serviceWorker.ready'),'rollback retry must not wait indefinitely for ready');
assert.ok(worker.includes('htmlVersion!==VERSION')&&worker.includes('(await descriptor.json()).version!==VERSION'));
assert.equal(worker,fs.readFileSync('public/sw.js','utf8'));
console.log('Update recovery: missing controller, thrown send, lost/late/rejected/successful replies, explicit retry, version consistency, online retry and activation preference verified.');

const cacheShell=worker.slice(worker.indexOf('async function cacheShell'),worker.indexOf('async function activeCacheName'));
const version=worker.match(/const CACHE='mid-shell-v([^']+)'/)[1];
async function shellFixture(htmlVersion,descriptorVersion){
 const entries=new Map();let deleted=false;
 const context={VERSION:version,CACHE:'shell',CORE:['./','./index.html','./version.json'],URL,Response,self:{registration:{scope:'https://example.test/'}},caches:{open:async()=>({put:async(k,v)=>entries.set(k,v),match:async k=>entries.get(k)}),delete:async()=>{deleted=true;entries.clear()}},fetchAsset:async()=>new Response(`<meta name="mid-version" content="${htmlVersion}">`),cacheAssetsConcurrently:async cache=>cache.put('https://example.test/version.json',new Response(JSON.stringify({version:descriptorVersion}))),sameScopeAsset:()=>null};
 vm.runInNewContext(cacheShell,context);return {run:()=>context.cacheShell(),entries,get deleted(){return deleted}};
}
for(const mismatch of [[version,'old'],['old',version]]){const f=await shellFixture(...mismatch);await assert.rejects(f.run());assert.equal(f.deleted,true);assert.equal(f.entries.size,0)}
const valid=await shellFixture(version,version);await valid.run();assert.ok(valid.entries.has('https://example.test/__mid_shell_valid__.json'));
const useCurrent=worker.slice(worker.indexOf('async function useCurrentCache'),worker.indexOf('async function setHealthy'));
let switched=false;const context={CACHE:'shell',VERSION:version,URL,self:{registration:{scope:'https://example.test/'}},caches:{open:async()=>({match:async()=>undefined})},prepareUpdate:async()=>{switched=true},writeMeta:async()=>{}};
vm.runInNewContext(useCurrent,context);await assert.rejects(context.useCurrentCache());assert.equal(switched,false,'incomplete cache must not change active metadata');
console.log('Shell integrity: stale HTML/descriptor rejected with cleanup; matched shell accepted; missing marker cannot change active cache.');

// Execute the production page branch with confirmed/missing/new worker states.
const reloadSource=updater.slice(updater.indexOf('async function performReloadForVersion'),updater.indexOf('function removeUpdateNotice')).replace('version:string','version').replace(':ServiceWorkerRegistration[]','');
async function pageFixture(workerVersion,activeVersion,rejectRetry=false){
 let retryCount=0,navigation,retries=0;
 const context={URL,location:{href:'https://example.test/',replace:value=>navigation=value},navigator:{serviceWorker:{controller:{}}},recentReloadAttempt:()=>false,markReloadAttempt(){},setUpdateNoticeBusy(){},getMidUpdateStatus:async()=>({workerVersion,activeVersion}),retryMidCurrentVersion:async()=>{retryCount++;if(rejectRetry)throw Error('incomplete cache')},midRegistrationsWithBudget:async()=>[],clearReloadAttempt(){},removeUpdateNotice(){},showUpdateNotice(){},scheduleActivationRetry(){retries++},UPDATE_DISCOVERY_RETRY_MS:12000};
 vm.runInNewContext(reloadSource,context);await context.performReloadForVersion('new');return {retryCount,navigation,retries};
}
const rollbackPage=await pageFixture('new','old');assert.equal(rollbackPage.retryCount,1);assert.match(rollbackPage.navigation,/mid-retry=new/);
const alreadyActive=await pageFixture('new','new');assert.equal(alreadyActive.retryCount,0);assert.match(alreadyActive.navigation,/mid-retry=new/);
const oldController=await pageFixture('old','old');assert.equal(oldController.navigation,undefined);assert.equal(oldController.retries,1);
const rejectedSwitch=await pageFixture('new','old',true);assert.equal(rejectedSwitch.navigation,undefined);assert.equal(rejectedSwitch.retries,1);
console.log('Page recovery: loaded rollback shell and already-active new controller navigate; old controller and rejected switch remain stable.');

const messageSource=worker.slice(worker.indexOf("self.addEventListener('message'"),worker.indexOf("self.addEventListener('push'"));
let handler,prepared=0,skipped=0,replyData,pending;
const messageContext={VERSION:version,self:{addEventListener:(name,fn)=>handler=fn,skipWaiting:async()=>{skipped++}},prepareUpdate:async()=>{prepared++},reply:(event,data)=>replyData=data};
vm.runInNewContext(messageSource,messageContext);
handler({data:{type:'MID_ACTIVATE_UPDATE',version:'wrong-version'},waitUntil:promise=>pending=promise});await pending;assert.equal(replyData.ok,false);assert.equal(prepared,0);assert.equal(skipped,0);
handler({data:{type:'MID_ACTIVATE_UPDATE',version},waitUntil:promise=>pending=promise});await pending;assert.equal(replyData.ok,true);assert.equal(prepared,1);assert.equal(skipped,1);
console.log('Activation request: wrong release rejected before metadata/skipWaiting; matching version accepted.');

if(process.env.GITHUB_ACTIONS==='true')await import('./verify-update-recovery-browser-0985223.mjs');
