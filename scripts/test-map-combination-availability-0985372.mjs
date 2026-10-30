import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript-strada');

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const canonical=read('worker-src/20-composite-models.js'),router=read('worker-src/40-aviation-router.js'),worker=read('worker/metar-proxy.js');
const app=read('src/WeatherMapsPanel.tsx'),unified=read('src/UnifiedWeatherMap.tsx'),catalog=read('src/unifiedMapCatalog.ts'),wms=read('src/unifiedWmsCatalog.ts');
assert.equal(worker,read('worker.js'),'Deployment Worker mirrors must be byte-identical');
for(const token of ["async function weatherMapCatalogAvailability()","status:'absent'","providers[provider.id]='unchecked'"])
 assert.ok(canonical.includes(token),'Canonical Worker capability contract missing '+token);
assert.ok(router.includes("mode==='weather-map-catalog'")&&worker.includes("mode==='weather-map-catalog'"),'Capability endpoint must be routed in canonical and aggregate Workers');
assert.ok(app.includes("{!isGrid&&wmsRenderable?<WmsTileLayer"),'Separate weather maps must not request unverified frames');
assert.ok(app.includes('weatherMapCatalogExcludes(item,capabilityCatalog)'), 'Separate weather maps must hide only provider-confirmed absent products');
assert.ok(unified.includes('availableUnifiedParameters(d2Catalog?.index??null,availability.forecast,availability.observed,rucCatalog?.index??null,wmsCatalog)'), 'Unified map must use the same checked WMS matrix');
assert.ok(unified.includes('unifiedSources(p,d2Catalog?.index??null,availability.forecast,availability.observed,rucCatalog?.index??null,wmsCatalog)'), 'Unified map model selector must use checked sources');
assert.ok(wms.includes('!weatherMapCatalogExcludes(p,catalog)')&&catalog.includes('unifiedWmsChoices(catalog)'), 'WMS model/parameter combinations must honor provider catalog');
assert.ok(app.includes('!weatherMapCatalogExcludes(weatherMapProduct(productId),capabilityCatalog)'), 'Existing saved user selection must not be erased by a capabilities update');

const data=read('src/WeatherMapsData.ts');
function fn(name){
 const i=data.indexOf('export function '+name+'('),e=data.indexOf('\n}',i);
 assert.ok(i>=0&&e>i,'Missing real production helper: '+name);
 return data.slice(i,e+2).replace(/^export /,'');
}
const js=ts.transpileModule([fn('weatherMapAvailableTimes'),fn('weatherMapCatalogExcludes'),fn('weatherMapFrameReady')].join('\n'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const helpers=runInNewContext(js+'\n({weatherMapCatalogExcludes,weatherMapFrameReady})',{}, {timeout:1200});
const product={id:'icon-gh',source:undefined,modelId:'icon',layer:'dwd:Icon_reg025_fd_pl_GH',timeDependent:true,forecast:true,levelKind:'pressure',levels:[500]};
const run='2026-10-30T00:00:00.000Z',time='2026-10-30T06:00:00.000Z',metadata={layer:product.layer,times:[time],referenceTimes:[run],elevations:[500]};
assert.equal(helpers.weatherMapFrameReady(product,metadata,time,run,500),true,'Exact advertised model/run/height must render');
assert.equal(helpers.weatherMapFrameReady(product,metadata,'2026-10-30T09:00:00.000Z',run,500),false,'No manufactured missing forecast term');
assert.equal(helpers.weatherMapFrameReady(product,metadata,time,'2026-10-29T12:00:00.000Z',500),false,'No unverified model run');
assert.equal(helpers.weatherMapFrameReady(product,metadata,time,run,850),false,'No invented pressure levels');
assert.equal(helpers.weatherMapFrameReady(product,{...metadata,layer:'other'},time,run,500),false,'No stale metadata from another layer');
assert.equal(helpers.weatherMapFrameReady({...product,modelId:'nowcastmix',levelKind:undefined}, {...metadata,referenceTimes:[]},time,undefined,undefined),true,'Time-verified event nowcast does not require a deterministic model initialization');
const states={schema:'mid.weather-map-catalog.v1',layers:{[product.layer]:{status:'absent'}},providers:{dwd:'verified'},checkedAt:time};
assert.equal(helpers.weatherMapCatalogExcludes(product,states),true,'Confirmed absent layer must be removed from new choices');
assert.equal(helpers.weatherMapCatalogExcludes(product,{...states,layers:{},providers:{dwd:'unchecked'}}),false,'Connection outage is not evidence of absence');
assert.equal(helpers.weatherMapCatalogExcludes({...product,source:'native'},states),false,'A WMS outage must not remove native data products');

const dwdXml='<WMS_Capabilities><Capability><Layer><Layer><Name>dwd:Icon_reg025_fd_sl_T2M</Name><Dimension name="time">2026-10-30T06:00:00Z</Dimension></Layer></Layer></Capability></WMS_Capabilities>';
const geometXml='<WMS_Capabilities><Capability><Layer><Layer><Name>GDPS_15km_TotalCloudCover</Name></Layer></Layer></Capability></WMS_Capabilities>';
const originalFetch=globalThis.fetch;
try{
 globalThis.fetch=async input=>{
  const url=new URL(typeof input==='string'?input:input.url);
  if(url.hostname==='maps.dwd.de')return new Response(dwdXml,{status:200,headers:{'content-type':'text/xml'}});
  if(url.hostname==='geo.weather.gc.ca')return new Response(geometXml,{status:200,headers:{'content-type':'text/xml'}});
  throw Error('Unexpected live network request from Worker capability probe: '+url.hostname);
 };
 const workerEntry=(await import('../worker/metar-proxy.js?map-combination-catalog-test')).default;
 const request=new Request('https://mid.test/?mode=weather-map-catalog');
 const response=await workerEntry.fetch(request,{});
 assert.equal(response.status,200);
 const result=await response.json();
 assert.equal(result.schema,'mid.weather-map-catalog.v1');
 assert.equal(result.providers.dwd,'verified');
 assert.equal(result.providers.geomet,'verified');
 assert.equal(result.layers['dwd:Icon_reg025_fd_sl_T2M']?.status,'listed');
 assert.equal(result.layers['dwd:Icon_reg025_fd_sl_PMSL']?.status,'absent');
 assert.equal(result.layers.GDPS_15km_TotalCloudCover?.status,'listed');
 const total=Object.keys(result.layers).length;
 assert.ok(total>=25,'Probe must evaluate the full allowlisted model/parameter catalog, not just one map');
 globalThis.fetch=async()=>{throw new Error('Provider unavailable')};
 const offlineResponse=await workerEntry.fetch(request,{});
 assert.equal(offlineResponse.status,200);
 const offline=await offlineResponse.json();
 assert.equal(offline.providers.dwd,'unchecked');
 assert.equal(offline.providers.geomet,'unchecked');
 assert.equal(Object.keys(offline.layers).length,0,'Transport failure must not claim models missing');
 console.log('WMS capabilities: '+total+' provider-layer combinations audited; exact source/run/time/level, both UIs and fail-closed provider error checked.');
}finally{globalThis.fetch=originalFetch}
