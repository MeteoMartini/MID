import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
const directory=mkdtempSync(join(tmpdir(),'mid-sky-levels-303-'));
try{
 await build({stdin:{contents:"export{detailSkyBarSegments,detailSkyBarSolarSegments,detailSkyBarTimedSegments}from'./src/detailSkyBar';export{SkyBarSegmentsSvg}from'./src/SkyBarSegments';export{renderToStaticMarkup}from'react-dom/server';export{createElement}from'react';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'cjs',outfile:join(directory,'test.cjs'),jsx:'automatic',logLevel:'silent'});
 const {detailSkyBarSegments:plain,detailSkyBarSolarSegments:solar,detailSkyBarTimedSegments:timed,SkyBarSegmentsSvg,renderToStaticMarkup,createElement}=await import(pathToFileURL(join(directory,'test.cjs')));
 const start=Date.UTC(2026,9,20,5),hour=3600000,widths=[2.4,3.6,4.8,6],shares=[.55,.68,.80,.95];
 const sample=(cloud,seconds,epoch=start,duration=hour)=>({epoch,cloud,isDay:true,sunshineDuration:seconds,precipitation:0,rain:0,showers:0,snowfall:0,code:0,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+duration});
 const base=segments=>segments.filter(s=>s.layer==='base');
 for(let i=0;i<4;i++){
  const cloud=51+12.5*i;
  const gray=base(plain([sample(cloud,0)],0,0,100,8))[0];
  assert.equal(gray.thicknessLevel,i+1);assert.equal(gray.strokeWidth,widths[i]);assert.equal(gray.color,'#aeb3b9');
  const yellow=base(plain([sample(20,shares[i]*3600)],0,0,100,8))[0];
  assert.equal(yellow.thicknessLevel,i+1);assert.equal(yellow.strokeWidth,widths[i]);assert.equal(yellow.color,'#ffc229');
  for(const duration of [900000,3600000])for(const edge of ['dawn','dusk']){
   const daylight=duration/4,raw=sample(49,shares[i]*daylight/1000,start,duration),nights=edge==='dawn'?[{startEpoch:start,endEpoch:start+duration-daylight}]:[{startEpoch:start+daylight,endEpoch:start+duration}];
   raw.isDay=edge==='dusk';
   const original=JSON.stringify(raw),segments=base(timed([raw],start,start+duration,0,0,100,8,nights));
   assert.equal(segments.length,1);assert.equal(segments[0].thicknessLevel,i+1,`${edge}, ${duration/60000}min, sunshine ${(shares[i]*100)}% of actual daylight must retain level ${i+1}`);
   assert.equal(segments[0].strokeWidth,widths[i]);
   assert.equal(segments[0].x1,edge==='dawn'?75:0);assert.equal(segments[0].x2,edge==='dawn'?100:25);
   assert.match(segments[0].title,/möglichen Tageslichtzeit/);assert.equal(JSON.stringify(raw),original,'Renderer cannot mutate physical input');
   const rainy={...raw,precipitation:3,rain:3,code:61};
   assert.deepEqual(timed([rainy],start,start+duration,0,0,100,8,nights).filter(s=>s.layer==='precip'),timed([rainy],start,start+duration,0,0,100,8).filter(s=>s.layer==='precip'),'Solar reference cannot change precipitation');
  }
 }
 const dawnSample=sample(49,540),overlap=[{startEpoch:start,endEpoch:start+hour*.5},{startEpoch:start+hour*.25,endEpoch:start+hour*.75}];
 const merged=[{startEpoch:start,endEpoch:start+hour*.75}];
 assert.deepEqual(base(timed([dawnSample],start,start+hour,0,0,100,8,overlap)).map(s=>[s.x1,s.x2,s.strokeWidth]),base(timed([dawnSample],start,start+hour,0,0,100,8,merged)).map(s=>[s.x1,s.x2,s.strokeWidth]),'Overlapping night intervals count only once');
 assert.equal(base(timed([sample(20,3600)],start,start+hour,0,0,100,8,[{startEpoch:start,endEpoch:start+hour}])).length,0,'Never paint yellow in a confirmed full night');
 for(const cloud of [null,undefined,NaN])assert.equal(base(solar([sample(cloud,null)],0,0,100,8,[0],[{startEpoch:start,endEpoch:start+hour*.75}],[100])).length,0,'Unknown sky is not clear sky');
 const all=shares.map((share,i)=>sample(20,share*3600,start+i*hour)).concat(shares.map((_,i)=>sample(51+i*12.5,0,start+(i+4)*hour)));
 const segments=timed(all,start,start+8*hour,0,0,800,8),markup=renderToStaticMarkup(createElement('svg',{viewBox:'0 0 800 16'},createElement(SkyBarSegmentsSvg,{segments})));
 for(let i=1;i<=4;i++)assert.equal((markup.match(new RegExp(`data-skybar-level="${i}"`,'g'))||[]).length,2,'Real shared SVG renderer must retain every yellow and gray level');
 for(const width of widths)assert.ok(markup.includes(`height="${width}"`),'No fixed-height override in the shared renderer');
 console.log('MID .303: all four yellow/gray classes in real SVG; 15/60min dawn/dusk daylight reference, overlap, Missing, polar night and unchanged precipitation passed.');
}finally{rmSync(directory,{recursive:true,force:true})}
