import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [app,panel,aviation,worker,envExample]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventAviation.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../.env.example',import.meta.url),'utf8')
]);

assert.match(app,/Wind size=\{11\}\/?>\{wind\(summary\.windMax[\s\S]{0,90}· G \{wind\(summary\.gustMax/,'Event-Center muss Böen kompakt mit G statt B kennzeichnen.');
assert.doesNotMatch(app,/event-center-header-metrics[\s\S]{0,500}· B \{wind\(summary\.gustMax/,'Veraltete Böen-Abkürzung B ist im Event-Center noch aktiv.');
assert.match(panel,/eventMetricLine[\s\S]{0,450}· G \${wind\(plan\.summary\.gustMax/,'Kompakte Eventübersicht muss Böen mit G kennzeichnen.');
assert.match(panel,/event-guide-quickstats[\s\S]{0,450}· G \{wind\(plan\.summary\.gustMax/,'Kompakte Aktivitätsübersicht muss Böen mit G kennzeichnen.');

assert.match(aviation,/fetchWorkerJson<OfficialResponse>\('aviation-hazards'/,'Amtliche Flugwetter-Hazards sind im Eventplaner nicht über den Worker angebunden.');
for(const hazard of ['mountain-wave','freezing-rain','volcanic-ash','tropical-cyclone','dust-sand','radiological','llws'])assert.match(aviation,new RegExp(hazard),`Erweiterter Flugwetter-Hazard fehlt: ${hazard}`);
assert.match(aviation,/officialSignalCount/,'Amtliche Flugwetter-Signale werden nicht im Ergebnisvertrag geführt.');
assert.match(aviation,/mergeOfficial/,'Amtliche Signale werden nicht mit der MID-Diagnose fusioniert.');

for(const token of [
 "const AWC_DATA_API='https://aviationweather.gov/api/data/'",
 "const WIFS_API='https://aviationweather.gov/wifs/api/'",
 "source==='metar'",
 "aviationAwcSource('isigmet'",
 "aviationAwcSource('taf'",
 "aviationAwcSource('pirep'",
 "aviationAwcSource('gairmet'",
 "aviationAwcSource('cwa'",
 "aviationAwcSource('tcf'",
 "'kkci_iwxxm_forecasts'",
 "'egrr_iwxxm_forecasts'",
 "MID_WIFS_API_KEY",
 "'X-API-Key':key",
 "MID_KNMI_API_KEY",
 "datasets/${dataset}/versions/1.0/files",
 "mode==='aviation-hazards'",
 "'official-aviation-hazards'",
 "'wafs-sigwx'"
])assert.ok(worker.includes(token),`Amtliche Flugwetterquelle/Route fehlt: ${token}`);
assert.match(worker,/ICAO SIGMET \(nationale MWO\)/,'Nationale Meteorological Watch Offices sind in der SIGMET-Quelle nicht transparent gekennzeichnet.');
assert.match(worker,/WAFS SIGWX · WAFC London\/Washington/,'WAFS-SIGWX-Quelle beider WAFC fehlt.');
assert.match(worker,/iwxxmGeometryRelevant/,'WAFS-SIGWX muss Polygon- und Punktgeometrien standortbezogen auswerten.');
assert.match(worker,/aviationHazardKinds\(window\)/,'IWXXM-Hazardkennungen in XML-/xlink-Attributen dürfen beim SIGWX-Parsing nicht verloren gehen.');
assert.match(worker,/KNMI · AIRMET Amsterdam FIR/,'Direkter nationaler Open-Data-AIRMET-Pfad fehlt.');
assert.match(worker,/KNMI · SIGMET Amsterdam FIR/,'Direkter nationaler Open-Data-SIGMET-Pfad fehlt.');
assert.match(worker,/source==='taf'&&Array\.isArray\(properties\?\.fcsts\)/,'TAF-Hazards müssen zeitfenstergenau aus den dekodierten Forecast-Gruppen gelesen werden.');
assert.match(worker,/wgst/,'METAR/TAF-Böen werden nicht als amtliches Hazard-Signal ausgewertet.');
assert.match(worker,/aviationCeilingFt/,'METAR/TAF-Ceiling wird nicht amtlich ausgewertet.');
assert.match(aviation,/officialOnlySummary/,'Amtliche Hazards müssen auch ohne Druckniveau-Profil sichtbar bleiben.');

assert.match(panel,/Quellen & Priorität/,'Quellenhierarchie fehlt hinter dem Flugwetter-Info-Button.');
assert.match(panel,/ICAO-SIGMET und TAF/,'ICAO-Quellen werden im Info-Popover nicht erklärt.');
assert.match(panel,/WAFS-SIGWX-Daten von WAFC London und WAFC Washington/,'WAFC-SIGWX wird im Info-Popover nicht erklärt.');
assert.match(panel,/Datenbasis der Significant-Weather-Charts/,'Bezug zu den WAFC Significant-Weather-Charts fehlt.');
assert.match(panel,/KNMI AIRMET\/SIGMET/,'Direkte nationale Open-Data-Flugwetterquelle fehlt im Info-Popover.');
assert.match(panel,/nicht zur Weiterverarbeitung freigegebene nationale SWC/,'Zugangsbeschränkte nationale SWC-Produkte werden nicht sauber abgegrenzt.');
assert.match(panel,/event-flight-source-list/,'Quellenstatus fehlt hinter dem Info-Button.');

assert.match(envExample,/MID_WIFS_API_KEY/,'WIFS-Worker-Secret ist in der Beispielkonfiguration nicht dokumentiert.');
assert.match(envExample,/MID_KNMI_API_KEY/,'KNMI-Worker-Secret ist in der Beispielkonfiguration nicht dokumentiert.');

console.log('MID v0.9.46.0: G-Böenabkürzung, amtliche ICAO-/AWC-Hazards, WAFS-SIGWX beider WAFC sowie nationale KNMI-AIRMET-/SIGMET-Pfade geprüft.');
