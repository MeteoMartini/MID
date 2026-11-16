/** Strict full-page Chromium lab probe policy: observations are not A/B proof. */
import {createHash} from 'node:crypto';
const sha40=/^[a-f0-9]{40}$/;
const sha64=/^[a-f0-9]{64}$/;
function fail(msg){throw Error('MID full-app browser QA: '+msg)}
function obj(v,label){if(!v||typeof v!=='object'||Array.isArray(v))fail(label+' must be an object');return v}
function finite(v,label){if(typeof v!=='number'||!Number.isFinite(v)||v<0)fail(label+' missing/nonfinite/negative');return v}
function integer(v,label){if(!Number.isSafeInteger(v)||v<0)fail(label+' missing/negative/noninteger');return v}
export function validateFullAppFixture(value){
 const v=obj(value,'fixture'),loc=obj(v.location,'fixture.location');
 if(typeof loc.name!=='string'||!loc.name.trim()||loc.name.length>160)fail('location name must be nonempty, bounded');
 if(typeof loc.latitude!=='number'||!Number.isFinite(loc.latitude)||Math.abs(loc.latitude)>90||
    typeof loc.longitude!=='number'||!Number.isFinite(loc.longitude)||Math.abs(loc.longitude)>180)
   fail('location coordinates must be finite latitude/longitude');
 if(typeof loc.timezone!=='string'||!/^[A-Za-z_]+(?:\/[A-Za-z0-9_+\-]+)+$/.test(loc.timezone)||loc.timezone.length>80)
   fail('fixture requires IANA-style timezone');
 if(v.theme!=='light'&&v.theme!=='dark')fail('theme must be light or dark');
 if(typeof v.priorMapIntent!=='boolean')fail('priorMapIntent must be an explicit boolean');
 // Fixture is deliberately *only* local UI configuration, no credentials/API mocks.
 if(Object.keys(v).some(k=>!['location','theme','priorMapIntent'].includes(k)))fail('unexpected fixture properties');
 const canonical=JSON.stringify({location:loc,theme:v.theme,priorMapIntent:v.priorMapIntent});
 return {location:loc,theme:v.theme,priorMapIntent:v.priorMapIntent,
  fixtureSha256:createHash('sha256').update(canonical).digest('hex')};
}
export function validateFullAppSample(value){
 const row=obj(value,'sample');
 if(row.mapReady!==true||row.realPointerEvent!==true)fail('map or actual CDP pointer event not observed');
 for(const name of ['fcpMs','firstMapPointerToVisibleMs','postGcHeapBeforeBytes','postGcHeapAfterBytes'])finite(row[name],name);
 for(const name of ['initialJsRequests','initialCssRequests','totalJsRequests','totalCssRequests',
  'initialJsEncodedBytes','initialCssEncodedBytes','totalJsEncodedBytes','totalCssEncodedBytes',
  'externalRequestsObserved','runtimeExceptionsObserved'])integer(row[name],name);
 if(row.totalJsRequests<row.initialJsRequests||row.totalCssRequests<row.initialCssRequests||
   row.totalJsEncodedBytes<row.initialJsEncodedBytes||row.totalCssEncodedBytes<row.initialCssEncodedBytes)
  fail('network totals smaller than initial network snapshot');
 if(row.totalJsRequests===0||row.initialCssRequests===0||row.firstMapPointerToVisibleMs>120_000)
  fail('missing actual application resource or interaction evidence');
 if(row.cacheMode!=='cold'&&row.cacheMode!=='warm')fail('unknown cache mode');
 return row;
}
export function assembleFullAppEvidence({identity,browserVersion,fixtureSha256,samples}){
 const id=obj(identity,'build identity');
 if(!sha40.test(id.sourceGitSha??'')||!sha64.test(id.assetsSha256??'')||!/^\\d+\\.\\d+\\.\\d+\\.\\d+$/.test(id.version??''))
  fail('missing exact source/build identity');
 if(!sha64.test(fixtureSha256??''))fail('fixture hash must be exact SHA256');
 if(typeof browserVersion!=='string'||!browserVersion.includes('Chrome/'))fail('browser version unverified');
 if(!Array.isArray(samples)||samples.length!==2)fail('exact cold and warm samples required');
 const [cold,warm]=samples.map(validateFullAppSample);
 if(cold.cacheMode!=='cold'||warm.cacheMode!=='warm')fail('incorrect cold/warm sample ordering');
 return {
  schema:'mid.design16.full-app-chromium-lab.v1',status:'UNCONTROLLED_PROVIDER_LAB_OBSERVATION',
  releaseAuthorized:false,fullAppAbProven:false,memoryLeakVerdict:false,
  identity:{sourceGitSha:id.sourceGitSha,version:id.version,assetsSha256:id.assetsSha256},
  browserVersion,fixtureSha256,
  caveats:[
   'Complete MID production page loaded and map tapped, but weather responses were not fixture-controlled',
   'Two samples on one browser/host are not a randomized Stable-versus-Candidate A/B',
   'No Service Worker/offline, original-network, 20-cycle, WebKit/iOS, VoiceOver or GPU memory proof',
   'Runtime.getHeapUsage measures a JavaScript isolate, not total browser, GPU or device memory',
   'Pointer-to-visible-map is a lab interaction milestone and is not field INP',
  ],
  samples,
 };
}

