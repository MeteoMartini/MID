import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [travel,panel,eventPanel,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/travelPlanner.ts','utf8'),
 readFile('src/TravelPlannerPanel.tsx','utf8'),
 readFile('src/EventPlannerPanel.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

assert.ok(travel.includes("const WATER_CACHE_PREFIX='mid:travel-water-climate:1991-2020:v4:'"),'Alte negative SST-Caches werden nicht invalidiert.');
assert.ok(travel.includes('WATER_REFERENCE_YEARS=[1991,1995,1999,2003,2007,2011,2015,2020]'),'Referenzjahre für kompakte SST-Klimastichprobe fehlen.');
assert.ok(travel.includes("hourly:'sea_surface_temperature'")&&travel.includes("cell_selection:'sea'")&&travel.includes("models:'era5_ocean'"),'Historische ERA5-Ocean-SST-/Meeresgitterquelle fehlt.');
assert.ok(panel.includes('let initialWater:TravelWaterInfo|null=null;try{initialWater=await fetchTravelWaterClimatology(destination,windows[0].start,windows[0].end,controller.signal)'),'Erste Reiseauswertung versucht die Wassertemperatur weiterhin vor dem Ergebnisrendering zu laden.');
assert.ok(panel.includes('Wassertemperatur')&&panel.includes('klimatologisches Mittel für den Reisezeitraum'),'Wassertemperatur-Metrik fehlt im Reiseergebnis.');

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
console.log(`MID v${pkg.version}: Reise-SST sichtbar vor Ergebnisrendering; Event-Center kompakt, Mehrstunden-Sonne in h und Stundenverlauf in min.`);
