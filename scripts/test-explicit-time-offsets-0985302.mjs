import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

const directory=mkdtempSync(join(tmpdir(),'mid-explicit-time-302-'));
try{
 await build({stdin:{contents:"export{localIsoEpoch}from'./src/weather';export{localIsoToEpoch,formatLocalIsoDisplayTime}from'./src/timeDisplay';",resolveDir:process.cwd()},bundle:true,platform:'node',format:'esm',outfile:join(directory,'test.mjs'),loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});
 const {localIsoEpoch,localIsoToEpoch,formatLocalIsoDisplayTime}=await import(pathToFileURL(join(directory,'test.mjs')));
 const cases=[
  ['2026-10-25T02:30:00+02:00','2026-10-25T00:30:00Z'],
  ['2026-10-25T02:30:00+01:00','2026-10-25T01:30:00Z'],
  ['2026-03-29T02:30:00+01:00','2026-03-29T01:30:00Z'],
  ['2026-10-25T02:30Z','2026-10-25T02:30:00Z'],
  ['2026-10-25T02:30:00.125Z','2026-10-25T02:30:00.125Z'],
  ['2026-10-25T02:30:00-03:30','2026-10-25T06:00:00Z'],
  ['2026-10-25T02:30+0545','2026-10-24T20:45:00Z'],
  ['2026-10-25T02:30:00+00:00','2026-10-25T02:30:00Z'],
 ];
 for(const [input,expected] of cases)for(const zone of ['Europe/Berlin','UTC','Asia/Kathmandu','invalid-zone']){
  assert.equal(localIsoEpoch(input,zone,7200),Date.parse(expected),`weather parser must respect explicit instant ${input} in ${zone}`);
  assert.equal(localIsoToEpoch(input,zone),Date.parse(expected),`display parser must respect explicit instant ${input} in ${zone}`);
 }
 for(const parse of [localIsoEpoch,localIsoToEpoch]){
  assert.equal(parse('2026-10-25T02:30:00+01:00','Europe/Berlin')-parse('2026-10-25T02:30:00+02:00','Europe/Berlin'),3600000,'autumn repeated local hour must retain two distinct instants');
  for(const invalid of ['2026-10-25T02:30+25:00','2026-10-25T02:30+02:99','2026-10-25T02:30Zgarbage','2026-10-25T02:30+02:00junk'])assert.ok(Number.isNaN(parse(invalid,'Europe/Berlin')),`invalid explicit offset must not silently become local time: ${invalid}`);
  assert.equal(parse('2026-01-15T12:00','Europe/Berlin'),Date.parse('2026-01-15T11:00Z'),'offsetless winter local time unchanged');
  assert.equal(parse('2026-07-15T12:00','Europe/Berlin'),Date.parse('2026-07-15T10:00Z'),'offsetless summer local time unchanged');
 }
 assert.equal(localIsoEpoch('2026-10-26T12:00',undefined,7200),Date.parse('2026-10-26T10:00Z'),'explicit fixed-offset-only caller unchanged');
 assert.equal(localIsoEpoch('2026-10-26T12:00','Europe/Berlin',7200),Date.parse('2026-10-26T11:00Z'),'IANA seed semantics unchanged; raw Open-Meteo adapter migration remains separate');
 globalThis.localStorage={getItem:key=>key==='mid:time-display-mode:v1'?'zulu':null};
 assert.equal(formatLocalIsoDisplayTime('2026-10-25T02:30:00+02:00','Europe/Berlin'),'00:30','Zulu display uses the explicit instant');
 globalThis.localStorage={getItem:()=>null};
 assert.equal(formatLocalIsoDisplayTime('2026-10-25T02:30:00+01:00','Europe/Berlin'),'02:30','local display retains the correct repeated wall clock');
 console.log('MID .302: explicit UTC/offset instants, autumn fold, spring gap, milliseconds, fractional offsets, malformed offsets, unchanged offsetless IANA and fixed-offset semantics.');
}finally{rmSync(directory,{recursive:true,force:true})}
