import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FIELDS,UNITS,canonicalRun,buildSingleRunUrl,qualifyRunPinnedRuc} from './openmeteo_ruc_single_run_shadow.mjs';
function fixture(){
 const run="2026-11-23T09:00",runMs=canonicalRun(run);
 const h={time:Array.from({length:28},(_,i)=>new Date(runMs+i*3600000).toISOString().slice(0,16))};
 for(const field of FIELDS)h[field]=Array(28).fill(field==="temperature_2m"?1:field==="dew_point_2m"?-1:field==="relative_humidity_2m"?86:field==="pressure_msl"?1020:field==="wind_speed_10m"?3:field==="wind_direction_10m"?270:field==="wind_gusts_10m"?6:field==="cloud_cover"?65:field==="cloud_cover_low"?40:field==="precipitation"?0:0);
 h.precipitation[0]=null;h.wind_gusts_10m[0]=null;
 return{requestedRun:run,lat:50.78,lon:7.02,nowMs:runMs+100*60000,
  metadata:{last_run_initialisation_time:runMs/1000,last_run_availability_time:runMs/1000+65*60},
  payload:{latitude:50.77532,longitude:7.0161643,timezone:"GMT",utc_offset_seconds:0,hourly_units:{...UNITS},hourly:h}};
}

test('28 run-aligned UTC hours, 12 fields, original null initial values',()=>{const r=qualifyRunPinnedRuc(fixture());assert.equal(r.maxCoreLeadHours,27);assert.equal(r.hours.length,28);assert.equal(r.fieldValidCounts.precipitation,27);assert.equal(r.hours[0].precipitation,null);assert.equal(r.hours[1].precipitation,0);assert.equal(r.hours[0].gust,null);assert.equal(r.publicationAuthorized,false);assert.equal(r.nativeDwdGribVerified,false);assert.equal(r.epsAvailable,false)});
test('calm wind legitimate zero, calm direction unknown',()=>{const x=fixture();x.payload.hourly.wind_speed_10m[2]=0;const r=qualifyRunPinnedRuc(x);assert.equal(r.hours[2].wind,0);assert.equal(r.hours[2].direction,null)});
test('freshness and exact metadata run are mandatory',()=>{for(const variant of ['stale','future','run']){const x=fixture();if(variant==='stale')x.nowMs+=6*3600000;if(variant==='future')x.nowMs-=2*3600000;if(variant==='run')x.metadata.last_run_initialisation_time-=3600;assert.throws(()=>qualifyRunPinnedRuc(x))}});
test('UTC-only and exact time step without duplicate or fractional UTC',()=>{for(const variant of ['timezone','step','offset']){const x=fixture();if(variant==='timezone')x.payload.timezone='Europe/Berlin';if(variant==='step')x.payload.hourly.time[10]=x.payload.hourly.time[9];if(variant==='offset')x.payload.utc_offset_seconds=3600;assert.throws(()=>qualifyRunPinnedRuc(x))}});
test('unit mismatch, negative precipitation, impossible humidity and NaN fail closed',()=>{for(const variant of ['unit','precip','rh','nan']){const x=fixture();if(variant==='unit')x.payload.hourly_units.wind_speed_10m='km/h';if(variant==='precip')x.payload.hourly.precipitation[3]=-0.1;if(variant==='rh')x.payload.hourly.relative_humidity_2m[2]=120;if(variant==='nan')x.payload.hourly.cape[2]=NaN;assert.throws(()=>qualifyRunPinnedRuc(x))}});
test('partial core field retains hole and tracks contiguous horizon',()=>{const x=fixture();x.payload.hourly.temperature_2m[13]=null;const r=qualifyRunPinnedRuc(x);assert.equal(r.maxCoreLeadHours,12);assert.equal(r.hours[13].temperature,null);assert.equal(r.fieldMissingCounts.temperature_2m,1)});
test('missing core first six hours or missing required schema rejects',()=>{const x=fixture();x.payload.hourly.pressure_msl[5]=null;assert.throws(()=>qualifyRunPinnedRuc(x));const y=fixture();delete y.payload.hourly.wind_speed_10m;assert.throws(()=>qualifyRunPinnedRuc(y))});
test('provider snapped coordinate must remain near requested point',()=>{const x=fixture();x.payload.latitude=49.7;assert.throws(()=>qualifyRunPinnedRuc(x))});
test('fixed Open-Meteo run-pinned URL, no uncontrolled model ID',()=>{const url=buildSingleRunUrl({run:'2026-11-23T09:00',lat:50.78,lon:7.02});assert.match(url,/single-runs-api\.open-meteo\.com/);assert.match(url,/models=dwd_icon_d2_ruc_native/);assert.match(url,/forecast_hours=28/);assert.match(url,/wind_speed_unit=kn/);assert.match(url,/run=2026-11-23T09%3A00/);assert.equal(url.split('hourly=')[1].split('&')[0].split(',').length,12);assert.throws(()=>buildSingleRunUrl({run:'invalid',lat:50.78,lon:7.02}))});

import {runSingleRunCanary,META_URL} from './openmeteo_ruc_single_run_canary.mjs';
test('read-only canary fetches metadata then exactly one pinned original provider run',async()=>{
 const x=fixture(),requests=[],fetchJson=async url=>{requests.push(url);return url===META_URL?x.metadata:x.payload};
 const r=await runSingleRunCanary({lat:x.lat,lon:x.lon,nowMs:x.nowMs,fetchJson});
 assert.equal(requests.length,2);assert.equal(requests[0],META_URL);
 assert.match(requests[1],/run=2026-11-23T09%3A00/);
 assert.equal(r.expectedHours,28);assert.equal(r.maxCoreLeadHours,27);
 assert.equal(r.fieldMissingCounts.precipitation,1);assert.equal(r.nativeDwdGribVerified,false);
 assert.equal(r.publicationAuthorized,false);assert.equal(r.commercialUseAuthorized,false);
});
test('canary rejects provider run metadata inconsistent with response time axis',async()=>{
 const x=fixture();x.metadata.last_run_initialisation_time+=3600;
 const fetchJson=async url=>url===META_URL?x.metadata:x.payload;
 await assert.rejects(runSingleRunCanary({lat:x.lat,lon:x.lon,nowMs:x.nowMs,fetchJson}));
});
test('canary rejects invalid location before any network calls',async()=>{
 let requests=0;
 await assert.rejects(runSingleRunCanary({lat:101,lon:7,nowMs:Date.now(),fetchJson:async()=>{requests++;return {}}}));
 assert.equal(requests,0);
});
