import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const [ensemble,radar,pxOverlay,worker,weather,styles]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/Px250Overlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
]);

assert.match(ensemble,/function useDesktopEnsemblePointer\(/,'desktop pointer controller missing');
for(const metric of ['temperature','precipitation','wind'])assert.match(ensemble,new RegExp(`data-mid-ensemble-desktop-hit-area="${metric}"`),`${metric} desktop hit area missing`);
assert.ok((ensemble.match(/<DesktopEnsembleTooltipPortal/g)||[]).length>=3,'manual desktop tooltip portal must be used for all three charts');
assert.ok((ensemble.match(/finePointer\?false:/g)||[]).length>=3,'Recharts tooltip must be disabled only when deterministic desktop layer is active');
assert.match(ensemble,/ArrowLeft/,'keyboard navigation missing');
assert.match(styles,/ensemble-desktop-tooltip-layer/,'desktop tooltip portal styling missing');

const hxBranch=worker.indexOf("if(inGermanyBounds(lat,lon)){try{const hx=await hxLatest()");
const localBranch=worker.indexOf('for(const site of candidates)',hxBranch);
assert.ok(hxBranch>=0&&localBranch>hxBranch,'national HX 250-m composite must be preferred before a local site radar');
assert.match(worker,/productName:'DWD HX 250-m-Deutschlandkomposit'/,'HX product identity missing');
assert.match(pxOverlay,/function radarRate\(/,'common physical rain-rate conversion missing');
assert.match(pxOverlay,/Math\.pow\(Math\.max\(0,z\/200\),1\/1\.6\)/,'reflectivity-to-equivalent-rain-rate conversion missing');
assert.match(pxOverlay,/function rateColour\(/,'shared rain-rate palette missing');

assert.match(worker,/names='centroid_forecast\|forecast_centroid/,'official centroid forecast elements are not parsed');
assert.match(worker,/uncertainty_ellipse/,'KONRAD3D uncertainty ellipse is not parsed');
assert.match(worker,/uncertaintyOrientationDeg/,'KONRAD3D ellipse angle is not exposed');
assert.match(weather,/uncertaintyOrientationDeg\?:number/,'frontend KONRAD3D type misses ellipse angle');
assert.match(radar,/function resolvedKonradTrack\(/,'KONRAD3D track resolver missing');
assert.match(radar,/for\(let minutes=5;minutes<=60;minutes\+=5\)/,'KONRAD3D vector fallback must create a 5-minute track through +60 minutes');
assert.match(radar,/konradForecastCorridor/,'KONRAD3D uncertainty corridor missing');
assert.match(radar,/konrad-uncertainty-ellipse/,'KONRAD3D uncertainty ellipses missing');
assert.match(radar,/konrad-forecast-node/,'KONRAD3D forecast nodes missing');
assert.match(radar,/aktuelle Zellfläche/,'legend must describe the rendered current footprint');

let executable=worker.slice(0,worker.indexOf('export default')).replace(/export\s*\{[^}]+\};?/g,'');
executable+='\n;globalThis.__mid09156={parseKonradCells};';
const sandbox={console,URL,URLSearchParams,Date,Math,JSON,Number,String,RegExp,Array,Object,Promise,Set,Map,Headers,Response,Request,TextEncoder,TextDecoder,atob,btoa,crypto:globalThis.crypto,fetch:async()=>{throw new Error('network disabled in regression')},addEventListener:()=>{},setTimeout,clearTimeout};
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(executable,sandbox,{timeout:5000});
const forecasts=[5,10,15,60].map(minutes=>`<centroid_forecast forecast_time="2026-08-04T${minutes===60?'16:00':`15:${String(minutes).padStart(2,'0')}`}:00Z"><geodetic_coordinate><latitude>${50+minutes/1000}</latitude><longitude>${7+minutes/1000}</longitude></geodetic_coordinate><uncertainty_ellipse><major_axis unit="km">${1+minutes/20}</major_axis><minor_axis unit="km">${.6+minutes/40}</minor_axis><angle unit="degrees">82</angle></uncertainty_ellipse></centroid_forecast>`).join('');
const xml=`<konrad3d><cells><feature identifier="cell-42"><geometry><centroid_3d><geodetic_coordinate><latitude>50</latitude><longitude>7</longitude></geodetic_coordinate></centroid_3d><cell_area>80</cell_area></geometry><intensity><severity>2</severity></intensity><tracking><cell_speed unit="km/h">40</cell_speed></tracking><forecast><centroid_forecasts>${forecasts}</centroid_forecasts></forecast></feature></cells></konrad3d>`;
const cells=sandbox.__mid09156.parseKonradCells(xml,50,7,'2026-08-04T15:00:00Z');
assert.equal(cells.length,1,'official KONRAD3D sample cell not parsed');
assert.deepEqual(Array.from(cells[0].trackForecasts,point=>point.minutes),[5,10,15,60],'all official 5-minute forecast positions must survive parsing');
assert.equal(cells[0].trackForecasts[0].uncertaintyOrientationDeg,82,'uncertainty ellipse angle lost');
assert.ok(cells[0].motionDirectionDeg>=0&&cells[0].motionDirectionDeg<360,'track direction not derived');

console.log('MID v0.9.15.6 desktop ensemble and composite/KONRAD3D regression passed.');
