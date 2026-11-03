import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import * as ts from 'typescript-strada';
import postcss from 'postcss';
import type {Day,EnsembleDay} from '../../src/weather';
import {SevenDayDesignModes,sevenDayDetailedSeries,type SevenDayView} from '../../src/SevenDayDesignModes';

const source=readFileSync(new URL('../../src/SevenDayDesignModes.tsx',import.meta.url),'utf8');
const cockpit=readFileSync(new URL('../../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../../src/midDesignWeSeven.css',import.meta.url),'utf8');
const days:Day[]=Array.from({length:7},(_,index)=>{
 const date=new Date(Date.UTC(2026,10,2+index)).toISOString().slice(0,10);
 return{date,code:index===2?61:2,max:16+index,min:6+index,precipitation:index===2?Number.NaN:index===4?0:1.2,precipitationAvailable:index!==2,probability:index===2?NaN:30,probabilityAvailable:index!==2,wind:9+index,gust:17+index,direction:250,uvMax:2,sunshineDuration:index===2?null:21600};
});
const ensemble:EnsembleDay[]=[{
 date:days[0].date,maxMean:16,maxLow:14,maxHigh:20,maxQ25:15,maxQ75:18,
 minMean:6,minLow:4,minHigh:9,minQ25:5,minQ75:7,
 precipitationMean:1.3,precipitationLow:0,precipitationHigh:5,precipitationQ25:1,precipitationQ75:3,
 cumulativePrecipitationMean:1.3,cumulativePrecipitationLow:0,cumulativePrecipitationHigh:5,
 cumulativePrecipitationQ25:1,cumulativePrecipitationQ75:3,
 precipitationProbability:35,precipitationProbabilitySignificant:20,precipitationProbabilityWindows:[],
 sunshineDurationMean:21600,sunshineDurationLow:null,sunshineDurationHigh:null,
 windMean:9,windLow:7,windHigh:12,windQ25:8,windQ75:11,
 gustMean:17,gustLow:12,gustHigh:22,gustQ25:15,gustQ75:19,modelCount:3,memberCount:15
}];
const props={days,ensemble,hours:[],unit:'kmh' as const,mode:'standard' as SevenDayView,onModeChange:()=>{},onOpenDay:()=>{}};
describe('MID Design-WE seven-day preserved Skybar + A/B/C implementation',()=>{
 it('parses actual TSX and responsive CSS',()=>{
  const file=ts.createSourceFile('SevenDayDesignModes.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  expect(file.parseDiagnostics.map(problem=>ts.flattenDiagnosticMessageText(problem.messageText,' '))).toEqual([]);
  expect(()=>postcss.parse(css)).not.toThrow();
 });
 it('provides a single prominent A/B/C selector above the original Skybar and compacts cards without deleting bounds',()=>{
  const segment=cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('function fallbackEnsembleDay('));
  expect(segment.indexOf('mid-we-seven-switch-primary')).toBeGreaterThan(0);
  expect(segment.indexOf('mid-we-seven-switch-primary')).toBeLessThan(segment.indexOf('<SevenDayCurveOverview'));
  expect(segment.indexOf('<SevenDayCurveOverview')).toBeLessThan(segment.indexOf('<LazySevenDayDesignModes'));
  expect(segment).toContain('showModeSwitch={false}');
  const a=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'standard',showModeSwitch:false}));
  expect(a).not.toContain('mid-we-seven-switch"');
  expect(a).toContain('data-mid-seven-mode="standard"');
  const b=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'charts',showModeSwitch:false}));
  expect(b).toContain('mid-we-seven-charts');
  expect(b).not.toContain('mid-we-seven-switch"');
  expect(segment).toContain('const [expandedSevenDate,setExpandedSevenDate]=useState<string|null>(null)');
  expect(segment).toContain('isExpanded=expandedSevenDate===day.date;');
  expect(segment).toContain("setExpandedSevenDate(current=>current===date?null:date)");
  expect(segment).toContain('aria-expanded={isExpanded}');
  expect(segment).toContain('aria-controls={`mid-seven-detail-${day.date}`}');
  const row=segment.slice(segment.indexOf('const compact=<button'),segment.indexOf('const detail=<section'));
  const detail=segment.slice(segment.indexOf('const detail=<section'));
  expect(row).not.toContain('<ForecastRangeGuide');
  expect(detail).toContain('<ForecastRangeGuide');
  expect(css).toContain('.mid-we-seven-switch-primary');
 });
 it('keeps one visible A/B/C selector above the continuous Skybar and opens C-to-A day detail',()=>{
  const segment=cockpit.slice(cockpit.indexOf('function SevenDayBand('),cockpit.indexOf('function fallbackEnsembleDay('));
  expect(segment.indexOf('<SevenDayCurveOverview')).toBeGreaterThan(0);
  expect(segment.indexOf('<LazySevenDayDesignModes')).toBeGreaterThan(segment.indexOf('<SevenDayCurveOverview'));
  expect(segment).toContain("const expandedDayContent=sevenView==='standard'&&expandedSevenDate!==null?<div className=\"cockpit-seven-grid mid-we-seven-expanded-detail\"");
  expect(segment).toContain('expandedDayContent={expandedDayContent}');
  expect(source).toContain('{open?expandedDayContent:null}');
  expect(segment).toContain('visible.filter(day=>day.date===expandedSevenDate)');
  expect(segment).toContain("onOpenDay={sevenView==='standard'?chooseDay:openDayFromTable}");
  expect(segment.indexOf('mid-we-seven-switch-primary')).toBeLessThan(segment.indexOf('<SevenDayCurveOverview'));
  expect(segment).toContain("const openDayFromTable=(date:string)=>{setSevenView('standard');setExpandedSevenDate(date);onSelectedDate(date)}");
  expect(segment).toContain('isExpanded=expandedSevenDate===day.date;');
  expect(segment).toContain('aria-expanded={isExpanded}');
  expect(segment).toContain('aria-controls={`mid-seven-detail-${day.date}`}');
  expect(segment).not.toContain('display:none!important');
  expect(cockpit).toContain("useDisplayPreference<'standard'|'charts'|'table'>('ForecastCockpit.sevenDay.view','standard'");
 });
 it('renders real compact A day cards with preserved missing-value semantics and accessible details',()=>{
  const standard=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'standard',expandedDate:days[2].date,showModeSwitch:false}));
  expect((standard.match(/class="mid-we-seven-daycard/g)||[]).length).toBe(7);
  expect((standard.match(/aria-expanded="true"/g)||[]).length).toBe(1);
  expect(standard).toContain('aria-controls="mid-seven-detail-'+days[2].date+'"');
  expect(standard).toContain('Niederschlag');
  expect(standard).toContain('Sonne');
  expect(standard).not.toContain('NaN');
  expect(css).toContain('.mid-we-seven-daycard');
  expect(css).toContain('@media(max-width:850px)');
 });
 it('renders all three visual modes independently with 44px touch controls',()=>{
  const a=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'standard'}));
  const b=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'charts'}));
  const c=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'table'}));
  expect(a).toContain('data-mid-seven-mode="standard"');
  expect(a).toContain('aria-pressed="true"');
  expect(a).not.toContain('mid-we-seven-charts');
  expect(b).toContain('data-mid-seven-mode="charts"');
  expect((b.match(/<h3>/g)||[]).length).toBe(5);
  expect(b).toContain('daily-accumulation-bar');
  expect(b).toContain('data-signal-series="gust"');
  expect(c).toContain('data-mid-seven-mode="table"');
  expect((c.match(/<tr>/g)||[]).length).toBe(8);
  expect((c.match(/Stundenverlauf für/g)||[]).length).toBe(7);
  expect(c).toContain('–');
  expect(css).toContain('min-height:44px');
  expect(css).toContain(':focus-visible');
  expect(css).toContain('@media(max-width:650px)');
 });
 it('never presents missing rain, probability or sunshine as dry/sunny zero',()=>{
  const model=sevenDayDetailedSeries(days,ensemble,'kn');
  expect(model.precipitation[0].points[2].mean).toBeNull();
  expect(model.probability[0].points[2].mean).toBeNull();
  expect(model.sunshine[0].points[2].mean).toBeNull();
  expect(model.precipitation[0].points[4].mean).toBe(0);
  expect(model.precipitation[0].points[0].mean).toBe(1.2);
 });
 it('honors app-wide optional ECMWF colors in B/C without altering default Tmin/Tmax',()=>{
  const standard=sevenDayDetailedSeries(days,ensemble,'kmh');
  const colored=sevenDayDetailedSeries(days,ensemble,'kmh',true);
  expect(standard.temperature[0].points[0].color).toBeUndefined();
  expect(colored.temperature[0].points[0].color).toMatch(/^rgb\(/);
  expect(colored.temperature[1].points[0].color).toMatch(/^rgb\(/);
  expect(colored.precipitation[0].points[0].color).toBeUndefined();
  const graphical=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'charts',ecmwfTemperatureColors:true}));
  expect(graphical).toContain('mid-daily-gradient-');
  expect(graphical).toContain('Tmax · ECMWF-Farbskala');
  const table=renderToStaticMarkup(createElement(SevenDayDesignModes,{...props,mode:'table',ecmwfTemperatureColors:true}));
  expect(table).toContain('style="color:rgb(');
  expect(cockpit).toContain('ecmwfTemperatureColors={ecmwfTemperatureColors} mode={sevenView}');
 });
 it('uses only true ensemble quantiles and converts wind once',()=>{
  const model=sevenDayDetailedSeries(days,ensemble,'kmh');
  expect(model.temperature[0].points[0].low).toBe(14);
  expect(model.temperature[0].points[0].q25).toBe(15);
  expect(model.temperature[0].points[1].low).toBeNull();
  expect(model.wind[0].points[0].mean).toBeCloseTo(9*1.852);
  expect(model.wind[1].points[0].mean).toBeCloseTo(17*1.852);
  expect(model.wind[1].points[1].low).toBeNull();
 });
});
