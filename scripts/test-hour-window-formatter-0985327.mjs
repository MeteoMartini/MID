import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {transform} from 'esbuild';

// Compile the REAL source helpers, not a copied production algorithm.
const source=await readFile(new URL('../src/currentFullHourWindow.ts',import.meta.url),'utf8');
const output=await transform(source,{loader:'ts',format:'esm',target:'es2020'});
const {fullHourMinuteInZone,buildCurrentFullHourIndex,currentFullHourStartEpoch,currentFullHourWindowFromIndex,currentFullHourWindow}=await import('data:text/javascript;base64,'+Buffer.from(output.code).toString('base64'));

// Golden reference keeps the historical per-row formatter and original UTC-window selection.
function oldMinute(epoch,zone){if(!Number.isFinite(epoch))return Number.NaN;return Number(Intl.DateTimeFormat('en-GB',{timeZone:zone,minute:'2-digit'}).formatToParts(new Date(epoch)).find(part=>part.type==='minute')?.value)}
function reference(hours,timezone,now,horizonHours=12){
 const fullHours=hours.filter(hour=>Number.isFinite(Number(hour.epoch))&&oldMinute(Number(hour.epoch),timezone)===0);
 if(!fullHours.length)return[];
 let startIndex=-1;for(let index=0;index<fullHours.length;index++){if(Number(fullHours[index].epoch)<=now)startIndex=index;else break}
 if(startIndex<0)startIndex=0;
 const startEpoch=Number(fullHours[startIndex]?.epoch),byEpoch=new Map(fullHours.map(hour=>[Number(hour.epoch),hour]));
 return Array.from({length:horizonHours+1},(_,index)=>{const epoch=startEpoch+index*3600000;return byEpoch.get(epoch)??{...fullHours[startIndex],epoch,time:new Date(epoch).toISOString(),timezone,temperature:NaN}});
}

const base=Date.parse('2026-10-24T00:00:00Z');
const hours=Array.from({length:240},(_,index)=>{const epoch=base+index*3600000;return{epoch,time:new Date(epoch).toISOString(),temperature:index/3,precipitation:index%5===0?0.3:0}});
const interleaved=hours.flatMap((hour,index)=>index%2?[hour,{...hour,epoch:hour.epoch+15*60000,time:new Date(hour.epoch+15*60000).toISOString()}]:[hour]);
let checked=0;
for(const zone of ['Europe/Berlin','Europe/London','America/New_York','Asia/Kathmandu']){
 for(const input of [hours,interleaved,[],[{epoch:NaN,temperature:99}],hours.slice(10,20).filter((_,i)=>i%3)]){
  const index=buildCurrentFullHourIndex(input,zone);
  for(const offset of [0,26,49,84,120,188,210])for(const horizon of [1,12,24]){
   const now=base+offset*3600000;
   const expected=reference(input,zone,now,horizon),start=expected.length?Number(expected[0].epoch):Number.NaN;
   assert.equal(currentFullHourStartEpoch(index,now),start,zone+'/'+offset+'/'+horizon+' start');
   assert.deepEqual(currentFullHourWindowFromIndex(index,zone,start,horizon),expected,zone+'/'+offset+'/'+horizon+' indexed');
   assert.deepEqual(currentFullHourWindow(input,zone,now,horizon),expected,zone+'/'+offset+'/'+horizon);checked++;
  }
 }
}
// DST fall-back has two distinct UTC epochs with the same local 02:00; never collapse them.
const berlin=hours.filter(hour=>hour.epoch>=Date.parse('2026-10-25T00:00:00Z')&&hour.epoch<=Date.parse('2026-10-25T03:00:00Z'));
const firstTwo=berlin.slice(0,2);
assert.equal(new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(firstTwo[0].epoch)).find(part=>part.type==='hour')?.value, '02');
assert.equal(new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(firstTwo[1].epoch)).find(part=>part.type==='hour')?.value, '02');
assert.notEqual(firstTwo[0].epoch,firstTwo[1].epoch);
assert.deepEqual(currentFullHourWindow(hours,'Europe/Berlin',firstTwo[0].epoch),reference(hours,'Europe/Berlin',firstTwo[0].epoch));
assert.deepEqual(currentFullHourWindow(hours,'Europe/Berlin',firstTwo[1].epoch),reference(hours,'Europe/Berlin',firstTwo[1].epoch));
const kathmanduIndex=buildCurrentFullHourIndex(interleaved,'Asia/Kathmandu'),fractionalBoundary=base+3*3600000+15*60000;
assert.equal(currentFullHourStartEpoch(kathmanduIndex,fractionalBoundary-1),base+3600000+15*60000,'Fractional-offset zone keeps the previous forecast hour until its actual local boundary');
assert.equal(currentFullHourStartEpoch(kathmanduIndex,fractionalBoundary),fractionalBoundary,'Fractional-offset zone switches immediately at the actual local boundary');
// A new observation/value and a moved 30-s or hourly reference must not be cached across calls.
const changed=hours.map(hour=>({...hour,temperature:hour.temperature+19}));
assert.notDeepEqual(currentFullHourWindow(changed,'Europe/Berlin',base+50*3600000),currentFullHourWindow(hours,'Europe/Berlin',base+50*3600000));
assert.deepEqual(currentFullHourWindow(changed,'Europe/Berlin',base+50*3600000),reference(changed,'Europe/Berlin',base+50*3600000));
assert.deepEqual(currentFullHourWindow(hours,'Europe/Berlin',base+50*3600000+30000),reference(hours,'Europe/Berlin',base+50*3600000+30000));
assert.equal(Number.isNaN(fullHourMinuteInZone(NaN,'Europe/Berlin')),true);
assert.deepEqual(currentFullHourWindow([{epoch:NaN}],'Invalid/Timezone',base),[],'Do not instantiate a formatter when every epoch is missing');
assert.throws(()=>currentFullHourWindow(hours,'Invalid/Timezone',base),RangeError);
// The expensive Intl.DateTimeFormat constructor must run only once per full-series invocation.
const original=Intl.DateTimeFormat;let constructors=0;
try{Intl.DateTimeFormat=function(...args){constructors++;return new original(...args)};currentFullHourWindow(hours,'Europe/Berlin',base+3600000);}
finally{Intl.DateTimeFormat=original;}
assert.equal(constructors,1,'Hourly render calculation must reuse its local time-zone formatter');
console.log('PASS current full-hour formatter: '+checked+' golden comparisons, DST, invalid/missing values, freshness and one constructor');
