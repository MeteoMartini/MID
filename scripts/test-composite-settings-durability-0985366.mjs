import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mid-map-preference-'));
const memory=new Map(),originalWindow=globalThis.window;
globalThis.__midPreferenceTestMemory=memory;globalThis.window=new EventTarget();
try{
 const mock={name:'settings-mock',setup(b){
  b.onResolve({filter:/radarColorTables$/},()=>({path:'palette',namespace:'mock'}));
  b.onResolve({filter:/storageSafety$/},()=>({path:'storage',namespace:'mock'}));
  b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:a.path==='palette'?
   "export const DEFAULT_RADAR_COLOR_TABLE='dwd';":
   "export const readDurableStorageValue=k=>globalThis.__midPreferenceTestMemory.get(k)??null;export const writeDurableStorageValue=(k,v)=>{if(k.endsWith('layers:v3')&&globalThis.__failLegacy)return false;globalThis.__midPreferenceTestMemory.set(k,v);return true};"}));
 }};
 await build({entryPoints:['src/compositeSettings.ts'],outfile:join(dir,'composite.mjs'),bundle:true,format:'esm',platform:'node',plugins:[mock]});
 await build({entryPoints:['src/storageContracts.ts'],outfile:join(dir,'storage.mjs'),bundle:true,format:'esm',platform:'node'});
 const composite=await import(pathToFileURL(join(dir,'composite.mjs'))),contract=await import(pathToFileURL(join(dir,'storage.mjs')));
 const main=composite.COMPOSITE_SETTINGS_KEY,legacy=composite.COMPOSITE_LAYERS_KEY;
 const durable=['mid:ensemble:activeMetric','mid:ensemble:wind-mode','mid:ensemble:chart-open:temperature','mid:ensemble:chart-open:precipitation','mid:ensemble:chart-open:wind','mid:ensemble:advanced:change-radar','mid:ensemble:advanced:scenario-clusters'];
 for(const k of durable){assert.equal(contract.isTransientStorageKey(k),false,k);assert.equal(contract.isPersistentBackupKey(k),true,k);assert.equal(contract.isDurableStorageKey(k),true,k)}
 for(const k of ['mid:ensemble:v19:weather','mid:ensemble:cache:foo','mid:analysis-cache:x'])assert.equal(contract.isTransientStorageKey(k),true,k);
 memory.set(legacy,JSON.stringify({observationsEnabled:false,showRadar:false}));
 assert.equal(composite.readCompositeSettings().observationsEnabled,false,'migrate legacy false when no master');
 memory.set(main,JSON.stringify({observationsEnabled:true,showRadar:true}));
 assert.equal(composite.readCompositeSettings().observationsEnabled,true,'master wins over stale legacy');
 composite.patchCompositeSettings({observationsEnabled:false});
 memory.set(legacy,JSON.stringify({observationsEnabled:true,showRadar:true}));
 assert.equal(composite.readCompositeSettings().observationsEnabled,false,'old true never resurrects false');
 globalThis.__failLegacy=true;composite.patchCompositeSettings({showRadar:false});
 assert.equal(composite.readCompositeSettings().showRadar,false);assert.equal(composite.readCompositeSettings().observationsEnabled,false);
 globalThis.__failLegacy=false;
 memory.set(main,'{invalid');assert.equal(composite.readCompositeSettings().observationsEnabled,true,'corrupt master independently falls back to legacy');
 memory.set(main,JSON.stringify({observationsEnabled:false,radarOpacity:200,showRadar:false}));
 assert.equal(composite.readCompositeSettings().observationsEnabled,false);
 assert.equal(composite.readCompositeSettings().radarOpacity,100);assert.equal(composite.readCompositeSettings().showRadar,false);
 let observed=0;const stop=composite.subscribeCompositeSettings(()=>observed++);
 composite.patchCompositeSettings({showSatellite:true});assert.equal(observed,1);stop();
 composite.patchCompositeSettings({showSatellite:false});assert.equal(observed,1,'subscriber cleanup');
 const radar=await readFile('src/RadarPanel.tsx','utf8'),unified=await readFile('src/UnifiedWeatherMap.tsx','utf8'),ens=await readFile('src/EnsemblePanel.tsx','utf8'),backup=await readFile('src/persistence.ts','utf8');
 assert.ok(radar.includes('subscribeCompositeSettings(')&&radar.includes('patchCompositeSettings(patch)'));
 assert.ok(!radar.includes('setShowWarnings(false)'));
 assert.ok(unified.includes('...readUnifiedMapSettings(),...patch'));
 assert.ok(unified.includes("mid:unified-map-settings-changed"));
 assert.ok(ens.includes('readDurableStorageValue(ENSEMBLE_ACTIVE_METRIC_KEY)'));
 assert.ok(backup.includes("mid:composite-settings-changed"));
 console.log('PASS MID-C51 canonical composite, stale legacy, failed mirror, durable ensemble, unified map, subscribers');
}finally{delete globalThis.__midPreferenceTestMemory;delete globalThis.__failLegacy;globalThis.window=originalWindow;await rm(dir,{recursive:true,force:true})}
