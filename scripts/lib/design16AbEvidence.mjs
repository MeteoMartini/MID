/**
 * MID Design 1.6 — independent, fail-closed comparison of existing SHA-bound
 * static startup and module-only Chromium evidence for TWO built trees.
 *
 * This does not measure a full app, assert a memory saving, determine a leak,
 * or authorize release. The caller must verify BOTH complete dist fingerprints.
 */
const SHA40=/^[a-f0-9]{40}$/;
const SHA64=/^[a-f0-9]{64}$/;

function fail(message){throw Error('MID Design 1.6 A/B provenance: '+message)}
function object(value,label){
 if(!value||typeof value!=='object'||Array.isArray(value))fail(label+' must be an object');
 return value;
}
function count(value,label){
 if(!Number.isSafeInteger(value)||value<0)fail(label+' must be a finite, nonnegative integer');
 return value;
}
function finite(value,label){
 if(typeof value!=='number'||!Number.isFinite(value))fail(label+' must be a finite measurement, not missing data or NaN');
 return value;
}
function nonempty(value,label){
 if(typeof value!=='string'||!value.trim())fail(label+' must be nonempty');
 return value;
}
function identity(value,label,expectedSha){
 const id=object(value,label);
 if(id.schema!==undefined&&id.schema!=='mid.web-build-identity.v1')fail(label+' has unexpected build-identity schema');
 if(!SHA40.test(id.sourceGitSha??'')||id.sourceGitSha!==expectedSha)fail(label+' has missing/mismatched full source SHA');
 if(!SHA64.test(id.assetsSha256??''))fail(label+' has missing/full-dist fingerprint');
 if(!/^\d+\.\d+\.\d+\.\d+$/.test(id.version??''))fail(label+' version is invalid');
 return id;
}
function validateSide(input,label,expectedSha){
 const side=object(input,label);
 const build=identity(side.buildIdentity,label+'.buildIdentity',expectedSha);
 const startup=object(side.startup,label+'.startup');
 if(startup.schema!=='mid.static-startup-assets.v1')fail(label+' has unsupported startup schema');
 const prov=object(startup.provenance,label+'.startup.provenance');
 const recorded=identity(prov.buildIdentity,label+'.startup.buildIdentity',expectedSha);
 if(prov.version!==build.version||recorded.version!==build.version||recorded.assetsSha256!==build.assetsSha256)
  fail(label+' startup report belongs to a different dist');
 if(!String(startup.scope??'').includes('HTML-referenced startup assets'))
  fail(label+' startup report has a different/unknown measurement scope');
 const css=object(startup.css,label+'.startup.css'),js=object(startup.js,label+'.startup.js');
 const startupMeasurements={
  initialCssRaw:count(css.bytes,label+'.css.bytes'),
  initialCssGzip:count(css.gzipBytes,label+'.css.gzipBytes'),
  initialJsRaw:count(js.bytes,label+'.js.bytes'),
  initialJsGzip:count(js.gzipBytes,label+'.js.gzipBytes'),
 };
 if(startupMeasurements.initialCssRaw===0||startupMeasurements.initialJsRaw===0)
  fail(label+' built app has empty startup assets');
 const map=object(side.mapModule,label+'.mapModule');
 if(map.schema!=='mid.prefetch.chrome-module-evidence.v1')fail(label+' has unsupported map probe schema');
 const mapIdentity=identity(map.identity,label+'.mapModule.identity',expectedSha);
 if(mapIdentity.version!==build.version||mapIdentity.assetsSha256!==build.assetsSha256)
  fail(label+' map probe belongs to a different dist');
 const noImport=object(map.noImport,label+'.mapModule.noImport');
 if(noImport.productionMapJsRequests!==0||count(noImport.waitMs,label+'.waitMs')<1000)
  fail(label+' does not prove the no-import control interval');
 const warm=object(map.warmImport,label+'.mapModule.warmImport');
 const warmMeasurements={
  mapJsRequests:count(warm.requestCount,label+'.mapJsRequests'),
  mapJsGzip:count(warm.gzipBodyBytes,label+'.mapJsGzip'),
  mapCssRequests:count(warm.cssRequestCount,label+'.mapCssRequests'),
  mapCssGzip:count(warm.cssGzipBodyBytes,label+'.mapCssGzip'),
  moduleOnlyImportMs:finite(warm.importElapsedMs,label+'.moduleOnlyImportMs'),
  moduleOnlyPostGcHeapDelta:finite(warm.postGcHeapDelta,label+'.moduleOnlyPostGcHeapDelta'),
 };
 if(warmMeasurements.mapJsRequests<4||warmMeasurements.mapCssRequests<1||
    warmMeasurements.mapJsGzip<1||warmMeasurements.mapCssGzip<1||warmMeasurements.moduleOnlyImportMs<0)
  fail(label+' has missing/failing module import workload');
 if(!Array.isArray(warm.files)||warm.files.length!==warmMeasurements.mapJsRequests||
    !Array.isArray(warm.cssFiles)||warm.cssFiles.length!==warmMeasurements.mapCssRequests)
  fail(label+' request inventory is missing or incomplete');
 if(warm.files.reduce((n,item)=>n+count(item?.gzipBodyBytes,label+'.mapJsFile'),0)!==warmMeasurements.mapJsGzip||
    warm.cssFiles.reduce((n,item)=>n+count(item?.gzipBodyBytes,label+'.mapCssFile'),0)!==warmMeasurements.mapCssGzip)
  fail(label+' per-file gzip inventory does not sum to headline');
 return {
  sourceGitSha:build.sourceGitSha,version:build.version,assetsSha256:build.assetsSha256,
  moduleProbeMethod:nonempty(map.method,label+'.mapModule.method'),waitMs:noImport.waitMs,
  ...startupMeasurements,...warmMeasurements,
 };
}
function delta(a,b){return{stable:a,candidate:b,delta:b-a,percentOfStable:a===0?null:Math.round((b-a)/a*10000)/100}}
/**
 * All reported differences are DESCRIPTIVE. Even a matching method string does
 * not attest equal hardware, CI environment, active meteorology, GPU, or cache.
 */
