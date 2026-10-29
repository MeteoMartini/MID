import {describe,it,expect} from 'vitest';
import {summarizeDwdWarnings,summarizeDwdWarningsForDay,type DwdWarningSample} from '../../src/dwdWarnings';

const start=Date.parse('2026-10-29T19:00:00Z'),hour=3600000;
function series(snowIndex:number,amount=1):DwdWarningSample[]{return Array.from({length:168},(_,i)=>({epoch:start+i*hour,time:new Date(start+i*hour).toISOString(),temperature:4,apparent:4,gust:1,precipitation:0,rain:0,showers:0,snowfall:i===snowIndex?amount:0}))}
const snow=(rows:DwdWarningSample[])=>summarizeDwdWarnings(rows,1400).filter(x=>x.kind==='snow');
describe('snow exposure versus accumulation qualification',()=>{
 it('does not mark dry first24h for snow at +60h',()=>{const signals=snow(series(60));expect(signals.length).toBeGreaterThan(0);for(const s of signals){expect(Date.parse(s.validFrom!)).toBe(start+60*hour);expect(Date.parse(s.validTo!)).toBe(start+61*hour);expect(s.value).toBe(1)}});
 it('retains real snow in the first24h',()=>{const signals=snow(series(4));expect(signals.length).toBeGreaterThan(0);expect(signals[0].validFrom).toBe(new Date(start+4*hour).toISOString())});
 it('respects explicit preceding accumulation intervals',()=>{const rows=series(60);rows[60].precipitationIntervalStartEpoch=start+59*hour;rows[60].precipitationIntervalEndEpoch=start+60*hour;expect(snow(rows)[0].validFrom).toBe(new Date(start+59*hour).toISOString());expect(snow(rows)[0].validTo).toBe(new Date(start+60*hour).toISOString())});
 it('does not lose high snow stages or their amounts',()=>{const signals=snow(series(60,35));expect(signals.some(s=>s.level>=3&&s.value===35)).toBe(true);expect(signals.every(s=>Date.parse(s.validFrom!)===start+60*hour)).toBe(true)});
 it('does not assign future snow to a dry calendar day',()=>{expect(summarizeDwdWarningsForDay(series(60),'2026-10-29',1400).filter(s=>s.kind==='snow')).toEqual([])});
 it('keeps a snow-bearing calendar day',()=>{expect(summarizeDwdWarningsForDay(series(60),'2026-11-01',1400).some(s=>s.kind==='snow')).toBe(true)});
 it('does not invent snow for a dry series',()=>{expect(snow(series(-1))).toEqual([])});
});
