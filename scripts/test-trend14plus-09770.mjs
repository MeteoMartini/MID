import fs from 'node:fs';
import path from 'node:path';

const source=fs.readFileSync(path.join(process.cwd(),'src','SubseasonalTrendPanel.tsx'),'utf8');
const foundation=fs.readFileSync(path.join(process.cwd(),'src','styles-src','00-foundation.css'),'utf8');
const features=fs.readFileSync(path.join(process.cwd(),'src','styles-src','10-features.css'),'utf8');

const checks=[
  ['trend panel title',source.includes('Tag 15–46 · Wochenentwicklung')],
  ['week blocks start at day 15',source.includes('for(let start=14;start<time.length;start+=7)')],
  ['ecmwf seasonal endpoint',source.includes("const SEASONAL_ENDPOINT='https://seasonal-api.open-meteo.com/v1/seasonal'")],
  ['ecmwf model explicit',source.includes("models:'ecmwf_ec46'")],
  ['ecmwf exposes 51 members',source.includes("'ECMWF EC46',51,46")],
  ['gefs ensemble endpoint',source.includes("const ENSEMBLE_ENDPOINT='https://ensemble-api.open-meteo.com/v1/ensemble'")],
  ['gefs 0.5 degree model key',source.includes("models:'ncep_gefs05'")],
  ['gefs exposes 31 members',source.includes("'NOAA GEFS',31,35")],
  ['wind unit forced to knots for consistency',source.includes("wind_speed_unit:'kn'")],
  ['tmax metric requested',source.includes("api:'temperature_2m_max'")],
  ['tmin metric requested',source.includes("api:'temperature_2m_min'")],
  ['gust metric is absent from subseasonal source',!source.includes('wind_gusts_10m_mean')&&!source.includes('Böen')&&!source.includes("'gust'")],
  ['temperature chart combines tmax and tmin',source.includes('const TEMPERATURE_SERIES')&&source.includes("label:'Tmax'")&&source.includes("label:'Tmin'")],
  ['historical climatology endpoint',source.includes("const CLIMATE_ENDPOINT='https://archive-api.open-meteo.com/v1/archive'")],
  ['ERA5 seamless climatology period and fallback',source.includes("start_date:'1991-01-01'")&&source.includes("end_date:'2020-12-31'")&&source.includes("'era5_seamless'")&&source.includes("'era5_land'")&&source.includes("'era5'")],
  ['climate covers every displayed raw metric',source.includes('const CLIMATE_DAILY_VARIABLES=[...DAILY_VARIABLES]')],
  ['climate cache is separate and long-lived',source.includes("CLIMATE_CACHE_PREFIX='mid:subseasonal-climatology:1991-2020:v3'")&&source.includes('CLIMATE_MAX_AGE_MS=180*86400000')],
  ['default metric resolves to temperature',source.includes("return 'temperature';")&&source.includes("catch{return 'temperature';}")],
  ['last selected metric is persisted',source.includes("localStorage.setItem('mid:subseasonal-trend:metric',metric)")],
  ['equal-weight multi-model resampling retained',source.includes('contributors.flatMap(samples=>resample(samples))')],
  ['point tooltip hit areas present',source.includes('subseasonal-point-hit')],
  ['point tooltip content present',source.includes('className="subseasonal-point-tooltip"')],
  ['tooltip separates core and outer spread',source.includes('P25–P75')&&source.includes('P10–P90')&&source.includes('subseasonal-tooltip-series')],
  ['spread legend differentiates outer and inner bands',source.includes('outer-spread')&&source.includes('inner-spread')],
  ['tmin uncertainty uses Tmin series color',source.includes("color:'var(--param-temperature-min)'")],
  ['tmax/tmin climate colors match 14d contract',source.includes("climateColor:'var(--param-temperature-max-climate)'")&&source.includes("climateColor:'var(--param-temperature-min-climate)'" )],
  ['scalar climate line uses parameter color',features.includes('stroke:color-mix(in srgb,var(--trend-color) 72%,var(--muted))')],
  ['ec46-only tail-period note present',source.includes('Ab Tag 36 steht derzeit nur EC46 zur Verfügung')],
  ['model metadata api present',source.includes("MODEL_METADATA_BASE='https://api.open-meteo.com/data'")&&source.includes("fetchModelMetadata('ecmwf_ec46'")&&source.includes("fetchModelMetadata('ncep_gefs05'")],
  ['real model run initialisation shown in model pills without redundant header',!source.includes('<b>Modellstand:</b>')&&source.includes('runInitialisationTime')&&source.includes('Lauf ${formatModelRun(model.runInitialisationTime)} UTC')],
  ['fetch time is labelled separately from model run',source.includes('Datenabruf {formatDateTime(data.fetchedAt)} UTC')],
  ['dark theme parameter colors are concrete values',!foundation.includes('--param-precipitation:var(--param-precipitation)')&&!foundation.includes('--param-wind:var(--param-wind)')&&!foundation.includes('--param-gust:var(--param-gust)')],
  ['comparison list label reflects metric',source.includes('<h4>{def.label} je Wochenblock</h4>')]
];

const failed=checks.filter(([,ok])=>!ok);
if(failed.length){
  console.error('Trend 14d+ regression failed:');
  failed.forEach(([label])=>console.error(` - ${label}`));
  process.exit(1);
}
console.log('Trend 14d+ regression passed with',checks.length,'checks.');
