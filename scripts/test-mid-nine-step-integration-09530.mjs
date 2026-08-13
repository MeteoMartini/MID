import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,planner,eventCenter,mountain,water,weather,synoptic,worker,styles,env,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/synoptic.ts',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../.env.example',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);
const versionParts=String(packageJson.version).split('.').map(Number);
assert.ok((versionParts[0]??0)>0||(versionParts[1]??0)>9||(versionParts[1]===9&&(versionParts[2]??0)>=53),'Die Neun-Schritt-Regression gilt ab v0.9.53.0.');
assert.equal(baselineJson.releaseVersion,packageJson.version);

// I – Event Center: persistente automatische Aktualisierung + manueller Reload.
for(const token of [
 "export const EVENT_CENTER_REFRESH_EVENT='mid:event-center-refresh'",
 "export const EVENT_CENTER_REFRESH_DONE_EVENT='mid:event-center-refresh-done'"
])assert.ok(eventCenter.includes(token),`Event-Center Refresh-Vertrag fehlt: ${token}`);
for(const token of [
 'className="secondary event-center-header-reload"',
 'EVENT_CENTER_REFRESH_EVENT',
 'EVENT_CENTER_REFRESH_DONE_EVENT',
 "title=\"Gespeicherte Events jetzt mit den aktuellen Wetterdaten neu berechnen\""
])assert.ok(app.includes(token),`Glocken-Reload fehlt: ${token}`);
for(const token of [
 'const AUTO_REFRESH_MS=30*60*1000',
 "window.addEventListener(EVENT_CENTER_REFRESH_EVENT,request)",
 "document.addEventListener('visibilitychange',resume)",
 "window.addEventListener('focus',resume)",
 "window.setInterval(()=>{if(document.visibilityState!=='hidden')void refresh('auto')},AUTO_REFRESH_MS)"
])assert.ok(planner.includes(token),`Automatische Event-Aktualisierung fehlt: ${token}`);

// II – DWD-Schneefallgrenze aus 850-hPa-Temperatur + tatsächlichem Geopotential.
for(const token of [
 'DWD_SNOWFALL_LIMIT_GRADIENT_K_PER_100M=.65',
 'DWD_SNOWFALL_LIMIT_TEMPERATURE_C=2',
 'z850+(t850-DWD_SNOWFALL_LIMIT_TEMPERATURE_C)/gradient',
 "'temperature_850hPa'",
 "'geopotential_height_850hPa'",
 'temperature_850hPa_spread',
 'geopotential_height_850hPa_spread'
])assert.ok(mountain.includes(token),`DWD-Schneefallgrenzen-Vertrag fehlt: ${token}`);
assert.ok(app.includes('dwdSnowfallLimit({temperature850,geopotentialHeight850:height850,freezingLevelHeight:freezing})'),'Bergwetter nutzt den DWD-Algorithmus nicht in der Matrix.');

// III – fachlich verständliche Gezeitenbezeichnungen.
assert.ok(water.includes("event.kind==='high'?'Flut':'Ebbe'"),'Gezeiten heißen nicht Flut/Ebbe.');
assert.ok(!/Hochpunkt|Tiefpunkt/.test(water),'Alte Gezeitenbegriffe sind noch sichtbar.');

// IV – Event-PoP kompakt, Niederschlagsart statt Textpräfix.
assert.ok(planner.includes('function EventSummaryPrecipitationIcon'),'Niederschlagsart-Symbol im Eventplaner fehlt.');
for(const token of ['<Snowflake size={size}/>','<CloudLightning size={size}/>','<CloudRain size={size}/>'])assert.ok(planner.includes(token),`Event-Niederschlagssymbol fehlt: ${token}`);
assert.ok(planner.includes('<small>Niederschlag</small><strong><span className="event-precip-detail-symbol"'),'Detail-PoP nutzt das Niederschlagssymbol nicht.');
assert.ok(!planner.includes('· Zeitraum {formatNumber(eventPrecipProbability(plan.summary))} %'),'Das zusätzliche Wort „Zeitraum“ darf nicht mehr sichtbar sein.');

