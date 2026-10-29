import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=await mkdtemp(join(tmpdir(),'mid-display-availability-'));
const oldWindow=globalThis.window;
globalThis.__mid368Memory=new Map();globalThis.window=new EventTarget();
const boundary={name:'storage-boundary',setup(b){b.onResolve({filter:/storageSafety$/},()=>({path:'storage',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:'export const readDurableStorageValue=k=>globalThis.__mid368Memory.get(k)??null;export const writeDurableStorageValue=(k,v)=>globalThis.__mid368Memory.set(k,v);'}))}};
try{
 for(const [file,name]of [['mapReferenceLayers','reference'],['px250Availability','px']])await build({entryPoints:[`src/${file}.ts`],outfile:join(dir,name+'.mjs'),bundle:true,format:'esm',platform:'node',plugins:[boundary]});
 const refs=await import(pathToFileURL(join(dir,'reference.mjs'))),px=await import(pathToFileURL(join(dir,'px.mjs'))),memory=globalThis.__mid368Memory;
 memory.set(refs.MAP_REFERENCE_KEY,JSON.stringify({countries:false,water:true,roads:'false'}));
 const a=refs.readMapReferenceSettings(),b=refs.readMapReferenceSettings();assert.strictEqual(a,b,'cached external-store snapshot');assert.equal(a.countries,false);assert.equal(a.water,true);assert.equal(a.roads,false);
 // A stale mounted panel may only patch its changed field, preserving B's latest choice.
 refs.patchMapReferenceSettings({cities:false});refs.patchMapReferenceSettings({roads:true});
 assert.equal(refs.readMapReferenceSettings().cities,false);assert.equal(refs.readMapReferenceSettings().countries,false);assert.equal(refs.readMapReferenceSettings().roads,true);
 let calls=0;const stop=refs.subscribeMapReferenceSettings(()=>calls++);refs.patchMapReferenceSettings({water:false});assert.equal(calls,1);window.dispatchEvent(new Event('storage'));assert.equal(calls,2);stop();refs.patchMapReferenceSettings({countries:true});assert.equal(calls,2);
 for(const invalid of ['null','false','[]','{bad']){memory.set(refs.MAP_REFERENCE_KEY,invalid);assert.deepEqual(refs.readMapReferenceSettings(),refs.DEFAULT_MAP_REFERENCE)}
 const now=Date.parse('2026-10-29T20:00:00Z');
 for(const [age,expected]of [[-3600000,true],[-3600001,false],[900000,true],[900001,false],[0,true]])assert.equal(px.px250FreshForLocation(true,now+age,'50,7','50,7',now),expected);
 for(const stamp of [NaN,Infinity,-Infinity])assert.equal(px.px250FreshForLocation(true,stamp,'50,7','50,7',now),false);
 assert.equal(px.px250FreshForLocation(true,now,'50,7','40,2',now),false,'old location cannot activate the product');assert.equal(px.px250FreshForLocation(false,now,'50,7','50,7',now),false);
 // Run actual legacy migration reader with the production preference store.
 const cockpit=await readFile('src/ForecastCockpit.tsx','utf8'),reader=cockpit.match(/function readProfileLegendVisible\(\)\{[^\n]+/)[0];
 await build({stdin:{contents:`import {readDurableStorageValue} from './storageSafety';const PROFILE_LEGEND_KEY='mid:forecastCockpit:profileLegendVisible';${reader};export {readProfileLegendVisible};`,resolveDir:resolve('src'),loader:'ts'},outfile:join(dir,'legend.mjs'),bundle:true,format:'esm',platform:'node',plugins:[boundary]});
 const legend=await import(pathToFileURL(join(dir,'legend.mjs')));
 memory.set('mid:forecastCockpit:profileLegendVisible','0');assert.equal(legend.readProfileLegendVisible(),false);memory.set('mid:forecastCockpit:profileLegendVisible','1');assert.equal(legend.readProfileLegendVisible(),true);memory.delete('mid:forecastCockpit:profileLegendVisible');assert.equal(legend.readProfileLegendVisible(),true);
 const radar=await readFile('src/RadarPanel.tsx','utf8');
 assert.ok(radar.includes('highResolution:selectedHighResolution'),'persist requested resolution');assert.ok(radar.includes('const highResolution=selectedHighResolution&&pxFresh;'),'effective product requires fresh current-location metadata');
 const metadataEffect=radar.slice(radar.indexOf("useEffect(()=>{if(!panelVisible)return;let alive=true,controller"),radar.indexOf("useEffect(()=>{setSatelliteFallback(false)"));assert.ok(metadataEffect.includes('loadPx250Metadata'));assert.ok(!metadataEffect.includes('setHighResolution('),'metadata errors must never write the resolution preference');
 assert.ok(!/if\(!normalised.available\)setHighResolution/.test(radar));assert.ok(!/if\(highResolution&&pxMeta&&!pxFresh\)/.test(radar));
 assert.ok(radar.includes("persistCompositePatch({viewMode:'radar',showRadar:true,highResolution:mode==='px250'})"));
 assert.ok(radar.includes('useSyncExternalStore(subscribeMapReferenceSettings,readMapReferenceSettings'));
 assert.ok(cockpit.includes("useDisplayPreference('ForecastCockpit.profileLegendVisible',readProfileLegendVisible(),displayBoolean)"));assert.ok(!cockpit.includes('localStorage.setItem(PROFILE_LEGEND_KEY'));
 console.log('PASS display availability: current-location/freshness boundaries, requested resolution, atomic map-detail patches/subscriptions, false/legacy migration and shared legend preference');
}finally{globalThis.window=oldWindow;delete globalThis.__mid368Memory;await rm(dir,{recursive:true,force:true})}
