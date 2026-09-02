import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pkg from '../package.json' with {type:'json'};
import worker,{knmiBuildTarIndex,knmiCachedTarIndex,knmiEpsTarCacheHealth,knmiPackSparseRanges,knmiTarHeader} from '../worker/metar-proxy.js';

class MemoryKv{
 constructor(){this.map=new Map();this.gets=0;this.puts=0;this.lists=0}
 async get(key,options){this.gets++;const value=this.map.get(key);if(value==null)return null;if(options?.type==='json')return JSON.parse(value);return value}
 async put(key,value,options){this.puts++;this.map.set(key,String(value));this.lastPut={key,options}}
 async list(){this.lists++;return{keys:[],list_complete:true}}
}
function writeOctal(target,offset,length,value){const text=Math.max(0,value).toString(8).padStart(length-1,'0')+'\0';for(let i=0;i<length;i++)target[offset+i]=text.charCodeAt(i)||0}
function tarHeader(name,size){const out=new Uint8Array(512),enc=new TextEncoder(),nameBytes=enc.encode(name);out.set(nameBytes.slice(0,100),0);writeOctal(out,100,8,0o644);writeOctal(out,108,8,0);writeOctal(out,116,8,0);writeOctal(out,124,12,size);writeOctal(out,136,12,0);for(let i=148;i<156;i++)out[i]=32;out[156]='0'.charCodeAt(0);out.set(enc.encode('ustar\0'),257);return out}
function syntheticTar(entries){const parts=[];for(const entry of entries){const header=tarHeader(entry.name,entry.size),body=new Uint8Array(Math.ceil(entry.size/512)*512);for(let i=0;i<entry.size;i++)body[i]=(i+17)%251;parts.push(header,body)}parts.push(new Uint8Array(1024));const total=parts.reduce((sum,part)=>sum+part.length,0),out=new Uint8Array(total);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out}

const tar=syntheticTar([
 {name:'HA43_N55_202609020800_00000_GB',size:819},
 {name:'HA43_N55_202609020800_00001_GB',size:701},
 {name:'HA43_N55_202609020800_00002_GB',size:1337}
]);
const first=knmiTarHeader(tar.slice(0,512),0);assert.equal(first.name,'HA43_N55_202609020800_00000_GB');assert.equal(first.dataOffset,512);assert.equal(first.byteLength,819);assert.equal(first.nextHeaderOffset,1536);
let headerRequests=0;const built=await knmiBuildTarIndex({dataset:'harmonie_arome_cy43_p4a',version:'1.0',archive:'HARM43_V1_P4A_2026090208.tar',members:[1,2,3,4,5]},async(offset,length)=>{headerRequests++;return tar.slice(offset,offset+length)});
assert.equal(built.schema,'mid.knmi.harmonie-eps.tar-index.v1');assert.equal(built.entryCount,3);assert.deepEqual(built.leadHours,[0,1,2]);assert.equal('members' in built,false,'Rolling-Membernummern dürfen nicht im langlebigen Archivindex persistiert werden.');assert.equal(built.entries[1].initialTime,'2026-09-02T08:00:00.000Z');assert.ok(headerRequests<=5,'Indexbau darf nur TAR-Header anfordern, nicht Dateiinhalte.');

const kv=new MemoryKv(),env={MID_PUSH_SUBSCRIPTIONS:kv},identity={dataset:'harmonie_arome_cy43_p4a',version:'1.0',archive:'HARM43_V1_P4A_2026090208.tar',members:[1,2,3,4,5]};let builds=0;
const firstCache=await knmiCachedTarIndex(env,identity,async()=>{builds++;return built});assert.equal(firstCache.cacheHit,false);assert.equal(firstCache.binding,'MID_PUSH_SUBSCRIPTIONS');assert.equal(kv.puts,1);assert.match(kv.lastPut.key,/^cache:knmi-eps:tar-index:v1:[0-9a-f]{64}$/);assert.equal(kv.lastPut.options.expirationTtl,72*3600);
const secondCache=await knmiCachedTarIndex(env,identity,async()=>{builds++;throw new Error('Cache wurde nicht wiederverwendet')});assert.equal(secondCache.cacheHit,true);assert.equal(builds,1);assert.equal(kv.puts,1);
const shiftedRollingIdentity={...identity,members:[6,7,8,9,10]};const shiftedCache=await knmiCachedTarIndex(env,shiftedRollingIdentity,async()=>{throw new Error('Dieselbe Stunden-TAR muss unabhängig von der zeitabhängigen Rolling-Memberzuordnung denselben Archivindex nutzen.')});assert.equal(shiftedCache.cacheHit,true);assert.equal(shiftedCache.key,secondCache.key);assert.equal('members' in shiftedCache.record,false);

const thirtyRanges=Array.from({length:30},(_,index)=>({offset:1000+index*100000,length:index%2?3:4,tag:`m${index+1}`})),packs=knmiPackSparseRanges(thirtyRanges);assert.equal(packs.length,2,'30 sparse Member-Ranges sollen in zwei Multi-Range-Requests passen.');assert.equal(packs[0].parts,16);assert.equal(packs[1].parts,14);assert.ok(packs.every(pack=>pack.rangeHeader.startsWith('bytes=')));assert.equal(packs.reduce((sum,pack)=>sum+pack.requestedBytes,0),thirtyRanges.reduce((sum,row)=>sum+row.length,0),'Range-Packing darf keine Vollarchive/Gap-Bytes hinzufügen.');

const health=knmiEpsTarCacheHealth(env);assert.equal(health.configured,true);assert.equal(health.binding,'MID_PUSH_SUBSCRIPTIONS');assert.equal(health.ttlHours,72);assert.match(health.pushNamespaceIsolation,/sub:-Keys/);assert.match(health.rangePacking.mode,/keine vollständigen TAR-\/GRIB-Downloads/);
const response=await worker.fetch(new Request('https://mid.test/?mode=knmi-eps-cache-health'),env,{}),payload=await response.json();assert.equal(response.status,200);assert.equal(payload.configured,true);assert.equal(payload.version,pkg.version,'Cache-Health-Version muss der kanonischen Releaseversion folgen.');assert.equal(kv.lists,0,'Cache-Health darf den gemeinsamen KV-Namespace nicht listen.');

const pushSource=await readFile(new URL('../worker-src/30-push-events.js',import.meta.url),'utf8'),aggregateBuilder=await readFile(new URL('../scripts/build-maintenance-aggregates.mjs',import.meta.url),'utf8');assert.match(pushSource,/MID_PUSH_SUBSCRIPTIONS\.list\(\{prefix:'sub:'/,'Push-Scheduler muss weiterhin ausschließlich sub:-Keys listen.');assert.match(aggregateBuilder,/worker-src\/05-knmi-eps-cache\.js/,'KNMI-Cache-Modul fehlt im kanonischen Worker-Aggregat.');
console.log('KNMI HARMONIE EPS productive-cache regression passed.');
