import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transform} from 'esbuild';
import {execFileSync} from 'node:child_process';
const [fourteen,cockpit,panel,chart,css]=await Promise.all(['src/FourteenDayDevelopment.tsx','src/ForecastCockpit.tsx','src/LongRangePanel.tsx','src/HorizonSignalChart.tsx','src/horizonInstruments.css'].map(path=>readFile(path,'utf8')));
const fn=fourteen.slice(fourteen.indexOf('export function fourteenTemperatureSeries'),fourteen.indexOf('const dateLabel='));
const context=vm.createContext({Number,dateLabel:x=>x,assessmentSummary:()=>''});
vm.runInContext((await transform(fn.replace('export function','function')+';globalThis.build=fourteenTemperatureSeries;',{loader:'ts',format:'iife'})).code,context);
const row={date:'2026-10-07',ensembleAvailable:true,bestMax:18,bestMin:6,maxLow:14,maxQ25:15,maxQ75:17,maxHigh:19,minLow:2,minQ25:4,minQ75:7,minHigh:9,assessment:{}};
const series=context.build([row]);
assert.deepEqual(JSON.parse(JSON.stringify(series.map(s=>[s.id,s.points[0].mean,s.points[0].low,s.points[0].q25,s.points[0].q75,s.points[0].high]))),[['tmax',18,14,15,17,19],['tmin',6,2,4,7,9]]);
for(const s of context.build([{...row,ensembleAvailable:false}]))for(const key of ['low','q25','q75','high'])assert.equal(s.points[0][key],null,'Best Match fallback never invents an ensemble interval');
const missing=context.build([{...row,bestMin:NaN,minQ25:NaN,minQ75:NaN}])[1].points[0];assert.equal(missing.mean,null);assert.equal(missing.q25,null);assert.equal(missing.q75,null);
for(const key of ['maxQ25','maxQ75','minQ25','minQ75'])assert.ok(cockpit.includes(`${key}:item.${key}`),'Canonical weighted daily quartiles must reach the phase chart');
assert.ok(chart.includes('values=signalScaleValues(series)'),'Scale uses the visible center and admitted interval levels');
assert.ok(chart.includes("freezingPointVisible=unit==='°C'&&lo<=0&&hi>=0")&&chart.includes("strokeWidth:1.9,strokeDasharray:'none'"),'Temperature horizon charts emphasize a visible 0 °C reference without changing other units');
const exactQuartile='P25–P75 ${valueLabel(point.q25)} bis ${valueLabel(point.q75)} ${unit}';
assert.ok(chart.split(exactQuartile).length>=3&&chart.includes('<title>')&&chart.includes('role="status"'),
 'Both accessible SVG title and selected status show genuine inner quartiles using unit-aware valueLabel, not rounded surrogate data');
