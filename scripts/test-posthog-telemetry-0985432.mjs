import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [source,app,main]=await Promise.all([
 readFile(path.join(root,'src/posthogTelemetry.ts'),'utf8'),
 readFile(path.join(root,'src/App.tsx'),'utf8'),
 readFile(path.join(root,'src/main.tsx'),'utf8'),
]);
assert.match(app,/Freiwillige MID-Diagnose \(PostHog\)/);
assert.match(app,/data-mid-telemetry-section=\{tab\.id\}/);
assert.match(app,/setMidPosthogConsent\(next\)/);
assert.match(app,/posthogNotice&&<span role="status">/);
assert.match(app,/Diagnose-Auswahl konnte auf diesem Gerät nicht gespeichert werden/);
assert.match(main,/startMidPosthogTelemetry\(\)/);
assert.doesNotMatch(source,/\$current_url|\$referrer|identify\(|session_recording|autocapture:/);
assert.match(source,/\$process_person_profile:false/);
assert.match(source,/MAX_EVENTS_PER_PAGE=30/);
assert.match(source,/isMidNativeRuntime\(\)/);

function harness({consent=false,token='phc_test_project',host='https://eu.i.posthog.com',prod=true,native=false,storageWriteThrows=false,storageWriteNoop=false,storageRemoveThrows=false,uuidThrows=false}={}){
 const requests=[];
 const storage=new Map(consent?[['mid:posthog-diagnostics-consent:v1','1']]:[]);
 const listeners=new Map();
 const documentListeners=new Map();
 const add=(target,name,fn)=>{const arr=target.get(name)||[];arr.push(fn);target.set(name,arr)};
 const window={
  addEventListener:(n,fn)=>add(listeners,n,fn),
  dispatchEvent:e=>{for(const fn of listeners.get(e.type)||[])fn(e);return true;},
 };
 class FakeElement{
  constructor(section){this.dataset={midTelemetrySection:section}}
  closest(){return this}
  hasAttribute(){return false}
 }
 const document={addEventListener:(n,fn)=>add(documentListeners,n,fn)};
 const localStorage={
  getItem:k=>storage.get(k)??null,
  setItem:(k,v)=>{if(storageWriteThrows)throw new Error('Storage write denied');if(!storageWriteNoop)storage.set(k,String(v))},
  removeItem:k=>{if(storageRemoveThrows)throw new Error('Storage removal denied');storage.delete(k)},
 };
 let prepared=source.replace(/^import [^\n]*\n/gm,'').replace(/^export /gm,'');
 prepared=prepared
  .replace(/import\.meta\.env\.VITE_POSTHOG_PROJECT_TOKEN/g,JSON.stringify(token))
  .replace(/import\.meta\.env\.VITE_POSTHOG_HOST/g,JSON.stringify(host))
  .replace(/import\.meta\.env\.PROD/g,String(prod));
 prepared+='\nglobalThis.testExports={startMidPosthogTelemetry,setMidPosthogConsent,isMidPosthogConfigured,isMidPosthogConsentGranted};';
 const js=transformSync(prepared,{loader:'ts',target:'es2020',format:'iife'}).code;
 const context={
  window,document,localStorage,Element:FakeElement,Error,AbortController,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options?.detail}},
  crypto:{randomUUID:()=>{if(uuidThrows)throw new Error('Secure random ID not available');return 'ephemeral-random-id'}},performance:{now:()=>485,getEntriesByType:()=>[{domContentLoadedEventEnd:240,loadEventEnd:370}]},
  fetch:(url,options)=>{requests.push({url,options,body:JSON.parse(options.body)});return Promise.resolve({ok:true})},
  isMidNativeRuntime:()=>native,MID_VERSION:'0.9.85.432',
 };
 vm.runInNewContext(js,context,{timeout:2000});
 const captureNav=section=>{const el=new FakeElement(section);for(const fn of documentListeners.get('click')||[])fn({target:el})};
 return {...context.testExports,requests,window,captureNav,storage};
}
// Default-off must perform no network I/O.
const off=harness();off.startMidPosthogTelemetry();off.window.dispatchEvent({type:'mid:runtime-healthy'});
assert.equal(off.requests.length,0);
// Native and non-EU hosts fail closed even after an explicit opt-in.
for(const options of [{native:true},{host:'https://us.i.posthog.com'},{token:''},{prod:false}]){
 const blocked=harness({consent:true,...options});
 blocked.startMidPosthogTelemetry();blocked.captureNav('current');
 assert.equal(blocked.requests.length,0,JSON.stringify(options));
}
const live=harness({consent:true});
live.startMidPosthogTelemetry();
live.window.dispatchEvent({type:'mid:runtime-healthy'});
live.captureNav('current');live.captureNav('secret_location_name');
live.window.dispatchEvent({type:'error',error:new Error('private-location=52.1,13.2')});
live.window.dispatchEvent({type:'unhandledrejection',reason:'private search content'});
assert.equal(live.requests.length,4);
assert.deepEqual(live.requests.map(r=>r.body.event),['mid_runtime_ready','mid_navigation_attempt','mid_client_error','mid_client_error']);
for(const req of live.requests){
 assert.equal(req.url,'https://eu.i.posthog.com/i/v0/e/');
 assert.equal(req.options.credentials,'omit');
 assert.equal(req.options.referrerPolicy,'no-referrer');
 assert.equal(req.body.properties.$process_person_profile,false);
 assert.equal(req.body.distinct_id,'ephemeral-random-id');
 for(const forbidden of ['private-location','52.1','13.2','private search','latitude','longitude','current_url','referrer','favorite']){
  assert.ok(!JSON.stringify(req.body).includes(forbidden),forbidden);
 }
}
assert.equal(live.requests[0].body.properties.startup_ms,485);
assert.equal(live.requests[0].body.properties.dom_content_loaded_ms,240);
assert.equal(live.requests[1].body.properties.section,'current');
assert.equal(live.setMidPosthogConsent(false),true);
assert.equal(live.isMidPosthogConsentGranted(),false);
live.captureNav('forecast');
assert.equal(live.requests.length,4);
// A new, distinct tab in the same test gets a per-page event budget.
const bounded=harness({consent:true});bounded.startMidPosthogTelemetry();
for(let i=0;i<100;i++)bounded.captureNav('today');
assert.equal(bounded.requests.length,30);
console.log('MID opt-in PostHog: 17 assertions + event-budget/privacy testgruppen PASS');

