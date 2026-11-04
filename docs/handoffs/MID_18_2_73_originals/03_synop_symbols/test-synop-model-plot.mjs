import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-ww-'));
execFileSync('tsc',['--target','ES2022','--module','ES2022','--lib','ES2022,DOM','--skipLibCheck','--outDir',dir,new URL('./synopModelPlot.ts',import.meta.url).pathname]);
const {verifiedModelPrecipGlyph,modelPrecipGlyphSvg,sparseModelWeatherGlyphs}=await import(pathToFileURL(join(dir,'synopModelPlot.js')).href);
test('codes remain explicit, no fake ww or SYNOP observation',()=>{
 for(const v of [null,undefined,NaN,Infinity,-2,100,0,3,45,60,71.5,'71',false,{},[]])assert.equal(verifiedModelPrecipGlyph(v),null);
 for(const w of [51,53,55,56,57,61,63,65,66,67,68,69,71,73,75,77,78,79,80,81,82,83,84,85,86,87,88,89,90,95,96,97,99]){
 const g=verifiedModelPrecipGlyph(w);assert.equal(g.ww,w);assert.equal(g.sourceClass,'model-weather-code');assert.match(modelPrecipGlyphSvg(g),new RegExp(`ww ${w}:`));
 }
 assert.equal(verifiedModelPrecipGlyph(96).group,'thunder-hail');assert.equal(verifiedModelPrecipGlyph(99).group,'thunder-hail');
 assert.ok(!verifiedModelPrecipGlyph(96).label.toLowerCase().includes('graupel'));
 assert.equal(verifiedModelPrecipGlyph(95).group,'thunder');
 assert.equal(verifiedModelPrecipGlyph(87).group,'pellets-hail');
});
test('size and mobile support',()=>{
 for(const size of [24,28,30,36,44])assert.match(modelPrecipGlyphSvg(verifiedModelPrecipGlyph(85),size),new RegExp(`width="${size}"`));
 assert.throws(()=>modelPrecipGlyphSvg(verifiedModelPrecipGlyph(85),99));
});
test('sparse same-grid symbols, cap, separation, no missing=>zero',()=>{
 const n=80,grid={lats:Array.from({length:n},(_,i)=>i),lons:Array.from({length:n},(_,i)=>i),weather:Array(n*n).fill(null)};
 grid.weather[10*n+10]=99;grid.weather[40*n+40]=71;grid.weather[60*n+60]=61;
 const points=sparseModelWeatherGlyphs(grid,(lat,lon)=>({x:lon*4,y:lat*4}),{width:320,height:320},{max:10,minDistancePx:48,hideRainIfRadar:true});
 assert.deepEqual(points.map(p=>p.glyph.ww).sort(),[71,99]);
 assert.ok(points.every(p=>p.pixel.x<=320&&p.pixel.y<=320));
 assert.deepEqual(sparseModelWeatherGlyphs({...grid,weather:[]},()=>({x:1,y:1}),{width:320,height:320}),[]);
});

test('isolated high-risk model cell survives adaptive block sampling (no smoothing)',()=>{
 const n=160,grid={lats:Array.from({length:n},(_,i)=>i),lons:Array.from({length:n},(_,i)=>i),weather:Array(n*n).fill(0)};
 // Original historical stride sampling would skip (73,75); a sparse hail
 // signal must remain visible without manufacturing nearby observations.
 grid.weather[73*n+75]=99;grid.weather[73*n+76]=71;
 const shown=sparseModelWeatherGlyphs(grid,(lat,lon)=>({x:lon*3,y:lat*3}),{width:500,height:500},{max:64,minDistancePx:44});
 assert.ok(shown.some(x=>x.glyph.ww===99&&x.lat===73&&x.lon===75),'Extreme signal must survive');
 assert.equal(shown[0].glyph.ww,99);
});
