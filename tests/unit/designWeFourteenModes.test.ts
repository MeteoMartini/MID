import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';
import type {DayAssessment} from '../../src/ensembleAssessment';

const preference=vi.hoisted(()=>({mode:'compact' as 'compact'|'charts'|'days'}));
vi.mock('../../src/useDisplayPreference',()=>({
 useDisplayPreference:()=>[preference.mode,()=>{}],
 displayChoice:(...allowed:string[])=>(value:unknown)=>allowed.includes(String(value))
}));
import {FourteenDayDevelopment} from '../../src/FourteenDayDevelopment';

const assessment:DayAssessment={
 date:'2026-11-02',agreement:'medium',confidenceScore:58,dataQuality:'limited',
 parameters:[],limiting:[],complete:false,leadHours:24,leadFactor:1,
 calibrationApplied:false,calibrationSampleDays:0
};
const days=Array.from({length:14},(_,i)=>{
 const date=new Date(Date.UTC(2026,10,2+i)).toISOString().slice(0,10);
 return {
  date,meanDayTemperature:8,regimeText:'Wechselhaft',weatherCode:3,weatherLabel:'Wechselhaft',
  bestMax:12,bestMin:4,maxLow:10,maxHigh:15,maxQ25:11,maxQ75:13,
  minLow:2,minHigh:7,minQ25:3,minQ75:5,
  bestPrecipitation:i===4?Number.NaN:0,bestPrecipitationProbability:i===4?Number.NaN:30,
  bestWind:10,bestGust:19,precipitationLow:0,precipitationHigh:4,
  windLow:8,windHigh:13,gustLow:15,gustHigh:23,
  ensembleAvailable:i!==4,assessment:{...assessment,date}
 };
});
function render(mode:'compact'|'charts'|'days'){
 preference.mode=mode;
 return renderToStaticMarkup(createElement(FourteenDayDevelopment,{series:days,unit:'kmh'}));
}
describe('MID Design-WE 14d real A/B/C rendering',()=>{
 it('A defaults to compact forecast development with all days as source and without fake data',()=>{
  const html=render('compact');
  expect(html).toContain('data-mid-fourteen-view="compact"');
  expect(html).not.toMatch(/(?:STANDARD|GRAFIK|TABELLE)\s*·\s*[ABC]/);
  expect(html).toContain('Übersicht');
  expect(html).toContain('Tag 1–4');
  expect(html).toContain('Woche 1 · Tage 1–7');
  expect(html).toContain('Woche 2 · Tage 8–14');
  expect((html.match(/class="mid-we-fourteen-daytile/g)||[]).length).toBe(14);
  expect(html).toContain('mid-we-fourteen-symbol');
  expect(html).toContain('mid-we-fourteen-weekscroll');
  expect(html.indexOf('mid-we-fourteen-chart-feature')).toBeLessThan(html.indexOf('mid-we-fourteen-weekscroll'));
  expect(html).not.toContain('NaN');
  expect(html).toContain('P10–P90');
  expect(html).not.toContain('daily-accumulation-bar');
 });
 it('B displays independent temperature, daily amount, probability, wind/gust diagrams',()=>{
  const html=render('charts');
  expect(html).toContain('data-mid-fourteen-view="charts"');
  expect(html).not.toContain('mid-we-fourteen-weekrow');
  expect(html).not.toContain('fourteen-phase-summary');
  for(const token of ['Temperatur · Tmax und Tmin','Niederschlagsmenge · Tagesakkumulation','Niederschlagswahrscheinlichkeit · Best Match','Wind und Böen · km/h']){
   expect(html).toContain(token);
  }
  expect((html.match(/<h3>/g)||[]).length).toBe(4);
  expect(html).toContain('daily-accumulation-bar');
  expect(html).toContain('data-signal-series="gust"');
  expect(html).toContain('P10–P90');
  expect(html).not.toContain('NaN mm');
 });
 it('C compares exactly fourteen dates with real independent detail toggles',()=>{
  const html=render('days');
  expect(html).toContain('data-mid-fourteen-view="days"');
  expect(html).toContain('mid-we-fourteen-table-scroll');
  expect((html.match(/<tr>/g)||[]).length).toBe(15);
  expect((html.match(/mid-we-fourteen-row-expansion/g)||[]).length).toBe(14);
  expect((html.match(/Spannen &amp; Einordnung/g)||[]).length).toBe(14);
  expect(html).toContain('nicht verfügbar');
  expect(html).toContain('km/h');
  expect(html).not.toContain('NaN');
 });
});