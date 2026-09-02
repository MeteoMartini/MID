import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [core,composite,worker,baseline]=await Promise.all([
  readFile(new URL('worker-src/00-core-observations.js',root),'utf8'),
  readFile(new URL('worker-src/20-composite-models.js',root),'utf8'),
  readFile(new URL('worker/metar-proxy.js',root),'utf8'),
  readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse)
]);

assert.ok(baseline.requiredRegressionTests?.includes('scripts/test-openmeteo-rapid-source-contract-097713.mjs'),'Open-Meteo-Rapid-Quellenvertrag fehlt im Baseline-Gate.');

// Der generische Best-Match-Pfad muss die native/abgeleitete 15-min-Zeitreihe anfordern.
assert.ok(core.includes("const CORE_FORECAST_MINUTELY='precipitation_probability,precipitation,rain,showers,snowfall,weather_code,sunshine_duration'"),'Kanonische Best-Match-15-min-Reihe fehlt.');
assert.ok(core.includes("forecast_minutely_15:'24'"),'Kanonischer Open-Meteo-Core fordert kein 15-min-Kurzfristfenster an.');
assert.ok(core.includes("models:'best_match'"),'Kanonischer Open-Meteo-Core nutzt Best Match nicht.');

// ICON-D2-RUC ist kein Open-Meteo-Modell: ausschließlich eigener DWD-Adapter.
assert.match(core,/\{id:'icon_d2_ruc',apiIds:\[\],label:'DWD ICON-D2-RUC'.*directOnly:true\}/s);
assert.ok(core.includes("if(model.id==='icon_d2_ruc'){try{const adapted=await fetchDwdRucPointAdapter"),'DWD-RUC wird nicht zuerst/direkt über den MID-Adapter geladen.');
assert.ok(core.includes("batchModels=models.filter(model=>!model.directOnly&&!model.optionalCapability)"),'Direkte RUC-Quelle wird nicht aus Open-Meteo-Multimodellrequests ausgeschlossen.');
assert.ok(core.includes("if(model.directOnly){const initMs=Date.parse"),'Direkter RUC-Freshnesspfad fehlt.');
assert.doesNotMatch(core,/apiIds:\['icon_d2_ruc','dwd_icon_d2_ruc'\]/,'Nicht existente Open-Meteo-RUC-IDs sind noch im Forecast-Fusion-Katalog aktiv.');

// Räumliche 15-min-Regionalmodelle: nur tatsächlich von Open-Meteo bereitgestellte Quellen.
assert.doesNotMatch(composite,/\{id:'icon-d2-ruc'.*apiIds:/s,'Radar-Phasenraster probiert weiterhin einen nicht verfügbaren Open-Meteo-ICON-D2-RUC.');
assert.ok(composite.includes("apiIds:['meteofrance_arome_france_hd_15min']"),'AROME HD 15-min fehlt.');
assert.ok(composite.includes("apiIds:['meteofrance_arome_france_15min']"),'AROME 15-min fehlt.');
assert.ok(composite.includes("apiIds:['ncep_hrrr_conus_15min','ncep_hrrr_conus']"),'HRRR 15-min mit stündlichem Rapid-Refresh fehlt.');
assert.ok(composite.includes("metaIds:['dwd_icon_d2_15min','dwd_icon_d2','icon_d2']"),'ICON-D2-15-min-Metadatenquelle fehlt.');
assert.ok(composite.includes("label:'DWD ICON-D2 15 min (Open-Meteo)'"),'ICON-D2-15-min-Quelle ist nicht eindeutig als Open-Meteo-Regionalfallback benannt.');
assert.match(composite,/\{id:'icon-d2',label:'DWD ICON-D2 15 min \(Open-Meteo\)'.*rapidUpdate:false.*native15:true/s,'Open-Meteo ICON-D2 wird fälschlich als stündlicher Rapid Update Cycle klassifiziert.');

// Aggregat muss exakt dieselben Verträge enthalten.
for(const token of ["apiIds:[],label:'DWD ICON-D2-RUC'","ncep_hrrr_conus_15min","dwd_icon_d2_15min","DWD ICON-D2 15 min (Open-Meteo)"])assert.ok(worker.includes(token),`Worker-Aggregat fehlt: ${token}`);

console.log('Open-Meteo-Rapid-Quellenvertrag geprüft: Best Match minutely15, HRRR/AROME Rapid, ICON-D2 15 min 3-stündlich und DWD ICON-D2-RUC strikt direkt getrennt.');
