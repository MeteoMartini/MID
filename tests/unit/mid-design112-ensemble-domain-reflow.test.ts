/**
 * MID Design112: per-parameter display domains, no phantom zero, no range smoothing.
 * This is layout-scale QA, not a verification of meteorological skill.
 */
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import type {EnsembleDay} from '../../src/weather';
import {adaptiveForecastRanges,forecastRangeScaleDomains,ForecastRangeGuide,ForecastRangeLegend} from '../../src/ForecastRangeGuide';

const day=(override:Record<string,unknown>={}):EnsembleDay=>({
 date:'2026-11-17',modelCount:2,memberCount:12,
 maxLow:8,maxQ25:10,maxQ75:15,maxHigh:19,maxMedian:13,
 minLow:-28,minQ25:-24,minQ75:-18,minHigh:-13,minMedian:-21,
 precipitationLow:0,precipitationQ25:.02,precipitationQ75:.07,precipitationHigh:.3,precipitationMedian:.05,
 windLow:.8,windQ25:1.2,windQ75:2.4,windHigh:5,windMedian:1.8,
 gustLow:1.2,gustQ25:2.5,gustQ75:4.8,gustHigh:8,gustMedian:3.6,
 ...override
} as unknown as EnsembleDay);
const wet=day({
 maxLow:27,maxQ25:32,maxQ75:39,maxHigh:44,maxMedian:36,
 minLow:18,minQ25:21,minQ75:26,minHigh:30,minMedian:24,
 precipitationLow:8,precipitationQ25:29.4,precipitationQ75:82.7,precipitationHigh:130,precipitationMedian:48,
 windLow:30,windQ25:42,windQ75:85,windHigh:120,windMedian:65,
 gustLow:45,gustQ25:70,gustQ75:170,gustHigh:240,gustMedian:115
});
const source=readFileSync(fileURLToPath(new URL('../../src/ForecastRangeGuide.tsx',import.meta.url)),'utf8');
const css=readFileSync(fileURLToPath(new URL('../../src/radarForecastReadability.css',import.meta.url)),'utf8');

