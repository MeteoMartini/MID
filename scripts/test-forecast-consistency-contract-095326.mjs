import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname);
const read=file=>readFileSync(resolve(root,file),'utf8');
const app=read('src/App.tsx'),fusion=read('src/forecastFusion.ts'),shortTerm=read('src/ShortTermForecast.tsx'),cockpit=read('src/ForecastCockpit.tsx'),event=read('src/eventWeatherEngine.ts'),anchor=read('src/forecastLocalAnchor.ts'),contract=read('MID_FORECAST_CONSISTENCY_CONTRACT.md'),hyperlocal=read('MID_HYPERLOCAL_ANALYSIS_CONTRACT.md'),source=read('MID_SOURCE_OF_TRUTH.md'),baseline=JSON.parse(read('MID_BASELINE.json'));
const need=(text,token,label)=>assert.ok(text.includes(token),`${label}: ${token}`);
for(const token of [
 'export function applyHyperlocalForecastHours(',
 'export function finalizeForecastMinute15(',
 'localAdjustmentSourceLabel',
 'blendRadarAtTarget({radar:options.radar,targetEpoch:row.epoch,intervalMinutes:15',
 'probability=Math.max(probability,90*weight)'
])need(fusion,token,'zentrale Forecast-Endstufe');
for(const token of [
 'forecastLocalAnchorFromCurrent(',
 "stationFieldObservationUsable(station,field,now,elevation)",
 "observed.code=Boolean(observed.cloud||observed.lowCloud||observed.visibility||observed.precipitation)"
])need(anchor,token,'gemeinsamer hyperlokaler Beobachtungsanker');
for(const token of [
 'finalizeForecastHours(twinHours,baseDisplayDays,{radar:radarAnalysis,thunder:thunderAnalysis,observedTemperature:finalizationObservedTemperature})',
 'applyHyperlocalForecastHours(core.hours,shortTermAnchor,Date.now(),twinHours)',
 'displayMinutes15=useMemo(()=>finalizeForecastMinute15(minutes15,twinHours,displayHours,{radar:radarAnalysis,localAnchor:shortTermAnchor})',
 'precipitationNowSummary(displayMinutes15,displayHours,displayTimezone)',
 'hours={displayHours} minutes15={displayMinutes15}',
 '<ShortTermForecast key={id} minutes15={displayMinutes15} hours={displayHours}',
 '<Widget loc={loc!} days={displayDays} hours={displayHours} minutes15={displayMinutes15}'
])need(app,token,'appweite kanonische Forecast-Verwendung');
assert.ok(!app.includes('minutes15={minutes15} shortTermAnchor={shortTermAnchor} radarNowcast={radarAnalysis??undefined}'),'Cockpit wendet rohe 15-Minuten-/lokale Inputs weiterhin ansichtsspezifisch an.');
assert.ok(!app.includes('<ShortTermForecast key={id} minutes15={minutes15}'),'Kurzfristmodul erhält weiterhin rohe 15-Minuten-Daten.');
need(shortTerm,'localAdjustment=Math.max(Number(base.localAdjustment)||0','Kurzfrist übernimmt kanonische lokale Anpassung');
need(shortTerm,"canonicalLocalLabel=hours.find(hour=>Number(hour.localAdjustment)>0)?.localAdjustmentSourceLabel",'Kurzfrist-Provenienz');
need(cockpit,'locallyAdjusted=adjusted.some(point=>point.localAdjustment>0)','90-Minuten-/Cockpit-Kennzeichnung');
for(const token of [
 'forecastLocalAnchorFromCurrent(observation,weather.current,now,location.elevation??weather.elevation)',
 'applyHyperlocalForecastHours(finalized.hours,localAnchor,now,referenceHours)',
 'finalizeForecastHours(finalHours,displayBaseDays,{radar,thunder,observedTemperature:localAnchor?.observed?.temperature?undefined:observedTemperature,observedAt,applyOperationalRadar:nearNow})'
])need(event,token,'Eventpfad derselben Endstufe');
for(const token of ['displayHours','displayMinutes15','Keine doppelte Assimilation','Events und Aktivitäten'])need(contract,token,'Forecast-Konsistenzvertrag');
need(hyperlocal,'MID_FORECAST_CONSISTENCY_CONTRACT.md','Hyperlokalvertrag verweist auf Forecastvertrag');
need(source,'MID_FORECAST_CONSISTENCY_CONTRACT.md','Source-of-Truth bindet Forecastvertrag ein');
const test='scripts/test-forecast-consistency-contract-095326.mjs';
assert.ok(Array.isArray(baseline.requiredRegressionTests)&&baseline.requiredRegressionTests.includes(test),'Required Regression fehlt in MID_BASELINE.json.');
console.log('Forecast-Konsistenzvertrag v0.9.53.26 geprüft: Hyperlokal/Nowcast wirken über kanonische Stunden und finalisierte 15-Minuten-Daten app-weit; sichtbare Forecast-Module führen keinen separaten Rohdaten-Blend mehr aus.');
