const failures=[],checks=[];
async function jsonCheck(name,url,validate){
 try{const response=await fetch(url,{headers:{Accept:'application/json'}}),payload=await response.json().catch(()=>null);checks.push({name,status:response.status,ok:response.ok});if(!response.ok||!validate(payload))failures.push(`${name}: Vertrag ungültig (HTTP ${response.status})`)}
 catch(error){failures.push(`${name}: ${error instanceof Error?error.message:String(error)}`)}
}
function finiteSeries(payload,key,minCount=6){const values=payload?.hourly?.[key];return Array.isArray(values)&&values.filter(value=>Number.isFinite(Number(value))).length>=minCount}
function rangeSeries(payload,key,min,max){const values=payload?.hourly?.[key];if(!Array.isArray(values))return false;const finite=values.map(Number).filter(Number.isFinite);return finite.length>=6&&finite.every(value=>value>=min&&value<=max)}

const base=new URLSearchParams({latitude:'50.815',longitude:'7.037',timezone:'auto',forecast_days:'3',models:'best_match',wind_speed_unit:'kn',hourly:'temperature_2m,precipitation_probability,weather_code,wind_speed_10m,wind_direction_10m',daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,moonrise,moonset,moon_phase'});
await jsonCheck('Open-Meteo Best Match + Mond',`https://api.open-meteo.com/v1/forecast?${base}`,payload=>Array.isArray(payload?.hourly?.time)&&Array.isArray(payload?.daily?.moon_phase));

const aifs=new URLSearchParams({latitude:'50.815',longitude:'7.037',timezone:'auto',forecast_days:'2',models:'ecmwf_aifs_europe_ensemble',hourly:'precipitation,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high'});
await jsonCheck('ECMWF AIFS Europe Ensemble',`https://ensemble-api.open-meteo.com/v1/ensemble?${aifs}`,payload=>rangeSeries(payload,'cloud_cover',0,100)&&rangeSeries(payload,'cloud_cover_low',0,100)&&rangeSeries(payload,'cloud_cover_mid',0,100)&&rangeSeries(payload,'cloud_cover_high',0,100)&&rangeSeries(payload,'precipitation',0,500));

for(const model of ['meteofrance_arome_france','meteofrance_seamless','meteofrance_arpege_europe']){const query=new URLSearchParams({latitude:'48.8566',longitude:'2.3522',timezone:'auto',forecast_days:'2',models:model,hourly:'precipitation,wind_speed_10m,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,sunshine_duration'});await jsonCheck(`Météo-France ${model}`,`https://api.open-meteo.com/v1/forecast?${query}`,payload=>finiteSeries(payload,'precipitation')&&rangeSeries(payload,'cloud_cover',0,100)&&finiteSeries(payload,'wind_speed_10m')&&finiteSeries(payload,'sunshine_duration'))}

for(const model of ['jma_msm','jma_gsm','jma_seamless']){const query=new URLSearchParams({latitude:'35.6762',longitude:'139.6503',elevation:'40',timezone:'auto',forecast_days:'2',models:model,hourly:'temperature_2m,precipitation,cloud_cover,wind_speed_10m,temperature_850hPa,relative_humidity_850hPa,wind_speed_850hPa,geopotential_height_850hPa'});await jsonCheck(`JMA ${model}`,`https://api.open-meteo.com/v1/forecast?${query}`,payload=>finiteSeries(payload,'temperature_2m')&&finiteSeries(payload,'temperature_850hPa')&&rangeSeries(payload,'cloud_cover',0,100))}

const aqi=new URLSearchParams({latitude:'50.815',longitude:'7.037',timezone:'auto',past_days:'1',forecast_days:'1',hourly:'pm10,pm2_5,european_aqi,european_aqi_pm10,european_aqi_pm2_5'});
await jsonCheck('EU-AQI stündlich',`https://air-quality-api.open-meteo.com/v1/air-quality?${aqi}`,payload=>finiteSeries(payload,'pm10')&&finiteSeries(payload,'pm2_5')&&finiteSeries(payload,'european_aqi'));

const aggregation=new URLSearchParams({latitude:'50.815',longitude:'7.037',timezone:'auto',forecast_days:'2',hourly:'temperature_2m_min,temperature_2m_max',temporal_resolution:'hourly_6'});
await jsonCheck('Hourly Min/Max Aggregation',`https://api.open-meteo.com/v1/forecast?${aggregation}`,payload=>finiteSeries(payload,'temperature_2m_min',2)&&finiteSeries(payload,'temperature_2m_max',2)&&payload.hourly.temperature_2m_min.some((value,index)=>Number(value)!==Number(payload.hourly.temperature_2m_max[index])));

if(failures.length){console.error(failures.join('\n'));process.exit(1)}console.log(`API-Vertragsprüfung bestanden (${checks.length} Prüfungen).`);
