import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-contours-'));
try{
 await build({entryPoints:['src/adaptiveModelContours.ts'],outfile:join(dir,'contours.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {contourInterval,contourVisible,adaptiveContourLayers}=await import(pathToFileURL(join(dir,'contours.mjs')));
 assert.deepEqual([4.99,5,6.99,7].map(z=>contourInterval(z,'height')),[8,8,8,4]);
 assert.equal(contourVisible(1012,4,'pressure'),false);assert.equal(contourVisible(1012,7,'pressure'),true);
 assert.equal(contourVisible(560,4),true);assert.equal(contourVisible(564,6),false);
 assert.deepEqual([4,6,8].map(z=>contourInterval(z,'pressure')),[5,2,1]);assert.equal(contourInterval(7,'pressure',2),1);assert.equal(contourInterval(7,'pressure',10),1);assert.equal(contourInterval(11,'pressure',2),1);
 for(const zoom of [4,6,8]){const levels=Array.from({length:41},(_,i)=>990+i).filter(v=>contourVisible(v,zoom,'pressure',iSpacing(v)));function iSpacing(v){return v%2?2:100}for(let i=1;i<levels.length;i++)assert.equal(levels[i]-levels[i-1],contourInterval(zoom,'pressure'));}
 const pressure=adaptiveContourLayers('pressure','#fff',.6,{halo:'#222'});
 for(const layer of pressure.filter(l=>l.type==='line')){
  const dashed=layer.id.includes('dashed');assert.deepEqual(layer.filter[2],[dashed?'<':'>=',['get','level'],1013]);
  assert.equal(layer.filter[1][0],'==');assert.ok(!JSON.stringify(layer.filter).includes('spacingKm'),'No feature-local thinning may remove individual levels');
  assert.equal(Boolean(layer.paint['line-dasharray']),dashed);
 }
 assert.ok(!adaptiveContourLayers('height','#222',1).some(l=>l.paint['line-dasharray']));
 assert.ok(!readFileSync('src/SynopticComposite.tsx','utf8').includes('ModelPressureCenters'),'Composite never shows T/H');
 const {build:bundle}=await import('esbuild');await bundle({entryPoints:['src/nativeModelMapExport.ts'],outfile:join(dir,'export.mjs'),bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {nativeFieldSvg}=await import(pathToFileURL(join(dir,'export.mjs')));
 const field={kind:'pressure',unit:'hPa',run:'2026-10-11T00:00Z',time:'2026-10-11T01:00Z',scale:.1,lats:[47,55],lons:[5,16],values:[10000,10000,10000,10000],isobars:[{level:1012,paths:[[[48,6],[52,12]]]},{level:1016,paths:[[[49,6],[53,12]]]}]};
 const svg=nativeFieldSvg(field,'Bodendruck','',[],0);assert.equal((svg.match(/stroke-dasharray="3 2"/g)||[]).length,1,'Only sub-1013 pressure is dashed in export');
 const segmented={...field,isobars:[{level:1012,paths:[[[48,6],[49,7]],[[49,7],[52,12]]]},{level:1016,paths:[[[49,6],[50,8]],[[50,8],[53,12]]]}]};
 const before=JSON.stringify(segmented);
 const joinedSvg=nativeFieldSvg(segmented,'Bodendruck','',[],0);
 const svgContours=joinedSvg.match(/<g fill="none" stroke="#192c3f" stroke-width="1">([\s\S]*?)<\/g>/)?.[1]??'';
 assert.equal((svgContours.match(/<path/g)||[]).length,2,'SVG export preserves exactly two connected original isolines, not four fragments');
 assert.equal((svgContours.match(/ L/g)||[]).length,4,'SVG export retains each contour vertex and 2 joining points');
 assert.equal((svgContours.match(/stroke-dasharray="3 2"/g)||[]).length,1,'Only the 1012 hPa SVG line remains dashed');
 assert.equal(JSON.stringify(segmented),before,'SVG exporting cannot mutate verified contour geometry');
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('Adaptive contour zoom boundaries, pressure threshold, composite exclusion and export passed.');
