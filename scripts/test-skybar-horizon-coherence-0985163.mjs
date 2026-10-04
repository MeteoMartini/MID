import assert from 'node:assert/strict';
import {build} from 'esbuild';
const result=await build({stdin:{contents:"export {niceChartScale,chartLabelVisible} from './src/chartScale';export{sunshineAfterSkyCorrection}from './src/sunshineDuration';export{finalizeForecastMinute15}from './src/forecastFusion';export{detailSkyBarHourCells}from './src/detailSkyBar';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env':'{}'},logLevel:'silent'});
const {niceChartScale,chartLabelVisible,sunshineAfterSkyCorrection,finalizeForecastMinute15,detailSkyBarHourCells}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
for(const values of [[-5,13],[0,.43],[-.14,.55],[990,1034],[],[3,3]]){const scale=niceChartScale(values);assert.ok(scale.high>scale.low);assert.ok(values.every(v=>v>=scale.low&&v<=scale.high));assert.ok(scale.ticks.every(Number.isFinite));}
assert.equal(sunshineAfterSkyCorrection(900,10,40),null);assert.equal(sunshineAfterSkyCorrection(900,10,11),900);assert.equal(sunshineAfterSkyCorrection(null,10,40),null);
assert.ok(Array.from({length:7},(_,i)=>chartLabelVisible(i,7,200)).filter(Boolean).length<=3);
const now=Date.UTC(2026,9,4,12),base={epoch:now,time:'2026-10-04T12:00',cloud:10,lowCloud:5,code:0,isDay:true,precipitation:0,rain:0,showers:0,snowfall:0,probability:0,sunshineDuration:3600,temperature:20,humidity:50,wind:3,gust:7},row={...base,sunshineDuration:900,cloud:20};
const corrected=finalizeForecastMinute15([row],[base],[{...base,cloud:40}],{now})[0];assert.equal(corrected.cloud,50,'native quarter variation plus canonical cloud delta');assert.equal(corrected.sunshineDuration,null,'old model sunshine invalidated');assert.equal(detailSkyBarHourCells([corrected])[0].base.color,'#aeb3b9');
const original=finalizeForecastMinute15([row],[base],[base],{now})[0];assert.equal(original.cloud,20);assert.equal(original.sunshineDuration,900,'untouched sky retains actual duration');
console.log('MID163: scale bounds, sparse labels, sky provenance and canonical quarter cloud/Skybar passed.');
