import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=mkdtempSync(path.resolve('.mid-pseudosat-'));
try{
 await build({entryPoints:['src/cloudWeatherData.ts'],outfile:path.join(dir,'cloud.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const m=await import(pathToFileURL(path.join(dir,'cloud.mjs')));
 const rgba=(cover,ww,mode='pseudo')=>m.cloudWeatherPixel(cover,ww,mode);
 assert.deepEqual(rgba(null,null),[0,0,0,0]);
 assert.equal(rgba(0,0)[3],0);
 assert.ok(rgba(100,0)[3]>rgba(25,0)[3]&&rgba(25,0)[3]>0);
 assert.deepEqual(rgba(null,61,'standard'),[57,237,36,240]);
 assert.equal(rgba(null,61)[3],231);
 assert.ok(rgba(95,null)[3]>0);
 for(const code of [41,48,57,61,67,69,71,75,84,86,91,95,96,99]){
  const pixel=rgba(100,code);assert.ok(pixel[3]>=200,'WMO category not shown: '+code);
  assert.ok(m.significantWeatherStyle(code),'Unknown category '+code);
 }
 assert.match(m.cloudWeatherDescription(91),/Gewitter zuvor/);
 assert.equal(rgba(null,255)[3],0);
 assert.deepEqual(rgba(0,0,'standard'),[255,255,255,215]);
 const unified=readFileSync('src/UnifiedWeatherMap.tsx','utf8'),native=readFileSync('src/NativeModelMap.tsx','utf8'),layer=readFileSync('src/CloudSignificantWeather.tsx','utf8');
 for(const source of [unified,native]){assert.match(source,/CloudWeatherModeControl/);assert.match(source,/writeCloudWeatherRenderMode/);assert.match(source,/cloudRenderMode/);}
 assert.match(layer,/cloudWeatherRaster\(data,mode\)/);
 assert.match(layer,/kein gemessenes oder physikalisch simuliertes Satellitenbild/);
 assert.match(native,/cloudWeatherRaster\(combined,cloudRenderMode\)/);
 const doc=readFileSync('docs/c14/MID_C14_PSEUDOSAT_CONTRACT.md','utf8');assert.match(doc,/keine künstliche Satellitenbeobachtung/);
 console.log('Pseudo-satellite cloud/WMO/render/zero/null/source contract passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
