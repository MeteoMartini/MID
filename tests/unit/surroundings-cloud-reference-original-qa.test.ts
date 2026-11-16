import {readFileSync} from 'node:fs';
import {describe,expect,it} from 'vitest';
import {chooseSurroundingsCloudReferences,admissibleSurroundingsCloudTime} from '../../src/currentSurroundingsCloudImage';
import {matchesSurroundingsCloudReference,MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS} from '../../src/surroundingsCloudOriginalGuard';
import type {SynopticModel,SynopticFrame} from '../../src/nativeSynopticFields';

const run='2026-11-16T08:00:00Z';
const target=Date.parse('2026-11-16T12:15:00Z');
const time=(hour:number)=>new Date(Date.parse(run)+hour*3600000).toISOString();
const frame=(hour:number):SynopticFrame=>({
 hour,time:time(hour),file:'fixture-'+hour+'.bin',sha256:'a'.repeat(64),
 bytes:128,decodedBytes:300,encoding:'gzip-json'
});
const model=(hours:number[],label='DWD ICON-D2'):SynopticModel=>({
 label,run,resolutionKm:2.2,license:'CC BY 4.0',frames:[],
 cloudWeatherFrames:hours.map(frame)
});

describe('MID Umfeld Wolken/SigWx: honest earlier original reference only',()=>{
 it('explains the user-visible empty-frame bug without fabricating a 15-minute source',()=>{
  const models={'icon-d2':model([3,4,5])};
  expect(admissibleSurroundingsCloudTime(time(4),run,target)).toBe(true);
  const preview=chooseSurroundingsCloudReferences(models,target);
  expect(preview).toHaveLength(1);
  expect(preview[0].ref.time).toBe(time(4)); // actual 12:00 original
  expect(Date.parse(preview[0].ref.time)).not.toBe(target);
  const source=readFileSync('src/currentSurroundingsCloudImage.ts','utf8');
  expect(source).toContain('if(Date.parse(ref.time)!==now)continue;');
  expect(source).toContain('Date.parse(ref.time)===now&&weatherRefs.some(');
  expect(source).toContain('loadSurroundingsCloudReference(');
  expect(source).not.toContain('interpolateVerifiedSurroundingsCloud(earlier,later,target)');
 });
 it('never selects a future original as a current reference',()=>{
  expect(chooseSurroundingsCloudReferences({'icon-d2':model([5])},target)).toHaveLength(0);
  expect(chooseSurroundingsCloudReferences({'icon-d2':model([4,5])},target)[0].ref.time).toBe(time(4));
 });
 it('keeps an original at exactly 45 minutes, rejects older-than-45 and stale model runs',()=>{
  const t=Date.parse('2026-11-16T12:45:00Z');
  expect(MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS).toBe(45*60_000);
  expect(chooseSurroundingsCloudReferences({'icon-d2':model([4])},t)).toHaveLength(1);
  expect(chooseSurroundingsCloudReferences({'icon-d2':model([4])},t+60000)).toHaveLength(0);
  const stale={...model([4]),run:'2026-11-15T08:00:00Z'};
  expect(chooseSurroundingsCloudReferences({'icon-d2':stale},t)).toHaveLength(0);
 });
 it('preserves documented model priority for truly same-time originals',()=>{
  const models={'icon-d2':model([4]),'icon-eu':model([4],'DWD ICON-EU')};
  const entries=chooseSurroundingsCloudReferences(models,target);
  expect(entries.map(entry=>entry.modelId)).toEqual(['icon-d2','icon-eu']);
  expect(entries.every(entry=>entry.ref.time===time(4))).toBe(true);
 });
 it('never confuses an exact model target with an earlier-reference frame',()=>{
  expect(chooseSurroundingsCloudReferences({'icon-d2':model([4])},Date.parse(time(4)))).toHaveLength(0);
 });
 it('binds earlier model evidence to both a particular target and exact coordinate pair',()=>{
  const sample={validTime:time(4),requestTargetTime:new Date(target).toISOString(),
   requestLatitude:50.82,requestLongitude:7.14};
  expect(matchesSurroundingsCloudReference(sample,50.82,7.14,target)).toBe(true);
  expect(matchesSurroundingsCloudReference(sample,50.82,7.14,target+900000)).toBe(false);
  expect(matchesSurroundingsCloudReference(sample,50.83,7.14,target)).toBe(false);
  expect(matchesSurroundingsCloudReference(sample,50.82,7.15,target)).toBe(false);
  expect(matchesSurroundingsCloudReference({...sample,requestTargetTime:undefined},50.82,7.14,target)).toBe(false);
  expect(matchesSurroundingsCloudReference({...sample,validTime:time(5)},50.82,7.14,target)).toBe(false);
  expect(matchesSurroundingsCloudReference({...sample,validTime:'NaN'},50.82,7.14,target)).toBe(false);
  expect(matchesSurroundingsCloudReference(sample,50.82,7.14,NaN)).toBe(false);
 });
 it('does not show an old reference from a previous day as a missing new target',()=>{
  const t=Date.parse('2026-10-25T01:15:00Z');
  const image={validTime:'2026-10-25T01:00:00Z',
   requestTargetTime:'2026-10-25T01:15:00Z',requestLatitude:47,requestLongitude:9};
  expect(matchesSurroundingsCloudReference(image,47,9,t)).toBe(true);
  expect(matchesSurroundingsCloudReference(image,47,9,t+24*3600000)).toBe(false);
 });
 it('keeps the original-target NoData, with a separate visibly labelled non-target reference',()=>{
  const ui=readFileSync('src/CurrentSurroundings.tsx','utf8');
  expect(ui).toContain('id="surroundings-model-cloud-weather"');
  expect(ui).toContain('id="surroundings-original-reference-cloud-weather"');
  expect(ui).toContain("mode==='cloud'&&!cloudForecast.image&&cloudForecast.reference");
  expect(ui).toContain('Das Referenzbild gilt ausdrücklich NICHT für den gewählten 15-Minuten-Termin.');
  expect(ui).toContain('Keine zeitliche Interpolation');
  expect(ui).toContain('kein bestätigtes Original');
  expect(ui).toContain("mode==='cloud'?cloudTarget:mode==='radar'?displayTime:undefined");
 });
});