// V – nicht-dynamische Hyperlokal-Erklärung liegt hinter der appweiten Info-Komponente.
for(const token of [
 'label="Hyperlokale Analyse erklären"',
 'const stationDynamicStatus=',
 'className="hyperlocal-analysis-compact"',
 '<b>Modellhintergrund:</b> {st.backgroundModel}',
 'In der Hauptkarte bleibt davon nur eine kompakte Ergebniszeile sichtbar'
])assert.ok(app.includes(token),`Hyperlokale Ergebnis-/Info-Struktur fehlt: ${token}`);
assert.ok(styles.includes('.hyperlocal-analysis-compact{display:flex!important'),'Kompakte Hyperlokal-Ergebniszeile fehlt.');
assert.ok(styles.includes('.hyperlocal-analysis-info{display:grid'),'Hyperlokale Info-Darstellung fehlt.');

// VI – ICON-D2-RUC: DWD-Verfügbarkeit plus optionaler numerischer Punktadapter.
for(const token of [
 "MID_DWD_RUC_POINT_ENDPOINT",
 "MID_DWD_RUC_POINT_TOKEN",
 "if(model.id==='icon_d2_ruc')try{const adapted=await fetchDwdRucPointAdapter",
 "provider:'DWD ICON-D2-RUC · Punktadapter'"
])assert.ok(worker.includes(token),`ICON-D2-RUC Punktpfad fehlt: ${token}`);
assert.ok(weather.includes('wegen seines nativen Dreiecksgitters eine Verfügbarkeitsquelle'),'RUC-Einschränkung wird nicht transparent erklärt.');
assert.ok(env.includes('MID_DWD_RUC_POINT_ENDPOINT'),'RUC-Adapter ist in .env.example nicht dokumentiert.');

// VII – CLMS LCM10 direkt über CDSE Statistical API.
for(const token of [
 "const CDSE_TOKEN_URL='https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'",
 "const CDSE_STATS_URL='https://sh.dataspace.copernicus.eu/statistics/v1'",
 "const CLMS_LCM10_COLLECTION='828f6b20-8ffd-48f8-a1da-fefd271456db'",
 "type:`byoc-${CLMS_LCM10_COLLECTION}`",
 'bands:["LCM10","dataMask"]',
 "'Copernicus CLMS / CDSE':clmsConfigured(env)"
])assert.ok(worker.includes(token),`CLMS/CDSE-Pfad fehlt: ${token}`);
for(const token of ['MID_CDSE_CLIENT_ID','MID_CDSE_CLIENT_SECRET','MID_CLMS_LCM_YEAR=2020'])assert.ok(env.includes(token),`CLMS-Konfiguration fehlt: ${token}`);

// VIII – echte richtungsabhängige Exposition statt statischer Lageklasse.
for(const token of [
 'const TERRAIN_EXPOSURE_BEARINGS=[0,45,90,135,180,225,270,315]',
 'bearingOffsetPoint(p.lat,p.lon,bearing,700)',
 'bearingOffsetPoint(p.lat,p.lon,bearing,2200)',
 'function directionalTerrainExposure(',
 'function dynamicExposureWindCorrection(',
 'morphology.targetWindDirection=target.windDirection',
 "analysisMethod:morphology?'Modellgestützte lokale Restfeldanalyse · strömungsrichtungsabhängige DEM-/Oberflächenexposition'"
])assert.ok(weather.includes(token),`Dynamische Expositionskorrektur fehlt: ${token}`);

// IX – DWD-Synoptiktexte dienen kontrolliert als Fachvokabular, nicht als kopierter Wetterbericht.
for(const token of [
 'DWD_SYNOPTIC_TEXT_PRODUCTS',
 'SXDL31_DWAV_LATEST',
 'SXDL33_DWAV_LATEST',
 'function dwdSynopticTerms(text)',
 'async function dwdSynopticVocabulary()',
 'MID übernimmt daraus ausschließlich kontrolliertes meteorologisches Vokabular, keine Textpassagen.'
])assert.ok(worker.includes(token),`DWD-Synoptikvokabular fehlt: ${token}`);
for(const token of ['DwdSynopticVocabulary','function dwdSynopticFrame(','DWD-Synoptikrahmen:','DWD-Fachrahmen:'])assert.ok(synoptic.includes(token),`DWD-Fachvokabular fehlt im Frontend: ${token}`);

console.log(`MID v${packageJson.version}: alle neun Integrationsschritte gegen Quellvertrag geprüft.`);
