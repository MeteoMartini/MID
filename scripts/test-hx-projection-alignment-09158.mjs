import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [projectionSource,overlaySource]=await Promise.all([
 readFile(new URL('../src/radarProjection.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/Px250Overlay.tsx',import.meta.url),'utf8'),
]);

assert.match(overlaySource,/meta\.product==='hx'/,'HX-specific rendering branch missing');
assert.match(overlaySource,/createProjectedLayer\(raster,opacityRef\.current\)/,'HX must use a projection-aware Leaflet grid layer');
assert.match(overlaySource,/stereographicRadius\(latitude,raster\.projection\)/,'Web-Mercator tile rows are not transformed into the HX projection');
assert.match(overlaySource,/sourceX=Math\.round\(projectedX\/raster\.xScale\)/,'HX x coordinate is not mapped to the source raster');
assert.match(overlaySource,/sourceY=Math\.round\(-projectedY\/raster\.yScale\)/,'HX y axis must decrease from the upper-left source row');
assert.doesNotMatch(overlaySource,/if\(meta\.product==='hx'\)[\s\S]{0,500}boundsFromFile\(/,'HX must not be stretched into a geographic rectangle');

const js=ts.transpileModule(projectionSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('module','exports','require',js)(module,module.exports,require);
const {projectionFromDefinition,projectWgs84,inverseProjectedPoint}=module.exports;
const definition='+proj=stere +lat_ts=60 +lat_0=90 +lon_0=10 +x_0=543571.83521776402 +y_0=3622213.8619310022 +units=m +a=6378137 +b=6356752.3142451802 +no_defs';
const projection=projectionFromDefinition(definition);
assert.ok(projection,'HX stereographic projection definition was not parsed');

// Referenzwerte aus der globalen HX-where-Gruppe. Die vier geografischen
// Ecken liegen jeweils eine halbe 250-m-Zelle außerhalb der Pixelzentren.
const references=[
 {name:'UL',lat:55.862087108249824,lon:1.463301510256666,x:-125,y:125},
 {name:'UR',lat:55.845438563255755,lon:18.73161645466747,x:1099875,y:125},
 {name:'LL',lat:45.696425377390064,lon:3.5669946350078914,x:-125,y:-1199875},
 {name:'LR',lat:45.68460578137082,lon:16.580869348598274,x:1099875,y:-1199875},
];
for(const reference of references){
 const projected=projectWgs84(reference.lat,reference.lon,projection);
 assert.ok(projected,`${reference.name} could not be projected`);
 assert.ok(Math.abs(projected[0]-reference.x)<.02,`${reference.name} x misplaced by ${projected[0]-reference.x} m`);
 assert.ok(Math.abs(projected[1]-reference.y)<.02,`${reference.name} y misplaced by ${projected[1]-reference.y} m`);
 const inverse=inverseProjectedPoint(reference.x,reference.y,projection);
 assert.ok(inverse,`${reference.name} inverse projection failed`);
 assert.ok(Math.abs(inverse[0]-reference.lat)<1e-7,`${reference.name} inverse latitude mismatch`);
 assert.ok(Math.abs(inverse[1]-reference.lon)<1e-7,`${reference.name} inverse longitude mismatch`);
}

const muenster=projectWgs84(51.9607,7.6261,projection);
assert.ok(muenster,'Münster projection failed');
const sourceColumn=Math.round(muenster[0]/250),sourceRow=Math.round(-muenster[1]/250);
assert.ok(sourceColumn>=0&&sourceColumn<4400,`Münster column outside HX grid: ${sourceColumn}`);
assert.ok(sourceRow>=0&&sourceRow<4800,`Münster row outside HX grid: ${sourceRow}`);
const roundTrip=inverseProjectedPoint(sourceColumn*250,-sourceRow*250,projection);
assert.ok(roundTrip&&Math.abs(roundTrip[0]-51.9607)<.003&&Math.abs(roundTrip[1]-7.6261)<.003,'Münster source-cell round trip is not within one HX pixel');

console.log('MID v0.9.15.8 HX projection alignment regression passed.');
