import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('src/weather-src/00-types-models-search.tsfrag');
const weather=read('src/weather.ts');
const workerSource=read('worker-src/00-core-observations.js');
const worker=read('worker/metar-proxy.js');
const alias=read('worker.js');
for(const [name,content] of [['weather source',source],['weather aggregate',weather]]){
 assert.ok(!content.includes("id:'bom_access_global',"),name+': discontinued deterministic forecast remains selectable');
 for(const id of ['bom_access_global_ensemble','bom_access_global_ensemble_mean'])
  assert.ok(content.includes("id:'"+id+"'"),name+': unrelated BOM ensemble missing '+id);
 for(const id of ['ukmo_global_deterministic_10km','cmc_gem_gdps','jma_gsm','cma_grapes_global'])
  assert.ok(content.includes("id:'"+id+"'"),name+': independent fallback missing '+id);
}
for(const [name,content] of [['worker source',workerSource],['worker aggregate',worker],['worker alias',alias]]){
 assert.ok(!content.includes("'bom_access_global'"),name+': stale deterministic BOM ID in active selection');
 for(const id of ['best_match','ecmwf_ifs','gfs','icon_global','gem_global','cma_grapes_global'])
  assert.ok(content.includes("id:'"+id+"'"),name+': model family missing '+id);
}
assert.equal(worker,alias,'Worker output aliases must be byte-identical');
assert.ok(worker.startsWith(workerSource),'Worker aggregate must begin with canonical source');
assert.ok(weather.startsWith(source),'Weather aggregate must begin with canonical source');
const models=worker.match(/const FORECAST_FUSION_MODELS=\[[\s\S]*?\n\];/)?.[0];
const applies=worker.match(/function fusionModelApplies\([^\n]+/)?.[0];
const select=worker.match(/function forecastFusionSelection\([\s\S]*?\n\}/)?.[0];
assert.ok(models&&applies&&select,'Actual Worker fusion-selector code must be identifiable');
for(const [lat,lon,country] of [[50.9,7.2,'DE'],[-33.9,151.2,'AU'],[40.7,-74,'US']]){
 const script='const FORECAST_FUSION_EUROPE=[-15,35,35,72];\n'+models+'\n'+applies+'\n'+select+
 '\nJSON.stringify(forecastFusionSelection('+lat+','+lon+",'"+country+"').map(row=>row.id));";
 const ids=JSON.parse(runInNewContext(script,{}, {timeout:1500}));
 assert.ok(ids.includes('best_match'),country+': Best-Match anchor absent');
 assert.ok(ids.some(id=>['ecmwf_ifs','gfs','icon_global','gem_global'].includes(id)),country+': independent global fallback absent');
 assert.ok(!ids.includes('bom_access_global'),country+': retired BOM still selected');
 assert.equal(new Set(ids).size,ids.length,country+': duplicate model candidates');
 assert.ok(ids.length<=20,country+': model request budget exceeded');
}
assert.ok(read('src/seasonalForecast.ts').includes('bom-access-s2'),'BOM ACCESS-S2 seasonal product must remain');
console.log('BOM ACCESS-G deterministic retirement: canonical/catalog mirrors, live selection DE/AU/US, independent global models, ensemble and season protected.');
