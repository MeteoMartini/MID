import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

/**
 * Historical, externally decoded Open-Meteo S3 pixel evidence.
 * This file DOES NOT fetch/raster-decode weather data or grant any
 * runtime field publication. GPL omfiles ran in isolated research ONLY.
 */
interface PixelSample {
 site:string; row:number; col:number;
 values:Record<string,number|null>;
}
interface Snapshot {
 model:'dwd_icon_d2'|'dwd_icon_eu';
 run:string;valid:string;file:string;
 absentFields:string[];
 grid:{rows:number;cols:number;latMin:number;lonMin:number;stepLat:number;stepLon:number;gridKind:string};
 samples:PixelSample[];
}
const evidence=JSON.parse(readFileSync(
 new URL('../fixtures/open-meteo-spatial-original-readback-20261109.json',import.meta.url),'utf8',
)) as {
 schema:string;status:string;licenseScope:string;gridCaveat:string;
 timeBasis:string;nullMeaning:string;
 snapshots:Snapshot[];
};
const find=(model:string,validHour:string,site:string):PixelSample=>{
 const snap=evidence.snapshots.find(s=>s.model===model&&s.valid.slice(11,13)===validHour);
 const cell=snap?.samples.find(x=>x.site===site);
 if(!cell)throw Error('historical evidence missing: '+model+','+validHour+','+site);
 return cell;
};

