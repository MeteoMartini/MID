import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const dir=await mkdtemp(join(tmpdir(),'mid-return-states-'));
const oldStorage=globalThis.localStorage,oldWindow=globalThis.window;
try{
 const app=await readFile('src/App.tsx','utf8'),start=app.indexOf("type DetailLineKey="),end=app.indexOf('function initialLayoutMode()',start);
 assert.ok(start>=0&&end>start);
 await build({stdin:{contents:'const readDurableStorageValue=(key:string)=>localStorage.getItem(key);\n'+app.slice(start,end)+'\nexport {initialDetailChartPreferences,validDetailChartPreferences};',loader:'ts'},outfile:join(dir,'detail.mjs'),format:'esm',platform:'node'});
 let raw=null;globalThis.localStorage={getItem:()=>raw};
 const {initialDetailChartPreferences,validDetailChartPreferences}=await import(pathToFileURL(join(dir,'detail.mjs')));
 raw=JSON.stringify({visible:{pressure:false,wind:'false',temperature:0,dewPoint:null},hiddenPrecip:['rain','bogus']});
 const legacy=initialDetailChartPreferences();assert.equal(legacy.visible.pressure,false);assert.equal(legacy.visible.wind,true);assert.equal(legacy.visible.temperature,true);assert.equal(legacy.visible.dewPoint,true);assert.deepEqual(legacy.hiddenPrecip,['rain']);assert.equal(validDetailChartPreferences(legacy),true);
 assert.equal(validDetailChartPreferences({...legacy,visible:{...legacy.visible,wind:'false'}}),false);
 assert.equal(validDetailChartPreferences({...legacy,hiddenPrecip:['bogus']}),false);
 assert.equal(validDetailChartPreferences(null),false);
 const helper=await readFile('src/useDisplayPreference.ts','utf8');
 await build({stdin:{contents:helper+'\nexport {subscribe as testSubscribe};',resolveDir:resolve('src'),loader:'ts'},outfile:join(dir,'store.mjs'),bundle:true,format:'esm',platform:'node',plugins:[{name:'boundaries',setup(b){b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'test'}));b.onResolve({filter:/storageSafety$/},()=>({path:'storage',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({contents:a.path==='react'?`export const useCallback=f=>f;export const useMemo=f=>f();export const useSyncExternalStore=(_,read)=>read();`:`export const readDurableStorageValue=k=>globalThis.__midReturnMemory.get(k)??null;export const writeDurableStorageValue=(k,v)=>globalThis.__midReturnMemory.set(k,v);`}));}}]});
 globalThis.__midReturnMemory=new Map();globalThis.window=new EventTarget();
 const store=await import(pathToFileURL(join(dir,'store.mjs')));let calls=0;const stop=store.testSubscribe(()=>calls++);
 store.writeDisplayPreference('x',false);assert.equal(calls,1);window.dispatchEvent(new Event('storage'));assert.equal(calls,2);stop();window.dispatchEvent(new Event('storage'));assert.equal(calls,2,'subscription cleanup');
 const [,a]=store.useDisplayPreference('x',true,store.displayBoolean),[,b]=store.useDisplayPreference('x',true,store.displayBoolean);b(true);a(value=>!value);assert.equal(store.readDisplayPreference('x',true,store.displayBoolean),false,'latest-value functional update across mounted views');
 const validate=validDetailChartPreferences;store.writeDisplayPreference('parameters',legacy);assert.strictEqual(store.readDisplayPreference('parameters',legacy,validate),store.readDisplayPreference('parameters',legacy,validate),'same immutable object snapshot until storage changes');
 const decodeName=raw=>raw==='0'?false:true,encodeName=value=>value?'1':'0';
 const climateA='mid:climate:favorite-name:50.8000:7.1300',climateB='mid:climate:favorite-name:50.9000:7.2000';
 globalThis.__midReturnMemory.set(climateA,'0');globalThis.__midReturnMemory.set(climateB,'1');
 assert.equal(store.readRawDisplayPreference(climateA,true,decodeName),false,'explicit 0 is not missing');
 assert.equal(store.readRawDisplayPreference(climateB,true,decodeName),true,'other place retains its own preference');
 const [,setNameA]=store.useRawDisplayPreference(climateA,true,decodeName,encodeName),[,setNameB]=store.useRawDisplayPreference(climateB,true,decodeName,encodeName);
 setNameB(false);assert.equal(store.readRawDisplayPreference(climateA,true,decodeName),false,'switching places never writes previous mounted choice');
 setNameB(true);setNameA(value=>!value);
 assert.equal(globalThis.__midReturnMemory.get(climateA),'1');assert.equal(globalThis.__midReturnMemory.get(climateB),'1');
 const decodeMetric=raw=>raw==='precipitation'?'precipitation':'temperature';
 const metricKey='mid:long-range:comparison-metric';
 globalThis.__midReturnMemory.set(metricKey,'precipitation');
 const [,setMetricA]=store.useRawDisplayPreference(metricKey,'temperature',decodeMetric,value=>value),[,setMetricB]=store.useRawDisplayPreference(metricKey,'temperature',decodeMetric,value=>value);
 assert.equal(store.readRawDisplayPreference(metricKey,'temperature',decodeMetric),'precipitation','legacy string retained without migration');
 setMetricA('temperature');setMetricB(value=>value==='temperature'?'precipitation':'temperature');
 assert.equal(globalThis.__midReturnMemory.get(metricKey),'precipitation','mounted seasonal views update against latest durable value');
 setMetricA('bogus');assert.equal(globalThis.__midReturnMemory.get(metricKey),'precipitation','invalid choice rejected');
 globalThis.localStorage={getItem:()=>{throw new Error('blocked storage bridge')}};
 setNameB(false);assert.equal(store.readRawDisplayPreference(climateB,true,decodeName),false,'direct durable API survives blocked localStorage methods');
 for(const key of ['hourly','daily']){const [,set]=store.useDisplayPreference(`App.detail.${key}.legend`,false,store.displayBoolean);set(key==='hourly')}
 assert.equal(store.readDisplayPreference('App.detail.hourly.legend',false,store.displayBoolean),true);assert.equal(store.readDisplayPreference('App.detail.daily.legend',true,store.displayBoolean),false);
 assert.ok(app.includes("`App.detail.${hourlyDetailOnly?'hourly':'daily'}.resolution`"));assert.ok(app.includes("if(detailResolution!=='1h')setDetailResolution('1h')"),'hourly view keeps its scientific 1h contract');
 assert.ok(app.includes("setDetailPreferences(current=>({...current,visible:"));assert.ok(app.includes("hiddenPrecip:current.hiddenPrecip.includes(type)"));
 const climateComponent=await readFile('src/ClimatePanel.tsx','utf8'),comparison=await readFile('src/LongRangeModelComparison.tsx','utf8'),route=await readFile('src/RouteWeatherPanel.tsx','utf8');
 assert.ok(climateComponent.includes('useRawDisplayPreference(favoriteNameKey,true,readFavoriteNameChoice,writeFavoriteNameChoice)'),'favorite-name state must switch with location key');
 assert.ok(!climateComponent.includes('localStorage.setItem(favoriteNameKey'),'a stale location-effect cannot overwrite another favorite choice');
 assert.ok(comparison.includes("useRawDisplayPreference<Metric>('mid:long-range:comparison-metric'"),'model comparison preserves its legacy key and synchronizes immediately');
 assert.ok(!comparison.includes("localStorage.setItem('mid:long-range:comparison-metric'"),'model comparison must not wait for a mount effect');
 assert.ok(comparison.includes("aria-pressed={metric==='temperature'}")&&comparison.includes("aria-pressed={metric==='precipitation'}"),'screen reader metric state');
 assert.ok(route.includes('className="route-mode-toggle" role="group"'),'pressed route-map mode buttons are not unimplemented tabs');
 const totals=await readFile('src/PrecipitationTotalsMap.tsx','utf8'),extreme=await readFile('src/ExtremeWeatherOutlookPanel.tsx','utf8');assert.ok(totals.includes('data?.frames.find(item=>item.hours===requestedHours)??data?.frames[0]'));assert.ok(!totals.includes('setHours(current=>result.frames'));assert.ok(!extreme.includes('if(!result.periods.some(period=>period.id===periodId))setPeriodId'));
 for(const file of ['App','ClimatePanel','ExtremeWeatherOutlookPanel','LongRangeModelComparison','LongRangePanel','PrecipitationTotalsMap','RouteWeatherPanel','UnifiedWeatherMap','WaterSportsPanel'])assert.ok((await readFile(`src/${file}.tsx`,'utf8')).includes('useDisplayPreference'));

 const storageSource=await readFile('src/forecastDetailStorage.ts','utf8');
 await build({stdin:{contents:storageSource,loader:'ts'},outfile:join(dir,'forecast-storage.mjs'),format:'esm',platform:'node'});
 const {initialForecastDetailsOpen:readForecastOpen}=await import(pathToFileURL(join(dir,'forecast-storage.mjs')));
 assert.equal(readForecastOpen(true,()=>{throw Error('denied')}),true,'hourly remains open');
 assert.equal(readForecastOpen(false,()=>{throw Error('denied')}),false,'blocked daily storage cannot crash render');
 assert.equal(readForecastOpen(false,()=> '1'),true,'legacy open');
 assert.equal(readForecastOpen(false,()=> '0'),false,'legacy closed');
 assert.equal(readForecastOpen(false,()=> null),false,'missing is closed');
 assert.ok(app.includes('initialForecastDetailsOpen(hourlyDetailOnly)'),'Actual Forecast must use safe reader');
 assert.ok(comparison.includes('strokeDasharray={item.dash||undefined}'),'legend must reuse exact line dash');
 assert.ok(comparison.includes('<svg aria-hidden="true" focusable="false" viewBox="0 0 27 10"'),'legend SVG should be decorative');


 const layoutStart=app.indexOf('function initialLayoutMode():LayoutMode{'),layoutEnd=app.indexOf('\nfunction collapseStoredStandardModules()',layoutStart);
 const orderStart=app.indexOf('function readFavoriteOrderSnapshot('),orderEnd=app.indexOf('\nfunction applyFavoriteOrder(',orderStart);
 assert.ok(layoutStart>0&&layoutEnd>layoutStart&&orderStart>0&&orderEnd>orderStart,'real app layout/order readers found');
 const protectedReaders=[
  "type LayoutMode='advanced'|'standard';",
  "const LAYOUT_MODE_STORAGE_KEY='layout-test';",
  "const FAVORITES_ORDER_KEY='favorites-order-test';",
  "type FavoriteOrderSnapshot={ids:string[];updatedAt:string};",
  app.slice(layoutStart,layoutEnd),
  app.slice(orderStart,orderEnd),
  'export {initialLayoutMode,readFavoriteOrderSnapshot};'
 ].join('\n');
 await build({stdin:{contents:protectedReaders,loader:'ts'},outfile:join(dir,'safe-readers.mjs'),format:'esm',platform:'node'});
 const {initialLayoutMode:readLayout,readFavoriteOrderSnapshot:readOrder}=await import(pathToFileURL(join(dir,'safe-readers.mjs')));
 globalThis.localStorage={getItem(){throw Error('storage denied')}};
 assert.equal(readLayout(),'standard','layout mode must not throw for denied storage');
 assert.equal(readOrder(),null,'favorite ordering must not throw for denied storage');
 const savedFavoriteOrder=JSON.stringify({ids:['b','a','b'],updatedAt:'2026-11-01T10:00:00Z'});
 globalThis.localStorage={getItem:key=>key==='layout-test'?'advanced':key==='favorites-order-test'?savedFavoriteOrder:null};
 assert.equal(readLayout(),'advanced','stored advanced layout preserved');
 assert.deepEqual(readOrder(),{ids:['b','a'],updatedAt:'2026-11-01T10:00:00Z'},'stored order deduplicated and preserved');
 globalThis.localStorage={getItem:key=>key==='layout-test'?'full':null};
 assert.equal(readLayout(),'advanced','legacy full mode preserved');
 globalThis.localStorage={getItem(){throw Error('denied')}};
 assert.deepEqual(readOrder(savedFavoriteOrder),{ids:['b','a'],updatedAt:'2026-11-01T10:00:00Z'},'explicit snapshot must not require storage');
 assert.equal(readOrder('{invalid'),null,'malformed favorite order ignored');


 // Audit 1.6: execute the actual production horizon selection / restore logic.
 await build({entryPoints:['src/forecastHorizonPreference.ts'],outfile:join(dir,'forecast-horizon.mjs'),format:'esm',platform:'node',bundle:true});
 const horizon=await import(pathToFileURL(join(dir,'forecast-horizon.mjs')));
 const available={shortTerm:true,sevenDay:true,fourteenDay:true},missingLong={shortTerm:true,sevenDay:true,fourteenDay:false};
 for(const [raw,expected]of [['seven-day','seven-day'],['fourteen-day','fourteen-day'],['short-term','short-term'],['bogus',null],['',null],[null,null]])assert.equal(horizon.readPreferredForecastHorizon(()=>raw),expected);
 assert.equal(horizon.readPreferredForecastHorizon(()=>{throw Error('denied')}),null,'blocked storage must not crash cockpit');
 assert.equal(horizon.restorableForecastHorizon('fourteen-day','short-term',missingLong),null,'unavailable favorite must not render');
 assert.equal(horizon.restorableForecastHorizon('fourteen-day','short-term',available),'fourteen-day','preferred 14d must return after recovery');
 assert.equal(horizon.restorableForecastHorizon('seven-day','short-term',available),'seven-day','preferred 7d must return after recovery');
 assert.equal(horizon.restorableForecastHorizon('fourteen-day','fourteen-day',available),null,'avoid loop');
 assert.equal(horizon.restorableForecastHorizon('fourteen-day','short-term',available,'short-term'),null,'explicit navigation wins');
 assert.equal(horizon.restorableForecastHorizon(null,'short-term',available),null,'unselected preference stays neutral');
 const forecastCockpit=await readFile('src/ForecastCockpit.tsx','utf8');
 assert.ok(forecastCockpit.includes('preferredHorizonRef.current=next'),'explicit navigation must update preferred value');
 assert.ok(forecastCockpit.includes('switchHorizon(readActiveHorizon(availability),false)'),'availability fallback must not persist');
 assert.ok(forecastCockpit.includes('restorableForecastHorizon(preferredHorizonRef.current,activeHorizon,availability,navigationHorizon)'),'restoration must honor explicit navigation');
 assert.ok(!forecastCockpit.includes('localStorage.setItem(ACTIVE_HORIZON_KEY,activeHorizon)'),'automatic fallback must not overwrite stored choice');

 // NoData-safe miniature SVG temperature series: temperature gaps are not fabricated or bridged.
 await build({entryPoints:['src/miniRibbonTemperature.ts'],outfile:join(dir,'mini-temperature.mjs'),format:'esm',platform:'node',bundle:true});
 const ribbon=await import(pathToFileURL(join(dir,'mini-temperature.mjs')));
 assert.equal(ribbon.miniRibbonTemperaturePath([{x:1,y:5},{x:2,y:null},{x:3,y:6}]),'M 1.00 5.00M 3.00 6.00','missing temperature must split line');
 assert.equal(ribbon.miniRibbonTemperaturePath([{x:1,y:5},{x:2,y:6},{x:3,y:NaN},{x:4,y:7},{x:5,y:8}]),'M 1.00 5.00 L 2.00 6.00M 4.00 7.00 L 5.00 8.00');
 assert.equal(ribbon.miniRibbonTemperaturePath([{x:1,y:null},{x:2,y:NaN}]),'','all-missing temperature produces no path');
 for(const v of [NaN,Infinity,-Infinity])assert.equal(ribbon.miniRibbonTemperatureLabel(v),'Temperatur nicht verfügbar');
 assert.equal(ribbon.miniRibbonTemperatureLabel(0),'0 °C');
 assert.equal(ribbon.miniRibbonTemperaturePath([{x:1,y:2},{x:Infinity,y:3},{x:4,y:5}]),'M 1.00 2.00M 4.00 5.00');
 assert.equal(forecastCockpit.split('miniRibbonTemperaturePath(linePoints)').length-1,2,'both miniature horizons use the same gap-safe SVG path');
 assert.ok(forecastCockpit.includes('linePoints.filter(item=>item.y!==null).map(item=><circle key={`temp-')&&forecastCockpit.includes('linePoints.filter(item=>item.y!==null).map(item=><circle key={`day-temp-'),'missing temperature must not be plotted as a dot');
 assert.ok(forecastCockpit.includes('miniRibbonTemperatureLabel(item.point.temperature)')&&forecastCockpit.includes('miniRibbonTemperatureLabel(item.day.max)'),'missing temperature tooltips must not show NaN °C');
 const modelComparison=await readFile('src/LongRangeModelComparison.tsx','utf8');
 assert.ok(modelComparison.includes("item.model.ensembleMembers===1?'1 Member':'Memberzahl nicht ausgewiesen'"),'unknown single-model member count must not claim a mean');

 console.log('PASS return-state contracts: raw legacy keys, climate location swaps, concurrent model metrics, invalid input, blocked storage bridge, keyboard semantics, legacy migration, exact booleans, precipitation types, stable object snapshots, concurrent panels, scoped legends/resolution, event cleanup and non-destructive availability fallback');
}finally{globalThis.localStorage=oldStorage;globalThis.window=oldWindow;delete globalThis.__midReturnMemory;await rm(dir,{recursive:true,force:true})}
