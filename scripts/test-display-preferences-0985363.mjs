import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mid-display-test-'));
try{
 const memory=new Map();globalThis.__midPreferenceMemory=memory;
 await build({entryPoints:['src/useDisplayPreference.ts'],outfile:join(dir,'test.mjs'),bundle:true,platform:'node',format:'esm',plugins:[{name:'controlled-boundaries',setup(b){
 b.onResolve({filter:/^react$/},()=>({path:'react',namespace:'fixture'}));
 b.onResolve({filter:/storageSafety$/},()=>({path:'storage',namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({contents:a.path==='react'?`export const useState=f=>[typeof f==='function'?f():f,()=>{}];export const useRef=value=>({current:value});export const useCallback=f=>f;export const useMemo=f=>f();export const useSyncExternalStore=(_,read)=>read();`:`export const readDurableStorageValue=k=>globalThis.__midPreferenceMemory.get(k)??null;export const writeDurableStorageValue=(k,v)=>globalThis.__midPreferenceMemory.set(k,v);`}));
 }}]});
 const {readDisplayPreference,writeDisplayPreference,useDisplayPreference,displayBoolean,displayChoice}=await import(pathToFileURL(join(dir,'test.mjs')));
 const key='mid:display-preference:v1:case';
 for(const invalid of ['null','{}','[]','0','"false"','garbage']){memory.set(key,invalid);assert.equal(readDisplayPreference('case',true,displayBoolean),true)}
 memory.delete(key);let [initial,set]=useDisplayPreference('case',true,displayBoolean);assert.equal(initial,true);
 set(false);assert.equal(memory.get(key),'false','commit must happen before any render/effect');
 assert.equal(useDisplayPreference('case',true,displayBoolean)[0],false,'unmount/remount must retain false');
 set(v=>!v);set(v=>!v);assert.equal(memory.get(key),'false','rapid functional toggles use last committed value');
 set('invalid');assert.equal(memory.get(key),'false');
 const [,a]=useDisplayPreference('parallel',true,displayBoolean),[,b]=useDisplayPreference('parallel',true,displayBoolean);
 b(false);a(value=>!value);assert.equal(readDisplayPreference('parallel',false,displayBoolean),true,'older panel must update from the latest committed value');
 const validObject=value=>Boolean(value&&typeof value==='object'&&typeof value.enabled==='boolean');
 const fallback={enabled:true};writeDisplayPreference('record',{enabled:false});
 const first=readDisplayPreference('record',fallback,validObject),second=readDisplayPreference('record',fallback,validObject);assert.strictEqual(first,second,'external-store object snapshots must be stable');assert.equal(first.enabled,false);
 memory.set('mid:display-preference:v1:record','null');assert.strictEqual(readDisplayPreference('record',fallback,validObject),fallback);
 const choice=displayChoice('field','absolute');memory.set(key,'"outdated"');assert.equal(readDisplayPreference('case','field',choice),'field');
 const [,select]=useDisplayPreference('case','field',choice);select('absolute');assert.equal(readDisplayPreference('case','field',choice),'absolute');
 const contracts=await readFile('src/storageContracts.ts','utf8');assert.ok(!contracts.includes("'mid:display-preference:"),'user preferences must not be classified as transient');
 const bridge=await readFile('src/persistence.ts','utf8');assert.ok(bridge.includes("window.addEventListener('mid:display-preference-changed',schedulePersist)"));
 for(const file of ['EnsemblePanel','NativeModelMap','UnifiedWeatherMap','PrecipitationTotalsMap','SubseasonalTrendPanel','PollenForecast','ExtremeWeatherOutlookPanel','ClimatePanel'])assert.ok((await readFile(`src/${file}.tsx`,'utf8')).includes('useDisplayPreference(')||(await readFile(`src/${file}.tsx`,'utf8')).includes('useDisplayPreference<'));
 console.log('PASS durable display preferences: invalid values, false, enums, synchronous writes, rapid toggles, remount and backup bridge');
}finally{delete globalThis.__midPreferenceMemory;await rm(dir,{recursive:true,force:true})}
