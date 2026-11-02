import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('worker-src/00-core-observations.js'),merged=read('worker.js'),proxy=read('worker/metar-proxy.js');
const weather=read('src/weather-src/00-types-models-search.tsfrag'),generated=read('src/weather.ts');
const fnMatch=source.match(/function geosphereAromeRunAdmissible\(metadata,now=Date\.now\(\)\)\{[^}]+\}/);
assert(fnMatch,'A strict time-provenance guard is required');
const admits=runInNewContext('('+fnMatch[0]+')',{Date,Number,String});
const now=Date.parse('2026-11-05T12:00:00Z');
for(const hours of [0,3,7.5,11.99])assert(admits({initialisationTime:new Date(now-hours*3600000).toISOString()},now),'A confirmed recent cycle is valid');
for(const x of [{}, {initialisationTime:'invalid'}, {initialisationTime:new Date(now-12.01*3600000).toISOString()}, {initialisationTime:new Date(now+31*60000).toISOString()}])assert.equal(admits(x,now),false,'Missing, stale or future cycle must fail closed');
for(const content of [source,merged,proxy]){
 assert.match(content,/id:'geosphere_arome'.*optionalCapability:true/,'AROME must be a single-model capability, not part of a fragile shared batch');
 assert.match(content,/const batchModels=models\.filter\(model=>!model\.directOnly&&!model\.optionalCapability\)/,'Shared MultiDomains request must exclude failing models');
 assert.match(content,/if\(!geosphereAromeRunAdmissible\(evidence\)\)/,'An HTTP 200 must not count without original-run freshness');
 assert.match(content,/byId\.set\('geosphere_arome',\{\.\.\.arome,successful:false,days:\[\],hours:\[\],runFreshness:0/,'No stale-model contribution or synthetic 0');
 assert.doesNotMatch(content,/apiIds:\['geosphere_claef_austria'\]/,'Unavailable C-LAEF must not be called in production');
}
for(const content of [weather,generated])assert.match(content,/candidate\.id==='geosphere_arome_austria'&&Date\.now\(\)-modelMetaEpochMs\(data\.last_run_initialisation_time\)>12\*3600000/,'Frontend model-run badge must reject stale AROME');
assert.match(source,/results=modelFetch\.results,successful=results\.filter\(result=>result\.successful\)/,'Only successfully admitted sources enter the canonical fusion');
console.log('Open-Meteo GeoSphere AROME retirement: isolated, metadata-bound, 12h strict freshness, C-LAEF fail-closed, mirrors checked.');
