#!/usr/bin/env node
// Actual MID sources, never a replacement or authorization for the main release gates.
import assert from 'node:assert/strict';
import fc from 'fast-check';
import {parseMidVersion,makeProposedVersion} from '../../ci/mid-release-version-proposal.mjs';
import {sumCompletePrecipitation as sumHourly} from '../../../src/waterPrecipitationAggregation.ts';
import {sumCompletePrecipitation as sumIntervals,
 isAvailablePrecipitation,completePrecipitationWindowCoverage}
 from '../../../src/precipitationAvailability.ts';

const baseEpoch=Date.UTC(2026,10,11,0,0);
const HOUR=3600000;
const samples=values=>values.map((value,i)=>({epoch:baseEpoch+i*HOUR,value,available:true}));
const PARAMS={seed:0x08545512,numRuns:512};
let cases=0;

// Exact four-part version semantics, fixed seed and automated shrinking on failure.
fc.assert(fc.property(fc.tuple(
 fc.integer({min:0,max:7}),fc.integer({min:0,max:50}),
 fc.integer({min:0,max:999}),fc.integer({min:0,max:20000})
),([x,y,z,w])=>{
 const base=[x,y,z,w].join('.');
 assert.deepEqual(parseMidVersion(base),[x,y,z,w]);
 assert.deepEqual(parseMidVersion(makeProposedVersion(base,'maintenance')),[x,y,z,w+1]);
 assert.deepEqual(parseMidVersion(makeProposedVersion(base,'feature')),[x,y,z+1,0]);
 cases++;
}),PARAMS);

// Zero is measured absence of precipitation, null/undefined/NaN never become zero.
fc.assert(fc.property(fc.array(fc.integer({min:0,max:250}),{minLength:1,maxLength:25}),(values)=>{
 assert.equal(sumHourly(samples(values),values.length),values.reduce((a,b)=>a+b,0));
 assert.equal(sumIntervals(values),values.reduce((a,b)=>a+b,0));
 assert.equal(isAvailablePrecipitation(0),true);
 cases++;
}),PARAMS);
fc.assert(fc.property(fc.array(fc.integer({min:0,max:250}),{minLength:1,maxLength:25}),fc.nat(),
 (values,position)=>{
 const missing=samples(values),i=position%missing.length;
 missing[i].value=null;
 assert.ok(Number.isNaN(sumHourly(missing,values.length)));
 const unknown=[...values];unknown[i]=undefined;
 assert.ok(Number.isNaN(sumIntervals(unknown)));
 cases++;
}),PARAMS);

// A missing or shifted original 1h slot must invalidate the aggregate.
fc.assert(fc.property(fc.array(fc.integer({min:0,max:250}),{minLength:2,maxLength:25}),
 (values)=>{
 const shifted=samples(values);
 shifted[1].epoch+=1000;
 assert.ok(Number.isNaN(sumHourly(shifted,values.length)));
 const hidden=samples(values);hidden[1].available=false;
 assert.ok(Number.isNaN(sumHourly(hidden,values.length)));
 cases++;
}),PARAMS);

// Real absolute windows, including 23- and 25-hour DST days, not assumed 24h.
fc.assert(fc.property(fc.constantFrom(23,24,25),
 fc.integer({min:0,max:1000}),(hours,offset)=>{
 const start=baseEpoch+offset*HOUR;
 const intervals=Array.from({length:hours},(_,i)=>({start:start+i*HOUR,end:start+(i+1)*HOUR}));
 assert.equal(completePrecipitationWindowCoverage(intervals,start,start+hours*HOUR),true);
 const broken=intervals.map(x=>({...x}));broken[1].start+=5000;
 assert.equal(completePrecipitationWindowCoverage(broken,start,start+hours*HOUR),false);
 cases++;
}),PARAMS);
console.log('MID real-source fast-check: '+cases+' seeded generated cases PASS; '+PARAMS.numRuns+' runs/property, seed='+PARAMS.seed+'; no release authorization.');
