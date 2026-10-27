import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync} from 'node:fs';

const astronomySource=readFileSync(new URL('../src/astronomy.ts',import.meta.url),'utf8');
const curveSource=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
assert.ok(!astronomySource.includes('dayOffset<=3'),'Astronomical 7-day windows must never retain the four-day cutoff');
assert.ok(curveSource.includes('solarTimelineWindow(skybarEpochs[0]'),'The 7-day strip must use the common solar timeline');
assert.ok(curveSource.includes('solarTimelineWindow(start,end,')&&curveSource.includes('cockpitDaySkybarNightBands('),'Day cards and weekly night masks must use the same solar core');

const {outputFiles}=await build({entryPoints:['src/astronomy.ts'],bundle:true,platform:'node',format:'esm',write:false,logLevel:'silent'});
const {solarTimelineWindow,solarDaylightWindowAt,astronomicalIsDayAt}=await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
const berlin={latitude:50.8,longitude:7.2,elevation:60,timezone:'Europe/Berlin'};
const DAY=86400000, HOUR=3600000;
const weekStart=Date.parse('2026-10-25T23:00:00Z'); // Mon 26 Oct 00:00 CET
const inside=(bands,epoch)=>bands.some(b=>epoch>=b.startEpoch&&epoch<b.endEpoch);
const count=(events,kind)=>events.filter(e=>e.kind===kind).length;
for(const length of [7,14,46]){
 const end=weekStart+length*DAY,week=solarTimelineWindow(weekStart,end,berlin,false);
 assert.equal(count(week.events,'sunrise'),length,`Every sunrise through day ${length} must be represented`);
 assert.equal(count(week.events,'sunset'),length,`Every sunset through day ${length} must be represented`);
 for(let i=0;i<length;i++){
  const dayStart=weekStart+i*DAY,dayEnd=dayStart+DAY;
  const day=solarTimelineWindow(dayStart,dayEnd,berlin,false);
  assert.equal(count(day.events,'sunrise'),1,`Daily sunrise ${i}`);
  assert.equal(count(day.events,'sunset'),1,`Daily sunset ${i}`);
  const midday=dayStart+12*HOUR,midnight=dayStart+3*HOUR;
  assert.equal(inside(week.nightBands,midday),false,`Week must not mark day ${i} noon as night`);
  assert.equal(inside(week.nightBands,midnight),true,`Week must retain day ${i} night`);
  assert.equal(inside(week.nightBands,midday),inside(day.nightBands,midday),'Week/day view noon parity');
  for(const epoch of [dayStart+HOUR,dayStart+6*HOUR,dayStart+12*HOUR,dayStart+18*HOUR,dayStart+23*HOUR]){
   assert.equal(inside(week.nightBands,epoch),inside(day.nightBands,epoch),`Day/7d/14d/46d night-mask parity ${i}, ${epoch}`);
   assert.equal(inside(week.nightBands,epoch),!astronomicalIsDayAt(epoch,berlin,false),`Local astronomy parity for epoch ${epoch}`);
  }
 }
}
const week=solarTimelineWindow(weekStart,weekStart+7*DAY,berlin);
for(const date of ['2026-10-31','2026-11-01']){
 const midday=Date.parse(date+'T12:00:00Z'),events=solarDaylightWindowAt(midday,berlin);
 assert.ok(events.sunrise&&events.sunset,`Expected bounded daylight on ${date}`);
 assert.ok(week.events.some(e=>e.kind==='sunrise'&&e.epoch===events.sunrise.getTime()));
 assert.ok(week.events.some(e=>e.kind==='sunset'&&e.epoch===events.sunset.getTime()));
 assert.equal(inside(week.nightBands,midday),false,`${date} midday cannot become a week-long fake night`);
}
// On a DST boundary local midnight-to-midnight is not 24 hours.
for(const [start,end,expectedHours] of [
 ['2026-03-28T23:00:00Z','2026-03-29T22:00:00Z',23],
 ['2026-10-24T22:00:00Z','2026-10-25T23:00:00Z',25]
]){
 const first=Date.parse(start),last=Date.parse(end);
 assert.equal((last-first)/HOUR,expectedHours);
 const daily=solarTimelineWindow(first,last,berlin,false);
 assert.equal(count(daily.events,'sunrise'),1);assert.equal(count(daily.events,'sunset'),1);
 assert.ok(daily.nightBands.every(b=>b.startEpoch>=first&&b.endEpoch<=last));
 assert.equal(inside(daily.nightBands,first+12*HOUR),false);
}
const polar={latitude:69.65,longitude:18.96,timezone:'Europe/Oslo'};
const polarStart=Date.parse('2026-12-09T23:00:00Z'),polarEnd=polarStart+7*DAY,polarNight=solarTimelineWindow(polarStart,polarEnd,polar,false);
assert.equal(polarNight.events.length,0,'Polar night has no fabricated sunrise/sunset');
assert.ok(inside(polarNight.nightBands,polarStart+5*DAY+12*HOUR),'Polar night remains night at end of week');
const long=solarTimelineWindow(weekStart,weekStart+70*DAY,berlin,false);
assert.deepEqual(long,{events:[],nightBands:[]},'Outside the supported 62-local-day horizon must not fabricate events');
console.log('Skybar 7/14/46 days: complete local solar events, 31 Oct/1 Nov, per-day parity, 23/25h DST, polar no-event and bounded fallback verified.');