// Atmospheric Precision: test the exact production legend/interval predicates.
const signalHelpers=chart.slice(chart.indexOf('export function hasSignalMean('),chart.indexOf('/** Connect only adjacent dated'));
assert.ok(signalHelpers.includes('export function signalRangeLegend('));
vm.runInContext((await transform(signalHelpers.replaceAll('export function','function')+';globalThis.signal={hasSignalMean,hasSignalOuterRange,hasSignalInnerRange,signalRangeLegend,signalScaleValues};',{loader:'ts',format:'iife'})).code,context);
{
const {hasSignalMean,hasSignalOuterRange,hasSignalInnerRange,signalRangeLegend,signalScaleValues}=context.signal;
let signalChecks=0;
const testSignal=(name,fn)=>{try{fn();signalChecks++}catch(error){throw new Error(name,{cause:error})}};
const p=(extra={})=>({id:'2026-11-26',label:'Do',mean:5,...extra});
const s=(...points)=>[{id:'test',label:'Best Match',color:'var(--param-temperature)',points}];
const unit='°C',outer=' · P10–P90 (dünne Linie)',inner=' · P25–P75 (breite Linie)';
testSignal('no data or deterministic points do not advertise ensemble intervals',()=>{assert.equal(signalRangeLegend([],unit),unit);assert.equal(signalRangeLegend(s(p()),unit),unit);assert.equal(signalRangeLegend(s(p({low:null,high:null,q25:null,q75:null})),unit),unit)});
testSignal('true outer range displayed, including negative values and zero',()=>{const point=p({low:-8,high:0});assert.equal(hasSignalOuterRange(point),true);assert.equal(signalRangeLegend(s(point),unit),unit+outer)});
testSignal('actual nested ranges both displayed',()=>{const point=p({low:-10,high:30,q25:1,q75:10});assert.equal(hasSignalInnerRange(point),true);assert.equal(signalRangeLegend(s(point),unit),unit+outer+inner)});
testSignal('valid inner-only range identified without claiming P10/P90',()=>{assert.equal(signalRangeLegend(s(p({q25:1,q75:10})),unit),unit+inner)});
testSignal('partial or reversed endpoints do not create an interval',()=>{for(const extra of [{low:1},{low:10,high:1},{q25:3},{q25:10,q75:1}])assert.equal(signalRangeLegend(s(p(extra)),unit),unit)});
testSignal('NaN and infinities excluded from both interval types',()=>{for(const n of [NaN,Infinity,-Infinity])for(const extra of [{low:n,high:20},{low:1,high:n},{q25:n,q75:10},{q25:1,q75:n}])assert.equal(signalRangeLegend(s(p(extra)),unit),unit)});
testSignal('no visible interval for missing or nonfinite point center',()=>{for(const mean of [null,NaN,Infinity,-Infinity]){const pt=p({mean,low:-8,high:20,q25:1,q75:9});assert.equal(hasSignalMean(pt),false);assert.equal(signalRangeLegend(s(pt),unit),unit)}});
testSignal('contradictory inner outside valid outer interval is not advertised',()=>{const pt=p({low:0,high:10,q25:-1,q75:8});assert.equal(hasSignalOuterRange(pt),true);assert.equal(hasSignalInnerRange(pt),false);assert.equal(signalRangeLegend(s(pt),unit),unit+outer)});
testSignal('a zero-width genuine interval remains admissible',()=>{const pt=p({mean:0,low:0,high:0,q25:0,q75:0});assert.equal(signalRangeLegend(s(pt),unit),unit+outer+inner)});
testSignal('mixed coverage or multiple series only advertise genuinely present interval types',()=>{const rows=[...s(p({low:0,high:10})),...s(p({q25:1,q75:8}),p({mean:null,low:0,high:10}))];assert.equal(signalRangeLegend(rows,'mm/Tag'),'mm/Tag'+outer+inner)});
testSignal('valid extreme interval remains untouched and input is immutable',()=>{const rows=s(p({mean:4,low:-42,high:51,q25:-12,q75:24}));const before=structuredClone(rows);Object.freeze(rows[0].points[0]);assert.equal(signalRangeLegend(rows,unit),unit+outer+inner);assert.deepEqual(rows,before)});
assert.equal(signalChecks,11);
// Each visible finite center and each admitted interval endpoint contributes to the scale.
const scaleCases=[
 [[],[]],
 [s(p()),[5]],
 [s(p({mean:null,low:-500,high:500,q25:-100,q75:100})),[]],
 [s(p({mean:NaN,low:-500,high:500}),p({mean:Infinity,q25:-100,q75:100})),[]],
 [s(p({high:9000,q25:-9000})),[5]],
 [s(p({low:500,high:-500})),[5]],
 [s(p({low:-Infinity,high:500,q25:NaN,q75:500})),[5]],
 [s(p({low:0,high:10,q25:-500,q75:8})),[5,0,10]],
 [s(p({q25:-10,q75:15})),[5,-10,15]],
 [s(p({low:-42,high:51,q25:-12,q75:24})),[5,-42,51,-12,24]],
 [s(p({mean:-10,low:20,high:80,q25:30,q75:70})),[-10,20,80,30,70]],
 [s(p({mean:0,low:0,high:0,q25:0,q75:0})),[0,0,0,0,0]],
 [[...s(p({mean:null,low:-9000,high:9000})),...s(p({mean:20,low:12,high:30}),p({mean:9,q25:3,q75:11}))],[20,12,30,9,3,11]]
];
for(const [rows,expected] of scaleCases){
 for(const row of rows){row.points.forEach(Object.freeze);Object.freeze(row.points);Object.freeze(row)}
 Object.freeze(rows);
 assert.deepEqual(Array.from(signalScaleValues(rows)),expected);
}
assert.ok(chart.includes('if(!values.length)return')&&chart.includes('Fehlende Daten werden nicht als Nullsignal dargestellt.'),'All-hidden points must select NoData instead of an empty plot');
console.log('Atmospheric Precision: 13 visible scale input regressions passed');

assert.equal(chart.split('hasSignalOuterRange(point)?').length-1,3,'SVG title, visible outer interval and selected status use the same guard');
assert.equal(chart.split('hasSignalInnerRange(point)?').length-1,3,'SVG title, visible inner interval and selected status use the same guard');
assert.ok(chart.includes('{signalRangeLegend(series,unit)}')&&chart.includes('point&&hasSignalMean(point)?'),'Legend and selected status are evidence-bound');
console.log('Atmospheric Precision: 11 quantile legend/interval regressions passed');
}
const paths=chart.slice(chart.indexOf('export function dailySignalPaths'),chart.indexOf('/** Period intervals'));
vm.runInContext((await transform(paths.replace('export function','function')+';globalThis.paths=dailySignalPaths;',{loader:'ts',format:'iife'})).code,context);
const point=(id,mean)=>({id,mean,label:id}),identity=x=>x;
const connected=context.paths([point('2026-10-24',1),point('2026-10-25',2),point('2026-10-26',3)],identity,identity);
assert.deepEqual(JSON.parse(JSON.stringify(connected)),['M 0 1 L 1 2 L 2 3'],'UTC dates connect across DST');
for(const missingValue of [null,NaN,Infinity])assert.equal(context.paths([point('2026-10-24',1),point('2026-10-25',missingValue),point('2026-10-26',3)],identity,identity).length,2,'Missing values break daily curves');
assert.equal(context.paths([point('2026-10-24',1),point('2026-10-26',3)],identity,identity).length,2,'Missing dates break daily curves');
assert.equal(context.paths([point('week1',1),point('week2',3)],identity,identity).length,0,'Period labels are never treated as daily dates');
assert.ok(fourteen.includes('const chartTemperature=hasEnsemble?null:fourteenTemperatureSeries(series);')&&fourteen.includes('connectDaily series={chartTemperature}')&&fourteen.includes('14 Tage Best-Match-Temperatur ohne verfügbare Ensemble-Spannen')&&fourteen.includes('data-mid-fourteen-fallback="best-match"'),'Compact A and detailed B retain connected Best-Match temperatures only when original ensemble coverage is absent');
for(const token of ["activeHorizon=initialHorizon??localHorizon","seasonSelected=activeHorizon==='season'","if(!seasonSelected)return;","if(seasonSelected)void load(false)","{!seasonSelected?<section ref={weatherTrendRef}","{seasonSelected?<section ref={seasonalRef}",'controllerRef.current?.abort()'])assert.ok(panel.includes(token),`Independent horizon activation missing: ${token}`);
assert.ok(css.includes('.fourteen-phase-summary>article')&&css.includes('grid-template-columns:minmax(82px,.8fr) minmax(0,1fr)'),'Compact phone phase layout required');
if(process.env.MID_HORIZON_BROWSER_QA==='1')execFileSync(process.execPath,[new URL('./verify-forecast-horizon-browser-0985189.mjs',import.meta.url).pathname],{stdio:'inherit',timeout:240000});
else console.log('14d real Tmin/Tmax quantile mapping, missing-data and independent 46d/season contracts passed; browser QA runs in CI or with MID_HORIZON_BROWSER_QA=1.');
