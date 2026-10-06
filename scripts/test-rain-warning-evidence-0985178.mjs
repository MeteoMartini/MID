import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const c={};vm.createContext(c);vm.runInContext(stripTypeScriptTypes(fs.readFileSync('src/dwdWarnings.ts','utf8').replace(/export /g,'')),c);
const start=Date.parse('2026-10-06T09:00:00Z'),samples=Array.from({length:168},(_,i)=>({epoch:start+i*3600000,time:new Date(start+i*3600000).toISOString(),temperature:20,precipitation:i>=48&&i<72?2:0,rain:i>=48&&i<72?2:0,showers:0,snowfall:0,code:i>=48&&i<72?63:0}));
const signals=c.summarizeDwdWarnings(samples,0).filter(s=>s.kind==='heavyRain'||s.kind==='continuousRain');assert.ok(signals.length>0,'Real later rain must retain its warning');
for(const s of signals){assert.equal(Date.parse(s.validFrom),start+48*3600000);assert.equal(Date.parse(s.validTo),start+72*3600000);assert.ok(Date.parse(s.validFrom)>start+24*3600000,'A future multi-day total must not mark the dry 24-hour profile');}
const intervalSamples=samples.map(s=>({...s,precipitationIntervalStartEpoch:s.epoch-3600000,precipitationIntervalEndEpoch:s.epoch}));for(const s of c.summarizeDwdWarnings(intervalSamples,0).filter(s=>s.kind==='continuousRain')){assert.equal(Date.parse(s.validFrom),start+47*3600000);assert.equal(Date.parse(s.validTo),start+71*3600000);}
const gap=samples.slice(48,72).map((s,i)=>({...s,epoch:start+i*3*3600000,rain:2,precipitation:2}));assert.ok(!c.dwdWarningSignalsAt(gap,0).some(s=>s.kind==='continuousRain'),'24 three-hour samples cannot masquerade as a 24-hour total');
assert.ok(!c.summarizeDwdWarnings(samples.map(s=>({...s,rain:0,precipitation:0,code:0}))).some(s=>s.kind==='heavyRain'||s.kind==='continuousRain'));
const weather=fs.readFileSync('src/weather.ts','utf8'),from=weather.indexOf('function hazardProbabilisticWindow('),to=weather.indexOf('\nfunction hazardWindUpTo(',from),p={};vm.createContext(p);vm.runInContext(stripTypeScriptTypes(weather.slice(from,to)),p);
const signal=signals[0],window=p.hazardProbabilisticWindow(signal,samples,false,{hours:[{epoch:start,precipitationNeighborhoodP90:100}]});assert.equal(window.validFrom,signal.validFrom);assert.equal(window.validTo,signal.validTo,'Unrelated marginal ensemble quantiles cannot pad rain onset or end');
assert.ok(!weather.includes('Ensemble-Läufe und die räumliche Umfeldprüfung stützen dabei auch zeitlich versetzte Treffer.'));
assert.ok(weather.includes('Standortprognose:'));
Object.assign(p,{hazardConvectiveContext:()=>false,hazardWindDirectionNarrative:()=>'',hazardNextWindThresholdKmh:()=>NaN,hazardAmountBand:()=> 'unverified range',formatDwdWarningValue:(s,u)=>c.formatDwdWarningValue(s,u)});
vm.runInContext(stripTypeScriptTypes(weather.slice(weather.indexOf('function hazardPresentation('),weather.indexOf('\nfunction trimLowerHazardBoundary('))),p);
const presentation=p.hazardPresentation(signal,samples,'kn',{hours:[{epoch:start,precipitationNeighborhoodP90:100}]});assert.equal(presentation.displayMetric,'48 mm/48 h');assert.equal(presentation.scopeLabel,'Standortprognose');assert.equal(presentation.precisionLabel,'Modellsumme · DWD-Schwellen');assert.ok(!presentation.displayText.includes('stützen'));

assert.ok(weather.includes("?'Modellsumme · DWD-Schwellen':precisionLabel"));
console.log('Rain warnings: delayed rain retains true wet validity, explicit interval bounds, hourly cadence, no dry-window coloring and no unsupported ensemble confirmation verified.');

const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8'),cc={SHORT_TERM_HAZARD_LEVELS:{orange:2,yellow:1},DWD_WARNING_COLORS:{1:'yellow',2:'orange'}};vm.createContext(cc);vm.runInContext(stripTypeScriptTypes(cockpit.slice(cockpit.indexOf('function shortTermImpactFromSignal('),cockpit.indexOf('function shortTermImpactWindowLabel('))),cc);
const shown={...signal,level:'orange',displayText:'actual model total'};
assert.equal(cc.shortTermImpactForInterval([shown],start+50*3600000,start+51*3600000,{precipitation:0,rain:0,showers:0,snowfall:0}).level,0,'Dry pauses or local radar removal must not be colored as rain impacts');
assert.equal(cc.shortTermImpactForInterval([shown],start+50*3600000,start+51*3600000,{precipitation:2,rain:2,showers:0}).level,2);
assert.equal(cc.shortTermImpactForInterval([shown,{kind:'wind',level:'yellow',title:'Wind',validFrom:shown.validFrom,validTo:shown.validTo}],start+50*3600000,start+51*3600000,{precipitation:0,rain:0,showers:0}).label,'Wind','Unrelated real hazards remain visible');

assert.equal(cc.shortTermImpactForInterval([shown],start+50*3600000,start+51*3600000,{precipitation:0,rain:2,showers:0}).level,0,'A stale phase component must not contradict the actually displayed dry precipitation');

assert.equal(cc.shortTermImpactForInterval([shown],start+72*3600000,start+73*3600000,{precipitation:2,rain:2,showers:0,precipitationIntervalStartEpoch:start+71*3600000,precipitationIntervalEndEpoch:start+72*3600000}).level,2,'Backward-accumulated wet interval at the event end must use its own validity rather than the following dry hour');

assert.ok(!cockpit.includes("key:'pressure',label:'Drucktrend'"),'Pressure already has a chart lane; do not reserve a permanent tile');
assert.ok(cockpit.includes('signalCards.length?'),'Empty signals must disappear');
const signalCss=fs.readFileSync('src/midC18AuditFollowup.css','utf8');assert.ok(signalCss.includes('grid-template-columns:minmax(0,1fr)!important'));assert.ok(signalCss.includes('overflow-wrap:anywhere'));

execFileSync('python',['tools/ruc/test_run_progress.py'],{stdio:'inherit'});
