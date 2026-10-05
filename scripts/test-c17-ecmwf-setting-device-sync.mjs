import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build} from 'esbuild';

const root=process.cwd();
const bundle=async(entry,plugins=[])=>{
 const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'esm',write:false,plugins});
 return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
};
const settings=await bundle(`${root}/src/forecastDisplaySettings.ts`);
const portable=await bundle(`${root}/src/portableUserData.ts`,[{
 name:'storage-safety-test-stub',
 setup(build){
  build.onResolve({filter:/\.\/storageSafety$/},()=>({path:'storage-safety-stub',namespace:'test'}));
  build.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export function storageFallbackEntries(){return new Map()}'}));
 }
}]);
const deviceSync=await bundle(`${root}/src/deviceSync.ts`,[{
 name:'device-sync-test-stubs',
 setup(build){
  const stubs={
   forecastVerification:'export async function exportForecastVerificationArchive(){return{schema:"mid-weather-twin-archive",version:1,updatedAt:"",locations:{},counts:{locations:0,captures:0,references:0,observations:0}}} export async function importForecastVerificationArchive(){return{locations:0,captures:0,references:0,observations:0,updatedAt:""}}',
   workerClient:'export function buildWorkerUrl(base,mode){return `${base}/${mode}`} export function workerBaseCandidates(){return ["https://c17-sync.test"]}',
   eventFavoriteState:'export function eventFavoriteRevision(){return 0}',
   storageSafety:'export function storageFallbackEntries(){return new Map()}'
  };
  build.onResolve({filter:/^\.\/(?:forecastVerification|workerClient|eventFavoriteState|storageSafety)$/},args=>({path:args.path.slice(2),namespace:'c17-sync-stubs'}));
  build.onLoad({filter:/.*/,namespace:'c17-sync-stubs'},args=>({contents:stubs[args.path],loader:'js'}));
 }
}]);
const KEY=settings.FORECAST_DISPLAY_SETTINGS_KEY;

class MemoryStorage{
 constructor(){this.values=new Map()}
 get length(){return this.values.size}
 key(index){return [...this.values.keys()][index]??null}
 getItem(key){return this.values.get(String(key))??null}
 setItem(key,value){this.values.set(String(key),String(value))}
 removeItem(key){this.values.delete(String(key))}
}

for(const value of[true,false]){
 const current={current:{ecmwfTemperatureColors:!value,showSevenDaySummary:false}};
 const writes=[];
 const storage={setItem(key,raw){writes.push([key,raw])}};
 const next=settings.commitForecastDisplaySettings(previous=>({...previous,ecmwfTemperatureColors:value}),current,storage);
 assert.equal(next.ecmwfTemperatureColors,value,`setter resolves ${value}`);
 assert.equal(current.current,next,'latest settings ref updates synchronously');
 assert.deepEqual(writes,[[KEY,JSON.stringify(next)]],`setting ${value} is written before the setter returns`);
}

const localTrue=JSON.stringify({ecmwfTemperatureColors:true,showSevenDaySummary:false});
const remoteLegacy=JSON.stringify({showSevenDaySummary:true});
const legacyMerged=settings.preserveLegacyForecastDisplaySettings({[KEY]:remoteLegacy,'mid:layoutMode':'advanced'},localTrue);
assert.deepEqual(JSON.parse(legacyMerged.values[KEY]),{showSevenDaySummary:true,ecmwfTemperatureColors:true},'legacy remote settings keep the local ECMWF flag while remote values still win');
assert.equal(legacyMerged.preservedLocal,true,'a locally retained legacy flag is marked for migration back to the shared snapshot');
assert.equal(legacyMerged.values['mid:layoutMode'],'advanced','other remote settings are unchanged');
assert.equal(JSON.parse(remoteLegacy).ecmwfTemperatureColors,undefined,'input snapshot is not mutated');

