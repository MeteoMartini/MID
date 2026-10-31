import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mapBrowserRunPlan,mapBrowserCaseConcurrency,mapBrowserCases} from './map-browser-shards.mjs';
const read=p=>readFileSync(p,'utf8'),ts=createRequire(import.meta.url)('typescript-strada');
const wms=read('src/unifiedWmsCatalog.ts').replace(/^import .*?;\n/m,''),models=[{id:'icon',label:'Global'},{id:'icon-eps',label:'EPS'},{id:'icon-d2',label:'D2'}],products={'icon':[{id:'icon-t2m'},{id:'icon-wind-10m'},{id:'icon-gh'}],'icon-eps':[{id:'icon-eps-gust-12h'}],'icon-d2':[]};
const js=ts.transpileModule(`const WEATHER_MAP_MODELS=${JSON.stringify(models)};const products=${JSON.stringify(products)};const weatherMapProductsForModel=id=>products[id];const weatherMapCatalogExcludes=()=>false;${wms}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText,m=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
assert.equal(m.unifiedWmsProduct('temperature','icon').id,'icon-t2m');assert.equal(m.unifiedWmsProduct('temperature','icon-eps'),undefined);assert.equal(m.unifiedWmsProduct('gust-probability','icon-eps').id,'icon-eps-gust-12h');assert.equal(m.unifiedWmsProduct('gust','icon-eps'),undefined,'A probability is never a speed');
assert.equal(m.unifiedWmsProduct('geopotential','icon').id,'icon-gh');assert.equal(m.unifiedWmsProduct('thetae','icon'),undefined);
const catalog=read('src/unifiedMapCatalog.ts').replace(/^import .*?;\n/gm,''),catalogJs=ts.transpileModule(`const readDurableStorageValue=key=>localStorage.getItem(key);const UNIFIED_WMS_PARAMETERS=[];const choices=${JSON.stringify(m.unifiedWmsChoices())};const unifiedWmsChoices=()=>choices;${catalog}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText,c=await import('data:text/javascript;base64,'+Buffer.from(catalogJs).toString('base64'));
const index={products:{temperature:{frames:[{}]},gust:{frames:[{}]}}};
assert.deepEqual(c.unifiedSources('temperature',index,false,false).map(s=>s.id),['icon-d2','icon']);
assert.deepEqual(c.unifiedSources('gust',index,false,false).map(s=>s.id),['icon-d2']);
assert.deepEqual(c.unifiedSources('observed',index,true,false),[],'Unpublished observations are not offered');
assert.equal(c.unifiedSources('observed',index,true,true)[0].id,'radolan');
const terms=[{time:'2026-10-05T00:00:00Z'},{time:'2026-10-05T03:00:00Z'}];
assert.equal(c.nearestUnifiedFrame(terms,Date.parse('2026-10-05T04:30:00Z')),terms[1]);
assert.equal(c.nearestUnifiedFrame(terms,Date.parse('2026-10-05T04:31:00Z')),undefined,'No model frame beyond its permitted nearest-term tolerance');
assert.equal(c.nearestUnifiedTime(terms.map(t=>t.time),Date.parse('2026-10-05T03:25:00Z')),terms[1].time,'Live five-minute radar time uses a real hourly model term, not an empty exact-match lookup');
assert.equal(c.nearestUnifiedTime(terms.map(t=>t.time),Date.parse('2026-10-05T04:31:00Z')),undefined);
globalThis.localStorage={getItem:()=>JSON.stringify({enabled:true,parameter:'gust',modelId:'icon-d2',opacity:200,hours:9,selectionMode:'model'})};
assert.deepEqual(c.readUnifiedMapSettings(),{enabled:true,parameter:'gust',modelId:'icon-d2',opacity:100,hours:24,isobars:false,level:500,selectionMode:'model',presentation:'auto'});delete globalThis.localStorage;
// A3: the unified map must reuse the exact legacy WMS frame/run/level gate.
const weatherData=read('src/WeatherMapsData.ts');
const availableStart=weatherData.indexOf('export function weatherMapAvailableTimes('),availableEnd=weatherData.indexOf('export function preferredWeatherMapTimeIndex(');
const readyStart=weatherData.indexOf('export function weatherMapFrameReady(');
assert.ok(availableStart>=0&&availableEnd>availableStart&&readyStart>availableEnd);
const readyJs=ts.transpileModule(weatherData.slice(availableStart,availableEnd)+'\n'+weatherData.slice(readyStart),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const ready=await import('data:text/javascript;base64,'+Buffer.from(readyJs).toString('base64'));
const run='2026-10-31T00:00:00Z',valid='2026-10-31T12:00:00Z',earlier='2026-10-31T03:00:00Z';
const wmsProduct={id:'icon-gh',modelId:'icon',layer:'dwd:Icon_reg025_fd_pl_GH',timeDependent:true,levelKind:'pressure'};
const wmsMeta={layer:wmsProduct.layer,times:[earlier,valid],referenceTimes:[run],elevations:[500]};
assert.equal(ready.weatherMapFrameReady(wmsProduct,wmsMeta,valid,run,500),true,'Confirmed run, time and pressure level render');
for(const [label,meta,at,init,height] of [
 ['wrong layer',{...wmsMeta,layer:'another'},valid,run,500],
 ['provider error',{...wmsMeta,error:'WMS unavailable'},valid,run,500],
 ['unlisted run',wmsMeta,valid,'2026-10-30T18:00:00Z',500],
 ['unlisted validity',wmsMeta,'2026-10-31T14:00:00Z',run,500],
 ['unavailable pressure level',wmsMeta,valid,run,850],
 ['unavailable elevation',{...wmsMeta,elevations:[]},valid,run,500],
 ['invalid time',wmsMeta,'not-a-time',run,500]
])assert.equal(ready.weatherMapFrameReady(wmsProduct,meta,at,init,height),false,label);
const precipProduct={...wmsProduct,id:'icon-rain-6h',levelKind:undefined};
assert.equal(ready.weatherMapFrameReady(precipProduct,wmsMeta,earlier,run,undefined),false,'3h lead time cannot satisfy a 6h accumulation');
assert.equal(ready.weatherMapFrameReady(precipProduct,wmsMeta,valid,run,undefined),true,'Complete 6h lead time remains available');

const workspace=read('src/MapWorkspacePanel.tsx'),panel=read('src/UnifiedWeatherMap.tsx'),radar=read('src/RadarPanel.tsx');
assert.ok(workspace.includes('MemoLazyUnifiedWeatherMap')&&!workspace.includes('map-workspace-tabs'));
assert.ok(panel.includes("weatherMapFrameReady(wmsProduct,metadata,wmsTime??'',wmsRun,level)"),'Unified map must enforce the same WMS frame/run/level validation as the model map panel');
for(const token of ['loadNativeField','loadTotals','ModelMapProbe','synopticAt','exportNativeField','exportTotals','writeDurableStorageValue','fieldCache.current.size>8'])assert.ok(panel.includes(token),token);
assert.ok(radar.includes('unified?.overlay')&&radar.includes('unified?.controls')&&radar.includes('if(unified||!fallbackNeeded'));
assert.ok(radar.includes("visibleModelLines:ModelLineMode=unified?'off'"),'Old synoptic must be absent in unified route');
assert.ok(radar.includes('unified?availableCompositeFutureMinutes(referenceSeconds,modelForecastTimes):120')&&radar.includes('unified.times.map'),'Only actual model terms, not fabricated interpolations');
assert.ok(read('src/UnifiedVectorBasemap.tsx').includes('VectorTileLayers'),'Vector geography replaces pixel base');
assert.equal(mapBrowserCaseConcurrency(320),2);assert.equal(mapBrowserCaseConcurrency(390),2);assert.equal(mapBrowserCaseConcurrency(412),2);assert.equal(mapBrowserCaseConcurrency(844),2);assert.equal(mapBrowserCaseConcurrency(1024),1);assert.equal(mapBrowserCaseConcurrency(1440),1);
assert.throws(()=>mapBrowserCaseConcurrency(0),RangeError);
assert.equal(mapBrowserRunPlan().flatMap(shard=>mapBrowserCases(shard)).length,24,'Every viewport/theme/design case remains mandatory');
assert.ok(read('scripts/verify-unified-map-browser-0985167.mjs').includes('concurrency=mapBrowserCaseConcurrency(width)'),'The browser runner must honor the bounded software-GPU concurrency contract');
assert.ok(read('scripts/verify-unified-map-browser-0985167.mjs').includes("window.__qaMap?.getLayer('unified-wms-pressure-isobars-line-dashed')"),'The real ICON-EU isobars must remain a strict requirement; no skip or weaker readiness timeout');
if(process.env.GITHUB_ACTIONS==='true')for(const shard of mapBrowserRunPlan(process.env.MID_MAP_QA_SHARD))execFileSync(process.execPath,['scripts/verify-unified-map-browser-0985167.mjs'],{stdio:'inherit',timeout:900000,env:{...process.env,MID_MAP_QA_SHARD:shard}});
console.log('MID-C17 unified map: scientific model/parameter matrix, one lazy/memoized map, native field integrity, overlays/probes/exports, bounded caching, persistence and legacy-source exclusion verified.');
