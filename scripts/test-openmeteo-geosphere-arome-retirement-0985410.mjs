import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
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
 assert.doesNotMatch(content,/apiIds:\['geosphere_claef_austria'\]/,'C-LAEF requires the separate multi-run/field/height qualification before production');
}
for(const content of [weather,generated])assert.match(content,/candidate\.id==='geosphere_arome_austria'&&Date\.now\(\)-modelMetaEpochMs\(data\.last_run_initialisation_time\)>12\*3600000/,'Frontend model-run badge must reject stale AROME');
assert.match(source,/results=modelFetch\.results,successful=results\.filter\(result=>result\.successful\)/,'Only successfully admitted sources enter the canonical fusion');
// Exercise the actual selectors and fetch entrypoints: even fresh historic AROME
// metadata or a pre-sunset cache must not revive a discontinued forecast source.
const ts=createRequire(import.meta.url)('typescript-strada');
function selected(code,names){
 const ast=ts.createSourceFile('qa.ts',code,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS),wanted=new Set(names);
 return ast.statements.filter(node=>ts.isFunctionDeclaration(node)&&wanted.has(node.name?.text)||ts.isVariableStatement(node)&&node.declarationList.declarations.some(x=>wanted.has(x.name.getText(ast)))).map(x=>x.getText(ast)).join('\n');
}
let networkCalls=0;
const noNetwork=()=>{networkCalls++;throw new Error('Retired AROME reached the network')};
function runtime(code,names,expose,extra={}){
 const sandbox={exports:{},console,URL,URLSearchParams,fetch:noNetwork,fetchWithDeadline:noNetwork,fetchWorkerJson:noNetwork,j:noNetwork,...extra};
 const compiled=ts.transpileModule(selected(code,names)+`\nglobalThis.qa={${expose.join(',')}};`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 runInNewContext(compiled,sandbox);return sandbox.qa;
}
const frontend=runtime(weather,['forecastCandidates','candidateApplies','modelRunMeta'],['forecastCandidates','candidateApplies','modelRunMeta']);
const ar=frontend.forecastCandidates.find(x=>x.id==='geosphere_arome_austria');
assert.equal(ar.retired,true,'Keep historical identity explicitly retired');
assert.equal(frontend.candidateApplies(ar,47.27,11.39,'AT'),false);
assert.equal(await frontend.modelRunMeta(ar),null,'No metadata fetch, even if the retired ID is passed directly');
assert(frontend.forecastCandidates.some(x=>x.id==='dwd_icon_d2'&&frontend.candidateApplies(x,47.27,11.39,'AT')),'Austrian regional fallback retained');
const specialized=runtime(read('src/weather-src/10-observations-specialized.tsfrag'),['hyperlocalBackgroundModelCandidates'],['hyperlocalBackgroundModelCandidates'],{countryCodeFromLocation:x=>x});
assert.equal(specialized.hyperlocalBackgroundModelCandidates({country_code:'AT'}).join(','),'dwd_icon_d2,best_match');
const mountain=runtime(read('src/mountainSports.ts'),['MOUNTAIN_REGIONAL_MODELS','mountainCountryCode','mountainRegionalModel'],['mountainRegionalModel']);
assert.equal(mountain.mountainRegionalModel({country_code:'AT',latitude:47.27,longitude:11.39}),undefined,'Retired mountain enrichment must not fetch');
assert.equal(mountain.mountainRegionalModel({country_code:'CH',latitude:46.9,longitude:8.3}).id,'meteoswiss_icon_ch1');
const worker=runtime(source,['FORECAST_FUSION_EUROPE','FORECAST_FUSION_MODELS','fusionModelApplies','forecastFusionSelection','fetchForecastFusionModel','fetchForecastFusionModels','mapConcurrent'],['forecastFusionSelection','fetchForecastFusionModel','fetchForecastFusionModels']);
const plan=worker.forecastFusionSelection(47.27,11.39,'AT');
assert(!plan.some(x=>x.id==='geosphere_arome'));
assert(plan.some(x=>x.anchor),'Canonical Best Match anchor remains available');
assert(plan.some(x=>x.apiIds?.includes('dwd_icon_d2')),'DWD fallback remains available');
const injected={id:'geosphere_arome',apiIds:['geosphere_arome_austria']};
const rejected=await worker.fetchForecastFusionModel(injected,47.27,11.39,590,{});
assert.equal(rejected.successful,false);assert.equal(rejected.days.length,0);assert.equal(rejected.hours.length,0);
assert.equal((await worker.fetchForecastFusionModels([injected],47.27,11.39,590,{})).results.length,0,'No batch or fallback request for a retired model');
const phase=runtime(read('worker-src/20-composite-models.js'),['RAPID_PHASE_MODELS','phaseModelApplies','phaseModelMetadata'],['RAPID_PHASE_MODELS','phaseModelApplies','phaseModelMetadata'],{precipitationPhaseModelMetaCache:new Map([['geosphere-arome',{storedAt:Date.now(),value:{initialisationTime:new Date().toISOString()}}]])});
const phaseArome=phase.RAPID_PHASE_MODELS.find(x=>x.id==='geosphere-arome');
assert.equal(phase.phaseModelApplies(phaseArome,47.27,11.39),false);
assert.equal(await phase.phaseModelMetadata(phaseArome),null,'Pre-sunset phase metadata cache must not reactivate AROME');
assert(phase.RAPID_PHASE_MODELS.some(x=>x.id==='icon-d2'&&phase.phaseModelApplies(x,47.27,11.39)));
const cachedValue={at:Date.now(),value:{summary:'historic',likelyChain:'AROME',candidateModels:'GeoSphere AROME Austria',runs:[{id:'geosphere_arome_austria'}]}};
const cache=runtime(weather,['readBestMatchInfoCache'],['readBestMatchInfoCache'],{BEST_MATCH_INFO_FRESH_MS:1200000,bestMatchInfoCacheKey:()=>'',localStorage:{getItem:()=>JSON.stringify(cachedValue)}});
assert.equal(cache.readBestMatchInfoCache(47.27,11.39,'AT'),null,'Persisted active-model badge cache must not retain retired AROME');
cachedValue.value={summary:'current',likelyChain:'ICON-D2',candidateModels:'DWD ICON-D2',runs:[{id:'dwd_icon_d2'}]};
assert(cache.readBestMatchInfoCache(47.27,11.39,'AT'),'Unrelated valid metadata cache is retained');
assert.equal(networkCalls,0);
console.log('Open-Meteo GeoSphere AROME retirement: all active metadata/background/mountain/fusion/phase paths and historic caches blocked before network; existing fallbacks, strict time/missing guards and C-LAEF qualification preserved.');
