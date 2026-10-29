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
 for(const key of ['hourly','daily']){const [,set]=store.useDisplayPreference(`App.detail.${key}.legend`,false,store.displayBoolean);set(key==='hourly')}
 assert.equal(store.readDisplayPreference('App.detail.hourly.legend',false,store.displayBoolean),true);assert.equal(store.readDisplayPreference('App.detail.daily.legend',true,store.displayBoolean),false);
 assert.ok(app.includes("`App.detail.${hourlyDetailOnly?'hourly':'daily'}.resolution`"));assert.ok(app.includes("if(detailResolution!=='1h')setDetailResolution('1h')"),'hourly view keeps its scientific 1h contract');
 assert.ok(app.includes("setDetailPreferences(current=>({...current,visible:"));assert.ok(app.includes("hiddenPrecip:current.hiddenPrecip.includes(type)"));
 const totals=await readFile('src/PrecipitationTotalsMap.tsx','utf8'),extreme=await readFile('src/ExtremeWeatherOutlookPanel.tsx','utf8');assert.ok(totals.includes('data?.frames.find(item=>item.hours===requestedHours)??data?.frames[0]'));assert.ok(!totals.includes('setHours(current=>result.frames'));assert.ok(!extreme.includes('if(!result.periods.some(period=>period.id===periodId))setPeriodId'));
 for(const file of ['App','ClimatePanel','ExtremeWeatherOutlookPanel','LongRangeModelComparison','LongRangePanel','PrecipitationTotalsMap','RouteWeatherPanel','UnifiedWeatherMap','WaterSportsPanel'])assert.ok((await readFile(`src/${file}.tsx`,'utf8')).includes('useDisplayPreference'));
 console.log('PASS return-state contracts: legacy migration, exact booleans, precipitation types, stable object snapshots, concurrent panels, scoped legends/resolution, event cleanup and non-destructive availability fallback');
}finally{globalThis.localStorage=oldStorage;globalThis.window=oldWindow;delete globalThis.__midReturnMemory;await rm(dir,{recursive:true,force:true})}
