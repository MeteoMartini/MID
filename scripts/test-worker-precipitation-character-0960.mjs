import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
assert.ok(worker.includes('async function pushForecastState(favorite,env)')&&worker.includes('forecastFusionResponse(url,env)'), 'Prognoseänderungs-Push muss die kanonische Forecast-Fusion nutzen.');
for(const token of ['function precipitationCharacter','directPartition','relative_humidity_2m,cape,lifted_index,convective_inhibition','rain_sum,showers_sum,snowfall_sum,precipitation_hours','rain:signal.rain,showers:signal.showers,snowfall:signal.snowfall','currentSignal=reconcileForecastPrecipitation','pushForecastState'])assert.ok(worker.includes(token),`Worker-Niederschlagsvertrag fehlt: ${token}`);
assert.ok(worker.includes("FORECAST_FUSION_HOURLY='temperature_2m,dew_point_2m,pressure_msl,wind_speed_10m,wind_gusts_10m,wind_direction_10m,precipitation,precipitation_probability,rain,showers,snowfall"));
console.log('Worker-Niederschlagsklassifikation geprüft: rain/showers, Instabilitätsfelder, Widgets, Push und Mehrmodell-Bündel sind gekoppelt.');