describe('Independent historical S3 OM pixel evidence — research only',()=>{
 it('pins model-run/valid UTC, immutable source paths and grid-provenance per sample',()=>{
  expect(evidence.schema).toBe('mid.spatial-s3.sparse-original-readback.v1');
  expect(evidence.status).toBe('research-evidence-only');
  expect(evidence.licenseScope).toContain('no GPL binary/source in MID');
  expect(evidence.gridCaveat).toContain('2026-11-30');
  expect(evidence.snapshots).toHaveLength(5);
  expect(new Set(evidence.snapshots.map(s=>s.file)).size).toBe(5);
  for(const s of evidence.snapshots){
   const run=new Date(s.run), valid=new Date(s.valid);
   expect(valid.valueOf()).toBeGreaterThanOrEqual(run.valueOf());
   const key=s.model+'/'+run.toISOString().slice(0,10).replaceAll('-','/')+'/'+
    run.toISOString().slice(11,13)+'00Z/'+valid.toISOString().slice(0,13).replace('T','T')+
    valid.toISOString().slice(14,16)+'.om';
   expect(s.file).toBe(key);
   expect(s.grid.gridKind).toContain('Open-Meteo regular-grid');
   for(const cell of s.samples){
    expect(cell.row).toBeGreaterThanOrEqual(0);
    expect(cell.col).toBeGreaterThanOrEqual(0);
    expect(cell.row).toBeLessThan(s.grid.rows);
    expect(cell.col).toBeLessThan(s.grid.cols);
    expect(s.grid.latMin+cell.row*s.grid.stepLat).toBeGreaterThanOrEqual(-90);
    expect(s.grid.latMin+cell.row*s.grid.stepLat).toBeLessThanOrEqual(90);
    expect(s.grid.lonMin+cell.col*s.grid.stepLon).toBeGreaterThanOrEqual(-180);
    expect(s.grid.lonMin+cell.col*s.grid.stepLon).toBeLessThanOrEqual(180);
    for(const [field,v] of Object.entries(cell.values)){
     expect(typeof field).toBe('string');
     expect(v===null||typeof v==='number'&&Number.isFinite(v)).toBe(true);
    }
   }
  }
 });

 it('first-step backward accumulations are ABSENT, not fake dry 0 mm',()=>{
  const backwards=['precipitation','rain','showers','snowfall_water_equivalent'];
  for(const model of ['dwd_icon_d2','dwd_icon_eu']){
   const first=evidence.snapshots.find(s=>s.model===model&&s.run===s.valid);
   expect(first?.absentFields).toEqual(backwards);
   for(const cell of first!.samples){
    for(const field of backwards)expect(Object.hasOwn(cell.values,field)).toBe(false);
   }
   const next=evidence.snapshots.find(s=>s.model===model&&s.run!==s.valid);
   expect(next).toBeDefined();
   expect(next!.absentFields).toEqual([]);
   expect(next!.samples.some(s=>s.values.precipitation===0)).toBe(true);
  }
 });

 it('keeps observed masked NaN distinct from real 0; mask is FIELD-specific',()=>{
  const outside=find('dwd_icon_d2','07','D2-NaN-domain-corner');
  for(const field of ['temperature_2m','precipitation','snowfall_height','cape']){
   expect(outside.values[field]).toBeNull();
  }
  const inside=find('dwd_icon_d2','07','D2-center');
  expect(inside.values.precipitation).toBe(0);
  expect(inside.values.cape).toBe(0);
  expect(inside.values.temperature_2m).toBe(3.95);

  const edge=find('dwd_icon_eu','07','EU-field-specific-NoData-and-unallocated-precip');
  expect(edge.values.snowfall_height).toBeNull();
  expect(edge.values.precipitation).toBe(0.7);
  expect(edge.values.rain).toBe(0);
  expect(edge.values.snowfall_water_equivalent).toBe(0);
  expect(edge.values.showers).toBe(0);
 });

 it('proves positive REAL rain cells and exposes incomplete phase decomposition',()=>{
  for(const [site,amount] of [
   ['Northern-Italy-rain',0.1],['Western-Mediterranean-rain',0.4],
  ] as const){
   const cell=find('dwd_icon_eu','07',site);
   expect(cell.values.precipitation).toBeCloseTo(amount,5);
   expect(cell.values.rain).toBeCloseTo(amount,5);
   expect(cell.values.showers).toBe(0);
   expect(cell.values.snowfall_water_equivalent).toBe(0);
  }
  // A valid total alongside zero selected component fields MUST NOT be
  // silently mapped to dry or to an invented precipitation phase.
  const phaseGap=find('dwd_icon_eu','07','EU-field-specific-NoData-and-unallocated-precip');
  const components=['rain','showers','snowfall_water_equivalent'].reduce((sum,f)=>sum+(phaseGap.values[f]??0),0);
  expect(phaseGap.values.precipitation).toBeGreaterThan(components);
  expect(phaseGap.values.snowfall_height).toBeNull();
 });

 it('retains negative original snowfall-height values without smoothing/clamping',()=>{
  const first=find('dwd_icon_eu','03','EU-subzero-initial');
  const at04=find('dwd_icon_eu','04','EU-subzero-following');
  const at07=find('dwd_icon_eu','07','EU-negative-snowline');
  expect([first.values.snowfall_height,at04.values.snowfall_height,at07.values.snowfall_height])
   .toEqual([-70,-70,-140]);
  expect(at07.values.precipitation).toBe(0);
  expect(at07.values.temperature_2m).toBe(-5.65);
  // Raw negative altitude is not automatically a valid displayed snowline
  // on a dry grid cell. Interpretation needs separate meteorological QA.
 });

 it('compares the SAME validity time but keeps different model runs separate',()=>{
  const d2=evidence.snapshots.find(s=>s.model==='dwd_icon_d2'&&s.valid.endsWith('07:00:00Z'))!;
  const eu=evidence.snapshots.find(s=>s.model==='dwd_icon_eu'&&s.valid.endsWith('07:00:00Z'))!;
  expect(d2.valid).toBe(eu.valid);
  expect(d2.run).not.toBe(eu.run);
  const d2Koeln=find(d2.model,'07','Koeln'),euKoeln=find(eu.model,'07','Koeln');
  expect(d2Koeln.values.temperature_2m).toBe(5.7);
  expect(euKoeln.values.temperature_2m).toBe(4.2);
  const d2Inn=find(d2.model,'07','Innsbruck'),euInn=find(eu.model,'07','Innsbruck');
  expect(d2Inn.values.freezing_level_height).toBe(2000);
  expect(euInn.values.freezing_level_height).toBe(2230);
  const coord=(s:Snapshot,c:PixelSample)=>[s.grid.latMin+c.row*s.grid.stepLat,s.grid.lonMin+c.col*s.grid.stepLon];
  for(const site of ['Koeln','Innsbruck']){
   const a=coord(d2,find(d2.model,'07',site)),b=coord(eu,find(eu.model,'07',site));
   expect(Math.abs(a[0]-b[0])).toBeLessThanOrEqual(0.0625);
   expect(Math.abs(a[1]-b[1])).toBeLessThanOrEqual(0.0625);
  }
 });

 it('never licenses or approves full model grids via sparse evidence',()=>{
  expect(evidence.status).toBe('research-evidence-only');
  expect(evidence.snapshots.every(s=>s.samples.length < s.grid.rows*s.grid.cols)).toBe(true);
  expect(evidence.nullMeaning).toContain('never zero');
  expect(evidence.timeBasis).toContain('first timestep is absent');
 });
});
