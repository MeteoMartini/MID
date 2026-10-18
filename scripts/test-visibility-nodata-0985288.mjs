import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';

// Exercise the actual production TS classifier, not a reimplemented algorithm.
const temp=await mkdtemp(join(tmpdir(),'mid-visibility-missing-'));
try{
 const out=join(temp,'visibility.cjs');
 await build({entryPoints:['src/visibilityPhenomena.ts'],bundle:true,platform:'node',format:'cjs',outfile:out,logLevel:'silent'});
 const {classifyVisibilityPhenomenon:classify,effectiveVisibilityHumidity:humidity}=createRequire(import.meta.url)(out);
 const invalid=[null,undefined,'',' ',false,true,{},[],Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY];
 for(const visibility of invalid){
  const row=classify({visibility,humidity:91,weatherCode:3});
  assert.equal(row.kind,'none',`No visibility means no verified fog: ${String(visibility)}`);
  assert.equal(row.source,'none','Provider missing must not become an observed visibility of 0 m');
 }
 for(const value of [null,undefined,'',' ',false,true,{},[],Number.NaN,Number.POSITIVE_INFINITY]){
  assert.equal(humidity({humidity:value,temperature:null,dewPoint:null}),undefined,'missing RH/dew point cannot become 0 % or 100 %');
  assert.equal(classify({visibility:2200,humidity:value,temperature:null,dewPoint:null,weatherCode:3}).kind,'none','Missing RH must not invent dry haze');
 }
 const calculated=humidity({humidity:null,temperature:10,dewPoint:9});
 assert(Number.isFinite(calculated)&&calculated>90&&calculated<100,'Valid temperature/dew-point fallback should derive RH');
 assert.equal(humidity({humidity:0,temperature:10,dewPoint:9}),0,'Genuine RH 0 % remains a valid numeric zero');
 assert.equal(humidity({humidity:'75',temperature:10,dewPoint:9}),75,'Nonempty finite numeric provider strings stay backward-compatible');
 assert.equal(classify({visibility:0,humidity:90,weatherCode:3}).kind,'fog','Genuine visibility 0 m must remain an extreme, not missing');
 assert.equal(classify({visibility:850,humidity:94,weatherCode:3}).kind,'fog');
 assert.equal(classify({visibility:1300,humidity:91,weatherCode:45}).kind,'mist','Finite visibility rules out model fog and preserves meteorological mist');
 assert.equal(classify({visibility:12000,humidity:91,weatherCode:45}).kind,'none','Model fog cannot override contradictory finite 12 km visibility');
 assert.equal(classify({visibility:2500,humidity:35,weatherCode:3}).kind,'haze','Physically supported dry haze is unchanged');
 const unmeasuredModel=classify({visibility:null,humidity:91,weatherCode:45});
 assert.equal(unmeasuredModel.kind,'fog','Trusted model code remains independent evidence');
 assert.equal(unmeasuredModel.source,'model','Model fog without a measurement may not be falsely reported as measured');
 const reported=classify({visibility:null,weatherCode:3,presentWeather:'FG',trustPresentWeather:true});
 assert.equal(reported.source,'report','Trusted actual present-weather report is preserved when visibility is missing');
 const contradiction=classify({visibility:12000,humidity:91,presentWeather:'FG',trustPresentWeather:true});
 assert.equal(contradiction.visibilityConflict,true,'Contradictory report must still be flagged');
 const serialized=JSON.parse(JSON.stringify({visibility:NaN,humidity:NaN,temperature:NaN,dewPoint:NaN,weatherCode:3}));
 assert.equal(serialized.visibility,null);
 assert.equal(classify(serialized).kind,'none','Worker/cache NaN to JSON null roundtrip cannot create a fictitious 0-m fog');
 console.log('MID v0.9.85.288 visibility NoData, real-zero, RH, METAR, model code and JSON cache regression passed.');
}finally{await rm(temp,{recursive:true,force:true})}
