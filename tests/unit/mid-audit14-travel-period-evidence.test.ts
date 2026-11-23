import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {aggregateGefsUtcDays,consecutiveUtcWeek,ec46DailyApplicability} from '../../src/travelForecastPeriodEvidence';

const HOUR=3600000;
const first=Date.parse('2026-11-01T00:00:00Z');
const units={temperature_2m:'°C',precipitation:'mm'};
function fixture(n=49){
 return{
  time:Array.from({length:n},(_,i)=>new Date(first+i*HOUR).toISOString().slice(0,16)),
  temperature_2m:Array<number|null>(n).fill(9),
  precipitation:Array<number|null>(n).fill(0)
 };
}
function findDay(data:ReturnType<typeof fixture>,date='2026-11-01'){
 return aggregateGefsUtcDays(data,units).find(row=>row.date===date);
}
describe('MID Audit 1.4 · native GEFS daily coverage and full EC46 weeks',()=>{
 it('keeps a genuine 24-hour zero amount distinct from missing',()=>{
  const d=findDay(fixture());
  expect(d?.precipitation).toBe(0);expect(d?.precipitationComplete).toBe(true);
  expect(d?.precipitationHours).toBe(24);
 });
 it('attributes 00:00Z preceding-hour accumulation to the former date',()=>{
  const f=fixture();f.precipitation[24]=17;
  expect(findDay(f,'2026-11-01')?.precipitation).toBe(17);
  expect(findDay(f,'2026-11-02')?.precipitation).toBe(0);
 });
 it('rejects a 23h rain day rather than claiming 0mm',()=>{
  const d=findDay(fixture(48),'2026-11-02');
  expect(d?.precipitation).toBeNull();expect(d?.precipitationComplete).toBe(false);
 });
 it('retains temperature when one rain sample is null',()=>{
  const f=fixture();f.precipitation[20]=null;
  const d=findDay(f);
  expect(d?.precipitation).toBeNull();expect(d?.temperatureComplete).toBe(true);expect(d?.min).toBe(9);
 });
 it('retains valid rain when one temperature sample is missing',()=>{
  const f=fixture();f.temperature_2m[20]=null;
  const d=findDay(f);
  expect(d?.temperatureComplete).toBe(false);expect(d?.precipitation).toBe(0);
 });
 it('does not clip a high original amount and marks a source review',()=>{
  const f=fixture();f.precipitation[20]=450;
  const d=findDay(f);expect(d?.precipitation).toBe(450);expect(d?.precipitationExtreme).toBe(true);
 });
 it('rejects negative sentinel precipitation',()=>{
  const f=fixture();f.precipitation[20]=-999;expect(findDay(f)?.precipitation).toBeNull();
 });
 it('requires native precip unit mm independent of temperature unit',()=>{
  const d=aggregateGefsUtcDays(fixture(),{...units,precipitation:'inch'}).find(x=>x.date==='2026-11-01');
  expect(d?.precipitation).toBeNull();expect(d?.temperatureComplete).toBe(true);
 });
 it('does not claim complete temperature without native celsius units',()=>{
  const d=aggregateGefsUtcDays(fixture(),{precipitation:'mm'}).find(x=>x.date==='2026-11-01');
  expect(d?.temperatureComplete).toBe(false);expect(d?.precipitation).toBe(0);
 });
 it('fails closed if an upstream timezone offset differs from UTC',()=>expect(aggregateGefsUtcDays(fixture(),units,3600)).toEqual([]));
 it('fails closed on duplicate source timestamps',()=>{
  const f=fixture();f.time[18]=f.time[17];
  expect(aggregateGefsUtcDays(f,units)).toEqual([]);
 });
 it('fails closed on out-of-order source timestamps',()=>{
  const f=fixture();[f.time[17],f.time[18]]=[f.time[18],f.time[17]];
  expect(aggregateGefsUtcDays(f,units)).toEqual([]);
 });
 it('fails closed on non-existent Gregorian calendar dates',()=>{
  const f=fixture();f.time[20]='2026-02-30T20:00';
  expect(aggregateGefsUtcDays(f,units)).toEqual([]);
 });
 it('fails closed when source arrays have differing lengths',()=>{
  const f=fixture();f.precipitation.pop();
  expect(aggregateGefsUtcDays(f,units)).toEqual([]);
 });
 it('accepts seven authentic consecutive UTC calendar dates over New Year',()=>{
  const days=Array.from({length:7},(_,i)=>new Date(Date.parse('2026-12-29T00:00:00Z')+i*24*HOUR).toISOString().slice(0,10));
  expect(consecutiveUtcWeek(days)).toBe(true);
 });
 it('rejects a six-day partial source window',()=>{
  const days=Array.from({length:6},(_,i)=>new Date(first+i*24*HOUR).toISOString().slice(0,10));
  expect(consecutiveUtcWeek(days)).toBe(false);
 });
 it('rejects calendar gaps and duplicates',()=>expect(consecutiveUtcWeek(['2026-11-01','2026-11-02','2026-11-03','2026-11-03','2026-11-05','2026-11-06','2026-11-07'])).toBe(false));
 it('wires the new native validator and forbids old window-scaled wet probabilities',()=>{
  const source=readFileSync(new URL('../../src/travelForecastFusion.ts',import.meta.url),'utf8');
  expect(source).toContain('aggregateGefsUtcDays(payload.hourly,payload.hourly_units,payload.utc_offset_seconds??0)');
  expect(source).toContain('consecutiveUtcWeek(dates)');
  expect(source).toContain('const lead=mean(dates.map(date=>daysBetween(today,date)))');
  expect(source).not.toContain('scalePositiveRows(');
  expect(source).not.toContain('probabilityFactor=base');
  expect(source).toContain('if(maxFamilies>1){sourceLabels.add');
 });
 it('counts real zero anomaly as native evidence without turning null into zero',()=>{
  const day={meanMean:5,maxMean:10,minMean:1,maxP25:8,maxP75:12,minP25:0,minP75:3,cloudMean:65};
  expect(ec46DailyApplicability({tempMeanAnomaly:0},day).temperature).toBe(true);
  expect(ec46DailyApplicability({tempMeanAnomaly:null},day).temperature).toBe(false);
  expect(ec46DailyApplicability({tempMeanAnomaly:'0'},day).temperature).toBe(false);
  expect(ec46DailyApplicability({},day)).toEqual({temperature:false,wind:false,cloud:false,snowDepth:false});
 });
 it('never maps the native EC46 six-hour Tmax/Tmin anomaly to daily extrema',()=>{
  const source=readFileSync(new URL('../../src/travelForecastFusion.ts',import.meta.url),'utf8');
  expect(source).not.toContain('maxDelta=week.tempMaxAnomaly');
  expect(source).not.toContain('minDelta=week.tempMinAnomaly');
  expect(source).toContain("day.forecastSource='EC46-Wochenanomalie + ERA5-Tagesklima'");
 });
 it('does not count wind-only week unless a real mean-wind climate base exists',()=>{
  expect(ec46DailyApplicability({windAnomalyKn:3},{maxMean:10,meanMean:5}).wind).toBe(false);
  expect(ec46DailyApplicability({windAnomalyKn:3},{windMean:0}).wind).toBe(true);
 });
 it('cannot convert monthly precipitation percentage to a daily rain probability',()=>{
  const source=readFileSync(new URL('../../src/travelForecastFusion.ts',import.meta.url),'utf8');
  expect(source).not.toContain('day.wetProbability*Math.sqrt(factor)');
  expect(source).not.toContain('day.precipitationMean*factor');
  expect(source).toContain('if(signalRow.temperatureAnomaly===undefined)continue;');
 });
 it('does not label a season-only rain amount as a daily model day',()=>{
  const source=readFileSync(new URL('../../src/travelForecastFusion.ts',import.meta.url),'utf8');
  expect(source).toContain("const day={...base}");
  expect(source).toContain("day.forecastSource='Saisonales Monatsmittel + ERA5-Tagesklima'");
 });
 it('honors field-level original provenance and never counts a phantom EC46 week',()=>{
  const source=readFileSync(new URL('../../src/travelForecastFusion.ts',import.meta.url),'utf8');
  expect(source).toContain('ec46DailyApplicability(week,base)');
  expect(source).toContain('if(!eligibility.temperature&&!eligibility.wind&&!eligibility.cloud&&!eligibility.snowDepth)continue;');
  expect(source).toContain('return{covered:applied,shareTotal:share*applied');
 });
 it('labels every long-range travel card as climatological context, not daily weather',()=>{
  const panel=readFileSync(new URL('../../src/TravelPlannerPanel.tsx',import.meta.url),'utf8');
  expect(panel).toContain("const longRange=daysBetween(localToday(),point.date)>=14");
  expect(panel).toContain("point.forecastSource?'Trend + Klima':'Nur Klima'");
  expect(panel).toContain('<CalendarRange size={18}');
 });

});