/** Compare real-page *lab observations* only if their declared conditions agree. */
export function compareFullAppLabEvidence({stable,candidate}){
 const a=obj(stable,'stable report'),b=obj(candidate,'candidate report');
 if(a.schema!=='mid.design16.full-app-chromium-lab.v1'||b.schema!==a.schema||
    a.status!=='UNCONTROLLED_PROVIDER_LAB_OBSERVATION'||b.status!==a.status)
  fail('both inputs must be completed real-page laboratory observations');
 if(!sha40.test(a.identity?.sourceGitSha??'')||!sha40.test(b.identity?.sourceGitSha??'')||
    a.identity.sourceGitSha===b.identity.sourceGitSha||
    !sha64.test(a.identity?.assetsSha256??'')||!sha64.test(b.identity?.assetsSha256??''))
  fail('both complete build identities and distinct source SHAs required');
 if(a.browserVersion!==b.browserVersion||!a.browserVersion?.includes('Chrome/'))
  fail('browser versions must agree exactly');
 if(!sha64.test(a.fixtureSha256??'')||a.fixtureSha256!==b.fixtureSha256)
  fail('browser scenarios must have identical full fixture fingerprints');
 if(!Array.isArray(a.samples)||!Array.isArray(b.samples)||a.samples.length!==2||b.samples.length!==2)
  fail('both complete cold/warm inventories required');
 const fields=['fcpMs','firstMapPointerToVisibleMs','initialJsEncodedBytes','initialCssEncodedBytes',
  'totalJsEncodedBytes','totalCssEncodedBytes','postGcHeapBeforeBytes','postGcHeapAfterBytes'];
 const differences={};
 for(const mode of ['cold','warm']){
  const n=mode==='cold'?0:1;
  const aa=validateFullAppSample(a.samples[n]),bb=validateFullAppSample(b.samples[n]);
  if(aa.cacheMode!==mode||bb.cacheMode!==mode)fail('cold/warm mode mismatch');
  differences[mode]=Object.fromEntries(fields.map(key=>[key,{stable:aa[key],candidate:bb[key],delta:bb[key]-aa[key]}]));
 }
 return {
  schema:'mid.design16.full-app-lab-descriptive-pair.v1',status:'ENVIRONMENT_AND_PROVIDER_PARITY_UNVERIFIED',
  releaseAuthorized:false,performanceGainProven:false,leakFixedProven:false,
  stable:a.identity,candidate:b.identity,browserVersion:a.browserVersion,fixtureSha256:a.fixtureSha256,
  limitations:['No randomized repetitions, provider-response fixture, network parity or real iOS/WebKit confirmation',
   'Lab mouse/touch-to-visible canvas is not field INP or meteorological layer readiness',
   'Runtime JS-isolate post-GC heap is not total browser, GPU, or retained native memory'],
  differences,
 };
}
