import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [helper,dwd,hymec,opera,radolan,px,hx,ventilation,verification,pwa,connected,openMeteo,travel,eventAviation,seasonal,weatherSearch,weatherSpecialized,baselineRaw]=await Promise.all([
 'src/fetchDeadline.ts','src/DwdPrecipitationTypeRadar.tsx','src/HymecNgSource.ts','src/OperaRasterSource.ts','src/RadolanRasterSource.ts','src/Px250Overlay.tsx','src/HxRadarPointSource.ts','src/ventilationAssistant.ts','src/forecastVerification.ts','src/pwa.ts','src/connectedStation.ts','src/openMeteoGuard.ts','src/travelPlanner.ts','src/eventAviation.ts','src/seasonalForecast.ts','src/weather-src/00-types-models-search.tsfrag','src/weather-src/10-observations-specialized.tsfrag','MID_BASELINE.json'
].map(read));
const baseline=JSON.parse(baselineRaw),test='scripts/test-network-timeout-cache-audit-098415.mjs';
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),`${test} fehlt in requiredFiles.`);
for(const token of ['new AbortController()','parent?.addEventListener','globalThis.setTimeout','globalThis.clearTimeout','return await fetch(input'])assert.ok(helper.includes(token),`Gemeinsame Fetch-Zeitgrenze unvollständig: ${token}`);
assert.ok(dwd.includes("fetchWithDeadline(url,{cache:'no-store',signal:controller.signal},12000")&&dwd.includes('controller.abort()'),'DWD-Niederschlagsartbild besitzt keine abbrechbare Zeitgrenze.');
assert.ok(hymec.includes("fetchWithDeadline(key,{cache:'no-store'},14000")&&hymec.includes('HYMEC_RASTER_CACHE_LIMIT=3')&&hymec.includes('while(rasterCache.size>HYMEC_RASTER_CACHE_LIMIT)'),'HymecNG-Raster kann weiter hängen oder unbegrenzt im Speicher wachsen.');
assert.ok(opera.includes("fetchWithDeadline(url,{cache:'force-cache'},14000"),'OPERA-HDF5 besitzt kein Downloadbudget.');
assert.ok(radolan.includes("fetchWithDeadline(url,{cache:'force-cache'},14000"),'RADOLAN-HDF5 besitzt kein Downloadbudget.');
assert.ok(px.includes("fetchWithDeadline(meta.fileUrl,{cache:'no-store',signal:controller.signal},14000")&&px.includes('controller.abort()'),'PX250-Overlay besitzt kein abbrechbares Downloadbudget.');
assert.ok(hx.includes("fetchWithDeadline(meta.fileUrl,{cache:'force-cache',signal},14000"),'DWD-HX-Raster besitzt kein Downloadbudget.');
assert.ok(openMeteo.includes('NETWORK_ATTEMPT_TIMEOUT_MS=30_000')&&openMeteo.includes("Open-Meteo-Netzwerkanfrage hat das Zeitlimit überschritten."),'Zentrale Open-Meteo-Netzwerkanfragen besitzen keine endliche Fetch-Grenze.');
assert.ok(travel.includes("Historische Wetterdaten haben das Zeitlimit überschritten.")&&travel.includes('30000'),'Geteilte Reise-Klimaanfragen können weiterhin dauerhaft im In-Flight-Cache hängen.');
assert.ok(eventAviation.includes('EVENT_FLIGHT_CACHE_LIMIT=24')&&eventAviation.includes('rememberCache(cache,key,value,TTL)')&&eventAviation.includes('rememberCache(officialCache,key,value,OFFICIAL_TTL)'),'Event-Flugwettercaches wachsen weiterhin unbeschränkt.');
assert.ok(seasonal.includes('SEASONAL_MEMORY_CACHE_LIMIT=12')&&seasonal.includes('rememberSeasonalMemory'),'Saisonprognose-Memorycache wächst weiterhin unbeschränkt.');
assert.ok(weatherSearch.includes("fetchWithDeadline(url,{signal,cache:'no-store'},12000,'Externer Wetterdatenabruf hat das Zeitlimit überschritten.')")&&weatherSearch.includes("EEA-Messstationsabruf hat das Zeitlimit überschritten."),'Externe Geocoding-/Beobachtungsdienste können weiterhin unbegrenzt warten.');
assert.ok(weatherSpecialized.includes('TERRAIN_MORPHOLOGY_MEMORY_LIMIT=80')&&weatherSpecialized.includes('while(terrainMorphologyCache.size>TERRAIN_MORPHOLOGY_MEMORY_LIMIT)'),'Terrain-Morphologiecache wächst weiterhin unbeschränkt.');
assert.ok(ventilation.includes('deadline=Date.now()+9000')&&ventilation.includes("'ventilation-advice'")&&ventilation.includes('},signal);'),'Lüftungsassistent reicht Abbruch/Gesamtbudget nicht bis zum Workerpfad durch.');
assert.ok(verification.includes("fetchWithDeadline(url,{signal,cache:'no-store'")&&verification.includes("8000,'Privater Sensor hat das Zeitlimit überschritten.'"),'Privater Wetterzwilling-Sensor kann unbegrenzt warten.');
assert.ok(pwa.includes('SERVICE_WORKER_UPDATE_TIMEOUT_MS=6500')&&pwa.includes('registrationUpdateWithBudget(registration)')&&!pwa.includes('await registration.update().catch'),'PWA-Registrierungscheck kann weiterhin unbegrenzt warten.');
assert.ok(connected.includes("field(payload,'rainRate','precipitationRate'")&&connected.includes("precipitationRate!==undefined?60:undefined")&&!connected.includes("'rainIncrement','rainRate'"),'Standard-JSON verwechselt Niederschlagsrate wieder mit einer Intervallakkumulation.');
console.log('MID Netzwerk-/Cache-Audit: direkte Radar-/Sensorpfade, Lüftung, PWA-Update und HymecNG-Cache sind begrenzt.');
