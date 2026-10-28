import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const temp=mkdtempSync(join(tmpdir(),'mid-skybar-measurement-'));
try{
 const output=join(temp,'detailSkyBar.mjs');
 await build({entryPoints:['src/detailSkyBar.ts'],bundle:true,platform:'node',format:'esm',outfile:output,logLevel:'silent'});
 const {detailSkyBarHourCells,detailSkyBarTimedSegments}=await import(pathToFileURL(output).href);
 const epoch=Date.UTC(2026,9,28,12),duration=15*60*1000;
 const sample=(fields={})=>({epoch,precipitationIntervalStartEpoch:epoch,precipitationIntervalEndEpoch:epoch+duration,
  cloud:null,sunshineDuration:null,isDay:true,precipitation:null,rain:null,showers:null,snowfall:null,code:0,...fields});
 const cell=fields=>detailSkyBarHourCells([sample(fields)])[0];
 for(const invalid of [false,true,null,undefined,'','  ','\t',NaN,Infinity,-Infinity,[],[0],{}]){
  const fields={cloud:invalid,sunshineDuration:invalid},value=cell(fields);
  assert.equal(value.state,'unavailable','Invalid cloud/sunshine is NoData: '+String(invalid));
  assert.equal(value.base,null,'Invalid data may not fabricate sun or cloud');
  assert.equal(value.precip,null,'Missing precipitation remains missing');
  assert.match(value.title,/Bewölkung nicht verfügbar/);
  assert.equal(detailSkyBarTimedSegments([sample(fields)],epoch,epoch+duration,0,0,100,8).length,0);
 }
 assert.equal(cell({cloud:0,isDay:false}).state,'clear-night','Measured cloud 0 remains clear night');
 assert.equal(cell({cloud:false,isDay:false}).state,'unavailable','Boolean false night cloud is missing');
 assert.match(cell({cloud:0}).base?.title??'',/Wolkenlücken/,'0% cloud is a known clear sky');
 assert.match(cell({cloud:65}).base?.title??'',/Gesamtbewölkung.*65/);
 assert.match(cell({cloud:'65'}).base?.title??'',/65/,'Valid numeric provider strings remain accepted');
 assert.equal(cell({cloud:null,sunshineDuration:0}).state,'weather','Real 0 sunshine is known');
 assert.equal(cell({cloud:null,sunshineDuration:0}).base,null,'0 sunshine is not yellow');
 assert.match(cell({cloud:null,sunshineDuration:900}).base?.title??'',/Sonnenscheindauer/);
 assert.match(cell({cloud:20,sunshineDuration:false}).base?.title??'',/Wolkenlücken/);
 assert.match(cell({cloud:20,sunshineDuration:false}).base?.title??'',/Sonnenscheindauer nicht verfügbar/);
 const rain=cell({cloud:false,code:61,precipitation:1.25,rain:1.25});
 assert.equal(rain.base,null,'Invalid sky must not invent sunshine under rain');
 assert.ok(rain.precip,'Real precipitation must remain despite invalid sky');
 for(const [start,end] of [
  [Date.parse('2026-03-29T01:30:00+01:00'),Date.parse('2026-03-29T03:30:00+02:00')],
  [Date.parse('2026-10-25T02:30:00+02:00'),Date.parse('2026-10-25T02:30:00+01:00')]
 ]){
  const row=sample({epoch:start,precipitationIntervalStartEpoch:start,precipitationIntervalEndEpoch:end,cloud:false});
  assert.equal(detailSkyBarTimedSegments([row],start,end,0,0,100,8).length,0,'DST cannot invent sky state');
 }
 console.log('MID .354: boolean/array cloud and sunshine NoData; real 0, 15-minute slots, rain and DST remain correct.');
}finally{rmSync(temp,{recursive:true,force:true})}
