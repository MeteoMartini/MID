import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {FourteenDayDevelopment} from '../../src/FourteenDayDevelopment';
import type {DayAssessment} from '../../src/ensembleAssessment';

const assessment:DayAssessment={
 date:'2026-11-02',agreement:'medium',confidenceScore:58,
 dataQuality:'limited',parameters:[],limiting:[],complete:false,
 leadHours:24,leadFactor:1,calibrationApplied:false,calibrationSampleDays:0
};
const row={
 date:'2026-11-02',meanDayTemperature:8,regimeText:'Wechselhaft',
 weatherLabel:'Wechselhaft',bestMax:12,bestMin:4,
 maxLow:10,maxHigh:15,maxQ25:11,maxQ75:13,
 minLow:2,minHigh:7,minQ25:3,minQ75:5,
 bestPrecipitation:0,bestPrecipitationProbability:10,
 bestWind:10,bestGust:19,precipitationLow:0,
 precipitationHigh:4,windLow:8,windHigh:13,gustLow:15,gustHigh:23,
 ensembleAvailable:true,assessment
};
describe('MID Design-WE live React render of the 14-day default',()=>{
 it('renders A as accessible default, without fabricating missing data',()=>{
  const html=renderToStaticMarkup(createElement(FourteenDayDevelopment,{series:[row],unit:'kn'}));
  expect(html).toContain('data-mid-fourteen-view="compact"');
  expect(html).toContain('aria-label="Darstellung des 14-Tage-Wetters wählen"');
  expect(html).toContain('aria-pressed="true"');
  expect(html).toContain('Wetterphasen');
  expect(html).toContain('Tmax');
  expect(html).not.toContain('mid-we-fourteen-table-scroll');
 });
 it('preserves a missing best-match temperature as a missing signal',()=>{
  const incomplete={...row,bestMax:Number.NaN,bestMin:Number.NaN,ensembleAvailable:false};
  const html=renderToStaticMarkup(createElement(FourteenDayDevelopment,{series:[incomplete],unit:'kmh'}));
  expect(html).toContain('data-mid-fourteen-view="compact"');
  expect(html).toContain('Spannen');
  expect(html).not.toContain('NaN °C');
 });
});
