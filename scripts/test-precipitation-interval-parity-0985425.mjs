import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-precip-parity-'));
try{
 const cockpit=readFileSync('src/ForecastCockpit.tsx','utf8').split('\n').find(line=>line.startsWith('function shortTermPrecipitationParts('));
 await build({stdin:{contents:`import {precipitationParts} from './precipitation';export {precipitationParts,precipitationIntensityDescriptor} from './precipitation';export {precipitationPresentationHours,precipitationPresentationMinutes15,precipitationPresentationProvenance} from './precipitationIntervals';export {detailSkyBarHourCells} from './detailSkyBar';${cockpit};export {shortTermPrecipitationParts};`,resolveDir:resolve('src'),loader:'ts'},bundle:true,platform:'node',format:'esm',outfile:join(dir,'module.mjs'),logLevel:'silent'});
 const m=await import(pathToFileURL(join(dir,'module.mjs'))),epoch=Date.parse('2026-11-04T10:00Z');
 const base={epoch,time:'2026-11-04T10:00',precipitation:.2,rain:.2,showers:0,snowfall:0,probability:80,code:61,temperature:10,cloud:90,isDay:true};
 const levels={none:null,light:1,moderate:2,heavy:3,'very-heavy':4};
 for(const [minutes,amount,code,snow] of [[15,.2,61,0],[60,.2,61,0],[180,1.2,61,0],[15,.01,82,0],[60,.01,82,0],[180,.01,82,0],[15,.2,71,.2],[60,.2,68,.1],[15,0,0,0]]){
  const sample={...base,precipitation:amount,rain:snow?0:amount,showers:code===82?amount:0,snowfall:snow,code,temperature:code===71?-3:code===68?0:10,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+minutes*60000};
  const before=JSON.stringify(sample),shared=m.precipitationParts(sample),profile=m.shortTermPrecipitationParts(sample),sky=m.detailSkyBarHourCells([sample])[0];
  assert.deepEqual(profile,shared,'Profile details must retain duration and phase inputs');
  assert.equal(sky.precip?.thicknessLevel??null,levels[shared.intensity],'Skybar and profile intensity must agree for the identical interval');
  assert.equal(JSON.stringify(sample),before,'Rendering must not mutate the finalized sample');
  if(code===71)assert.equal(shared.type,'snow');
  if(code===68)assert.equal(shared.type,'sleet');
  if(code===82)assert.equal(shared.intensity,'very-heavy','Small accumulated amounts must not downgrade coded convective peaks');
  const rate=m.precipitationIntensityDescriptor(shared.type,amount,snow,minutes*60,shared.displayCode)?.rateMmh;
  if(shared.type!=='none')assert.ok(Math.abs(rate-amount*60/minutes)<1e-9);
  console.log(JSON.stringify({minutes,amount,code,rate:rate??null,phase:shared.type,intensity:shared.intensity,profile:profile.weatherLabel,skybar:sky.precip?.title??null}));
 }
 for(const minutes of [15,60]){
  const input=[base,{...base,epoch:epoch+minutes*60000}],before=JSON.stringify(input);
  const shown=(minutes===15?m.precipitationPresentationMinutes15:m.precipitationPresentationHours)(input)[0];
  assert.equal(shown.precipitationIntervalStartEpoch,epoch);assert.equal(shown.precipitationIntervalEndEpoch,epoch+minutes*60000);
  const trace=m.precipitationPresentationProvenance(shown);assert.equal(trace.sourceEndEpoch,epoch+minutes*60000);assert.equal(trace.inputCode,61);assert.equal(trace.amountMm,.2);
  assert.equal(m.shortTermPrecipitationParts(shown).intensity,minutes===15?'moderate':'light');
  assert.equal(m.detailSkyBarHourCells([shown])[0].precip.thicknessLevel,minutes===15?2:1);
  assert.equal(JSON.stringify(input),before);
  for(const missing of [null,NaN]){
   const raw=[base,{...base,epoch:epoch+minutes*60000,precipitation:missing,rain:missing,precipitationAvailable:false}];
   const absent=(minutes===15?m.precipitationPresentationMinutes15:m.precipitationPresentationHours)(raw)[0];
   assert.equal(absent.precipitationAvailable,false);assert.equal(m.precipitationPresentationProvenance(absent).amountMm,null,'Legacy numeric placeholders are not measured zero');
  }
 }
 console.log('PASS shared presentation/profile/Skybar parity: 15/60/180 min, convective peaks, snow/mixed phase, zero, Missing, raw provenance and immutable finalized inputs');
}finally{rmSync(dir,{recursive:true,force:true})}
