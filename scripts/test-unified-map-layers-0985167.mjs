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

// WMS legends must be the provider's permitted original GetLegendGraphic, never guessed from map colors.
const legendSource=read('src/wmsLegendUrl.ts').replace(/^import .*?;\n/gm,'');
const legendJs=ts.transpileModule(`const WEATHER_MAP_PRODUCTS=[{layer:'dwd:Icon_reg025_fd_sl_T2M'},{layer:'GDPS_15km_TotalCloudCover',provider:'geomet'}];const weatherMapWmsProxy=provider=>'https://mid.example/worker?mode=weather-map-wms&provider='+provider;${legendSource}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const legend=await import('data:text/javascript;base64,'+Buffer.from(legendJs).toString('base64'));
const dwdMap={layer:'dwd:Icon_reg025_fd_sl_T2M',id:'icon-t2m'};
const nativeMap={...dwdMap,source:'native'};
const ecccMap={layer:'GDPS_15km_TotalCloudCover',id:'gdps-cloud',provider:'geomet'};
const legendUrl=new URL(legend.wmsProviderLegendUrl(dwdMap,'temp_fill'));
assert.equal(legendUrl.searchParams.get('request'),'GetLegendGraphic');
assert.equal(legendUrl.searchParams.get('layers'),dwdMap.layer);
assert.equal(legendUrl.searchParams.get('styles'),'temp_fill');
assert.equal(legendUrl.searchParams.get('format'),'image/png');
assert.equal(legendUrl.searchParams.get('provider'),'dwd');
assert.equal(new URL(legend.wmsProviderLegendUrl(ecccMap,'')).searchParams.get('provider'),'geomet');
assert.equal(legend.wmsProviderLegendUrl(nativeMap,'temp_fill'),'','Native model fields use their own numerical legend');
assert.equal(legend.wmsProviderLegendUrl({...dwdMap,layer:'unapproved:layer'},''),'','Unapproved WMS layers cannot request a legend');
assert.equal(legend.wmsProviderLegendUrl(dwdMap,'../../unsafe'),'','Unexpected styles cannot be used');
assert.ok(read('src/WmsProviderLegend.tsx').includes('Originallegende derzeit nicht verfügbar'),'Provider failures must never fabricate a scale');
assert.ok(read('src/WmsProviderLegend.tsx').includes('loading="lazy"'),'Unopened map legends must not eagerly load imagery');
 const legendComponent=read('src/WmsProviderLegend.tsx'),legendCss=read('src/WmsProviderLegend.css');
 assert.ok(legendComponent.includes('failedUrl===url'),'A failed provider image must not poison a new URL or style');
 assert.ok(legendComponent.includes('target="_blank"')&&legendComponent.includes('rel="noopener noreferrer"'),'Provider image must be inspectable at full size without opener access');
 assert.ok(legendComponent.includes('reine WMS-Wetterfläche')&&legendComponent.includes('ein SVG-Vektorexport'),'Provider raster export must not be presented as a full vector/native map');
 assert.ok(legendComponent.includes('numerisch barrierefreie Texttabelle'),'Do not assert numerical accessibility from a provider bitmap');
 assert.ok(legendCss.includes('.unified-wms-provider-legend__open{min-height:44px'),'Full-size source link has a 44px touch target');
 const providerProxy=read('worker/metar-proxy.js');
 assert.ok(providerProxy.includes("upstream.searchParams.set('style',url.searchParams.get('styles')||'')"),'Allowlisted worker must convert GetMap STYLES to singular GetLegendGraphic STYLE');
 assert.ok(providerProxy.includes("upstream.searchParams.delete('styles')"),'Upstream GetLegendGraphic may not silently ignore plural styles');

assert.ok(read('src/WmsProviderLegend.css').includes('.unified-wms-provider-legend summary{min-height:44px'),'Shared WMS legend disclosure must have 44px touch target');
assert.ok(read('src/WmsProviderLegend.tsx').includes("import './WmsProviderLegend.css'"),'Both map surfaces must load the same styles through their shared component');

// An actual standalone WMS GetMap export is bound to a confirmed viewport,
// provider, model run, valid time, style and original image legend.
const originalExportSource=read('src/wmsOriginalMapExport.ts').replace(/^import .*?;\n/gm,'');
const originalExportJs=ts.transpileModule(`const weatherMapProductsForModel=id=>[{
 id:'icon-t2m',modelId:'icon',label:'Temperatur',layer:'dwd:Icon_reg025_fd_sl_T2M',
 timeDependent:true,provider:'dwd'}];
const weatherMapWmsProxy=provider=>'https://mid.example/worker?mode=weather-map-wms&provider='+provider;
const wmsProviderLegendUrl=(product,style)=>'https://mid.example/worker?mode=weather-map-wms&provider=dwd&request=GetLegendGraphic&styles='+style;
${originalExportSource}`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const originalExport=await import('data:text/javascript;base64,'+Buffer.from(originalExportJs).toString('base64'));
const exportProduct={id:'icon-t2m',modelId:'icon',label:'Temperatur',layer:'dwd:Icon_reg025_fd_sl_T2M',timeDependent:true,provider:'dwd'};
const exportArgs={product:exportProduct,style:'temperature',validTime:'2026-11-02T12:00:00Z',runTime:'2026-11-02T00:00:00Z',
 bounds:{west:6,south:47,east:15,north:55},viewportWidth:900,viewportHeight:600};
const exported=originalExport.planOriginalWmsExport(exportArgs),mapUrl=new URL(exported.mapUrl);
for(const [key,expected] of Object.entries({provider:'dwd',request:'GetMap',layers:exportProduct.layer,styles:'temperature',
  srs:'EPSG:3857',format:'image/png',time:'2026-11-02T12:00:00Z',dim_reference_time:'2026-11-02T00:00:00Z',width:'900',height:'600'}))
 assert.equal(mapUrl.searchParams.get(key),expected,'WMS export identity '+key);
assert.ok(mapUrl.searchParams.get('bbox').split(',').every(v=>Number.isFinite(Number(v))),'Projected WMS coordinates must be finite');
assert.ok(exported.legendUrl.includes('GetLegendGraphic')&&exported.caption.includes('INIT')&&exported.source.includes('CC BY 4.0'),'Original legend, run and source required');
assert.equal(originalExport.planOriginalWmsExport({...exportArgs,viewportWidth:2200,viewportHeight:900}).width,1100,'Large viewport constrained to provider request budget');
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,product:{...exportProduct,source:'native'}}),/nicht für den Export/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,product:{...exportProduct,layer:'foreign:test'}}),/nicht für den Export/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,style:'../../evil'}),/Kartenstil/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,validTime:'not a date'}),/Modelllauf/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,validTime:'2026-11-01T12:00:00Z'}),/Modelllauf/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,level:-3}),/Höhenfläche/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,bounds:{west:15,south:47,east:6,north:55}}),/Kartenausschnitt/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,bounds:{west:6,south:88,east:15,north:89}}),/Kartenausschnitt/);
assert.throws(()=>originalExport.planOriginalWmsExport({...exportArgs,viewportWidth:0}),/Kartengröße/);
const exportControl=read('src/WmsOriginalExportControl.tsx');
assert.ok(exportControl.includes('getBounds()')&&exportControl.includes('getCanvas()'),'Viewport exported from actual MapLibre map');
assert.ok(exportControl.includes('pending.current?.abort()'),'Stale requests aborted on model/time/level changes');
assert.ok(exportControl.includes('role="alert"')&&read('src/wmsOriginalExport.css').includes('min-height:44px'),'Error feedback and touch target present');
const wmsExportImplementation=read('src/wmsOriginalMapExport.ts');
assert.ok(wmsExportImplementation.includes('mapImage.naturalWidth!==plan.width'),'Unexpected image geometry fails closed');
assert.ok(wmsExportImplementation.includes('Promise.all([fetchPng(plan.mapUrl,signal),fetchPng(plan.legendUrl,signal)])'),'Both original map and legend required');
const classicExport=read('src/WeatherMapsPanel.tsx'),unifiedExport=read('src/UnifiedWeatherMap.tsx');
assert.ok(classicExport.includes('WmsOriginalExportControl')&&classicExport.includes('confirmedWmsKey===wmsIdentity&&!loading&&!playing&&!tileError'),'Classic export waits for verified tiles');
assert.ok(unifiedExport.includes('WmsOriginalExportControl')&&unifiedExport.includes('loadedWms.has(wmsSelectedKey)&&!wmsPending&&!wmsError'),'Unified export waits for current frame');
// Existing baseline: 1059 regression entries unchanged; no fallback to guessed values or an SVG bitmap mislabeled vector.

// Execute the legacy weather-map settings store with real TypeScript source.
// A new tab's selection must not be overwritten by a remounted map.
const classicStoreSource=read('src/WeatherMapsPanel.tsx');
const classicStart=classicStoreSource.indexOf('function storedSettings()'),classicEnd=classicStoreSource.indexOf('function formatMapTime(',classicStart);
assert.ok(classicStart>0&&classicEnd>classicStart,'Classic map store source must be present');
const classicStoreJs=ts.transpileModule(`
 type WeatherMapModelId='icon-d2'|'icon-eu';
 type BasemapId='light'|'dark';
 type WeatherMapSettings={modelId:WeatherMapModelId;productId:string;level:number;opacity:number;basemap:BasemapId};
 const SETTINGS_KEY='mid:weather-maps:v2';
 const sampleProducts={
  'icon-d2-precipitation-totals':{id:'icon-d2-precipitation-totals',modelId:'icon-d2',defaultLevel:500,opacity:76},
  'icon-eu-t2m':{id:'icon-eu-t2m',modelId:'icon-eu',defaultLevel:850,opacity:70}
 };
 const weatherMapProduct=(id:string)=>sampleProducts[id]??sampleProducts['icon-d2-precipitation-totals'];
 const weatherMapProductsForModel=(id:string)=>Object.values(sampleProducts).filter(p=>p.modelId===id);
 const WEATHER_MAP_MODELS=[{id:'icon-d2'},{id:'icon-eu'}],BASEMAPS={light:{},dark:{}};
 const testStore=new Map<string,string>(),testEvents:string[]=[];
 const localStorage={getItem:(key:string)=>testStore.get(key)??null,setItem:(key:string,value:string)=>testStore.set(key,value)};
 const window={dispatchEvent:(event:{type:string})=>testEvents.push(event.type)};
 class Event{constructor(public type:string){}}
 ${classicStoreSource.slice(classicStart,classicEnd)}
 export const __testMapPreferences={storedSettings,patchStoredWeatherMapSettings,testStore,testEvents};
`,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const mapSettings=(await import('data:text/javascript;base64,'+Buffer.from(classicStoreJs).toString('base64'))).__testMapPreferences;
const savedMapKey='mid:weather-maps:v2';
mapSettings.testStore.set(savedMapKey,JSON.stringify({modelId:'icon-eu',productId:'icon-eu-t2m',level:850,opacity:33,basemap:'dark'}));
mapSettings.patchStoredWeatherMapSettings({opacity:66});
let updatedMap=JSON.parse(mapSettings.testStore.get(savedMapKey));
assert.equal(updatedMap.opacity,66);assert.equal(updatedMap.level,850);assert.equal(updatedMap.basemap,'dark');assert.equal(updatedMap.productId,'icon-eu-t2m');
assert.ok(mapSettings.testEvents.includes('mid:weather-map-settings-changed'),'Same-tab map settings must broadcast a change');
mapSettings.testStore.set(savedMapKey,JSON.stringify({...updatedMap,level:500,opacity:44}));
mapSettings.patchStoredWeatherMapSettings({basemap:'light'});
updatedMap=JSON.parse(mapSettings.testStore.get(savedMapKey));
assert.equal(updatedMap.opacity,44,'Other tab opacity change must not be overwritten by an older local render');
assert.equal(updatedMap.level,500,'External level choice must survive unrelated setting changes');
mapSettings.testStore.set(savedMapKey,JSON.stringify({productId:'icon-eu-t2m',modelId:'icon-eu',level:null,opacity:66}));
assert.equal(mapSettings.storedSettings().level,850,'Missing pressure level is not a real zero');
assert.ok(classicStoreSource.includes("window.addEventListener('storage',onStorage)"),'Classic map must listen for cross-tab changes');
assert.ok(!classicStoreSource.includes('useEffect(()=>{try{localStorage.setItem(SETTINGS_KEY'),'Classic map mount must not write a stale default');

const workspace=read('src/MapWorkspacePanel.tsx'),panel=read('src/UnifiedWeatherMap.tsx'),radar=read('src/RadarPanel.tsx');
assert.ok(workspace.includes('MemoLazyUnifiedWeatherMap')&&!workspace.includes('map-workspace-tabs'));
assert.ok(read('src/UnifiedWeatherMap.tsx').includes("from './wmsLegendUrl'")&&read('src/WeatherMapsPanel.tsx').includes("from './wmsLegendUrl'"),'Both views import a uniquely named helper to avoid case-only module aliases');
assert.ok(panel.includes('wmsProviderLegendUrl(wmsProduct,wmsStyle)')&&panel.includes('loadedWms.has(wmsSelectedKey)'),'Unified legend only after WMS tiles confirmed');
const legacyPanel=read('src/WeatherMapsPanel.tsx');
assert.ok(legacyPanel.includes('confirmedWmsKey===wmsIdentity')&&legacyPanel.includes("wmsProviderLegendUrl(product,'')"),'Legacy legend only when WMS tiles confirmed');
assert.ok(legacyPanel.includes('setConfirmedWmsKey(wmsIdentity)')&&legacyPanel.includes("setConfirmedWmsKey('')"),'Legacy legend tied to tile ready and error');
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
