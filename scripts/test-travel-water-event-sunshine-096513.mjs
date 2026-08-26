import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [travel,panel,eventPanel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/travelPlanner.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('src/EventPlannerPanel.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

assert.ok(travel.includes("const WATER_CACHE_PREFIX='mid:travel-water-climate:noaa-oisst-1991-2020:v5:'"),'Alte leere ERA5-Ocean-/SST-Caches werden nicht invalidiert.');
assert.ok(travel.includes("fetchWorkerJson<TravelWaterWorkerPayload>('travel-water-climate'")&&travel.includes("payload.schema!=='mid.travel-water-climate.v1'"),'NOAA-OISST-/Workervertrag fehlt.');
assert.ok(!travel.includes("models:'era5_ocean'")&&!travel.includes('MARINE_ARCHIVE_ENDPOINT'),'Nicht verfügbare ERA5-Ocean-SST ist weiterhin aktiv.');
assert.ok(panel.includes('let initialWater:TravelWaterInfo|null=null;try{initialWater=await fetchTravelWaterClimatology(destination,windows[0].start,windows[0].end,controller.signal)'),'Erste Reiseauswertung versucht die Wassertemperatur weiterhin vor dem Ergebnisrendering zu laden.');
assert.ok(panel.includes('Wassertemperatur')&&panel.includes('NOAA-OISST-Mittel für den Reisezeitraum'),'Wassertemperatur-Metrik fehlt im Reiseergebnis.');

assert.ok(eventPanel.includes("import {sunshineHoursLabel,sunshineMinutesLabel} from './sunshineDuration'"),'Sunshine-Formatter für Ereignis-/Stundenvertrag fehlen.');
assert.ok(eventPanel.includes('function eventSunshineLabel(seconds:number|null|undefined){return sunshineHoursLabel(seconds)}'),'Mehrstündige Eventsumme wird nicht in Stunden dargestellt.');
const metricStart=eventPanel.indexOf('function eventMetricLine('),metricEnd=eventPanel.indexOf('\n\nexport default function EventPlannerPanel',metricStart),metric=eventPanel.slice(metricStart,metricEnd);
assert.ok(metricStart>=0&&metricEnd>metricStart,'Kompakte Eventmetrik nicht gefunden.');
assert.ok(!metric.includes('eventSunshineLabel')&&!metric.includes('☀'),'Sonnenscheindauer wurde entgegen dem kompakten Event-Center-Vertrag in die Übersichtszeile aufgenommen.');
assert.ok(eventPanel.includes('sunshineMinutesLabel(point.sunshineDuration,point.durationMinutes??60)'),'Stündlicher Eventverlauf muss Sonnenscheindauer weiterhin in Minuten zeigen.');
assert.ok(eventPanel.includes('UVI {formatUvi(plan.summary.uvMax??Number.NaN)} · ☀ {eventSunshineLabel(plan.summary.sunshineDurationTotal)}'),'Mehrstündige Eventdetails müssen die aggregierte Sonnenscheindauer behalten.');

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-travel-water-event-sunshine-096513.mjs';
assert.equal(baseline.releaseVersion,pkg.version,'Baseline-Version nicht synchron.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: NOAA-Reise-SST sichtbar vor Ergebnisrendering; Event-Center kompakt, Mehrstunden-Sonne in h und Stundenverlauf in min.`);
