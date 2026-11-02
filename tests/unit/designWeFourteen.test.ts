import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
import * as ts from 'typescript-strada';
import postcss from 'postcss';
import {fourteenTemperatureSeries,fourteenPrecipitationSeries,fourteenProbabilitySeries,fourteenWindSeries} from '../../src/FourteenDayDevelopment';

const source=readFileSync(new URL('../../src/FourteenDayDevelopment.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../../src/midDesignWeFourteen.css',import.meta.url),'utf8');
const assessment={date:'2026-11-02',agreement:'unknown',confidenceScore:null,dataQuality:'missing',parameters:[],limiting:[],complete:false,leadHours:0,leadFactor:1,calibrationApplied:false,calibrationSampleDays:0};
const row={
 date:'2026-11-02',meanDayTemperature:8,regimeText:'Bewölkt',weatherLabel:'Bewölkt',
 bestMax:10,bestMin:6,maxLow:8,maxHigh:13,maxQ25:9,maxQ75:11,
 minLow:4,minHigh:8,minQ25:5,minQ75:7,
 bestPrecipitation:0,bestPrecipitationProbability:0,bestWind:10,bestGust:20,
 precipitationLow:0,precipitationHigh:3,windLow:7,windHigh:15,gustLow:17,gustHigh:24,
 ensembleAvailable:true,assessment
};
describe('MID 14-Tage-A/B/C Design-WE source and meteorology',()=>{
 it('parses the actual component and responsive stylesheet',()=>{
  const tree=ts.createSourceFile('FourteenDayDevelopment.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  expect(tree.parseDiagnostics.map(issue=>ts.flattenDiagnosticMessageText(issue.messageText,' '))).toEqual([]);
  expect(()=>postcss.parse(css,{from:'midDesignWeFourteen.css'})).not.toThrow();
 });
 it('exposes A default, B expanded synchronized charts, and C detailed day matrix',()=>{
  expect(source).toContain("useDisplayPreference<FourteenView>('ForecastCockpit.fourteenDevelopment.mode','compact'");
  for(const value of ["key:'compact'","key:'charts'","key:'days'","aria-pressed={mode===option.key}","data-mid-fourteen-view={mode}","mid-we-fourteen-table-scroll","mid-we-fourteen-row-expansion"]){
   expect(source).toContain(value);
  }
  expect(source).toContain("label=\"14 Tage Tagesniederschlag");
  expect(source).toContain("unit={windUnitLabel[unit]}");
  expect(source).toContain("role=\"group\"");
 });
 it('keeps true dry/0% day distinct from unavailable data',()=>{
  const dry=fourteenPrecipitationSeries([row as any])[0].points[0];
  const probability=fourteenProbabilitySeries([row as any])[0].points[0];
  expect(dry.mean).toBe(0);
  expect(probability.mean).toBe(0);
  const missing={...row,date:'2026-11-03',bestPrecipitation:Number.NaN,bestPrecipitationProbability:Number.NaN,bestWind:Number.NaN,ensembleAvailable:false};
  expect(fourteenPrecipitationSeries([missing as any])[0].points[0].mean).toBeNull();
  expect(fourteenProbabilitySeries([missing as any])[0].points[0].mean).toBeNull();
  expect(fourteenWindSeries([missing as any],'kmh')[0].points[0].mean).toBeNull();
  expect(fourteenPrecipitationSeries([missing as any])[0].points[0].low).toBeNull();
  expect(fourteenTemperatureSeries([missing as any])[0].points[0].q25).toBeNull();
 });
 it('converts wind only for the display unit and preserves true ensemble bounds',()=>{
  const kmh=fourteenWindSeries([row as any],'kmh');
  expect(kmh[0].points[0].mean).toBeCloseTo(18.52,2);
  expect(kmh[0].points[0].low).toBeCloseTo(12.964,3);
  expect(kmh[1].points[0].mean).toBeCloseTo(37.04,2);
  const knots=fourteenWindSeries([row as any],'kn');
  expect(knots[0].points[0].mean).toBe(10);
 });
 it('retains quantified uncertainty with label and no invented quantiles',()=>{
  const temp=fourteenTemperatureSeries([row as any]);
  expect(temp[0].points[0].q25).toBe(9);
  expect(temp[0].points[0].q75).toBe(11);
  expect(fourteenPrecipitationSeries([row as any])[0].points[0]).not.toHaveProperty('q25');
  expect(source).toContain('Niederschlagswahrscheinlichkeit · Best Match');
  expect(source).toContain('Ensemble-Spannen sind keine zusätzlichen Best-Match-Werte');
 });
 it('provides responsive and keyboard-visible modes without hiding any meteorological data',()=>{
  for(const token of ["@media(max-width:620px)","@media(max-width:820px)","min-height:44px",":focus-visible","prefers-reduced-motion","overflow-x:auto"])expect(css).toContain(token);
  expect(source).not.toContain("bestPrecipitation||0");
 });
});