export function compareDesign16Evidence({stable,candidate,expectedStableSha,expectedCandidateSha}){
 if(!SHA40.test(expectedStableSha??'')||!SHA40.test(expectedCandidateSha??''))
  fail('both expected Git SHAs must have full 40-character format');
 if(expectedStableSha===expectedCandidateSha)fail('stable and candidate SHAs must be different');
 const left=validateSide(stable,'stable',expectedStableSha);
 const right=validateSide(candidate,'candidate',expectedCandidateSha);
 if(left.moduleProbeMethod!==right.moduleProbeMethod||left.waitMs!==right.waitMs)
  fail('the module-only probes use different methods or control intervals');
 const metrics={};
 for(const key of ['initialCssRaw','initialCssGzip','initialJsRaw','initialJsGzip','mapJsRequests',
  'mapJsGzip','mapCssRequests','mapCssGzip','moduleOnlyImportMs','moduleOnlyPostGcHeapDelta']){
  metrics[key]=delta(left[key],right[key]);
 }
 return {
  schema:'mid.design16.readonly-ab-evidence.v1',
  status:'DESCRIPTIVE_ONLY_FULL_APP_AB_MISSING',
  releaseAuthorized:false,performanceGainProven:false,leakFixedProven:false,
  scope:'Two exact-dist-fingerprint-verified static/startup and isolated module-import inventories; NO full-app A/B',
  stable:{sourceGitSha:left.sourceGitSha,version:left.version,assetsSha256:left.assetsSha256},
  candidate:{sourceGitSha:right.sourceGitSha,version:right.version,assetsSha256:right.assetsSha256},
  measurementMethod:left.moduleProbeMethod,
  reasons:[
   'No verified equal-browser/equal-host/equal-VITE_* build and fixture attestation',
   'No repeated randomized cold/warm complete-dashboard samples or first-map-tap UX',
   'No Service Worker/offline, 20-cycle post-GC, CSS computed-style or native iOS/WebKit verification',
   'CDP JavaScript-isolate heap is not retained system memory, GPU memory or a leak verdict',
  ],
  metrics,
 };
}
