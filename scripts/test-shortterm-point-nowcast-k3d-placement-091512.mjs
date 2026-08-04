import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const [fusion,shortTerm,cockpit,radar,weather,worker,styles]=await Promise.all([
 readFile(new URL('../src/forecastFusion.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
]);
assert.match(fusion,/mode:'proximity',hitClass:'nearby'/,'nearby echo must remain a proximity signal');
assert.match(fusion,/amount:safeModelAmount,probability:/,'nearby-only echo must not create site precipitation amount');
assert.match(fusion,/siteIntervals=overlappingSiteIntervals/,'short-term fusion must use exact interrupted site phases');
assert.match(fusion,/siteFrames\.reduce\(\(sum,frame\)=>sum\+clamp\(radarFinite\(frame\.rate\)/,'5-minute site frames must be accumulated');
assert.match(shortTerm,/DWD-RV-Standorttreffer/,'standalone short-term details must expose direct site hits');
assert.match(shortTerm,/kein Standorttreffer; nur als Umfeldsignal gewichtet/,'standalone short-term details must explain nearby echoes');
assert.match(cockpit,/radarSiteFrameCount:group\.reduce/,'cockpit aggregation must keep exact radar support metadata');
assert.match(weather,/currentFootprint\?:KonradFootprintPoint\[\]/,'K3D cell footprint type missing');
assert.match(worker,/konradAreaKm2\(geometry,'covered_area'/,'official covered_area must drive cell size');
assert.match(worker,/konradFootprint\(geometry,clat,clon\)/,'official geodetic cell footprint must be parsed');
assert.match(worker,/konradSpeedKmh\(tracking,'cell_speed','speed'\)/,'K3D speed units must be normalised');
assert.match(radar,/Pane name="mid-nowcast-vectors"/,'dedicated K3D vector pane missing');
assert.match(radar,/Pane name="mid-nowcast-labels"/,'dedicated K3D label pane missing');
assert.match(radar,/konradForecastNodeIcon/,'forecast nodes must use visible HTML markers');
assert.match(radar,/konradLocalEchoSupported/,'local K3D cells must be checked against current radar echoes');
assert.match(radar,/const detailedId=visibleCells\[0\]\?\.id/,'only one primary cell may create a full labelled track');
assert.match(styles,/mid-konrad-node/,'K3D HTML node styling missing');

let executable=worker.slice(0,worker.indexOf('export default')).replace(/export\s*\{[^}]+\};?/g,'');
executable+='\n;globalThis.__mid091512={parseKonradCells};';
const sandbox={console,URL,URLSearchParams,Date,Math,JSON,Number,String,RegExp,Array,Object,Promise,Set,Map,Headers,Response,Request,TextEncoder,TextDecoder,atob,btoa,crypto:globalThis.crypto,fetch:async()=>{throw new Error('network disabled')},addEventListener:()=>{},setTimeout,clearTimeout};sandbox.globalThis=sandbox;vm.createContext(sandbox);vm.runInContext(executable,sandbox,{timeout:5000});
const polygon='<geodetic_coordinates><polygon><latitude>50.00</latitude><longitude>7.00</longitude><latitude>50.01</latitude><longitude>7.00</longitude><latitude>50.01</latitude><longitude>7.02</longitude><latitude>50.00</latitude><longitude>7.02</longitude></polygon></geodetic_coordinates>';
const xml=`<konrad3d><feature identifier="cell-a"><geometry><centroid_3d><geodetic_coordinate><latitude>50.005</latitude><longitude>7.01</longitude></geodetic_coordinate></centroid_3d><covered_area unit="km2">2.4</covered_area>${polygon}</geometry><intensity><severity>1</severity></intensity><tracking><cell_speed unit="m/s">10</cell_speed></tracking></feature></konrad3d>`;
const cells=sandbox.__mid091512.parseKonradCells(xml,50,7,'2026-08-04T21:00:00Z');
assert.equal(cells.length,1);assert.equal(cells[0].currentFootprint.length,4);assert.equal(cells[0].cellAreaKm2,2.4);assert.equal(cells[0].speedKmh,36);
console.log('MID v0.9.15.12 app-wide point-nowcast and K3D placement regression passed.');
