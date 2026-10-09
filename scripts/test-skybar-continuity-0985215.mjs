import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';
const out=mkdtempSync(join(tmpdir(),'mid-sky215-'));
try{
 await build({stdin:{contents:"export{skyBarVisualRuns}from'./src/skyBarVisualRuns';export{detailSkyBarSegments}from'./src/detailSkyBar';import{SkyBarSegmentsSvg}from'./src/SkyBarSegments';import{createElement}from'react';import{renderToStaticMarkup}from'react-dom/server';export const render=segments=>renderToStaticMarkup(createElement('svg',null,createElement(SkyBarSegmentsSvg,{segments})));",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:join(out,'qa.cjs'),logLevel:'silent'});
 const {skyBarVisualRuns,detailSkyBarSegments,render}=createRequire(import.meta.url)(join(out,'qa.cjs'));
 const start=Date.UTC(2026,9,9),hours=Array.from({length:168},(_,i)=>({epoch:start+i*3600000,cloud:88+i%12,isDay:i%24>=7&&i%24<19,sunshineDuration:0,precipitation:0}));
 const segments=detailSkyBarSegments(hours,42,10,700,18),original=structuredClone(segments),runs=skyBarVisualRuns(segments);
 assert.equal(runs.length,1,'Visually identical week joins despite varying percent/day-night titles');
 assert.equal(runs[0].segment.x1,42);assert.equal(runs[0].segment.x2,690);assert.equal(runs[0].segment.thicknessLevel,4);
 assert.deepEqual(segments,original,'Input remains unchanged');assert.deepEqual(runs[0].samples,segments,'All original interval descriptions preserved');
 const html=render(segments);assert.equal((html.match(/data-skybar-level=/g)||[]).length,1);assert.equal((html.match(/<title>/g)||[]).length,segments.length);assert.match(html,/width="648" height="6"/,'One continuous painted geometry, no narrow hourly rounded caps');
 const sample=segments[0],pair=change=>[{...sample,x1:0,x2:1,key:'a'},{...sample,x1:1,x2:2,key:'b',title:'different tooltip',...change}];
 assert.equal(skyBarVisualRuns(pair({})).length,1);
 for(const change of [{color:'#ffc229'},{opacity:.78},{strokeWidth:4.8},{thicknessLevel:3},{layer:'precip'},{y:20},{x1:1.01}])assert.equal(skyBarVisualRuns(pair(change)).length,2,JSON.stringify(change));
 const gapHours=[...hours.slice(0,3)];gapHours[1]={...gapHours[1],cloud:null};assert.equal(skyBarVisualRuns(detailSkyBarSegments(gapHours,0,0,90,8)).length,2,'Missing weather stays a gap');
 const overlay=[...pair({}),...pair({}).map(s=>({...s,key:s.key+'rain',layer:'precip',color:'#2999d1',opacity:1}))];assert.equal(skyBarVisualRuns(overlay).length,2,'Precipitation remains independent');assert.deepEqual(skyBarVisualRuns(overlay).map(r=>r.segment.layer),['base','precip'],'Paint order preserved');assert.ok(render(overlay).indexOf('fill=\"#aeb3b9\"')<render(overlay).indexOf('fill=\"#2999d1\"'),'Precipitation paints after the base');
 for(const count of [6,12,24,168])assert.equal(skyBarVisualRuns(detailSkyBarSegments(hours.slice(0,count),0,0,120,8)).length,1,'Quarter/day/week consumers share continuity');
 const baseline=JSON.parse(readFileSync('MID_BASELINE.json'));for(const k of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[k].includes('scripts/test-skybar-continuity-0985215.mjs'));
 console.log('MID215: continuous identical sky states, all original titles, true gaps/transitions/overlays preserved; shared renderer.');
}finally{rmSync(out,{recursive:true,force:true})}
