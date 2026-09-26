import assert from 'node:assert/strict';
import {sumMountainSnowfallWindows} from '../src/mountainSnowfall.ts';

const hour=60*60*1000,now=Date.UTC(2026,8,25,12,30),times=Array.from({length:73},(_,index)=>now-24*hour+index*hour),toEpoch=value=>Number(value);
const complete=times.map(()=>.25);
const totals=sumMountainSnowfallWindows(times,complete,now,toEpoch);
assert.equal(totals.past24,6);
assert.equal(totals.next24,6);
assert.equal(totals.next48,12);

const zeros=times.map(()=>0);
assert.deepEqual(sumMountainSnowfallWindows(times,zeros,now,toEpoch),{past24:0,next24:0,next48:0});
for(const missing of [null,undefined,'',Number.NaN,'not-a-number']){
 const values=[...complete];
 values[25]=missing;
 const result=sumMountainSnowfallWindows(times,values,now,toEpoch);
 assert.ok(Number.isNaN(result.next24),'Unknown hourly snowfall must not be reported as zero.');
 assert.ok(Number.isNaN(result.next48),'An incomplete 48-hour window must remain unavailable.');
 assert.equal(result.past24,6,'An unrelated complete window remains available.');
}

const partialTimes=times.filter((_,index)=>index!==25);
const partialValues=complete.filter((_,index)=>index!==25);
assert.ok(Number.isNaN(sumMountainSnowfallWindows(partialTimes,partialValues,now,toEpoch).next24),'Missing hourly slots must not produce an understated total.');
assert.deepEqual(sumMountainSnowfallWindows([],[],now,toEpoch),{past24:NaN,next24:NaN,next48:NaN});
assert.ok(Number.isNaN(sumMountainSnowfallWindows(times,complete,Number.NaN,toEpoch).next24));

console.log('Mountain snowfall totals preserve valid zeros and reject missing or incomplete hourly coverage.');