// A stored opt-in without a configured transport must remain network silent.
for(const options of [{token:''},{native:true},{host:'https://us.i.posthog.com'}]){const blocked=harness(options);assert.equal(blocked.setMidPosthogConsent(true),true);blocked.startMidPosthogTelemetry();blocked.captureNav('current');assert.equal(blocked.requests.length,0);blocked.setMidPosthogConsent(false);assert.equal(blocked.requests.length,0)}


// iPhone-specific denial/restricted contexts: no crash, no silent opt-in, no payload.
const iosStorageBlocked=harness({storageWriteThrows:true});
assert.equal(iosStorageBlocked.setMidPosthogConsent(true),false,'denied storage must leave the checkbox uncommitted');
assert.equal(iosStorageBlocked.isMidPosthogConsentGranted(),false);
iosStorageBlocked.captureNav('current');
assert.equal(iosStorageBlocked.requests.length,0,'blocked consent cannot send data');
const iosStorageNoop=harness({storageWriteNoop:true});
assert.equal(iosStorageNoop.setMidPosthogConsent(true),false,'ignored storage write must be rejected by readback');
assert.equal(iosStorageNoop.isMidPosthogConsentGranted(),false);
assert.equal(iosStorageNoop.requests.length,0);
// Secure randomness is optional for consent storage, but mandatory for capture.
const iosNoUuid=harness({uuidThrows:true});
assert.equal(iosNoUuid.setMidPosthogConsent(true),true,'consent must be selectable even when telemetry cannot be started');
assert.equal(iosNoUuid.isMidPosthogConsentGranted(),true);
iosNoUuid.captureNav('current');
assert.equal(iosNoUuid.requests.length,0,'failed secure session ID must never cause telemetry emission');
// A failed revoke must immediately stop any current network traffic, even if persistence is blocked.
const iosRevokeBlocked=harness({consent:true,storageRemoveThrows:true});
iosRevokeBlocked.startMidPosthogTelemetry();
assert.equal(iosRevokeBlocked.setMidPosthogConsent(false),false);
iosRevokeBlocked.captureNav('current');
assert.equal(iosRevokeBlocked.requests.length,0,'failed persistent revoke must stop the current page immediately');
console.log('MID PostHog iPhone consent edge checks: blocked writes, unavailable secure ID, failed revoke fail-closed');
