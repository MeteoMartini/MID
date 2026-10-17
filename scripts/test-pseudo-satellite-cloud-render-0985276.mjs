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
 const exportSource=readFileSync('src/cloudWeatherExport.ts','utf8');
 assert.ok(unified.includes('exportCloudWeather(cloudWeather.data,cloudWeather.raster,places,type,cloudRenderMode,linesActive?selectedCloudIsobars:null,heightsActive?selectedCloudIsoheights:null)'));
 assert.ok(native.includes('exportCloudWeather(combined,raster,places,format,cloudRenderMode,cloudContourSelection)'));
 assert.ok(exportSource.includes('cloudWeatherSvg(data,raster,places,geography.states,mode,selectedIsobars,selectedIsoheights)'));
 assert.match(exportSource,/matchingCloudIsobars\(data,selectedIsobars\)/);
 await build({entryPoints:['src/cloudWeatherExport.ts'],outfile:path.join(dir,'export.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const exporter=await import(pathToFileURL(path.join(dir,'export.mjs')));
 const frame={model:'icon-d2',run:'2026-10-16T00:00:00Z',time:'2026-10-16T03:00:00Z',lats:[48,49],lons:[7,8],cloud:[0,100,50,null],weather:[0,61,71,null]};
 const standardSvg=exporter.cloudWeatherSvg(frame,'data:image/png;base64,AA==',[]);
 const pseudoSvg=exporter.cloudWeatherSvg(frame,'data:image/png;base64,AA==',[],[],'pseudo');
 assert.ok(pseudoSvg.includes('Modell-Wolkenbild (schematisch)'));
 assert.match(pseudoSvg,/kein Satellitenbild/);
 assert.match(pseudoSvg,/stop-opacity="0"/);
 assert.doesNotMatch(standardSvg,/Modell-Wolkenbild/);
 assert.match(standardSvg,/stop-color="#696969"/);
 const doc=readFileSync('docs/c14/MID_C14_PSEUDOSAT_CONTRACT.md','utf8');assert.match(doc,/keine künstliche Satellitenbeobachtung/);
 console.log('Pseudo-satellite cloud/WMO/render/zero/null/source contract passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
