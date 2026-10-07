import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transform} from 'esbuild';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const line=prefix=>{const value=app.split('\n').find(row=>row.trimStart().startsWith(prefix));assert.ok(value,`Missing ${prefix}`);return value;};
const persistence=line('function persistSelectedLocation('),stored=line('function storedLocation('),selection=line('function setLoc(');
const quick=app.slice(app.indexOf('function FavoriteQuickStrip('),app.indexOf('function HeightInput('));
const handlers=quick.slice(quick.indexOf(' const quickTapStart='),quick.indexOf(' return <nav'));
const click=quick.match(/onClick=\{(event=>\{const duplicate=suppressClick.current;[^\n]*?onSelect\(item.location\)\})\}/)?.[1];
assert.ok(click,'Favorite click must distinguish its own compatibility event');
let clock=1000,selectCalls=0,selected=null,aborts=0,writes=[];
const DateAt=class extends Date{static now(){return clock;}};
const scope={Date:DateAt,LOCATION_STORAGE_KEY:'mid:lastLocation',LOCATION_UPDATED_AT_KEY:'mid:lastLocation:updated-at',
 quickTap:{current:null},suppressClick:{current:null},item:{id:'a',location:{id:1,latitude:50,longitude:7}},
 loc:{id:0,latitude:49,longitude:6},seq:{current:0},pendingViewRestore:{current:null},selectedDateRef:{current:''},
 normalizeLocation:value=>value,locationsNearlyEquivalent:()=>false,locationsShallowEqual:()=>false,
 captureCurrentView:()=>null,abortAllRequests:()=>{aborts++;},
 writeDurableStorageValue:(key,value)=>{writes.push([key,value]);return true;},readDurableStorageValue:key=>key==='mid:lastLocation'?JSON.stringify(scope.item.location):null,
 onSelect:()=>{selectCalls++;},setLocState:value=>{selected=value;}};
for(const name of [...selection.matchAll(/\b(set[A-Z]\w*)\(/g)].map(match=>match[1]))if(!scope[name])scope[name]=()=>{};
const context=vm.createContext(scope),compiled=await transform(`${persistence}\n${stored}\n${selection}\n${handlers}\nglobalThis.click=${click};globalThis.start=quickTapStart;globalThis.move=quickTapMove;globalThis.end=quickTapEnd;globalThis.cancel=quickTapCancel;globalThis.select=setLoc;globalThis.persist=persistSelectedLocation;globalThis.stored=storedLocation;`,{loader:'ts',format:'iife',target:'es2022'});
vm.runInContext(compiled.code,context);
const event=(type='touch',pointerId=1,x=20,y=20)=>({pointerType:type,pointerId,clientX:x,clientY:y,detail:1,preventDefault(){}});

assert.equal(scope.persist(scope.item.location),true);assert.equal(writes.length,2);
for(const name of ['QuotaExceededError','SecurityError']){
 scope.writeDurableStorageValue=()=>{throw Object.assign(new Error('storage unavailable'),{name});};
 assert.equal(scope.persist(scope.item.location),false,'Persistence failure stays local to persistence');
 assert.equal(scope.stored().id,1,'Readable saved location is retained even if repairing its timestamp cannot be persisted');
 scope.select(scope.item.location);assert.equal(selected.id,1,'The current location changes despite storage failure');
}
scope.onSelect=location=>{selectCalls++;scope.select(location);};
selectCalls=0;
for(let index=0;index<100;index++){
 scope.item={id:String(index%2),location:{id:index+10,latitude:50+index/1000,longitude:7}};
 scope.start(event(),scope.item.id);scope.end(event(),scope.item);scope.click(event());
 assert.equal(selectCalls,index+1,'A touch tap and compatibility click select exactly once');
 assert.equal(selected.id,index+10,'Every repeated tap updates the actual location');clock+=20;
}
assert.equal(aborts,102,'Each real location selection invalidates previous requests');
const before=selectCalls;scope.click({...event(),detail:0});assert.equal(selectCalls,before+1,'Keyboard activation is not swallowed by a touch duplicate');
scope.start(event(),scope.item.id);scope.end(event(),scope.item);
scope.item={id:'another',location:{id:999,latitude:51,longitude:8}};scope.click(event());assert.equal(selected.id,999,'A different favorite is not globally blocked');
scope.start(event(),scope.item.id);scope.end(event(),scope.item);const mouseBefore=selectCalls;scope.start(event('mouse'),scope.item.id);scope.click(event('mouse'));assert.equal(selectCalls,mouseBefore+1,'A new mouse gesture clears the old touch token');

scope.onSelect=()=>{throw new Error('injected callback failure');};scope.start(event(),scope.item.id);assert.throws(()=>scope.end(event(),scope.item),/injected/);
scope.onSelect=()=>{selectCalls++;};const afterFailure=selectCalls;clock+=241;scope.click(event());assert.equal(selectCalls,afterFailure+1,'No callback exception can leave a permanent click latch');
scope.start(event(),scope.item.id);scope.cancel(event());scope.end(event(),scope.item);assert.equal(selectCalls,afterFailure+1,'Canceled touches do not select');
scope.start(event(),scope.item.id);scope.move(event('touch',1,60,20));scope.end(event(),scope.item);scope.click(event());assert.equal(selectCalls,afterFailure+1,'Horizontal movement and its compatibility click are not a tap');
console.log('Favorite selection resilience: 100 rapid selections, quota/security errors, real state/request invalidation, compatibility clicks, keyboard, mouse, cancellation and callback recovery passed.');