const remoteFalse=settings.preserveLegacyForecastDisplaySettings({[KEY]:JSON.stringify({ecmwfTemperatureColors:false})},localTrue);
assert.equal(JSON.parse(remoteFalse.values[KEY]).ecmwfTemperatureColors,false,'an explicit remote false remains authoritative');
assert.equal(remoteFalse.preservedLocal,false,'an explicit remote false does not trigger an upload of the local value');
const remoteTrue=settings.preserveLegacyForecastDisplaySettings({[KEY]:JSON.stringify({ecmwfTemperatureColors:true})},JSON.stringify({ecmwfTemperatureColors:false}));
assert.equal(JSON.parse(remoteTrue.values[KEY]).ecmwfTemperatureColors,true,'an explicit remote true remains authoritative');
assert.equal(settings.preserveLegacyForecastDisplaySettings({},localTrue).values[KEY],localTrue,'a snapshot missing the whole preference key cannot remove the saved value');
assert.equal(settings.preserveLegacyForecastDisplaySettings({[KEY]:'not-json'},localTrue).values[KEY],localTrue,'an invalid remote preference cannot replace a valid saved value');
assert.equal(settings.preserveLegacyForecastDisplaySettings({},null).values[KEY],undefined,'no local value is invented for an absent legacy key');

const storage=new MemoryStorage();
const savedFavorite='[{"id":"favorite-1"}]';
storage.setItem(KEY,localTrue);
storage.setItem('mid:favorites',savedFavorite);
globalThis.localStorage=storage;
assert.equal(portable.isPortableUserDataKey(KEY),true,'the preference remains part of device sync');
assert.equal(portable.isPortableUserDataKey('mid:device-sync:v1'),false,'device sync credentials remain device-local');
const collected=portable.collectPortableUserData(storage).values;
assert.equal(collected[KEY],localTrue,'outgoing snapshots include the saved preference');
assert.equal(collected['mid:favorites'],savedFavorite,'outgoing snapshots retain existing user data');

const incoming=settings.preserveLegacyForecastDisplaySettings({'mid:favorites':savedFavorite},storage.getItem(KEY));
portable.replacePortableUserData(incoming.values,storage,true);
assert.equal(storage.getItem(KEY),localTrue,'applying a legacy snapshot cannot delete the preference');
assert.equal(storage.getItem('mid:favorites'),savedFavorite,'normal portable user data still applies');

const app=readFileSync(`${root}/src/App.tsx`,'utf8');
const sync=readFileSync(`${root}/src/deviceSync.ts`,'utf8');
assert.ok(app.includes('setForecastDisplaySettings=update=>setForecastDisplaySettingsRaw(commitForecastDisplaySettings(update,forecastDisplaySettingsRef))'),'the Settings control uses the synchronous persisted setter');
assert.ok(app.includes('localStorage.setItem(FORECAST_DISPLAY_SETTINGS_KEY,JSON.stringify(forecastDisplaySettings))'),'the existing post-render persistence remains as a fallback');
assert.ok(sync.includes('preserveLegacyForecastDisplaySettings({...snapshot.values},localStorage.getItem(FORECAST_DISPLAY_SETTINGS_KEY))'),'legacy preference preservation runs before snapshot application');
assert.ok(sync.includes('if(applied.preservedLocalForecastDisplaySettings)await pushDeviceSync(readDeviceSyncConfig(),true)'),'a locally preserved legacy preference is force-pushed to migrate the shared snapshot');
assert.ok(sync.includes('replacePortableUserData(prepared.values,localStorage,snapshot.version>=2)'),'the existing versioned replacement policy is unchanged');

