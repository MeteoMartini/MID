import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';

const out=mkdtempSync(join(tmpdir(),'mid-skybar-color-'));
try{
 await build({stdin:{contents:"export * from './src/detailSkyBar';export{skyBarVisualRuns}from'./src/skyBarVisualRuns';export{SkyBarSegmentsSvg,SkyBarHourCellsSvg}from'./src/SkyBarSegments';export{createElement}from'react';export{renderToStaticMarkup}from'react-dom/server';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:join(out,'qa.cjs'),logLevel:'silent'});
 const {detailSkyBarSegments:plain,detailSkyBarTimedSegments:timed,detailSkyBarHourCells:cells,skyBarVisualRuns:runs,SkyBarSegmentsSvg,SkyBarHourCellsSvg,createElement:h,renderToStaticMarkup:render}=createRequire(import.meta.url)(join(out,'qa.cjs'));
 const start=Date.UTC(2026,9,29,10),steps=[2.4,3.6,4.8,6],shares=[.55,.68,.80,.95];
 const sample=(fields={},epoch=start,seconds=3600)=>({epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+seconds*1000,cloud:0,sunshineDuration:null,isDay:true,precipitation:0,rain:0,showers:0,snowfall:0,code:0,...fields});
 const base=list=>list.filter(s=>s.layer==='base');
 const colorChecks=[];
 for(const seconds of [900,3600])for(const [i,share] of shares.entries()){
  const variants=[
   sample({sunshineDuration:seconds*share},start,seconds),
   sample({cloud:null,sunshineDuration:seconds*share},start,seconds),
   sample({cloud:100*(1-share)},start,seconds),
   sample({cloud:100*(1-share),sunshineDuration:0},start,seconds),
   sample({cloud:100*(1-share),sunshineDuration:seconds*.3},start,seconds),
  ];
  for(const row of variants){
   const before=structuredClone(row),segment=base(plain([row],0,0,100,12))[0];
   assert.equal(segment.color,'#ffc229');assert.equal(segment.opacity,1);
   assert.equal(segment.strokeWidth,steps[i]);assert.equal(segment.thicknessLevel,i+1);
   assert.deepEqual(row,before,'No meteorological mutation');
   const cell=cells([row])[0];assert.equal(cell.base.opacity,1);assert.equal(cell.base.thicknessLevel,i+1);
   const markup=render(h('svg',null,h(SkyBarSegmentsSvg,{segments:[segment]})));
   assert.match(markup,/fill="#ffc229" opacity="1"/);
   assert.ok(markup.includes(`height="${steps[i]}"`));
   assert.match(cell.title,row.cloud===null||row.sunshineDuration>seconds*.5?/Sonnenscheindauer/:/Wolkenlücken/);
   if(row.sunshineDuration===null)assert.match(cell.title,/Sonnenscheindauer nicht verfügbar/);
   colorChecks.push(segment);
  }
  for(const isDay of [true,false]){
   const row=sample({cloud:share*100,isDay},start,seconds),segment=base(plain([row],0,0,100,12))[0];
   assert.equal(segment.color,'#aeb3b9');assert.equal(segment.opacity,1);
   assert.equal(segment.strokeWidth,steps[i]);assert.equal(segment.thicknessLevel,i+1);
  }
 }
 // Source changes are tooltip boundaries, never painted color boundaries.
 const pair=[sample({sunshineDuration:3600}),sample({},start+3600000)];
 const segments=plain(pair,0,0,200,12),visualRuns=runs(segments);
 assert.equal(segments.length,2);assert.equal(visualRuns.length,1);
 assert.equal(visualRuns[0].samples.length,2);
 const markup=render(h('svg',null,h(SkyBarSegmentsSvg,{segments})));
 assert.equal((markup.match(/data-skybar-level=/g)||[]).length,1);
 assert.equal((markup.match(/<title>/g)||[]).length,2,'Both source descriptions retained');
 assert.match(markup,/Sonnenscheindauer/);assert.match(markup,/Wolkenlücken/);
 // Dawn/dusk geometry and all precipitation phases retain their full interval.
 for(const seconds of [900,3600])for(const edge of ['dawn','dusk'])for(const [code,amount,snow] of [[0,0,0],[61,1,0],[71,1,1],[67,1,0],[95,1,0]]){
  const end=start+seconds*1000,cut=start+seconds*500;
  const night=edge==='dawn'?{startEpoch:start,endEpoch:cut}:{startEpoch:cut,endEpoch:end};
  const row=sample({sunshineDuration:seconds*.45,code,precipitation:amount,rain:amount,snowfall:snow},start,seconds);
  const before=structuredClone(row),full=timed([row],start,end,0,0,100,12),split=timed([row],start,end,0,0,100,12,[night]);
  assert.deepEqual(split.filter(s=>s.layer==='precip'),full.filter(s=>s.layer==='precip'));
  assert.equal(base(split).length,1);assert.equal(base(split)[0].opacity,1);
  assert.equal(base(split)[0].x1,edge==='dawn'?50:0);assert.equal(base(split)[0].x2,edge==='dawn'?100:50);
  assert.deepEqual(row,before);
 }
 for(const row of [sample({cloud:null}),sample({isDay:false}),sample({cloud:false,sunshineDuration:false})])assert.equal(base(plain([row],0,0,100,12)).length,0,'Missing/clear night is not yellow');
 const cloudy=sample({cloud:50});assert.equal(base(plain([cloudy],0,0,100,12))[0].color,'#aeb3b9','50% threshold unchanged');
 assert.equal(base(plain([sample({cloud:null,sunshineDuration:1800})],0,0,100,12)).length,0,'Sun needs >50%');
 // All shared horizons, clipped intervals and DST retain the same opaque base.
 for(const count of [6,12,23,24,25,168,336]){
  const rows=Array.from({length:count},(_,i)=>sample(i%2?{}:{sunshineDuration:3600},start+i*3600000));
  const result=timed(rows,start+300000,start+count*3600000-300000,0,0,1000,12);
  assert.ok(result.length);assert.ok(result.every(s=>s.opacity===1&&s.color==='#ffc229'));
  assert.equal(runs(result).length,1);
 }
 // Squares intentionally keep four class colors, but provenance cannot tint a class.
 const squareRows=shares.flatMap(share=>[sample({sunshineDuration:share*3600}),sample({cloud:(1-share)*100})]);
 const squareMarkup=render(h('svg',null,h(SkyBarHourCellsSvg,{cells:cells(squareRows),left:0,right:0,chartW:800,centerY:12})));
 for(const shade of ['#fff0a6','#ffe169','#ffd13b','#ffc229'])assert.equal((squareMarkup.match(new RegExp(`fill="${shade}" opacity="1"`,'g'))||[]).length,2);
 console.log(`MID .358: ${colorChecks.length} direct/fallback colors; all levels, 15/60min, cloud day/night, provenance continuity, solar boundaries, phases, NoData, 23/25h and square-class parity passed.`);
}finally{rmSync(out,{recursive:true,force:true})}
