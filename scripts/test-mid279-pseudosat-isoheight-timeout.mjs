import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const tmp=mkdtempSync(join(tmpdir(),'mid279-'));
const storage=new Map();
globalThis.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
try{
 for(const [file,out] of [['src/cloudWeatherData.ts','cloud.mjs'],['src/cloudWeatherIsobars.ts','contours.mjs'],['src/cloudWeatherExport.ts','export.mjs']]){
  await build({entryPoints:[file],outfile:join(tmp,out),bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 }
 const cloud=await import(pathToFileURL(join(tmp,'cloud.mjs'))),contour=await import(pathToFileURL(join(tmp,'contours.mjs'))),exporter=await import(pathToFileURL(join(tmp,'export.mjs')));
 assert.equal(cloud.readCloudWeatherRenderMode(),'standard');
 cloud.writeCloudWeatherRenderMode('pseudo');assert.equal(cloud.readCloudWeatherRenderMode(),'pseudo','Pseudo-sat selection persists across remounts');
 cloud.writeCloudWeatherIsobars(true);cloud.writeCloudWeatherIsoheights(true);
 assert.equal(cloud.readCloudWeatherIsobars(),true);assert.equal(cloud.readCloudWeatherIsoheights(),true,'Both line selections persist');
 const data={model:'icon-d2',run:'2026-10-17T00:00:00Z',time:'2026-10-17T06:00:00Z',lats:[48,49],lons:[7,8],cloud:[0,50,98,null],weather:[0,61,71,null]};
 const coords=[[7.1,48.1],[7.5,48.5],[7.9,48.9]];
 const syn={model:data.model,run:data.run,time:data.time,height:{type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{level:552,label:'552'}}]}};
 const height=contour.synopticCloudIsoheights(data,syn);
 assert.ok(height);assert.equal(height.contours.features[0].properties.label,'552 gpdm');
 assert.equal(contour.matchingCloudIsoheights(data,height).features.length,1);
 for(const key of ['model','run','time']){
  assert.equal(contour.synopticCloudIsoheights(data,{...syn,[key]:'wrong'}),null,'No foreign '+key);
  assert.equal(contour.matchingCloudIsoheights(data,{...height,[key]:'wrong'}).features.length,0);
 }
 assert.equal(contour.synopticCloudIsoheights({...data,model:'gdps'},{...syn,model:'gdps'}),null,'GDPS lacks checked height source');
 const isobar={model:data.model,run:data.run,time:data.time,contours:[{level:1016,paths:[[[48.1,7.1],[48.5,7.5],[48.9,7.9]]]}]};
 const raster='data:image/png;base64,AA==';
 const plain=exporter.cloudWeatherSvg(data,raster,[],[],'pseudo');
 const both=exporter.cloudWeatherSvg(data,raster,[],[],'pseudo',isobar,height);
 assert.doesNotMatch(plain,/Isohypsen gpdm|MSLP-Isobaren \(hPa\)/);
 assert.match(both,/500-hPa-Isohypsen gpdm/);assert.match(both,/MSLP-Isobaren \(hPa\)/);
 assert.match(both,/fill="#8595a1"/,'Pseudo export has same muted light background');
 assert.doesNotMatch(exporter.cloudWeatherSvg(data,raster,[],[],'pseudo',null,{...height,run:'bad'}),/Isohypsen gpdm/);
 assert.deepEqual(cloud.cloudWeatherPixel(null,null,'pseudo'),[0,0,0,0],'Missing cloud/weather stays transparent');
 const map=readFileSync('src/UnifiedWeatherMap.tsx','utf8'),panel=readFileSync('src/RadarPanel.tsx','utf8'),base=readFileSync('src/UnifiedVectorBasemap.tsx','utf8'),app=readFileSync('src/App.tsx','utf8');
 for(const token of ['readCloudWeatherRenderMode','readUnifiedMapSettings','readCloudWeatherIsoheights','writeCloudWeatherIsoheights','matchingCloudIsoheights(cloudData,selectedCloudIsoheights)','cloudContrast:settings.enabled&&isCloudWeather','heightsActive?<GeoJsonLayers'])assert.ok(map.includes(token),token);
 assert.match(panel,/cloudContrast=\{Boolean\(unified\.cloudContrast&&modelAtSelectedTime\)\}/);
 assert.match(base,/#8595a1/);assert.match(base,/cloudContrast&&!dark/);
 assert.match(app,/forecastTimeoutRetryState\.current\.attempts<1/,'Only one automatic timeout retry');
 assert.match(app,/id===seq\.current&&document\.visibilityState/,'Retries bound to active location generation');
 assert.match(app,/Wetter erneut laden/,'Manual recovery control');
 console.log('MID .279: Pseudo mode persistence, identical run/time isoheights, exported contours, missing data and bounded location retry.');
}finally{rmSync(tmp,{recursive:true,force:true})}