// C49: A full seven-day source has 168 immutable hourly slots, but precise
// sunrise/sunset clipping legitimately creates extra rendered partitions.
// The SVG renderer must retain every original hour and both solar boundaries
// on every day, rather than assuming one drawn segment per source sample.
{
 const {mkdtempSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {pathToFileURL}=await import('node:url');
 const work=mkdtempSync(join(tmpdir(),'mid-week-solar-render-'));
 try{
  await build({
   stdin:{contents:"export{detailSkyBarTimedSegments}from'./src/detailSkyBar';export{skyBarVisualRuns}from'./src/skyBarVisualRuns';export{SkyBarSegmentsSvg}from'./src/SkyBarSegments';export{renderToStaticMarkup}from'react-dom/server';export{createElement}from'react';",resolveDir:process.cwd()},
   bundle:true,platform:'node',format:'cjs',outfile:join(work,'render.cjs'),jsx:'automatic',logLevel:'silent'
  });
  const {detailSkyBarTimedSegments:timed,skyBarVisualRuns:visualRuns,SkyBarSegmentsSvg,renderToStaticMarkup,createElement}=await import(pathToFileURL(join(work,'render.cjs')));
  const hours=168,spanEnd=weekStart+hours*HOUR,sky=solarTimelineWindow(weekStart,spanEnd,berlin,false),chartWidth=1680,slotWidth=chartWidth/hours;
  assert.equal(sky.events.length,14,'Seven genuine local sunrises and sunsets must survive week rendering');
  const sampleAt=(epoch,cloud,wet=0)=>({
   epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+HOUR,
   cloud,isDay:false,sunshineDuration:null,precipitation:wet,rain:wet,showers:0,snowfall:0,probability:0,code:wet>0?61:0
  });
  const source=Array.from({length:hours},(_,i)=>sampleAt(weekStart+i*HOUR,70));
  const paint=(rows)=>timed(rows,weekStart,spanEnd,0,0,chartWidth,8,sky.nightBands);
  const gray=paint(source).filter(s=>s.layer==='base');
  assert.equal(gray.length,hours+sky.events.length,'Solar event divisions are additional true intervals, not extra input hours');
  assert.ok(gray.every(s=>s.color==='#aeb3b9'&&s.x2>s.x1&&s.x1>=0&&s.x2<=chartWidth),'Known 70% cloud must remain gray on both sides of each event');
  assert.ok(Math.abs(gray.reduce((sum,s)=>sum+s.x2-s.x1,0)-chartWidth)<1e-8,'Every original known-cloud minute must remain covered, without seams or extrapolation');
  for(const e of sky.events){
   const x=(e.epoch-weekStart)/(spanEnd-weekStart)*chartWidth;
   assert.ok(gray.some(s=>Math.abs(s.x1-x)<1e-7),'Solar boundary must be represented exactly: '+e.kind+' '+e.epoch);
   assert.ok(gray.some(s=>Math.abs(s.x2-x)<1e-7),'Neighboring parts must meet at actual '+e.kind);
  }
  const runs=visualRuns(gray);
  assert.equal(runs.reduce((n,r)=>n+r.samples.length,0),gray.length,'Merging visually identical paints must preserve every per-interval tooltip');
  const markup=renderToStaticMarkup(createElement('svg',{viewBox:'0 0 1680 16'},createElement(SkyBarSegmentsSvg,{segments:gray})));
  assert.equal((markup.match(/<title>/g)||[]).length,gray.length,'Shared SVG keeps all split-hour metadata');
  assert.ok(markup.includes('data-skybar-run-samples='),'Shared widget/curve renderer may optimize paint but never discard intervals');

  // Precipitation is a separate accumulation overlay and MUST NOT inherit
  // the solar partitions or redistribute its original quantity.
  const rainy=source.map(s=>({...s,precipitation:1,rain:1,code:61}));
  const wet=paint(rainy).filter(s=>s.layer==='precip');
  assert.equal(wet.length,hours,'168 valid precipitation accumulations stay exactly 168 forward intervals');
  for(let i=0;i<hours;i++){assert.ok(Math.abs(wet[i].x1-i*slotWidth)<1e-7);assert.ok(Math.abs(wet[i].x2-(i+1)*slotWidth)<1e-7)}
  const unknown=source.map((s,i)=>i===20?{...s,cloud:null}:s);
  const unavailable=paint(unknown).filter(s=>s.layer==='base');
  assert.ok(unavailable.every(s=>s.x2<=20*slotWidth+1e-7||s.x1>=21*slotWidth-1e-7),'Missing cloud must produce an actual gap, not zero or fabricated sunshine');
  const clear=paint(source.map(s=>({...s,cloud:20}))).filter(s=>s.layer==='base');
  assert.ok(clear.some(s=>s.color==='#ffc229'),'Verified daylight retains its labeled cloud-gap base');
  for(const item of clear)for(const night of sky.nightBands){
   assert.ok(item.x2<=(night.startEpoch-weekStart)/(spanEnd-weekStart)*chartWidth+1e-7||
             item.x1>=(night.endEpoch-weekStart)/(spanEnd-weekStart)*chartWidth-1e-7,'No yellow may cross a confirmed night interval');
  }
  // The repeated autumn civil hour is still two separate, valid UTC slots.
  const dstStart=Date.parse('2026-10-24T22:00:00Z'),dstEnd=Date.parse('2026-10-25T23:00:00Z'),dstHours=(dstEnd-dstStart)/HOUR;
  const dst=solarTimelineWindow(dstStart,dstEnd,berlin,false);
  const dstCloud=Array.from({length:dstHours},(_,i)=>sampleAt(dstStart+i*HOUR,70));
  const dstSegments=timed(dstCloud,dstStart,dstEnd,0,0,250,8,dst.nightBands).filter(s=>s.layer==='base');
  assert.equal(dstHours,25);assert.equal(dst.events.length,2);
  assert.equal(dstSegments.length,dstHours+dst.events.length,'25 real hours plus exact sunrise/sunset partitions');
  assert.ok(Math.abs(dstSegments.reduce((sum,s)=>sum+s.x2-s.x1,0)-250)<1e-8);
  console.log('C49 week/widget solar: 168 source hours, 14 real event partitions, 182 tooltip intervals, 168 unchanged precipitation slots, true Missing gap, no night sunshine and 25-hour DST passed.');
 }finally{rmSync(work,{recursive:true,force:true})}
}
