import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const core=fs.readFileSync('worker-src/00-core-observations.js','utf8');
const extreme=fs.readFileSync('worker-src/25-dach-extreme-outlook.js','utf8');
const builder=fs.readFileSync('tools/ruc/build_ruc_bundle.py','utf8');
const panel=fs.readFileSync('src/ExtremeWeatherOutlookPanel.tsx','utf8');
const cockpit=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const contract=fs.readFileSync('MID_DWD_RUC_PIPELINE_CONTRACT.md','utf8');

for(const token of [
  "'schema':'mid.dwd.ruc.rapid-extreme.v4'",
  'rapid_extreme_eps_period_summary',
  "'epsRain1hProbabilityPct'",
  "'epsRain6hProbabilityPct'",
  "'epsWetProbabilityPct'",
  "'epsSignificantProbabilityPct'"
]) assert.ok(builder.includes(token),`RUC-EPS extreme builder contract missing: ${token}`);
for(const token of [
  'dachExtremeRucEpsCalibrate',
  'dachExtremeRucConditionExisting',
  'rucEpsCalibrationApplied',
  'rucSnowPhaseSupport',
  'rucIcePhaseSupport',
  'RUC-EPS-Kurzfristkalibrierung'
]) assert.ok(extreme.includes(token),`RUC/EPS extreme calibration contract missing: ${token}`);
for(const token of ['epsUpperTailPenalty','epsSignificantProbability','epsQ75Mm','rucEpsUpperTailPenalty'])assert.ok(core.includes(token),`Hyperlocal RUC-EPS amplitude guard missing: ${token}`);
for(const token of ['RUC-EPS Kurzfrist-Ensemble','RUC-EPS Q75 max. 1 h','RUC Schneesignal','RUC Eissignal'])assert.ok(panel.includes(token),`RUC/EPS evidence transparency missing: ${token}`);
assert.ok(cockpit.includes('Q75-Ausreißerplausibilisierung'),'Forecast cockpit must explain the RUC-EPS Q75 plausibility guard');
for(const token of ['Schema v4','RUC-EPS-Windwahrscheinlichkeit','keine harte Mengenobergrenze'])assert.ok(contract.includes(token),`RUC pipeline contract not updated: ${token}`);

const raw=fs.readFileSync('worker/metar-proxy.js','utf8')
 .replace(/export default\s*\{/,'const __workerDefault={')
 .replace(/^export \{[^\n]+\};?$/gm,'');
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,crypto,setTimeout,clearTimeout,fetch:async()=>{throw new Error('network not expected')}});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
const call=code=>vm.runInContext(code,context,{timeout:5000});

context.__point={lat:50,lon:7};
context.__period={id:'0-6',startHour:0,endHour:6};
context.__rainBase=call("dachExtremeSignal([20,12,6,2],{elevationM:100,terrain:'lowland'},['ICON-D2-EPS'])");
context.__wetSnapshot={schema:'mid.dwd.ruc.rapid-extreme.v4',cells:[{latitude:50,longitude:7,periods:{'0-6':{startHour:0,endHour:6,coverageHours:6,source:'native-rapid+hourly-core',precipitationMm:10,max1hMm:10,epsMemberCount:20,epsWetProbabilityPct:85,epsSignificantProbabilityPct:55,epsRain1hProbabilityPct:[80,55,25,10],epsRain6hProbabilityPct:[75,50,20,8],epsMax1hQ75Mm:18,epsTotalQ75Mm:28}}}]};
context.__rainWet=call('dachExtremeApplyRucSupport(__rainBase,__point,__wetSnapshot,__period,\'rain\')');
assert.ok(context.__rainWet.probabilities[0]>20,'RUC-EPS should raise short-range rain confidence when member support is strong');
assert.equal(context.__rainWet.signal?.metrics?.rucEpsMemberCount,20,'RUC-EPS member count must remain visible in hazard metrics');

context.__drySnapshot={schema:'mid.dwd.ruc.rapid-extreme.v4',cells:[{latitude:50,longitude:7,periods:{'0-6':{startHour:0,endHour:6,coverageHours:6,source:'native-rapid+hourly-core',precipitationMm:0,max1hMm:0,epsMemberCount:20,epsWetProbabilityPct:0,epsSignificantProbabilityPct:0,epsRain1hProbabilityPct:[0,0,0,0],epsRain6hProbabilityPct:[0,0,0,0]}}}]};
context.__rainDry=call('dachExtremeApplyRucSupport(__rainBase,__point,__drySnapshot,__period,\'rain\')');
assert.ok(context.__rainDry.probabilities[0]>=10,'RUC-EPS contradiction must not erase an already ensemble-supported rain hazard level');
assert.ok(context.__rainDry.probabilities[0]<20,'RUC-EPS dry contradiction should cautiously reduce short-range rain confidence');

context.__snowBase=call("dachExtremeSignal([18,10,5,0],{elevationM:300,terrain:'lowland'},['ICON-D2-EPS'])");
context.__snowSnapshot={schema:'mid.dwd.ruc.rapid-extreme.v4',cells:[{latitude:50,longitude:7,periods:{'0-6':{startHour:0,endHour:6,coverageHours:6,source:'native-rapid+hourly-core',temperatureMinC:-1,snowlineMinM:250,freezingLevelMinM:350,snowPhaseWaterEquivalentMm:.8,epsMemberCount:20,epsWetProbabilityPct:80,epsSignificantProbabilityPct:35}}}]};
context.__snow=call('dachExtremeApplyRucSupport(__snowBase,__point,__snowSnapshot,__period,\'snow\')');
assert.ok(context.__snow.probabilities[0]>18,'Cold RUC phase evidence plus RUC-EPS precipitation should strengthen existing snow confidence');
assert.ok(context.__snow.signal?.metrics?.rucSnowPhaseSupport>=2,'Snow phase support diagnostics missing');

context.__iceBase=call("dachExtremeSignal([20,10,0,0],{elevationM:100},['ICON-D2-EPS'])");
context.__iceSnapshot={schema:'mid.dwd.ruc.rapid-extreme.v4',cells:[{latitude:50,longitude:7,periods:{'0-6':{startHour:0,endHour:6,coverageHours:6,source:'native-rapid+hourly-core',temperatureMinC:-1,freezingLevelMinM:250,rainPhaseMm:1,precipitationMm:2,rhMaxPct:95,epsMemberCount:20,epsWetProbabilityPct:75}}}]};
context.__ice=call('dachExtremeApplyRucSupport(__iceBase,__point,__iceSnapshot,__period,\'ice\')');
assert.ok(context.__ice.probabilities[0]>20,'RUC thermodynamic/phase evidence should strengthen an existing ice-risk signal');
assert.ok(context.__ice.signal?.metrics?.rucIcePhaseSupport>=3,'Ice phase support diagnostics missing');

console.log('Expanded ICON-D2-RUC/RUC-EPS hyperlocal + extreme-weather calibration contract passed.');
