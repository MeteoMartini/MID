import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {iconEuQaExpectedPrecipHours,iconEuSeasonalQaCapability} from '../../src/iconEuSeasonalQaCapability';

// Strictly synthetic adversarial report fixtures. Original authenticated GRIB
// SHA/field evidence is independently retained in GitHub run #42962610933.
const run='2026111100';
const hash=(c:string)=>c.repeat(64);
const z=(l:number)=>new Date(Date.UTC(2026,10,11)+l*3600000).toISOString().replace('.000Z','Z');
const entry=(lead:number,gustStart?:number)=>{
 const hours=iconEuQaExpectedPrecipHours(lead),gustHours=lead-(gustStart??lead-hours),aligned=gustHours===hours;
 const file=(endStep:number,startStep:number,stepType:string,units:string,s:string)=>({
  startStep,endStep,stepType,units,sha256:hash(s)
 });
 return {
  lead,validTimeUTC:z(lead),gridSha256:hash('f'),
  totalCells:904689,intervalHours:hours,precipitationIntervalHours:hours,gustIntervalHours:gustHours,
  validWinter:904689,validSummer:aligned?904689:0,
  winterPairStatus:'grib-pair-qualified',
  summerPairStatus:aligned?'grib-pair-qualified':'blocked-gust-interval',
  minPrecipitationMm:0,maxPrecipitationMm:hours===3?26.75:12,
  files:{
   ['tot_prec:'+(lead-hours)]:file(lead-hours,0,'accum','kg m**-2','a'),
   ['tot_prec:'+lead]:file(lead,0,'accum','kg m**-2','b'),
   ['t_2m:'+lead]:file(lead,lead,'instant','K','c'),
   ['vmax_10m:'+lead]:file(lead,lead-gustHours,'max','m s**-1','d'),
  },
 };
};
const evidence=()=>({
 schema:'mid.icon-eu.seasonal.original-qa.v1',source:'DWD ICON-EU GRIB2 originals',
 releaseApproved:false,run,entries:[entry(81,80),entry(1),entry(78)],
});
const mutate=(change:(r:ReturnType<typeof evidence>)=>void)=>{
 const obj=evidence();change(obj);return obj;
};
const files=(e:ReturnType<typeof entry>)=>e.files as Record<string,ReturnType<typeof entry>['files'][string]>;
describe('ICON-EU independent original-GRIB QA capability (non-renderable)',()=>{
 it('preserves physically distinct 1h and 3h time windows, never invents summer 3h gust',()=>{
  const a=iconEuSeasonalQaCapability(evidence());
  expect(a.modelId).toBe('icon-eu');
  expect(a.runUTC).toBe('2026-11-11T00:00:00Z');
  expect(a.frames.map(f=>f.leadHours)).toEqual([1,78,81]);
  expect(a.frames.map(f=>f.precipitationIntervalHours)).toEqual([1,1,3]);
  expect(a.frames.map(f=>f.summer.candidate)).toEqual([true,true,false]);
  expect(a.frames.map(f=>f.summer.validCells)).toEqual([904689,904689,0]);
  expect(a.frames[2].gustIntervalHours).toBe(1);
  expect(a.frames[2].summer.reason).toBe('gust-period-mismatch');
  expect(a.frames[2].winter.validCells).toBe(904689);
  expect(a.frames[2].winter.label).toContain('letzte 3 h');
  expect(a.renderable).toBe(false);
  expect(a.productionApproved).toBe(false);
  expect(a.releaseApproved).toBe(false);
  expect(a.frames.every(f=>f.renderable===false&&f.productionApproved===false)).toBe(true);
 });
 it('accepts an authentic-looking verified 3h gust only when the GRIB step itself says 78..81',()=>{
  const e=evidence();e.entries[0]=entry(81,78);
  expect(iconEuSeasonalQaCapability(e).frames[2].summer.candidate).toBe(true);
  expect(iconEuSeasonalQaCapability(e).frames[2].summer.validCells).toBe(904689);
 });
 it('will never manufacture unpublished +79h, +80h, +82h or +83h source frames',()=>{
  for(const lead of [0,79,80,82,83,121,-1]){
   expect(()=>iconEuQaExpectedPrecipHours(lead)).toThrow();
  }
  expect(iconEuQaExpectedPrecipHours(78)).toBe(1);
  expect(iconEuQaExpectedPrecipHours(81)).toBe(3);
  expect(iconEuQaExpectedPrecipHours(120)).toBe(3);
 });
 it('rejects forged reports attempting to grant product release, change model or schema',()=>{
  for(const v of [null,{},[],{...evidence(),releaseApproved:true},
   {...evidence(),source:'WXCharts'},{...evidence(),schema:'mid.icon-d2.fields.v1'},
   {...evidence(),run:'2026023100'},{...evidence(),run:'2026111125'}]){
   expect(()=>iconEuSeasonalQaCapability(v)).toThrow();
  }
 });
 it('rejects duplicated leads, missing original files, false total and wrong UTC validity',()=>{
  const bad=[
   mutate(x=>x.entries.push(entry(81,80))),
   mutate(x=>{x.entries[0].validTimeUTC=z(80)}),
   mutate(x=>{delete files(x.entries[0])['tot_prec:78']}),
   mutate(x=>{x.entries[0].intervalHours=1 as never}),
   mutate(x=>{x.entries[0].precipitationIntervalHours=1 as never}),
  ];
  bad.forEach(x=>expect(()=>iconEuSeasonalQaCapability(x)).toThrow());
 });
 it('checks original GRIB units, statistical start/end, DWD SHA hashes and grids',()=>{
  const bad=[
   mutate(x=>{files(x.entries[0])['vmax_10m:81'].startStep=78}),
   mutate(x=>{files(x.entries[0])['tot_prec:78'].startStep=77}),
   mutate(x=>{files(x.entries[0])['t_2m:81'].units='°C'}),
   mutate(x=>{files(x.entries[0])['vmax_10m:81'].units='knots'}),
   mutate(x=>{files(x.entries[0])['tot_prec:81'].sha256='missing'}),
   mutate(x=>{x.entries[0].gridSha256=hash('e')}),
  ];
  bad.forEach(x=>expect(()=>iconEuSeasonalQaCapability(x)).toThrow());
 });
 it('does not mask missing precipitation/temperature/gust as real zero or approve invalid counts',()=>{
  const bad=[
   mutate(x=>{x.entries[0].validWinter=0}),
   mutate(x=>{x.entries[0].validSummer=1}),
   mutate(x=>{x.entries[0].summerPairStatus='grib-pair-qualified'}),
   mutate(x=>{x.entries[0].maxPrecipitationMm=Number.POSITIVE_INFINITY}),
   mutate(x=>{x.entries[0].minPrecipitationMm=-0.1}),
   mutate(x=>{x.entries[0].totalCells=1}),
  ];
  bad.forEach(x=>expect(()=>iconEuSeasonalQaCapability(x)).toThrow());
 });
 it('rejects missing or inconsistent verified per-lead grid SHA rather than assuming equal size is sufficient',()=>{
  expect(()=>iconEuSeasonalQaCapability(mutate(x=>{x.entries[2].gridSha256=''}))).toThrow();
  expect(()=>iconEuSeasonalQaCapability(mutate(x=>{x.entries[2].gridSha256=hash('c')}))).toThrow();
 });
 it('accepts actual DWD source hashes/grid from authenticated CI artifact only as non-publishable preview',()=>{
  const path=fileURLToPath(new URL('../fixtures/mid-icon-eu-original-grib-readback-2026111100.json',import.meta.url));
  const raw=JSON.parse(readFileSync(path,'utf8'));
  const matrix=iconEuSeasonalQaCapability(raw);
  expect(matrix.frames).toHaveLength(3);
  expect(matrix.frames.map(x=>x.validTimeUTC)).toEqual([
   '2026-11-11T01:00:00Z','2026-11-14T06:00:00Z','2026-11-14T09:00:00Z',
  ]);
  expect(new Set(matrix.frames.map(x=>x.gridSha256))).toEqual(new Set([
   '47ec431f6ca26fea659270ae395b438ee7bf9fe1b1bbb1d35a3fcec7a5fd614e',
  ]));
  expect(matrix.frames[2].sourceFileSha256['tot_prec:78']).toBe(matrix.frames[1].sourceFileSha256['tot_prec:78']);
  expect(matrix.frames[2].winter.label).toContain('3 h');
  expect(matrix.frames[2].summer.reason).toBe('gust-period-mismatch');
  expect(matrix.frames[2].summer.candidate).toBe(false);
  expect(matrix.renderable).toBe(false);
  expect(matrix.productionApproved).toBe(false);
  expect(matrix.releaseApproved).toBe(false);
 });
 it('rejects original 1h gust at +81 relabelled as an invented 3h product',()=>{
  const path=fileURLToPath(new URL('../fixtures/mid-icon-eu-original-grib-readback-2026111100.json',import.meta.url));
  const raw=JSON.parse(readFileSync(path,'utf8'));
  raw.entries[2].gustIntervalHours=3;
  raw.entries[2].summerPairStatus='grib-pair-qualified';
  raw.entries[2].validSummer=904689;
  expect(()=>iconEuSeasonalQaCapability(raw)).toThrow('GRIB field/statistics mismatch');
 });

});
