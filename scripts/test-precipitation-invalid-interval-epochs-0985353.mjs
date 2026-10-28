import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

// Exercise the actual shared production functions, not a copied epoch helper.
const dir=mkdtempSync(join(tmpdir(),'mid-precip-interval-'));
try{
 const out=join(dir,'precipitation.mjs');
 await build({entryPoints:['src/precipitation.ts'],bundle:true,platform:'node',format:'esm',outfile:out,logLevel:'silent'});
 const {precipitationSampleIntervalSeconds:slot,precipitationParts:parts,precipitationIntensityDescriptor:intensity}=await import(pathToFileURL(out).href);
 const run=Date.UTC(2026,9,28,12),min=60000,hour=60*min;
 const sample=(duration,extra={})=>({
  epoch:run,precipitationIntervalStartEpoch:run,precipitationIntervalEndEpoch:run+duration,
  precipitation:1.25,rain:1.25,showers:0,snowfall:0,probability:60,code:61,cloud:70,isDay:true,...extra
 });
 for(const duration of [15*min,hour]){
  const valid=sample(duration),startMissing=sample(duration,{precipitationIntervalStartEpoch:undefined});
  assert.equal(slot(valid),duration/1000,'Complete source duration remains authoritative');
  assert.equal(slot(startMissing),3600,'Missing boundary retains documented fallback');
  for(const invalid of [null,undefined,'',' ','   ','\\t',false,true,NaN,Infinity,-Infinity,{},[]]){
   const badStart=sample(duration,{precipitationIntervalStartEpoch:invalid});
   const badEnd=sample(duration,{precipitationIntervalEndEpoch:invalid});
   assert.equal(slot(badStart),3600,'Invalid interval start never fabricates 1970: '+String(invalid));
   assert.equal(slot(badEnd),3600,'Invalid interval end never fabricates 1970: '+String(invalid));
   assert.deepEqual(parts(badStart),parts(startMissing),'Weather type, label, amount and intensity must match genuine missing metadata');
   assert.equal(slot(badStart,900),900,'Caller-supplied fallback for partial interval remains valid');
  }
  assert.equal(slot(sample(duration,{precipitationIntervalStartEpoch:String(run)})),duration/1000,'Finite numeric string sources retain compatibility');
  assert.equal(slot(sample(duration,{precipitationIntervalStartEpoch:run+duration})),3600,'Zero or reversed duration must not be considered valid');
  assert.equal(slot(sample(duration,{precipitationIntervalStartEpoch:run+duration+min})),3600);
  assert.equal(slot(valid,900),duration/1000,'Valid supplied provenance outranks a fallback');
  assert.equal(slot(sample(duration,{precipitationIntervalEndEpoch:undefined}),900),900,'Explicit caller fallback preserved');
 }
 const quarter=sample(15*min);
 assert.equal(intensity('rain',1.25,0,slot(quarter)).rateMmh,5,'15-minute rate is 5 mm/h');
 assert.equal(parts(quarter).intensity,'heavy','DWD strong continuous rain retains original classification');
 assert.equal(parts(sample(hour)).intensity,'moderate','60-minute rate is 1.25 mm/h');
 const trueZero=sample(15*min,{precipitation:0,rain:0,showers:0,code:0});
 assert.equal(parts(trueZero).total,0,'A real reported zero stays an original zero');
 assert.equal(slot({precipitationIntervalStartEpoch:0,precipitationIntervalEndEpoch:15*min}),900,'A genuine numeric Unix epoch zero must remain valid');
 for(const [start,end] of [
  [Date.parse('2026-03-29T01:30:00+01:00'),Date.parse('2026-03-29T03:30:00+02:00')],
  [Date.parse('2026-10-25T02:30:00+02:00'),Date.parse('2026-10-25T02:30:00+01:00')]
 ])assert.equal(slot({precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:end}),3600,'DST must use absolute UTC instants');
 console.log('MID .353 precipitation: invalid epoch boundaries, true 15/60m, 1970 zero, DST and original WMO intensities passed.');
}finally{rmSync(dir,{recursive:true,force:true})}