describe('MID Design112 ensemble range scale and responsive model legend',()=>{
 it('shares Tmin and Tmax full-data extrema without blending or artificial clipping',()=>{
  const scales=forecastRangeScaleDomains([day(),wet]);
  expect(scales.get('temperature-pair')).toEqual({low:-28,high:44});
  expect(scales.get('rain')).toEqual({low:0,high:130});
  expect(scales.get('wind')).toEqual({low:.8,high:120});
  expect(scales.get('gust')).toEqual({low:1.2,high:240});
  expect(scales.has('minimum')).toBe(false);
  expect(scales.has('temperature')).toBe(false);
 });
 it('keeps genuine 0 mm but never treats missing or invalid rain/gust as a zero sample',()=>{
  const invalid=day({precipitationQ25:undefined,precipitationQ75:undefined,gustLow:NaN,gustHigh:NaN});
  const positive=day({precipitationLow:18,precipitationQ25:20,precipitationQ75:22,precipitationHigh:24,gustLow:45,gustQ25:50,gustQ75:55,gustHigh:60});
  const scales=forecastRangeScaleDomains([invalid,positive]);
  expect(scales.get('rain')).toEqual({low:18,high:24});
  expect(scales.get('gust')).toEqual({low:45,high:60});
  expect(forecastRangeScaleDomains([invalid]).has('rain')).toBe(false);
  expect(forecastRangeScaleDomains([invalid]).has('gust')).toBe(false);
  expect(forecastRangeScaleDomains([]).size).toBe(0);
 });
 it('excludes unsupported member sets and impossible/unsorted quantile bands',()=>{
  const unsupported=day({modelCount:1,memberCount:1});
  const wrong=day({precipitationQ25:99,precipitationHigh:3});
  expect(forecastRangeScaleDomains([unsupported]).size).toBe(0);
  expect(forecastRangeScaleDomains([wrong]).has('rain')).toBe(false);
 });
 it('preserves the original reference-array extrema exactly for all supported parameters',()=>{
  const days=[day(),wet,day({maxLow:NaN,precipitationQ25:undefined,gustHigh:NaN}),day({minLow:-45,minQ25:-30,minQ75:-20,minHigh:-10})];
  const ref=days.flatMap(adaptiveForecastRanges),scales=forecastRangeScaleDomains(days);
  for(const range of ref){
   const peers=range.unit==='°C'?ref.filter(item=>item.unit==='°C'):ref.filter(item=>item.key===range.key);
   const expected={low:Math.min(...peers.map(item=>item.low)),high:Math.max(...peers.map(item=>item.high))};
   expect(scales.get(range.unit==='°C'?'temperature-pair':range.key)).toEqual(expected);
  }
  expect(scales.get('temperature-pair')).toEqual({low:-45,high:44});
  expect(scales.get('rain')?.high).toBe(130);
 });
 it('recalculates from current values without a cross-render mutable cache and preserves the original accessible ranges',()=>{
  const days=[day(),wet];
  const scales=forecastRangeScaleDomains(days);
  days[0]=day({minLow:-60,minQ25:-50,minQ75:-40,minHigh:-30});
  expect(scales.get('temperature-pair')?.low).toBe(-28);
  expect(forecastRangeScaleDomains(days).get('temperature-pair')?.low).toBe(-60);
  const html=renderToStaticMarkup(createElement(ForecastRangeGuide,{day:wet,days,temperature:0,compact:true,unit:'kn'}));
  expect(html).toContain('data-temperature-pair="shared-scale"');
  expect(html).toContain('P10–P90');
  expect(html).toContain('Median');
  expect(html).not.toContain('parameter-wind');
  expect(source).toContain("adaptiveForecastRanges(day).filter(r=>r.key!=='wind')");
  expect(source).not.toContain('days.flatMap(adaptiveForecastRanges)');
 });
 it('keeps the native disclosure and informative legend, but scales text and touch height',()=>{
  const html=renderToStaticMarkup(createElement(ForecastRangeLegend));
  expect(html).toContain('<details class="forecast-range-legend">');
  expect(html).toContain('<summary>Modellspanne ⓘ</summary>');
  expect(html).toContain('Modellübereinstimmung ist keine Trefferwahrscheinlichkeit');
  expect(css).toContain('.forecast-range-legend{padding:10px 12px;margin:8px 0;border:1px solid var(--border);border-radius:10px;font-size:.75rem;');
  expect(css).toContain('.forecast-range-legend>summary{min-height:44px;padding-block:10px;');
  expect(css).not.toContain('.forecast-range-legend>summary{min-height:24px;');
  expect(css).toContain('touch-action:manipulation');
  expect(css).toContain('.forecast-range-legend>summary:focus-visible{outline:3px solid var(--primary);outline-offset:2px}');
 });
 it('is order-independent and never clips isolated extreme members during domain construction',()=>{
  const extreme=day({maxLow:90,maxQ25:95,maxQ75:103,maxHigh:114,minLow:-95,minQ25:-92,minQ75:-90,minHigh:-87,
   gustLow:200,gustQ25:215,gustQ75:260,gustHigh:310,precipitationLow:1,precipitationQ25:4,precipitationQ75:50,precipitationHigh:600});
  const inputs=[day(),wet,extreme];
  const original=forecastRangeScaleDomains(inputs);
  const reordered=forecastRangeScaleDomains([extreme,day(),wet]);
  expect([...reordered]).toEqual([...original]);
  expect(original.get('temperature-pair')).toEqual({low:-95,high:114});
  expect(original.get('rain')).toEqual({low:0,high:600});
  expect(original.get('gust')).toEqual({low:1.2,high:310});
  expect(forecastRangeScaleDomains(inputs.slice(0,2)).get('rain')?.high).toBe(130);
 });
});
