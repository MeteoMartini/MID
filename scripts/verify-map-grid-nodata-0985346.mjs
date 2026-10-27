import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transform} from 'esbuild';
const worker=readFileSync('worker/metar-proxy.js','utf8').replace(/export default\s*\{/,'const __workerDefault={').replace(/^export \{[^\n]+\};?$/gm,'');
const time='2026-10-27T12:00',shifted='2026-10-27T13:00';let count=0,badTimes=false;
const quantities=[null,0,-1,123456.789012345,.1,false,'0',.2,.123456789];
const codes=[null,0,71.5,99,71,false,'0',100,71];
const fetch=async input=>{
 const url=new URL(String(input));
 if(url.pathname.includes('meta.json'))return new Response(JSON.stringify({last_run_initialisation_time:Date.parse(time+'Z')/1000}),{status:200});
 const n=url.searchParams.get('latitude').split(',').length;
 return new Response(JSON.stringify(Array.from({length:n},()=>{
  const index=count++,j=index%9,wrong=badTimes?index>0:index===4;
  return{hourly:{time:[wrong?shifted:time],pressure_msl:[1015],temperature_850hPa:[5],relative_humidity_850hPa:[80],temperature_2m:[10],relative_humidity_2m:[85],weather_code:[codes[j]],precipitation:[quantities[j]],snowfall:[quantities[j]]}};
 })),{status:200});
};
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,DataView,Uint8Array,ArrayBuffer,crypto,setTimeout,clearTimeout,fetch});
vm.runInContext(worker,context,{timeout:5000});
const data=JSON.parse(JSON.stringify(await vm.runInContext("weatherMapGridData(50,7,'icon-d2')",context)));
const frame=data.frames[0];assert.equal(frame.time,time+':00.000Z','GMT response must be independent of process timezone');assert.equal(frame.precipitation.length,99);
assert.deepEqual(frame.precipitation.slice(0,9),[null,0,null,123456.789012345,null,null,null,.2,.123456789]);
assert.deepEqual(frame.weatherCode.slice(0,9),[null,0,null,99,null,null,null,null,71]);
assert.equal(frame.thetaE[4],null);assert.equal(frame.temperature2m[4],null);
assert.equal(frame.precipitation[8],.123456789,'Canonical positive/extreme values must not be rounded');
count=0;badTimes=true;await assert.rejects(vm.runInContext("weatherMapGridData(50,7,'icon-d2')",context),/keine auswertbaren/);
// Execute the actual renderer with a tiny React/MapLibre boundary, inspecting emitted GeoJSON.
let source=readFileSync('src/WeatherMapGridOverlay.tsx','utf8').replace(/^import .*;\n/gm,'').replace(/export default memo\(WeatherMapGridOverlay\);/,'globalThis.renderGrid=WeatherMapGridOverlay;');
const js=await transform(source,{loader:'tsx',target:'es2022',jsxFactory:'React.createElement'});
const renderer=vm.createContext({useMemo:fn=>fn(),formatWeatherValue:value=>String(value),React:{createElement:(_component,props)=>props}});
vm.runInContext('const GeoJsonLayers=()=>null;\n'+js.code,renderer);
for(const kind of ['pressure-thetae','pressure-sigwx','pressure-precip']){
 renderer.input={data,frame,kind,opacity:1};
 const output=vm.runInContext('renderGrid(input)',renderer);
 assert.ok(output.data.features.every(f=>f.properties.kind!=='cell'||typeof f.properties.value==='number'&&Number.isFinite(f.properties.value)),'Missing must not produce cell geometry');
 if(kind==='pressure-sigwx')assert.ok(output.data.features.every(f=>f.properties.kind!=='cell'||Number.isInteger(f.properties.value)&&f.properties.value<=99));
 if(kind==='pressure-precip')assert.ok(output.data.features.some(f=>f.properties.value===123456.789012345),'Valid extremes remain present');
}
console.log('ICON-D2 map grid: real Worker JSON, aligned point times, Missing/zero/extreme integrity and actual renderer GeoJSON passed.');
