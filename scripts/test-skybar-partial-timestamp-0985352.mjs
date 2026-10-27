import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

// Execute the actual production Skybar renderer, not a duplicated helper.
const dir=mkdtempSync(join(tmpdir(),'mid-skybar-partial-time-'));
try{
 await build({stdin:{contents:"export{detailSkyBarHourCells,detailSkyBarTimedSegments,detailSkyBarSolarSegments}from'./src/detailSkyBar';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:join(dir,'render.mjs'),logLevel:'silent'});
 const {detailSkyBarHourCells:cells,detailSkyBarTimedSegments:timed,detailSkyBarSolarSegments:solar}=await import(pathToFileURL(join(dir,'render.mjs')));
 const hour=3600000,base=Date.parse('2026-10-25T00:00:00Z');
 const sample=(epoch,duration,fields={})=>({
  epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+duration,
  isDay:true,cloud:null,sunshineDuration:duration*.75/1000,
  precipitation:1.25,rain:1.25,showers:0,snowfall:0,code:61,probability:100,...fields
 });
 const weather=segments=>segments.filter(s=>s.layer==='base');
 const precip=segments=>segments.filter(s=>s.layer==='precip');
 for(const duration of [15*60000,hour]){
  const good=sample(base,duration),neighbor=sample(base+duration,duration),reference=cells([good,neighbor])[0];
  assert.equal(reference.base?.color,'#ffc229','75% directly known sunshine retains yellow');
  assert.match(reference.precip?.title??'',duration===15*60000?/starker Regen/:/mäßiger Regen/,'Source-consistent DWD rain intensity and wording');
  assert.match(reference.base?.title??'',/Sonnenscheindauer/);
  for(const invalid of [null,undefined,'',' ',false]){
   const missing={...good,precipitationIntervalStartEpoch:invalid};
   const checked=cells([missing,neighbor])[0];
   assert.deepEqual(checked.base,reference.base,'Missing start falls back to true '+(duration/60000)+'-minute neighbor timestamps');
   assert.deepEqual(cells([missing])[0].base,cells([good])[0].base,'Standalone sunshine uses genuine end minus source epoch for '+(duration/60000)+' minutes');
   assert.deepEqual(cells([missing])[0].precip,cells([good])[0].precip,'Standalone precipitation intensity keeps true '+(duration/60000)+' minute accumulation');
   assert.deepEqual(checked.precip,reference.precip,'Precipitation intensity remains interval-correct despite missing start');
   assert.deepEqual(weather(timed([missing],base,base+duration,0,0,100,8)),weather(timed([good],base,base+duration,0,0,100,8)),'Timed sky uses observed epoch when explicit start missing');
   assert.deepEqual(precip(timed([missing],base,base+duration,0,0,100,8)),precip(timed([good],base,base+duration,0,0,100,8)),'No change to accumulated precipitation geometry');
  }
  const noEnd={...good,precipitationIntervalEndEpoch:null};
  assert.deepEqual(cells([noEnd,neighbor])[0].base,reference.base,'Missing end falls back to observed source timestamps');
  assert.equal(timed([noEnd],base,base+duration,0,0,100,8).length,0,'No fake forward geometry without an end timestamp');
  const explicit={...good,precipitationIntervalStartEpoch:base+120000,precipitationIntervalEndEpoch:base+120000+duration};
  assert.deepEqual(cells([explicit,neighbor])[0].base,reference.base,'Complete authoritative interval retains priority');
  assert.deepEqual(cells([explicit,neighbor])[0].precip,reference.precip,'Intensity of valid original interval remains unchanged');
 }
 for(const [stamp,next] of [
  [Date.parse('2026-03-29T01:30:00+01:00'),Date.parse('2026-03-29T03:30:00+02:00')],
  [Date.parse('2026-10-25T02:30:00+02:00'),Date.parse('2026-10-25T02:30:00+01:00')]
 ]){
  assert.equal(next-stamp,hour,'Two differently labeled local hours are distinct 60-minute UTC intervals');
  const valid=sample(stamp,hour),neighbor=sample(next,hour);
  assert.deepEqual(cells([{...valid,precipitationIntervalStartEpoch:null},neighbor])[0].base,cells([valid,neighbor])[0].base,'DST fallback uses absolute source instants');
 }
 const outside={...sample(base,hour),epoch:null,precipitationIntervalStartEpoch:' ',precipitationIntervalEndEpoch:base+hour};
 assert.equal(timed([outside],base,base+hour,0,0,100,8).length,0,'No 1970 start from invalid start and epoch');
 const unknown=sample(base,15*60000,{cloud:null,sunshineDuration:null,precipitation:0,rain:0,code:0});
 assert.equal(cells([unknown]).at(0).base,null,'Missing sunlight and clouds must not become clear weather');
 const cloudy=sample(base,hour,{cloud:90,sunshineDuration:null,precipitation:0,rain:0,code:0});
 assert.equal(cells([cloudy]).at(0).base?.color,'#aeb3b9','Known strong cloud stays gray');
 assert.ok(solar([cloudy],0,0,100,8,[0],[{startEpoch:base,endEpoch:base+hour/2}],[100]).some(s=>s.layer==='base'),'Known cloud preserved across genuine sunrise');
 console.log('Skybar .352: 15/60min, partial start/end, valid explicit interval, genuine-zero/NoData, 23/25h DST, continuous/solar geometry passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
