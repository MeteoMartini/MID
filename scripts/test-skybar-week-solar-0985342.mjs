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
