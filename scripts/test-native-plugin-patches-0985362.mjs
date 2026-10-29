import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const pkg=JSON.parse(await read('package.json')),lock=JSON.parse(await read('package-lock.json'));
const versions={app:'8.1.2',browser:'8.0.5',filesystem:'8.1.5',geolocation:'8.2.4',share:'8.0.3','status-bar':'8.0.4'};
for(const [name,version] of Object.entries(versions)){
 const full=`@capacitor/${name}`,entry=lock.packages[`node_modules/${full}`];
 assert.equal(pkg.dependencies[full],version);assert.equal(entry.version,version);
 const installed=JSON.parse(await read(`node_modules/${full}/package.json`));
 assert.equal(installed.version,version);assert.equal(installed.peerDependencies['@capacitor/core'],'>=8.0.0');
 assert.match(entry.integrity,/^sha512-/);assert.ok(entry.resolved.endsWith(`-${version}.tgz`));
 const spm=await read(`node_modules/${full}/Package.swift`);
 assert.ok(spm.includes('capacitor-swift-pm.git'));assert.ok(spm.includes('8.0.0'));
}
for(const name of ['core','ios'])assert.equal(pkg.dependencies[`@capacitor/${name}`],'8.5.3');
assert.equal(pkg.devDependencies['@capacitor/cli'],'8.5.3');
const methods={app:['App','addListener','getLaunchUrl'],browser:['Browser','open','close'],filesystem:['Filesystem','writeFile','getUri','deleteFile'],geolocation:['Geolocation','checkPermissions','requestPermissions','getCurrentPosition'],share:['Share','share'],'status-bar':['StatusBar','setStyle','setOverlaysWebView']};
for(const [name,[object,...keys]] of Object.entries(methods)){
 const module=await import(`@capacitor/${name}`);
 for(const key of keys)assert.equal(typeof module[object][key],'function',`${name}.${key}`);
}

// Execute the actual production adapters at their plugin boundary. These cases
// prove JS contracts and fallback behavior, not native OS implementation behavior.
const state={native:true,calls:[],permission:'granted',geoError:null,shareError:null};
globalThis.__midPluginPatchState=state;
const mocks={
 './runtimePlatform':`export const isMidNativeRuntime=()=>globalThis.__midPluginPatchState.native;`,
 '@capacitor/filesystem':`const s=globalThis.__midPluginPatchState;export const Directory={Cache:'CACHE'};export const Filesystem={writeFile:async x=>s.calls.push(['write',x]),getUri:async x=>(s.calls.push(['uri',x]),{uri:'file:///cache/export'}),deleteFile:async x=>s.calls.push(['delete',x])};`,
 '@capacitor/share':`const s=globalThis.__midPluginPatchState;export const Share={share:async x=>{s.calls.push(['share',x]);if(s.shareError)throw s.shareError}};`,
 '@capacitor/geolocation':`const s=globalThis.__midPluginPatchState;export const Geolocation={checkPermissions:async()=>({location:s.permission}),requestPermissions:async x=>(s.calls.push(['permission',x]),{location:'granted'}),getCurrentPosition:async x=>{s.calls.push(['native-location',x]);if(s.geoError)throw s.geoError;return {coords:{latitude:50,longitude:8,accuracy:3},timestamp:123}}};`
};
async function adapter(path){
 const result=await build({entryPoints:[new URL(`../src/${path}.ts`,import.meta.url).pathname],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'plugin-boundary',setup(b){b.onResolve({filter:/^(\.\/runtimePlatform|@capacitor\/)/},a=>({path:a.path,namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},a=>({contents:mocks[a.path],loader:'js'}));}}]});
 return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const fileAdapter=await adapter('filePlatform'),location=await adapter('locationPlatform');
const file=new File([new Uint8Array([0,127,128,255])],'../../Wetter ü.json');
assert.equal(await fileAdapter.shareOrExportMidFile({file,title:'MID'}),'native-share');
assert.deepEqual(state.calls.map(c=>c[0]),['write','uri','share','delete']);
assert.equal(state.calls[0][1].directory,'CACHE');assert.match(state.calls[0][1].path,/^mid-share\/\d+-[A-Za-z0-9._-]+$/);
assert.equal(state.calls[0][1].data,'AH+A/w==');assert.equal(state.calls[3][1].path,state.calls[0][1].path);
assert.deepEqual(state.calls[2][1].files,['file:///cache/export']);
state.calls=[];state.shareError=new Error('cancelled');
await assert.rejects(fileAdapter.shareOrExportMidFile({file,title:'MID'}),/cancelled/);
assert.equal(state.calls.at(-1)[0],'delete');state.shareError=null;
let browserLocations=0,webShares=0;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{geolocation:{getCurrentPosition(resolve){browserLocations++;resolve({coords:{latitude:51,longitude:9,accuracy:5},timestamp:456})}},canShare:()=>true,share:async()=>{webShares++}}});
state.native=false;state.calls=[];
assert.equal(await fileAdapter.shareOrExportMidFile({file,title:'MID'}),'web-share');assert.equal(webShares,1);assert.deepEqual(state.calls,[]);
assert.equal((await location.getMidCurrentPosition()).source,'browser');assert.equal(browserLocations,1);
state.native=true;state.calls=[];state.permission='prompt';
const position=await location.getMidCurrentPosition({timeout:1200});
assert.equal(position.source,'native');assert.equal(position.coords.altitude,null);
assert.deepEqual(state.calls[0],['permission',{permissions:['location']}]);assert.equal(state.calls[1][1].timeout,1200);
state.permission='denied';await assert.rejects(location.getMidCurrentPosition(),e=>e.code==='OS-PLUG-GLOC-0003');assert.equal(browserLocations,1);
state.permission='granted';state.geoError=Object.assign(new Error('denied'),{code:'OS-PLUG-GLOC-0008'});
await assert.rejects(location.getMidCurrentPosition(),e=>e.code==='OS-PLUG-GLOC-0008');assert.equal(browserLocations,1);
state.geoError=Object.assign(new Error('unavailable'),{code:'UNAVAILABLE'});
assert.equal((await location.getMidCurrentPosition()).source,'browser');assert.equal(browserLocations,2);
delete globalThis.__midPluginPatchState;
console.log('Six exact native plugin patches: installed exports/SPM, byte-preserving share cleanup, browser fallback and permission denial contracts passed; no physical OS qualification implied.');