const syncKey='c17-test-key-0123456789-abcdefghijklmnopqrstuvwxyz',favoriteUpdatedAt='2026-10-04T12:00:00.000Z';
const favoriteOrder=JSON.stringify({ids:['favorite-1'],updatedAt:favoriteUpdatedAt});
const portableFavorites={
 'mid:favorites':savedFavorite,
 'mid:favorites:shadow:v1':savedFavorite,
 'mid:favorites:updated-at':favoriteUpdatedAt,
 'mid:favorites:tombstones:v1':'{}',
 'mid:favorites:order:v1':favoriteOrder
};
const syncEvents=[];
globalThis.window={dispatchEvent(event){syncEvents.push(event.type);return true}};
globalThis.CustomEvent??=class{constructor(type,options={}){this.type=type;this.detail=options.detail}};
const makeSyncStorage=()=>{const result=new MemoryStorage();result.setItem(KEY,localTrue);for(const[key,value]of Object.entries(portableFavorites))result.setItem(key,value);result.setItem(deviceSync.DEVICE_SYNC_CONFIG_KEY,JSON.stringify({enabled:true,syncKey,deviceId:'c17-local-device'}));return result};
const testB64url=bytes=>Buffer.from(bytes).toString('base64url');
const testFromB64url=value=>new Uint8Array(Buffer.from(value,'base64url'));
async function encryptTestSnapshot(values,updatedAt){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(syncKey));
 const aes=await crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt']);
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},aes,new TextEncoder().encode(JSON.stringify({schema:'mid-device-state',version:2,updatedAt,values})));
 return{iv:testB64url(iv),data:testB64url(new Uint8Array(data))};
}
async function decryptTestSnapshot(blob){
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(syncKey));
 const aes=await crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['decrypt']);
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:testFromB64url(blob.iv)},aes,testFromB64url(blob.data));
 return JSON.parse(new TextDecoder().decode(plain));
}
let remoteState={updatedAt:'2026-09-01T00:00:00.000Z',values:{...portableFavorites}};
const pushedBodies=[];
globalThis.fetch=async(input,init={})=>{
 const url=String(input);
 if(url.endsWith('/device-sync-pull'))return new Response(JSON.stringify({blob:await encryptTestSnapshot(remoteState.values,remoteState.updatedAt),updatedAt:remoteState.updatedAt}),{status:200});
 if(url.endsWith('/device-sync-push')){pushedBodies.push(JSON.parse(init.body));return new Response(JSON.stringify({updatedAt:'2026-10-05T00:00:00.000Z'}),{status:200})}
 throw new Error(`Unexpected device-sync request: ${url}`);
};
globalThis.localStorage=makeSyncStorage();
const legacyPull=await deviceSync.pullDeviceSync(deviceSync.readDeviceSyncConfig());
assert.equal(legacyPull.found,true,'the legacy cloud snapshot was read');
assert.equal(globalThis.localStorage.getItem(KEY),localTrue,'legacy download preserves the existing ECMWF choice');
assert.equal(globalThis.localStorage.getItem('mid:favorites'),savedFavorite,'legacy migration leaves existing favorite data intact');
assert.equal(pushedBodies.length,1,'the preserved setting is written back to the shared snapshot exactly once');
const migratedSnapshot=await decryptTestSnapshot(pushedBodies[0].blob);
assert.equal(migratedSnapshot.values[KEY],localTrue,'the migrated encrypted upload contains the retained preference');
assert.equal(migratedSnapshot.values['mid:favorites'],savedFavorite,'the migrated upload keeps existing portable user data');

pushedBodies.length=0;
globalThis.localStorage=makeSyncStorage();
remoteState={updatedAt:'2026-09-02T00:00:00.000Z',values:{...portableFavorites,[KEY]:JSON.stringify({ecmwfTemperatureColors:false})}};
await deviceSync.pullDeviceSync(deviceSync.readDeviceSyncConfig());
assert.equal(JSON.parse(globalThis.localStorage.getItem(KEY)).ecmwfTemperatureColors,false,'an explicit remote false remains authoritative in the full sync path');
assert.equal(pushedBodies.length,0,'an explicit remote preference is not overwritten by a migration push');

console.log('C17 ECMWF device-sync contract passed: synchronous writes, true/false persistence, legacy snapshot migration through encrypted pull/apply/push, preserved portable data, and unchanged replacement rules.');
