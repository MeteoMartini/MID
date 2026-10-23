import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-scalar-'));
try{
 for(const [name,entry] of [['scalar','nativeScalarAnnotations'],['math','chartMath'],['export','nativeModelMapExport']])await build({entryPoints:[`src/${entry}.ts`],outfile:join(dir,name+'.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {nativeScalarLines,nativeRasterExtremes}=await import(pathToFileURL(join(dir,'scalar.mjs')));
 const {niceWindRange,spacedGuideLabels}=await import(pathToFileURL(join(dir,'math.mjs')));
 const guides=[{threshold:50,y:34},{threshold:65,y:31},{threshold:85,y:27},{threshold:100,y:23},{threshold:115,y:20},{threshold:140,y:14}];
 assert.deepEqual([...spacedGuideLabels(guides)],[140,65],'Strongest guide remains labeled; nearby warning text cannot overlap');
 assert.equal(guides.length,6,'Warning geometry remains intact');
 const {nativeFieldSvg}=await import(pathToFileURL(join(dir,'export.mjs')));
 const field={schema:'mid.icon-d2.field.v1',run:'2026-10-23T00:00Z',time:'2026-10-23T01:00Z',kind:'temperature',unit:'°C',scale:1,lats:[48,49,50],lons:[7,8,9],values:[0,0,0,0,20,0,0,0,0],isobars:[]};
 const before=JSON.stringify(field),lines=nativeScalarLines(field);
 assert.ok(lines.length>=5,'Single-cell extreme remains represented without spatial thinning');
 for(const l of lines){assert.deepEqual(l.path[0],l.path.at(-1),'Isolated hill has a closed contour');assert.ok(l.path.length>=5);assert.match(l.label,/°C/)}
 assert.deepEqual(nativeRasterExtremes(field),[{type:'Min',lat:48,lon:7,value:0},{type:'Max',lat:49,lon:8,value:20}]);
 assert.equal(JSON.stringify(field),before,'No data values or axes are modified');
 const missing={...field,values:[0,0,0,0,NaN,0,0,0,0]};
 assert.equal(nativeScalarLines(missing).length,0,'Contours cannot bridge missing quad corners');
 assert.deepEqual(nativeRasterExtremes({...field,values:field.values.map(()=>NaN)}),[]);
 assert.deepEqual(nativeScalarLines({...field,values:field.values.map(()=>5)}),[],'Uniform fields have no invented isolines');
 assert.deepEqual(nativeRasterExtremes({...field,kind:'sigwx'}),[],'Weather codes have no scalar extrema');
 const boundary={...field,values:[-40,0,0,0,20,0,0,0,65]};assert.equal(nativeRasterExtremes(boundary)[1].value,65,'Boundary maximum is retained');
 const wind={...field,kind:'gust',unit:'km/h',values:[0,30,60,10,90,120,20,100,150]};
 for(const [unit,factor,suffix] of [['kn',1,'kt'],['kmh',1.852,'km/h'],['ms',.514444,'m/s'],['mph',1.15078,'mph']]){
  for(const peak of [0,7.1,32,86.7,245]){const s=niceWindRange(peak,unit);assert.ok(s.max>=peak);assert.equal(s.ticks[0],0);assert.equal(s.ticks.at(-1),s.max);for(const tick of s.ticks)assert.ok(Math.abs(tick*factor-Math.round(tick*factor))<1e-7,'Round visible wind ticks');}
  assert.ok(nativeScalarLines(wind,unit).every(l=>l.label.endsWith(suffix)),'Scalar contour labels use the selected wind unit');
 }
 const svg=nativeFieldSvg(field,'Temperatur','data:image/png;base64,AA',[],0,'kn',undefined,[],{lines:true,extremes:true,fill:false});
 assert.ok(svg.includes('Max 20 °C'));assert.ok(svg.includes('native-scalar-annotations'));assert.ok(!svg.includes('data:image/png'),'Line-only export omits the color raster');
 const noExtremes=nativeFieldSvg(field,'Temperatur','',[],0,'kn',undefined,[],{extremes:false});assert.ok(!noExtremes.includes('Max 20 °C'));
 console.log('PASS native scalar isolines, missing masks, boundary extremes, export settings and unit-aware wind ticks');
}finally{rmSync(dir,{recursive:true,force:true})}
if(process.env.CI==='true'||process.env.MID_BROWSER_QA==='1')await import('./verify-round-wind-browser-0985316.mjs');
