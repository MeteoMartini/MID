import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const startup=await readFile(new URL('../src/startupPreload.ts',import.meta.url),'utf8');
assert.match(startup,/const stationRequest=startupRequest\(STARTUP_PRELOAD_STATION_TIMEOUT_MS,signal=>station\(/,'fast station preload must start directly');
assert.doesNotMatch(startup,/stationRequest=startupRequest[\s\S]{0,220}await delay\(35\)/,'fast station preload must not retain the artificial 35 ms delay');
const enrichment=startup.match(/const stationEnrichmentRequest=[\s\S]*?const ensembleRequest=/)?.[0]||'';
assert.ok(enrichment,'station enrichment block must exist');
assert.doesNotMatch(enrichment,/await stationRequest\.promise/,'full station enrichment must not be serialised behind the fast request');
assert.match(enrichment,/await delay\(20\)/,'full station enrichment keeps only a short burst-protection delay');

const enhancer=await readFile(new URL('../worker-src/08-konrad-track-history.js',import.meta.url),'utf8');
assert.match(enhancer,/MID_KONRAD_HISTORY_LEADS=\[15,30,45,60\]/,'KONRAD history fallback must expose sparse short-lead positions');
assert.match(enhancer,/trackTiming:'actual-konrad-run-plus-lead'/,'KONRAD diagnostics must state timestamp provenance');
assert.match(enhancer,/point\?\.derived!==true/,'official KONRAD forecast positions must remain authoritative');

const harness=`
function number(v){if(v===null||v===undefined||v==='')return undefined;const n=Number(v);return Number.isFinite(n)?n:undefined}
function distance(lat1,lon1,lat2,lon2){const r=6371000,t=x=>x*Math.PI/180,dLat=t(lat2-lat1),dLon=t(lon2-lon1),a=Math.sin(dLat/2)**2+Math.cos(t(lat1))*Math.cos(t(lat2))*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(a))}
function bearingTowards(lat1,lon1,lat2,lon2){const toRad=value=>value*Math.PI/180,toDeg=value=>value*180/Math.PI,phi1=toRad(lat1),phi2=toRad(lat2),deltaLon=toRad(lon2-lon1),y=Math.sin(deltaLon)*Math.cos(phi2),x=Math.cos(phi1)*Math.sin(phi2)-Math.sin(phi1)*Math.cos(phi2)*Math.cos(deltaLon);return(toDeg(Math.atan2(y,x))+360)%360}
function destinationPoint(lat,lon,bearingDeg,distanceKm){const radius=6371,angular=Math.max(0,Number(distanceKm)||0)/radius,bearing=Number(bearingDeg)*Math.PI/180,phi1=Number(lat)*Math.PI/180,lambda1=Number(lon)*Math.PI/180,phi2=Math.asin(Math.sin(phi1)*Math.cos(angular)+Math.cos(phi1)*Math.sin(angular)*Math.cos(bearing)),lambda2=lambda1+Math.atan2(Math.sin(bearing)*Math.sin(angular)*Math.cos(phi1),Math.cos(angular)-Math.sin(phi1)*Math.sin(phi2));return{latitude:phi2*180/Math.PI,longitude:((lambda2*180/Math.PI+540)%360)-180}}
function konradTimestamp(filename=''){const match=String(filename).match(/KONRAD3D_(\\d{8})T(\\d{6})\\.xml$/i);if(!match)return undefined;const date=match[1],time=match[2];return Date.UTC(Number(date.slice(0,4)),Number(date.slice(4,6))-1,Number(date.slice(6,8)),Number(time.slice(0,2)),Number(time.slice(2,4)),Number(time.slice(4,6)))}
const DWD_KONRAD3D_ROOTS=['https://dwd.test/'];
const frames={
 'KONRAD3D_20260916T095500.xml':{cells:[{id:'A42',latitude:50,longitude:8.14}]},
 'KONRAD3D_20260916T095000.xml':{cells:[{id:'A42',latitude:50,longitude:8.08}]},
 'KONRAD3D_20260916T094500.xml':{cells:[{id:'A42',latitude:50,longitude:8.02}]}
};
async function fetchText(url){if(url==='https://dwd.test/')return Object.keys(frames).map(name=>'href="'+name+'"').join(' ');const name=String(url).split('/').at(-1);return JSON.stringify(frames[name]||{cells:[]})}
function parseKonradCells(xml){return JSON.parse(xml).cells}
async function enrichStormAffectedPlaces(cell){return{...cell,affectedPlaces:[]}}
let dwdKonrad3dNowcast=async()=>{const cell={id:'A42',latitude:50,longitude:8.20,currentImpactRadiusKm:6,speedKmh:50,motionDirectionDeg:90,trackForecasts:[{minutes:10,latitude:50,longitude:8.27,derived:true}]};return{available:true,observedAt:'2026-09-16T10:00:00.000Z',nearbyCells:[cell],nearest:cell,diagnostics:{}}};
${enhancer}
globalThis.__midResult=dwdKonrad3dNowcast(50,8,'DE');
`;
const context={URL,Math,Date,Promise,console};vm.createContext(context);vm.runInContext(harness,context,{filename:'konrad-history-harness.js'});const result=await context.__midResult,cell=result.nearest;
assert.equal(cell.trackSource,'DWD KONRAD3D · beobachtete Zellhistorie');
assert.ok(['high','medium'].includes(cell.trackConfidence));
assert.ok(cell.trackObservedPositions>=3,'at least three observed centroids are required');
assert.deepEqual(Array.from(cell.trackForecasts,point=>point.minutes),[15,30,45,60]);
assert.equal(cell.trackForecasts[0].time,'2026-09-16T10:15:00.000Z');
assert.equal(cell.trackForecasts.at(-1).time,'2026-09-16T11:00:00.000Z');
assert.ok(cell.trackForecasts.every(point=>point.derived===true),'history-projected points must remain explicitly derived');
assert.ok(cell.trackForecasts.every((point,index,list)=>index===0||point.uncertaintyKm>=list[index-1].uncertaintyKm),'uncertainty must not shrink with lead time');
assert.equal(result.diagnostics.trackTiming,'actual-konrad-run-plus-lead');
assert.ok(result.diagnostics.trackHistoryFrames>=2);
console.log('MID 0.9.85.17 hyperlocal/KONRAD3D regression checks passed');
