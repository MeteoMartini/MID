import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [weather,eventEngine,eventCenter,twin,app,settings,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastVerification.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherTwinSettings.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);
assert.equal(packageJson.version,baselineJson.releaseVersion,'Releaseversion und Baseline müssen übereinstimmen.');
const [major,minor,feature]=packageJson.version.split('.').map(Number);
assert.ok(major>0||minor>9||(minor===9&&feature>=49),'Event-PoP-/Wetterzwilling-Funktionsstand darf nicht vor v0.9.49 liegen.');

for(const token of [
 'export async function eventEnsembleForecast(',
 'eventMemberPrecipitationTotals(',
 'DWD_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true',
 'DWD_SIGNIFICANT_PRECIPITATION_PROBABILITY_THRESHOLD_MM,true',
 'groupCounts.get(row.model.independenceGroup)',
 "modelDayWeight(row.model,lead,row.totals.length,'precipitation',freshness(row.model))/divisor",
 'representativeResultsForDate',
 'effectiveModelFreshness',
 "source:'ensemble-members-dwd-event'"
])assert.ok(weather.includes(token),`Event-Ensemble-PoP fehlt: ${token}`);

for(const token of [
 'eventEnsembleForecast(location.latitude,location.longitude,eventDate,eventStartTime,eventEndTime,signal,forceFresh)',
 'precipitationProbabilityRelevant=eventProbability?.probability??windowAverageProbability',
 "precipitationProbabilitySource:eventProbability?'ensemble-members-dwd-event':'hourly-window-average-fallback'",
 'applyEnsembleDailyPrecipitationProbability(twinEligible?localTwinDays:fusedDays,ensembleDays)',
 'buildForecastVerificationReport(locationKey,fusedDays,ensembleDays,location,baseHours)',
 'applyLocalTwinHours(locationKey,finalHours,fusedDays,localTwinDays)',
 'finalizeForecastHours(finalHours,displayBaseDays',
 'Event-Niederschlagswahrscheinlichkeit ${eventStartTime}–${eventEndTime}',
 'durationMinutes:Math.max(1,Math.round((overlapEnd-overlapStart)/60000))',
 'zeitgewichtetes Stundenmittel'
])assert.ok(eventEngine.includes(token),`Event-Engine-Konsistenz fehlt: ${token}`);

assert.ok(eventCenter.includes("precipitationProbabilitySource?:'ensemble-members-dwd-event'|'hourly-window-average-fallback'"),'EventSummary speichert die Herkunft der Zeitraum-PoP nicht.');
assert.ok(eventCenter.includes('weatherTwinApplied?:boolean'),'EventSummary dokumentiert die Wetterzwilling-Anwendung nicht.');

assert.ok(!twin.includes('applyOperationalNowcastHours(locallyAdjusted,radar)'),'Wetterzwilling darf Radar nicht separat und damit doppelt anwenden.');
assert.ok(twin.includes('settings.nowcastAssimilation&&radar'),'Radar-Schalter steuert nicht mehr die Aufnahme in den Wetterzwilling-Lernkreis.');
assert.ok(twin.includes('return locallyAdjusted;'),'Wetterzwilling-Stundenkorrektur endet nicht vor der gemeinsamen MID-Endstufe.');
assert.ok(app.includes('finalizeForecastHours(twinHours,baseDisplayDays,{radar:radarAnalysis,thunder:thunderAnalysis,observedTemperature:finalizationObservedTemperature,observedAt:finalizationObservedAt})'),'Ortsprognose führt Wetterzwilling nicht durch dieselbe zentrale Endstufe einschließlich zeitgenauer Current-Beobachtung.');
assert.ok(settings.includes('Radar-/Nowcast im Lernkreis'),'Wetterzwilling-Einstellung erklärt die neue zentrale Nowcast-Architektur nicht.');

console.log(`MID v${packageJson.version}: Event-Zeitraum-PoP und Wetterzwilling-Endstufe appweit konsistent geprüft.`);
